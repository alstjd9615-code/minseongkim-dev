import { useEffect, useState } from 'react';
import { useWorkout } from '../../hooks/useWorkout';
import type { CreateWorkoutRequest, WorkoutEntry, WorkoutIntensity, WorkoutType } from '../../types';
import { WORKOUT_TYPES, WORKOUT_INTENSITIES } from '../../types';
import styles from './Workout.module.css';

export function WorkoutLog() {
  const { entries, isSubmitting, isLoading, error, submit, loadEntries, remove } = useWorkout();
  const [workoutType, setWorkoutType] = useState<WorkoutType>('달리기');
  const [durationMin, setDurationMin] = useState('');
  const [intensity, setIntensity] = useState<WorkoutIntensity>('보통');
  const [notes, setNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dur = parseInt(durationMin, 10);
    if (!dur || dur <= 0) return;
    const payload: CreateWorkoutRequest = { workoutType, durationMin: dur, intensity, notes };
    const result = await submit(payload);
    if (result) {
      setDurationMin('');
      setNotes('');
      setSuccessMsg(`✅ ${workoutType} ${dur}분 기록 완료!`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const totalMin = entries.reduce((s, e) => s + (Number(e.durationMin) || 0), 0);
  const totalSessions = entries.length;
  const thisWeek = (() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400_000);
    return entries.filter(e => new Date(e.createdAt) >= weekAgo).length;
  })();

  const intensityBadgeClass = (i: WorkoutIntensity) => {
    if (i === '낮음') return styles.intensityLow;
    if (i === '높음') return styles.intensityHigh;
    return styles.intensityMid;
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2>💪 운동 관리</h2>
        <p>운동 기록을 남기고 꾸준함을 확인하세요</p>
      </div>

      {/* Quick Overview */}
      <div className={styles.overviewGrid}>
        <div className={styles.overviewCard}>
          <div className={styles.overviewIcon}>🏃</div>
          <div className={styles.overviewValue}>{totalSessions}</div>
          <div className={styles.overviewLabel}>총 운동 횟수</div>
        </div>
        <div className={styles.overviewCard}>
          <div className={styles.overviewIcon}>⏱️</div>
          <div className={styles.overviewValue}>{totalMin}</div>
          <div className={styles.overviewLabel}>총 운동 시간 (분)</div>
        </div>
        <div className={styles.overviewCard}>
          <div className={styles.overviewIcon}>🔥</div>
          <div className={styles.overviewValue}>{thisWeek}</div>
          <div className={styles.overviewLabel}>이번 주 운동 횟수</div>
        </div>
      </div>

      {/* 입력 폼 */}
      <div className={styles.inputSection}>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>운동 종류</label>
              <select
                className={styles.fieldSelect}
                value={workoutType}
                onChange={e => setWorkoutType(e.target.value as WorkoutType)}
              >
                {WORKOUT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>운동 시간 (분)</label>
              <input
                type="number"
                className={styles.fieldInput}
                value={durationMin}
                onChange={e => setDurationMin(e.target.value)}
                min={1}
                max={600}
                placeholder="예: 30"
                required
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>강도</label>
              <select
                className={styles.fieldSelect}
                value={intensity}
                onChange={e => setIntensity(e.target.value as WorkoutIntensity)}
              >
                {WORKOUT_INTENSITIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>메모 (선택)</label>
              <input
                type="text"
                className={styles.fieldInput}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="오늘 운동 메모..."
                maxLength={200}
              />
            </div>
          </div>
          <div className={styles.formFooter}>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting || !durationMin}>
              {isSubmitting ? '저장 중...' : '+ 기록 추가'}
            </button>
          </div>
        </form>
      </div>

      {successMsg && <div className={styles.successToast}>{successMsg}</div>}
      {error && <div className={styles.error}>⚠️ {error}</div>}

      {/* 기록 리스트 */}
      <div className={styles.listArea}>
        {isLoading ? (
          <div className={styles.loadingState}>불러오는 중...</div>
        ) : entries.length === 0 ? (
          <div className={styles.emptyState}>
            <span>💪</span>
            <p>운동 기록이 없습니다.<br />첫 번째 운동을 기록해보세요!</p>
          </div>
        ) : (
          entries.map(entry => (
            <WorkoutCard
              key={entry.workoutId}
              entry={entry}
              onDelete={() => void remove(entry.workoutId)}
              intensityClass={intensityBadgeClass(entry.intensity)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function WorkoutCard({
  entry,
  onDelete,
  intensityClass,
}: {
  entry: WorkoutEntry;
  onDelete: () => void;
  intensityClass: string;
}) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardMeta}>
          <span className={`${styles.badge} ${styles.badgeBlue}`}>{entry.workoutType}</span>
          <span className={`${styles.badge} ${intensityClass}`}>{entry.intensity}</span>
          <span className={`${styles.badge} ${styles.badgeGray}`}>⏱ {entry.durationMin}분</span>
        </div>
        <span className={styles.cardDate}>
          {new Date(entry.createdAt).toLocaleDateString('ko-KR', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
          })}
        </span>
      </div>
      {entry.notes && <p className={styles.cardContent}>{entry.notes}</p>}
      <div className={styles.cardActions}>
        <button className={styles.deleteBtn} onClick={onDelete}>삭제</button>
      </div>
    </div>
  );
}
