import { createContext } from 'react';
import type { TaskEntry, CreateTaskRequest, UpdateTaskRequest } from '../types';

export interface TasksContextValue {
  entries: TaskEntry[];
  isSubmitting: boolean;
  isLoading: boolean;
  error: string | null;
  submit: (payload: CreateTaskRequest) => Promise<TaskEntry | null>;
  loadEntries: () => Promise<void>;
  update: (taskId: string, payload: UpdateTaskRequest) => Promise<TaskEntry | null>;
  remove: (taskId: string) => Promise<void>;
}

export const TasksContext = createContext<TasksContextValue | null>(null);
