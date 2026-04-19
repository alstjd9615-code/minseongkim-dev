import { useState, useCallback, useEffect, useRef } from 'react';
import { generateBriefing } from '../../api/briefing';
import { getLocalDateStr } from '../../utils/date';
import type { TaskEntry, HabitEntry, GoalEntry } from '../../types';
import styles from './AiBriefing.module.css';

interface Props {
  tasks: TaskEntry[];
  habits: HabitEntry[];
  goals: GoalEntry[];
  onNavigate?: (section: string) => void;
}

const CACHE_PREFIX = 'aiBriefing-';

export function AiBriefing({ tasks, habits, goals, onNavigate }: Props) {
  const [briefing, setBriefing] = useState<string>('');
  const [generatedAt, setGeneratedAt] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoTriggeredRef = useRef(false);

  const todayStr = getLocalDateStr();
  const cacheKey = `${CACHE_PREFIX}${todayStr}`;

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
          dueDate: t.dueDate,
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
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({ briefing: result.briefing, generatedAt: result.generatedAt }));
      } catch { /* storage quota — silently ignore */ }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI 브리핑 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [tasks, habits, goals, todayStr, cacheKey]);

  // Auto-generate once per day: load from cache, or call API when data arrives
  useEffect(() => {
    if (autoTriggeredRef.current) return;
    if (tasks.length + habits.length + goals.length === 0) return;

    autoTriggeredRef.current = true;

    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as { briefing: string; generatedAt: string };
        setBriefing(parsed.briefing);
        setGeneratedAt(parsed.generatedAt);
        return;
      } catch { /* corrupt cache — fall through to regenerate */ }
    }

    void handleGenerate();
  // handleGenerate depends on tasks/habits/goals — safe to ignore extra deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks.length, habits.length, goals.length]);

  const formattedTime = generatedAt
    ? new Date(generatedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    : '';

  // Replace "[⚡ Q1 보기 →]" style action tokens with clickable spans
  const renderBriefingWithLinks = (text: string) => {
    if (!onNavigate) return <span>{text}</span>;
    const parts = text.split(/(\[.*?→\])/g);
    return (
      <>
        {parts.map((part, i) => {
          const m = part.match(/^\[(.+?)(→)\]$/);
          if (m) {
            const label = m[1].trim();
            const section = label.includes('Q1') ? 'tasks'
              : label.includes('습관') ? 'habits'
              : label.includes('목표') ? 'goals'
              : label.includes('캘린더') ? 'calendar'
              : 'assistant';
            return (
              <button key={i} className={styles.actionLink} onClick={() => onNavigate(section)}>
                {label} →
              </button>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </>
    );
  };

  return (
    <div className={styles.briefingCard}>
      <div className={styles.briefingHeader}>
        <div className={styles.briefingTitle}>
          <span className={styles.briefingIcon}>🤖</span>
          AI 오늘의 브리핑
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {formattedTime && <span className={styles.briefingTime}>{formattedTime} 생성</span>}
          {(briefing || error) && (
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
        <div>
          <div className={styles.errorText}>⚠️ {error}</div>
          <button
            className={styles.generateBtn}
            onClick={() => void handleGenerate()}
            disabled={isLoading}
          >
            🔄 다시 시도
          </button>
        </div>
      )}

      {!isLoading && !error && briefing && (
        <div className={styles.briefingText}>{renderBriefingWithLinks(briefing)}</div>
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
