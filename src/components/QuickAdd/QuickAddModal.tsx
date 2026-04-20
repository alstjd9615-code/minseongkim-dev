import { useEffect, useRef, useState } from 'react';
import { useTasksContext } from '../../contexts/useTasksContext';
import { useProjects } from '../../hooks/useProjects';
import { classifyTask } from '../../api/taskClassify';
import type { CreateTaskRequest } from '../../types';
import styles from './QuickAdd.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const QUADRANT_LABELS: Record<string, string> = {
  Q1: '🔴 즉시 실행',
  Q2: '🔵 계획',
  Q3: '🟡 위임',
  Q4: '⬜ 제거',
};

function getQuadrant(urgent: boolean, important: boolean): string {
  if (urgent && important) return 'Q1';
  if (!urgent && important) return 'Q2';
  if (urgent && !important) return 'Q3';
  return 'Q4';
}

export function QuickAddModal({ isOpen, onClose }: Props) {
  const { submit } = useTasksContext();
  const { entries: projects, loadEntries: loadProjects, isLoading: projectsLoading } = useProjects();

  const [title, setTitle] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [important, setImportant] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [projectId, setProjectId] = useState('');
  const [milestoneId, setMilestoneId] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      void loadProjects();
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setTitle('');
      setUrgent(false);
      setImportant(false);
      setDueDate('');
      setProjectId('');
      setMilestoneId('');
      setSuccessMsg('');
      setError('');
    }
  }, [isOpen, loadProjects]);

  const selectedProject = projects.find(p => p.projectId === projectId);
  const milestoneOptions = selectedProject?.milestones ?? [];

  const handleProjectChange = (pid: string) => {
    setProjectId(pid);
    setMilestoneId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || isBusy) return;

    setIsBusy(true);
    setError('');
    setSuccessMsg('');

    try {
      let finalUrgent = urgent;
      let finalImportant = important;

      // If user didn't manually set toggles, use AI classification
      if (!urgent && !important) {
        try {
          const classified = await classifyTask(trimmed);
          finalUrgent = classified.urgent;
          finalImportant = classified.important;
        } catch {
          // fallback: use user values (both false → Q4)
        }
      }

      const payload: CreateTaskRequest = {
        title: trimmed,
        urgent: finalUrgent,
        important: finalImportant,
        dueDate: dueDate || undefined,
        projectId: projectId || undefined,
        milestoneId: milestoneId || undefined,
      };

      const result = await submit(payload);
      if (result) {
        const q = getQuadrant(finalUrgent, finalImportant);
        setSuccessMsg(`✅ ${QUADRANT_LABELS[q]}으로 추가됐어요!`);
        setTitle('');
        setDueDate('');
        setProjectId('');
        setMilestoneId('');
        setUrgent(false);
        setImportant(false);
        setTimeout(() => {
          setSuccessMsg('');
          onClose();
        }, 1500);
      } else {
        setError('태스크 저장에 실패했습니다. 다시 시도해주세요.');
      }
    } catch {
      setError('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className={styles.backdrop}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="빠른 태스크 추가"
    >
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>⚡ 빠른 태스크 추가</span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="닫기">✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <input
            ref={inputRef}
            className={styles.titleInput}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="할 일 입력 후 Enter (AI가 자동 분류)"
            maxLength={200}
            disabled={isBusy}
          />

          <div className={styles.toggleRow}>
            <button
              type="button"
              className={[styles.toggle, urgent ? styles.toggleOn : ''].join(' ')}
              onClick={() => setUrgent(v => !v)}
            >
              🔥 긴급
            </button>
            <button
              type="button"
              className={[styles.toggle, important ? styles.toggleImportant : ''].join(' ')}
              onClick={() => setImportant(v => !v)}
            >
              ⭐ 중요
            </button>
            <input
              type="date"
              className={styles.dateInput}
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              title="마감일 (선택)"
            />
          </div>

          <div className={styles.projectRow}>
            <select
              className={styles.projectSelect}
              value={projectId}
              onChange={e => handleProjectChange(e.target.value)}
              disabled={projectsLoading}
            >
              <option value="">🗂️ 프로젝트 선택 (선택사항)</option>
              {projects.map(p => (
                <option key={p.projectId} value={p.projectId}>{p.title}</option>
              ))}
            </select>

            {projectId && milestoneOptions.length > 0 && (
              <select
                className={styles.projectSelect}
                value={milestoneId}
                onChange={e => setMilestoneId(e.target.value)}
              >
                <option value="">마일스톤 선택 (선택사항)</option>
                {milestoneOptions.map(m => (
                  <option key={m.milestoneId} value={m.milestoneId}>{m.title}</option>
                ))}
              </select>
            )}
          </div>

          {successMsg && <div className={styles.successMsg}>{successMsg}</div>}
          {error && <div className={styles.errorMsg}>{error}</div>}

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>취소</button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isBusy || !title.trim()}
            >
              {isBusy ? <span className={styles.spinner} /> : '추가하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
