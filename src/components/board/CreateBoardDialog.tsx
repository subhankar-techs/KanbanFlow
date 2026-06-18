"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { createBoard } from "@/services/boardService";
import { APP_CONFIG } from "@/constants";
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

interface CreateBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function CreateBoardDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateBoardDialogProps) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      if (!user?.id) {
        toast.error("You must be signed in to create a board");
        return;
      }
      await createBoard({
        name: trimmedName,
        description: description.trim() || undefined,
      }, user.id, user.email ?? undefined);
      toast.success("Board created successfully");
      setName("");
      setDescription("");
      onOpenChange(false);
      onCreated?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create board"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create new board</DialogTitle>
          <DialogDescription>
            Give your board a name and optional description.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="board-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="board-name"
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
            <Label htmlFor="board-desc">Description</Label>
            <Textarea
              id="board-desc"
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
              Create board
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
