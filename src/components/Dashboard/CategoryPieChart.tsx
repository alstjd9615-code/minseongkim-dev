import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
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

interface CategoryPieChartProps {
  data: CategoryStat[];
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  const filtered = data.filter(d => d.count > 0);

  if (filtered.length === 0) {
    return (
      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', opacity: 0.5, fontSize: 14 }}>
        아직 데이터가 없습니다
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={filtered}
          dataKey="count"
          nameKey="category"
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
        >
          {filtered.map(entry => (
            <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] ?? '#6b7280'} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontSize: 13,
          }}
        />
        <Legend
          formatter={(value) => (
            <span style={{ fontSize: 12, color: 'var(--text)' }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
