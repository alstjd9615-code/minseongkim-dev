import { useState, useCallback } from 'react';
import { generateBriefing } from '../../api/briefing';
import type { TaskEntry, HabitEntry, GoalEntry } from '../../types';
import styles from './AiBriefing.module.css';

interface Props {
  tasks: TaskEntry[];
  habits: HabitEntry[];
  goals: GoalEntry[];
}

export function AiBriefing({ tasks, habits, goals }: Props) {
  const [briefing, setBriefing] = useState<string>('');
  const [generatedAt, setGeneratedAt] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateBriefing({
        tasks: tasks.map(t => ({
          title: t.title,
          urgent: t.urgent,
          important: t.important,
          completed: t.completed,
        })),
        habits: habits.map(h => ({
          name: h.name,
          checkedToday: Array.isArray(h.checkDates) && h.checkDates.includes(todayStr),
        })),
        goals: goals.map(g => ({
          title: g.title,
          status: g.status,
          progress: g.progress ?? 0,
        })),
      });
      setBriefing(result.briefing);
      setGeneratedAt(result.generatedAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI 브리핑 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [tasks, habits, goals, todayStr]);

  const formattedTime = generatedAt
    ? new Date(generatedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className={styles.briefingCard}>
      <div className={styles.briefingHeader}>
        <div className={styles.briefingTitle}>
          <span className={styles.briefingIcon}>🤖</span>
          AI 오늘의 브리핑
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {formattedTime && <span className={styles.briefingTime}>{formattedTime} 생성</span>}
          {briefing && (
            <button
              className={styles.refreshBtn}
              onClick={() => void handleGenerate()}
              disabled={isLoading}
            >
              🔄 새로고침
            </button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className={styles.skeleton}>
          <div className={styles.skeletonLine} />
          <div className={styles.skeletonLine} />
          <div className={styles.skeletonLine} />
        </div>
      )}

      {!isLoading && error && (
        <div className={styles.errorText}>⚠️ {error}</div>
      )}

      {!isLoading && !error && briefing && (
        <div className={styles.briefingText}>{briefing}</div>
      )}

      {!isLoading && !error && !briefing && (
        <>
          <div className={styles.emptyText}>
            오늘의 태스크, 습관, 목표를 분석해 맞춤 브리핑을 생성합니다.
          </div>
          <button
            className={styles.generateBtn}
            onClick={() => void handleGenerate()}
            disabled={isLoading}
          >
            ✨ 오늘의 브리핑 생성하기
          </button>
        </>
      )}
    </div>
  );
}
