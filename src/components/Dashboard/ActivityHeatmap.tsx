import type { DailyActivity } from '../../types';
import styles from './Dashboard.module.css';

const INTENSITY_COLORS = [
  'var(--code-bg)',       // 0
  'rgba(170,59,255,0.2)', // 1
  'rgba(170,59,255,0.4)', // 2
  'rgba(170,59,255,0.65)', // 3
  'var(--accent)',        // 4+
];

function getColor(count: number): string {
  const idx = Math.min(count, INTENSITY_COLORS.length - 1);
  return INTENSITY_COLORS[idx];
}

interface ActivityHeatmapProps {
  data: DailyActivity[];
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  return (
    <div>
      <div className={styles.heatmapGrid}>
        {data.map(({ date, count }) => (
          <div
            key={date}
            className={styles.heatmapCell}
            style={{ background: getColor(count) }}
            data-tooltip={`${date}: ${count}개`}
            title={`${date}: ${count}개`}
          />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--text)', opacity: 0.6 }}>
        <span>{data[0]?.date ?? ''}</span>
        <span>{data[data.length - 1]?.date ?? ''}</span>
      </div>
    </div>
  );
}
