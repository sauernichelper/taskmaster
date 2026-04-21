"use client";

import {
  CalendarDays,
  CheckCircle2,
  Circle,
  CircleDashed,
  FileText,
} from "lucide-react";
import dynamic from "next/dynamic";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SubtaskDTO, TaskDTO } from "@/lib/task-types";

import { SubtaskForm } from "./SubtaskForm";
import { SubtaskList } from "./SubtaskList";

const PDFViewer = dynamic(
  () => import("@/components/pdf/PDFViewer").then((mod) => mod.PDFViewer),
  { ssr: false },
);

type TaskDetailProps = {
  open: boolean;
  task: TaskDTO | null;
  subtaskBusy: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateSubtask: (task: TaskDTO, title: string) => Promise<void>;
  onToggleSubtask: (subtask: SubtaskDTO) => Promise<void>;
  onDeleteSubtask: (subtask: SubtaskDTO) => Promise<void>;
};

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

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
              Created {dateFormatter.format(new Date(task.createdAt))}
            </span>
            <span>Updated {dateFormatter.format(new Date(task.updatedAt))}</span>
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

          {task.pdfPath ? <PDFViewer filePath={task.pdfPath} /> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
