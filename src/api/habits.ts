import type { CreateHabitRequest, UpdateHabitRequest, HabitListResponse, HabitEntry } from '../types';
import { authHeaders } from '../lib/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export async function createHabit(payload: CreateHabitRequest): Promise<HabitEntry> {
  const response = await fetch(`${API_BASE_URL}/habits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }
  return response.json() as Promise<HabitEntry>;
}

export async function getHabits(): Promise<HabitListResponse> {
  const response = await fetch(`${API_BASE_URL}/habits`, {
    headers: { ...(await authHeaders()) },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }
  return response.json() as Promise<HabitListResponse>;
}

export async function updateHabit(habitId: string, payload: UpdateHabitRequest): Promise<HabitEntry> {
  const response = await fetch(`${API_BASE_URL}/habits/${encodeURIComponent(habitId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }
  return response.json() as Promise<HabitEntry>;
}

export async function deleteHabit(habitId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/habits/${encodeURIComponent(habitId)}`, {
    method: 'DELETE',
    headers: { ...(await authHeaders()) },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }
}
