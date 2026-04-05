import type { CreateDiaryRequest, DiaryListResponse, DiaryEntry, DiaryCategory } from '../types';
import { authHeaders } from '../lib/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export async function createDiaryEntry(payload: CreateDiaryRequest): Promise<DiaryEntry> {
  const response = await fetch(`${API_BASE_URL}/diary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }

  return response.json() as Promise<DiaryEntry>;
}

export async function getDiaryEntries(category?: DiaryCategory): Promise<DiaryListResponse> {
  const params = category ? `?category=${encodeURIComponent(category)}` : '';
  const response = await fetch(`${API_BASE_URL}/diary${params}`, {
    headers: { ...(await authHeaders()) },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }

  return response.json() as Promise<DiaryListResponse>;
}
