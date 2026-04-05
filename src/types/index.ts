export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
}

export interface ChatSession {
  sessionId: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioSection {
  id: string;
  type: 'intro' | 'experience' | 'skills' | 'projects' | 'education' | 'contact';
  title: string;
  content: string;
}

export interface Portfolio {
  id: string;
  sessionId: string;
  sections: PortfolioSection[];
  isPublic?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatRequest {
  sessionId?: string;
  message: string;
}

export interface ChatResponse {
  sessionId: string;
  message: Message;
  portfolio: Portfolio;
}

export interface ApiError {
  message: string;
  code?: string;
}

// ── Diary types ──────────────────────────────────────────────────────────────

export type DiaryCategory = '독서' | '운동' | '프로젝트' | '시사' | '목표' | '아이디어';

export const DIARY_CATEGORIES: DiaryCategory[] = ['독서', '운동', '프로젝트', '시사', '목표', '아이디어'];

export interface DiaryEntry {
  userId: string;
  entryId: string;
  category: DiaryCategory;
  summary: string;
  tags: string[];
  originalContent: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDiaryRequest {
  content: string;
}

export interface DiaryListResponse {
  entries: DiaryEntry[];
  count: number;
}

// ── Blog types ────────────────────────────────────────────────────────────────

export type BlogStatus = 'draft' | 'published';

export interface BlogPost {
  userId: string;
  postId: string;
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  status: BlogStatus;
  sourceEntryIds: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  mediumUrl?: string;
  tistoryUrl?: string;
}

export type BlogPostSummary = Omit<BlogPost, 'content'>;

export interface CreateBlogRequest {
  entryIds: string[];
}

export interface UpdateBlogRequest {
  title?: string;
  content?: string;
  excerpt?: string;
  tags?: string[];
  status?: BlogStatus;
}

export interface BlogListResponse {
  posts: BlogPost[];
  count: number;
}

export interface PublicBlogListResponse {
  posts: BlogPostSummary[];
  count: number;
}


export interface CategoryStat {
  category: DiaryCategory;
  count: number;
}

export interface DailyActivity {
  date: string;
  count: number;
}

export interface StatsResponse {
  total: number;
  streak: number;
  mostActiveCategory: DiaryCategory | null;
  categoryBreakdown: CategoryStat[];
  dailyActivity: DailyActivity[];
}

