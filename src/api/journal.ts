import type { CreateJournalRequest, UpdateJournalRequest, JournalListResponse, JournalEntry, JournalType } from '../types';
import { authHeaders } from '../lib/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export async function createJournal(payload: CreateJournalRequest): Promise<JournalEntry> {
  const response = await fetch(`${API_BASE_URL}/journal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }
  return response.json() as Promise<JournalEntry>;
}

export async function getJournals(journalType?: JournalType): Promise<JournalListResponse> {
  const url = journalType
    ? `${API_BASE_URL}/journal?type=${encodeURIComponent(journalType)}`
    : `${API_BASE_URL}/journal`;
  const response = await fetch(url, {
    headers: { ...(await authHeaders()) },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }
  return response.json() as Promise<JournalListResponse>;
}

export async function updateJournal(journalId: string, payload: UpdateJournalRequest): Promise<JournalEntry> {
  const response = await fetch(`${API_BASE_URL}/journal/${encodeURIComponent(journalId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }
  return response.json() as Promise<JournalEntry>;
}

export async function deleteJournal(journalId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/journal/${encodeURIComponent(journalId)}`, {
    method: 'DELETE',
    headers: { ...(await authHeaders()) },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }
}
