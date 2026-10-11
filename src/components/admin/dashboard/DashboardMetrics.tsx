'use client';

/**
 * Cartões de métrica do dashboard.
 *
 * Correções: `key={idx}` (o BRIEF exige chave estável) e — o pior — o
 * fallback `?? 0` exibia "R$ 0,00" como se o banco estivesse zerado quando a
 * chamada da action nem tinha retornado. Agora o valor só aparece depois que a
 * action respondeu, e "—" enquanto isso.
 */
import type { LucideIcon } from 'lucide-react';
import { CircleDollarSign, Gem, Info, Percent, Ticket, Users } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

export interface AdminMetric {
  value: number;
  change: number;
}

export interface MetricsData {
  revenue: AdminMetric;
  bookings: AdminMetric;
  leads: AdminMetric;
  conversion: AdminMetric;
  ticket: AdminMetric;
}

/** Formatadores aceitos pelos cartões. */
type Fmt = (value: number) => string;

export default function DashboardMetrics({ metrics }: { metrics?: MetricsData }) {
  const { t, formatNumber, formatCurrency } = useLanguage();

  const cards: Array<{
    key: keyof MetricsData;
    labelKey: string;
    format: Fmt;
    icon: LucideIcon;
    tooltip?: boolean;
  }> = [
    {
      key: 'revenue',
      labelKey: 'admin.dash.metricRevenue',
      format: formatCurrency,
      icon: CircleDollarSign,
      tooltip: true,
    },
    { key: 'bookings', labelKey: 'admin.dash.metricBookings', format: formatNumber, icon: Gem },
    { key: 'leads', labelKey: 'admin.dash.metricLeads', format: formatNumber, icon: Users },
    {
      key: 'conversion',
      labelKey: 'admin.dash.metricConversion',
      format: (value) => `${value.toFixed(1)}%`,
      icon: Percent,
    },
    { key: 'ticket', labelKey: 'admin.dash.metricTicket', format: formatCurrency, icon: Ticket },
  ];

  const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 26 } },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        const metric = metrics?.[card.key];
        const change = metric?.change ?? 0;
        const positive = change >= 0;

        return (
          <motion.div
            key={card.key}
            variants={item}
            className="group relative overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5 transition-colors hover:border-[var(--admin-primary)]"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--admin-border)] bg-[var(--admin-border)]/50 transition-colors group-hover:border-[var(--admin-primary)]/50">
                <Icon className="w-5 h-5 text-[var(--admin-primary)]" strokeWidth={1.5} />
              </div>
            </div>

            <div className="mb-1 flex items-center gap-2">
              <h3 className="truncate text-sm text-[var(--admin-text-main)]">{t(card.labelKey)}</h3>
              {card.tooltip && (
                <Info
                  className="w-3.5 h-3.5 shrink-0 cursor-help text-[var(--admin-text-muted)]"
                  aria-label={t('admin.dash.metricSource')}
                />
              )}
            </div>

            <div className="mb-3 text-2xl font-bold tracking-tight text-[var(--admin-text-main)]">
              {metric ? card.format(metric.value) : '—'}
            </div>

            {metric ? (
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--admin-text-muted)]">
                <span
                  className={`flex items-center ${positive ? 'text-[var(--admin-accent-green)]' : 'text-[var(--admin-accent-red)]'}`}
                >
                  {positive && <span aria-hidden="true">▲</span>}
                  {`${change > 0 ? '+' : ''}${change.toFixed(1)}%`}
                </span>
                <span>{t('admin.dash.vsPrevious')}</span>
              </div>
            ) : (
              <div className="text-[11px] text-[var(--admin-text-muted)]">—</div>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
