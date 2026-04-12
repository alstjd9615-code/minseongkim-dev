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
  mood?: DiaryMood;
  createdAt: string;
  updatedAt: string;
}

export type DiaryMood = '좋음' | '보통' | '나쁨';
export const DIARY_MOODS: DiaryMood[] = ['좋음', '보통', '나쁨'];

export interface CreateDiaryRequest {
  content: string;
  mood?: DiaryMood;
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

export interface RecentActivityItem {
  type: 'diary' | 'workout' | 'goal' | 'knowledge';
  title: string;
  createdAt: string;
}

export interface StatsResponse {
  total: number;
  streak: number;
  mostActiveCategory: DiaryCategory | null;
  categoryBreakdown: CategoryStat[];
  dailyActivity: DailyActivity[];
  workoutThisWeek: number;
  goalsActive: number;
  goalsDone: number;
  goalsAvgProgress: number;
  knowledgeTotal: number;
  recentActivity: RecentActivityItem[];
}

export interface AssistantRequest {
  sessionId?: string;
  message: string;
  context?: string;
}

export interface AssistantResponse {
  sessionId: string;
  message: Message;
}


// ── Life Wheel types ──────────────────────────────────────────────────────────

export const LIFE_WHEEL_DOMAINS = ['건강', '재정', '커리어', '관계', '성장', '여가', '환경', '정신/영적'] as const;
export type LifeWheelDomain = typeof LIFE_WHEEL_DOMAINS[number];

export interface LifeWheelScores {
  건강: number;
  재정: number;
  커리어: number;
  관계: number;
  성장: number;
  여가: number;
  환경: number;
  '정신/영적': number;
}

export interface LifeWheelEntry {
  userId: string;
  wheelId: string;
  scores: LifeWheelScores;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLifeWheelRequest {
  scores: LifeWheelScores;
  note?: string;
}

export interface LifeWheelListResponse {
  entries: LifeWheelEntry[];
  count: number;
}

// ── Mandalart types ───────────────────────────────────────────────────────────

export interface MandalartCell {
  text: string;
  completed: boolean;
}

export interface MandalartEntry {
  userId: string;
  mandalartId: string;
  title: string;
  cells: MandalartCell[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateMandalartRequest {
  title: string;
  cells?: MandalartCell[];
}

export interface UpdateMandalartRequest {
  title?: string;
  cells?: MandalartCell[];
}

export interface MandalartListResponse {
  entries: MandalartEntry[];
  count: number;
}

// ── Habit types ───────────────────────────────────────────────────────────────

export interface HabitEntry {
  userId: string;
  habitId: string;
  name: string;
  icon: string;
  color: string;
  checkDates: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateHabitRequest {
  name: string;
  icon?: string;
  color?: string;
}

export interface UpdateHabitRequest {
  name?: string;
  icon?: string;
  color?: string;
  checkDate?: string;
}

export interface HabitListResponse {
  entries: HabitEntry[];
  count: number;
}

// ── Task (Eisenhower) types ───────────────────────────────────────────────────

export type TaskQuadrant = 'Q1' | 'Q2' | 'Q3' | 'Q4';
export const TASK_QUADRANTS: { id: TaskQuadrant; label: string; desc: string; urgent: boolean; important: boolean }[] = [
  { id: 'Q1', label: '즉시 실행', desc: '중요 + 긴급', urgent: true, important: true },
  { id: 'Q2', label: '계획', desc: '중요 + 여유', urgent: false, important: true },
  { id: 'Q3', label: '위임', desc: '긴급 + 덜 중요', urgent: true, important: false },
  { id: 'Q4', label: '제거', desc: '낮은 우선순위', urgent: false, important: false },
];

export interface TaskEntry {
  userId: string;
  taskId: string;
  title: string;
  urgent: boolean;
  important: boolean;
  quadrant: TaskQuadrant;
  completed: boolean;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  urgent: boolean;
  important: boolean;
  dueDate?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  urgent?: boolean;
  important?: boolean;
  completed?: boolean;
  dueDate?: string;
}

export interface TaskListResponse {
  entries: TaskEntry[];
  count: number;
}

// ── Journal types ─────────────────────────────────────────────────────────────

export type JournalType = 'weekly' | 'monthly' | 'quarterly' | 'kpt';

export interface KPTContent {
  keep: string;
  problem: string;
  tryNext: string;
}

export interface JournalEntry {
  userId: string;
  journalId: string;
  journalType: JournalType;
  title: string;
  content: string;
  kpt?: KPTContent;
  periodStart?: string;
  periodEnd?: string;
  aiInsight?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJournalRequest {
  journalType: JournalType;
  title: string;
  content?: string;
  kpt?: KPTContent;
  periodStart?: string;
  periodEnd?: string;
}

export interface UpdateJournalRequest {
  title?: string;
  content?: string;
  kpt?: KPTContent;
}

export interface JournalListResponse {
  entries: JournalEntry[];
  count: number;
}

// ── Project types ─────────────────────────────────────────────────────────────

export type ProjectStatus = '계획' | '진행중' | '완료' | '보류';
export type MilestoneStatus = '미완료' | '완료';

export const PROJECT_STATUSES: ProjectStatus[] = ['계획', '진행중', '완료', '보류'];

export interface ProjectTask {
  taskId: string;
  title: string;
  completed: boolean;
  dueDate?: string;
}

export interface ProjectMilestone {
  milestoneId: string;
  title: string;
  status: MilestoneStatus;
  dueDate?: string;
  tasks: ProjectTask[];
}

export interface ProjectEntry {
  userId: string;
  projectId: string;
  title: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  milestones: ProjectMilestone[];
  tags: string[];
  startDate?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  title: string;
  description?: string;
  status?: ProjectStatus;
  startDate?: string;
  dueDate?: string;
  tags?: string[];
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
  status?: ProjectStatus;
  progress?: number;
  milestones?: ProjectMilestone[];
  tags?: string[];
  startDate?: string;
  dueDate?: string;
}

export interface ProjectListResponse {
  entries: ProjectEntry[];
  count: number;
}
