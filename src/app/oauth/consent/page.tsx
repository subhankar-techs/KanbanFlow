import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

// Supabase Auth (OAuth 2.1 server) sends users here as /oauth/consent?authorization_id=...
// Middleware guarantees the user is signed in before this page renders.

async function decide(formData: FormData) {
  "use server";
  const id = String(formData.get("authorization_id") ?? "");
  const supabase = await createClient();
  const { data, error } =
    formData.get("decision") === "approve"
      ? await supabase.auth.oauth.approveAuthorization(id, { skipBrowserRedirect: true })
      : await supabase.auth.oauth.denyAuthorization(id, { skipBrowserRedirect: true });

  if (error || !data) {
    redirect(
      `/oauth/consent?authorization_id=${encodeURIComponent(id)}&error=${encodeURIComponent(
        error?.message ?? "Request failed"
      )}`
    );
  }
  redirect(data.redirect_url);
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 text-white shadow-2xl backdrop-blur-xl">
        {children}
      </div>
    </div>
  );
}

export default async function ConsentPage({
  searchParams,
}: {
  searchParams: Promise<{ authorization_id?: string; error?: string }>;
}) {
  const { authorization_id: id, error: decisionError } = await searchParams;
  if (!id) return <Shell>Missing authorization_id.</Shell>;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(id);
  if (error || !data) {
    return <Shell>{error?.message ?? "Invalid or expired authorization request."}</Shell>;
  }

  // Already approved before: Supabase hands back the redirect directly
  if (!("authorization_id" in data)) redirect(data.redirect_url);

  return (
    <Shell>
      <h1 className="text-2xl font-bold">Allow {data.client.name}?</h1>
      <p className="mt-2 text-sm text-white/80">
        {data.client.name} wants to access your KanbanFlow boards as{" "}
        <strong>{data.user.email}</strong>. It will be able to view, create, edit, move and delete
        tasks on boards you can access.
      </p>
      <p className="mt-3 break-all text-xs text-white/60">Redirects to: {data.redirect_uri}</p>

      {decisionError && (
        <div className="mt-4 rounded-lg border border-red-400/30 bg-red-500/20 p-3 text-sm text-red-200">
          {decisionError}
        </div>
      )}

      <form action={decide} className="mt-6 flex gap-3">
        <input type="hidden" name="authorization_id" value={id} />
        <Button
          type="submit"
          name="decision"
          value="deny"
          variant="outline"
          className="flex-1 border-white/20 bg-white/10 text-white hover:bg-white/20"
        >
          Deny
        </Button>
        <Button
          type="submit"
          name="decision"
          value="approve"
          className="flex-1 bg-white text-indigo-600 hover:bg-white/90"
        >
          Allow
        </Button>
      </form>
    </Shell>
  );
}
