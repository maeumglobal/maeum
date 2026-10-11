'use client';

/**
 * Faturamento recebido por mês — dados REAIS de `Payment`.
 *
 * Substitui o array hardcoded que mostrava `478920` em "Jun" e que renderizava
 * `/2024` fixo no tooltip, independente do ano corrente. A série vem de
 * `getRevenueSeries()` (`Payment.paidAt`), com zero pontos preenchidos para os
 * meses sem pagamento — não com números inventados.
 *
 * O `recharts` só entra depois do `dynamic(..., { ssr: false })`: ele mede o
 * container no primeiro paint e, sem altura fixa, provoca CLS.
 */
import { useCallback, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { RefreshCw, TriangleAlert } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getRevenueSeries, type RevenuePoint } from '@/actions/adminActions';
import { AdminErrorState } from '@/components/admin/ui/States';
import { useMountedLoad } from '@/components/admin/ui/useMountedLoad';

const RevenueAreaChart = dynamic(
  () =>
    import('./RevenueAreaChart').then((mod) => ({
      default: mod.default,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full animate-pulse rounded-lg bg-[var(--admin-border)]/25" aria-hidden="true" />
    ),
  },
);

const MONTH_LOCALE: Record<string, string> = { pt: 'pt-BR', en: 'en-US', es: 'es-ES' };

export default function RevenueChart() {
  const { t, locale, formatCurrency, formatNumber } = useLanguage();
  const [months, setMonths] = useState<6 | 12>(6);
  const [points, setPoints] = useState<RevenuePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getRevenueSeries(months);
    if (res.success && res.data) {
      setPoints(res.data);
    } else {
      setPoints([]);
      setError(res.error ?? t('state.errorTitle'));
    }
    setLoading(false);
  }, [months, t]);

  useMountedLoad(load);

  const series = useMemo(
    () =>
      points.map((point) => ({
        key: point.key,
        label: new Intl.DateTimeFormat(MONTH_LOCALE[locale] ?? 'pt-BR', {
          month: 'short',
          year: '2-digit',
        })
          .format(new Date(Date.UTC(point.year, point.month, 1)))
          .replace('.', ''),
        revenue: point.revenue,
        count: point.count,
      })),
    [points, locale],
  );

  const total = useMemo(() => series.reduce((acc, item) => acc + item.revenue, 0), [series]);
  const hasRevenue = total > 0;

  return (
    <section className="flex h-[280px] flex-col rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
      <header className="mb-4 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium text-[var(--admin-text-main)]">{t('admin.chart.revenueTitle')}</h3>
          {hasRevenue && (
            <p className="text-[11px] text-[var(--admin-text-muted)]">{formatCurrency(total)}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <div
            role="group"
            aria-label={t('admin.chart.revenueLast6')}
            className="flex overflow-hidden rounded-lg border border-[var(--admin-border)]"
          >
            {([6, 12] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMonths(option)}
                aria-pressed={months === option}
                className={`h-7 px-2 text-[10px] font-semibold transition-colors ${
                  months === option
                    ? 'bg-[var(--admin-primary)] text-black'
                    : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)]'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={load}
            aria-label={t('state.retry')}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--admin-border)] text-[var(--admin-text-muted)] transition-colors hover:text-[var(--admin-text-main)]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <div className="min-h-0 w-full flex-1">
        {error ? (
          <div className="flex h-full items-center">
            <div className="w-full">
              <AdminErrorState message={error} onRetry={load} />
            </div>
          </div>
        ) : loading ? (
          <div className="h-full w-full animate-pulse rounded-lg bg-[var(--admin-border)]/25" aria-hidden="true" />
        ) : !hasRevenue ? (
          <p className="flex h-full items-center justify-center gap-2 text-center text-xs text-[var(--admin-text-muted)]">
            <TriangleAlert className="w-3.5 h-3.5" />
            {t('admin.chart.revenueEmpty')}
          </p>
        ) : (
          <RevenueAreaChart
            data={series}
            formatCurrency={formatCurrency}
            formatNumber={formatNumber}
            monthLabel={t('admin.chart.revenueMonth')}
          />
        )}
      </div>
    </section>
  );
}
