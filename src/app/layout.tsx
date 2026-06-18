import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "KanbanFlow — Collaborative Task Management",
    template: "%s | KanbanFlow",
  },
  description:
    "A modern, collaborative Kanban board for teams. Organize tasks, track progress, and boost productivity with drag-and-drop simplicity.",
  keywords: [
    "kanban",
    "task management",
    "project management",
    "collaboration",
    "productivity",
    "trello alternative",
  ],
  authors: [{ name: "KanbanFlow" }],
  openGraph: {
    title: "KanbanFlow — Collaborative Task Management",
    description:
      "Organize tasks, track progress, and boost productivity with drag-and-drop simplicity.",
    type: "website",
    locale: "en_US",
    siteName: "KanbanFlow",
  },
  twitter: {
    card: "summary_large_image",
    title: "KanbanFlow — Collaborative Task Management",
    description:
      "Organize tasks, track progress, and boost productivity with drag-and-drop simplicity.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const stored = JSON.parse(localStorage.getItem('kanbanflow-ui') || '{}');
                const theme = stored?.state?.theme || 'system';
                if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              } catch {}
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans min-h-screen antialiased`}>
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--popover)",
              color: "var(--popover-foreground)",
              border: "1px solid var(--border)",
            },
          }}
        />
      </body>
    </html>
  );
}
