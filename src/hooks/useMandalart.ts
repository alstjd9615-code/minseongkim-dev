import { useState, useCallback } from 'react';
import { createMandalart, getMandalarts, updateMandalart, deleteMandalart } from '../api/mandalart';
import type { MandalartEntry, CreateMandalartRequest, UpdateMandalartRequest } from '../types';

interface UseMandalartReturn {
  entries: MandalartEntry[];
  isSubmitting: boolean;
  isLoading: boolean;
  error: string | null;
  submit: (payload: CreateMandalartRequest) => Promise<MandalartEntry | null>;
  loadEntries: () => Promise<void>;
  update: (mandalartId: string, payload: UpdateMandalartRequest) => Promise<MandalartEntry | null>;
  remove: (mandalartId: string) => Promise<void>;
}

export function useMandalart(): UseMandalartReturn {
  const [entries, setEntries] = useState<MandalartEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (payload: CreateMandalartRequest): Promise<MandalartEntry | null> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const entry = await createMandalart(payload);
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
      const result = await getMandalarts();
      setEntries(result.entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : '불러오기에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const update = useCallback(async (mandalartId: string, payload: UpdateMandalartRequest): Promise<MandalartEntry | null> => {
    setError(null);
    try {
      const updated = await updateMandalart(mandalartId, payload);
      setEntries(prev => prev.map(e => (e.mandalartId === mandalartId ? updated : e)));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : '업데이트에 실패했습니다.');
      return null;
    }
  }, []);

  const remove = useCallback(async (mandalartId: string) => {
    try {
      await deleteMandalart(mandalartId);
      setEntries(prev => prev.filter(e => e.mandalartId !== mandalartId));
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    }
  }, []);

  return { entries, isSubmitting, isLoading, error, submit, loadEntries, update, remove };
}
