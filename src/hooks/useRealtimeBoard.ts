"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useBoardStore } from "@/store/boardStore";
import type { Column, Task } from "@/types";

export function useRealtimeBoard(boardId: string | null) {
  const { addColumn, removeColumn, setColumns, addTask, removeTask } =
    useBoardStore();

  useEffect(() => {
    if (!boardId) return;

    const supabase = createClient();

    // Subscribe to column changes
    const columnsChannel = supabase
      .channel(`board-columns-${boardId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "columns",
          filter: `board_id=eq.${boardId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newCol = payload.new as Column;
            const exists = useBoardStore
              .getState()
              .columns.find((c) => c.id === newCol.id);
            if (!exists) {
              addColumn({ ...newCol, tasks: [] });
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedCol = payload.new as Column;
            const currentColumns = useBoardStore.getState().columns;
            setColumns(
              currentColumns.map((c) =>
                c.id === updatedCol.id
                  ? { ...c, name: updatedCol.name, position: updatedCol.position }
                  : c
              )
            );
          } else if (payload.eventType === "DELETE") {
            const oldCol = payload.old as { id: string };
            removeColumn(oldCol.id);
          }
        }
      )
      .subscribe();

    // Subscribe to task changes for all columns in this board
    const tasksChannel = supabase
      .channel(`board-tasks-${boardId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
        },
        (payload) => {
          const currentColumns = useBoardStore.getState().columns;
          const columnIds = currentColumns.map((c) => c.id);

          if (payload.eventType === "INSERT") {
            const newTask = payload.new as Task;
            if (columnIds.includes(newTask.column_id)) {
              const exists = currentColumns
                .flatMap((c) => c.tasks)
                .find((t) => t.id === newTask.id);
              if (!exists) {
                addTask(newTask.column_id, { ...newTask, labels: [] });
              }
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedTask = payload.new as Task;
            if (!columnIds.includes(updatedTask.column_id)) {
              const { removeTask } = useBoardStore.getState();
              removeTask(updatedTask.id);
              return;
            }

            const { columns: cols, updateTask, addTask } = useBoardStore.getState();
            const currentCol = cols.find((c) =>
              c.tasks.some((t) => t.id === updatedTask.id)
            );

            if (!currentCol) {
              addTask(updatedTask.column_id, { ...updatedTask, labels: [] });
            } else {
              const { draggedTaskId } = useBoardStore.getState();
              if (draggedTaskId === updatedTask.id) return;
              updateTask(updatedTask.id, updatedTask);
            }
          } else if (payload.eventType === "DELETE") {
            const oldTask = payload.old as { id: string };
            removeTask(oldTask.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(columnsChannel);
      supabase.removeChannel(tasksChannel);
    };
  // Stable store action refs + boardId only — never re-subscribe on column/task data changes
  }, [boardId, addColumn, removeColumn, setColumns, addTask, removeTask]);
}
