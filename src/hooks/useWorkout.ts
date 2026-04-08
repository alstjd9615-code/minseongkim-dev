import { useState, useCallback } from 'react';
import { createWorkoutEntry, getWorkoutEntries, deleteWorkoutEntry } from '../api/workout';
import type { WorkoutEntry, CreateWorkoutRequest } from '../types';

interface UseWorkoutReturn {
  entries: WorkoutEntry[];
  isSubmitting: boolean;
  isLoading: boolean;
  error: string | null;
  submit: (payload: CreateWorkoutRequest) => Promise<WorkoutEntry | null>;
  loadEntries: () => Promise<void>;
  remove: (workoutId: string) => Promise<void>;
  clearError: () => void;
}

export function useWorkout(): UseWorkoutReturn {
  const [entries, setEntries] = useState<WorkoutEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (payload: CreateWorkoutRequest): Promise<WorkoutEntry | null> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const entry = await createWorkoutEntry(payload);
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
      const result = await getWorkoutEntries();
      setEntries(result.entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : '불러오기에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const remove = useCallback(async (workoutId: string) => {
    try {
      await deleteWorkoutEntry(workoutId);
      setEntries(prev => prev.filter(e => e.workoutId !== workoutId));
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { entries, isSubmitting, isLoading, error, submit, loadEntries, remove, clearError };
}
