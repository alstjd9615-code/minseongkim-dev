import type { CreateMandalartRequest, UpdateMandalartRequest, MandalartListResponse, MandalartEntry } from '../types';
import { authHeaders } from '../lib/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export async function createMandalart(payload: CreateMandalartRequest): Promise<MandalartEntry> {
  const response = await fetch(`${API_BASE_URL}/mandalart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }
  return response.json() as Promise<MandalartEntry>;
}

export async function getMandalarts(): Promise<MandalartListResponse> {
  const response = await fetch(`${API_BASE_URL}/mandalart`, {
    headers: { ...(await authHeaders()) },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }
  return response.json() as Promise<MandalartListResponse>;
}

export async function updateMandalart(mandalartId: string, payload: UpdateMandalartRequest): Promise<MandalartEntry> {
  const response = await fetch(`${API_BASE_URL}/mandalart/${encodeURIComponent(mandalartId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }
  return response.json() as Promise<MandalartEntry>;
}

export async function deleteMandalart(mandalartId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/mandalart/${encodeURIComponent(mandalartId)}`, {
    method: 'DELETE',
    headers: { ...(await authHeaders()) },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }
}
