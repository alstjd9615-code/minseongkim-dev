import { useState } from 'react';
import type { TaskEntry } from '../../types';
import { getLocalDateStr } from '../../utils/date';
import styles from './TodayTop3.module.css';

interface Props {
  tasks: TaskEntry[];
  onPin: (taskId: string, isPinned: boolean) => void;
  onComplete: (taskId: string, completed: boolean) => void;
  onNavigate: (section: string) => void;
  onFocus?: (task: TaskEntry) => void;
}

function getDeadlineStatus(dueDate?: string): 'overdue' | 'today' | 'soon' | null {
  if (!dueDate) return null;
  const today = getLocalDateStr();
  if (dueDate < today) return 'overdue';
  if (dueDate === today) return 'today';
  const diff = (new Date(dueDate).getTime() - new Date(today).getTime()) / 86400000;
  if (diff <= 3) return 'soon';
  return null;
}

export function TodayTop3({ tasks, onPin, onComplete, onNavigate, onFocus }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const today = getLocalDateStr();

  // Pinned tasks first, then auto-select top 3 from Q1 / overdue / today
  const pinnedTasks = tasks.filter(t => t.isPinned && !t.completed);
  const autoCandidates = tasks
    .filter(t => !t.isPinned && !t.completed)
    .filter(t => t.urgent && t.important || (t.dueDate && t.dueDate <= today))
    .slice(0, Math.max(0, 3 - pinnedTasks.length));

  const top3 = [...pinnedTasks, ...autoCandidates].slice(0, 3);

  if (top3.length === 0 && pinnedTasks.length === 0) {
    const pendingCount = tasks.filter(t => !t.completed).length;
    return (
      <div className={styles.section}>
        <div className={styles.header}>
          <span className={styles.title}>⭐ 오늘의 Top 3</span>
          <button className={styles.navLink} onClick={() => onNavigate('tasks')}>
            태스크 추가 →
          </button>
        </div>
        <div className={styles.empty}>
          {pendingCount === 0
            ? '🎉 오늘 할 일이 없습니다!'
            : '태스크에서 📌 핀으로 Top 3를 설정하거나 Q1 태스크를 추가하세요.'}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <button className={styles.collapseBtn} onClick={() => setCollapsed(v => !v)}>
          <span className={styles.title}>⭐ 오늘의 Top 3</span>
          <span className={styles.collapseIcon}>{collapsed ? '▸' : '▾'}</span>
        </button>
        <button className={styles.navLink} onClick={() => onNavigate('tasks')}>
          전체 보기 →
        </button>
      </div>

      {!collapsed && (
        <div className={styles.list}>
          {top3.map((task, idx) => {
            const dl = getDeadlineStatus(task.dueDate);
            return (
              <div key={task.taskId} className={[styles.item, task.isPinned ? styles.itemPinned : ''].join(' ')}>
                <span className={styles.rank}>{idx + 1}</span>
                <button
                  className={styles.checkBtn}
                  onClick={() => onComplete(task.taskId, !task.completed)}
                  title="완료"
                >
                  {task.completed ? '✓' : '○'}
                </button>
                <div className={styles.content}>
                  <div className={styles.taskTitle}>{task.title}</div>
                  <div className={styles.meta}>
                    {task.microStep && (
                      <span className={styles.microStep}>⚡ {task.microStep}</span>
                    )}
                    {dl === 'overdue' && <span className={styles.badgeOverdue}>⛔ 기한 초과</span>}
                    {dl === 'today' && <span className={styles.badgeToday}>🔥 오늘 마감</span>}
                    {dl === 'soon' && <span className={styles.badgeSoon}>⏰ 마감 임박</span>}
                    {task.dueDate && !dl && (
                      <span className={styles.due}>📅 {task.dueDate}</span>
                    )}
                    {task.timeBlockStart && (
                      <span className={styles.timeBlock}>
                        🕐 {task.timeBlockStart}{task.timeBlockEnd ? `~${task.timeBlockEnd}` : ''}
                      </span>
                    )}
                  </div>
                </div>
                <div className={styles.actions}>
                  {onFocus && (
                    <button
                      className={styles.focusBtn}
                      onClick={() => onFocus(task)}
                      title="집중 모드"
                    >
                      🎯
                    </button>
                  )}
                  <button
                    className={[styles.pinBtn, task.isPinned ? styles.pinBtnActive : ''].join(' ')}
                    onClick={() => onPin(task.taskId, !task.isPinned)}
                    title={task.isPinned ? '핀 해제' : 'Top 3에 고정'}
                  >
                    📌
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
