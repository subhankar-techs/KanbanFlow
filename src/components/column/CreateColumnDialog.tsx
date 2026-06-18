"use client";

import { useState } from "react";
import * as columnService from "@/services/columnService";
import { useBoardStore } from "@/store/boardStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import type { Column as ColumnType, ColumnWithTasks } from "@/types";

interface CreateColumnDialogProps {
  boardId: string;
  position: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateColumnDialog({
  boardId,
  position,
  open,
  onOpenChange,
}: CreateColumnDialogProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { addColumn } = useBoardStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    setLoading(true);
    try {
      const column = await columnService.createColumn(
        boardId,
        name.trim(),
        position
      );
      const col = column as unknown as ColumnType;
      addColumn({ ...col, tasks: [] } as ColumnWithTasks);
      toast.success("Column created");
      setName("");
      onOpenChange(false);
    } catch {
      toast.error("Failed to create column");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Create Column</DialogTitle>
          <DialogDescription>
            Add a new column to organize your tasks.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="column-name">Name</Label>
            <Input
              id="column-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. In Review"
              maxLength={30}
              autoFocus
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Create Column
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
