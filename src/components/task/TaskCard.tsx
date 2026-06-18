"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PRIORITIES } from "@/constants";
import { cn } from "@/lib/utils";
import { formatDate, isOverdue, isDueToday, truncate } from "@/utils";
import { Calendar, Tag } from "lucide-react";
import type { TaskWithLabels } from "@/types";

interface TaskCardProps {
  task: TaskWithLabels;
  onOpen: () => void;
  isDragOverlay?: boolean;
}

export function TaskCard({ task, onOpen, isDragOverlay }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "task",
      columnId: task.column_id,
    },
    disabled: isDragOverlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priority = PRIORITIES[task.priority];
  const overdue = isOverdue(task.due_date);
  const dueToday = isDueToday(task.due_date);

  const dueDateColor = overdue
    ? "text-rose-500"
    : dueToday
      ? "text-amber-500"
      : "text-muted-foreground";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        // Only open if not dragging
        if (!isDragging) {
          e.stopPropagation();
          onOpen();
        }
      }}
      className={cn(
        "group cursor-pointer rounded-lg border border-border/40 bg-card p-3",
        "transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-md hover:border-border/60",
        isDragging && "dragging-source",
        isDragOverlay && "shadow-xl"
      )}
      role="button"
      tabIndex={0}
      aria-label={`Task: ${task.title}`}
    >
      {/* Labels */}
      {task.labels.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {task.labels.map((label) => (
            <span
              key={label.id}
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
              style={{ backgroundColor: label.color }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <p className="text-sm font-medium leading-snug text-foreground">
        {truncate(task.title, 80)}
      </p>

      {/* Description preview */}
      {task.description && (
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {truncate(task.description, 80)}
        </p>
      )}

      {/* Meta row */}
      <div className="mt-2.5 flex items-center gap-2">
        {/* Priority */}
        <span
          className={cn(
            "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium",
            priority.bgColor,
            priority.color,
            "border",
            priority.borderColor
          )}
        >
          {priority.label}
        </span>

        {/* Due date */}
        {task.due_date && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[11px]",
              dueDateColor
            )}
          >
            <Calendar className="size-3" />
            {formatDate(task.due_date)}
          </span>
        )}
      </div>
    </div>
  );
}
