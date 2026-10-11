'use client';

/**
 * Área do gráfico de faturamento (recharts) — carregado sem SSR.
 *
 * Fica num arquivo separado de propósito: `RevenueChart` importa isto via
 * `next/dynamic({ ssr: false })`, o que tira o recharts (≈100 kB) do bundle do
 * servidor e garante que o `ResponsiveContainer` só meça depois da hidratação.
 */
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export interface RevenueSeriesPoint {
  key: string;
  label: string;
  revenue: number;
  count: number;
}

const COLORS = [
  'var(--admin-chart-pink)',
  'var(--admin-chart-purple)',
  'var(--admin-chart-orange)',
  'var(--admin-chart-yellow)',
  'var(--admin-chart-cyan)',
];

export default function RevenueAreaChart({
  data,
  formatCurrency,
  formatNumber,
  monthLabel,
}: {
  data: RevenueSeriesPoint[];
  formatCurrency: (value: number) => string;
  formatNumber: (value: number) => string;
  monthLabel: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.35} />
            <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'var(--admin-text-muted)', fontSize: 10 }}
          dy={8}
          minTickGap={12}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'var(--admin-text-muted)', fontSize: 10 }}
          tickFormatter={(value: number) => formatNumber(value / 1000)}
          width={44}
        />
        <Tooltip
          cursor={{ stroke: 'var(--admin-border)' }}
          content={({ active, payload }) => {
            if (!active || !payload || payload.length === 0) return null;
            const row = payload[0]?.payload as RevenueSeriesPoint | undefined;
            if (!row) return null;
            return (
              <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] p-3 shadow-lg">
                <p className="mb-1 text-xs font-medium text-[var(--admin-text-main)]">
                  {monthLabel}: {row.label}
                </p>
                <p className="text-sm font-bold text-[var(--admin-chart-pink)]">{formatCurrency(row.revenue)}</p>
                <p className="text-[10px] text-[var(--admin-text-muted)]">
                  {formatNumber(row.count)} · {row.count === 1 ? 'pagamento' : 'pagamentos'}
                </p>
              </div>
            );
          }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke={COLORS[0]}
          strokeWidth={2.5}
          fill="url(#colorRevenue)"
          fillOpacity={1}
          activeDot={{ r: 5, fill: COLORS[0], stroke: 'var(--admin-bg)', strokeWidth: 2 }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
