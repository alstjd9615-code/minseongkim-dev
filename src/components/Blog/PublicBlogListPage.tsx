import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { BlogPostSummary } from '../../types';
import { getPublicBlogPosts } from '../../api/blog';

export function PublicBlogListPage() {
  const { userId } = useParams<{ userId: string }>();
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    let active = true;
    (async () => {
      try {
        const data = await getPublicBlogPosts(userId);
        if (active) setPosts(data.posts);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : '블로그를 불러올 수 없습니다.');
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => { active = false; };
  }, [userId]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100svh', fontSize: 32 }}>
        ✨
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100svh', gap: 12, color: 'var(--text)', opacity: 0.7 }}>
        <span style={{ fontSize: 48 }}>⚠️</span>
        <p style={{ fontSize: 16 }}>블로그를 불러올 수 없습니다.</p>
        <a href="/" style={{ color: 'var(--accent)', fontSize: 14 }}>홈으로 돌아가기</a>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px', minHeight: '100svh' }}>
      <div style={{ textAlign: 'center', marginBottom: 40, paddingBottom: 24, borderBottom: '2px solid var(--border)' }}>
        <span style={{ fontSize: 36 }}>✍️</span>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-h)', margin: '12px 0 4px' }}>블로그</h1>
        <p style={{ fontSize: 13, color: 'var(--text)', opacity: 0.6 }}>
          AI 포트폴리오 빌더로 작성됨
        </p>
      </div>

      {posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text)', opacity: 0.55 }}>
          <span style={{ fontSize: 40 }}>📭</span>
          <p style={{ fontSize: 14, marginTop: 12 }}>아직 발행된 글이 없습니다.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {posts.map(post => (
            <Link
              key={post.postId}
              to={`/blog/${userId}/${post.postId}`}
              style={{ textDecoration: 'none' }}
            >
              <article style={{
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: '20px 22px',
                background: 'var(--bg)',
                transition: 'border-color 0.15s, background 0.15s',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-border)';
                  (e.currentTarget as HTMLElement).style.background = 'var(--accent-bg)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLElement).style.background = 'var(--bg)';
                }}
              >
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-h)', margin: '0 0 8px' }}>
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p style={{ fontSize: 14, color: 'var(--text)', margin: '0 0 12px', lineHeight: 1.5, opacity: 0.8 }}>
                    {post.excerpt}
                  </p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  {post.tags.slice(0, 4).map(tag => (
                    <span key={tag} style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 12,
                      background: 'var(--code-bg)',
                      color: 'var(--text)',
                      border: '1px solid var(--border)',
                    }}>
                      #{tag}
                    </span>
                  ))}
                  <span style={{ fontSize: 12, color: 'var(--text)', opacity: 0.6, marginLeft: 'auto' }}>
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString('ko-KR')
                      : new Date(post.updatedAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
        <p style={{ fontSize: 13, color: 'var(--text)', opacity: 0.55 }}>
          Powered by <strong>AI 포트폴리오 빌더</strong> · AWS Bedrock
        </p>
      </div>
    </div>
  );
}
