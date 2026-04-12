import { useState, useCallback } from 'react';
import { createJournal, getJournals, updateJournal, deleteJournal } from '../api/journal';
import type { JournalEntry, CreateJournalRequest, UpdateJournalRequest, JournalType } from '../types';

interface UseJournalReturn {
  entries: JournalEntry[];
  isSubmitting: boolean;
  isLoading: boolean;
  error: string | null;
  submit: (payload: CreateJournalRequest) => Promise<JournalEntry | null>;
  loadEntries: (journalType?: JournalType) => Promise<void>;
  update: (journalId: string, payload: UpdateJournalRequest) => Promise<JournalEntry | null>;
  remove: (journalId: string) => Promise<void>;
}

export function useJournal(): UseJournalReturn {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (payload: CreateJournalRequest): Promise<JournalEntry | null> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const entry = await createJournal(payload);
      setEntries(prev => [entry, ...prev]);
      return entry;
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const loadEntries = useCallback(async (journalType?: JournalType) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getJournals(journalType);
      setEntries(result.entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : '불러오기에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const update = useCallback(async (journalId: string, payload: UpdateJournalRequest): Promise<JournalEntry | null> => {
    setError(null);
    try {
      const updated = await updateJournal(journalId, payload);
      setEntries(prev => prev.map(e => (e.journalId === journalId ? updated : e)));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : '업데이트에 실패했습니다.');
      return null;
    }
  }, []);

  const remove = useCallback(async (journalId: string) => {
    try {
      await deleteJournal(journalId);
      setEntries(prev => prev.filter(e => e.journalId !== journalId));
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    }
  }, []);

  return { entries, isSubmitting, isLoading, error, submit, loadEntries, update, remove };
}
