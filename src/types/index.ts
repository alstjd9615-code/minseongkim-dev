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


// ── Workout types ─────────────────────────────────────────────────────────────

export type WorkoutType =
  | '달리기' | '걷기' | '자전거' | '수영'
  | '헬스' | '홈트' | '크로스핏'
  | '요가' | '필라테스' | '스트레칭'
  | '축구' | '농구' | '테니스' | '배드민턴'
  | '기타';

export const WORKOUT_TYPES: WorkoutType[] = [
  '달리기', '걷기', '자전거', '수영',
  '헬스', '홈트', '크로스핏',
  '요가', '필라테스', '스트레칭',
  '축구', '농구', '테니스', '배드민턴',
  '기타',
];

export type WorkoutIntensity = '낮음' | '보통' | '높음';
export const WORKOUT_INTENSITIES: WorkoutIntensity[] = ['낮음', '보통', '높음'];

export interface WorkoutEntry {
  userId: string;
  workoutId: string;
  workoutType: WorkoutType;
  durationMin: number;
  intensity: WorkoutIntensity;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkoutRequest {
  workoutType: WorkoutType;
  durationMin: number;
  intensity: WorkoutIntensity;
  notes?: string;
}

export interface WorkoutListResponse {
  entries: WorkoutEntry[];
  count: number;
}

// ── Knowledge types ────────────────────────────────────────────────────────────

export type KnowledgeType = '책' | '아티클' | '강의' | '영상' | '기타';
export const KNOWLEDGE_TYPES: KnowledgeType[] = ['책', '아티클', '강의', '영상', '기타'];

export interface KnowledgeEntry {
  userId: string;
  knowledgeId: string;
  knowledgeType: KnowledgeType;
  title: string;
  author: string;
  notes: string;
  tags: string[];
  aiSummary: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKnowledgeRequest {
  knowledgeType: KnowledgeType;
  title: string;
  author?: string;
  notes: string;
}

export interface KnowledgeListResponse {
  entries: KnowledgeEntry[];
  count: number;
}

// ── Goal types ─────────────────────────────────────────────────────────────────

export type GoalStatus = '진행중' | '완료' | '포기';
export type GoalPeriod = '단기' | '장기';
export const GOAL_STATUSES: GoalStatus[] = ['진행중', '완료', '포기'];
export const GOAL_PERIODS: GoalPeriod[] = ['단기', '장기'];

export interface GoalEntry {
  userId: string;
  goalId: string;
  period: GoalPeriod;
  title: string;
  description: string;
  status: GoalStatus;
  progress: number;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalRequest {
  period: GoalPeriod;
  title: string;
  description?: string;
  dueDate?: string;
}

export interface UpdateGoalRequest {
  status?: GoalStatus;
  progress?: number;
  title?: string;
  description?: string;
  dueDate?: string;
}

export interface GoalListResponse {
  entries: GoalEntry[];
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

