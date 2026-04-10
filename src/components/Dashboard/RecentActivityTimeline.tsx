import type { RecentActivityItem } from '../../types';
import styles from './Dashboard.module.css';

const TYPE_CONFIG: Record<RecentActivityItem['type'], { icon: string; color: string; label: string }> = {
  diary: { icon: '📓', color: '#3B82F6', label: '일기' },
  workout: { icon: '💪', color: '#22C55E', label: '운동' },
  goal: { icon: '🎯', color: '#F97316', label: '목표' },
  knowledge: { icon: '🧠', color: '#A855F7', label: '지식' },
};

function relativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return '방금 전';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay}일 전`;
  const diffMonth = Math.floor(diffDay / 30);
  return `${diffMonth}달 전`;
}

interface RecentActivityTimelineProps {
  items: RecentActivityItem[];
}

export function RecentActivityTimeline({ items }: RecentActivityTimelineProps) {
  if (items.length === 0) {
    return (
      <div className={styles.timelineEmpty}>
        <span>📋</span>
        <p>아직 활동 기록이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className={styles.timeline}>
      {items.map((item, idx) => {
        const cfg = TYPE_CONFIG[item.type];
        return (
          <div key={idx} className={styles.timelineItem}>
            <div className={styles.timelineDot} style={{ background: cfg.color }}>
              {cfg.icon}
            </div>
            {idx < items.length - 1 && <div className={styles.timelineLine} />}
            <div className={styles.timelineContent}>
              <span className={styles.timelineType} style={{ color: cfg.color }}>{cfg.label}</span>
              <span className={styles.timelineTitle}>{item.title}</span>
              <span className={styles.timelineTime}>{relativeTime(item.createdAt)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
