'use client';

/**
 * Estados de carga/vazio/erro reutilizáveis do painel.
 *
 * Antes cada tela repetia seu próprio `loading ? <spinner> : rows.length === 0 ?`
 * e — o pior — nenhuma delas renderizava o caso de FALHA: quando a action
 * devolvia `success: false`, a tela mostrava "nada encontrado" como se o banco
 * estivesse legitimamente vazio. Aqui o erro é explícito e tem retry.
 */
import type { ReactNode } from 'react';
import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

/** Linhas de skeleton para tabelas. */
export function AdminTableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div
          key={`skeleton-row-${rowIndex}`}
          className="flex items-center gap-4 p-4 border-b border-[var(--admin-border)] animate-pulse"
        >
          {Array.from({ length: columns }, (_, colIndex) => (
            <div
              key={`skeleton-cell-${rowIndex}-${colIndex}`}
              className="h-3 rounded bg-[var(--admin-border)]"
              style={{ width: colIndex === 0 ? '32%' : `${Math.max(12, 90 / columns)}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Blocos de skeleton para grades de cards. */
export function AdminCardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" aria-busy="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={`card-skeleton-${index}`} className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] overflow-hidden animate-pulse">
          <div className="h-40 bg-[var(--admin-border)]/40" />
          <div className="p-4 flex flex-col gap-2">
            <div className="h-3 w-2/3 rounded bg-[var(--admin-border)]" />
            <div className="h-2.5 w-1/3 rounded bg-[var(--admin-border)]/70" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminEmptyState({
  title,
  description,
  icon,
  action,
}: {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center text-[var(--admin-text-muted)]">
      <div className="w-12 h-12 rounded-full bg-[var(--admin-border)]/40 flex items-center justify-center opacity-70">
        {icon ?? <Inbox className="w-5 h-5" />}
      </div>
      <p className="text-sm font-semibold text-[var(--admin-text-main)]">{title ?? t('state.emptyTitle')}</p>
      {description && <p className="text-xs max-w-sm">{description}</p>}
      {action}
    </div>
  );
}

export function AdminErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 py-14 px-4 text-center rounded-2xl border border-[var(--admin-accent-red)]/40 bg-[var(--admin-accent-red)]/5"
    >
      <AlertTriangle className="w-6 h-6 text-[var(--admin-accent-red)]" />
      <p className="text-sm font-semibold text-[var(--admin-text-main)]">{t('state.errorTitle')}</p>
      {message && <p className="text-xs text-[var(--admin-text-muted)] max-w-md">{message}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-lg border border-[var(--admin-border)] text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {t('state.retry')}
        </button>
      )}
    </div>
  );
}

/** Cabeçalho padrão de uma tela do painel (título + subtítulo + ações). */
export function AdminPageHeader({
  icon,
  title,
  subtitle,
  actions,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--admin-card)] border border-[var(--admin-border)] p-4 md:p-6 rounded-2xl">
      <div className="flex items-start gap-3 min-w-0">
        {icon && <span className="mt-0.5 shrink-0 text-[var(--admin-primary)]">{icon}</span>}
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-[var(--admin-text-main)] mb-1 truncate">{title}</h2>
          {subtitle && <p className="text-xs text-[var(--admin-text-muted)]">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
