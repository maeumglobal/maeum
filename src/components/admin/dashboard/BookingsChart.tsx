'use client';

/**
 * Reservas por PACOTE — dados REAIS.
 *
 * Substitui a rosca com cinco journeys inventadas ("Always Destination" 10,
 * "Horizon of Seven" 7, …) que nunca saíram do arquivo. Agora os valores vêm de
 * `getBookingsByPackage()` (`Booking.packageId` agregado no banco).
 */
import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { RefreshCw, TriangleAlert } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getBookingsByPackage } from '@/actions/adminActions';
import { AdminErrorState } from '@/components/admin/ui/States';
import { useMountedLoad } from '@/components/admin/ui/useMountedLoad';

const BookingsPieChart = dynamic(
  () =>
    import('./BookingsPieChart').then((mod) => ({
      default: mod.default,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full animate-pulse rounded-full bg-[var(--admin-border)]/25" aria-hidden="true" />
    ),
  },
);

interface Slice {
  title: string;
  count: number;
}

export default function BookingsChart() {
  const { t, formatNumber } = useLanguage();
  const [rows, setRows] = useState<Slice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getBookingsByPackage(6);
    if (res.success && res.data) {
      setRows(res.data);
    } else {
      setRows([]);
      setError(res.error ?? t('state.errorTitle'));
    }
    setLoading(false);
  }, [t]);

  useMountedLoad(load);

  const total = rows.reduce((acc, row) => acc + row.count, 0);

  return (
    <section className="flex h-[280px] flex-col rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
      <header className="mb-2 flex items-center justify-between gap-2">
        <h3 className="truncate text-sm font-medium text-[var(--admin-text-main)]">
          {t('admin.chart.bookingsTitle')}
        </h3>
        <button
          type="button"
          onClick={load}
          aria-label={t('state.retry')}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--admin-border)] text-[var(--admin-text-muted)] transition-colors hover:text-[var(--admin-text-main)]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      <div className="mt-2 flex min-h-0 flex-1 flex-col items-center gap-3">
        {error ? (
          <AdminErrorState message={error} onRetry={load} />
        ) : loading ? (
          <div className="h-[180px] w-full animate-pulse rounded-full bg-[var(--admin-border)]/25" aria-hidden="true" />
        ) : total === 0 ? (
          <p className="flex flex-1 items-center justify-center gap-2 text-center text-xs text-[var(--admin-text-muted)]">
            <TriangleAlert className="w-3.5 h-3.5" />
            {t('admin.chart.bookingsEmpty')}
          </p>
        ) : (
          <>
            <div className="relative h-[150px] w-[150px] shrink-0">
              <BookingsPieChart data={rows} label={t('admin.chart.bookingsLegend')} />
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">
                  {t('admin.chart.bookingsLegend')}
                </span>
                <span className="text-lg font-bold leading-tight text-[var(--admin-text-main)]">
                  {formatNumber(total)}
                </span>
              </div>
            </div>
            <ul className="flex w-full min-w-0 flex-1 flex-col justify-center gap-1.5 overflow-y-auto">
              {rows.map((row, index) => (
                <li
                  key={`${row.title}-${row.count}-${index}`}
                  className="flex items-center justify-between gap-2 text-[11px]"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 shrink-0 rounded-sm"
                      style={{ backgroundColor: `var(--admin-chart-${['purple', 'orange', 'yellow', 'cyan', 'pink'][index % 5]})` }}
                    />
                    <span className="truncate text-[var(--admin-text-muted)]" title={row.title}>
                      {row.title}
                    </span>
                  </span>
                  <span className="shrink-0 font-medium text-[var(--admin-text-main)]">
                    {Math.round((row.count / total) * 100)}%
                    <span className="ml-1 w-6 text-right text-[var(--admin-text-muted)]">
                      ({formatNumber(row.count)})
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
