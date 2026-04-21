import type { SubtaskDTO, TaskDTO } from "@/lib/task-types";

type SubtaskRecord = {
  id: string;
  title: string;
  completed: boolean;
  taskId: string;
  createdAt: Date;
  updatedAt: Date;
};

type TaskRecord = {
  id: string;
  title: string;
  description: string | null;
  pdfPath: string | null;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
  subtasks: SubtaskRecord[];
};

export const taskWithSubtasks = {
  subtasks: {
    orderBy: [{ completed: "asc" as const }, { createdAt: "asc" as const }],
  },
};

export function toSubtaskDTO(subtask: SubtaskRecord): SubtaskDTO {
  return {
    ...subtask,
    createdAt: subtask.createdAt.toISOString(),
    updatedAt: subtask.updatedAt.toISOString(),
  };
}

export function toTaskDTO(task: TaskRecord): TaskDTO {
  return {
    ...task,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    subtasks: task.subtasks.map(toSubtaskDTO),
  };
}
