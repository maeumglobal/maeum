'use client';

/**
 * Consultas (leads) recentes.
 *
 * O "mock fallback" anterior — um item chamado "Nenhum lead real / O banco está
 * vazio" misturado na lista com aparência de linha real — foi removido: estado
 * vazio é estado vazio, com texto próprio.
 *
 * O avatar também deixou de bater em `ui-avatars.com` (terceiro externo que
 * vazava o nome do cliente para fora); agora são iniciais renderizadas local.
 */
import { useLanguage } from '@/contexts/LanguageContext';

export interface RecentLeadItem {
  id: string;
  name: string;
  email: string;
  status: string;
  destination: string | null;
  createdAt: string | Date;
}

function initials(name: string): string {
  const clean = name.trim();
  if (!clean) return '—';
  return clean
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export default function RecentConsultations({
  consultations,
  loading = false,
}: {
  consultations?: RecentLeadItem[];
  loading?: boolean;
}) {
  const { t, formatDate } = useLanguage();
  const rows = consultations ?? [];

  return (
    <section className="flex h-[300px] flex-col rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
      <header className="mb-4 flex items-center justify-between gap-2">
        <h3 className="truncate text-sm font-medium text-[var(--admin-text-main)]">
          {t('admin.list.recentLeads')}
        </h3>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto pr-2 -mr-2">
        {loading ? (
          <ul className="flex flex-col gap-3" aria-busy="true">
            {Array.from({ length: 4 }, (_, index) => (
              <li
                key={`lead-skeleton-${index}`}
                className="flex items-center gap-3 rounded-lg border border-[var(--admin-border)] p-3"
              >
                <span className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-[var(--admin-border)]/50" />
                <span className="h-3 flex-1 animate-pulse rounded bg-[var(--admin-border)]/50" />
              </li>
            ))}
          </ul>
        ) : rows.length === 0 ? (
          <p className="flex h-full items-center justify-center text-center text-xs text-[var(--admin-text-muted)]">
            {t('admin.list.emptyLeads')}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg p-3 transition-colors hover:bg-[var(--admin-border)]/30"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--admin-border)] text-[11px] font-bold text-[var(--admin-primary)]"
                  >
                    {initials(item.name)}
                  </span>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-xs font-medium text-[var(--admin-text-main)]">
                      {item.name || '—'}
                    </span>
                    <span className="truncate text-[10px] text-[var(--admin-text-muted)]">{item.email || '—'}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="max-w-[110px] truncate rounded border border-[var(--admin-chart-cyan)]/30 bg-[var(--admin-chart-cyan)]/10 px-2 py-1 text-center text-[10px] font-bold text-[var(--admin-chart-cyan)]">
                    {item.destination ?? t('admin.list.genericInterest')}
                  </span>
                  <span className="hidden w-[92px] text-right text-[10px] text-[var(--admin-text-muted)] sm:block">
                    {formatDate(item.createdAt, {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit',
                    })}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
