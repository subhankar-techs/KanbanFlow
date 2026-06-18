import { createClient } from "@/lib/supabase/client";
import type { Board, Column as ColumnType, Label as LabelType, Task as TaskType, TaskLabel } from "@/types";
import { DEFAULT_COLUMNS } from "@/constants";
import {
  validate,
  getBoardsSchema,
  boardIdSchema,
  createBoardSchema,
  updateBoardSchema,
} from "@/lib/validations";
import { z } from "zod";

function getSupabase() { return createClient(); }

export async function getBoards(userId: string) {
  const { userId: validUserId } = validate(getBoardsSchema, { userId });

  const { data: ownedBoards, error: ownedError } = await getSupabase()
    .from("boards")
    .select("*")
    .eq("owner_id", validUserId)
    .order("updated_at", { ascending: false });

  if (ownedError) throw ownedError;

  const { data: memberEntries, error: memberError } = await getSupabase()
    .from("board_members")
    .select("board_id")
    .eq("user_id", validUserId)
    .neq("role", "owner");

  if (memberError) throw memberError;

  const memberBoardIds = (memberEntries as { board_id: string }[] | null)?.map((m) => m.board_id) ?? [];

  let memberBoards: Board[] = [];
  if (memberBoardIds.length > 0) {
    const { data, error } = await getSupabase()
      .from("boards")
      .select("*")
      .in("id", memberBoardIds)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    memberBoards = data ?? [];
  }

  const allBoards = [...(ownedBoards ?? []), ...memberBoards];
  const seen = new Set<string>();
  return allBoards.filter((b) => {
    if (seen.has(b.id)) return false;
    seen.add(b.id);
    return true;
  });
}

export async function getBoard(boardId: string) {
  const { boardId: validId } = validate(boardIdSchema, { boardId });

  const { data: board, error: boardError } = await getSupabase()
    .from("boards")
    .select("*")
    .eq("id", validId)
    .single();

  if (boardError) throw boardError;

  const boardData = board as unknown as Board;

  const [columnsResult, labelsResult] = await Promise.all([
    getSupabase()
      .from("columns")
      .select("*")
      .eq("board_id", validId)
      .order("position", { ascending: true }),
    getSupabase().from("labels").select("*").eq("board_id", validId),
  ]);

  if (columnsResult.error) throw columnsResult.error;
  if (labelsResult.error) throw labelsResult.error;

  const columns = (columnsResult.data ?? []) as unknown as ColumnType[];
  const labels = (labelsResult.data ?? []) as unknown as LabelType[];

  const columnIds = columns.map((c) => c.id);
  let tasks: TaskType[] = [];

  if (columnIds.length > 0) {
    const { data: tasksData, error: tasksError } = await getSupabase()
      .from("tasks")
      .select("*")
      .in("column_id", columnIds)
      .order("position", { ascending: true });

    if (tasksError) throw tasksError;
    tasks = (tasksData ?? []) as unknown as TaskType[];
  }

  const taskIds = tasks.map((t) => t.id);
  let taskLabels: TaskLabel[] = [];

  if (taskIds.length > 0) {
    const { data: tlData, error: tlError } = await getSupabase()
      .from("task_labels")
      .select("*")
      .in("task_id", taskIds);

    if (tlError) throw tlError;
    taskLabels = (tlData ?? []) as unknown as TaskLabel[];
  }

  const labelsMap = new Map(labels.map((l) => [l.id, l]));

  const columnsWithTasks = columns.map((col) => ({
    ...col,
    tasks: tasks
      .filter((t) => t.column_id === col.id)
      .map((t) => ({
        ...t,
        labels: taskLabels
          .filter((tl) => tl.task_id === t.id)
          .map((tl) => labelsMap.get(tl.label_id)!)
          .filter(Boolean),
      })),
  }));

  return {
    ...boardData,
    columns: columnsWithTasks,
    labels,
  };
}

export async function createBoard(data: {
  name: string;
  description?: string;
}, userId: string, userEmail?: string) {
  const validData = validate(createBoardSchema, data);
  const validUserId = validate(z.string().uuid("Invalid user ID"), userId);

  const { error: profileError } = await getSupabase()
    .from("profiles")
    .upsert(
      { id: validUserId, email: userEmail ?? "", name: "" },
      { onConflict: "id", ignoreDuplicates: true }
    );

  if (profileError) throw new Error(`Profile error: ${profileError.message}`);

  const { data: board, error } = await getSupabase()
    .from("boards")
    .insert({
      name: validData.name.trim(),
      description: validData.description?.trim() ?? null,
      owner_id: validUserId,
    })
    .select()
    .single();

  if (error) throw error;
  if (!board) throw new Error("Failed to create board");

  const boardRow = board as unknown as Board;

  const { error: memberError } = await getSupabase()
    .from("board_members")
    .insert({
      board_id: boardRow.id,
      user_id: validUserId,
      role: "owner",
    });

  if (memberError) throw memberError;

  const columnInserts = DEFAULT_COLUMNS.map((name, index) => ({
    board_id: boardRow.id,
    name,
    position: index,
  }));

  const { error: colError } = await getSupabase()
    .from("columns")
    .insert(columnInserts);

  if (colError) throw colError;

  return boardRow;
}

export async function updateBoard(
  boardId: string,
  data: { name?: string; description?: string }
) {
  const { boardId: validId } = validate(boardIdSchema, { boardId });
  const validData = validate(updateBoardSchema, data);

  const { data: board, error } = await getSupabase()
    .from("boards")
    .update(validData as never)
    .eq("id", validId)
    .select()
    .single();

  if (error) throw error;
  return board;
}

export async function deleteBoard(boardId: string) {
  const { boardId: validId } = validate(boardIdSchema, { boardId });

  const { error } = await getSupabase().from("boards").delete().eq("id", validId);

  if (error) throw error;
}
