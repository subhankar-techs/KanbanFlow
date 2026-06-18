"use client";

import type { TaskWithLabels } from "@/types";
import { TaskCard } from "@/components/task/TaskCard";
import { cn } from "@/lib/utils";

interface DragOverlayContentProps {
  activeTask: TaskWithLabels | null;
}

export function DragOverlayContent({ activeTask }: DragOverlayContentProps) {
  if (!activeTask) return null;

  return (
    <div className={cn("drag-overlay w-[280px]")}>
      <TaskCard task={activeTask} onOpen={() => {}} isDragOverlay />
    </div>
  );
}
