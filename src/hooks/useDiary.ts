import { useState, useCallback } from 'react';
import { createDiaryEntry, getDiaryEntries } from '../api/diary';
import type { DiaryEntry, DiaryCategory, DiaryMood } from '../types';

interface UseDiaryReturn {
  entries: DiaryEntry[];
  isSubmitting: boolean;
  isLoading: boolean;
  error: string | null;
  submit: (content: string, mood?: DiaryMood) => Promise<DiaryEntry | null>;
  loadEntries: (category?: DiaryCategory) => Promise<void>;
  clearError: () => void;
}

export function useDiary(): UseDiaryReturn {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (content: string, mood?: DiaryMood): Promise<DiaryEntry | null> => {
    if (!content.trim()) return null;
    setIsSubmitting(true);
    setError(null);
    try {
      const entry = await createDiaryEntry({ content: content.trim(), mood });
      setEntries(prev => [entry, ...prev]);
      return entry;
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const loadEntries = useCallback(async (category?: DiaryCategory) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getDiaryEntries(category);
      setEntries(result.entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : '불러오기에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { entries, isSubmitting, isLoading, error, submit, loadEntries, clearError };
}
