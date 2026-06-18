"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBoardStore } from "@/store/boardStore";
import { useRealtimeBoard } from "@/hooks/useRealtimeBoard";
import * as boardService from "@/services/boardService";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  AlertCircle,
  Check,
  X,
  Settings,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants";
import type { Board } from "@/types";

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const boardId = params.id as string;

  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");

  const { setBoard: setBoardStore, clearBoard } = useBoardStore();

  // Set up realtime subscriptions
  useRealtimeBoard(board ? boardId : null);

  const fetchBoard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await boardService.getBoard(boardId);
      setBoard(data);
      setNameValue(data.name);
      setBoardStore(data.id, data.columns, data.labels);
    } catch (err) {
      console.error("Failed to fetch board:", err);
      setError("Board not found or you don't have access.");
    } finally {
      setLoading(false);
    }
  }, [boardId, setBoardStore]);

  useEffect(() => {
    fetchBoard();
    return () => {
      clearBoard();
    };
  }, [fetchBoard, clearBoard]);

  const handleSaveName = async () => {
    if (!board || !nameValue.trim()) {
      setNameValue(board?.name ?? "");
      setEditingName(false);
      return;
    }

    if (nameValue.trim() === board.name) {
      setEditingName(false);
      return;
    }

    try {
      const updated = await boardService.updateBoard(boardId, {
        name: nameValue.trim(),
      });
      if (updated) {
        setBoard((prev) => (prev ? { ...prev, name: (updated as Board).name } : prev));
      }
      toast.success("Board name updated");
    } catch {
      toast.error("Failed to update board name");
      setNameValue(board.name);
    }
    setEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveName();
    } else if (e.key === "Escape") {
      setNameValue(board?.name ?? "");
      setEditingName(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen flex-col bg-background">
        {/* Header skeleton */}
        <div className="flex items-center gap-4 border-b px-6 py-4">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-7 w-48" />
          <div className="ml-auto flex items-center gap-2">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="size-8 rounded-full" />
          </div>
        </div>
        {/* Board skeleton */}
        <div className="flex flex-1 gap-6 overflow-hidden p-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex w-[300px] flex-shrink-0 flex-col gap-3">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-lg" />
              <Skeleton className="h-28 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error || !board) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="size-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold">Board Not Found</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            {error || "The board you're looking for doesn't exist or you don't have access to it."}
          </p>
          <Button
            variant="outline"
            onClick={() => router.push(ROUTES.DASHBOARD)}
            className="mt-2"
          >
            <ArrowLeft className="size-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Board Header */}
      <header className="flex items-center gap-4 border-b border-border/50 bg-card/50 px-4 py-3 backdrop-blur-sm sm:px-6">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => router.push(ROUTES.DASHBOARD)}
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="size-4" />
        </Button>

        {/* Board Name (inline editable) */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {editingName ? (
            <div className="flex items-center gap-1.5">
              <Input
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={handleNameKeyDown}
                className="h-8 w-64 text-lg font-semibold"
                autoFocus
                maxLength={50}
              />
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={handleSaveName}
              >
                <Check className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => {
                  setNameValue(board.name);
                  setEditingName(false);
                }}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className={cn(
                "truncate rounded-md px-2 py-1 text-lg font-semibold",
                "transition-colors hover:bg-muted/80",
                "cursor-text text-left"
              )}
              title="Click to edit board name"
            >
              {board.name}
            </button>
          )}

          {board.description && (
            <span className="hidden truncate text-sm text-muted-foreground lg:inline">
              {board.description}
            </span>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Members avatars placeholder */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Members"
              className="text-muted-foreground hover:text-foreground"
            >
              <Users className="size-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Board settings"
            className="text-muted-foreground hover:text-foreground"
          >
            <Settings className="size-4" />
          </Button>
        </div>
      </header>

      {/* Board Content */}
      <main className="flex-1 overflow-hidden">
        <KanbanBoard />
      </main>
    </div>
  );
}
