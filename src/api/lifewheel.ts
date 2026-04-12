import type { CreateLifeWheelRequest, LifeWheelListResponse, LifeWheelEntry } from '../types';
import { authHeaders } from '../lib/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export async function createLifeWheel(payload: CreateLifeWheelRequest): Promise<LifeWheelEntry> {
  const response = await fetch(`${API_BASE_URL}/lifewheel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }
  return response.json() as Promise<LifeWheelEntry>;
}

export async function getLifeWheels(): Promise<LifeWheelListResponse> {
  const response = await fetch(`${API_BASE_URL}/lifewheel`, {
    headers: { ...(await authHeaders()) },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }
  return response.json() as Promise<LifeWheelListResponse>;
}

export async function deleteLifeWheel(wheelId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/lifewheel/${encodeURIComponent(wheelId)}`, {
    method: 'DELETE',
    headers: { ...(await authHeaders()) },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }
}
