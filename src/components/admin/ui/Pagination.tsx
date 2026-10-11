'use client';

/**
 * Paginação reutilizável do painel.
 *
 * Existe porque 9 telas faziam a mesma conta na mão (`Math.ceil(total / 15)`) e
 * cinco delas ignoravam o `pageSize` da action — reservas a partir da 21ª
 * ficavam invisíveis para sempre.
 *
 * O componente é controlado: quem chama decide quando resetar a página
 * (normalmente quando um filtro muda).
 */
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const PAGE_SIZES = [20, 50, 100] as const;

export interface AdminPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  disabled?: boolean;
}

export default function AdminPagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  disabled = false,
}: AdminPaginationProps) {
  const { t, formatNumber } = useLanguage();

  const safeTotalPages = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(1, page), safeTotalPages);

  // Janela de páginas: 1 … 4 5 [6] 7 8 … 20
  const pages: Array<number | 'gap'> = [];
  const from = Math.max(1, safePage - 2);
  const to = Math.min(safeTotalPages, safePage + 2);
  if (from > 1) {
    pages.push(1);
    if (from > 2) pages.push('gap');
  }
  for (let i = from; i <= to; i += 1) pages.push(i);
  if (to < safeTotalPages) {
    if (to < safeTotalPages - 1) pages.push('gap');
    pages.push(safeTotalPages);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
      <div className="flex items-center gap-3 text-xs text-[var(--admin-text-muted)]">
        <span>
          {t('pager.summary')
            .replace('{page}', String(safePage))
            .replace('{total}', String(safeTotalPages))
            .replace('{count}', formatNumber(total))}
        </span>
        {onPageSizeChange && (
          <label className="flex items-center gap-1.5">
            <span className="sr-only sm:not-sr-only">{t('pager.perPage')}</span>
            <select
              value={pageSize}
              disabled={disabled}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-7 px-2 text-xs rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-main)] focus:outline-none focus:border-[var(--admin-primary)] disabled:opacity-50"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {safeTotalPages > 1 && (
        <nav className="flex items-center gap-1" aria-label={t('pager.page')}>
          <button
            type="button"
            onClick={() => onPageChange(safePage - 1)}
            disabled={disabled || safePage <= 1}
            aria-label={t('pager.previous')}
            className="flex items-center gap-1 h-7 px-2 text-xs rounded-md border border-[var(--admin-border)] text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('pager.previous')}</span>
          </button>

          {pages.map((entry, index) =>
            entry === 'gap' ? (
              <span key={`gap-${index}`} className="px-1 text-xs text-[var(--admin-text-muted)]">
                …
              </span>
            ) : (
              <button
                key={entry}
                type="button"
                onClick={() => onPageChange(entry)}
                disabled={disabled}
                aria-current={entry === safePage ? 'page' : undefined}
                className={`min-w-7 h-7 px-2 text-xs rounded-md border transition-colors ${
                  entry === safePage
                    ? 'bg-[var(--admin-primary)] text-black border-[var(--admin-primary)] font-bold'
                    : 'border-[var(--admin-border)] text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50'
                } disabled:opacity-40`}
              >
                {entry}
              </button>
            ),
          )}

          <button
            type="button"
            onClick={() => onPageChange(safePage + 1)}
            disabled={disabled || safePage >= safeTotalPages}
            aria-label={t('pager.next')}
            className="flex items-center gap-1 h-7 px-2 text-xs rounded-md border border-[var(--admin-border)] text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <span className="hidden sm:inline">{t('pager.next')}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </nav>
      )}
    </div>
  );
}
