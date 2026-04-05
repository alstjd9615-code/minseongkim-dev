import type {
  BlogPost,
  BlogListResponse,
  BlogPostSummary,
  CreateBlogRequest,
  UpdateBlogRequest,
} from '../types';
import { authHeaders } from '../lib/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export async function createBlogPost(payload: CreateBlogRequest): Promise<BlogPost> {
  const response = await fetch(`${API_BASE_URL}/blog`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }
  return response.json() as Promise<BlogPost>;
}

export async function getBlogPosts(status?: 'draft' | 'published'): Promise<BlogListResponse> {
  const params = status ? `?status=${encodeURIComponent(status)}` : '';
  const response = await fetch(`${API_BASE_URL}/blog${params}`, {
    headers: { ...(await authHeaders()) },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }
  return response.json() as Promise<BlogListResponse>;
}

export async function getBlogPost(postId: string): Promise<BlogPost> {
  const response = await fetch(`${API_BASE_URL}/blog/${encodeURIComponent(postId)}`, {
    headers: { ...(await authHeaders()) },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }
  return response.json() as Promise<BlogPost>;
}

export async function updateBlogPost(postId: string, payload: UpdateBlogRequest): Promise<BlogPost> {
  const response = await fetch(`${API_BASE_URL}/blog/${encodeURIComponent(postId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }
  return response.json() as Promise<BlogPost>;
}

export async function deleteBlogPost(postId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/blog/${encodeURIComponent(postId)}`, {
    method: 'DELETE',
    headers: { ...(await authHeaders()) },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }
}

export async function publishBlogPost(
  postId: string,
  platform: 'medium' | 'tistory',
): Promise<{ message: string; url?: string }> {
  const response = await fetch(
    `${API_BASE_URL}/blog/${encodeURIComponent(postId)}/publish/${platform}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    },
  );
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }
  return response.json() as Promise<{ message: string; url?: string }>;
}

// ── Public API (no auth) ────────────────────────────────────────────────────

export async function getPublicBlogPosts(userId: string): Promise<{ posts: BlogPostSummary[]; count: number }> {
  const response = await fetch(`${API_BASE_URL}/public/blog/${encodeURIComponent(userId)}`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }
  return response.json() as Promise<{ posts: BlogPostSummary[]; count: number }>;
}

export async function getPublicBlogPost(userId: string, postId: string): Promise<BlogPost> {
  const response = await fetch(
    `${API_BASE_URL}/public/blog/${encodeURIComponent(userId)}/${encodeURIComponent(postId)}`,
  );
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }
  return response.json() as Promise<BlogPost>;
}
