"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, Loader2, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
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
          {sent ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
              <h1 className="text-2xl font-bold text-white">Check your email</h1>
              <p className="text-white/70 text-sm">
                We sent a password reset link to <strong className="text-white">{email}</strong>.
              </p>
              <Link href="/sign-in">
                <Button className="w-full bg-white text-indigo-600 hover:bg-white/90">Back to Sign In</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-white">Forgot Password</h1>
                <p className="text-sm text-white/70 mt-1">Enter your email to receive a reset link</p>
              </div>

              {error && (
                <div className="mb-4 rounded-lg bg-red-500/20 border border-red-400/30 p-3 text-sm text-red-200">
                  {error}
                </div>
              )}

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

                <Button type="submit" disabled={loading || !email} className="w-full bg-white text-indigo-600 hover:bg-white/90">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Reset Link"}
                </Button>

                <Link href="/sign-in" className="flex items-center justify-center gap-1 text-sm text-white/70 hover:text-white transition-colors">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Sign In
                </Link>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
