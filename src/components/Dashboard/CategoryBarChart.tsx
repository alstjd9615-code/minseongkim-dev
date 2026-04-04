import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { CategoryStat } from '../../types';

const CATEGORY_COLORS: Record<string, string> = {
  독서: '#2563eb',
  운동: '#16a34a',
  프로젝트: '#9333ea',
  시사: '#ea580c',
  목표: '#dc2626',
  아이디어: '#ca8a04',
};

interface CategoryBarChartProps {
  data: CategoryStat[];
}

export function CategoryBarChart({ data }: CategoryBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
        <XAxis
          dataKey="category"
          tick={{ fontSize: 12, fill: 'var(--text)' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--text)' }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontSize: 13,
          }}
          cursor={{ fill: 'var(--accent-bg)' }}
        />
        <Bar dataKey="count" name="기록 수" radius={[4, 4, 0, 0]}>
          {data.map(entry => (
            <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] ?? 'var(--accent)'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
