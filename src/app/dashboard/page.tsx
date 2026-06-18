"use client";

import { useState, useEffect } from "react";
import { useRealtimeDashboard } from "@/hooks/useRealtimeDashboard";
import { BoardCard } from "@/components/board/BoardCard";
import { CreateBoardDialog } from "@/components/board/CreateBoardDialog";
import { EditBoardDialog } from "@/components/board/EditBoardDialog";
import { DeleteBoardDialog } from "@/components/board/DeleteBoardDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";
import type { Board } from "@/types";

export default function DashboardPage() {
  const { boards, loading, refetch } = useRealtimeDashboard();
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editBoard, setEditBoard] = useState<Board | null>(null);
  const [deleteBoard, setDeleteBoard] = useState<Board | null>(null);

  // Set page title
  useEffect(() => {
    document.title = "Dashboard | KanbanFlow";
  }, []);

  // Filter boards by search
  const filteredBoards = boards.filter(
    (board) =>
      board.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      board.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div className="animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            My Boards
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and organize your projects
          </p>
        </div>

        <div className="flex items-center gap-3 animate-fade-in">
          {/* Search */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search boards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 w-full sm:w-64"
            />
          </div>

          {/* Create Board */}
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300 h-9 gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create Board</span>
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-border/50 bg-card p-5"
            >
              <Skeleton className="h-1 w-full rounded-full mb-4" />
              <Skeleton className="h-5 w-3/4 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3 mb-4" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-6 w-6 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && boards.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
          <div className="relative mb-6">
            <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center">
              <LayoutDashboard className="h-10 w-10 text-primary/50" />
            </div>
            <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2">No boards yet</h2>
          <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
            Create your first board to start organizing your tasks and
            collaborating with your team.
          </p>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-indigo-500/25 gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Your First Board
          </Button>
        </div>
      )}

      {/* No Search Results */}
      {!loading && boards.length > 0 && filteredBoards.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
          <Search className="h-10 w-10 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold mb-1">No boards found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search query
          </p>
        </div>
      )}

      {/* Board Grid */}
      {!loading && filteredBoards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBoards.map((board, index) => (
            <BoardCard
              key={board.id}
              board={board}
              index={index}
              onEdit={() => setEditBoard(board)}
              onDelete={() => setDeleteBoard(board)}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreateBoardDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={refetch}
      />

      <EditBoardDialog
        board={editBoard}
        open={!!editBoard}
        onOpenChange={(open) => !open && setEditBoard(null)}
        onUpdated={refetch}
      />

      <DeleteBoardDialog
        board={deleteBoard}
        open={!!deleteBoard}
        onOpenChange={(open) => !open && setDeleteBoard(null)}
        onDeleted={refetch}
      />
    </div>
  );
}
