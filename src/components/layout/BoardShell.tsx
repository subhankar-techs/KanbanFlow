"use client";

import { AuthGuard } from "@/components/layout/AuthGuard";
import { ThemeProvider } from "@/components/layout/ThemeProvider";

export function BoardShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthGuard>{children}</AuthGuard>
    </ThemeProvider>
  );
}
