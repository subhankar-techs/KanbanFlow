"use client";

import { useState, useRef, useCallback } from "react";
import {
  useSortable,
} from "@dnd-kit/sortable";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useBoardStore } from "@/store/boardStore";
import * as columnService from "@/services/columnService";
import { TaskCard } from "@/components/task/TaskCard";
import { CreateTaskDialog } from "@/components/task/CreateTaskDialog";
import { TaskDetailDialog } from "@/components/task/TaskDetailDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  Trash2,
  Edit,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getNextPosition } from "@/utils";
import type { ColumnWithTasks, TaskWithLabels } from "@/types";

interface ColumnProps {
  column: ColumnWithTasks;
}

export function Column({ column }: ColumnProps) {
  const { renameColumn: renameColumnStore, removeColumn: removeColumnStore } =
    useBoardStore();

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(column.name);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithLabels | null>(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Sortable for the column itself
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: "column",
      columnId: column.id,
    },
  });

  // Droppable for the task list area
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `column-droppable-${column.id}`,
    data: {
      type: "column",
      columnId: column.id,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const taskIds = column.tasks.map((t) => t.id);
  const nextTaskPosition = getNextPosition(column.tasks);

  const handleRename = useCallback(async () => {
    if (!nameValue.trim() || nameValue.trim() === column.name) {
      setNameValue(column.name);
      setEditingName(false);
      return;
    }

    try {
      await columnService.updateColumn(column.id, {
        name: nameValue.trim(),
      });
      renameColumnStore(column.id, nameValue.trim());
      toast.success("Column renamed");
    } catch {
      toast.error("Failed to rename column");
      setNameValue(column.name);
    }
    setEditingName(false);
  }, [column.id, column.name, nameValue, renameColumnStore]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await columnService.deleteColumn(column.id);
      removeColumnStore(column.id);
      toast.success("Column deleted");
    } catch {
      toast.error("Failed to delete column");
    }
    setDeleting(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRename();
    } else if (e.key === "Escape") {
      setNameValue(column.name);
      setEditingName(false);
    }
  };

  const handleOpenTask = (task: TaskWithLabels) => {
    setSelectedTask(task);
    setTaskDetailOpen(true);
  };

  return (
    <div
      ref={setSortableRef}
      style={style}
      className={cn(
        "flex min-w-[300px] max-w-[300px] flex-shrink-0 flex-col rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm",
        "transition-shadow duration-200",
        isDragging && "dragging-source",
        isOver && "border-primary/40 shadow-lg shadow-primary/5"
      )}
    >
      {/* Column Header */}
      <div className="flex items-center gap-2 px-3 py-3">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none rounded p-0.5 text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
          aria-label="Drag column"
        >
          <GripVertical className="size-4" />
        </button>

        {/* Column Name */}
        {editingName ? (
          <Input
            ref={inputRef}
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={handleRename}
            onKeyDown={handleNameKeyDown}
            className="h-7 flex-1 text-sm font-semibold"
            autoFocus
            maxLength={30}
          />
        ) : (
          <button
            onDoubleClick={() => setEditingName(true)}
            className="flex-1 truncate text-left text-sm font-semibold text-foreground"
            title="Double-click to rename"
          >
            {column.name}
          </button>
        )}

        {/* Task Count */}
        <Badge
          variant="secondary"
          className="pointer-events-none text-xs tabular-nums"
        >
          {column.tasks.length}
        </Badge>

        {/* Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground hover:text-foreground"
              />
            }
          >
            <MoreHorizontal className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={4}>
            <DropdownMenuItem onClick={() => setEditingName(true)}>
              <Edit className="size-3.5" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="size-3.5" />
              {deleting ? "Deleting…" : "Delete"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Task List */}
      <div
        ref={setDroppableRef}
        className={cn(
          "custom-scrollbar flex flex-1 flex-col gap-2 overflow-y-auto px-3 pb-2",
          "min-h-[80px]",
          isOver && "bg-primary/[0.02]"
        )}
      >
        <SortableContext
          items={taskIds}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onOpen={() => handleOpenTask(task)}
            />
          ))}
        </SortableContext>
      </div>

      {/* Add Task Button */}
      <div className="px-3 pb-3">
        <button
          onClick={() => setCreateTaskOpen(true)}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          <Plus className="size-4" />
          Add task
        </button>
      </div>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        columnId={column.id}
        position={nextTaskPosition}
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
      />

      {/* Task Detail Dialog */}
      <TaskDetailDialog
        task={selectedTask}
        open={taskDetailOpen}
        onOpenChange={(open) => {
          setTaskDetailOpen(open);
          if (!open) setSelectedTask(null);
        }}
      />
    </div>
  );
}
