import { useEffect, useState } from 'react';
import { useTasksContext } from '../../contexts/useTasksContext';
import { getLocalDateStr } from '../../utils/date';
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

interface Props {
  onNavigate?: (section: string) => void;
}

export function CalendarView({ onNavigate }: Props) {
  const { entries, isLoading, loadEntries, update } = useTasksContext();
  const todayStr = getLocalDateStr();
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

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
  const goToday = () => {
    setViewDate(new Date());
    setSelectedDate(todayStr);
  };

  const isCurrentMonth =
    viewDate.getFullYear() === new Date().getFullYear() &&
    viewDate.getMonth() === new Date().getMonth();

  const selectedTasks = tasksByDate[selectedDate] ?? [];

  const handleToggleComplete = (taskId: string, completed: boolean) => {
    void update(taskId, { completed });
  };

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
          {!isCurrentMonth && (
            <button className={styles.todayBtn} onClick={goToday}>
              오늘로 이동
            </button>
          )}
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
          <div className={styles.emptyDateWrap}>
            <div className={styles.emptyMessage}>이 날 마감인 태스크가 없습니다.</div>
            {onNavigate && (
              <button
                className={styles.addTaskCta}
                onClick={() => onNavigate('tasks')}
              >
                ⚡ 이 날 태스크 추가하기
              </button>
            )}
          </div>
        ) : (
          selectedTasks.map(task => {
            const q = getQuadrant(task.urgent, task.important);
            return (
              <div
                key={task.taskId}
                className={`${styles.taskListItem} ${task.completed ? styles.completed : ''}`}
              >
                <button
                  className={styles.checkBtn}
                  onClick={() => handleToggleComplete(task.taskId, !task.completed)}
                  title={task.completed ? '완료 취소' : '완료 처리'}
                >
                  {task.completed ? '✓' : '○'}
                </button>
                <span className={`${styles.taskBadge} ${styles[`badge${q}`]}`}>{q}</span>
                <span style={{ flex: 1 }}>{task.title}</span>
                {task.timeBlockStart && (
                  <span className={styles.calTimeBlock}>
                    🕐 {task.timeBlockStart}{task.timeBlockEnd ? `–${task.timeBlockEnd}` : ''}
                  </span>
                )}
                {task.microStep && (
                  <span className={styles.calMicroStep} title={`첫 행동: ${task.microStep}`}>
                    ⚡
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
