import { authHeaders } from '../lib/auth';
import type { TaskEntry, HabitEntry, GoalEntry, ProjectEntry } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export interface MonthlyReportData {
  year: number;
  month: number;
  monthLabel: string;
  completedTasks: { title: string; dueDate?: string }[];
  createdTasks: { title: string }[];
  habitStats: { name: string; checkedDays: number; totalDays: number; rate: number }[];
  completedGoals: { title: string; progress: number }[];
  activeGoals: { title: string; progress: number }[];
  changedProjects: { title: string; status: string; progress: number }[];
}

export interface MonthlyReportResponse {
  report: string;
  monthLabel: string;
  generatedAt: string;
  stats: { completedTaskCount: number; avgHabitRate: number; completedGoalCount: number };
}

export function buildMonthlyReportData(
  tasks: TaskEntry[],
  habits: HabitEntry[],
  goals: GoalEntry[],
  projects: ProjectEntry[],
  year: number,
  month: number,
): MonthlyReportData {
  const monthStr = String(month).padStart(2, '0');
  const prefix = `${year}-${monthStr}`;
  const daysInMonth = new Date(year, month, 0).getDate();

  const inMonth = (dateStr?: string) => !!dateStr && dateStr.startsWith(prefix);

  const completedTasks = tasks
    .filter(t => t.completed && inMonth(t.updatedAt?.slice(0, 10)))
    .map(t => ({ title: t.title, dueDate: t.dueDate }));

  const createdTasks = tasks
    .filter(t => inMonth(t.createdAt?.slice(0, 10)))
    .map(t => ({ title: t.title }));

  const habitStats = habits.map(h => {
    const checkedDays = Array.isArray(h.checkDates)
      ? h.checkDates.filter(d => d.startsWith(prefix)).length
      : 0;
    return {
      name: h.name,
      checkedDays,
      totalDays: daysInMonth,
      rate: Math.round((checkedDays / daysInMonth) * 100),
    };
  });

  const completedGoals = goals
    .filter(g => g.status === '완료' && inMonth(g.updatedAt?.slice(0, 10)))
    .map(g => ({ title: g.title, progress: g.progress ?? 0 }));

  const activeGoals = goals
    .filter(g => g.status === '진행중')
    .map(g => ({ title: g.title, progress: g.progress ?? 0 }));

  const changedProjects = projects
    .filter(p => inMonth(p.updatedAt?.slice(0, 10)))
    .map(p => {
      const allTasks = p.milestones.flatMap(m => m.tasks);
      const progress = allTasks.length
        ? Math.round((allTasks.filter(t => t.completed).length / allTasks.length) * 100)
        : p.progress;
      return { title: p.title, status: p.status, progress };
    });

  const monthLabel = `${year}년 ${month}월`;

  return {
    year,
    month,
    monthLabel,
    completedTasks,
    createdTasks,
    habitStats,
    completedGoals,
    activeGoals,
    changedProjects,
  };
}

export function buildMonthlyPrompt(data: MonthlyReportData): string {
  const habitLines = data.habitStats.length > 0
    ? data.habitStats.map(h => `  - ${h.name}: ${h.checkedDays}/${h.totalDays}일 (${h.rate}%)`).join('\n')
    : '  해당 없음';

  const avgHabitRate = data.habitStats.length > 0
    ? Math.round(data.habitStats.reduce((s, h) => s + h.rate, 0) / data.habitStats.length)
    : 0;

  const goalLines = [
    ...data.completedGoals.map(g => `  - ✅ ${g.title} (완료)`),
    ...data.activeGoals.map(g => `  - 🔄 ${g.title} (진행중, ${g.progress}%)`),
  ].join('\n') || '  해당 없음';

  const projectLines = data.changedProjects.length > 0
    ? data.changedProjects.map(p => `  - ${p.title} (${p.status}, ${p.progress}%)`).join('\n')
    : '  해당 없음';

  return `${data.monthLabel} 월간 리포트를 작성해줘.

## 태스크 현황
- 이번 달 생성: ${data.createdTasks.length}개
- 이번 달 완료: ${data.completedTasks.length}개

## 습관 평균 체크율: ${avgHabitRate}%
${habitLines}

## 목표 현황
${goalLines}

## 프로젝트 활동
${projectLines}

위 데이터를 바탕으로 6~8문장의 월간 회고 리포트를 작성해줘.
형식:
1. 이번 달 전체 성과 요약 (태스크 완료 수, 습관 체크율 포함)
2. 잘 한 점 2가지
3. 개선할 점 또는 다음 달 목표 2가지
4. 목표/프로젝트 한 줄 코멘트
응답은 한국어로, 따뜻하고 성장 지향적인 톤으로 작성해줘.`;
}

export async function generateMonthlyReport(
  tasks: TaskEntry[],
  habits: HabitEntry[],
  goals: GoalEntry[],
  projects: ProjectEntry[],
  year: number,
  month: number,
): Promise<MonthlyReportResponse> {
  const data = buildMonthlyReportData(tasks, habits, goals, projects, year, month);
  const prompt = buildMonthlyPrompt(data);

  const response = await fetch(`${API_BASE_URL}/assistant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify({
      message: prompt,
      context: '사용자가 월간 회고 리포트를 요청하고 있습니다.',
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error((err as { message?: string }).message ?? `HTTP ${response.status}`);
  }

  const res = await response.json() as { message?: { content?: string } };
  const avgHabitRate = data.habitStats.length > 0
    ? Math.round(data.habitStats.reduce((s, h) => s + h.rate, 0) / data.habitStats.length)
    : 0;

  return {
    report: res.message?.content ?? '리포트 생성에 실패했습니다.',
    monthLabel: data.monthLabel,
    generatedAt: new Date().toISOString(),
    stats: {
      completedTaskCount: data.completedTasks.length,
      avgHabitRate,
      completedGoalCount: data.completedGoals.length,
    },
  };
}

export function getMonthCacheKey(year: number, month: number): string {
  return `monthlyReport-${year}-${String(month).padStart(2, '0')}`;
}
