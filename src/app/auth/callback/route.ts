import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  // ── Handle OAuth errors from Supabase (e.g. user cancelled) ──
  const oauthError = searchParams.get("error");
  const oauthErrorDesc = searchParams.get("error_description");

  if (oauthError) {
    const errorType =
      oauthError === "access_denied" || oauthErrorDesc?.includes("cancel")
        ? "oauth_cancelled"
        : "auth_callback_failed";
    return NextResponse.redirect(
      `${origin}/sign-in?error=${errorType}`
    );
  }

  // ── No code → invalid callback ──
  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_failed`);
  }

  // ── Create Supabase server client ──
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  // ── Exchange code for session ──
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_failed`);
  }

  const { user } = data;
  const userEmail = user.email ?? "";
  const incomingProvider = user.app_metadata?.provider ?? "email";

  // ── Provider conflict detection ──
  // Check if a profile already exists with this email under a different provider
  if (userEmail) {
    const { data: providerData } = await supabase.rpc("get_provider_for_email", {
      lookup_email: userEmail,
    });

    if (providerData && providerData.length > 0) {
      const existingProvider = providerData[0].auth_provider;
      const existingUserId = providerData[0].user_id;

      // Conflict: email registered with a different provider AND it's a different user
      if (existingProvider !== incomingProvider && existingUserId !== user.id) {
        // Sign the user out to clean up the session
        await supabase.auth.signOut();

        if (existingProvider === "email") {
          // User has email/password account, tried Google
          return NextResponse.redirect(
            `${origin}/sign-in?error=provider_conflict`
          );
        } else {
          // User has Google account, tried email (shouldn't normally hit this path from OAuth callback,
          // but handle it defensively)
          return NextResponse.redirect(
            `${origin}/sign-in?error=google_conflict`
          );
        }
      }
    }
  }

  // ── Upsert profile with provider tracking ──
  const profileData = {
    id: user.id,
    email: userEmail,
    name:
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      userEmail.split("@")[0] ??
      "",
    avatar_url: user.user_metadata?.avatar_url ?? null,
    auth_provider: incomingProvider === "google" ? "google" : "email",
  };

  const { error: profileError } = await supabase.from("profiles").upsert(
    profileData,
    { onConflict: "id" }
  );

  if (profileError) {
    console.error("Profile upsert failed in auth callback:", profileError.message);
    // Don't block login — profile sync in useAuth will retry
  }

  // ── Success → redirect to destination ──
  return NextResponse.redirect(`${origin}${next}`);
}
