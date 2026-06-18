import { createClient } from "@/lib/supabase/client";
import {
  validate,
  createColumnSchema,
  updateColumnSchema,
  deleteColumnSchema,
  reorderColumnsSchema,
} from "@/lib/validations";

function getSupabase() { return createClient(); }

export async function createColumn(boardId: string, name: string, position: number) {
  const valid = validate(createColumnSchema, { boardId, name, position });

  const { data, error } = await getSupabase()
    .from("columns")
    .insert({
      board_id: valid.boardId,
      name: valid.name.trim(),
      position: valid.position,
    } as never)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateColumn(columnId: string, data: { name?: string; position?: number }) {
  const valid = validate(updateColumnSchema, { columnId, data });

  const cleanData = { ...valid.data };
  if (cleanData.name) cleanData.name = cleanData.name.trim();

  const { data: col, error } = await getSupabase()
    .from("columns")
    .update(cleanData as never)
    .eq("id", valid.columnId)
    .select()
    .single();

  if (error) throw error;
  return col;
}

export async function deleteColumn(columnId: string) {
  const { columnId: validId } = validate(deleteColumnSchema, { columnId });

  const { error } = await getSupabase()
    .from("columns")
    .delete()
    .eq("id", validId);

  if (error) throw error;
}

export async function reorderColumns(boardId: string, orderedIds: { id: string; position: number }[]) {
  const valid = validate(reorderColumnsSchema, { boardId, orderedIds });

  const updates = valid.orderedIds.map(({ id, position }) =>
    getSupabase()
      .from("columns")
      .update({ position } as never)
      .eq("id", id)
      .eq("board_id", valid.boardId)
  );

  const results = await Promise.all(updates);
  const error = results.find((r) => r.error)?.error;
  if (error) throw error;
}
