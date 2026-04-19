import { useState, useCallback, useRef, type ReactNode } from 'react';
import { createTask, getTasks, updateTask, deleteTask } from '../api/tasks';
import type { TaskEntry, CreateTaskRequest, UpdateTaskRequest } from '../types';
import { TasksContext } from './_tasksContext';

/**
 * Provides shared Tasks state to the entire app.
 * loadEntries() is idempotent — the first call fetches from the API;
 * subsequent calls are no-ops until the page is refreshed.
 * All mutations (submit / update / remove) update in-memory state directly
 * so no re-fetch is needed after writes.
 */
export function TasksProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<TaskEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

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
    if (loadedRef.current) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await getTasks();
      setEntries(result.entries);
      loadedRef.current = true;
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

  return (
    <TasksContext.Provider value={{ entries, isSubmitting, isLoading, error, submit, loadEntries, update, remove }}>
      {children}
    </TasksContext.Provider>
  );
}
