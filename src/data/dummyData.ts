/**
 * 초기 더미 데이터 예시
 * 개발/테스트용 — 실제 프로덕션에서는 사용하지 않음
 */

import type { TaskEntry, HabitEntry, GoalEntry } from '../types';

const TODAY = new Date().toISOString().slice(0, 10);
const TOMORROW = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const NEXT_WEEK = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

export const DUMMY_TASKS: TaskEntry[] = [
  {
    userId: 'demo-user',
    taskId: 'task-001',
    title: '포트폴리오 README 업데이트',
    urgent: true,
    important: true,
    quadrant: 'Q1',
    completed: false,
    dueDate: TODAY,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    userId: 'demo-user',
    taskId: 'task-002',
    title: 'Next.js 15 공식 문서 학습',
    urgent: false,
    important: true,
    quadrant: 'Q2',
    completed: false,
    dueDate: NEXT_WEEK,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    userId: 'demo-user',
    taskId: 'task-003',
    title: '팀 슬랙 메시지 답장',
    urgent: true,
    important: false,
    quadrant: 'Q3',
    completed: true,
    dueDate: TODAY,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    userId: 'demo-user',
    taskId: 'task-004',
    title: '유튜브 영상 정리',
    urgent: false,
    important: false,
    quadrant: 'Q4',
    completed: false,
    dueDate: TOMORROW,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    userId: 'demo-user',
    taskId: 'task-005',
    title: 'AWS SAM 배포 자동화',
    urgent: false,
    important: true,
    quadrant: 'Q2',
    completed: false,
    dueDate: NEXT_WEEK,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const DUMMY_HABITS: HabitEntry[] = [
  {
    userId: 'demo-user',
    habitId: 'habit-001',
    name: '아침 독서 30분',
    icon: '📚',
    color: '#3B82F6',
    checkDates: [TODAY],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    userId: 'demo-user',
    habitId: 'habit-002',
    name: '운동 (홈트/헬스)',
    icon: '💪',
    color: '#10B981',
    checkDates: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    userId: 'demo-user',
    habitId: 'habit-003',
    name: '물 2L 마시기',
    icon: '💧',
    color: '#06B6D4',
    checkDates: [TODAY],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    userId: 'demo-user',
    habitId: 'habit-004',
    name: '영어 공부 20분',
    icon: '🇺🇸',
    color: '#F59E0B',
    checkDates: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const DUMMY_GOALS: GoalEntry[] = [
  {
    userId: 'demo-user',
    goalId: 'goal-001',
    period: '단기',
    title: '개인 프로젝트 MVP 배포',
    description: 'AI 라이프 매니저 MVP를 이달 안에 배포한다.',
    status: '진행중',
    progress: 65,
    dueDate: NEXT_WEEK,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    userId: 'demo-user',
    goalId: 'goal-002',
    period: '장기',
    title: '연내 이직 성공',
    description: '목표 회사 3곳에 서류 통과, 최종 합격 1곳',
    status: '진행중',
    progress: 30,
    dueDate: '2025-12-31',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    userId: 'demo-user',
    goalId: 'goal-003',
    period: '단기',
    title: '운동 습관 30일 연속',
    description: '매일 30분 이상 운동으로 기초 체력 만들기',
    status: '진행중',
    progress: 43,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/** AI 브리핑 프롬프트 예시 출력 */
export const DUMMY_BRIEFING = `오늘 가장 중요한 건 '포트폴리오 README 업데이트'예요. 마감이 오늘이니까 오전 중에 완료하는 걸 목표로 잡아봐요.

운동과 영어 공부 습관이 아직 체크 안 됐어요. 짧더라도 오늘 꼭 해보세요 — 연속 스트릭을 지키는 게 장기적으로 훨씬 중요하거든요.

개인 프로젝트 MVP 배포가 65%까지 왔어요. 다음 주 마감까지 오늘 집중해서 80% 이상으로 끌어올릴 수 있을 거예요. 파이팅! 🚀`;
