import type { CategoryStat, DiaryCategory } from '../../types';
import styles from './Dashboard.module.css';

interface StatsCardsProps {
  total: number;
  streak: number;
  mostActiveCategory: DiaryCategory | null;
}

const CATEGORY_EMOJI: Record<string, string> = {
  독서: '📚', 운동: '💪', 프로젝트: '🛠️', 시사: '📰', 목표: '🎯', 아이디어: '💡',
};

export function StatsCards({ total, streak, mostActiveCategory }: StatsCardsProps) {
  return (
    <div className={styles.statsGrid}>
      <div className={styles.statCard}>
        <span className={styles.statLabel}>총 기록 수</span>
        <span className={styles.statValue}>{total}</span>
        <span className={styles.statSub}>개의 일상 기록</span>
      </div>
      <div className={styles.statCard}>
        <span className={styles.statLabel}>연속 기록</span>
        <span className={styles.statValue}>{streak}일</span>
        <span className={styles.statSub}>현재 스트릭</span>
      </div>
      <div className={styles.statCard}>
        <span className={styles.statLabel}>가장 많은 카테고리</span>
        <span className={styles.statValue}>
          {mostActiveCategory
            ? `${CATEGORY_EMOJI[mostActiveCategory] ?? '📝'} ${mostActiveCategory}`
            : '—'}
        </span>
        <span className={styles.statSub}>최다 활동 분야</span>
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
