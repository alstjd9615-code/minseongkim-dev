import { useEffect, useState } from 'react';
import { useGoals } from '../../hooks/useGoals';
import { useHabits } from '../../hooks/useHabits';
import { useTasks } from '../../hooks/useTasks';
import { AiBriefing } from '../AI/AiBriefing';
import styles from './Home.module.css';

interface Props {
  onNavigate: (section: string) => void;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return '좋은 새벽이에요 🌙';
  if (hour < 12) return '좋은 아침이에요 ☀️';
  if (hour < 18) return '좋은 오후에요 🌤️';
  return '좋은 저녁이에요 🌆';
}

export function HomeDashboard({ onNavigate }: Props) {
  const goals = useGoals();
  const habits = useHabits();
  const tasks = useTasks();
  const [todayStr] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    void goals.loadEntries();
    void habits.loadEntries();
    void tasks.loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeGoals = goals.entries.filter(g => g.status === '진행중').length;
  const doneGoals   = goals.entries.filter(g => g.status === '완료').length;

  const checkedToday = habits.entries.filter(
    h => Array.isArray(h.checkDates) && h.checkDates.includes(todayStr)
  ).length;
  const totalHabits = habits.entries.length;

  const maxStreak = habits.entries.reduce((max, h) => {
    let streak = 0;
    const d = new Date();
    while (Array.isArray(h.checkDates) && h.checkDates.includes(d.toISOString().slice(0, 10))) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return Math.max(max, streak);
  }, 0);

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });

  return (
    <div className={styles.container}>
      <div className={styles.heroSection}>
        <h1 className={styles.heroGreeting}>{getGreeting()}</h1>
        <p className={styles.heroDate}>{today}</p>
      </div>

      <AiBriefing
        tasks={tasks.entries}
        habits={habits.entries}
        goals={goals.entries}
      />

      <div className={styles.grid}>
        <div className={`${styles.card} ${styles.cardClickable}`} onClick={() => onNavigate('goals')}>
          <div className={styles.cardIcon}>🎯</div>
          <div className={styles.cardContent}>
            <div className={styles.cardTitle}>목표 현황</div>
            <div className={styles.cardValue}>{activeGoals}<span className={styles.cardUnit}>개 진행중</span></div>
            <div className={styles.cardSub}>{doneGoals}개 달성 완료</div>
          </div>
          <div className={styles.cardArrow}>›</div>
        </div>

        <div className={`${styles.card} ${styles.cardClickable}`} onClick={() => onNavigate('habits')}>
          <div className={styles.cardIcon}>🌱</div>
          <div className={styles.cardContent}>
            <div className={styles.cardTitle}>오늘 습관</div>
            <div className={styles.cardValue}>{checkedToday}<span className={styles.cardUnit}>/{totalHabits}개</span></div>
            <div className={styles.cardSub}>최대 연속 {maxStreak}일 🔥</div>
          </div>
          <div className={styles.cardArrow}>›</div>
        </div>

        <div className={`${styles.card} ${styles.cardClickable}`} onClick={() => onNavigate('lifewheel')}>
          <div className={styles.cardIcon}>🎡</div>
          <div className={styles.cardContent}>
            <div className={styles.cardTitle}>Life Wheel</div>
            <div className={styles.cardValue}>8<span className={styles.cardUnit}>개 영역</span></div>
            <div className={styles.cardSub}>인생 균형 분석하기</div>
          </div>
          <div className={styles.cardArrow}>›</div>
        </div>

        <div className={`${styles.card} ${styles.cardClickable}`} onClick={() => onNavigate('mandalart')}>
          <div className={styles.cardIcon}>🏮</div>
          <div className={styles.cardContent}>
            <div className={styles.cardTitle}>만다라트</div>
            <div className={styles.cardValue}>9×9<span className={styles.cardUnit}> 목표 그리드</span></div>
            <div className={styles.cardSub}>핵심 목표 시각화</div>
          </div>
          <div className={styles.cardArrow}>›</div>
        </div>

        <div className={`${styles.card} ${styles.cardClickable}`} onClick={() => onNavigate('tasks')}>
          <div className={styles.cardIcon}>⚡</div>
          <div className={styles.cardContent}>
            <div className={styles.cardTitle}>우선순위 매트릭스</div>
            <div className={styles.cardValue}>4<span className={styles.cardUnit}>분면</span></div>
            <div className={styles.cardSub}>Eisenhower 분류하기</div>
          </div>
          <div className={styles.cardArrow}>›</div>
        </div>

        <div className={`${styles.card} ${styles.cardClickable}`} onClick={() => onNavigate('projects')}>
          <div className={styles.cardIcon}>🗂️</div>
          <div className={styles.cardContent}>
            <div className={styles.cardTitle}>프로젝트</div>
            <div className={styles.cardValue}>마일스톤<span className={styles.cardUnit}> 관리</span></div>
            <div className={styles.cardSub}>태스크 & 진행률 추적</div>
          </div>
          <div className={styles.cardArrow}>›</div>
        </div>

        <div className={`${styles.card} ${styles.cardClickable}`} onClick={() => onNavigate('journal')}>
          <div className={styles.cardIcon}>📖</div>
          <div className={styles.cardContent}>
            <div className={styles.cardTitle}>저널</div>
            <div className={styles.cardValue}>주간 / 월간<span className={styles.cardUnit}> 회고</span></div>
            <div className={styles.cardSub}>KPT 템플릿 포함</div>
          </div>
          <div className={styles.cardArrow}>›</div>
        </div>

        <div className={`${styles.card} ${styles.cardClickable}`} onClick={() => onNavigate('knowledge')}>
          <div className={styles.cardIcon}>🧠</div>
          <div className={styles.cardContent}>
            <div className={styles.cardTitle}>지식 관리</div>
            <div className={styles.cardValue}>책 / 아티클<span className={styles.cardUnit}> 정리</span></div>
            <div className={styles.cardSub}>AI 자동 요약</div>
          </div>
          <div className={styles.cardArrow}>›</div>
        </div>

        <div className={`${styles.card} ${styles.cardClickable} ${styles.cardAccent}`} onClick={() => onNavigate('assistant')}>
          <div className={styles.cardIcon}>🤖</div>
          <div className={styles.cardContent}>
            <div className={styles.cardTitle}>AI 어시스턴트</div>
            <div className={styles.cardValue}>무엇이든<span className={styles.cardUnit}> 물어보세요</span></div>
            <div className={styles.cardSub}>당신의 AI 라이프 코치</div>
          </div>
          <div className={styles.cardArrow}>›</div>
        </div>
      </div>
    </div>
  );
}
