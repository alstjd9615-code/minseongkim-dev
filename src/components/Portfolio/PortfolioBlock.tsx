import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { PortfolioSection } from '../../types';
import styles from './Portfolio.module.css';

const SECTION_ICONS: Record<PortfolioSection['type'], string> = {
  intro: '👋',
  experience: '💼',
  skills: '🛠️',
  projects: '🚀',
  education: '🎓',
  contact: '📬',
};

interface PortfolioBlockProps {
  section: PortfolioSection;
}

export function PortfolioBlock({ section }: PortfolioBlockProps) {
  return (
    <section className={styles.block}>
      <div className={styles.blockHeader}>
        <span className={styles.blockIcon} aria-hidden="true">
          {SECTION_ICONS[section.type] ?? '📄'}
        </span>
        <h2 className={styles.blockTitle}>{section.title}</h2>
      </div>
      <div className={styles.blockContent}>
        <div className={styles.markdown}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {section.content}
          </ReactMarkdown>
        </div>
      </div>
    </section>
  );
}
