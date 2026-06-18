import { createClient } from "@/lib/supabase/client";
import {
  validate,
  inviteMemberSchema,
  removeMemberSchema,
  boardIdSchema,
} from "@/lib/validations";

function getSupabase() { return createClient(); }

/**
 * Get all members of a board with their profiles
 */
export async function getMembers(boardId: string) {
  const { boardId: validId } = validate(boardIdSchema, { boardId });

  const { data, error } = await getSupabase()
    .from("board_members")
    .select(
      `
      *,
      profile:profiles(*)
    `
    )
    .eq("board_id", validId);

  if (error) throw error;
  return data;
}

/**
 * Invite a member to a board by email
 */
export async function inviteMember(boardId: string, email: string) {
  const valid = validate(inviteMemberSchema, { boardId, email });

  const { data: profile, error: profileError } = await getSupabase()
    .from("profiles")
    .select("id")
    .eq("email", valid.email)
    .single();

  if (profileError || !profile) {
    throw new Error(
      "User not found. They must have a KanbanFlow account first."
    );
  }

  const foundProfile = profile as unknown as { id: string };

  const { data: existing } = await getSupabase()
    .from("board_members")
    .select("id")
    .eq("board_id", valid.boardId)
    .eq("user_id", foundProfile.id)
    .single();

  if (existing) {
    throw new Error("User is already a member of this board.");
  }

  const { data, error } = await getSupabase()
    .from("board_members")
    .insert({
      board_id: valid.boardId,
      user_id: foundProfile.id,
      role: "member",
    } as never)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Remove a member from a board
 */
export async function removeMember(boardId: string, userId: string) {
  const valid = validate(removeMemberSchema, { boardId, userId });

  const { error } = await getSupabase()
    .from("board_members")
    .delete()
    .eq("board_id", valid.boardId)
    .eq("user_id", valid.userId);

  if (error) throw error;
}
