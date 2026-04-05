import type { DiaryCategory } from '../../types';

const CATEGORY_CONFIG: Record<DiaryCategory, { emoji: string; color: string; bg: string }> = {
  독서: { emoji: '📚', color: '#2563eb', bg: 'rgba(37,99,235,0.1)' },
  운동: { emoji: '💪', color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
  프로젝트: { emoji: '🛠️', color: '#9333ea', bg: 'rgba(147,51,234,0.1)' },
  시사: { emoji: '📰', color: '#ea580c', bg: 'rgba(234,88,12,0.1)' },
  목표: { emoji: '🎯', color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
  아이디어: { emoji: '💡', color: '#ca8a04', bg: 'rgba(202,138,4,0.1)' },
};

interface CategoryBadgeProps {
  category: DiaryCategory;
  size?: 'sm' | 'md';
}

export function CategoryBadge({ category, size = 'md' }: CategoryBadgeProps) {
  const config = CATEGORY_CONFIG[category] ?? { emoji: '📝', color: '#6b7280', bg: 'rgba(107,114,128,0.1)' };
  const fontSize = size === 'sm' ? '12px' : '13px';
  const padding = size === 'sm' ? '3px 8px' : '4px 10px';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding,
        borderRadius: 20,
        fontSize,
        fontWeight: 600,
        color: config.color,
        background: config.bg,
        border: `1px solid ${config.color}33`,
        whiteSpace: 'nowrap',
      }}
    >
      {config.emoji} {category}
    </span>
  );
}

export { CATEGORY_CONFIG };
