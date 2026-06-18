import { create } from "zustand";
import type { ColumnWithTasks, TaskWithLabels, Label } from "@/types";

interface BoardState {
  columns: ColumnWithTasks[];
  labels: Label[];
  boardId: string | null;

  // Initialization
  setBoard: (
    boardId: string,
    columns: ColumnWithTasks[],
    labels: Label[]
  ) => void;
  clearBoard: () => void;

  // Column actions
  addColumn: (column: ColumnWithTasks) => void;
  removeColumn: (columnId: string) => void;
  renameColumn: (columnId: string, name: string) => void;
  reorderColumns: (orderedColumnIds: string[]) => void;
  setColumns: (columns: ColumnWithTasks[]) => void;

  // Task actions
  addTask: (columnId: string, task: TaskWithLabels) => void;
  updateTask: (taskId: string, updates: Partial<TaskWithLabels>) => void;
  removeTask: (taskId: string) => void;
  moveTask: (
    taskId: string,
    fromColumnId: string,
    toColumnId: string,
    newIndex: number
  ) => void;
  reorderTasks: (columnId: string, orderedTaskIds: string[]) => void;

  // Label actions
  setLabels: (labels: Label[]) => void;
  addLabel: (label: Label) => void;
  removeLabel: (labelId: string) => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  columns: [],
  labels: [],
  boardId: null,

  setBoard: (boardId, columns, labels) => set({ boardId, columns, labels }),
  clearBoard: () => set({ columns: [], labels: [], boardId: null }),

  addColumn: (column) =>
    set((state) => ({ columns: [...state.columns, column] })),

  removeColumn: (columnId) =>
    set((state) => ({
      columns: state.columns.filter((c) => c.id !== columnId),
    })),

  renameColumn: (columnId, name) =>
    set((state) => ({
      columns: state.columns.map((c) =>
        c.id === columnId ? { ...c, name } : c
      ),
    })),

  reorderColumns: (orderedColumnIds) =>
    set((state) => {
      const colMap = new Map(state.columns.map((c) => [c.id, c]));
      const reordered = orderedColumnIds
        .map((id, index) => {
          const col = colMap.get(id);
          return col ? { ...col, position: index } : null;
        })
        .filter(Boolean) as ColumnWithTasks[];
      return { columns: reordered };
    }),

  setColumns: (columns) => set({ columns }),

  addTask: (columnId, task) =>
    set((state) => ({
      columns: state.columns.map((col) =>
        col.id === columnId ? { ...col, tasks: [...col.tasks, task] } : col
      ),
    })),

  updateTask: (taskId, updates) =>
    set((state) => ({
      columns: state.columns.map((col) => ({
        ...col,
        tasks: col.tasks.map((t) =>
          t.id === taskId ? { ...t, ...updates } : t
        ),
      })),
    })),

  removeTask: (taskId) =>
    set((state) => ({
      columns: state.columns.map((col) => ({
        ...col,
        tasks: col.tasks.filter((t) => t.id !== taskId),
      })),
    })),

  moveTask: (taskId, fromColumnId, toColumnId, newIndex) =>
    set((state) => {
      const fromCol = state.columns.find((c) => c.id === fromColumnId);
      const task = fromCol?.tasks.find((t) => t.id === taskId);
      if (!task) return state;

      const updatedTask = { ...task, column_id: toColumnId };

      return {
        columns: state.columns.map((col) => {
          if (col.id === fromColumnId) {
            return {
              ...col,
              tasks: col.tasks
                .filter((t) => t.id !== taskId)
                .map((t, i) => ({ ...t, position: i })),
            };
          }
          if (col.id === toColumnId) {
            const newTasks = [...col.tasks];
            newTasks.splice(newIndex, 0, updatedTask);
            return {
              ...col,
              tasks: newTasks.map((t, i) => ({ ...t, position: i })),
            };
          }
          return col;
        }),
      };
    }),

  reorderTasks: (columnId, orderedTaskIds) =>
    set((state) => ({
      columns: state.columns.map((col) => {
        if (col.id !== columnId) return col;
        const taskMap = new Map(col.tasks.map((t) => [t.id, t]));
        const reordered = orderedTaskIds
          .map((id, index) => {
            const task = taskMap.get(id);
            return task ? { ...task, position: index } : null;
          })
          .filter(Boolean) as TaskWithLabels[];
        return { ...col, tasks: reordered };
      }),
    })),

  setLabels: (labels) => set({ labels }),
  addLabel: (label) =>
    set((state) => ({ labels: [...state.labels, label] })),
  removeLabel: (labelId) =>
    set((state) => ({
      labels: state.labels.filter((l) => l.id !== labelId),
    })),
}));
