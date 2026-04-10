import { useEffect, useState } from 'react';
import { useKnowledge } from '../../hooks/useKnowledge';
import type { CreateKnowledgeRequest, KnowledgeEntry, KnowledgeType } from '../../types';
import { KNOWLEDGE_TYPES } from '../../types';
import styles from './Knowledge.module.css';

export function KnowledgeList() {
  const { entries, isSubmitting, isLoading, error, submit, loadEntries, remove } = useKnowledge();
  const [knowledgeType, setKnowledgeType] = useState<KnowledgeType>('책');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [notes, setNotes] = useState('');
  const [filterType, setFilterType] = useState<KnowledgeType | '전체'>('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !notes.trim()) return;
    const payload: CreateKnowledgeRequest = { knowledgeType, title, author, notes };
    const result = await submit(payload);
    if (result) {
      setTitle('');
      setAuthor('');
      setNotes('');
      setSuccessMsg(`✅ 「${result.title}」 저장 완료! AI가 요약했어요.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const typeFiltered = filterType === '전체' ? entries : entries.filter(e => e.knowledgeType === filterType);
  const filtered = searchQuery.trim()
    ? typeFiltered.filter(e => {
        const q = searchQuery.toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          (e.author?.toLowerCase().includes(q) ?? false) ||
          e.notes.toLowerCase().includes(q) ||
          (e.aiSummary?.toLowerCase().includes(q) ?? false) ||
          e.tags.some(t => t.toLowerCase().includes(q))
        );
      })
    : typeFiltered;

  const books = entries.filter(e => e.knowledgeType === '책').length;
  const articles = entries.filter(e => e.knowledgeType === '아티클').length;
  const courses = entries.filter(e => e.knowledgeType === '강의').length;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2>🧠 지식 관리</h2>
        <p>읽은 책, 아티클, 강의를 기록하고 AI 요약으로 지식을 정리하세요</p>
      </div>

      {/* Quick Overview */}
      <div className={styles.overviewGrid}>
        <div className={styles.overviewCard}>
          <div className={styles.overviewIcon}>📚</div>
          <div className={styles.overviewValue}>{books}</div>
          <div className={styles.overviewLabel}>읽은 책</div>
        </div>
        <div className={styles.overviewCard}>
          <div className={styles.overviewIcon}>📰</div>
          <div className={styles.overviewValue}>{articles}</div>
          <div className={styles.overviewLabel}>아티클</div>
        </div>
        <div className={styles.overviewCard}>
          <div className={styles.overviewIcon}>🎓</div>
          <div className={styles.overviewValue}>{courses}</div>
          <div className={styles.overviewLabel}>강의</div>
        </div>
      </div>

      {/* 입력 폼 */}
      <div className={styles.inputSection}>
        <form onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>유형</label>
              <select
                className={styles.fieldSelect}
                value={knowledgeType}
                onChange={e => setKnowledgeType(e.target.value as KnowledgeType)}
              >
                {KNOWLEDGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>제목 *</label>
              <input
                type="text"
                className={styles.fieldInput}
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="책 이름 또는 아티클 제목"
                required
                maxLength={200}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>저자 / 출처 (선택)</label>
              <input
                type="text"
                className={styles.fieldInput}
                value={author}
                onChange={e => setAuthor(e.target.value)}
                placeholder="저자 또는 출처 URL"
                maxLength={200}
              />
            </div>
          </div>
          <div className={styles.fieldGroup} style={{ marginBottom: 10 }}>
            <label className={styles.fieldLabel}>노트 * (AI가 자동 요약합니다)</label>
            <textarea
              className={styles.fieldTextarea}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="핵심 내용, 인상 깊은 구절, 느낀 점 등을 자유롭게 적어보세요..."
              required
              maxLength={5000}
            />
          </div>
          <div className={styles.formFooter}>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting || !title.trim() || !notes.trim()}>
              {isSubmitting ? '🤖 AI 요약 중...' : '✨ 기록 저장'}
            </button>
          </div>
        </form>
      </div>

      {successMsg && <div className={styles.successToast}>{successMsg}</div>}
      {error && <div className={styles.error}>⚠️ {error}</div>}

      {/* 검색 */}
      <div className={styles.searchRow}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          type="text"
          className={styles.searchInput}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="제목, 저자, 내용 검색..."
        />
      </div>

      {/* 타입 필터 */}
      <div className={styles.typeFilter}>
        {(['전체', ...KNOWLEDGE_TYPES] as const).map(t => (
          <button
            key={t}
            className={`${styles.filterBtn} ${filterType === t ? styles.filterBtnActive : ''}`}
            onClick={() => setFilterType(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 리스트 */}
      <div className={styles.listArea}>
        {isLoading ? (
          <div className={styles.loadingState}>불러오는 중...</div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <span>🧠</span>
            <p>지식 기록이 없습니다.<br />첫 번째 책이나 아티클을 기록해보세요!</p>
          </div>
        ) : (
          filtered.map(entry => (
            <KnowledgeCard key={entry.knowledgeId} entry={entry} onDelete={() => void remove(entry.knowledgeId)} />
          ))
        )}
      </div>
    </div>
  );
}

function KnowledgeCard({ entry, onDelete }: { entry: KnowledgeEntry; onDelete: () => void }) {
  const typeBadgeClass = styles.badgePurple;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardMeta}>
          <span className={`${styles.badge} ${typeBadgeClass}`}>{entry.knowledgeType}</span>
        </div>
        <span className={styles.cardDate}>
          {new Date(entry.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
        </span>
      </div>
      <div className={styles.cardTitle}>{entry.title}</div>
      {entry.author && <div className={styles.cardAuthor}>by {entry.author}</div>}
      {entry.aiSummary && (
        <div className={styles.aiSummary}>🤖 {entry.aiSummary}</div>
      )}
      <div className={styles.cardNotes}>{entry.notes}</div>
      {entry.tags.length > 0 && (
        <div className={styles.cardTags}>
          {entry.tags.map(tag => <span key={tag} className={styles.tag}>#{tag}</span>)}
        </div>
      )}
      <div className={styles.cardActions}>
        <button className={styles.deleteBtn} onClick={onDelete}>삭제</button>
      </div>
    </div>
  );
}
