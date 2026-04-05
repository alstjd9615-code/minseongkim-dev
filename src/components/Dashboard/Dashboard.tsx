import { useEffect } from 'react';
import { useStats } from '../../hooks/useStats';
import { StatsCards } from './StatsCards';
import { CategoryBarChart } from './CategoryBarChart';
import { CategoryPieChart } from './CategoryPieChart';
import { ActivityHeatmap } from './ActivityHeatmap';
import styles from './Dashboard.module.css';

export function Dashboard() {
  const { stats, isLoading, error, load } = useStats();

  useEffect(() => {
    void load();
  }, [load]);

  if (isLoading) {
    return <div className={styles.loadingState}>📊 통계 불러오는 중...</div>;
  }

  if (error) {
    return (
      <div className={styles.dashboardPanel}>
        <div className={styles.errorState}>⚠️ {error}</div>
        <button className={styles.refreshButton} onClick={() => void load()}>다시 시도</button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className={styles.dashboardPanel}>
      <div className={styles.dashboardHeader}>
        <h2>📊 대시보드</h2>
        <p>나의 일상 기록 통계를 한눈에 확인하세요</p>
      </div>

      {stats.total === 0 ? (
        <div className={styles.emptyState}>
          <span>📊</span>
          <p>아직 기록이 없습니다.<br />일상 기록 탭에서 첫 번째 기록을 남겨보세요!</p>
        </div>
      ) : (
        <>
          <StatsCards
            total={stats.total}
            streak={stats.streak}
            mostActiveCategory={stats.mostActiveCategory}
          />

          <div className={styles.chartsRow}>
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle}>카테고리별 기록 수</h3>
              <CategoryBarChart data={stats.categoryBreakdown} />
            </div>
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle}>카테고리 비율</h3>
              <CategoryPieChart data={stats.categoryBreakdown} />
            </div>
          </div>

          <div className={styles.heatmapCard}>
            <h3 className={styles.heatmapTitle}>최근 30일 활동</h3>
            <ActivityHeatmap data={stats.dailyActivity} />
          </div>
        </>
      )}

      <div style={{ textAlign: 'right', marginTop: 8 }}>
        <button className={styles.refreshButton} onClick={() => void load()}>🔄 새로고침</button>
      </div>
    </div>
  );
}
