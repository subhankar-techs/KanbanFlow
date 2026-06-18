import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isPast, isToday, isThisWeek } from "date-fns";

/**
 * Merge Tailwind classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string for display
 */
export function formatDate(date: string | null): string {
  if (!date) return "";
  return format(new Date(date), "MMM d, yyyy");
}

/**
 * Format a date as relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

/**
 * Check if a due date is overdue
 */
export function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return isPast(new Date(dueDate)) && !isToday(new Date(dueDate));
}

/**
 * Check if a due date is today
 */
export function isDueToday(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return isToday(new Date(dueDate));
}

/**
 * Check if a due date is this week
 */
export function isDueThisWeek(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return isThisWeek(new Date(dueDate));
}

/**
 * Generate initials from a name or email
 */
export function getInitials(name: string | null, email?: string): string {
  const source = name || email || "?";
  const parts = source.split(/[\s@]+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

/**
 * Truncate text to a max length
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}

/**
 * Generate a random pastel color
 */
export function randomPastelColor(): string {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 60%)`;
}

/**
 * Calculate next position for a new item in a sorted list
 */
export function getNextPosition(items: { position: number }[]): number {
  if (items.length === 0) return 0;
  return Math.max(...items.map((i) => i.position)) + 1;
}

/**
 * Reorder items and return new position values
 */
export function reorderPositions<T extends { id: string; position: number }>(
  items: T[],
  activeId: string,
  overId: string
): { id: string; position: number }[] {
  const oldIndex = items.findIndex((i) => i.id === activeId);
  const newIndex = items.findIndex((i) => i.id === overId);

  if (oldIndex === -1 || newIndex === -1) return [];

  const reordered = [...items];
  const [removed] = reordered.splice(oldIndex, 1);
  reordered.splice(newIndex, 0, removed);

  return reordered.map((item, index) => ({
    id: item.id,
    position: index,
  }));
}
