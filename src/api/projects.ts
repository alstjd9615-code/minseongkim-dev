import type { CreateProjectRequest, UpdateProjectRequest, ProjectListResponse, ProjectEntry } from '../types';
import { authHeaders } from '../lib/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export async function createProject(payload: CreateProjectRequest): Promise<ProjectEntry> {
  const response = await fetch(`${API_BASE_URL}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }
  return response.json() as Promise<ProjectEntry>;
}

export async function getProjects(): Promise<ProjectListResponse> {
  const response = await fetch(`${API_BASE_URL}/projects`, {
    headers: { ...(await authHeaders()) },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }
  return response.json() as Promise<ProjectListResponse>;
}

export async function updateProject(projectId: string, payload: UpdateProjectRequest): Promise<ProjectEntry> {
  const response = await fetch(`${API_BASE_URL}/projects/${encodeURIComponent(projectId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }
  return response.json() as Promise<ProjectEntry>;
}

export async function deleteProject(projectId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/projects/${encodeURIComponent(projectId)}`, {
    method: 'DELETE',
    headers: { ...(await authHeaders()) },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }
}
