"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, Filter, X, Calendar, Tag, AlertCircle } from "lucide-react";
import { PRIORITIES } from "@/constants";
import { useBoardStore } from "@/store/boardStore";
import type { Priority } from "@/types";

export interface BoardFiltersState {
  search: string;
  priority: Priority | "all";
  dueDate: "all" | "overdue" | "today" | "this-week" | "no-date";
  labelIds: string[];
}

interface BoardFiltersProps {
  filters: BoardFiltersState;
  onFiltersChange: (filters: BoardFiltersState) => void;
}

export function BoardFilters({ filters, onFiltersChange }: BoardFiltersProps) {
  const { labels } = useBoardStore();
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = [
    filters.priority !== "all",
    filters.dueDate !== "all",
    filters.labelIds.length > 0,
  ].filter(Boolean).length;

  const clearFilters = () => {
    onFiltersChange({
      search: filters.search,
      priority: "all",
      dueDate: "all",
      labelIds: [],
    });
  };

  const toggleLabel = (labelId: string) => {
    const newLabelIds = filters.labelIds.includes(labelId)
      ? filters.labelIds.filter((id) => id !== labelId)
      : [...filters.labelIds, labelId];
    onFiltersChange({ ...filters, labelIds: newLabelIds });
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          value={filters.search}
          onChange={(e) =>
            onFiltersChange({ ...filters, search: e.target.value })
          }
          className="pl-9 h-9 text-sm"
        />
        {filters.search && (
          <button
            onClick={() => onFiltersChange({ ...filters, search: "" })}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Filter Toggle */}
      <Popover open={showFilters} onOpenChange={setShowFilters}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className={`h-9 gap-1.5 ${
                activeFilterCount > 0
                  ? "border-primary/50 text-primary"
                  : ""
              }`}
            />
          }
        >
            <Filter className="h-3.5 w-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <Badge
                variant="secondary"
                className="h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground"
              >
                {activeFilterCount}
              </Badge>
            )}
        </PopoverTrigger>
        <PopoverContent className="w-72 p-4" align="end">
          <div className="space-y-4">
            {/* Priority Filter */}
            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-2">
                <AlertCircle className="h-3 w-3" />
                Priority
              </label>
              <Select
                value={filters.priority}
                onValueChange={(value) => {
                  if (value !== null) {
                    onFiltersChange({
                      ...filters,
                      priority: value as Priority | "all",
                    });
                  }
                }}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priorities</SelectItem>
                  {Object.entries(PRIORITIES).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            key === "low"
                              ? "bg-emerald-400"
                              : key === "medium"
                              ? "bg-amber-400"
                              : "bg-rose-400"
                          }`}
                        />
                        {config.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Due Date Filter */}
            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-2">
                <Calendar className="h-3 w-3" />
                Due Date
              </label>
              <Select
                value={filters.dueDate}
                onValueChange={(value) => {
                  if (value !== null) {
                    onFiltersChange({
                      ...filters,
                      dueDate: value as BoardFiltersState["dueDate"],
                    });
                  }
                }}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All dates</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="today">Due today</SelectItem>
                  <SelectItem value="this-week">Due this week</SelectItem>
                  <SelectItem value="no-date">No due date</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Labels Filter */}
            {labels.length > 0 && (
              <div>
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-2">
                  <Tag className="h-3 w-3" />
                  Labels
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {labels.map((label) => (
                    <button
                      key={label.id}
                      onClick={() => toggleLabel(label.id)}
                      className={`text-xs px-2 py-1 rounded-full border transition-all ${
                        filters.labelIds.includes(label.id)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <span
                        className="inline-block h-2 w-2 rounded-full mr-1"
                        style={{ backgroundColor: label.color }}
                      />
                      {label.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Clear */}
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-8 text-xs"
                onClick={clearFilters}
              >
                Clear all filters
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {filters.priority !== "all" && (
            <Badge
              variant="secondary"
              className="text-xs gap-1 cursor-pointer hover:bg-destructive/10"
              onClick={() =>
                onFiltersChange({ ...filters, priority: "all" })
              }
            >
              {PRIORITIES[filters.priority].label}
              <X className="h-2.5 w-2.5" />
            </Badge>
          )}
          {filters.dueDate !== "all" && (
            <Badge
              variant="secondary"
              className="text-xs gap-1 cursor-pointer hover:bg-destructive/10"
              onClick={() =>
                onFiltersChange({ ...filters, dueDate: "all" })
              }
            >
              {filters.dueDate.replace("-", " ")}
              <X className="h-2.5 w-2.5" />
            </Badge>
          )}
          {filters.labelIds.map((id) => {
            const label = labels.find((l) => l.id === id);
            return label ? (
              <Badge
                key={id}
                variant="secondary"
                className="text-xs gap-1 cursor-pointer hover:bg-destructive/10"
                onClick={() => toggleLabel(id)}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: label.color }}
                />
                {label.name}
                <X className="h-2.5 w-2.5" />
              </Badge>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}
