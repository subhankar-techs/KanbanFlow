"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ApiToken {
  id: string;
  name: string;
  created_at: string;
}

// Mounted only while open, so the one-time token is dropped on close.
interface ConnectAIDialogProps {
  userId: string;
  onOpenChange: (open: boolean) => void;
}

async function sha256Hex(text: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function ConnectAIDialog({ userId, onOpenChange }: ConnectAIDialogProps) {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadTokens = () =>
    createClient()
      .from("api_tokens")
      .select("id, name, created_at")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        else setTokens(data as ApiToken[]);
      });

  useEffect(() => {
    loadTokens();
  }, []);

  const generate = async () => {
    setLoading(true);
    try {
      const bytes = crypto.getRandomValues(new Uint8Array(32));
      const token = "kf_" + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
      const { error } = await createClient()
        .from("api_tokens")
        .insert({ user_id: userId, name: "AI assistant", token_hash: await sha256Hex(token) } as never);
      if (error) throw error;
      setNewToken(token);
      await loadTokens();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create token");
    } finally {
      setLoading(false);
    }
  };

  const revoke = async (id: string) => {
    const { error } = await createClient().from("api_tokens").delete().eq("id", id);
    if (error) toast.error(error.message);
    else setTokens((t) => t.filter((x) => x.id !== id));
  };

  const url = typeof window !== "undefined" ? `${window.location.origin}/api/mcp` : "/api/mcp";
  const config = newToken
    ? JSON.stringify(
        { mcpServers: { kanbanflow: { url, headers: { Authorization: `Bearer ${newToken}` } } } },
        null,
        2
      )
    : null;

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Connect AI assistant</DialogTitle>
          <DialogDescription>
            Let Claude, Cursor or any MCP client manage your tasks. MCP URL: <code>{url}</code>
          </DialogDescription>
        </DialogHeader>

        {config ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Copy this now. The token won&apos;t be shown again.
            </p>
            <pre className="max-h-60 overflow-auto whitespace-pre-wrap break-all rounded-md bg-muted p-3 text-xs">{config}</pre>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigator.clipboard.writeText(config).then(() => toast.success("Copied"))}
            >
              Copy config
            </Button>
          </div>
        ) : (
          <Button onClick={generate} disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            Generate token
          </Button>
        )}

        {tokens.length > 0 && (
          <ul className="space-y-1 text-sm">
            {tokens.map((t) => (
              <li key={t.id} className="flex items-center justify-between rounded-md border px-3 py-1.5">
                <span>
                  {t.name}{" "}
                  <span className="text-muted-foreground">
                    · {new Date(t.created_at).toLocaleDateString()}
                  </span>
                </span>
                <Button variant="ghost" size="icon-sm" onClick={() => revoke(t.id)} aria-label="Revoke token">
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
