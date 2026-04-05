import type { StatsResponse } from '../types';
import { authHeaders } from '../lib/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export async function getStats(): Promise<StatsResponse> {
  const response = await fetch(`${API_BASE_URL}/stats`, {
    headers: { ...(await authHeaders()) },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }

  return response.json() as Promise<StatsResponse>;
}
