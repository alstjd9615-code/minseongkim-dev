import { useEffect, useState, useMemo } from 'react';
import { useHabits } from '../../hooks/useHabits';
import type { CreateHabitRequest, HabitEntry } from '../../types';
import styles from './Habits.module.css';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#F97316'];
const ICONS = ['💪', '📚', '🧘', '🏃', '💤', '💧', '🥗', '🎯', '✍️', '🎵'];

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildHeatmapDates(): string[] {
  const dates: string[] = [];
  const today = new Date();
  // 16 weeks = 112 days, align to start of week (Sunday)
  const dayOfWeek = today.getDay();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - dayOfWeek - 7 * 15); // go back to start of 16th week
  for (let i = 0; i < 112; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function calcStreak(checkDates: string[]): number {
  if (!checkDates.length) return 0;
  const sorted = [...checkDates].sort().reverse();
  const today = todayStr();
  let streak = 0;
  let current = today;
  for (const d of sorted) {
    if (d === current) {
      streak++;
      const prev = new Date(current);
      prev.setDate(prev.getDate() - 1);
      current = prev.toISOString().slice(0, 10);
    } else {
      break;
    }
  }
  return streak;
}

interface HeatmapProps {
  checkDates: string[];
  color: string;
}

function HabitHeatmap({ checkDates, color }: HeatmapProps) {
  const dateSet = new Set(checkDates);
  const heatmapDates = useMemo(() => buildHeatmapDates(), []);
  const weeks: string[][] = [];
  for (let i = 0; i < 16; i++) {
    weeks.push(heatmapDates.slice(i * 7, i * 7 + 7));
  }

  return (
    <div className={styles.heatmap}>
      {weeks.map((week, wi) => (
        <div key={wi} className={styles.heatmapWeek}>
          {week.map(date => (
            <div
              key={date}
              className={styles.heatmapCell}
              style={{ background: dateSet.has(date) ? color : undefined }}
              title={date}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

interface HabitCardProps {
  habit: HabitEntry;
  onToggle: (habitId: string, date: string) => void;
  onDelete: (habitId: string) => void;
}

function HabitCard({ habit, onToggle, onDelete }: HabitCardProps) {
  const today = todayStr();
  const checkedToday = habit.checkDates.includes(today);
  const streak = calcStreak(habit.checkDates);
  const createdTime = new Date(habit.createdAt).getTime();
  const totalDays = Math.ceil((new Date(today).getTime() + 86400000 - createdTime) / 86400000) || 1;
  const completionRate = Math.round((habit.checkDates.length / totalDays) * 100);

  return (
    <div className={styles.habitCard}>
      <div className={styles.habitCardTop}>
        <div className={styles.habitIcon} style={{ background: habit.color + '22', color: habit.color }}>
          {habit.icon}
        </div>
        <div className={styles.habitInfo}>
          <div className={styles.habitName}>{habit.name}</div>
          <div className={styles.habitStats}>
            🔥 {streak}일 연속 · 달성률 {completionRate}%
          </div>
        </div>
        <div className={styles.habitActions}>
          <button
            className={[styles.checkTodayBtn, checkedToday ? styles.checkedBtn : ''].join(' ')}
            onClick={() => onToggle(habit.habitId, today)}
            title={checkedToday ? '오늘 체크 취소' : '오늘 체크'}
          >
            {checkedToday ? '✓ 완료' : '+ 체크'}
          </button>
          <button className={styles.deleteHabitBtn} onClick={() => onDelete(habit.habitId)}>✕</button>
        </div>
      </div>
      <HabitHeatmap checkDates={habit.checkDates} color={habit.color} />
    </div>
  );
}

export function HabitsTracker() {
  const { entries, isSubmitting, isLoading, error, submit, loadEntries, remove, toggleCheck } = useHabits();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('💪');
  const [color, setColor] = useState(COLORS[0]);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const payload: CreateHabitRequest = { name: name.trim(), icon, color };
    const result = await submit(payload);
    if (result) {
      setName('');
      setSuccessMsg(`✅ 습관 「${result.name}」 추가 완료!`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const totalChecksToday = entries.filter(e => e.checkDates.includes(todayStr())).length;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2>🌱 습관 트래커</h2>
        <p>매일 작은 습관을 쌓아 큰 변화를 만드세요</p>
      </div>

      {/* 오늘의 현황 */}
      <div className={styles.todayBar}>
        <div className={styles.todayStat}>
          <span className={styles.todayIcon}>☀️</span>
          <span>오늘 <strong>{totalChecksToday}</strong> / {entries.length} 완료</span>
        </div>
        <div className={styles.todayProgress}>
          <div
            className={styles.todayProgressFill}
            style={{ width: entries.length ? `${(totalChecksToday / entries.length) * 100}%` : '0%' }}
          />
        </div>
      </div>

      {/* 습관 추가 폼 */}
      <form className={styles.addForm} onSubmit={handleSubmit}>
        <div className={styles.addFormRow}>
          <div className={styles.iconPicker}>
            {ICONS.map(ic => (
              <button
                key={ic}
                type="button"
                className={[styles.iconBtn, icon === ic ? styles.iconBtnActive : ''].join(' ')}
                onClick={() => setIcon(ic)}
              >{ic}</button>
            ))}
          </div>
          <input
            className={styles.habitNameInput}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="습관 이름 입력"
            maxLength={50}
            required
          />
          <div className={styles.colorPicker}>
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                className={[styles.colorDot, color === c ? styles.colorDotActive : ''].join(' ')}
                style={{ background: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
          <button type="submit" className={styles.addBtn} disabled={isSubmitting || !name.trim()}>
            {isSubmitting ? '추가 중…' : '+ 추가'}
          </button>
        </div>
        {error && <div className={styles.errorMsg}>{error}</div>}
        {successMsg && <div className={styles.successMsg}>{successMsg}</div>}
      </form>

      {/* 습관 목록 */}
      <div className={styles.habitList}>
        {isLoading && <div className={styles.loadingMsg}>불러오는 중…</div>}
        {!isLoading && entries.length === 0 && (
          <div className={styles.emptyMsg}>
            <div className={styles.emptyIcon}>🌱</div>
            <div>첫 번째 습관을 추가해보세요!</div>
          </div>
        )}
        {entries.map(habit => (
          <HabitCard
            key={habit.habitId}
            habit={habit}
            onToggle={(id, date) => void toggleCheck(id, date)}
            onDelete={id => void remove(id)}
          />
        ))}
      </div>
    </div>
  );
}
