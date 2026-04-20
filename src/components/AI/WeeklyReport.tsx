import { useState, useCallback, useEffect, useRef } from 'react';
import { generateWeeklyReport, getISOWeekKey } from '../../api/weeklyReport';
import type { TaskEntry, HabitEntry, GoalEntry, ProjectEntry } from '../../types';
import styles from './AiBriefing.module.css';
import reportStyles from './Report.module.css';

interface Props {
  tasks: TaskEntry[];
  habits: HabitEntry[];
  goals: GoalEntry[];
  projects: ProjectEntry[];
}

const CACHE_PREFIX = 'weeklyReport-';

export function WeeklyReport({ tasks, habits, goals, projects }: Props) {
  const [report, setReport] = useState('');
  const [weekLabel, setWeekLabel] = useState('');
  const [generatedAt, setGeneratedAt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoTriggeredRef = useRef(false);

  const weekKey = getISOWeekKey();
  const cacheKey = `${CACHE_PREFIX}${weekKey}`;

  const handleGenerate = useCallback(async (bustCache = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateWeeklyReport(tasks, habits, goals, projects);
      setReport(result.report);
      setWeekLabel(result.weekLabel);
      setGeneratedAt(result.generatedAt);
      try {
        if (bustCache) sessionStorage.removeItem(cacheKey);
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({ report: result.report, weekLabel: result.weekLabel, generatedAt: result.generatedAt }),
        );
      } catch { /* storage quota */ }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI 주간 리포트 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [tasks, habits, goals, projects, cacheKey]);

  useEffect(() => {
    if (autoTriggeredRef.current) return;
    if (tasks.length + habits.length + goals.length === 0) return;

    autoTriggeredRef.current = true;

    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as { report: string; weekLabel: string; generatedAt: string };
        setReport(parsed.report);
        setWeekLabel(parsed.weekLabel);
        setGeneratedAt(parsed.generatedAt);
        return;
      } catch { /* fall through */ }
    }

    void handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks.length, habits.length, goals.length]);

  const formattedTime = generatedAt
    ? new Date(generatedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className={styles.briefingCard}>
      <div className={styles.briefingHeader}>
        <div className={styles.briefingTitle}>
          <span className={styles.briefingIcon}>📊</span>
          AI 주간 리포트
          {weekLabel && <span className={reportStyles.weekLabel}>{weekLabel}</span>}
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

      {!isLoading && !error && !report && (
        <>
          <div className={styles.emptyText}>
            이번 주 태스크, 습관, 목표, 프로젝트 데이터를 분석해 AI 주간 리포트를 생성합니다.
          </div>
          <button className={styles.generateBtn} onClick={() => void handleGenerate()} disabled={isLoading}>
            ✨ 주간 리포트 생성하기
          </button>
        </>
      )}
    </div>
  );
}
