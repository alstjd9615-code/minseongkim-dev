import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicPortfolio } from '../../api/portfolio';
import type { Portfolio } from '../../types';
import { PortfolioBlock } from './PortfolioBlock';
import styles from './Portfolio.module.css';

export function PublicPortfolioPage() {
  const { portfolioId } = useParams<{ portfolioId: string }>();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!portfolioId) {
      setIsLoading(false);
      return;
    }
    let active = true;
    (async () => {
      try {
        const data = await getPublicPortfolio(portfolioId);
        if (active) setPortfolio(data);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : '포트폴리오를 불러올 수 없습니다.');
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => { active = false; };
  }, [portfolioId]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100svh', fontSize: 32 }}>
        ✨
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100svh', gap: 12, color: 'var(--text)', opacity: 0.7 }}>
        <span style={{ fontSize: 48 }}>🔒</span>
        <p style={{ fontSize: 16 }}>포트폴리오를 찾을 수 없습니다.</p>
        <a href="/" style={{ color: 'var(--accent)', fontSize: 14 }}>홈으로 돌아가기</a>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px', minHeight: '100svh' }}>
      <div style={{ textAlign: 'center', marginBottom: 32, paddingBottom: 24, borderBottom: '2px solid var(--border)' }}>
        <span style={{ fontSize: 36 }}>✨</span>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-h)', margin: '12px 0 4px' }}>포트폴리오</h1>
        <p style={{ fontSize: 13, color: 'var(--text)', opacity: 0.6 }}>
          AI 포트폴리오 빌더로 생성됨 · 마지막 업데이트: {new Date(portfolio.updatedAt).toLocaleDateString('ko-KR')}
        </p>
      </div>

      <div className={styles.sectionList}>
        {portfolio.sections.map(section => (
          <PortfolioBlock key={section.id} section={section} />
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
        <p style={{ fontSize: 13, color: 'var(--text)', opacity: 0.55 }}>
          Powered by <strong>AI 포트폴리오 빌더</strong> · AWS Bedrock
        </p>
      </div>
    </div>
  );
}
