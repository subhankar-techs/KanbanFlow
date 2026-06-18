"use client";

import { useState, useCallback, useRef } from "react";
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
import type { TaskWithLabels, ColumnWithTasks } from "@/types";

export function useDragAndDrop() {
  const { moveTask, reorderTasks, reorderColumns, setColumns, setDraggedTaskId } = useBoardStore();
  const [activeTask, setActiveTask] = useState<TaskWithLabels | null>(null);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const dragStartColumnsSnapshot = useRef<ColumnWithTasks[] | null>(null);

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
        const columns = useBoardStore.getState().columns;
        dragStartColumnsSnapshot.current = columns;

        const task = columns
          .flatMap((c) => c.tasks)
          .find((t) => t.id === active.id);
        setActiveTask(task ?? null);
        setDraggedTaskId(active.id as string);
      } else if (activeData?.type === "column") {
        setActiveColumnId(active.id as string);
      }
    },
    [setDraggedTaskId]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeData = active.data.current;
      const overData = over.data.current;

      if (activeData?.type !== "task") return;

      const currentColumns = useBoardStore.getState().columns;
      const activeTaskColumn = currentColumns.find((c) =>
        c.tasks.some((t) => t.id === active.id)
      );
      const fromColumnId = activeTaskColumn?.id;
      const toColumnId = overData?.columnId as string;

      if (!fromColumnId || !toColumnId || fromColumnId === toColumnId) return;

      const overColumn = currentColumns.find((c) => c.id === toColumnId);
      if (!overColumn) return;

      const overIndex =
        overData?.type === "task"
          ? overColumn.tasks.findIndex((t) => t.id === over.id)
          : overColumn.tasks.length;

      moveTask(active.id as string, fromColumnId, toColumnId, overIndex);
    },
    [moveTask]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);
      setActiveColumnId(null);
      setDraggedTaskId(null);

      if (!over) {
        if (dragStartColumnsSnapshot.current) {
          setColumns(dragStartColumnsSnapshot.current);
        }
        return;
      }

      const activeData = active.data.current;
      const overData = over.data.current;

      if (activeData?.type === "task") {
        const overColumnId = overData?.columnId as string;

        if (!overColumnId) {
          if (dragStartColumnsSnapshot.current) {
            setColumns(dragStartColumnsSnapshot.current);
          }
          return;
        }

        const originalCol = dragStartColumnsSnapshot.current?.find((c) =>
          c.tasks.some((t) => t.id === active.id)
        );
        const originalColumnId = originalCol?.id;

        const currentColumns = useBoardStore.getState().columns;
        const finalCol = currentColumns.find((c) =>
          c.tasks.some((t) => t.id === active.id)
        );
        const finalColumnId = finalCol?.id;

        if (!originalColumnId || !finalColumnId) return;

        const isCrossColumn = originalColumnId !== finalColumnId;

        if (!isCrossColumn) {
          if (active.id !== over.id && finalCol) {
            const taskIds = finalCol.tasks.map((t) => t.id);
            const oldIndex = taskIds.indexOf(active.id as string);
            const newIndex = overData?.type === "task"
              ? taskIds.indexOf(over.id as string)
              : taskIds.length - 1;

            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
              const reordered = [...taskIds];
              reordered.splice(oldIndex, 1);
              reordered.splice(newIndex, 0, active.id as string);
              reorderTasks(originalColumnId, reordered);

              const updatedCol = useBoardStore.getState().columns.find((c) => c.id === originalColumnId);
              if (updatedCol) {
                try {
                  const updates = updatedCol.tasks.map((t, idx) => ({
                    id: t.id,
                    column_id: originalColumnId,
                    position: idx,
                  }));
                  await taskService.updateTaskPositions(updates);
                } catch (error) {
                  console.error("Failed to reorder tasks:", error);
                  if (dragStartColumnsSnapshot.current) {
                    setColumns(dragStartColumnsSnapshot.current);
                  }
                }
              }
            }
          }
        } else {
          const sourceCol = currentColumns.find((c) => c.id === originalColumnId);
          const targetCol = currentColumns.find((c) => c.id === finalColumnId);

          const updates: { id: string; column_id: string; position: number }[] = [];

          if (sourceCol) {
            sourceCol.tasks.forEach((t, idx) => {
              updates.push({ id: t.id, column_id: originalColumnId, position: idx });
            });
          }
          if (targetCol) {
            targetCol.tasks.forEach((t, idx) => {
              updates.push({ id: t.id, column_id: finalColumnId, position: idx });
            });
          }

          try {
            await taskService.updateTaskPositions(updates);
          } catch (error) {
            console.error("Failed to move task:", error);
            if (dragStartColumnsSnapshot.current) {
              setColumns(dragStartColumnsSnapshot.current);
            }
          }
        }
      } else if (activeData?.type === "column") {
        if (active.id !== over.id) {
          const currentColumns = useBoardStore.getState().columns;
          const columnIds = currentColumns.map((c) => c.id);
          const oldIndex = columnIds.indexOf(active.id as string);
          const newIndex = columnIds.indexOf(over.id as string);

          if (oldIndex === -1 || newIndex === -1) return;

          const reordered = [...columnIds];
          reordered.splice(oldIndex, 1);
          reordered.splice(newIndex, 0, active.id as string);
          reorderColumns(reordered);

          try {
            await columnService.reorderColumns(
              currentColumns[0]?.board_id,
              reordered.map((id, i) => ({ id, position: i }))
            );
          } catch (error) {
            console.error("Failed to reorder columns:", error);
            reorderColumns(columnIds);
          }
        }
      }
    },
    [reorderTasks, reorderColumns, setColumns, setDraggedTaskId]
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
