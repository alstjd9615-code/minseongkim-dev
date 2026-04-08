import type { CreateKnowledgeRequest, KnowledgeListResponse, KnowledgeEntry } from '../types';
import { authHeaders } from '../lib/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export async function createKnowledgeEntry(payload: CreateKnowledgeRequest): Promise<KnowledgeEntry> {
  const response = await fetch(`${API_BASE_URL}/knowledge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }

  return response.json() as Promise<KnowledgeEntry>;
}

export async function getKnowledgeEntries(): Promise<KnowledgeListResponse> {
  const response = await fetch(`${API_BASE_URL}/knowledge`, {
    headers: { ...(await authHeaders()) },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }

  return response.json() as Promise<KnowledgeListResponse>;
}

export async function deleteKnowledgeEntry(knowledgeId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/knowledge/${encodeURIComponent(knowledgeId)}`, {
    method: 'DELETE',
    headers: { ...(await authHeaders()) },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }
}
