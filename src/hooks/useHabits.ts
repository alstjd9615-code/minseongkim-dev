import { useState, useCallback } from 'react';
import { createHabit, getHabits, updateHabit, deleteHabit } from '../api/habits';
import type { HabitEntry, CreateHabitRequest, UpdateHabitRequest } from '../types';

interface UseHabitsReturn {
  entries: HabitEntry[];
  isSubmitting: boolean;
  isLoading: boolean;
  error: string | null;
  submit: (payload: CreateHabitRequest) => Promise<HabitEntry | null>;
  loadEntries: () => Promise<void>;
  update: (habitId: string, payload: UpdateHabitRequest) => Promise<HabitEntry | null>;
  remove: (habitId: string) => Promise<void>;
  toggleCheck: (habitId: string, date: string) => Promise<void>;
}

export function useHabits(): UseHabitsReturn {
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (payload: CreateHabitRequest): Promise<HabitEntry | null> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const entry = await createHabit(payload);
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
      const result = await getHabits();
      setEntries(result.entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : '불러오기에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const update = useCallback(async (habitId: string, payload: UpdateHabitRequest): Promise<HabitEntry | null> => {
    setError(null);
    try {
      const updated = await updateHabit(habitId, payload);
      setEntries(prev => prev.map(e => (e.habitId === habitId ? updated : e)));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : '업데이트에 실패했습니다.');
      return null;
    }
  }, []);

  const toggleCheck = useCallback(async (habitId: string, date: string) => {
    setError(null);
    try {
      const updated = await updateHabit(habitId, { checkDate: date });
      setEntries(prev => prev.map(e => (e.habitId === habitId ? updated : e)));
    } catch (err) {
      setError(err instanceof Error ? err.message : '체크에 실패했습니다.');
    }
  }, []);

  const remove = useCallback(async (habitId: string) => {
    try {
      await deleteHabit(habitId);
      setEntries(prev => prev.filter(e => e.habitId !== habitId));
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    }
  }, []);

  return { entries, isSubmitting, isLoading, error, submit, loadEntries, update, remove, toggleCheck };
}
