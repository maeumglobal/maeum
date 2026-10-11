'use client';

/**
 * Pagamentos recentes com nome do cliente e título do pacote REAIS.
 *
 * Bugs corrigidos aqui:
 *  - `'Cliente ' + p.clientId?.substring(0,5) || 'Cliente'` — precedência
 *    errada: `||` tem menor precedência que `+`, então o fallback nunca era
 *    usado e a tela mostrava literalmente "Cliente undefined";
 *  - o "pacote" exibido era `booking.packageId` (um UUID) ou o texto fixo
 *    "Pacote Padrão";
 *  - o avatar vinha de `ui-avatars?name=C` para TODO MUNDO (a letra só
 *    dependia de haver id), vazando um terceiro externo desnecessário.
 */
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export interface RecentPaymentItem {
  id: string;
  amount: number;
  status: string;
  paidAt: string | Date | null;
  createdAt: string | Date;
  clientName: string;
  packageTitle: string | null;
}

function initials(name: string): string {
  const clean = name.trim();
  if (!clean) return '—';
  const parts = clean.split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join('') || '—';
}

export default function RecentPayments({
  payments,
  loading = false,
}: {
  payments?: RecentPaymentItem[];
  loading?: boolean;
}) {
  const { t, formatCurrency, formatDate } = useLanguage();
  const rows = payments ?? [];

  return (
    <section className="flex h-[300px] flex-col rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
      <header className="mb-4 flex items-center justify-between gap-2">
        <h3 className="truncate text-sm font-medium text-[var(--admin-text-main)]">
          {t('admin.list.recentPayments')}
        </h3>
        <span className="text-[10px] text-[var(--admin-text-muted)]">
          <ArrowRight className="w-3 h-3" aria-hidden="true" />
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto pr-2 -mr-2">
        {loading ? (
          <ul className="flex flex-col gap-3" aria-busy="true">
            {Array.from({ length: 4 }, (_, index) => (
              <li
                key={`payment-skeleton-${index}`}
                className="flex items-center gap-3 rounded-lg border border-[var(--admin-border)] p-3"
              >
                <span className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-[var(--admin-border)]/50" />
                <span className="h-3 flex-1 animate-pulse rounded bg-[var(--admin-border)]/50" />
              </li>
            ))}
          </ul>
        ) : rows.length === 0 ? (
          <p className="flex h-full items-center justify-center text-center text-xs text-[var(--admin-text-muted)]">
            {t('admin.list.emptyPayments')}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((item) => {
              const paid = item.status === 'paid';
              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-lg p-3 transition-colors hover:bg-[var(--admin-border)]/30"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--admin-border)] text-[11px] font-bold text-[var(--admin-primary)]"
                    >
                      {initials(item.clientName)}
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-xs font-medium text-[var(--admin-text-main)]">
                        {item.clientName || '—'}
                      </span>
                      <span className="truncate text-[10px] text-[var(--admin-text-muted)]">
                        {item.packageTitle ?? t('admin.list.noPackage')}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs font-bold text-[var(--admin-text-main)]">
                      {formatCurrency(item.amount)}
                    </span>
                    <span
                      className={`w-[68px] rounded border px-2 py-0.5 text-center text-[10px] font-bold ${
                        paid
                          ? 'border-[var(--admin-accent-green)]/30 bg-[var(--admin-accent-green)]/10 text-[var(--admin-accent-green)]'
                          : 'border-yellow-800 bg-yellow-900/30 text-yellow-400'
                      }`}
                    >
                      {paid ? t('admin.list.statusPaid') : t('admin.list.statusPending')}
                    </span>
                    <span className="hidden w-[72px] text-right text-[10px] text-[var(--admin-text-muted)] sm:block">
                      {formatDate(item.paidAt ?? item.createdAt, {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                      })}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
