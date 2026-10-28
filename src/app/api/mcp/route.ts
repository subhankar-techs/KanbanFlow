import { createHash } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createMcpHandler, withMcpAuth } from "mcp-handler";
import type { ServerContext } from "@modelcontextprotocol/server";
import { z } from "zod";
import { uuid, safeText, priorityEnum } from "@/lib/validations";

// Service-role client bypasses RLS, so every tool checks board access itself.
// Created lazily so builds without SUPABASE_SERVICE_ROLE_KEY don't crash.
let client: SupabaseClient | undefined;
const db = () =>
  (client ??= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  ));

const dueDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

function json(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function userIdOf(ctx: ServerContext) {
  const userId = ctx.http?.authInfo?.extra?.userId;
  if (typeof userId !== "string") throw new Error("Unauthorized");
  return userId;
}

async function accessibleBoardIds(userId: string) {
  const [owned, member] = await Promise.all([
    db().from("boards").select("id").eq("owner_id", userId),
    db().from("board_members").select("board_id").eq("user_id", userId),
  ]);
  if (owned.error) throw owned.error;
  if (member.error) throw member.error;
  return new Set<string>([
    ...owned.data.map((b) => b.id),
    ...member.data.map((m) => m.board_id),
  ]);
}

async function assertBoard(userId: string, boardId: string) {
  if (!(await accessibleBoardIds(userId)).has(boardId)) throw new Error("Board not found");
}

async function getColumn(userId: string, columnId: string) {
  const { data } = await db().from("columns").select("id, board_id").eq("id", columnId).maybeSingle();
  if (!data) throw new Error("Column not found");
  await assertBoard(userId, data.board_id);
  return data as { id: string; board_id: string };
}

async function getTask(userId: string, taskId: string) {
  const { data } = await db().from("tasks").select("id, column_id").eq("id", taskId).maybeSingle();
  if (!data) throw new Error("Task not found");
  const column = await getColumn(userId, data.column_id);
  return { ...(data as { id: string; column_id: string }), board_id: column.board_id };
}

async function nextPosition(columnId: string) {
  const { data } = await db()
    .from("tasks")
    .select("position")
    .eq("column_id", columnId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? data.position + 1 : 0;
}

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "list_boards",
      { description: "List the Kanban boards the user can access." },
      async (ctx) => {
        const ids = [...(await accessibleBoardIds(userIdOf(ctx)))];
        const { data, error } = await db()
          .from("boards")
          .select("id, name, description")
          .in("id", ids)
          .order("updated_at", { ascending: false });
        if (error) throw error;
        return json(data);
      }
    );

    server.registerTool(
      "get_board",
      {
        description: "Get a board's columns and their tasks. Use this to find column_id and task_id values.",
        inputSchema: z.object({ board_id: uuid }),
      },
      async ({ board_id }, ctx) => {
        await assertBoard(userIdOf(ctx), board_id);
        const { data, error } = await db()
          .from("columns")
          .select("id, name, position, tasks(id, title, description, priority, due_date, position)")
          .eq("board_id", board_id)
          .order("position");
        if (error) throw error;
        return json(data);
      }
    );

    server.registerTool(
      "create_task",
      {
        description: "Add a task to the end of a column.",
        inputSchema: z.object({
          column_id: uuid,
          title: safeText(200).min(1),
          description: safeText(5000).optional(),
          priority: priorityEnum.optional(),
          due_date: dueDate.optional(),
        }),
      },
      async ({ column_id, title, description, priority, due_date }, ctx) => {
        const userId = userIdOf(ctx);
        await getColumn(userId, column_id);
        const { data, error } = await db()
          .from("tasks")
          .insert({
            column_id,
            title: title.trim(),
            description: description?.trim() ?? null,
            priority: priority ?? "medium",
            due_date: due_date ?? null,
            position: await nextPosition(column_id),
            created_by: userId,
          })
          .select()
          .single();
        if (error) throw error;
        return json(data);
      }
    );

    server.registerTool(
      "update_task",
      {
        description: "Edit a task's title, description, priority or due date.",
        inputSchema: z.object({
          task_id: uuid,
          title: safeText(200).min(1).optional(),
          description: safeText(5000).nullable().optional(),
          priority: priorityEnum.optional(),
          due_date: dueDate.nullable().optional(),
        }),
      },
      async ({ task_id, ...changes }, ctx) => {
        await getTask(userIdOf(ctx), task_id);
        const { data, error } = await db().from("tasks").update(changes).eq("id", task_id).select().single();
        if (error) throw error;
        return json(data);
      }
    );

    server.registerTool(
      "move_task",
      {
        description: "Move a task to the end of another column on the same board.",
        inputSchema: z.object({ task_id: uuid, column_id: uuid }),
      },
      async ({ task_id, column_id }, ctx) => {
        const userId = userIdOf(ctx);
        const task = await getTask(userId, task_id);
        const column = await getColumn(userId, column_id);
        if (column.board_id !== task.board_id) throw new Error("Column is on a different board");
        const { data, error } = await db()
          .from("tasks")
          .update({ column_id, position: await nextPosition(column_id) })
          .eq("id", task_id)
          .select()
          .single();
        if (error) throw error;
        return json(data);
      }
    );

    server.registerTool(
      "delete_task",
      {
        description: "Permanently delete a task.",
        inputSchema: z.object({ task_id: uuid }),
        annotations: { destructiveHint: true },
      },
      async ({ task_id }, ctx) => {
        await getTask(userIdOf(ctx), task_id);
        const { error } = await db().from("tasks").delete().eq("id", task_id);
        if (error) throw error;
        return json({ deleted: task_id });
      }
    );
  },
  { serverInfo: { name: "kanbanflow", version: "1.0.0" } }
);

const authHandler = withMcpAuth(
  handler,
  async (_req, token) => {
    if (!token) return undefined;
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const { data } = await db().from("api_tokens").select("user_id").eq("token_hash", tokenHash).maybeSingle();
    if (!data) return undefined;
    return { token, clientId: "kanbanflow-api-token", scopes: [], extra: { userId: data.user_id } };
  },
  { required: true }
);

export { authHandler as GET, authHandler as POST };
