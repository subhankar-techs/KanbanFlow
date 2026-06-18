// ============================================================
// Extended / Composite Types
// ============================================================

export type {
  Database,
  Profile,
  Board,
  BoardMember,
  Column,
  Label,
  Task,
  TaskLabel,
  ActivityLog,
  Priority,
  Json,
} from "./database";

import type {
  Board,
  Column,
  Task,
  Label,
  Profile,
  BoardMember,
  ActivityLog,
} from "./database";

/** Task with its associated labels */
export interface TaskWithLabels extends Task {
  labels: Label[];
}

/** Column with its tasks (including labels) */
export interface ColumnWithTasks extends Column {
  tasks: TaskWithLabels[];
}

/** Board with all columns and tasks loaded */
export interface BoardWithColumns extends Board {
  columns: ColumnWithTasks[];
  labels: Label[];
}

/** Board card in dashboard — includes member count */
export interface BoardSummary extends Board {
  member_count: number;
  task_count: number;
}

/** Board member with profile info */
export interface BoardMemberWithProfile extends BoardMember {
  profile: Profile;
}

/** Activity log entry with user profile */
export interface ActivityLogWithUser extends ActivityLog {
  profile: Profile | null;
}

/** Drag item types for dnd-kit */
export type DragItemType = "column" | "task";

export interface DragItem {
  id: string;
  type: DragItemType;
  columnId?: string;
}
