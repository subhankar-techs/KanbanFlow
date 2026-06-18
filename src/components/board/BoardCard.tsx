"use client";

import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/utils";
import type { Board } from "@/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface BoardCardProps {
  board: Board;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}

export function BoardCard({ board, index, onEdit, onDelete }: BoardCardProps) {
  const router = useRouter();

  return (
    <Card
      className={cn(
        "group/board relative cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5",
        "animate-scale-in opacity-0"
      )}
      style={{ animationDelay: `${index * 0.06}s`, animationFillMode: "forwards" }}
      onClick={() => router.push(`/board/${board.id}`)}
    >
      {/* Gradient accent strip */}
      <div className="h-[3px] w-full rounded-t-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400" />

      <CardHeader>
        <CardTitle className="truncate pr-6">{board.name}</CardTitle>

        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="opacity-0 transition-opacity group-hover/board:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                />
              }
            >
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Board actions</span>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" sideOffset={4}>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Pencil className="size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>

        {board.description && (
          <CardDescription className="line-clamp-2">
            {board.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent>
        <p className="text-xs text-muted-foreground">
          Updated {formatRelativeTime(board.updated_at)}
        </p>
      </CardContent>
    </Card>
  );
}
