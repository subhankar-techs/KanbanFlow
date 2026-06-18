import type { Priority } from "@/types";

// ============================================================
// Priority Configuration
// ============================================================

export const PRIORITIES: Record<
  Priority,
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  low: {
    label: "Low",
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
    borderColor: "border-emerald-400/30",
  },
  medium: {
    label: "Medium",
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
    borderColor: "border-amber-400/30",
  },
  high: {
    label: "High",
    color: "text-rose-400",
    bgColor: "bg-rose-400/10",
    borderColor: "border-rose-400/30",
  },
};

// ============================================================
// Default Columns
// ============================================================

export const DEFAULT_COLUMNS = ["To Do", "In Progress", "Done"] as const;

// ============================================================
// Label Presets
// ============================================================

export const LABEL_PRESETS = [
  { name: "Bug", color: "#EF4444" },
  { name: "Feature", color: "#8B5CF6" },
  { name: "Design", color: "#EC4899" },
  { name: "Research", color: "#06B6D4" },
  { name: "Improvement", color: "#F59E0B" },
  { name: "Documentation", color: "#10B981" },
] as const;

// ============================================================
// Label Colors (for custom labels)
// ============================================================

export const LABEL_COLORS = [
  "#EF4444", // Red
  "#F59E0B", // Amber
  "#10B981", // Emerald
  "#06B6D4", // Cyan
  "#3B82F6", // Blue
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#F97316", // Orange
  "#6366F1", // Indigo
  "#14B8A6", // Teal
] as const;

// ============================================================
// Routes
// ============================================================

export const ROUTES = {
  HOME: "/",
  LOGIN: "/sign-in",
  SIGNUP: "/sign-up",
  DASHBOARD: "/dashboard",
  BOARD: (id: string) => `/board/${id}`,
} as const;

// ============================================================
// Public Routes (no auth required)
// ============================================================

export const PUBLIC_ROUTES = [
  "/",
  "/sign-in",
  "/sign-up",
];

// ============================================================
// App Config
// ============================================================

export const APP_CONFIG = {
  name: "KanbanFlow",
  description: "A collaborative task management application",
  maxBoardNameLength: 50,
  maxColumnNameLength: 30,
  maxTaskTitleLength: 200,
  maxTaskDescriptionLength: 5000,
  activityPageSize: 20,
} as const;
