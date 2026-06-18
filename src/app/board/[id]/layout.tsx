import { BoardShell } from "@/components/layout/BoardShell";

// Prevent static pre-rendering — board pages require runtime Supabase auth
export const dynamic = "force-dynamic";

export default function BoardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BoardShell>{children}</BoardShell>;
}
