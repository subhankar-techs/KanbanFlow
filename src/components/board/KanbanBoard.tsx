"use client";

import { useState } from "react";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useBoardStore } from "@/store/boardStore";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { Column } from "@/components/column/Column";
import { CreateColumnDialog } from "@/components/column/CreateColumnDialog";
import { DragOverlayContent } from "@/components/board/DragOverlay";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getNextPosition } from "@/utils";

export function KanbanBoard() {
  const { columns, boardId } = useBoardStore();
  const {
    sensors,
    activeTask,
    collisionDetection,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  } = useDragAndDrop();

  const [createColumnOpen, setCreateColumnOpen] = useState(false);

  const columnIds = columns.map((col) => col.id);
  const nextPosition = getNextPosition(columns);

  return (
    <div className="flex h-full flex-col">
      {/* Board content */}
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="custom-scrollbar flex flex-1 gap-5 overflow-x-auto overflow-y-hidden px-4 py-4 sm:px-6">
          <SortableContext
            items={columnIds}
            strategy={horizontalListSortingStrategy}
          >
            {columns.map((column) => (
              <Column key={column.id} column={column} />
            ))}
          </SortableContext>

          {/* Add Column button */}
          <button
            onClick={() => setCreateColumnOpen(true)}
            className="group flex h-fit min-w-[280px] flex-shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/60 bg-card/30 px-6 py-10 text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
          >
            <Plus className="size-5 transition-transform group-hover:scale-110" />
            <span className="text-sm font-medium">Add Column</span>
          </button>
        </div>

        {/* Drag Overlay */}
        <DragOverlay dropAnimation={null}>
          <DragOverlayContent activeTask={activeTask} />
        </DragOverlay>
      </DndContext>

      {/* Create Column Dialog */}
      {boardId && (
        <CreateColumnDialog
          boardId={boardId}
          position={nextPosition}
          open={createColumnOpen}
          onOpenChange={setCreateColumnOpen}
        />
      )}
    </div>
  );
}
