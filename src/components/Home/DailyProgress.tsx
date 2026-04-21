import type { HabitEntry, TaskEntry } from '../../types';
import { getLocalDateStr } from '../../utils/date';
import styles from './DailyProgress.module.css';

interface Props {
  tasks: TaskEntry[];
  habits: HabitEntry[];
  onNavigate: (section: string) => void;
}

/**
 * Top 3 candidates = pinned tasks + Q1/overdue tasks, up to 3.
 * We track both completed and pending to show progress correctly.
 */
function getTop3Candidates(tasks: TaskEntry[], today: string): TaskEntry[] {
  const pinned = tasks.filter(t => t.isPinned);
  const auto = tasks
    .filter(t => !t.isPinned)
    .filter(t => (t.urgent && t.important) || (!!t.dueDate && t.dueDate <= today));
  return [...pinned, ...auto].slice(0, 3);
}

export function DailyProgress({ tasks, habits, onNavigate }: Props) {
  const today = getLocalDateStr();

  // ── Top 3 progress ───────────────────────────────────────────
  const top3 = getTop3Candidates(tasks, today);
  const top3Total = top3.length;
  const top3Done = top3.filter(t => t.completed).length;
  const progressPct = top3Total > 0 ? Math.round((top3Done / top3Total) * 100) : 0;
  const allTop3Done = top3Total > 0 && top3Done === top3Total;

  // ── Habits today ─────────────────────────────────────────────
  const checkedHabits = habits.filter(
    h => Array.isArray(h.checkDates) && h.checkDates.includes(today),
  ).length;
  const totalHabits = habits.length;
  const habitPct = totalHabits > 0 ? Math.round((checkedHabits / totalHabits) * 100) : 0;

  if (top3Total === 0 && totalHabits === 0) return null;

  return (
    <div className={styles.widget}>
      {top3Total > 0 && (
        <div className={styles.row}>
          <span className={styles.label}>⭐ Top 3</span>
          <div className={styles.bar}>
            <div
              className={[styles.fill, allTop3Done ? styles.fillDone : ''].join(' ')}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className={[styles.count, allTop3Done ? styles.countDone : ''].join(' ')}>
            {top3Done}/{top3Total}
          </span>
        </div>
      )}

      {totalHabits > 0 && (
        <div className={styles.row}>
          <span className={styles.label}>🌱 습관</span>
          <div className={styles.dotRow}>
            {habits.slice(0, 8).map(h => (
              <span
                key={h.habitId}
                className={[
                  styles.dot,
                  Array.isArray(h.checkDates) && h.checkDates.includes(today)
                    ? styles.dotDone
                    : '',
                ].join(' ')}
                title={h.name}
              />
            ))}
            {totalHabits > 8 && (
              <span className={styles.dotMore}>+{totalHabits - 8}</span>
            )}
          </div>
          <span className={[styles.count, habitPct === 100 ? styles.countDone : ''].join(' ')}>
            {checkedHabits}/{totalHabits}
          </span>
        </div>
      )}

      {allTop3Done && (
        <div className={styles.celebration}>
          <span className={styles.celebrationText}>🎉 오늘 Top 3 모두 완료!</span>
          <button
            className={styles.journalBtn}
            onClick={() => onNavigate('journal')}
          >
            📖 오늘 회고 작성하기 →
          </button>
        </div>
      )}
    </div>
  );
}
