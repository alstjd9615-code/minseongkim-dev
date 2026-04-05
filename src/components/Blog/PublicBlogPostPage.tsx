import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { BlogPost } from '../../types';
import { getPublicBlogPost } from '../../api/blog';

export function PublicBlogPostPage() {
  const { userId, postId } = useParams<{ userId: string; postId: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !postId) {
      setIsLoading(false);
      return;
    }
    let active = true;
    (async () => {
      try {
        const data = await getPublicBlogPost(userId, postId);
        if (active) setPost(data);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : '블로그 글을 불러올 수 없습니다.');
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => { active = false; };
  }, [userId, postId]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100svh', fontSize: 32 }}>
        ✨
      </div>
    );
  }

  if (error || !post) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100svh', gap: 12, color: 'var(--text)', opacity: 0.7 }}>
        <span style={{ fontSize: 48 }}>🔒</span>
        <p style={{ fontSize: 16 }}>블로그 글을 찾을 수 없습니다.</p>
        <Link to={`/blog/${userId}`} style={{ color: 'var(--accent)', fontSize: 14 }}>블로그 목록으로</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px', minHeight: '100svh' }}>
      <div style={{ marginBottom: 32 }}>
        <Link
          to={`/blog/${userId}`}
          style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          ← 블로그 목록
        </Link>
      </div>

      <header style={{ marginBottom: 32, paddingBottom: 24, borderBottom: '2px solid var(--border)' }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-h)', margin: '0 0 12px', lineHeight: 1.3 }}>
          {post.title}
        </h1>
        {post.excerpt && (
          <p style={{ fontSize: 15, color: 'var(--text)', margin: '0 0 16px', lineHeight: 1.6, opacity: 0.75 }}>
            {post.excerpt}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {post.tags.map(tag => (
            <span key={tag} style={{
              fontSize: 12,
              padding: '3px 10px',
              borderRadius: 12,
              background: 'var(--code-bg)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
            }}>
              #{tag}
            </span>
          ))}
          <span style={{ fontSize: 13, color: 'var(--text)', opacity: 0.6, marginLeft: 'auto' }}>
            {post.publishedAt
              ? new Date(post.publishedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
              : new Date(post.updatedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </header>

      <article style={{
        lineHeight: 1.8,
        color: 'var(--text-h)',
        fontSize: 16,
      }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
      </article>

      <div style={{ textAlign: 'center', marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
        <p style={{ fontSize: 13, color: 'var(--text)', opacity: 0.55 }}>
          Powered by <strong>AI 포트폴리오 빌더</strong> · AWS Bedrock
        </p>
      </div>
    </div>
  );
}
