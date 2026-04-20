import { useState, useCallback, useEffect, useRef } from 'react';
import { generateMonthlyReport, getMonthCacheKey } from '../../api/monthlyReport';
import type { TaskEntry, HabitEntry, GoalEntry, ProjectEntry } from '../../types';
import styles from './AiBriefing.module.css';
import reportStyles from './Report.module.css';

interface Props {
  tasks: TaskEntry[];
  habits: HabitEntry[];
  goals: GoalEntry[];
  projects: ProjectEntry[];
}

export function MonthlyReport({ tasks, habits, goals, projects }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [report, setReport] = useState('');
  const [monthLabel, setMonthLabel] = useState('');
  const [stats, setStats] = useState<{ completedTaskCount: number; avgHabitRate: number; completedGoalCount: number } | null>(null);
  const [generatedAt, setGeneratedAt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoTriggeredRef = useRef(false);

  const cacheKey = getMonthCacheKey(year, month);

  const loadFromCache = useCallback((key: string): boolean => {
    const cached = sessionStorage.getItem(key);
    if (!cached) return false;
    try {
      const parsed = JSON.parse(cached) as {
        report: string; monthLabel: string; generatedAt: string;
        stats: { completedTaskCount: number; avgHabitRate: number; completedGoalCount: number };
      };
      setReport(parsed.report);
      setMonthLabel(parsed.monthLabel);
      setGeneratedAt(parsed.generatedAt);
      setStats(parsed.stats);
      return true;
    } catch { return false; }
  }, []);

  const handleGenerate = useCallback(async (bustCache = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateMonthlyReport(tasks, habits, goals, projects, year, month);
      setReport(result.report);
      setMonthLabel(result.monthLabel);
      setGeneratedAt(result.generatedAt);
      setStats(result.stats);
      try {
        if (bustCache) sessionStorage.removeItem(cacheKey);
        sessionStorage.setItem(cacheKey, JSON.stringify({
          report: result.report,
          monthLabel: result.monthLabel,
          generatedAt: result.generatedAt,
          stats: result.stats,
        }));
      } catch { /* storage quota */ }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI 월간 리포트 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [tasks, habits, goals, projects, year, month, cacheKey]);

  // Auto-generate on initial load
  useEffect(() => {
    if (autoTriggeredRef.current) return;
    if (tasks.length + habits.length + goals.length === 0) return;
    autoTriggeredRef.current = true;
    if (!loadFromCache(cacheKey)) {
      void handleGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks.length, habits.length, goals.length]);

  // When month/year changes
  const handleMonthChange = (newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
    setReport('');
    setStats(null);
    setError(null);
    const key = getMonthCacheKey(newYear, newMonth);
    if (!loadFromCache(key)) {
      void (async () => {
        setIsLoading(true);
        setError(null);
        try {
          const result = await generateMonthlyReport(tasks, habits, goals, projects, newYear, newMonth);
          setReport(result.report);
          setMonthLabel(result.monthLabel);
          setGeneratedAt(result.generatedAt);
          setStats(result.stats);
          try {
            sessionStorage.setItem(key, JSON.stringify({
              report: result.report,
              monthLabel: result.monthLabel,
              generatedAt: result.generatedAt,
              stats: result.stats,
            }));
          } catch { /* quota */ }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'AI 월간 리포트 생성에 실패했습니다.');
        } finally {
          setIsLoading(false);
        }
      })();
    }
  };

  const goPrev = () => {
    const d = new Date(year, month - 2, 1);
    handleMonthChange(d.getFullYear(), d.getMonth() + 1);
  };

  const goNext = () => {
    const d = new Date(year, month, 1);
    handleMonthChange(d.getFullYear(), d.getMonth() + 1);
  };

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const formattedTime = generatedAt
    ? new Date(generatedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className={styles.briefingCard}>
      <div className={styles.briefingHeader}>
        <div className={styles.briefingTitle}>
          <span className={styles.briefingIcon}>📆</span>
          AI 월간 리포트
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {formattedTime && <span className={styles.briefingTime}>{formattedTime} 생성</span>}
          {(report || error) && (
            <button
              className={styles.refreshBtn}
              onClick={() => void handleGenerate(true)}
              disabled={isLoading}
            >
              🔄 재생성
            </button>
          )}
        </div>
      </div>

      {/* Month navigation */}
      <div className={reportStyles.monthNav}>
        <button className={reportStyles.navBtn} onClick={goPrev}>←</button>
        <span className={reportStyles.monthTitle}>{year}년 {month}월</span>
        <button className={reportStyles.navBtn} onClick={goNext} disabled={isCurrentMonth}>→</button>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className={reportStyles.statsGrid}>
          <div className={reportStyles.statCard}>
            <div className={reportStyles.statIcon}>✅</div>
            <div className={reportStyles.statValue}>{stats.completedTaskCount}</div>
            <div className={reportStyles.statLabel}>태스크 완료</div>
          </div>
          <div className={reportStyles.statCard}>
            <div className={reportStyles.statIcon}>🌱</div>
            <div className={reportStyles.statValue}>{stats.avgHabitRate}%</div>
            <div className={reportStyles.statLabel}>습관 체크율</div>
          </div>
          <div className={reportStyles.statCard}>
            <div className={reportStyles.statIcon}>🎯</div>
            <div className={reportStyles.statValue}>{stats.completedGoalCount}</div>
            <div className={reportStyles.statLabel}>목표 달성</div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className={styles.skeleton}>
          <div className={styles.skeletonLine} />
          <div className={styles.skeletonLine} />
          <div className={styles.skeletonLine} />
          <div className={styles.skeletonLine} />
        </div>
      )}

      {!isLoading && error && (
        <div>
          <div className={styles.errorText}>⚠️ {error}</div>
          <button className={styles.generateBtn} onClick={() => void handleGenerate()} disabled={isLoading}>
            🔄 다시 시도
          </button>
        </div>
      )}

      {!isLoading && !error && report && (
        <div className={styles.briefingText}>{report}</div>
      )}

      {!isLoading && !error && !report && !monthLabel && (
        <>
          <div className={styles.emptyText}>아직 기록이 없습니다. 데이터가 쌓이면 AI가 분석해드립니다.</div>
          <button className={styles.generateBtn} onClick={() => void handleGenerate()} disabled={isLoading}>
            ✨ 월간 리포트 생성하기
          </button>
        </>
      )}
    </div>
  );
}
