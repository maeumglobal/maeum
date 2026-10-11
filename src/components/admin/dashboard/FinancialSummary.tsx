'use client';

/**
 * Resumo financeiro — 100% derivado de `Payment`.
 *
 * Substitui os quatro valores inventados (recebido `R$ 478.920,00` +23,8%,
 * pendente `R$ 92.540,00`, cancelado `R$ 12.300,00` −8,4%, a receber
 * `R$ 215.780,00` +15,2%) e o botão "Ver relatório financeiro completo", que não
 * levava a lugar nenhum.
 *
 * Receita conta SOMENTE o que tem `paidAt` — emitir boleto não é receber.
 */
import { useCallback, useState } from 'react';
import { ArrowDown, ArrowUp, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getFinancialSummary, type FinancialSummaryData } from '@/actions/adminActions';
import { AdminErrorState } from '@/components/admin/ui/States';
import { useMountedLoad } from '@/components/admin/ui/useMountedLoad';

export default function FinancialSummary() {
  const { t, formatCurrency, formatNumber } = useLanguage();
  const [data, setData] = useState<FinancialSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getFinancialSummary();
    if (res.success && res.data) {
      setData(res.data);
    } else {
      setData(null);
      setError(res.error ?? t('state.errorTitle'));
    }
    setLoading(false);
  }, [t]);

  useMountedLoad(load);

  if (error) return <AdminErrorState message={error} onRetry={load} />;

  const change = data?.receivedChange ?? 0;

  const cards = [
    {
      label: t('admin.chart.financialReceived'),
      value: formatCurrency(data?.receivedThisMonth ?? 0),
      badge: Number.isFinite(change) && change !== 0 ? { value: change, up: change > 0 } : null,
    },
    {
      label: t('admin.chart.financialPending'),
      value: formatCurrency(data?.pending ?? 0),
      hint: formatNumber(data?.pendingCount ?? 0),
      badge: null,
    },
    {
      label: t('admin.chart.financialTotal'),
      value: formatCurrency(data?.totalReceived ?? 0),
      hint: formatNumber(data?.paidCount ?? 0),
      badge: null,
    },
    {
      label: t('admin.chart.financialTicket'),
      value: formatCurrency(data?.averageTicket ?? 0),
      hint: formatCurrency(data?.refunded ?? 0),
      hintLabel: t('admin.chart.financialRefunded'),
      badge: null,
    },
  ];

  return (
    <section className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
      <header className="mb-6 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium text-[var(--admin-text-main)]">
            {t('admin.chart.financialTitle')}
          </h3>
          <p className="text-[10px] text-[var(--admin-text-muted)]">{t('admin.chart.financialNote')}</p>
        </div>
        <button
          type="button"
          onClick={load}
          aria-label={t('state.retry')}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[var(--admin-border)] text-[var(--admin-text-muted)] transition-colors hover:text-[var(--admin-text-main)]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="flex flex-col gap-1">
            <span className="text-[11px] text-[var(--admin-text-muted)]">{card.label}</span>
            <div className="mt-1 flex items-center gap-3">
              <span className="text-xl font-bold tracking-tight text-[var(--admin-text-main)]">
                {loading ? '—' : card.value}
              </span>
              {card.badge && (
                <span
                  className={`flex items-center text-[10px] font-bold ${
                    card.badge.up ? 'text-[var(--admin-accent-green)]' : 'text-[var(--admin-accent-red)]'
                  }`}
                >
                  {card.badge.up ? <ArrowUp className="mr-0.5 w-3 h-3" /> : <ArrowDown className="mr-0.5 w-3 h-3" />}
                  {`${card.badge.value > 0 ? '+' : ''}${card.badge.value.toFixed(1)}%`}
                </span>
              )}
            </div>
            {card.hint && !loading && (
              <span className="text-[10px] text-[var(--admin-text-muted)]">
                {card.hint}
                {card.hintLabel ? ` · ${card.hintLabel}` : ''}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
