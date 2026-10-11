'use client';

/**
 * Reservas por STATUS — contagem real vinda de `Booking.status`.
 *
 * Substitui os cinco números fixos (28 confirmadas, 12 em análise, 9 aguardando
 * pagamento, 3 canceladas, 17 concluídas = 69 reservas) que nunca saíram do
 * arquivo. Também remove o botão "Ver todas as reservas" sem destino: ele
 * apontava para lugar nenhum.
 */
import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, RefreshCw, TriangleAlert } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getBookingsByStatus } from '@/actions/adminActions';
import { AdminErrorState } from '@/components/admin/ui/States';
import { useMountedLoad } from '@/components/admin/ui/useMountedLoad';

interface StatusRow {
  status: string;
  count: number;
}

const STYLE: Record<string, { bg: string; text: string; border: string }> = {
  pending: { bg: 'bg-yellow-900/30', text: 'text-yellow-400', border: 'border-yellow-800' },
  confirmed: { bg: 'bg-green-900/30', text: 'text-green-400', border: 'border-green-800' },
  in_progress: { bg: 'bg-cyan-900/30', text: 'text-cyan-400', border: 'border-cyan-800' },
  completed: { bg: 'bg-blue-900/30', text: 'text-blue-400', border: 'border-blue-800' },
  cancelled: { bg: 'bg-red-900/30', text: 'text-red-400', border: 'border-red-800' },
};

const FALLBACK = { bg: 'bg-gray-900/30', text: 'text-gray-400', border: 'border-gray-700' };

export default function BookingsStatus() {
  const { t, formatNumber } = useLanguage();
  const [rows, setRows] = useState<StatusRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getBookingsByStatus();
    if (res.success && res.data) {
      setRows(res.data);
    } else {
      setRows([]);
      setError(res.error ?? t('state.errorTitle'));
    }
    setLoading(false);
  }, [t]);

  useMountedLoad(load);

  const labelFor = useCallback(
    (status: string): string => {
      switch (status) {
        case 'pending':
          return t('admin.chart.statusPending');
        case 'confirmed':
          return t('admin.chart.statusConfirmed');
        case 'in_progress':
          return t('admin.chart.statusInProgress');
        case 'completed':
          return t('admin.chart.statusCompleted');
        case 'cancelled':
          return t('admin.chart.statusCancelled');
        default:
          return t('admin.chart.statusOther');
      }
    },
    [t],
  );

  // Ordem de leitura primeiro, desconhecidos no fim — estável e previsível.
  const ordered = useMemo(() => {
    const rank = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    return [...rows].sort((a, b) => {
      const ra = rank.indexOf(a.status);
      const rb = rank.indexOf(b.status);
      if (ra === -1 && rb === -1) return b.count - a.count;
      if (ra === -1) return 1;
      if (rb === -1) return -1;
      return ra - rb;
    });
  }, [rows]);

  return (
    <section className="flex h-[280px] flex-col rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
      <header className="mb-4 flex items-center justify-between gap-2">
        <h3 className="truncate text-sm font-medium text-[var(--admin-text-main)]">
          {t('admin.chart.statusTitle')}
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

      {error ? (
        <AdminErrorState message={error} onRetry={load} />
      ) : loading ? (
        <div className="flex flex-1 flex-col justify-center gap-3" aria-hidden="true">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={`status-skeleton-${index}`} className="h-6 animate-pulse rounded bg-[var(--admin-border)]/30" />
          ))}
        </div>
      ) : ordered.length === 0 ? (
        <p className="flex flex-1 items-center justify-center gap-2 text-center text-xs text-[var(--admin-text-muted)]">
          <TriangleAlert className="w-3.5 h-3.5" />
          {t('admin.chart.statusEmpty')}
        </p>
      ) : (
        <ul className="flex flex-1 flex-col justify-center gap-3">
          {ordered.map((row) => {
            const style = STYLE[row.status] ?? FALLBACK;
            return (
              <li
                key={row.status}
                className="flex items-center justify-between border-b border-[var(--admin-border)]/50 pb-3 last:border-0 last:pb-0"
              >
                <span className="truncate text-xs text-[var(--admin-text-muted)]">{labelFor(row.status)}</span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${style.bg} ${style.text} ${style.border}`}
                >
                  {formatNumber(row.count)}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-4 border-t border-[var(--admin-border)]/50 pt-4 text-center">
        <Link
          href="/dashboard/admin"
          className="flex w-full items-center justify-center gap-1 text-xs font-medium text-[var(--admin-primary)] transition-colors hover:text-[var(--admin-primary-hover)]"
        >
          {t('admin.book.title')} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}
