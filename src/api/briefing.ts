import { authHeaders } from '../lib/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export interface BriefingRequest {
  tasks: { title: string; urgent: boolean; important: boolean; completed: boolean }[];
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
  const q1Tasks = payload.tasks.filter(t => t.urgent && t.important && !t.completed);
  const pendingHabits = payload.habits.filter(h => !h.checkedToday);
  const activeGoals = payload.goals.filter(g => g.status === '진행중');

  return `오늘의 일일 브리핑을 3~5줄로 생성해줘.

현재 데이터:
- 즉시 실행 태스크(Q1): ${q1Tasks.map(t => t.title).join(', ') || '없음'}
- 오늘 미체크 습관: ${pendingHabits.map(h => h.name).join(', ') || '없음'}
- 진행중 목표: ${activeGoals.map(g => `${g.title}(${g.progress}%)`).join(', ') || '없음'}

형식: 
1. 오늘의 핵심 우선순위 1~2개
2. 습관 체크 리마인더
3. 목표 관련 한 줄 코칭
응답은 한국어로, 친근하고 동기부여되는 톤으로 작성해줘. 불릿포인트 없이 자연스럽게 써줘.`;
}
