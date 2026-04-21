"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SubtaskDTO } from "@/lib/task-types";

type SubtaskListProps = {
  subtasks: SubtaskDTO[];
  disabled?: boolean;
  onToggle: (subtask: SubtaskDTO) => Promise<void>;
  onDelete: (subtask: SubtaskDTO) => Promise<void>;
};

export function SubtaskList({
  subtasks,
  disabled = false,
  onToggle,
  onDelete,
}: SubtaskListProps) {
  if (subtasks.length === 0) {
    return (
      <p className="rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground">
        No subtasks yet.
      </p>
    );
  }

  return (
    <ul className="grid gap-2">
      {subtasks.map((subtask) => (
        <li
          key={subtask.id}
          className="flex min-h-11 items-center gap-3 rounded-md border bg-background px-3 py-2 transition-colors hover:bg-muted/40"
        >
          <input
            type="checkbox"
            checked={subtask.completed}
            disabled={disabled}
            aria-label={`Mark ${subtask.title} ${subtask.completed ? "open" : "complete"}`}
            className="size-4 rounded border-input accent-primary transition-opacity disabled:opacity-50"
            onChange={() => onToggle(subtask)}
          />
          <span
            className={
              subtask.completed
                ? "flex-1 break-words text-sm text-muted-foreground line-through"
                : "flex-1 break-words text-sm"
            }
          >
            {subtask.title}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            aria-label={`Delete ${subtask.title}`}
            onClick={() => onDelete(subtask)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
