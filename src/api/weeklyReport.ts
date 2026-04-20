import { authHeaders } from '../lib/auth';
import { getLocalDateStr } from '../utils/date';
import type { TaskEntry, HabitEntry, GoalEntry, ProjectEntry } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export interface WeeklyReportData {
  weekStart: string;
  weekEnd: string;
  completedTasks: { title: string; dueDate?: string; projectId?: string }[];
  pendingTasks: { title: string; urgent: boolean; important: boolean; dueDate?: string }[];
  habitStats: { name: string; checkedDays: number; totalDays: number; rate: number }[];
  activeGoals: { title: string; status: string; progress: number }[];
  projects: { title: string; status: string; progress: number; completedMs: number; totalMs: number }[];
}

export interface WeeklyReportResponse {
  report: string;
  weekLabel: string;
  generatedAt: string;
}

export function buildWeeklyReportData(
  tasks: TaskEntry[],
  habits: HabitEntry[],
  goals: GoalEntry[],
  projects: ProjectEntry[],
  weekStart?: Date,
): WeeklyReportData {
  const start = weekStart ?? getWeekStart(new Date());
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const startStr = getLocalDateStr(start);
  const endStr = getLocalDateStr(end);

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return getLocalDateStr(d);
  });

  const inRange = (dateStr: string) => dateStr >= startStr && dateStr <= endStr;

  const completedTasks = tasks.filter(
    t => t.completed && t.updatedAt && inRange(t.updatedAt.slice(0, 10)),
  ).map(t => ({ title: t.title, dueDate: t.dueDate, projectId: t.projectId }));

  const pendingTasks = tasks.filter(t => !t.completed).map(t => ({
    title: t.title,
    urgent: t.urgent,
    important: t.important,
    dueDate: t.dueDate,
  }));

  const habitStats = habits.map(h => {
    const checkedDays = weekDates.filter(d =>
      Array.isArray(h.checkDates) && h.checkDates.includes(d)
    ).length;
    return {
      name: h.name,
      checkedDays,
      totalDays: 7,
      rate: Math.round((checkedDays / 7) * 100),
    };
  });

  const activeGoals = goals
    .filter(g => g.status === '진행중' || g.status === '완료')
    .map(g => ({ title: g.title, status: g.status, progress: g.progress ?? 0 }));

  const projectStats = projects
    .filter(p => p.status === '진행중' || p.status === '계획')
    .map(p => {
      const totalMs = p.milestones.length;
      const completedMs = p.milestones.filter(m => m.status === '완료').length;
      const allTasks = p.milestones.flatMap(m => m.tasks);
      const progress = allTasks.length
        ? Math.round((allTasks.filter(t => t.completed).length / allTasks.length) * 100)
        : p.progress;
      return { title: p.title, status: p.status, progress, completedMs, totalMs };
    });

  return {
    weekStart: startStr,
    weekEnd: endStr,
    completedTasks,
    pendingTasks,
    habitStats,
    activeGoals,
    projects: projectStats,
  };
}

export function buildWeeklyPrompt(data: WeeklyReportData): string {
  const habitLines = data.habitStats.length > 0
    ? data.habitStats.map(h => `  - ${h.name}: ${h.checkedDays}/7일 체크 (${h.rate}%)`).join('\n')
    : '  해당 없음';

  const goalLines = data.activeGoals.length > 0
    ? data.activeGoals.map(g => `  - ${g.title} (${g.status}, ${g.progress}%)`).join('\n')
    : '  해당 없음';

  const projectLines = data.projects.length > 0
    ? data.projects.map(p => `  - ${p.title} (${p.status}, ${p.progress}%, 마일스톤 ${p.completedMs}/${p.totalMs})`).join('\n')
    : '  해당 없음';

  const completedTaskLines = data.completedTasks.length > 0
    ? data.completedTasks.map(t => `  - ${t.title}${t.dueDate ? ` (${t.dueDate})` : ''}`).join('\n')
    : '  해당 없음';

  const pendingQ1 = data.pendingTasks.filter(t => t.urgent && t.important);
  const pendingQ2 = data.pendingTasks.filter(t => !t.urgent && t.important);
  const pendingTaskLines = pendingQ1.length + pendingQ2.length > 0
    ? [...pendingQ1.map(t => `  - [Q1] ${t.title}`), ...pendingQ2.map(t => `  - [Q2] ${t.title}`)].join('\n')
    : '  해당 없음';

  return `${data.weekStart} ~ ${data.weekEnd} 주간 리포트를 작성해줘.

## 이번 주 완료된 태스크 (${data.completedTasks.length}개)
${completedTaskLines}

## 미완료 중요 태스크
${pendingTaskLines}

## 습관 체크율
${habitLines}

## 목표 진행 현황
${goalLines}

## 프로젝트 현황
${projectLines}

위 데이터를 바탕으로 5~7문장의 주간 회고 리포트를 작성해줘.
형식:
1. 이번 주 성과 요약 (완료 태스크 수, 습관 평균 체크율 포함)
2. 잘 한 점 1~2가지
3. 개선할 점 또는 다음 주 주의사항 1~2가지
4. 목표/프로젝트 관련 한 줄 코멘트
응답은 한국어로, 친근하고 건설적인 톤으로 작성해줘.`;
}

export async function generateWeeklyReport(
  tasks: TaskEntry[],
  habits: HabitEntry[],
  goals: GoalEntry[],
  projects: ProjectEntry[],
  weekStart?: Date,
): Promise<WeeklyReportResponse> {
  const data = buildWeeklyReportData(tasks, habits, goals, projects, weekStart);
  const prompt = buildWeeklyPrompt(data);

  const response = await fetch(`${API_BASE_URL}/assistant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify({
      message: prompt,
      context: '사용자가 주간 회고 리포트를 요청하고 있습니다.',
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error((err as { message?: string }).message ?? `HTTP ${response.status}`);
  }

  const res = await response.json() as { message?: { content?: string } };
  const weekLabel = `${data.weekStart} ~ ${data.weekEnd}`;

  return {
    report: res.message?.content ?? '리포트 생성에 실패했습니다.',
    weekLabel,
    generatedAt: new Date().toISOString(),
  };
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getISOWeekKey(date: Date = new Date()): string {
  const start = getWeekStart(date);
  const year = start.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const week = Math.ceil(((start.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}
