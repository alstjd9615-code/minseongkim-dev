import { useEffect, useState } from 'react';
import type { DiaryCategory, DiaryEntry, DiaryMood } from '../../types';
import { DIARY_CATEGORIES } from '../../types';
import { useDiary } from '../../hooks/useDiary';
import { DiaryInput } from './DiaryInput';
import { CategoryBadge } from './CategoryBadge';
import styles from './Diary.module.css';

const MOOD_EMOJI: Record<DiaryMood, string> = {
  '좋음': '😊',
  '보통': '😐',
  '나쁨': '😔',
};

export function DiaryList() {
  const { entries, isSubmitting, isLoading, error, submit, loadEntries } = useDiary();
  const [activeFilter, setActiveFilter] = useState<DiaryCategory | undefined>(undefined);
  const [lastEntry, setLastEntry] = useState<DiaryEntry | null>(null);

  useEffect(() => {
    void loadEntries(activeFilter);
  }, [loadEntries, activeFilter]);

  const handleSubmit = async (content: string, mood?: DiaryMood) => {
    const entry = await submit(content, mood);
    if (entry) {
      setLastEntry(entry);
      setTimeout(() => setLastEntry(null), 4000);
    }
  };

  return (
    <div className={styles.diaryPanel}>
      <div className={styles.diaryHeader}>
        <h2>📓 일상 기록</h2>
      </div>

      <DiaryInput onSubmit={handleSubmit} isSubmitting={isSubmitting} />

      {lastEntry && (
        <div className={styles.successToast}>
          <CategoryBadge category={lastEntry.category} size="sm" />
          <span>「{lastEntry.summary}」로 분류되었습니다!</span>
        </div>
      )}

      {error && <div className={styles.error}>⚠️ {error}</div>}

      <div className={styles.filterRow}>
        <button
          className={`${styles.filterBtn} ${!activeFilter ? styles.filterBtnActive : ''}`}
          onClick={() => setActiveFilter(undefined)}
        >
          전체
        </button>
        {DIARY_CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`${styles.filterBtn} ${activeFilter === cat ? styles.filterBtnActive : ''}`}
            onClick={() => setActiveFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className={styles.entryList}>
        {isLoading ? (
          <div className={styles.loadingSpinner}>불러오는 중...</div>
        ) : entries.length === 0 ? (
          <div className={styles.emptyState}>
            <span>📓</span>
            <p>기록이 없습니다.<br />첫 번째 일상을 기록해보세요!</p>
          </div>
        ) : (
          entries.map(entry => <EntryCard key={entry.entryId} entry={entry} />)
        )}
      </div>
    </div>
  );
}

function EntryCard({ entry }: { entry: DiaryEntry }) {
  return (
    <div className={styles.entryCard}>
      <div className={styles.entryMeta}>
        <CategoryBadge category={entry.category} size="sm" />
        {entry.mood && (
          <span className={styles.entryMood} title={entry.mood}>
            {MOOD_EMOJI[entry.mood]}
          </span>
        )}
        <span className={styles.entryDate}>
          {new Date(entry.createdAt).toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
      <p className={styles.entrySummary}>{entry.summary}</p>
      <p className={styles.entryContent}>{entry.originalContent}</p>
      {entry.tags.length > 0 && (
        <div className={styles.entryTags}>
          {entry.tags.map(tag => (
            <span key={tag} className={styles.tag}>#{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}
