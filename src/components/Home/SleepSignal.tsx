import { useState } from 'react';
import { getLocalDateStr } from '../../utils/date';
import styles from './SleepSignal.module.css';

interface SleepRecord {
  date: string;
  hours: number;
  quality: 'good' | 'fair' | 'poor';
}

const STORAGE_KEY = 'sleepSignal_v1';

function loadTodayRecord(today: string): SleepRecord | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SleepRecord;
    return parsed.date === today ? parsed : null;
  } catch {
    return null;
  }
}

function saveRecord(record: SleepRecord) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch { /* quota */ }
}

function getRecoveryMessage(hours: number, quality: 'good' | 'fair' | 'poor'): string {
  if (hours < 6 || quality === 'poor') return '오늘은 피로가 높을 수 있어요. Q1 집중 블록은 짧게 유지하세요.';
  if (hours >= 7 && quality === 'good') return '좋은 컨디션! 오전 집중 타임을 최대한 활용하세요.';
  return '보통 컨디션이에요. 중요한 일을 에너지가 높은 오전에 배치해 보세요.';
}

function getRecoveryEmoji(hours: number, quality: 'good' | 'fair' | 'poor'): string {
  if (hours < 6 || quality === 'poor') return '😴';
  if (hours >= 7 && quality === 'good') return '⚡';
  return '😊';
}

export function SleepSignal() {
  const today = getLocalDateStr();
  const todayRecord = loadTodayRecord(today);
  const [record, setRecord] = useState<SleepRecord | null>(todayRecord);
  const [isEditing, setIsEditing] = useState(false);
  const [hoursInput, setHoursInput] = useState(todayRecord ? String(todayRecord.hours) : '7');
  const [qualityInput, setQualityInput] = useState<'good' | 'fair' | 'poor'>(todayRecord?.quality ?? 'good');

  const handleSave = () => {
    const hours = Math.min(12, Math.max(0, Number(hoursInput)));
    const newRecord: SleepRecord = { date: today, hours, quality: qualityInput };
    saveRecord(newRecord);
    setRecord(newRecord);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className={styles.card}>
        <div className={styles.editTitle}>😴 오늘 수면 기록</div>
        <div className={styles.editRow}>
          <label className={styles.label}>수면 시간</label>
          <input
            type="number"
            className={styles.hoursInput}
            value={hoursInput}
            onChange={e => setHoursInput(e.target.value)}
            min={0}
            max={12}
            step={0.5}
          />
          <span className={styles.unit}>시간</span>
        </div>
        <div className={styles.editRow}>
          <label className={styles.label}>수면 질</label>
          <div className={styles.qualityGroup}>
            {(['good', 'fair', 'poor'] as const).map(q => (
              <button
                key={q}
                className={[styles.qualityBtn, qualityInput === q ? styles.qualityBtnActive : ''].join(' ')}
                onClick={() => setQualityInput(q)}
                type="button"
              >
                {q === 'good' ? '😊 좋음' : q === 'fair' ? '😐 보통' : '😴 나쁨'}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.editActions}>
          <button className={styles.cancelBtn} onClick={() => setIsEditing(false)}>취소</button>
          <button className={styles.saveBtn} onClick={handleSave}>저장</button>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className={styles.card}>
        <div className={styles.emptyRow}>
          <span className={styles.emptyIcon}>😴</span>
          <div className={styles.emptyText}>
            <div className={styles.emptyTitle}>수면 신호 미기록</div>
            <div className={styles.emptyDesc}>오늘 수면을 기록해 집중력 힌트를 받아보세요.</div>
          </div>
          <button className={styles.logBtn} onClick={() => setIsEditing(true)}>기록하기</button>
        </div>
      </div>
    );
  }

  const emoji = getRecoveryEmoji(record.hours, record.quality);
  const message = getRecoveryMessage(record.hours, record.quality);
  const colorClass = record.hours < 6 || record.quality === 'poor'
    ? styles.poor
    : record.hours >= 7 && record.quality === 'good'
      ? styles.good
      : styles.fair;

  return (
    <div className={[styles.card, colorClass].join(' ')}>
      <div className={styles.signalRow}>
        <span className={styles.signalEmoji}>{emoji}</span>
        <div className={styles.signalContent}>
          <div className={styles.signalTitle}>
            수면 {record.hours}시간 · {record.quality === 'good' ? '좋음' : record.quality === 'fair' ? '보통' : '나쁨'}
          </div>
          <div className={styles.signalMsg}>{message}</div>
        </div>
        <button className={styles.editBtn} onClick={() => setIsEditing(true)} title="수정">
          ✏️
        </button>
      </div>
    </div>
  );
}
