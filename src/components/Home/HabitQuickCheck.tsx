import type { HabitEntry } from '../../types';
import { getLocalDateStr } from '../../utils/date';
import styles from './HabitQuickCheck.module.css';

const MAX_VISIBLE = 4;

interface Props {
  habits: HabitEntry[];
  onToggle: (habitId: string, date: string) => void;
  onNavigate: (section: string) => void;
}

export function HabitQuickCheck({ habits, onToggle, onNavigate }: Props) {
  const today = getLocalDateStr();

  const unchecked = habits.filter(
    h => !(Array.isArray(h.checkDates) && h.checkDates.includes(today)),
  );
  const checked = habits.filter(
    h => Array.isArray(h.checkDates) && h.checkDates.includes(today),
  );
  const allDone = habits.length > 0 && unchecked.length === 0;

  if (habits.length === 0) return null;

  // Show unchecked first (up to MAX_VISIBLE), then a few checked ones if room
  const visibleUnchecked = unchecked.slice(0, MAX_VISIBLE);
  const remaining = unchecked.length > MAX_VISIBLE ? unchecked.length - MAX_VISIBLE : 0;

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <span className={styles.title}>
          {allDone ? '🎉 오늘 습관 완료!' : '🌱 오늘 습관 체크'}
        </span>
        <button className={styles.navLink} onClick={() => onNavigate('habits')}>
          전체 보기 →
        </button>
      </div>

      {allDone ? (
        <div className={styles.allDone}>
          <span>
            {checked.length}개 모두 완료 — 오늘도 멋져요!
          </span>
        </div>
      ) : (
        <div className={styles.list}>
          {visibleUnchecked.map(h => (
            <button
              key={h.habitId}
              className={styles.habitBtn}
              onClick={() => onToggle(h.habitId, today)}
              title={`${h.name} 체크`}
            >
              <span className={styles.habitIcon} style={{ color: h.color || '#10B981' }}>
                {h.icon || '✓'}
              </span>
              <span className={styles.habitName}>{h.name}</span>
              <span className={styles.checkCircle}>○</span>
            </button>
          ))}
          {remaining > 0 && (
            <button
              className={styles.moreBtn}
              onClick={() => onNavigate('habits')}
            >
              +{remaining}개 더 보기 →
            </button>
          )}
          {checked.length > 0 && (
            <div className={styles.checkedRow}>
              {checked.slice(0, 3).map(h => (
                <span key={h.habitId} className={styles.checkedBadge} title={h.name}>
                  <span style={{ color: h.color || '#10B981' }}>{h.icon || '✓'}</span>
                </span>
              ))}
              {checked.length > 3 && (
                <span className={styles.checkedMore}>+{checked.length - 3}</span>
              )}
              <span className={styles.checkedLabel}>완료</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
