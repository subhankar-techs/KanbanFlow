"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2 } from "lucide-react";
import { GoogleButton } from "@/components/ui/google-button";

// Maps URL error codes from auth callback to user-friendly messages
const ERROR_MESSAGES: Record<string, string> = {
  provider_conflict:
    "This email is already registered with email/password. Please sign in using your password.",
  google_conflict:
    'This email is already registered with Google. Please use "Continue with Google" to sign in.',
  auth_callback_failed:
    "Authentication failed. Please try again.",
  oauth_cancelled:
    "Google sign-in was cancelled. Please try again.",
};

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Show errors redirected from OAuth callback ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get("error");
    if (errorParam && ERROR_MESSAGES[errorParam]) {
      setError(ERROR_MESSAGES[errorParam]);
      // Clean up the URL without triggering a navigation
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();

      // ── Check if email is registered via Google before attempting password login ──
      const { data: providerData } = await supabase.rpc("get_provider_for_email", {
        lookup_email: email,
      });

      if (providerData && providerData.length > 0 && providerData[0].auth_provider === "google") {
        setError(
          'This email is registered with Google. Please use "Continue with Google" to sign in.'
        );
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        // Make common Supabase errors more user-friendly
        if (error.message.includes("Invalid login credentials")) {
          setError("Invalid email or password. Please try again.");
        } else if (error.message.includes("Email not confirmed")) {
          setError("Please verify your email address before signing in. Check your inbox.");
        } else {
          setError(error.message);
        }
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-pink-400/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/4 h-48 w-48 rounded-full bg-indigo-300/15 blur-2xl" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white">Welcome back</h1>
            <p className="text-sm text-white/70 mt-1">Sign in to your account</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-500/20 border border-red-400/30 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="mb-4">
            <GoogleButton onError={(msg) => setError(msg)} />
          </div>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-transparent px-2 text-white/50">or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/90">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  required
                  autoFocus
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/90">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <Button type="submit" disabled={loading || !email || !password} className="w-full bg-white text-indigo-600 hover:bg-white/90">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
            </Button>
          </form>

          <div className="mt-4 flex flex-col items-center gap-2 text-sm">
            <Link href="/forgot-password" className="text-white/70 hover:text-white transition-colors">
              Forgot your password?
            </Link>
            <span className="text-white/50">
              No account?{" "}
              <Link href="/sign-up" className="text-white hover:underline">
                Sign up
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
