import { useEffect, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { BlogPost, BlogStatus, DiaryEntry, UpdateBlogRequest } from '../../types';
import { getDiaryEntries } from '../../api/diary';
import {
  createBlogPost,
  getBlogPosts,
  updateBlogPost,
  deleteBlogPost,
  publishBlogPost,
} from '../../api/blog';
import { CategoryBadge } from '../Diary/CategoryBadge';
import styles from './Blog.module.css';

type FilterStatus = 'all' | 'draft' | 'published';

export function BlogList() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');

  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [previewPost, setPreviewPost] = useState<BlogPost | null>(null);

  const loadPosts = useCallback(async (status?: 'draft' | 'published') => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getBlogPosts(status);
      setPosts(data.posts);
    } catch (err) {
      setError(err instanceof Error ? err.message : '블로그 글을 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts(filter === 'all' ? undefined : filter);
  }, [loadPosts, filter]);

  const handleGenerated = (post: BlogPost) => {
    setPosts(prev => [post, ...prev]);
    setShowGenerateDialog(false);
    setEditingPost(post);
  };

  const handleUpdated = (post: BlogPost) => {
    setPosts(prev => prev.map(p => (p.postId === post.postId ? post : p)));
    setEditingPost(null);
  };

  const handleDeleted = async (postId: string) => {
    if (!confirm('이 블로그 글을 삭제하시겠습니까?')) return;
    try {
      await deleteBlogPost(postId);
      setPosts(prev => prev.filter(p => p.postId !== postId));
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    }
  };

  const handlePublish = async (post: BlogPost) => {
    try {
      const updated = await updateBlogPost(post.postId, { status: 'published' });
      setPosts(prev => prev.map(p => (p.postId === updated.postId ? updated : p)));
    } catch (err) {
      setError(err instanceof Error ? err.message : '발행에 실패했습니다.');
    }
  };

  const handleUnpublish = async (post: BlogPost) => {
    try {
      const updated = await updateBlogPost(post.postId, { status: 'draft' });
      setPosts(prev => prev.map(p => (p.postId === updated.postId ? updated : p)));
    } catch (err) {
      setError(err instanceof Error ? err.message : '임시저장 전환에 실패했습니다.');
    }
  };

  const filteredPosts = filter === 'all' ? posts : posts.filter(p => p.status === filter);

  return (
    <div className={styles.blogPanel}>
      <div className={styles.blogHeader}>
        <h2>✍️ 블로그</h2>
        <div className={styles.headerActions}>
          <button className={styles.generateBtn} onClick={() => setShowGenerateDialog(true)}>
            ✨ AI 블로그 생성
          </button>
        </div>
      </div>

      <div className={styles.filterRow}>
        {(['all', 'draft', 'published'] as FilterStatus[]).map(f => (
          <button
            key={f}
            className={`${styles.filterBtn} ${filter === f ? styles.filterBtnActive : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? '전체' : f === 'draft' ? '임시저장' : '발행됨'}
          </button>
        ))}
      </div>

      {error && <div className={styles.error}>⚠️ {error}</div>}

      <div className={styles.postList}>
        {isLoading ? (
          <div className={styles.loadingSpinner}>불러오는 중...</div>
        ) : filteredPosts.length === 0 ? (
          <div className={styles.emptyState}>
            <span>✍️</span>
            <p>블로그 글이 없습니다.<br />일상 기록으로 AI 블로그를 생성해보세요!</p>
          </div>
        ) : (
          filteredPosts.map(post => (
            <PostCard
              key={post.postId}
              post={post}
              onEdit={() => setEditingPost(post)}
              onPreview={() => setPreviewPost(post)}
              onPublish={() => void handlePublish(post)}
              onUnpublish={() => void handleUnpublish(post)}
              onDelete={() => void handleDeleted(post.postId)}
            />
          ))
        )}
      </div>

      {showGenerateDialog && (
        <GenerateDialog
          onClose={() => setShowGenerateDialog(false)}
          onGenerated={handleGenerated}
        />
      )}

      {editingPost && (
        <BlogEditor
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onSaved={handleUpdated}
        />
      )}

      {previewPost && (
        <BlogPreview
          post={previewPost}
          onClose={() => setPreviewPost(null)}
        />
      )}
    </div>
  );
}

// ── PostCard ─────────────────────────────────────────────────────────────────

interface PostCardProps {
  post: BlogPost;
  onEdit: () => void;
  onPreview: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onDelete: () => void;
}

function PostCard({ post, onEdit, onPreview, onPublish, onUnpublish, onDelete }: PostCardProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const handleExternalPublish = async (platform: 'medium' | 'tistory') => {
    setIsPublishing(true);
    setPublishError(null);
    try {
      const result = await publishBlogPost(post.postId, platform);
      alert(result.message);
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : '발행 실패');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className={styles.postCard}>
      <div className={styles.postCardMeta}>
        <StatusBadge status={post.status} />
        <span className={styles.postDate}>
          {new Date(post.updatedAt).toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>
      <p className={styles.postTitle}>{post.title}</p>
      {post.excerpt && <p className={styles.postExcerpt}>{post.excerpt}</p>}
      {post.tags.length > 0 && (
        <div className={styles.postTags}>
          {post.tags.map(tag => (
            <span key={tag} className={styles.tag}>#{tag}</span>
          ))}
        </div>
      )}
      {publishError && <p className={styles.error} style={{ margin: '4px 0', fontSize: 12 }}>⚠️ {publishError}</p>}
      <div className={styles.postActions}>
        <button className={styles.actionBtn} onClick={onPreview}>👁️ 미리보기</button>
        <button className={styles.actionBtn} onClick={onEdit}>✏️ 편집</button>
        {post.status === 'draft' ? (
          <button className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={onPublish}>
            🚀 발행
          </button>
        ) : (
          <>
            <button className={styles.actionBtn} onClick={onUnpublish}>📝 임시저장으로</button>
            <button
              className={styles.actionBtn}
              onClick={() => void handleExternalPublish('medium')}
              disabled={isPublishing}
            >
              Medium
            </button>
            <button
              className={styles.actionBtn}
              onClick={() => void handleExternalPublish('tistory')}
              disabled={isPublishing}
            >
              Tistory
            </button>
          </>
        )}
        <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={onDelete}>
          🗑️ 삭제
        </button>
      </div>
    </div>
  );
}

// ── StatusBadge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BlogStatus }) {
  return (
    <span
      className={`${styles.statusBadge} ${status === 'published' ? styles.statusPublished : styles.statusDraft}`}
    >
      {status === 'published' ? '✅ 발행됨' : '📝 임시저장'}
    </span>
  );
}

// ── GenerateDialog ────────────────────────────────────────────────────────────

interface GenerateDialogProps {
  onClose: () => void;
  onGenerated: (post: BlogPost) => void;
}

function GenerateDialog({ onClose, onGenerated }: GenerateDialogProps) {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getDiaryEntries();
        setEntries(data.entries);
      } catch (err) {
        setError(err instanceof Error ? err.message : '일상 기록을 불러올 수 없습니다.');
      } finally {
        setIsLoadingEntries(false);
      }
    })();
  }, []);

  const toggleEntry = (entryId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(entryId)) next.delete(entryId);
      else if (next.size < 10) next.add(entryId);
      return next;
    });
  };

  const handleGenerate = async () => {
    if (selectedIds.size === 0) return;
    setIsGenerating(true);
    setError(null);
    try {
      const post = await createBlogPost({ entryIds: Array.from(selectedIds) });
      onGenerated(post);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI 블로그 생성에 실패했습니다.');
      setIsGenerating(false);
    }
  };

  return (
    <div className={styles.generateDialog} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.generateDialogInner}>
        <h3>✨ AI 블로그 생성</h3>
        <p>블로그 글의 소재로 사용할 일상 기록을 선택해주세요 (최대 10개).</p>

        {error && <div className={styles.error}>{error}</div>}

        {isLoadingEntries ? (
          <div className={styles.loadingSpinner}>불러오는 중...</div>
        ) : entries.length === 0 ? (
          <p style={{ textAlign: 'center', opacity: 0.6 }}>일상 기록이 없습니다. 먼저 일상을 기록해주세요.</p>
        ) : (
          <div className={styles.entryPickerList}>
            {entries.map(entry => (
              <label
                key={entry.entryId}
                className={`${styles.entryPickerItem} ${selectedIds.has(entry.entryId) ? styles.entryPickerItemSelected : ''}`}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(entry.entryId)}
                  onChange={() => toggleEntry(entry.entryId)}
                  disabled={!selectedIds.has(entry.entryId) && selectedIds.size >= 10}
                />
                <div className={styles.entryPickerMeta}>
                  <span className={styles.entryPickerSummary}>{entry.summary}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CategoryBadge category={entry.category} size="sm" />
                    <span className={styles.entryPickerDate}>
                      {new Date(entry.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}

        <div className={styles.dialogActions}>
          <button className={styles.actionBtn} onClick={onClose} disabled={isGenerating}>
            취소
          </button>
          <button
            className={`${styles.generateBtn}`}
            onClick={() => void handleGenerate()}
            disabled={selectedIds.size === 0 || isGenerating}
          >
            {isGenerating ? '✨ 생성 중...' : `✨ ${selectedIds.size}개로 블로그 생성`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── BlogEditor ────────────────────────────────────────────────────────────────

interface BlogEditorProps {
  post: BlogPost;
  onClose: () => void;
  onSaved: (post: BlogPost) => void;
}

function BlogEditor({ post, onClose, onSaved }: BlogEditorProps) {
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [excerpt, setExcerpt] = useState(post.excerpt);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (newStatus?: BlogStatus) => {
    setIsSaving(true);
    setError(null);
    const payload: UpdateBlogRequest = { title, content, excerpt };
    if (newStatus) payload.status = newStatus;
    try {
      const updated = await updateBlogPost(post.postId, payload);
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.editorOverlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.editorPanel}>
        <div className={styles.editorHeader}>
          <h3>✏️ 블로그 편집</h3>
          <button className={styles.actionBtn} onClick={onClose}>✕ 닫기</button>
        </div>

        <div className={styles.editorBody}>
          {error && <div className={styles.error}>{error}</div>}

          <div>
            <p className={styles.fieldLabel}>제목</p>
            <input
              className={styles.fieldInput}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="블로그 글 제목"
            />
          </div>

          <div>
            <p className={styles.fieldLabel}>요약</p>
            <input
              className={styles.fieldInput}
              value={excerpt}
              onChange={e => setExcerpt(e.target.value)}
              placeholder="한 줄 요약 (검색 결과, 목록 등에 표시됩니다)"
            />
          </div>

          <div>
            <p className={styles.fieldLabel}>내용 (마크다운)</p>
            <textarea
              className={`${styles.fieldInput} ${styles.fieldTextarea}`}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="마크다운으로 작성하세요..."
            />
          </div>
        </div>

        <div className={styles.editorFooter}>
          <button className={styles.actionBtn} onClick={onClose} disabled={isSaving}>취소</button>
          <button
            className={styles.actionBtn}
            onClick={() => void handleSave()}
            disabled={isSaving}
          >
            {isSaving ? '저장 중...' : '💾 저장'}
          </button>
          {post.status === 'draft' && (
            <button
              className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
              onClick={() => void handleSave('published')}
              disabled={isSaving}
            >
              🚀 발행
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── BlogPreview ───────────────────────────────────────────────────────────────

interface BlogPreviewProps {
  post: BlogPost;
  onClose: () => void;
}

function BlogPreview({ post, onClose }: BlogPreviewProps) {
  return (
    <div className={styles.editorOverlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.editorPanel}>
        <div className={styles.editorHeader}>
          <h3>👁️ 미리보기</h3>
          <button className={styles.actionBtn} onClick={onClose}>✕ 닫기</button>
        </div>
        <div className={styles.editorBody}>
          <article style={{ lineHeight: 1.7, color: 'var(--text-h)' }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
          </article>
        </div>
      </div>
    </div>
  );
}
