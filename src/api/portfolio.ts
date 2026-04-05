import type { Portfolio } from '../types';
import { authHeaders } from '../lib/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export async function getPublicPortfolio(portfolioId: string): Promise<Portfolio> {
  const response = await fetch(`${API_BASE_URL}/public/${encodeURIComponent(portfolioId)}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }

  return response.json() as Promise<Portfolio>;
}

export async function updatePortfolioVisibility(
  sessionId: string,
  isPublic: boolean,
): Promise<Portfolio> {
  const response = await fetch(`${API_BASE_URL}/portfolio/${encodeURIComponent(sessionId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify({ isPublic }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }

  return response.json() as Promise<Portfolio>;
}
