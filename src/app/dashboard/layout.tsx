import { DashboardShell } from "@/components/layout/DashboardShell";

// Prevent static pre-rendering — all dashboard pages require runtime Supabase auth
export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
