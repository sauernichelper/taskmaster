"use client";

import type { ComponentType } from "react";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  CircleDashed,
  FileText,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatTaskDate } from "@/lib/date-format";
import type { SubtaskDTO, TaskDTO } from "@/lib/task-types";

import { SubtaskForm } from "./SubtaskForm";
import { SubtaskList } from "./SubtaskList";

type TaskDetailProps = {
  open: boolean;
  task: TaskDTO | null;
  subtaskBusy: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateSubtask: (task: TaskDTO, title: string) => Promise<void>;
  onToggleSubtask: (subtask: SubtaskDTO) => Promise<void>;
  onDeleteSubtask: (subtask: SubtaskDTO) => Promise<void>;
};

type TaskPdfPreviewComponent = ComponentType<{ filePath: string }>;

function getTaskStatus(task: TaskDTO) {
  if (task.completed) {
    return { icon: CheckCircle2, label: "Done", variant: "success" as const };
  }

  if (task.subtasks.some((subtask) => subtask.completed)) {
    return {
      icon: CircleDashed,
      label: "In Progress",
      variant: "warning" as const,
    };
  }

  return { icon: Circle, label: "Open", variant: "secondary" as const };
}

export function TaskDetail({
  open,
  task,
  subtaskBusy,
  onOpenChange,
  onCreateSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}: TaskDetailProps) {
  const [shouldRenderPdf, setShouldRenderPdf] = useState(false);
  const [TaskPdfPreview, setTaskPdfPreview] =
    useState<TaskPdfPreviewComponent | null>(null);

  useEffect(() => {
    let cancelled = false;
    const canRenderPdf =
      open && Boolean(task?.pdfPath) && typeof window !== "undefined";

    setShouldRenderPdf(canRenderPdf);

    if (!canRenderPdf || TaskPdfPreview) {
      return () => {
        cancelled = true;
      };
    }

    void import("@/components/pdf/TaskPdfPreview").then((mod) => {
      if (!cancelled) {
        setTaskPdfPreview(() => mod.TaskPdfPreview);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [open, task?.pdfPath, TaskPdfPreview]);

  if (!task) {
    return null;
  }

  const completedSubtasks = task.subtasks.filter(
    (subtask) => subtask.completed,
  ).length;
  const status = getTaskStatus(task);
  const StatusIcon = status.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={status.variant} className="gap-1">
              <StatusIcon className="size-3" />
              {status.label}
            </Badge>
            {task.pdfPath ? (
              <Badge variant="outline" className="gap-1">
                <FileText className="size-3" />
                PDF
              </Badge>
            ) : null}
          </div>
          <DialogTitle className="leading-7">{task.title}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6">
          <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {task.description ?? "No description added."}
          </p>

          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5" />
              Created {formatTaskDate(task.createdAt)}
            </span>
            <span>Updated {formatTaskDate(task.updatedAt)}</span>
          </div>

          <section className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">Subtasks</h3>
              <span className="text-xs text-muted-foreground">
                {completedSubtasks} of {task.subtasks.length} completed
              </span>
            </div>
            <SubtaskList
              subtasks={task.subtasks}
              disabled={subtaskBusy}
              onToggle={onToggleSubtask}
              onDelete={onDeleteSubtask}
            />
            <SubtaskForm
              disabled={subtaskBusy}
              onSubmit={(title) => onCreateSubtask(task, title)}
            />
          </section>

          {shouldRenderPdf && task.pdfPath && TaskPdfPreview ? (
            <TaskPdfPreview filePath={task.pdfPath} />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
