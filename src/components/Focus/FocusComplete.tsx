import { useState } from 'react';
import { useJournal } from '../../hooks/useJournal';
import { getLocalDateStr } from '../../utils/date';
import type { TaskEntry } from '../../types';
import styles from './FocusComplete.module.css';

interface Props {
  task: TaskEntry;
  cycles: number;
  onDone: () => void;
}

/**
 * Post-session reflection overlay shown after a task is marked complete.
 * Offers an optional one-line reflection that gets saved as a journal entry.
 */
export function FocusComplete({ task, cycles, onDone }: Props) {
  const journal = useJournal();
  const [reflection, setReflection] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    const text = reflection.trim();
    if (!text) {
      onDone();
      return;
    }
    setIsSaving(true);
    const today = getLocalDateStr();
    await journal.submit({
      journalType: 'kpt',
      title: `집중 완료: ${task.title}`,
      kpt: {
        keep: text,
        problem: '',
        tryNext: '',
      },
      periodStart: today,
      periodEnd: today,
    });
    setSaved(true);
    setIsSaving(false);
    setTimeout(onDone, 900);
  };

  const handleSkip = () => onDone();

  if (saved) {
    return (
      <div className={styles.overlay}>
        <div className={styles.card}>
          <div className={styles.savedIcon}>✅</div>
          <div className={styles.savedText}>저장됐어요!</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.emoji}>🎉</div>
        <h2 className={styles.title}>{task.title}</h2>
        <p className={styles.subtitle}>
          완료했습니다!
          {cycles > 0 && (
            <span className={styles.cyclesBadge}>🍅 {cycles}세트</span>
          )}
        </p>

        <div className={styles.reflectionSection}>
          <label className={styles.reflectionLabel}>
            ✏️ 한 줄 회고 <span className={styles.optional}>(선택사항)</span>
          </label>
          <textarea
            className={styles.textarea}
            value={reflection}
            onChange={e => setReflection(e.target.value)}
            placeholder="오늘 이 태스크에서 배운 것, 느낀 것, 다음에 시도할 것..."
            rows={3}
            maxLength={300}
            autoFocus
          />
        </div>

        <div className={styles.actions}>
          <button
            className={styles.skipBtn}
            onClick={handleSkip}
            disabled={isSaving}
          >
            건너뛰기
          </button>
          <button
            className={styles.saveBtn}
            onClick={() => void handleSave()}
            disabled={isSaving}
          >
            {isSaving ? '저장 중…' : reflection.trim() ? '💾 저장 & 홈으로' : '홈으로'}
          </button>
        </div>
      </div>
    </div>
  );
}
