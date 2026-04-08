import type { CreateGoalRequest, UpdateGoalRequest, GoalListResponse, GoalEntry } from '../types';
import { authHeaders } from '../lib/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export async function createGoal(payload: CreateGoalRequest): Promise<GoalEntry> {
  const response = await fetch(`${API_BASE_URL}/goals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }

  return response.json() as Promise<GoalEntry>;
}

export async function getGoals(): Promise<GoalListResponse> {
  const response = await fetch(`${API_BASE_URL}/goals`, {
    headers: { ...(await authHeaders()) },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }

  return response.json() as Promise<GoalListResponse>;
}

export async function updateGoal(goalId: string, payload: UpdateGoalRequest): Promise<GoalEntry> {
  const response = await fetch(`${API_BASE_URL}/goals/${encodeURIComponent(goalId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }

  return response.json() as Promise<GoalEntry>;
}

export async function deleteGoal(goalId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/goals/${encodeURIComponent(goalId)}`, {
    method: 'DELETE',
    headers: { ...(await authHeaders()) },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }
}
