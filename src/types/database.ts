// ============================================================
// Database Types — mirrors supabase/schema.sql
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at">;
        Update: Partial<Omit<Profile, "id" | "created_at">>;
      };
      boards: {
        Row: Board;
        Insert: Omit<Board, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Board, "id" | "created_at">>;
      };
      board_members: {
        Row: BoardMember;
        Insert: Omit<BoardMember, "id" | "invited_at">;
        Update: Partial<Omit<BoardMember, "id">>;
      };
      columns: {
        Row: Column;
        Insert: Omit<Column, "id" | "created_at">;
        Update: Partial<Omit<Column, "id" | "created_at">>;
      };
      labels: {
        Row: Label;
        Insert: Omit<Label, "id">;
        Update: Partial<Omit<Label, "id">>;
      };
      tasks: {
        Row: Task;
        Insert: Omit<Task, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Task, "id" | "created_at">>;
      };
      task_labels: {
        Row: TaskLabel;
        Insert: TaskLabel;
        Update: Partial<TaskLabel>;
      };
      activity_log: {
        Row: ActivityLog;
        Insert: Omit<ActivityLog, "id" | "created_at">;
        Update: Partial<Omit<ActivityLog, "id" | "created_at">>;
      };
    };
    Functions: {
      is_board_member: {
        Args: { board_uuid: string };
        Returns: boolean;
      };
    };
  };
}

// ============================================================
// Table Row Types
// ============================================================

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Board {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface BoardMember {
  id: string;
  board_id: string;
  user_id: string;
  role: "owner" | "member";
  invited_at: string;
}

export interface Column {
  id: string;
  board_id: string;
  name: string;
  position: number;
  created_at: string;
}

export interface Label {
  id: string;
  board_id: string;
  name: string;
  color: string;
}

export type Priority = "low" | "medium" | "high";

export interface Task {
  id: string;
  column_id: string;
  title: string;
  description: string | null;
  priority: Priority;
  due_date: string | null;
  position: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskLabel {
  task_id: string;
  label_id: string;
}

export interface ActivityLog {
  id: string;
  board_id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Json | null;
  created_at: string;
}
