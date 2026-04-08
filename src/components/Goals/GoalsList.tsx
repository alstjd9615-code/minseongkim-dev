import { useEffect, useState } from 'react';
import { useGoals } from '../../hooks/useGoals';
import type { CreateGoalRequest, GoalEntry, GoalPeriod, GoalStatus, UpdateGoalRequest } from '../../types';
import { GOAL_PERIODS } from '../../types';
import styles from './Goals.module.css';

export function GoalsList() {
  const { entries, isSubmitting, isLoading, error, submit, loadEntries, update, remove } = useGoals();
  const [period, setPeriod] = useState<GoalPeriod>('단기');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<GoalPeriod | '전체'>('전체');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const payload: CreateGoalRequest = { period, title, description, dueDate: dueDate || undefined };
    const result = await submit(payload);
    if (result) {
      setTitle('');
      setDescription('');
      setDueDate('');
      setSuccessMsg(`✅ 목표 「${result.title}」 등록 완료!`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const filtered = filterPeriod === '전체' ? entries : entries.filter(e => e.period === filterPeriod);

  const active = entries.filter(e => e.status === '진행중').length;
  const done = entries.filter(e => e.status === '완료').length;
  const avgProgress = entries.length
    ? Math.round(entries.reduce((s, e) => s + (Number(e.progress) || 0), 0) / entries.length)
    : 0;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2>🎯 목표 관리</h2>
        <p>단기/장기 목표를 설정하고 달성률을 추적하세요</p>
      </div>

      {/* Quick Overview */}
      <div className={styles.overviewGrid}>
        <div className={styles.overviewCard}>
          <div className={styles.overviewIcon}>🔥</div>
          <div className={styles.overviewValue}>{active}</div>
          <div className={styles.overviewLabel}>진행 중인 목표</div>
        </div>
        <div className={styles.overviewCard}>
          <div className={styles.overviewIcon}>✅</div>
          <div className={styles.overviewValue}>{done}</div>
          <div className={styles.overviewLabel}>달성한 목표</div>
        </div>
        <div className={styles.overviewCard}>
          <div className={styles.overviewIcon}>📈</div>
          <div className={styles.overviewValue}>{avgProgress}%</div>
          <div className={styles.overviewLabel}>평균 진행률</div>
        </div>
      </div>

      {/* 입력 폼 */}
      <div className={styles.inputSection}>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>목표 유형</label>
              <select
                className={styles.fieldSelect}
                value={period}
                onChange={e => setPeriod(e.target.value as GoalPeriod)}
              >
                {GOAL_PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>목표 제목 *</label>
              <input
                type="text"
                className={styles.fieldInput}
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="달성하고 싶은 목표를 입력하세요"
                required
                maxLength={200}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>목표 설명 (선택)</label>
              <input
                type="text"
                className={styles.fieldInput}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="목표에 대한 상세 설명"
                maxLength={500}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>목표 기한 (선택)</label>
              <input
                type="date"
                className={styles.fieldInput}
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <div className={styles.formFooter}>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting || !title.trim()}>
              {isSubmitting ? '저장 중...' : '🎯 목표 등록'}
            </button>
          </div>
        </form>
      </div>

      {successMsg && <div className={styles.successToast}>{successMsg}</div>}
      {error && <div className={styles.error}>⚠️ {error}</div>}

      {/* 기간 필터 */}
      <div className={styles.periodFilter}>
        {(['전체', ...GOAL_PERIODS] as const).map(p => (
          <button
            key={p}
            className={`${styles.filterBtn} ${filterPeriod === p ? styles.filterBtnActive : ''}`}
            onClick={() => setFilterPeriod(p)}
          >
            {p}
          </button>
        ))}
      </div>

      {/* 목표 리스트 */}
      <div className={styles.listArea}>
        {isLoading ? (
          <div className={styles.loadingState}>불러오는 중...</div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <span>🎯</span>
            <p>등록된 목표가 없습니다.<br />첫 번째 목표를 설정해보세요!</p>
          </div>
        ) : (
          filtered.map(entry => (
            <GoalCard
              key={entry.goalId}
              entry={entry}
              onUpdate={(payload: UpdateGoalRequest) => void update(entry.goalId, payload)}
              onDelete={() => void remove(entry.goalId)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function GoalCard({
  entry,
  onUpdate,
  onDelete,
}: {
  entry: GoalEntry;
  onUpdate: (payload: UpdateGoalRequest) => void;
  onDelete: () => void;
}) {
  const [progress, setProgress] = useState(Number(entry.progress) || 0);

  const periodClass = entry.period === '단기' ? styles.badgeShort : styles.badgeLong;
  const statusClass =
    entry.status === '완료' ? styles.badgeDone
    : entry.status === '포기' ? styles.badgeQuit
    : styles.badgeActive;

  const handleProgressChange = (val: number) => {
    setProgress(val);
    onUpdate({ progress: val });
  };

  const handleStatusChange = (status: GoalStatus) => {
    onUpdate({ status });
  };

  const progressFillClass = entry.status === '완료' ? styles.progressFillDone : styles.progressFill;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardMeta}>
          <span className={`${styles.badge} ${periodClass}`}>{entry.period}</span>
          <span className={`${styles.badge} ${statusClass}`}>{entry.status}</span>
        </div>
        <span className={styles.cardDate}>
          {new Date(entry.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
        </span>
      </div>
      <div className={styles.cardTitle}>{entry.title}</div>
      {entry.description && <div className={styles.cardDesc}>{entry.description}</div>}
      {entry.dueDate && <div className={styles.dueDate}>📅 기한: {entry.dueDate}</div>}

      <div className={styles.progressWrap}>
        <div className={styles.progressLabel}>
          <span>진행률</span>
          <span>{progress}%</span>
        </div>
        <div className={styles.progressBar}>
          <div className={progressFillClass} style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className={styles.cardActions}>
        <div className={styles.progressInput}>
          <span>진행률:</span>
          <input
            type="range"
            className={styles.progressSlider}
            min={0}
            max={100}
            step={5}
            value={progress}
            onChange={e => handleProgressChange(Number(e.target.value))}
          />
        </div>
        <select
          className={styles.statusSelect}
          value={entry.status}
          onChange={e => handleStatusChange(e.target.value as GoalStatus)}
        >
          <option value="진행중">진행중</option>
          <option value="완료">완료</option>
          <option value="포기">포기</option>
        </select>
        <button className={styles.deleteBtn} onClick={onDelete}>삭제</button>
      </div>
    </div>
  );
}
