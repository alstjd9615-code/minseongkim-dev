import { useState, useCallback } from 'react';
import { createKnowledgeEntry, getKnowledgeEntries, deleteKnowledgeEntry } from '../api/knowledge';
import type { KnowledgeEntry, CreateKnowledgeRequest } from '../types';

interface UseKnowledgeReturn {
  entries: KnowledgeEntry[];
  isSubmitting: boolean;
  isLoading: boolean;
  error: string | null;
  submit: (payload: CreateKnowledgeRequest) => Promise<KnowledgeEntry | null>;
  loadEntries: () => Promise<void>;
  remove: (knowledgeId: string) => Promise<void>;
  clearError: () => void;
}

export function useKnowledge(): UseKnowledgeReturn {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (payload: CreateKnowledgeRequest): Promise<KnowledgeEntry | null> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const entry = await createKnowledgeEntry(payload);
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
      const result = await getKnowledgeEntries();
      setEntries(result.entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : '불러오기에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const remove = useCallback(async (knowledgeId: string) => {
    try {
      await deleteKnowledgeEntry(knowledgeId);
      setEntries(prev => prev.filter(e => e.knowledgeId !== knowledgeId));
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { entries, isSubmitting, isLoading, error, submit, loadEntries, remove, clearError };
}
