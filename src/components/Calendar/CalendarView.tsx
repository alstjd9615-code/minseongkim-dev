import { useEffect, useState } from 'react';
import { useTasks } from '../../hooks/useTasks';
import type { TaskEntry, TaskQuadrant } from '../../types';
import styles from './Calendar.module.css';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function getQuadrant(urgent: boolean, important: boolean): TaskQuadrant {
  if (urgent && important) return 'Q1';
  if (!urgent && important) return 'Q2';
  if (urgent && !important) return 'Q3';
  return 'Q4';
}

function buildMonthDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Parse a YYYY-MM-DD string as local time to avoid UTC-offset display issues */
function toLocalDateLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

export function CalendarView() {
  const { entries, isLoading, loadEntries } = useTasks();
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const todayStr = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const tasksByDate = entries.reduce<Record<string, TaskEntry[]>>((acc, task) => {
    if (task.dueDate) {
      acc[task.dueDate] = acc[task.dueDate] ? [...acc[task.dueDate], task] : [task];
    }
    return acc;
  }, {});

  const days = buildMonthDays(year, month);

  const prevMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const selectedTasks = tasksByDate[selectedDate] ?? [];

  return (
    <div className={styles.calendarPanel}>
      <div className={styles.header}>
        <h2>📅 캘린더</h2>
        <p>태스크 마감일 기반 일정 보기</p>
      </div>

      <div className={styles.calendarCard}>
        <div className={styles.monthNav}>
          <button className={styles.navBtn} onClick={prevMonth}>‹</button>
          <div className={styles.monthTitle}>
            {year}년 {month + 1}월
          </div>
          <button className={styles.navBtn} onClick={nextMonth}>›</button>
        </div>

        <div className={styles.weekdayRow}>
          {WEEKDAYS.map(w => (
            <div key={w} className={styles.weekday}>{w}</div>
          ))}
        </div>

        {isLoading ? (
          <div className={styles.emptyMessage}>로딩 중…</div>
        ) : (
          <div className={styles.daysGrid}>
            {days.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className={`${styles.dayCell} ${styles.dayCellEmpty}`} />;
              }
              const dateStr = toDateStr(year, month, day);
              const dayTasks = tasksByDate[dateStr] ?? [];
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;

              return (
                <div
                  key={dateStr}
                  className={[
                    styles.dayCell,
                    isToday ? styles.dayCellToday : '',
                    isSelected ? styles.dayCellSelected : '',
                  ].join(' ')}
                  onClick={() => setSelectedDate(dateStr)}
                >
                  <span className={isToday ? styles.todayNumber : styles.dayNumber}>
                    {day}
                  </span>
                  {dayTasks.length > 0 && (
                    <div className={styles.dotRow}>
                      {dayTasks.slice(0, 4).map((t, i) => {
                        const q = getQuadrant(t.urgent, t.important);
                        const dotClass = t.completed
                          ? styles.dotDone
                          : q === 'Q1' ? styles.dotQ1
                          : q === 'Q2' ? styles.dotQ2
                          : q === 'Q3' ? styles.dotQ3
                          : styles.dotQ4;
                        return <span key={i} className={`${styles.dot} ${dotClass}`} />;
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={styles.taskListCard}>
        <div className={styles.taskListHeader}>
          📋 {toLocalDateLabel(selectedDate)} 태스크
        </div>
        {selectedTasks.length === 0 ? (
          <div className={styles.emptyMessage}>이 날 마감인 태스크가 없습니다.</div>
        ) : (
          selectedTasks.map(task => {
            const q = getQuadrant(task.urgent, task.important);
            return (
              <div
                key={task.taskId}
                className={`${styles.taskListItem} ${task.completed ? styles.completed : ''}`}
              >
                <span className={`${styles.taskBadge} ${styles[`badge${q}`]}`}>{q}</span>
                <span style={{ flex: 1 }}>{task.title}</span>
                {task.completed && <span style={{ fontSize: 14 }}>✅</span>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
