import { useEffect, useState, useCallback } from 'react';
import { useMandalart } from '../../hooks/useMandalart';
import type { MandalartCell, MandalartEntry } from '../../types';
import styles from './Mandalart.module.css';

// 9x9 mandalart layout
// Block centers (mid-goal positions):
// Block 0: (1,1)=10, Block 1: (1,4)=13, Block 2: (1,7)=16
// Block 3: (4,1)=37, Block 4 core: (4,4)=40, Block 5: (4,7)=43
// Block 6: (7,1)=64, Block 7: (7,4)=67, Block 8: (7,7)=70
const CORE_INDEX = 40;
const MID_GOAL_INDICES = [10, 13, 16, 37, 43, 64, 67, 70];

function getBlockIndex(row: number, col: number): number {
  return Math.floor(row / 3) * 3 + Math.floor(col / 3);
}

function isCoreCell(idx: number): boolean {
  return idx === CORE_INDEX;
}

function isMidGoal(idx: number): boolean {
  return MID_GOAL_INDICES.includes(idx);
}

function emptyCell(): MandalartCell {
  return { text: '', completed: false };
}

function emptyCells(): MandalartCell[] {
  return Array.from({ length: 81 }, emptyCell);
}

function calcAchievement(cells: MandalartCell[]): number {
  const nonEmpty = cells.filter(c => c.text.trim());
  if (nonEmpty.length === 0) return 0;
  const completed = nonEmpty.filter(c => c.completed).length;
  return Math.round((completed / nonEmpty.length) * 100);
}

interface MandalartGridProps {
  cells: MandalartCell[];
  onCellChange: (idx: number, text: string) => void;
  onCellToggle: (idx: number) => void;
}

function MandalartGrid({ cells, onCellChange, onCellToggle }: MandalartGridProps) {
  return (
    <div className={styles.grid}>
      {Array.from({ length: 9 }, (_, row) =>
        Array.from({ length: 9 }, (_, col) => {
          const idx = row * 9 + col;
          const blockIdx = getBlockIndex(row, col);
          const isCore = isCoreCell(idx);
          const isMid = isMidGoal(idx);
          const cell = cells[idx];
          return (
            <div
              key={idx}
              className={[
                styles.cell,
                isCore ? styles.coreCell : '',
                isMid ? styles.midCell : '',
                cell.completed ? styles.completedCell : '',
                blockIdx % 2 === 0 ? styles.evenBlock : styles.oddBlock,
              ].join(' ')}
            >
              <input
                className={styles.cellInput}
                value={cell.text}
                onChange={e => onCellChange(idx, e.target.value)}
                placeholder={isCore ? '핵심 목표' : isMid ? '중간 목표' : ''}
                maxLength={30}
              />
              {cell.text && (
                <button
                  className={styles.checkBtn}
                  onClick={() => onCellToggle(idx)}
                  title={cell.completed ? '완료 취소' : '완료 표시'}
                >
                  {cell.completed ? '✓' : '○'}
                </button>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

export function MandalartView() {
  const { entries, isSubmitting, isLoading, error, submit, loadEntries, update, remove } = useMandalart();
  const [activeEntry, setActiveEntry] = useState<MandalartEntry | null>(null);
  const [localCells, setLocalCells] = useState<MandalartCell[]>(emptyCells());
  const [newTitle, setNewTitle] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const result = await submit({ title: newTitle.trim(), cells: emptyCells() });
    if (result) {
      setActiveEntry(result);
      setLocalCells([...result.cells]);
      setNewTitle('');
      setSuccessMsg('✅ 만다라트가 생성되었습니다!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleSelectEntry = (entry: MandalartEntry) => {
    setActiveEntry(entry);
    setLocalCells(entry.cells.map(c => ({ ...c })));
  };

  const handleCellChange = useCallback((idx: number, text: string) => {
    setLocalCells(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], text };
      return next;
    });
  }, []);

  const handleCellToggle = useCallback((idx: number) => {
    setLocalCells(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], completed: !next[idx].completed };
      return next;
    });
  }, []);

  const handleSave = async () => {
    if (!activeEntry) return;
    setSaving(true);
    const result = await update(activeEntry.mandalartId, { cells: localCells });
    setSaving(false);
    if (result) {
      setActiveEntry(result);
      setSuccessMsg('✅ 저장되었습니다!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const achievement = calcAchievement(localCells);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2>🏮 만다라트</h2>
        <p>9×9 목표 달성 프레임워크로 핵심 목표를 세분화하세요</p>
      </div>

      <div className={styles.body}>
        {/* 사이드바: 목록 + 생성 */}
        <aside className={styles.sidebar}>
          <form className={styles.createForm} onSubmit={handleCreate}>
            <input
              className={styles.titleInput}
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="새 만다라트 제목"
              maxLength={80}
            />
            <button type="submit" className={styles.createBtn} disabled={isSubmitting || !newTitle.trim()}>
              {isSubmitting ? '생성 중…' : '+ 새로 만들기'}
            </button>
          </form>
          {isLoading && <div className={styles.loadingMsg}>불러오는 중…</div>}
          <div className={styles.entryList}>
            {entries.map(entry => (
              <div
                key={entry.mandalartId}
                className={[styles.entryItem, activeEntry?.mandalartId === entry.mandalartId ? styles.entryItemActive : ''].join(' ')}
                onClick={() => handleSelectEntry(entry)}
              >
                <div className={styles.entryTitle}>{entry.title}</div>
                <div className={styles.entryMeta}>
                  {calcAchievement(entry.cells)}% 달성 · {new Date(entry.updatedAt).toLocaleDateString('ko-KR')}
                </div>
                <button
                  className={styles.removeBtn}
                  onClick={e => { e.stopPropagation(); void remove(entry.mandalartId); }}
                >✕</button>
              </div>
            ))}
            {!isLoading && entries.length === 0 && (
              <div className={styles.emptyMsg}>만다라트를 새로 만들어보세요!</div>
            )}
          </div>
        </aside>

        {/* 메인: 그리드 */}
        <main className={styles.main}>
          {activeEntry ? (
            <>
              <div className={styles.gridHeader}>
                <div>
                  <div className={styles.gridTitle}>{activeEntry.title}</div>
                  <div className={styles.achievementBadge}>달성률 {achievement}%</div>
                </div>
                <div className={styles.gridActions}>
                  {error && <span className={styles.errorMsg}>{error}</span>}
                  {successMsg && <span className={styles.successMsg}>{successMsg}</span>}
                  <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                    {saving ? '저장 중…' : '💾 저장'}
                  </button>
                </div>
              </div>
              <div className={styles.gridWrapper}>
                <MandalartGrid
                  cells={localCells}
                  onCellChange={handleCellChange}
                  onCellToggle={handleCellToggle}
                />
              </div>
              <div className={styles.legend}>
                <span className={styles.legendItem}><span className={styles.legendCore} /> 핵심 목표</span>
                <span className={styles.legendItem}><span className={styles.legendMid} /> 중간 목표</span>
                <span className={styles.legendItem}><span className={styles.legendDone} /> 완료</span>
              </div>
            </>
          ) : (
            <div className={styles.noSelection}>
              <div className={styles.noSelectionIcon}>🏮</div>
              <div>왼쪽에서 만다라트를 선택하거나 새로 만들어보세요</div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
