"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Activity,
  Plus,
  Trash2,
  Edit,
  Move,
  UserPlus,
  UserMinus,
  LayoutDashboard,
} from "lucide-react";
import * as activityService from "@/services/activityService";
import { formatRelativeTime, getInitials } from "@/utils";
import { format } from "date-fns";

interface ActivityEntry {
  id: string;
  board_id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  profile: {
    id: string;
    email: string;
    name: string | null;
    avatar_url: string | null;
  } | null;
}

interface ActivityPanelProps {
  boardId: string;
}

const ACTION_ICONS: Record<string, typeof Plus> = {
  created: Plus,
  deleted: Trash2,
  updated: Edit,
  moved: Move,
  invited: UserPlus,
  removed: UserMinus,
};

function getActionIcon(action: string) {
  const Icon = ACTION_ICONS[action] || Activity;
  return Icon;
}

function getActionColor(action: string) {
  switch (action) {
    case "created":
      return "text-emerald-500 bg-emerald-500/10";
    case "deleted":
      return "text-rose-500 bg-rose-500/10";
    case "updated":
      return "text-blue-500 bg-blue-500/10";
    case "moved":
      return "text-purple-500 bg-purple-500/10";
    case "invited":
      return "text-indigo-500 bg-indigo-500/10";
    case "removed":
      return "text-amber-500 bg-amber-500/10";
    default:
      return "text-muted-foreground bg-muted";
  }
}

function formatAction(entry: ActivityEntry): string {
  const userName = entry.profile?.name || entry.profile?.email || "Someone";
  const entityType = entry.entity_type;
  const details = entry.details as Record<string, string> | null;

  switch (entry.action) {
    case "created":
      return `${userName} created ${entityType} "${details?.name || details?.title || ""}"`;
    case "deleted":
      return `${userName} deleted ${entityType} "${details?.name || details?.title || ""}"`;
    case "updated":
      return `${userName} updated ${entityType} "${details?.name || details?.title || ""}"`;
    case "moved":
      return `${userName} moved task "${details?.title || ""}" to ${details?.to_column || ""}`;
    case "invited":
      return `${userName} invited ${details?.email || "a member"}`;
    case "removed":
      return `${userName} removed ${details?.email || "a member"}`;
    default:
      return `${userName} performed ${entry.action} on ${entityType}`;
  }
}

export function ActivityPanel({ boardId }: ActivityPanelProps) {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      const data = await activityService.getActivities(boardId, 50);
      setActivities(data as ActivityEntry[]);
    } catch {
      // Silently fail — activity is non-critical
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Group activities by date
  const groupedActivities = activities.reduce<
    Record<string, ActivityEntry[]>
  >((groups, entry) => {
    const date = format(new Date(entry.created_at), "MMM d, yyyy");
    if (!groups[date]) groups[date] = [];
    groups[date].push(entry);
    return groups;
  }, {});

  return (
    <Sheet>
      <SheetTrigger
          render={
            <Button variant="outline" size="sm" className="h-9 gap-1.5" />
          }
        >
          <Activity className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Activity</span>
        </SheetTrigger>
      <SheetContent className="w-[380px] sm:w-[420px] p-0">
        <SheetHeader className="p-4 pb-3 border-b">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-primary" />
            Activity Log
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-80px)]">
          {loading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="h-8 w-8 rounded-full bg-muted flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-muted rounded w-3/4" />
                    <div className="h-2.5 bg-muted rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="p-8 text-center">
              <LayoutDashboard className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No activity yet
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Activity will appear here as changes are made
              </p>
            </div>
          ) : (
            <div className="p-4">
              {Object.entries(groupedActivities).map(
                ([date, entries], gi) => (
                  <div key={date}>
                    {gi > 0 && <Separator className="my-3" />}
                    <p className="text-xs font-medium text-muted-foreground mb-3">
                      {date}
                    </p>
                    <div className="space-y-3">
                      {entries.map((entry) => {
                        const ActionIcon = getActionIcon(entry.action);
                        const colorClass = getActionColor(entry.action);

                        return (
                          <div
                            key={entry.id}
                            className="flex gap-3 group"
                          >
                            <div className="flex-shrink-0 mt-0.5">
                              {entry.profile ? (
                                <Avatar className="h-7 w-7">
                                  <AvatarImage
                                    src={entry.profile.avatar_url ?? undefined}
                                  />
                                  <AvatarFallback className="text-[10px] bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-primary">
                                    {getInitials(
                                      entry.profile.name,
                                      entry.profile.email
                                    )}
                                  </AvatarFallback>
                                </Avatar>
                              ) : (
                                <div
                                  className={`h-7 w-7 rounded-full flex items-center justify-center ${colorClass}`}
                                >
                                  <ActionIcon className="h-3 w-3" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm leading-relaxed">
                                {formatAction(entry)}
                              </p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {formatRelativeTime(entry.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
