import { useState } from 'react';
import { useTasksContext } from '../../contexts/useTasksContext';
import { classifyTask } from '../../api/taskClassify';
import type { CreateTaskRequest } from '../../types';
import styles from './QuickAdd.module.css';

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

interface Props {
  onSuccess?: () => void;
}

export function QuickAdd({ onSuccess }: Props) {
  const { submit } = useTasksContext();
  const [value, setValue] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = value.trim();
    if (!title || isBusy) return;

    setIsBusy(true);
    setError('');
    setSuccessMsg('');

    try {
      // Step 1: AI 분류
      const { urgent, important } = await classifyTask(title);

      // Step 2: 태스크 생성
      const payload: CreateTaskRequest = { title, urgent, important };
      const result = await submit(payload);

      if (result) {
        const q = getQuadrant(urgent, important);
        setValue('');
        setSuccessMsg(`✅ ${QUADRANT_LABELS[q]}으로 추가됐어요!`);
        setTimeout(() => setSuccessMsg(''), 3000);
        onSuccess?.();
      } else {
        setError('태스크 저장에 실패했습니다. 다시 시도해주세요.');
      }
    } catch {
      setError('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className={styles.quickAdd}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <span className={styles.icon}>⚡</span>
        <input
          className={styles.input}
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="빠른 할 일 추가 — 입력 후 Enter (AI가 자동 분류)"
          maxLength={200}
          disabled={isBusy}
        />
        <button
          type="submit"
          className={styles.addBtn}
          disabled={isBusy || !value.trim()}
        >
          {isBusy ? <span className={styles.spinner} /> : '+'}
        </button>
      </form>
      {successMsg && <div className={styles.successMsg}>{successMsg}</div>}
      {error && <div className={styles.errorMsg}>{error}</div>}
    </div>
  );
}
