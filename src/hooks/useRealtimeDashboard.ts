"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import type { Board } from "@/types";

export function useRealtimeDashboard() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: isLoaded } = useAuth();
  const supabase = createClient();
  const userId = user?.id ?? null;

  const fetchBoards = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Get boards where user is owner
    const { data: ownedBoards } = await supabase
      .from("boards")
      .select("*")
      .eq("owner_id", userId)
      .order("updated_at", { ascending: false });

    // Get boards where user is a member
    const { data: memberEntries } = await supabase
      .from("board_members")
      .select("board_id")
      .eq("user_id", userId)
      .neq("role", "owner");

    const memberBoardIds = (memberEntries as { board_id: string }[] | null)?.map((m) => m.board_id) ?? [];

    let memberBoards: Board[] = [];
    if (memberBoardIds.length > 0) {
      const { data } = await supabase
        .from("boards")
        .select("*")
        .in("id", memberBoardIds)
        .order("updated_at", { ascending: false });
      memberBoards = data ?? [];
    }

    const allBoards = [...(ownedBoards ?? []), ...memberBoards];
    const seen = new Set<string>();
    const uniqueBoards = allBoards.filter((b) => {
      if (seen.has(b.id)) return false;
      seen.add(b.id);
      return true;
    });

    setBoards(uniqueBoards);
    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    if (isLoaded || !userId) return;

    fetchBoards();

    const channel = supabase
      .channel("dashboard-boards")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "boards" },
        () => fetchBoards()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "board_members" },
        () => fetchBoards()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchBoards, isLoaded, userId]);

  return { boards, loading, refetch: fetchBoards };
}
