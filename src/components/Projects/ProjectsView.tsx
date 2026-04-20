import { useEffect, useState } from 'react';
import { useProjects } from '../../hooks/useProjects';
import { useTasksContext } from '../../contexts/useTasksContext';
import { getLocalDateStr } from '../../utils/date';
import type {
  CreateProjectRequest, ProjectEntry, ProjectMilestone,
  ProjectStatus, ProjectTask, TaskEntry, UpdateProjectRequest,
} from '../../types';
import { PROJECT_STATUSES } from '../../types';
import styles from './Projects.module.css';

function calcProgress(entry: ProjectEntry): number {
  const tasks = entry.milestones.flatMap(m => m.tasks);
  if (tasks.length === 0) return entry.progress;
  return Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100);
}

function calcMilestoneProgress(ms: ProjectMilestone): number {
  if (ms.tasks.length === 0) return ms.status === '완료' ? 100 : 0;
  return Math.round((ms.tasks.filter(t => t.completed).length / ms.tasks.length) * 100);
}

function getDdayLabel(dueDate: string): string {
  const today = getLocalDateStr();
  if (dueDate < today) {
    const diff = Math.round((new Date(today).getTime() - new Date(dueDate).getTime()) / 86400000);
    return `D+${diff}`;
  }
  if (dueDate === today) return 'D-Day';
  const diff = Math.round((new Date(dueDate).getTime() - new Date(today).getTime()) / 86400000);
  return `D-${diff}`;
}

function getDdayClass(dueDate: string): string {
  const today = getLocalDateStr();
  if (dueDate < today) return styles.ddayOverdue;
  if (dueDate === today) return styles.ddayToday;
  const diff = Math.round((new Date(dueDate).getTime() - new Date(today).getTime()) / 86400000);
  if (diff <= 3) return styles.ddaySoon;
  return styles.ddayNormal;
}

function statusClass(s: ProjectStatus) {
  if (s === '진행중') return styles.badgeActive;
  if (s === '완료')  return styles.badgeDone;
  if (s === '보류')  return styles.badgeHold;
  return styles.badgePlan;
}

export function ProjectsView() {
  const { entries, isSubmitting, isLoading, error, submit, loadEntries, update, remove } = useProjects();
  const { entries: taskEntries, loadEntries: loadTasks } = useTasksContext();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('계획');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [tags, setTags] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    void loadEntries();
    void loadTasks();
  }, [loadEntries, loadTasks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const payload: CreateProjectRequest = {
      title: title.trim(),
      description: description.trim(),
      status,
      startDate: startDate || undefined,
      dueDate: dueDate || undefined,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    };
    const result = await submit(payload);
    if (result) {
      setTitle(''); setDescription(''); setStatus('계획'); setStartDate(''); setDueDate(''); setTags('');
      setSuccessMsg(`✅ 프로젝트 「${result.title}」 등록 완료!`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const toggleExpand = (id: string) => setExpandedId(prev => (prev === id ? null : id));

  const handleStatusChange = (entry: ProjectEntry, s: ProjectStatus) =>
    void update(entry.projectId, { status: s });

  const handleAddMilestone = (entry: ProjectEntry, msTitle: string, msDueDate?: string) => {
    if (!msTitle.trim()) return;
    const ms: ProjectMilestone = {
      milestoneId: crypto.randomUUID(),
      title: msTitle.trim(),
      status: '미완료',
      dueDate: msDueDate || undefined,
      tasks: [],
    };
    const payload: UpdateProjectRequest = { milestones: [...entry.milestones, ms] };
    void update(entry.projectId, payload);
  };

  const handleToggleMilestone = (entry: ProjectEntry, msId: string) => {
    const milestones = entry.milestones.map(m =>
      m.milestoneId === msId ? { ...m, status: m.status === '완료' ? '미완료' as const : '완료' as const } : m
    );
    void update(entry.projectId, { milestones });
  };

  const handleAddTask = (entry: ProjectEntry, msId: string, taskTitle: string) => {
    if (!taskTitle.trim()) return;
    const task: ProjectTask = { taskId: crypto.randomUUID(), title: taskTitle.trim(), completed: false };
    const milestones = entry.milestones.map(m =>
      m.milestoneId === msId ? { ...m, tasks: [...m.tasks, task] } : m
    );
    void update(entry.projectId, { milestones });
  };

  const handleToggleTask = (entry: ProjectEntry, msId: string, taskId: string) => {
    const milestones = entry.milestones.map(m =>
      m.milestoneId === msId
        ? { ...m, tasks: m.tasks.map(t => t.taskId === taskId ? { ...t, completed: !t.completed } : t) }
        : m
    );
    const progress = (() => {
      const allTasks = milestones.flatMap(m => m.tasks);
      return allTasks.length ? Math.round(allTasks.filter(t => t.completed).length / allTasks.length * 100) : entry.progress;
    })();
    void update(entry.projectId, { milestones, progress });
  };

  const active = entries.filter(e => e.status === '진행중').length;
  const done   = entries.filter(e => e.status === '완료').length;
  const total  = entries.length;
  const avgProg = total ? Math.round(entries.reduce((s, e) => s + calcProgress(e), 0) / total) : 0;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2>🗂️ 프로젝트 관리</h2>
        <p>프로젝트를 생성하고 마일스톤과 태스크로 진행률을 추적하세요</p>
      </div>

      <div className={styles.overviewGrid}>
        <div className={styles.overviewCard}><div className={styles.overviewIcon}>📁</div><div className={styles.overviewValue}>{total}</div><div className={styles.overviewLabel}>전체 프로젝트</div></div>
        <div className={styles.overviewCard}><div className={styles.overviewIcon}>🔥</div><div className={styles.overviewValue}>{active}</div><div className={styles.overviewLabel}>진행 중</div></div>
        <div className={styles.overviewCard}><div className={styles.overviewIcon}>✅</div><div className={styles.overviewValue}>{done}</div><div className={styles.overviewLabel}>완료</div></div>
        <div className={styles.overviewCard}><div className={styles.overviewIcon}>📈</div><div className={styles.overviewValue}>{avgProg}%</div><div className={styles.overviewLabel}>평균 진행률</div></div>
      </div>

      <div className={styles.inputSection}>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>프로젝트 제목 *</label>
              <input className={styles.fieldInput} value={title} onChange={e => setTitle(e.target.value)} placeholder="프로젝트 이름" required maxLength={200} />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>상태</label>
              <select className={styles.fieldSelect} value={status} onChange={e => setStatus(e.target.value as ProjectStatus)}>
                {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>시작일</label>
              <input type="date" className={styles.fieldInput} value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>마감일</label>
              <input type="date" className={styles.fieldInput} value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
            <div className={styles.fieldGroup} style={{ gridColumn: '1 / -1' }}>
              <label className={styles.fieldLabel}>설명 (선택)</label>
              <textarea className={styles.fieldTextarea} value={description} onChange={e => setDescription(e.target.value)} placeholder="프로젝트 설명" maxLength={500} />
            </div>
            <div className={styles.fieldGroup} style={{ gridColumn: '1 / -1' }}>
              <label className={styles.fieldLabel}>태그 (쉼표 구분)</label>
              <input className={styles.fieldInput} value={tags} onChange={e => setTags(e.target.value)} placeholder="개발, 디자인, 마케팅" />
            </div>
          </div>
          <div className={styles.formFooter}>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting || !title.trim()}>
              {isSubmitting ? '저장 중...' : '🗂️ 프로젝트 등록'}
            </button>
          </div>
        </form>
      </div>

      {successMsg && <div className={styles.successToast}>{successMsg}</div>}
      {error && <div className={styles.error}>⚠️ {error}</div>}

      <div className={styles.listArea}>
        {isLoading ? (
          <div className={styles.loadingState}>불러오는 중...</div>
        ) : entries.length === 0 ? (
          <div className={styles.emptyState}>
            <span>🗂️</span>
            <p>등록된 프로젝트가 없습니다.<br />첫 번째 프로젝트를 만들어보세요!</p>
          </div>
        ) : (
          entries.map(entry => {
            const linkedTasks = taskEntries.filter(t => t.projectId === entry.projectId);
            return (
              <ProjectCard
                key={entry.projectId}
                entry={entry}
                linkedTasks={linkedTasks}
                isExpanded={expandedId === entry.projectId}
                onToggleExpand={() => toggleExpand(entry.projectId)}
                onStatusChange={s => handleStatusChange(entry, s)}
                onDelete={() => void remove(entry.projectId)}
                onAddMilestone={(t, d) => handleAddMilestone(entry, t, d)}
                onToggleMilestone={msId => handleToggleMilestone(entry, msId)}
                onAddTask={(msId, t) => handleAddTask(entry, msId, t)}
                onToggleTask={(msId, taskId) => handleToggleTask(entry, msId, taskId)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

function ProjectCard({
  entry, linkedTasks, isExpanded, onToggleExpand, onStatusChange, onDelete,
  onAddMilestone, onToggleMilestone, onAddTask, onToggleTask,
}: {
  entry: ProjectEntry;
  linkedTasks: TaskEntry[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onStatusChange: (s: ProjectStatus) => void;
  onDelete: () => void;
  onAddMilestone: (t: string, dueDate?: string) => void;
  onToggleMilestone: (msId: string) => void;
  onAddTask: (msId: string, t: string) => void;
  onToggleTask: (msId: string, taskId: string) => void;
}) {
  const [newMs, setNewMs] = useState('');
  const [newMsDueDate, setNewMsDueDate] = useState('');
  const [taskInputs, setTaskInputs] = useState<Record<string, string>>({});
  const progress = calcProgress(entry);
  const totalMs = entry.milestones.length;
  const doneMs = entry.milestones.filter(m => m.status === '완료').length;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader} onClick={onToggleExpand}>
        <div className={styles.cardMeta}>
          <span className={`${styles.badge} ${statusClass(entry.status)}`}>{entry.status}</span>
          {entry.tags?.map(t => (
            <span key={t} className={`${styles.badge} ${styles.badgePlan}`}>{t}</span>
          ))}
        </div>
        <div className={styles.cardTitle}>{entry.title}</div>
        <div className={styles.cardMeta} style={{ marginLeft: 'auto', gap: 8 }}>
          {totalMs > 0 && (
            <span className={styles.msSummary}>마일스톤 {doneMs}/{totalMs} 완료</span>
          )}
          {entry.dueDate && <div className={styles.cardDate}>📅 {entry.dueDate}</div>}
        </div>
        <span className={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</span>
      </div>

      <div className={styles.progressWrap}>
        <div className={styles.progressLabel}><span>진행률</span><span>{progress}%</span></div>
        <div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${progress}%` }} /></div>
      </div>

      {isExpanded && (
        <div className={styles.cardBody}>
          {entry.description && <p style={{ fontSize: 13, color: 'var(--text)', marginBottom: 12 }}>{entry.description}</p>}

          <div className={styles.milestoneSection}>
            <div className={styles.milestoneSectionTitle}>마일스톤 & 태스크</div>
            {entry.milestones.length === 0 && (
              <div className={styles.emptyMilestone}>아직 마일스톤이 없습니다. 아래에서 추가하세요.</div>
            )}
            {entry.milestones.map(ms => {
              const msProgress = calcMilestoneProgress(ms);
              return (
                <div key={ms.milestoneId} className={styles.milestone}>
                  <div className={styles.milestoneHeader}>
                    <span style={{ fontSize: 14 }}>{ms.status === '완료' ? '✅' : '⬜'}</span>
                    <span className={`${styles.milestoneTitle} ${ms.status === '완료' ? styles.milestoneDone : ''}`}>{ms.title}</span>
                    {ms.dueDate && (
                      <span className={`${styles.ddayBadge} ${getDdayClass(ms.dueDate)}`}>
                        {getDdayLabel(ms.dueDate)} · {ms.dueDate}
                      </span>
                    )}
                    <button className={styles.milestoneToggle} onClick={() => onToggleMilestone(ms.milestoneId)}>
                      {ms.status === '완료' ? '되돌리기' : '완료'}
                    </button>
                  </div>
                  {ms.tasks.length > 0 && (
                    <div className={styles.msProgressWrap}>
                      <div className={styles.msProgressBar}>
                        <div className={styles.msProgressFill} style={{ width: `${msProgress}%` }} />
                      </div>
                      <span className={styles.msProgressLabel}>{msProgress}%</span>
                    </div>
                  )}
                  <div className={styles.taskList}>
                    {ms.tasks.map(task => (
                      <div key={task.taskId} className={styles.taskItem}>
                        <button
                          className={`${styles.taskCheck} ${task.completed ? styles.taskCheckDone : ''}`}
                          onClick={() => onToggleTask(ms.milestoneId, task.taskId)}
                        >
                          {task.completed ? '✓' : ''}
                        </button>
                        <span className={`${styles.taskTitle} ${task.completed ? styles.taskTitleDone : ''}`}>{task.title}</span>
                        {task.dueDate && <span className={styles.taskDate}>{task.dueDate}</span>}
                      </div>
                    ))}
                    <div className={styles.addRow}>
                      <input
                        className={styles.addInput}
                        placeholder="태스크 추가..."
                        value={taskInputs[ms.milestoneId] ?? ''}
                        onChange={e => setTaskInputs(p => ({ ...p, [ms.milestoneId]: e.target.value }))}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            onAddTask(ms.milestoneId, taskInputs[ms.milestoneId] ?? '');
                            setTaskInputs(p => ({ ...p, [ms.milestoneId]: '' }));
                          }
                        }}
                      />
                      <button className={styles.addBtn} onClick={() => {
                        onAddTask(ms.milestoneId, taskInputs[ms.milestoneId] ?? '');
                        setTaskInputs(p => ({ ...p, [ms.milestoneId]: '' }));
                      }}>추가</button>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className={styles.addMilestoneRow}>
              <input
                className={styles.addInput}
                placeholder="마일스톤 추가..."
                value={newMs}
                onChange={e => setNewMs(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    onAddMilestone(newMs, newMsDueDate || undefined);
                    setNewMs('');
                    setNewMsDueDate('');
                  }
                }}
              />
              <input
                type="date"
                className={styles.addDateInput}
                value={newMsDueDate}
                onChange={e => setNewMsDueDate(e.target.value)}
                title="마일스톤 마감일"
              />
              <button className={styles.addBtn} onClick={() => {
                onAddMilestone(newMs, newMsDueDate || undefined);
                setNewMs('');
                setNewMsDueDate('');
              }}>추가</button>
            </div>
          </div>

          {linkedTasks.length > 0 && (
            <div className={styles.linkedTasksSection}>
              <div className={styles.milestoneSectionTitle}>연결된 태스크 ({linkedTasks.length})</div>
              {linkedTasks.map(t => (
                <div key={t.taskId} className={styles.linkedTaskItem}>
                  <span className={`${styles.taskCheck} ${t.completed ? styles.taskCheckDone : ''}`}>
                    {t.completed ? '✓' : ''}
                  </span>
                  <span className={`${styles.taskTitle} ${t.completed ? styles.taskTitleDone : ''}`}>{t.title}</span>
                  {t.dueDate && <span className={styles.taskDate}>📅 {t.dueDate}</span>}
                </div>
              ))}
            </div>
          )}

          <div className={styles.cardActions}>
            <select
              className={styles.fieldSelect}
              style={{ width: 'auto', padding: '4px 8px', fontSize: 12 }}
              value={entry.status}
              onChange={e => onStatusChange(e.target.value as ProjectStatus)}
            >
              {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className={styles.deleteBtn} onClick={onDelete}>삭제</button>
          </div>
        </div>
      )}
    </div>
  );
}
