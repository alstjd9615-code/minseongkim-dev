import type { Portfolio } from '../../types';
import { PortfolioBlock } from './PortfolioBlock';
import styles from './Portfolio.module.css';

interface PortfolioViewProps {
  portfolio: Portfolio | null;
}

export function PortfolioView({ portfolio }: PortfolioViewProps) {
  if (!portfolio || portfolio.sections.length === 0) {
    return (
      <div className={styles.emptyState}>
        <span>📄</span>
        <p>AI와 대화하면 포트폴리오가<br />여기에 자동으로 생성됩니다.</p>
      </div>
    );
  }

  return (
    <div className={styles.portfolioPanel}>
      <div className={styles.portfolioHeader}>
        <h1 className={styles.portfolioTitle}>포트폴리오</h1>
        <span className={styles.updatedAt}>
          마지막 업데이트: {new Date(portfolio.updatedAt).toLocaleString('ko-KR')}
        </span>
      </div>
      <div className={styles.sectionList}>
        {portfolio.sections.map(section => (
          <PortfolioBlock key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
}
