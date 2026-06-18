"use client";

import { useState, useCallback } from "react";
import {
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  PointerSensor,
  KeyboardSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useBoardStore } from "@/store/boardStore";
import * as taskService from "@/services/taskService";
import * as columnService from "@/services/columnService";
import type { TaskWithLabels } from "@/types";

export function useDragAndDrop() {
  const { columns, moveTask, reorderTasks, reorderColumns } = useBoardStore();
  const [activeTask, setActiveTask] = useState<TaskWithLabels | null>(null);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const activeData = active.data.current;

      if (activeData?.type === "task") {
        const task = columns
          .flatMap((c) => c.tasks)
          .find((t) => t.id === active.id);
        setActiveTask(task ?? null);
      } else if (activeData?.type === "column") {
        setActiveColumnId(active.id as string);
      }
    },
    [columns]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeData = active.data.current;
      const overData = over.data.current;

      if (activeData?.type !== "task") return;

      const activeColumnId = activeData?.columnId as string;
      const overColumnId =
        overData?.type === "column"
          ? (over.id as string)
          : (overData?.columnId as string);

      if (!activeColumnId || !overColumnId) return;
      if (activeColumnId === overColumnId) return;

      // Moving task to a different column
      const overColumn = columns.find((c) => c.id === overColumnId);
      if (!overColumn) return;

      const overIndex =
        overData?.type === "task"
          ? overColumn.tasks.findIndex((t) => t.id === over.id)
          : overColumn.tasks.length;

      moveTask(active.id as string, activeColumnId, overColumnId, overIndex);
    },
    [columns, moveTask]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);
      setActiveColumnId(null);

      if (!over) return;

      const activeData = active.data.current;
      const overData = over.data.current;

      if (activeData?.type === "task") {
        const overColumnId =
          overData?.type === "column"
            ? (over.id as string)
            : (overData?.columnId as string);

        if (!overColumnId) return;

        const column = columns.find((c) => c.id === overColumnId);
        if (!column) return;

        // If same column, handle reorder
        if (activeData.columnId === overColumnId && active.id !== over.id) {
          const taskIds = column.tasks.map((t) => t.id);
          const oldIndex = taskIds.indexOf(active.id as string);
          const newIndex = taskIds.indexOf(over.id as string);

          if (oldIndex !== -1 && newIndex !== -1) {
            const reordered = [...taskIds];
            reordered.splice(oldIndex, 1);
            reordered.splice(newIndex, 0, active.id as string);
            reorderTasks(overColumnId, reordered);

            // Persist to DB
            try {
              await taskService.reorderTasks(
                overColumnId,
                reordered.map((id, i) => ({ id, position: i }))
              );
            } catch (error) {
              console.error("Failed to reorder tasks:", error);
            }
          }
        } else if (activeData.columnId !== overColumnId) {
          // Cross-column move — already handled in dragOver, persist to DB
          const task = column.tasks.find((t) => t.id === active.id);
          if (task) {
            try {
              await taskService.moveTask(
                active.id as string,
                overColumnId,
                task.position
              );
            } catch (error) {
              console.error("Failed to move task:", error);
            }
          }
        }
      } else if (activeData?.type === "column") {
        if (active.id !== over.id) {
          const columnIds = columns.map((c) => c.id);
          const oldIndex = columnIds.indexOf(active.id as string);
          const newIndex = columnIds.indexOf(over.id as string);

          if (oldIndex !== -1 && newIndex !== -1) {
            const reordered = [...columnIds];
            reordered.splice(oldIndex, 1);
            reordered.splice(newIndex, 0, active.id as string);
            reorderColumns(reordered);

            try {
              await columnService.reorderColumns(
                columns[0]?.board_id,
                reordered.map((id, i) => ({ id, position: i }))
              );
            } catch (error) {
              console.error("Failed to reorder columns:", error);
            }
          }
        }
      }
    },
    [columns, reorderTasks, reorderColumns]
  );

  return {
    sensors,
    activeTask,
    activeColumnId,
    collisionDetection: closestCorners,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
}
