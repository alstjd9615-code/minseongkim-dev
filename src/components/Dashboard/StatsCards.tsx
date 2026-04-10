import type { CategoryStat, StatsResponse } from '../../types';
import styles from './Dashboard.module.css';

type StatsCardsProps = Pick<
  StatsResponse,
  'total' | 'streak' | 'workoutThisWeek' | 'goalsActive' | 'goalsDone' | 'knowledgeTotal'
>;

const CATEGORY_EMOJI: Record<string, string> = {
  독서: '📚', 운동: '💪', 프로젝트: '🛠️', 시사: '📰', 목표: '🎯', 아이디어: '💡',
};

export function StatsCards({
  total,
  streak,
  workoutThisWeek,
  goalsActive,
  goalsDone,
  knowledgeTotal,
}: StatsCardsProps) {
  return (
    <div className={styles.statsGrid}>
      <div className={styles.statCard}>
        <span className={styles.statIcon}>📓</span>
        <span className={styles.statLabel}>총 일기 수</span>
        <span className={styles.statValue}>{total}</span>
        <span className={styles.statSub}>개의 일상 기록</span>
      </div>
      <div className={styles.statCard}>
        <span className={styles.statIcon}>🔥</span>
        <span className={styles.statLabel}>연속 기록 스트릭</span>
        <span className={styles.statValue}>{streak}일</span>
        <span className={styles.statSub}>현재 스트릭</span>
      </div>
      <div className={styles.statCard}>
        <span className={styles.statIcon}>💪</span>
        <span className={styles.statLabel}>이번 주 운동</span>
        <span className={styles.statValue}>{workoutThisWeek}</span>
        <span className={styles.statSub}>회 운동 완료</span>
      </div>
      <div className={styles.statCard}>
        <span className={styles.statIcon}>🎯</span>
        <span className={styles.statLabel}>진행 중 목표</span>
        <span className={styles.statValue}>{goalsActive}</span>
        <span className={styles.statSub}>개 진행 중</span>
      </div>
      <div className={styles.statCard}>
        <span className={styles.statIcon}>✅</span>
        <span className={styles.statLabel}>달성한 목표</span>
        <span className={styles.statValue}>{goalsDone}</span>
        <span className={styles.statSub}>개 완료</span>
      </div>
      <div className={styles.statCard}>
        <span className={styles.statIcon}>🧠</span>
        <span className={styles.statLabel}>지식 항목 수</span>
        <span className={styles.statValue}>{knowledgeTotal}</span>
        <span className={styles.statSub}>개 기록됨</span>
      </div>
    </div>
  );
}

export function CategoryStats({ breakdown }: { breakdown: CategoryStat[] }) {
  const max = Math.max(...breakdown.map(b => b.count), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {breakdown.map(({ category, count }) => (
        <div key={category} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 28, textAlign: 'right' }}>{CATEGORY_EMOJI[category] ?? '📝'}</span>
          <span style={{ width: 60, fontSize: 13, color: 'var(--text-h)', fontWeight: 500 }}>{category}</span>
          <div style={{ flex: 1, height: 10, borderRadius: 5, background: 'var(--code-bg)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${(count / max) * 100}%`,
                background: 'var(--accent)',
                borderRadius: 5,
                transition: 'width 0.4s ease',
              }}
            />
          </div>
          <span style={{ width: 28, fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{count}</span>
        </div>
      ))}
    </div>
  );
}
