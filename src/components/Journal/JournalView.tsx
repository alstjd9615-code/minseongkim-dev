import { useEffect, useState } from 'react';
import { useJournal } from '../../hooks/useJournal';
import { useTasksContext } from '../../contexts/useTasksContext';
import { useHabits } from '../../hooks/useHabits';
import { useGoals } from '../../hooks/useGoals';
import { useProjects } from '../../hooks/useProjects';
import { WeeklyReport } from '../AI/WeeklyReport';
import { MonthlyReport } from '../AI/MonthlyReport';
import type { CreateJournalRequest, JournalEntry, JournalType, KPTContent, UpdateJournalRequest } from '../../types';
import styles from './Journal.module.css';

const TAB_LABELS: { type: JournalType; label: string; icon: string }[] = [
  { type: 'weekly', label: '주간 회고', icon: '📅' },
  { type: 'monthly', label: '월간 회고', icon: '📆' },
  { type: 'quarterly', label: '분기 회고', icon: '🗓️' },
  { type: 'kpt', label: 'KPT', icon: '🔄' },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

interface EditState {
  journalId: string;
  title: string;
  content: string;
  kpt: KPTContent;
}

export function JournalView() {
  const { entries, isSubmitting, isLoading, error, submit, loadEntries, update, remove } = useJournal();
  const tasks = useTasksContext();
  const habits = useHabits();
  const goals = useGoals();
  const projects = useProjects();
  const [activeType, setActiveType] = useState<JournalType>('weekly');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [kpt, setKpt] = useState<KPTContent>({ keep: '', problem: '', tryNext: '' });
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [editState, setEditState] = useState<EditState | null>(null);

  useEffect(() => {
    void loadEntries(activeType);
    void tasks.loadEntries();
    void habits.loadEntries();
    void goals.loadEntries();
    void projects.loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadEntries, activeType]);

  const handleTabChange = (type: JournalType) => {
    setActiveType(type);
    setTitle('');
    setContent('');
    setKpt({ keep: '', problem: '', tryNext: '' });
    setPeriodStart('');
    setPeriodEnd('');
    setEditState(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateJournalRequest = {
      journalType: activeType,
      title: title.trim(),
      content: activeType !== 'kpt' ? content : undefined,
      kpt: activeType === 'kpt' ? kpt : undefined,
      periodStart: periodStart || undefined,
      periodEnd: periodEnd || undefined,
    };
    const result = await submit(payload);
    if (result) {
      setTitle('');
      setContent('');
      setKpt({ keep: '', problem: '', tryNext: '' });
      setPeriodStart('');
      setPeriodEnd('');
      setSuccessMsg('✅ 저장되었습니다!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleEditStart = (entry: JournalEntry) => {
    setEditState({
      journalId: entry.journalId,
      title: entry.title,
      content: entry.content ?? '',
      kpt: entry.kpt ?? { keep: '', problem: '', tryNext: '' },
    });
  };

  const handleEditSave = async () => {
    if (!editState) return;
    const payload: UpdateJournalRequest = {
      title: editState.title,
      content: activeType !== 'kpt' ? editState.content : undefined,
      kpt: activeType === 'kpt' ? editState.kpt : undefined,
    };
    const result = await update(editState.journalId, payload);
    if (result) {
      setEditState(null);
      setSuccessMsg('✅ 수정되었습니다!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const typeEntries = entries.filter(e => e.journalType === activeType);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2>📖 저널</h2>
        <p>주간·월간 회고와 KPT로 성장을 기록하세요</p>
      </div>

      {/* 탭 */}
      <div className={styles.tabs}>
        {TAB_LABELS.map(tab => (
          <button
            key={tab.type}
            className={[styles.tab, activeType === tab.type ? styles.tabActive : ''].join(' ')}
            onClick={() => handleTabChange(tab.type)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* AI 리포트 (주간/월간 탭에서만 표시) */}
      {activeType === 'weekly' && (
        <WeeklyReport
          tasks={tasks.entries}
          habits={habits.entries}
          goals={goals.entries}
          projects={projects.entries}
        />
      )}
      {activeType === 'monthly' && (
        <MonthlyReport
          tasks={tasks.entries}
          habits={habits.entries}
          goals={goals.entries}
          projects={projects.entries}
        />
      )}

      {/* 입력 폼 */}
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formRow}>
          <input
            className={styles.fieldInput}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="제목"
            required
            maxLength={200}
          />
          <input
            type="date"
            className={styles.dateInput}
            value={periodStart}
            onChange={e => setPeriodStart(e.target.value)}
            title="기간 시작"
          />
          <span className={styles.dateSep}>~</span>
          <input
            type="date"
            className={styles.dateInput}
            value={periodEnd}
            onChange={e => setPeriodEnd(e.target.value)}
            title="기간 종료"
          />
        </div>

        {activeType !== 'kpt' ? (
          <textarea
            className={styles.contentArea}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={activeType === 'weekly' ? '이번 주를 되돌아보세요...' : '이번 달을 되돌아보세요...'}
            rows={5}
          />
        ) : (
          <div className={styles.kptGrid}>
            <div className={styles.kptField}>
              <label className={styles.kptLabel}>✅ Keep — 계속할 것</label>
              <textarea
                className={styles.kptArea}
                value={kpt.keep}
                onChange={e => setKpt(k => ({ ...k, keep: e.target.value }))}
                placeholder="잘 되고 있어서 계속할 것들"
                rows={4}
              />
            </div>
            <div className={styles.kptField}>
              <label className={styles.kptLabel}>⚠️ Problem — 문제점</label>
              <textarea
                className={styles.kptArea}
                value={kpt.problem}
                onChange={e => setKpt(k => ({ ...k, problem: e.target.value }))}
                placeholder="개선이 필요한 문제점들"
                rows={4}
              />
            </div>
            <div className={styles.kptField}>
              <label className={styles.kptLabel}>🚀 Try — 시도할 것</label>
              <textarea
                className={styles.kptArea}
                value={kpt.tryNext}
                onChange={e => setKpt(k => ({ ...k, tryNext: e.target.value }))}
                placeholder="다음에 시도해볼 것들"
                rows={4}
              />
            </div>
          </div>
        )}

        {error && <div className={styles.errorMsg}>{error}</div>}
        {successMsg && <div className={styles.successMsg}>{successMsg}</div>}
        <div className={styles.formFooter}>
          <button type="submit" className={styles.submitBtn} disabled={isSubmitting || !title.trim()}>
            {isSubmitting ? '저장 중…' : '💾 저장하기'}
          </button>
        </div>
      </form>

      {/* 기록 목록 */}
      <div className={styles.listSection}>
        <div className={styles.listHeader}>
          <h3>기록 목록</h3>
          <span className={styles.countBadge}>{typeEntries.length}개</span>
        </div>
        {isLoading && <div className={styles.loadingMsg}>불러오는 중…</div>}
        {!isLoading && typeEntries.length === 0 && (
          <div className={styles.emptyMsg}>아직 기록이 없습니다.</div>
        )}
        <div className={styles.entryList}>
          {typeEntries.map(entry => (
            <div key={entry.journalId} className={styles.entryCard}>
              {editState?.journalId === entry.journalId ? (
                <div className={styles.editForm}>
                  <input
                    className={styles.fieldInput}
                    value={editState.title}
                    onChange={e => setEditState(s => s ? { ...s, title: e.target.value } : s)}
                  />
                  {entry.journalType !== 'kpt' ? (
                    <textarea
                      className={styles.contentArea}
                      value={editState.content}
                      onChange={e => setEditState(s => s ? { ...s, content: e.target.value } : s)}
                      rows={4}
                    />
                  ) : (
                    <div className={styles.kptGrid}>
                      {(['keep', 'problem', 'tryNext'] as const).map(k => (
                        <div key={k} className={styles.kptField}>
                          <label className={styles.kptLabel}>
                            {k === 'keep' ? '✅ Keep' : k === 'problem' ? '⚠️ Problem' : '🚀 Try'}
                          </label>
                          <textarea
                            className={styles.kptArea}
                            value={editState.kpt[k]}
                            onChange={e => setEditState(s => s ? { ...s, kpt: { ...s.kpt, [k]: e.target.value } } : s)}
                            rows={3}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <div className={styles.editActions}>
                    <button className={styles.saveEditBtn} onClick={handleEditSave}>저장</button>
                    <button className={styles.cancelEditBtn} onClick={() => setEditState(null)}>취소</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className={styles.entryTop}>
                    <div>
                      <div className={styles.entryTitle}>{entry.title}</div>
                      <div className={styles.entryMeta}>
                        {formatDate(entry.createdAt)}
                        {entry.periodStart && entry.periodEnd && (
                          <span> · {entry.periodStart} ~ {entry.periodEnd}</span>
                        )}
                      </div>
                    </div>
                    <div className={styles.entryActions}>
                      <button className={styles.editBtn} onClick={() => handleEditStart(entry)}>✏️</button>
                      <button className={styles.deleteBtn} onClick={() => void remove(entry.journalId)}>✕</button>
                    </div>
                  </div>
                  {entry.journalType !== 'kpt' && entry.content && (
                    <div className={styles.entryContent}>{entry.content}</div>
                  )}
                  {entry.journalType === 'kpt' && entry.kpt && (
                    <div className={styles.kptSummary}>
                      {entry.kpt.keep && <div><strong>Keep:</strong> {entry.kpt.keep}</div>}
                      {entry.kpt.problem && <div><strong>Problem:</strong> {entry.kpt.problem}</div>}
                      {entry.kpt.tryNext && <div><strong>Try:</strong> {entry.kpt.tryNext}</div>}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
