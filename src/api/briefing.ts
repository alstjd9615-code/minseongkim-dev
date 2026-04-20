import { authHeaders } from '../lib/auth';
import { getLocalDateStr } from '../utils/date';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export interface BriefingRequest {
  tasks: {
    title: string;
    urgent: boolean;
    important: boolean;
    completed: boolean;
    dueDate?: string;
    isPinned?: boolean;
    microStep?: string;
  }[];
  habits: { name: string; checkedToday: boolean }[];
  goals: { title: string; status: string; progress: number }[];
}

export interface BriefingResponse {
  briefing: string;
  generatedAt: string;
}

export async function generateBriefing(payload: BriefingRequest): Promise<BriefingResponse> {
  const response = await fetch(`${API_BASE_URL}/assistant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify({
      message: buildBriefingPrompt(payload),
      context: '사용자가 홈 대시보드에서 오늘의 AI 브리핑을 요청하고 있습니다.',
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }

  const data = await response.json() as { message?: { content?: string } };
  return {
    briefing: data.message?.content ?? '브리핑 생성에 실패했습니다.',
    generatedAt: new Date().toISOString(),
  };
}

function buildBriefingPrompt(payload: BriefingRequest): string {
  const todayStr = getLocalDateStr();

  const q1Tasks = payload.tasks.filter(t => t.urgent && t.important && !t.completed);
  const overdueTasks = payload.tasks.filter(t => !t.completed && t.dueDate && t.dueDate < todayStr);
  const dueTodayTasks = payload.tasks.filter(t => !t.completed && t.dueDate === todayStr);
  const pendingHabits = payload.habits.filter(h => !h.checkedToday);
  const activeGoals = payload.goals.filter(g => g.status === '진행중');
  const top3 = payload.tasks.filter(t => t.isPinned && !t.completed).slice(0, 3);
  const microStepTasks = payload.tasks.filter(t => !t.completed && t.microStep).slice(0, 2);
  const dueSoonTasks = payload.tasks.filter(t => {
    if (!t.dueDate || t.completed) return false;
    const diff = (new Date(t.dueDate).getTime() - new Date(todayStr).getTime()) / 86400000;
    return diff > 0 && diff <= 3;
  });

  const overdueLines = overdueTasks.length > 0
    ? `- 기한 초과 태스크: ${overdueTasks.map(t => `${t.title}(${t.dueDate})`).join(', ')}`
    : '';
  const dueTodayLines = dueTodayTasks.length > 0
    ? `- 오늘 마감 태스크: ${dueTodayTasks.map(t => t.title).join(', ')}`
    : '';
  const dueSoonLines = dueSoonTasks.length > 0
    ? `- 3일 내 마감 태스크: ${dueSoonTasks.map(t => `${t.title}(${t.dueDate})`).join(', ')}`
    : '';
  const top3Lines = top3.length > 0
    ? `- 오늘 Top 3 (고정): ${top3.map(t => t.title).join(', ')}`
    : '';
  const microStepLines = microStepTasks.length > 0
    ? `- 2분 첫 행동 설정된 태스크: ${microStepTasks.map(t => `${t.title}(첫 행동: ${t.microStep})`).join(', ')}`
    : '';

  return `오늘의 일일 브리핑을 3~5줄로 생성해줘.

현재 데이터:
${top3Lines}
- 즉시 실행 태스크(Q1): ${q1Tasks.map(t => t.title).join(', ') || '없음'}
${overdueLines}
${dueTodayLines}
${dueSoonLines}
${microStepLines}
- 오늘 미체크 습관: ${pendingHabits.map(h => h.name).join(', ') || '없음'}
- 진행중 목표: ${activeGoals.map(g => `${g.title}(${g.progress}%)`).join(', ') || '없음'}

형식:
1. 오늘의 핵심 우선순위 1~2개 (기한 초과/오늘 마감 항목이 있으면 반드시 언급. Top 3가 있으면 그것 기준으로 선택 축소)
2. 2분 안에 시작할 수 있는 첫 행동 힌트 (microStep이 있으면 언급)
3. 습관 체크 리마인더
4. 목표 관련 한 줄 코칭
응답은 한국어로, 친근하고 동기부여되는 톤으로 작성해줘. 불릿포인트 없이 자연스럽게 써줘.`;
}
