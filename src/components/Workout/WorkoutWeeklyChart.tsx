import { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import type { WorkoutEntry } from '../../types';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

interface WorkoutWeeklyChartProps {
  entries: WorkoutEntry[];
}

export function WorkoutWeeklyChart({ entries }: WorkoutWeeklyChartProps) {
  const chartData = useMemo(() => {
    const now = new Date();
    const days: { day: string; minutes: number; date: Date }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);
      days.push({ day: DAY_LABELS[d.getDay()], minutes: 0, date: d });
    }

    for (const entry of entries) {
      const entryDate = new Date(entry.createdAt);
      entryDate.setHours(0, 0, 0, 0);
      const dayItem = days.find(d => d.date.toDateString() === entryDate.toDateString());
      if (dayItem) {
        dayItem.minutes += Number(entry.durationMin) || 0;
      }
    }

    return days.map(d => ({ day: d.day, minutes: d.minutes }));
  }, [entries]);

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <XAxis
          dataKey="day"
          tick={{ fontSize: 12, fill: 'var(--text)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--text)' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          formatter={(value) => [`${value as number}분`, '운동 시간']}
          contentStyle={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, idx) => (
            <Cell
              key={idx}
              fill={entry.minutes > 0 ? '#3B82F6' : 'var(--code-bg)'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
