import { useState, useCallback } from 'react';
import { createGoal, getGoals, updateGoal, deleteGoal } from '../api/goals';
import type { GoalEntry, CreateGoalRequest, UpdateGoalRequest } from '../types';

interface UseGoalsReturn {
  entries: GoalEntry[];
  isSubmitting: boolean;
  isLoading: boolean;
  error: string | null;
  submit: (payload: CreateGoalRequest) => Promise<GoalEntry | null>;
  loadEntries: () => Promise<void>;
  update: (goalId: string, payload: UpdateGoalRequest) => Promise<GoalEntry | null>;
  remove: (goalId: string) => Promise<void>;
  clearError: () => void;
}

export function useGoals(): UseGoalsReturn {
  const [entries, setEntries] = useState<GoalEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (payload: CreateGoalRequest): Promise<GoalEntry | null> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const entry = await createGoal(payload);
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
      const result = await getGoals();
      setEntries(result.entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : '불러오기에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const update = useCallback(async (goalId: string, payload: UpdateGoalRequest): Promise<GoalEntry | null> => {
    setError(null);
    try {
      const updated = await updateGoal(goalId, payload);
      setEntries(prev => prev.map(e => (e.goalId === goalId ? updated : e)));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : '업데이트에 실패했습니다.');
      return null;
    }
  }, []);

  const remove = useCallback(async (goalId: string) => {
    try {
      await deleteGoal(goalId);
      setEntries(prev => prev.filter(e => e.goalId !== goalId));
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { entries, isSubmitting, isLoading, error, submit, loadEntries, update, remove, clearError };
}
