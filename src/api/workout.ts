import type { CreateWorkoutRequest, WorkoutListResponse, WorkoutEntry } from '../types';
import { authHeaders } from '../lib/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export async function createWorkoutEntry(payload: CreateWorkoutRequest): Promise<WorkoutEntry> {
  const response = await fetch(`${API_BASE_URL}/workout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }

  return response.json() as Promise<WorkoutEntry>;
}

export async function getWorkoutEntries(): Promise<WorkoutListResponse> {
  const response = await fetch(`${API_BASE_URL}/workout`, {
    headers: { ...(await authHeaders()) },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }

  return response.json() as Promise<WorkoutListResponse>;
}

export async function deleteWorkoutEntry(workoutId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/workout/${encodeURIComponent(workoutId)}`, {
    method: 'DELETE',
    headers: { ...(await authHeaders()) },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }
}
