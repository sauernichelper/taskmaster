"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Circle,
  CircleDashed,
  Eye,
  FileText,
  Inbox,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { SubtaskDTO, TaskCreateInput, TaskDTO } from "@/lib/task-types";

import { TaskDetail } from "./TaskDetail";
import { TaskForm } from "./TaskForm";

type TaskListProps = {
  initialTasks: TaskDTO[];
};

type StatusFilter = "all" | "open" | "in-progress" | "done";

type TaskStatus = {
  icon: typeof Circle;
  label: "Open" | "In Progress" | "Done";
  variant: "secondary" | "warning" | "success";
};

const statusFilters: Array<{ label: string; value: StatusFilter }> = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in-progress" },
  { label: "Done", value: "done" },
];

const buttonDangerClassName =
  "gap-1.5 bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20";

async function parseTaskResponse(response: Response): Promise<TaskDTO> {
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(payload?.error ?? "Task request failed.");
  }

  return response.json() as Promise<TaskDTO>;
}

async function parseSubtaskResponse(response: Response): Promise<SubtaskDTO> {
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(payload?.error ?? "Subtask request failed.");
  }

  return response.json() as Promise<SubtaskDTO>;
}

function getSubtaskProgress(task: TaskDTO) {
  const total = task.subtasks.length;
  const completed = task.subtasks.filter((subtask) => subtask.completed).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { completed, percentage, total };
}

function getTaskStatus(task: TaskDTO): TaskStatus {
  if (task.completed) {
    return { icon: CheckCircle2, label: "Done", variant: "success" };
  }

  const hasStarted = task.subtasks.some((subtask) => subtask.completed);

  if (hasStarted) {
    return { icon: CircleDashed, label: "In Progress", variant: "warning" };
  }

  return { icon: Circle, label: "Open", variant: "secondary" };
}

function taskMatchesStatus(task: TaskDTO, statusFilter: StatusFilter) {
  if (statusFilter === "all") {
    return true;
  }

  const status = getTaskStatus(task);

  if (statusFilter === "done") {
    return status.label === "Done";
  }

  if (statusFilter === "in-progress") {
    return status.label === "In Progress";
  }

  return status.label === "Open";
}

function EmptyState({
  hasTasks,
  onClearFilters,
  onCreateTask,
}: {
  hasTasks: boolean;
  onClearFilters: () => void;
  onCreateTask: () => void;
}) {
  return (
    <Card className="border-dashed bg-background/70 transition-colors">
      <CardHeader className="items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Inbox className="size-5" />
        </div>
        <CardTitle>{hasTasks ? "No matching tasks" : "No tasks yet"}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm leading-6 text-muted-foreground">
        {hasTasks
          ? "Adjust the search or status filter to bring tasks back into view."
          : "Create your first task to start organizing the work."}
      </CardContent>
      <CardFooter className="gap-2">
        {hasTasks ? (
          <Button variant="outline" onClick={onClearFilters}>
            Clear filters
          </Button>
        ) : null}
        <Button onClick={onCreateTask}>
          <Plus className="size-4" />
          New Task
        </Button>
      </CardFooter>
    </Card>
  );
}

function sortSubtasks(subtasks: SubtaskDTO[]) {
  return [...subtasks].sort((first, second) => {
    if (first.completed !== second.completed) {
      return first.completed ? 1 : -1;
    }

    return (
      new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime()
    );
  });
}

export function TaskList({ initialTasks }: TaskListProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [editingTask, setEditingTask] = useState<TaskDTO | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskDTO | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<TaskDTO | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [subtaskBusy, setSubtaskBusy] = useState(false);
  const [taskActionId, setTaskActionId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(() => {
    const completed = tasks.filter((task) => getTaskStatus(task).label === "Done")
      .length;
    const inProgress = tasks.filter(
      (task) => getTaskStatus(task).label === "In Progress",
    ).length;
    const open = tasks.filter((task) => getTaskStatus(task).label === "Open")
      .length;

    return {
      completed,
      inProgress,
      open,
      total: tasks.length,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        task.title.toLowerCase().includes(normalizedQuery);

      return matchesQuery && taskMatchesStatus(task, statusFilter);
    });
  }, [searchQuery, statusFilter, tasks]);

  const hasActiveFilters =
    statusFilter !== "all" || searchQuery.trim().length > 0;

  function clearFilters() {
    setStatusFilter("all");
    setSearchQuery("");
  }

  function openCreateForm() {
    setEditingTask(null);
    setError(null);
    setFormOpen(true);
  }

  function openEditForm(task: TaskDTO) {
    setEditingTask(task);
    setError(null);
    setFormOpen(true);
  }

  function openTaskDetail(task: TaskDTO) {
    setSelectedTask(task);
  }

  async function handleSubmit(input: TaskCreateInput) {
    setSaving(true);
    setError(null);

    try {
      const url = editingTask ? `/api/tasks/${editingTask.id}` : "/api/tasks";
      const response = await fetch(url, {
        method: editingTask ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const task = await parseTaskResponse(response);

      setTasks((current) => {
        if (editingTask) {
          return current.map((item) => (item.id === task.id ? task : item));
        }

        return [task, ...current];
      });
      setSelectedTask((current) =>
        current?.id === task.id ? task : current,
      );
      setFormOpen(false);
      setEditingTask(null);
      toast.success(editingTask ? "Task updated." : "Task created.");
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unable to save this task.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleTask(task: TaskDTO) {
    setTaskActionId(task.id);
    setError(null);

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !task.completed }),
      });
      const updatedTask = await parseTaskResponse(response);

      setTasks((current) =>
        current.map((item) => (item.id === updatedTask.id ? updatedTask : item)),
      );
      setSelectedTask((current) =>
        current?.id === updatedTask.id ? updatedTask : current,
      );
      toast.success(updatedTask.completed ? "Task completed." : "Task reopened.");
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unable to update this task.";
      setError(message);
      toast.error(message);
    } finally {
      setTaskActionId(null);
    }
  }

  async function deleteTask(task: TaskDTO) {
    setDeletingTaskId(task.id);
    setError(null);

    const previousTasks = tasks;
    setTasks((current) => current.filter((item) => item.id !== task.id));
    setSelectedTask((current) => (current?.id === task.id ? null : current));

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "Unable to delete this task.");
      }
      setTaskToDelete(null);
      toast.success("Task deleted.");
    } catch (requestError) {
      setTasks(previousTasks);
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete this task.";
      setError(message);
      toast.error(message);
    } finally {
      setDeletingTaskId(null);
    }
  }

  function updateSubtaskState(
    subtask: SubtaskDTO,
    updater: (subtasks: SubtaskDTO[]) => SubtaskDTO[],
  ) {
    setTasks((current) =>
      current.map((task) =>
        task.id === subtask.taskId
          ? { ...task, subtasks: sortSubtasks(updater(task.subtasks)) }
          : task,
      ),
    );
    setSelectedTask((current) =>
      current?.id === subtask.taskId
        ? { ...current, subtasks: sortSubtasks(updater(current.subtasks)) }
        : current,
    );
  }

  async function createSubtask(task: TaskDTO, title: string) {
    setSubtaskBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/subtasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id, title }),
      });
      const subtask = await parseSubtaskResponse(response);

      updateSubtaskState(subtask, (subtasks) => [...subtasks, subtask]);
      toast.success("Subtask added.");
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unable to create this subtask.";
      setError(message);
      toast.error(message);
    } finally {
      setSubtaskBusy(false);
    }
  }

  async function toggleSubtask(subtask: SubtaskDTO) {
    setSubtaskBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/subtasks/${subtask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !subtask.completed }),
      });
      const updatedSubtask = await parseSubtaskResponse(response);

      updateSubtaskState(updatedSubtask, (subtasks) =>
        subtasks.map((item) =>
          item.id === updatedSubtask.id ? updatedSubtask : item,
        ),
      );
      toast.success(
        updatedSubtask.completed ? "Subtask completed." : "Subtask reopened.",
      );
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unable to update this subtask.";
      setError(message);
      toast.error(message);
    } finally {
      setSubtaskBusy(false);
    }
  }

  async function deleteSubtask(subtask: SubtaskDTO) {
    setSubtaskBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/subtasks/${subtask.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "Unable to delete this subtask.");
      }

      updateSubtaskState(subtask, (subtasks) =>
        subtasks.filter((item) => item.id !== subtask.id),
      );
      toast.success("Subtask deleted.");
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete this subtask.";
      setError(message);
      toast.error(message);
    } finally {
      setSubtaskBusy(false);
    }
  }

  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-5 rounded-lg border bg-card p-5 shadow-sm transition-shadow hover:shadow-md lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Tasks</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="secondary">{stats.open} open</Badge>
            <Badge variant="warning">{stats.inProgress} in progress</Badge>
            <Badge variant="success">{stats.completed} completed</Badge>
            <Badge variant="outline">{stats.total} total</Badge>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search task titles"
              className="pl-9"
              aria-label="Search task titles"
            />
          </div>
          <Button size="lg" onClick={openCreateForm}>
            <Plus className="size-4" />
            New Task
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {statusFilters.map((filter) => (
          <Button
            key={filter.value}
            type="button"
            variant={statusFilter === filter.value ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(filter.value)}
            aria-pressed={statusFilter === filter.value}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive transition-colors">
          {error}
        </div>
      ) : null}

      {filteredTasks.length === 0 ? (
        <EmptyState
          hasTasks={tasks.length > 0 && hasActiveFilters}
          onClearFilters={clearFilters}
          onCreateTask={openCreateForm}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredTasks.map((task) => {
            const progress = getSubtaskProgress(task);
            const status = getTaskStatus(task);
            const StatusIcon = status.icon;
            const isTaskUpdating = taskActionId === task.id;
            const isTaskDeleting = deletingTaskId === task.id;

            return (
              <Card
                key={task.id}
                className="flex min-h-64 flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle
                      className={
                        task.completed
                          ? "line-clamp-2 text-muted-foreground line-through"
                          : "line-clamp-2"
                      }
                    >
                      {task.title}
                    </CardTitle>
                    <Badge variant={status.variant} className="shrink-0 gap-1">
                      <StatusIcon className="size-3" />
                      {status.label}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {task.pdfPath ? (
                      <Badge variant="outline" className="w-fit gap-1">
                        <FileText className="size-3" />
                        PDF attached
                      </Badge>
                    ) : null}
                    <Badge variant="outline">
                      {progress.completed}/{progress.total} subtasks
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-5">
                  <p className="line-clamp-4 min-h-20 text-sm leading-6 text-muted-foreground">
                    {task.description ?? "No description added."}
                  </p>
                  <div className="mt-auto grid gap-2">
                    <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                      <span>Subtask progress</span>
                      <span>{progress.percentage}%</span>
                    </div>
                    <div
                      className="h-2 overflow-hidden rounded-full bg-secondary"
                      role="progressbar"
                      aria-label={`${task.title} subtask completion`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={progress.percentage}
                    >
                      <div
                        className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Updated {new Intl.DateTimeFormat(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      }).format(new Date(task.updatedAt))}
                    </p>
                  </div>
                </CardContent>

                <CardFooter className="gap-2">
                  <Button
                    variant={task.completed ? "secondary" : "outline"}
                    className="flex-1"
                    disabled={isTaskUpdating || isTaskDeleting}
                    onClick={() => toggleTask(task)}
                  >
                    {isTaskUpdating ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : task.completed ? (
                      <CheckCircle2 className="size-4" />
                    ) : (
                      <Circle className="size-4" />
                    )}
                    {isTaskUpdating
                      ? "Updating..."
                      : task.completed
                        ? "Completed"
                        : "Complete"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`View ${task.title}`}
                    disabled={isTaskDeleting}
                    onClick={() => openTaskDetail(task)}
                  >
                    <Eye className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit ${task.title}`}
                    disabled={isTaskDeleting}
                    onClick={() => openEditForm(task)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    aria-label={`Delete ${task.title}`}
                    disabled={isTaskUpdating || isTaskDeleting}
                    onClick={() => setTaskToDelete(task)}
                  >
                    {isTaskDeleting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <TaskForm
        open={formOpen}
        task={editingTask}
        saving={saving}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
      />
      <TaskDetail
        open={Boolean(selectedTask)}
        task={selectedTask}
        subtaskBusy={subtaskBusy}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTask(null);
          }
        }}
        onCreateSubtask={createSubtask}
        onToggleSubtask={toggleSubtask}
        onDeleteSubtask={deleteSubtask}
      />
      <AlertDialog
        open={Boolean(taskToDelete)}
        onOpenChange={(open) => {
          if (!open && !deletingTaskId) {
            setTaskToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove
              {taskToDelete ? ` "${taskToDelete.title}"` : " this task"} and
              its subtasks. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deletingTaskId)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className={buttonDangerClassName}
              disabled={Boolean(deletingTaskId)}
              onClick={(event) => {
                event.preventDefault();
                if (taskToDelete) {
                  void deleteTask(taskToDelete);
                }
              }}
            >
              {deletingTaskId ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              {deletingTaskId ? "Deleting..." : "Delete task"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
