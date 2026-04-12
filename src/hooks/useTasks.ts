import { useState, useCallback } from 'react';
import { createTask, getTasks, updateTask, deleteTask } from '../api/tasks';
import type { TaskEntry, CreateTaskRequest, UpdateTaskRequest } from '../types';

interface UseTasksReturn {
  entries: TaskEntry[];
  isSubmitting: boolean;
  isLoading: boolean;
  error: string | null;
  submit: (payload: CreateTaskRequest) => Promise<TaskEntry | null>;
  loadEntries: () => Promise<void>;
  update: (taskId: string, payload: UpdateTaskRequest) => Promise<TaskEntry | null>;
  remove: (taskId: string) => Promise<void>;
}

export function useTasks(): UseTasksReturn {
  const [entries, setEntries] = useState<TaskEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (payload: CreateTaskRequest): Promise<TaskEntry | null> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const entry = await createTask(payload);
      setEntries(prev => [entry, ...prev]);
      return entry;
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getTasks();
      setEntries(result.entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : '불러오기에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const update = useCallback(async (taskId: string, payload: UpdateTaskRequest): Promise<TaskEntry | null> => {
    setError(null);
    try {
      const updated = await updateTask(taskId, payload);
      setEntries(prev => prev.map(e => (e.taskId === taskId ? updated : e)));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : '업데이트에 실패했습니다.');
      return null;
    }
  }, []);

  const remove = useCallback(async (taskId: string) => {
    try {
      await deleteTask(taskId);
      setEntries(prev => prev.filter(e => e.taskId !== taskId));
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    }
  }, []);

  return { entries, isSubmitting, isLoading, error, submit, loadEntries, update, remove };
}
