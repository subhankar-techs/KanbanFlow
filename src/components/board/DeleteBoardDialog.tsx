"use client";

import { useState } from "react";
import { toast } from "sonner";
import { deleteBoard } from "@/services/boardService";
import type { Board } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";

interface DeleteBoardDialogProps {
  board: Board | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function DeleteBoardDialog({
  board,
  open,
  onOpenChange,
  onDeleted,
}: DeleteBoardDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!board) return;

    setLoading(true);

    try {
      await deleteBoard(board.id);
      toast.success("Board deleted successfully");
      onOpenChange(false);
      onDeleted?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete board"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="size-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>Delete board</DialogTitle>
              <DialogDescription className="mt-1">
                Are you sure you want to delete{" "}
                <span className="font-medium text-foreground">
                  {board?.name}
                </span>
                ?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
          <p className="text-sm text-destructive dark:text-destructive/90">
            This action cannot be undone. All columns, tasks, and data in this
            board will be permanently deleted.
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Delete board
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
