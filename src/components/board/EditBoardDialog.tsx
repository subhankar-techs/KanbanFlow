"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { updateBoard } from "@/services/boardService";
import { APP_CONFIG } from "@/constants";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface EditBoardDialogProps {
  board: Board | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
}

export function EditBoardDialog({
  board,
  open,
  onOpenChange,
  onUpdated,
}: EditBoardDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  // Sync form when board changes
  useEffect(() => {
    if (board) {
      setName(board.name);
      setDescription(board.description ?? "");
    }
  }, [board]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!board) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Board name is required");
      return;
    }

    if (trimmedName.length > APP_CONFIG.maxBoardNameLength) {
      toast.error(`Board name must be ${APP_CONFIG.maxBoardNameLength} characters or less`);
      return;
    }

    setLoading(true);

    try {
      await updateBoard(board.id, {
        name: trimmedName,
        description: description.trim() || undefined,
      });
      toast.success("Board updated successfully");
      onOpenChange(false);
      onUpdated?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update board"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit board</DialogTitle>
          <DialogDescription>
            Update the name or description of this board.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-board-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-board-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sprint 12"
              maxLength={APP_CONFIG.maxBoardNameLength}
              autoFocus
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              {name.length}/{APP_CONFIG.maxBoardNameLength}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-board-desc">Description</Label>
            <Textarea
              id="edit-board-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this board for?"
              rows={3}
              disabled={loading}
            />
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
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
