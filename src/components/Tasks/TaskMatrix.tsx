import { useEffect, useState } from 'react';
import { useTasksContext } from '../../contexts/useTasksContext';
import type { CreateTaskRequest, TaskEntry, TaskQuadrant } from '../../types';
import { TASK_QUADRANTS } from '../../types';
import styles from './Tasks.module.css';

const QUADRANT_COLORS: Record<TaskQuadrant, string> = {
  Q1: '#EF4444',
  Q2: '#3B82F6',
  Q3: '#F59E0B',
  Q4: '#6B7280',
};

function getQuadrant(urgent: boolean, important: boolean): TaskQuadrant {
  if (urgent && important) return 'Q1';
  if (!urgent && important) return 'Q2';
  if (urgent && !important) return 'Q3';
  return 'Q4';
}

interface TaskCardProps {
  task: TaskEntry;
  onComplete: (taskId: string, completed: boolean) => void;
  onDelete: (taskId: string) => void;
}

function TaskCard({ task, onComplete, onDelete }: TaskCardProps) {
  return (
    <div className={[styles.taskCard, task.completed ? styles.taskCompleted : ''].join(' ')}>
      <button
        className={styles.taskCheck}
        onClick={() => onComplete(task.taskId, !task.completed)}
        title={task.completed ? '완료 취소' : '완료 처리'}
      >
        {task.completed ? '✓' : '○'}
      </button>
      <div className={styles.taskContent}>
        <div className={styles.taskTitle}>{task.title}</div>
        {task.dueDate && <div className={styles.taskDue}>📅 {task.dueDate}</div>}
      </div>
      <button className={styles.taskDelete} onClick={() => onDelete(task.taskId)}>✕</button>
    </div>
  );
}

interface QuadrantPanelProps {
  quadrant: typeof TASK_QUADRANTS[number];
  tasks: TaskEntry[];
  onComplete: (taskId: string, completed: boolean) => void;
  onDelete: (taskId: string) => void;
}

function QuadrantPanel({ quadrant, tasks, onComplete, onDelete }: QuadrantPanelProps) {
  const color = QUADRANT_COLORS[quadrant.id];
  const active = tasks.filter(t => !t.completed).length;
  return (
    <div className={styles.quadrant} style={{ borderTopColor: color }}>
      <div className={styles.quadrantHeader}>
        <div>
          <div className={styles.quadrantLabel} style={{ color }}>{quadrant.label}</div>
          <div className={styles.quadrantDesc}>{quadrant.desc}</div>
        </div>
        <span className={styles.quadrantCount} style={{ background: color + '22', color }}>
          {active}
        </span>
      </div>
      <div className={styles.taskList}>
        {tasks.length === 0 && <div className={styles.emptyQuadrant}>없음</div>}
        {tasks.map(t => (
          <TaskCard key={t.taskId} task={t} onComplete={onComplete} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

export function TaskMatrix() {
  const { entries, isSubmitting, isLoading, error, submit, loadEntries, update, remove } = useTasksContext();
  const [title, setTitle] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [important, setImportant] = useState(true);
  const [dueDate, setDueDate] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const payload: CreateTaskRequest = {
      title: title.trim(),
      urgent,
      important,
      dueDate: dueDate || undefined,
    };
    const result = await submit(payload);
    if (result) {
      setTitle('');
      setDueDate('');
      setSuccessMsg('✅ 할 일이 추가되었습니다!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleComplete = (taskId: string, completed: boolean) => {
    void update(taskId, { completed });
  };

  const quadrantTasks = (q: TaskQuadrant) =>
    entries.filter(t => getQuadrant(t.urgent, t.important) === q);

  const total = entries.length;
  const done = entries.filter(t => t.completed).length;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2>⚡ 아이젠하워 매트릭스</h2>
        <p>중요도·긴급도로 할 일을 분류해 집중력을 높이세요</p>
      </div>

      {/* 통계 */}
      <div className={styles.statsRow}>
        {TASK_QUADRANTS.map(q => {
          const count = quadrantTasks(q.id).filter(t => !t.completed).length;
          return (
            <div key={q.id} className={styles.statBadge} style={{ borderColor: QUADRANT_COLORS[q.id] }}>
              <span style={{ color: QUADRANT_COLORS[q.id] }}>{q.id}</span>
              <strong>{count}</strong>
            </div>
          );
        })}
        <div className={styles.statDone}>{done}/{total} 완료</div>
      </div>

      {/* 입력 폼 */}
      <form className={styles.addForm} onSubmit={handleSubmit}>
        <div className={styles.addFormRow}>
          <input
            className={styles.taskInput}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="할 일 입력"
            required
            maxLength={200}
          />
          <input
            type="date"
            className={styles.dateInput}
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
          />
          <div className={styles.toggleGroup}>
            <button
              type="button"
              className={[styles.toggleBtn, urgent ? styles.toggleActive : ''].join(' ')}
              onClick={() => setUrgent(v => !v)}
              style={urgent ? { background: '#FEE2E2', color: '#EF4444', borderColor: '#EF4444' } : undefined}
            >⚡ 긴급</button>
            <button
              type="button"
              className={[styles.toggleBtn, important ? styles.toggleActive : ''].join(' ')}
              onClick={() => setImportant(v => !v)}
              style={important ? { background: '#DBEAFE', color: '#3B82F6', borderColor: '#3B82F6' } : undefined}
            >🎯 중요</button>
          </div>
          <div className={styles.quadrantPreview} style={{ color: QUADRANT_COLORS[getQuadrant(urgent, important)] }}>
            → {TASK_QUADRANTS.find(q => q.id === getQuadrant(urgent, important))?.label}
          </div>
          <button type="submit" className={styles.addBtn} disabled={isSubmitting || !title.trim()}>
            {isSubmitting ? '추가 중…' : '+ 추가'}
          </button>
        </div>
        {error && <div className={styles.errorMsg}>{error}</div>}
        {successMsg && <div className={styles.successMsg}>{successMsg}</div>}
      </form>

      {/* 4분면 매트릭스 */}
      {isLoading ? (
        <div className={styles.loadingMsg}>불러오는 중…</div>
      ) : (
        <div className={styles.matrix}>
          {TASK_QUADRANTS.map(q => (
            <QuadrantPanel
              key={q.id}
              quadrant={q}
              tasks={quadrantTasks(q.id)}
              onComplete={handleComplete}
              onDelete={id => void remove(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
