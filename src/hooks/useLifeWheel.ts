import { useState, useCallback } from 'react';
import { createLifeWheel, getLifeWheels, deleteLifeWheel } from '../api/lifewheel';
import type { LifeWheelEntry, CreateLifeWheelRequest } from '../types';

interface UseLifeWheelReturn {
  entries: LifeWheelEntry[];
  isSubmitting: boolean;
  isLoading: boolean;
  error: string | null;
  submit: (payload: CreateLifeWheelRequest) => Promise<LifeWheelEntry | null>;
  loadEntries: () => Promise<void>;
  remove: (wheelId: string) => Promise<void>;
}

export function useLifeWheel(): UseLifeWheelReturn {
  const [entries, setEntries] = useState<LifeWheelEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (payload: CreateLifeWheelRequest): Promise<LifeWheelEntry | null> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const entry = await createLifeWheel(payload);
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
      const result = await getLifeWheels();
      setEntries(result.entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : '불러오기에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const remove = useCallback(async (wheelId: string) => {
    try {
      await deleteLifeWheel(wheelId);
      setEntries(prev => prev.filter(e => e.wheelId !== wheelId));
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    }
  }, []);

  return { entries, isSubmitting, isLoading, error, submit, loadEntries, remove };
}
