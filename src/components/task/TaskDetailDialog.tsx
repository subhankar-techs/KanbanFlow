"use client";

import { useState, useEffect, useCallback } from "react";
import * as taskService from "@/services/taskService";
import { useBoardStore } from "@/store/boardStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Calendar as CalendarIcon,
  Trash2,
  X,
  Check,
  Tag,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { formatRelativeTime } from "@/utils";
import { PRIORITIES } from "@/constants";
import type { TaskWithLabels, Priority } from "@/types";

interface TaskDetailDialogProps {
  task: TaskWithLabels | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailDialog({
  task,
  open,
  onOpenChange,
}: TaskDetailDialogProps) {
  const { updateTask: updateTaskStore, removeTask, labels: boardLabels } =
    useBoardStore();

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [descValue, setDescValue] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Sync local state with task prop
  useEffect(() => {
    if (task) {
      setTitleValue(task.title);
      setDescValue(task.description ?? "");
      setPriority(task.priority);
      setDueDate(task.due_date ? new Date(task.due_date) : undefined);
      setSelectedLabelIds(task.labels.map((l) => l.id));
      setConfirmDelete(false);
    }
  }, [task]);

  const saveField = useCallback(
    async (field: string, value: unknown) => {
      if (!task) return;
      try {
        await taskService.updateTask(task.id, {
          [field]: value,
        });
        updateTaskStore(task.id, { [field]: value } as Partial<TaskWithLabels>);
        toast.success("Task updated");
      } catch {
        toast.error("Failed to update task");
      }
    },
    [task, updateTaskStore]
  );

  const handleTitleSave = () => {
    if (!titleValue.trim() || !task) {
      setTitleValue(task?.title ?? "");
      setEditingTitle(false);
      return;
    }
    if (titleValue.trim() !== task.title) {
      saveField("title", titleValue.trim());
    }
    setEditingTitle(false);
  };

  const handleDescriptionBlur = () => {
    if (!task) return;
    const newDesc = descValue.trim() || null;
    if (newDesc !== (task.description ?? null)) {
      saveField("description", newDesc);
    }
  };

  const handlePriorityChange = (val: string | null) => {
    if (!val) return;
    setPriority(val as Priority);
    saveField("priority", val);
  };

  const handleDateChange = (date: Date | undefined) => {
    setDueDate(date);
    setCalendarOpen(false);
    saveField("due_date", date ? format(date, "yyyy-MM-dd") : null);
  };

  const handleClearDate = () => {
    setDueDate(undefined);
    saveField("due_date", null);
  };

  const handleLabelToggle = async (labelId: string) => {
    if (!task) return;
    const newLabelIds = selectedLabelIds.includes(labelId)
      ? selectedLabelIds.filter((id) => id !== labelId)
      : [...selectedLabelIds, labelId];

    setSelectedLabelIds(newLabelIds);

    try {
      await taskService.setTaskLabels(task.id, newLabelIds);
      const newLabels = boardLabels.filter((l) => newLabelIds.includes(l.id));
      updateTaskStore(task.id, { labels: newLabels });
    } catch {
      toast.error("Failed to update labels");
      setSelectedLabelIds(selectedLabelIds);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    setDeleting(true);
    try {
      await taskService.deleteTask(task.id);
      removeTask(task.id);
      toast.success("Task deleted");
      onOpenChange(false);
    } catch {
      toast.error("Failed to delete task");
    }
    setDeleting(false);
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          {/* Title (inline editable) */}
          {editingTitle ? (
            <div className="flex items-center gap-2">
              <Input
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTitleSave();
                  if (e.key === "Escape") {
                    setTitleValue(task.title);
                    setEditingTitle(false);
                  }
                }}
                className="text-base font-semibold"
                autoFocus
                maxLength={200}
              />
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={handleTitleSave}
              >
                <Check className="size-3.5" />
              </Button>
            </div>
          ) : (
            <DialogTitle
              className="cursor-text pr-8 text-base"
              onClick={() => setEditingTitle(true)}
            >
              {task.title}
            </DialogTitle>
          )}
        </DialogHeader>

        <div className="flex flex-col gap-5 py-2">
          {/* Description */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Description
            </Label>
            <Textarea
              value={descValue}
              onChange={(e) => setDescValue(e.target.value)}
              onBlur={handleDescriptionBlur}
              placeholder="Add a description…"
              rows={4}
              maxLength={5000}
              className="resize-none"
            />
          </div>

          {/* Priority */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Priority
            </Label>
            <Select value={priority} onValueChange={handlePriorityChange}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(PRIORITIES) as [Priority, (typeof PRIORITIES)[Priority]][]).map(
                  ([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <span className={config.color}>{config.label}</span>
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Due Date */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Due Date
            </Label>
            <div className="flex items-center gap-1.5">
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      className={cn(
                        "w-48 justify-start gap-2 text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    />
                  }
                >
                  <CalendarIcon className="size-4" />
                  {dueDate
                    ? format(dueDate, "MMM d, yyyy")
                    : "Set due date"}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={handleDateChange}
                  />
                </PopoverContent>
              </Popover>
              {dueDate && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleClearDate}
                >
                  <X className="size-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Labels */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Labels
            </Label>
            {boardLabels.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {boardLabels.map((label) => {
                  const isSelected = selectedLabelIds.includes(label.id);
                  return (
                    <button
                      key={label.id}
                      onClick={() => handleLabelToggle(label.id)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all",
                        isSelected
                          ? "text-white ring-2 ring-offset-1 ring-offset-background"
                          : "opacity-50 hover:opacity-80 text-white"
                      )}
                      style={{
                        backgroundColor: label.color,
                        ...(isSelected
                          ? { ringColor: label.color }
                          : {}),
                      }}
                    >
                      {isSelected && <Check className="size-3" />}
                      {label.name}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No labels available for this board.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="flex-row items-center justify-between">
          {/* Timestamps */}
          <div className="flex flex-col gap-0.5 text-[11px] text-muted-foreground">
            <span>Created {formatRelativeTime(task.created_at)}</span>
            <span>Updated {formatRelativeTime(task.updated_at)}</span>
          </div>

          {/* Delete */}
          <div className="flex items-center gap-2">
            {confirmDelete ? (
              <>
                <span className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="size-3" />
                  Confirm?
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? "Deleting…" : "Delete"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(true)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
                Delete
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
