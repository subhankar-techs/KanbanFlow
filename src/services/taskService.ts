import { createClient } from "@/lib/supabase/client";
import type { Priority } from "@/types";
import {
  validate,
  createTaskSchema,
  updateTaskSchema,
  deleteTaskSchema,
  moveTaskSchema,
  taskLabelsSchema,
  reorderColumnsSchema,
  taskPositionsSchema,
} from "@/lib/validations";

function getSupabase() { return createClient(); }

/**
 * Create a new task in a column
 */
export async function createTask(
  columnId: string,
  data: {
    title: string;
    description?: string;
    priority?: Priority;
    due_date?: string;
    position: number;
  },
  userId?: string
) {
  const valid = validate(createTaskSchema, { columnId, data, userId });

  const { data: task, error } = await getSupabase()
    .from("tasks")
    .insert({
      column_id: valid.columnId,
      title: valid.data.title.trim(),
      description: valid.data.description?.trim() ?? null,
      priority: valid.data.priority,
      due_date: valid.data.due_date ?? null,
      position: valid.data.position,
      created_by: valid.userId ?? null,
    } as never)
    .select()
    .single();

  if (error) throw error;
  return task;
}

/**
 * Update a task
 */
export async function updateTask(
  taskId: string,
  data: {
    title?: string;
    description?: string | null;
    priority?: Priority;
    due_date?: string | null;
    column_id?: string;
    position?: number;
  }
) {
  const valid = validate(updateTaskSchema, { taskId, data });

  const cleanData = { ...valid.data };
  if (cleanData.title) cleanData.title = cleanData.title.trim();
  if (cleanData.description) cleanData.description = cleanData.description.trim();

  const { data: task, error } = await getSupabase()
    .from("tasks")
    .update(cleanData as never)
    .eq("id", valid.taskId)
    .select()
    .single();

  if (error) throw error;
  return task;
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: string) {
  const { taskId: validId } = validate(deleteTaskSchema, { taskId });

  const { error } = await getSupabase().from("tasks").delete().eq("id", validId);

  if (error) throw error;
}

/**
 * Move a task to a different column with a new position
 */
export async function moveTask(
  taskId: string,
  newColumnId: string,
  newPosition: number
) {
  const valid = validate(moveTaskSchema, {
    taskId,
    columnId: newColumnId,
    position: newPosition,
  });

  const { data: task, error } = await getSupabase()
    .from("tasks")
    .update({ column_id: valid.columnId, position: valid.position } as never)
    .eq("id", valid.taskId)
    .select()
    .single();

  if (error) throw error;
  return task;
}

/**
 * Reorder tasks within a column
 */
export async function reorderTasks(
  columnId: string,
  orderedIds: { id: string; position: number }[]
) {
  const valid = validate(reorderColumnsSchema, {
    boardId: columnId, // reuse schema shape — validates UUID + array
    orderedIds,
  });

  const updates = valid.orderedIds.map(({ id, position }) =>
    getSupabase()
      .from("tasks")
      .update({ position } as never)
      .eq("id", id)
      .eq("column_id", valid.boardId)
  );

  const results = await Promise.all(updates);
  const error = results.find((r) => r.error)?.error;
  if (error) throw error;
}

/**
 * Update multiple task positions and column assignments atomically using RPC
 */
export async function updateTaskPositions(
  updates: { id: string; column_id: string; position: number }[]
) {
  const valid = validate(taskPositionsSchema, updates);

  const { data, error } = await getSupabase().rpc("update_task_positions", {
    payload: valid,
  });

  if (error) throw error;
  return data;
}

/**
 * Set labels on a task (replaces existing labels)
 */
export async function setTaskLabels(taskId: string, labelIds: string[]) {
  const valid = validate(taskLabelsSchema, { taskId, labelIds });

  const { error: deleteError } = await getSupabase()
    .from("task_labels")
    .delete()
    .eq("task_id", valid.taskId);

  if (deleteError) throw deleteError;

  if (valid.labelIds.length > 0) {
    const inserts = valid.labelIds.map((label_id) => ({
      task_id: valid.taskId,
      label_id,
    }));
    const { error: insertError } = await getSupabase()
      .from("task_labels")
      .insert(inserts as never);

    if (insertError) throw insertError;
  }
}
