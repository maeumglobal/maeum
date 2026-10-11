'use client';

/**
 * Home do dashboard — consome `getAdminStats()` (já reescrito: faturamento por
 * `Payment.paidAt`, `calcChange` relativo) e mostra erro + retry quando a action
 * falha.
 *
 * Antes: `if (res.success) setData(...)` sem `else`. Uma falha de banco
 * renderizava `R$ 0,00` em todos os cartões sem nenhum aviso — o pior tipo de
 * bug num painel, porque parece "não vendemos nada".
 */
import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { LayoutDashboard, RefreshCw } from 'lucide-react';
import { getAdminStats, getRecentPayments, type RecentPaymentRow } from '@/actions/adminActions';
import { useLanguage } from '@/contexts/LanguageContext';
import DashboardMetrics, { type MetricsData } from './DashboardMetrics';
import { AdminErrorState, AdminPageHeader } from '@/components/admin/ui/States';
import { useMountedLoad } from '@/components/admin/ui/useMountedLoad';
import RecentConsultations, { type RecentLeadItem } from './RecentConsultations';
import RecentPayments, { type RecentPaymentItem } from './RecentPayments';
import PaymentLinkGenerator from './PaymentLinkGenerator';
import BookingsStatus from './BookingsStatus';
import BookingsChart from './BookingsChart';

// Gráficos pesados: `recharts` só no cliente, sem CLS (altura fixa no card).
const RevenueChart = dynamic(() => import('./RevenueChart'), {
  ssr: false,
  loading: () => <div className="h-[280px] rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)]" />,
});

const FinancialSummaryLazy = dynamic(() => import('./FinancialSummary'), {
  ssr: false,
  loading: () => (
    <div className="h-[140px] animate-pulse rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)]" />
  ),
});

interface StatsPayload {
  metrics?: MetricsData;
  totals?: {
    users?: number;
    experiences?: number;
    journeys?: number;
    partners?: number;
    upcomingDepartures?: number;
  };
  recentLeads?: RecentLeadItem[];
  recentPayments?: RecentPaymentRow[];
}

export default function AdminDashboardHome() {
  const { t, formatNumber } = useLanguage();
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [recentPayments, setRecentPayments] = useState<RecentPaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [statsRes, paymentsRes] = await Promise.all([getAdminStats(), getRecentPayments(5)]);

    if (statsRes.success && statsRes.data) {
      setStats(statsRes.data as StatsPayload);
      setRecentPayments(
        paymentsRes.success && paymentsRes.data ? (paymentsRes.data as unknown as RecentPaymentItem[]) : [],
      );
    } else {
      setStats(null);
      setRecentPayments([]);
      setError(statsRes.error ?? t('state.errorTitle'));
    }

    setLoading(false);
  }, [t]);

  useMountedLoad(load);

  if (error) {
    return <AdminErrorState message={error} onRetry={load} />;
  }

  if (loading && !stats) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center text-[var(--admin-text-muted)]">
        <RefreshCw className="mb-4 w-8 h-8 animate-spin text-[var(--admin-primary)]" />
        <p className="text-sm">{t('admin.dash.loadingMetrics')}</p>
      </div>
    );
  }

  const totals = stats?.totals;

  const totalCards = [
    { label: t('admin.dash.totalCustomers'), value: totals?.users ?? 0 },
    { label: t('admin.dash.totalExperiences'), value: totals?.experiences ?? 0 },
    { label: t('admin.dash.totalJourneys'), value: totals?.journeys ?? 0 },
    { label: t('admin.dash.totalPartners'), value: totals?.partners ?? 0 },
    { label: t('admin.dash.totalDepartures'), value: totals?.upcomingDepartures ?? 0 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-full flex-col gap-6"
    >
      <AdminPageHeader
        icon={<LayoutDashboard className="w-5 h-5" />}
        title={t('admin.dash.overviewTitle')}
        subtitle={t('admin.dash.overviewSubtitle')}
        actions={
          <button
            type="button"
            onClick={load}
            aria-label={t('state.retry')}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--admin-border)] text-[var(--admin-text-muted)] transition-colors hover:text-[var(--admin-text-main)]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      <DashboardMetrics metrics={stats?.metrics} />

      <section
        aria-label={t('admin.dash.totals')}
        className="grid grid-cols-2 gap-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-4 md:grid-cols-5 md:p-6"
      >
        {totalCards.map((card) => (
          <div key={card.label} className="flex flex-col gap-0.5">
            <span className="truncate text-[10px] uppercase tracking-wider text-[var(--admin-text-muted)]">
              {card.label}
            </span>
            <span className="text-lg font-bold text-[var(--admin-text-main)]">
              {loading ? '—' : formatNumber(card.value)}
            </span>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-1">
          <RevenueChart />
        </div>
        <div className="min-w-0 lg:col-span-1">
          <BookingsChart />
        </div>
        <div className="min-w-0 lg:col-span-1">
          <BookingsStatus />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-1">
          <RecentConsultations consultations={stats?.recentLeads} loading={loading} />
        </div>
        <div className="min-w-0 lg:col-span-1">
          <RecentPayments payments={recentPayments} loading={loading} />
        </div>
        <div className="min-w-0 lg:col-span-1">
          <PaymentLinkGenerator />
        </div>
      </div>

      <FinancialSummaryLazy />
    </motion.div>
  );
}
