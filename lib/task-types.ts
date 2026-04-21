export type SubtaskDTO = {
  id: string;
  title: string;
  completed: boolean;
  taskId: string;
  createdAt: string;
  updatedAt: string;
};

export type TaskDTO = {
  id: string;
  title: string;
  description: string | null;
  pdfPath: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  subtasks: SubtaskDTO[];
};

export type TaskCreateInput = {
  title: string;
  description?: string | null;
  pdfPath?: string | null;
};

export type TaskUpdateInput = Partial<TaskCreateInput> & {
  completed?: boolean;
};

export type SubtaskCreateInput = {
  taskId: string;
  title: string;
};

export type SubtaskUpdateInput = {
  title?: string;
  completed?: boolean;
};
