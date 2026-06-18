"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useUIStore } from "@/store/uiStore";
import { getInitials } from "@/utils";
import { ROUTES } from "@/constants";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";

const NAV_LINKS = [
  {
    label: "Dashboard",
    href: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
  },
] as const;

/* ---------- Sidebar content (shared between desktop + mobile) ---------- */

function SidebarContent({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();
  const { theme, setTheme, toggleSidebar } = useUIStore();

  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <div className="flex h-full flex-col">
      {/* ---- Logo ---- */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center gap-2 border-b border-border/50 px-4 transition-all",
          collapsed && "justify-center px-2"
        )}
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <LayoutDashboard className="size-4" />
        </div>
        {!collapsed && (
          <span className="bg-gradient-to-r from-primary via-indigo-400 to-purple-500 bg-clip-text text-lg font-bold tracking-tight text-transparent select-none">
            KanbanFlow
          </span>
        )}
      </div>

      {/* ---- Navigation ---- */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_LINKS.map((link) => {
          const active = pathname === link.href || pathname.startsWith(link.href + "/");
          const LinkIcon = link.icon;

          const linkContent = (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-primary/10 text-primary dark:bg-primary/15"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                collapsed && "justify-center px-2"
              )}
            >
              <LinkIcon
                className={cn(
                  "size-[18px] shrink-0 transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={link.href}>
                <TooltipTrigger render={<span />}>
                  {linkContent}
                </TooltipTrigger>
                <TooltipContent side="right">{link.label}</TooltipContent>
              </Tooltip>
            );
          }

          return linkContent;
        })}
      </nav>

      {/* ---- Theme toggle ---- */}
      <div
        className={cn(
          "border-t border-border/50 px-4 py-3",
          collapsed && "flex justify-center px-2"
        )}
      >
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setTheme(isDark ? "light" : "dark")}
                />
              }
            >
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </TooltipTrigger>
            <TooltipContent side="right">Toggle theme</TooltipContent>
          </Tooltip>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isDark ? (
                <Moon className="size-4" />
              ) : (
                <Sun className="size-4" />
              )}
              <span>{isDark ? "Dark" : "Light"} mode</span>
            </div>
            <Switch
              size="sm"
              checked={isDark}
              onCheckedChange={(checked) =>
                setTheme(checked ? "dark" : "light")
              }
            />
          </div>
        )}
      </div>

      {/* ---- User section ---- */}
      <div
        className={cn(
          "border-t border-border/50 px-4 py-3",
          collapsed && "flex flex-col items-center gap-2 px-2"
        )}
      >
        <div
          className={cn(
            "flex items-center gap-3",
            collapsed && "flex-col gap-1"
          )}
        >
          <Avatar size="sm">
            {profile?.avatar_url && (
              <AvatarImage src={profile.avatar_url} alt={profile.name ?? ""} />
            )}
            <AvatarFallback>
              {getInitials(profile?.name ?? null, profile?.email)}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium leading-tight">
                {profile?.name ?? "User"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {profile?.email}
              </p>
            </div>
          )}
        </div>

        {/* ---- Collapse toggle (desktop) ---- */}
        <div className={cn("mt-2 hidden md:flex", collapsed ? "justify-center" : "justify-between")}>
          {!collapsed && (
            <span className="text-xs text-muted-foreground">Collapse</span>
          )}
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={toggleSidebar}
            className="text-muted-foreground hover:text-foreground"
          >
            {collapsed ? (
              <ChevronRight className="size-3.5" />
            ) : (
              <ChevronLeft className="size-3.5" />
            )}
          </Button>
        </div>

        {/* ---- Logout ---- */}
        <Button
          variant="ghost"
          className={cn(
            "mt-1 w-full justify-start gap-2 text-muted-foreground hover:text-destructive",
            collapsed && "justify-center px-0"
          )}
          size="sm"
          onClick={signOut}
        >
          <LogOut className="size-4 shrink-0" />
          {!collapsed && <span>Log out</span>}
        </Button>
      </div>
    </div>
  );
}

/* ---------- Desktop sidebar ---------- */

function DesktopSidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const collapsed = !sidebarOpen;

  return (
    <aside
      className={cn(
        "hidden h-screen shrink-0 border-r border-border/50 bg-card transition-[width] duration-300 ease-in-out md:flex md:flex-col",
        "dark:bg-card/60 dark:backdrop-blur-xl",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      <SidebarContent collapsed={collapsed} />
    </aside>
  );
}

/* ---------- Mobile sidebar (Sheet) ---------- */

function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {/* The trigger is in the Header, so we expose open/setOpen via a global mechanism */}
      <MobileSidebarTrigger.Provider value={{ open, setOpen }}>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="w-[280px] p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarContent collapsed={false} />
          </SheetContent>
        </Sheet>
      </MobileSidebarTrigger.Provider>
    </>
  );
}

/* Context for mobile sidebar trigger (used by Header) */
import { createContext, useContext } from "react";

interface MobileSidebarCtx {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const MobileSidebarTrigger = createContext<MobileSidebarCtx>({
  open: false,
  setOpen: () => {},
});

MobileSidebarTrigger.Provider;

export function useMobileSidebar() {
  return useContext(MobileSidebarTrigger);
}

/* ---------- Composed sidebar export ---------- */

export function Sidebar({ children }: { children?: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <MobileSidebarTrigger.Provider value={{ open: mobileOpen, setOpen: setMobileOpen }}>
      <DesktopSidebar />
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent collapsed={false} />
        </SheetContent>
      </Sheet>
      {children}
    </MobileSidebarTrigger.Provider>
  );
}
