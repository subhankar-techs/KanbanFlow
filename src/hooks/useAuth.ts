"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const profileSynced = useRef(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      profileSynced.current = false;
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || profileSynced.current) return;
    profileSynced.current = true;

    const supabase = createClient();
    supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.email ?? "",
          name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split("@")[0] ?? "",
          avatar_url: user.user_metadata?.avatar_url ?? null,
        },
        { onConflict: "id" }
      )
      .then(({ error }) => {
        if (error) console.error("Profile sync failed:", error.message);
      });
  }, [user]);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    setProfile({
      id: user.id,
      email: user.email ?? "",
      name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split("@")[0] ?? "",
      avatar_url: user.user_metadata?.avatar_url ?? null,
      created_at: user.created_at ?? new Date().toISOString(),
    });
  }, [user]);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }, [router]);

  return { user, profile, loading, signOut };
}
