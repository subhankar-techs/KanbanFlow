"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { AuthGuard } from "@/components/layout/AuthGuard";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthGuard>
        <div className="flex h-screen overflow-hidden bg-background">
          <Sidebar>
            {/* Main content area */}
            <div className="flex min-w-0 flex-1 flex-col">
              <Header />
              <main className="custom-scrollbar flex-1 overflow-y-auto">
                {children}
              </main>
            </div>
          </Sidebar>
        </div>
      </AuthGuard>
    </ThemeProvider>
  );
}
