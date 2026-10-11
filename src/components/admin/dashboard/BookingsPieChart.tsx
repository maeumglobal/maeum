'use client';

/** Rosca de reservas por pacote (recharts), carregada sem SSR. */
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = [
  'var(--admin-chart-purple)',
  'var(--admin-chart-orange)',
  'var(--admin-chart-yellow)',
  'var(--admin-chart-cyan)',
  'var(--admin-chart-pink)',
];

interface Slice {
  title: string;
  count: number;
}

export default function BookingsPieChart({ data, label }: { data: Slice[]; label: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="title"
          cx="50%"
          cy="50%"
          innerRadius={44}
          outerRadius={68}
          paddingAngle={2}
          stroke="none"
          isAnimationActive={false}
        >
          {data.map((entry, index) => (
            <Cell key={`${entry.title}-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload || payload.length === 0) return null;
            const row = payload[0]?.payload as Slice | undefined;
            if (!row) return null;
            const color =
              typeof payload[0]?.color === 'string' ? payload[0].color : COLORS[0];
            return (
              <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] p-2 text-xs shadow-lg">
                <span className="font-medium text-[var(--admin-text-main)]">{row.title}</span>
                <div className="mt-1 font-bold" style={{ color }}>
                  {label}: {row.count}
                </div>
              </div>
            );
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
