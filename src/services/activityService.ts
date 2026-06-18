import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/types";
import { validate, logActivitySchema, boardIdSchema } from "@/lib/validations";

function getSupabase() { return createClient(); }

/**
 * Log an activity event
 */
export async function logActivity(
  boardId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  details?: Record<string, unknown>,
  userId?: string
) {
  const valid = validate(logActivitySchema, {
    boardId,
    action,
    entityType,
    entityId,
    details,
    userId,
  });

  const payload = {
    board_id: valid.boardId,
    user_id: valid.userId ?? null,
    action: valid.action,
    entity_type: valid.entityType,
    entity_id: valid.entityId,
    details: (valid.details as Json) ?? null,
  };

  const { error } = await getSupabase().from("activity_log").insert(payload as never);

  if (error) {
    console.error("Failed to log activity:", error);
  }
}

/**
 * Get activity log for a board
 */
export async function getActivities(boardId: string, limit = 20) {
  const { boardId: validId } = validate(boardIdSchema, { boardId });
  const safeLimit = Math.min(Math.max(1, limit), 100);

  const { data, error } = await getSupabase()
    .from("activity_log")
    .select(
      `
      *,
      profile:profiles(*)
    `
    )
    .eq("board_id", validId)
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error) throw error;
  return data;
}
