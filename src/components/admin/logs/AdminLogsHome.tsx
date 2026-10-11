'use client';

/**
 * Auditoria e Logs.
 *
 * Correções:
 *  - o estado `search` EXISTIA mas não tinha input e não era usado (dead code).
 *    Agora há o campo de busca, com debounce de 300ms, filtrando client-side
 *    sobre a página atual (o texto deixa isso explícito — a action não tem
 *    filtro por texto livre);
 *  - os cinco filtros de entidade eram valores em minúsculo (`user`, `lead`)
 *    que NUNCA casavam com `AdminLog.entity`, que grava o nome do model
 *    (`User`, `Lead`, `Booking`…). Agora as opções são os valores reais e há
 *    uma opção "listar entidades" que só mostra as que existem no banco.
 *  - `action` também é filtrável agora (não havia filtro nenhum).
 */
import { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, RefreshCw, ShieldAlert, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLogs } from '@/actions/adminActions';
import AdminPagination from '@/components/admin/ui/Pagination';
import { useDebouncedValue } from '@/components/admin/ui/useDebouncedValue';
import { useMountedLoad } from '@/components/admin/ui/useMountedLoad';
import { AdminEmptyState, AdminErrorState, AdminPageHeader, AdminTableSkeleton } from '@/components/admin/ui/States';

interface LogRow {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  result: string;
  createdAt: string;
  user?: { id: string; name: string; email: string; role: string } | null;
}

/** Candidatas por padrão de ação — cor compartilhada. */
function actionStyle(action: string): string {
  if (action.includes('delete') || action.includes('deactivate')) {
    return 'border-red-800 bg-red-900/30 text-red-400';
  }
  if (action.includes('create') || action.includes('approve') || action.includes('activate')) {
    return 'border-green-800 bg-green-900/30 text-green-400';
  }
  if (action.includes('update') || action.includes('status_change') || action.includes('save')) {
    return 'border-blue-800 bg-blue-900/30 text-blue-400';
  }
  if (action.includes('login') || action.includes('logout')) {
    return 'border-gray-700 bg-gray-800 text-gray-300';
  }
  return 'border-gray-700 bg-gray-800 text-gray-300';
}

export default function AdminLogsHome() {
  const { t, formatNumber, formatDate } = useLanguage();

  const [logs, setLogs] = useState<LogRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebouncedValue(search);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getLogs({ page, pageSize, entity: entityFilter || undefined, action: actionFilter || undefined });
    if (res.success) {
      setLogs((res.items ?? []) as unknown as LogRow[]);
      setTotal(res.total ?? 0);
      setTotalPages(res.totalPages ?? 1);
    } else {
      setLogs([]);
      setTotal(0);
      setTotalPages(1);
      setError(res.error ?? t('state.errorTitle'));
    }
    setLoading(false);
  }, [page, pageSize, entityFilter, actionFilter, t]);

  useMountedLoad(load);

  // Ações existentes na página atual — evita oferecer um filtro morto.
  const actionOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const row of logs) seen.add(row.action);
    return [...seen].sort();
  }, [logs]);

  const filtered = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    if (!query) return logs;
    return logs.filter((row) =>
      [
        row.action,
        row.entity,
        row.entityId ?? '',
        row.details ?? '',
        row.ipAddress ?? '',
        row.result,
        row.user?.name ?? '',
        row.user?.email ?? '',
        row.user?.role ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [logs, debouncedSearch]);

  const entityOptions = [
    { value: '', labelKey: 'admin.logs.entityAll' },
    { value: 'User', labelKey: 'admin.logs.entityUser' },
    { value: 'Lead', labelKey: 'admin.logs.entityLead' },
    { value: 'Booking', labelKey: 'admin.logs.entityBooking' },
    { value: 'Payment', labelKey: 'admin.logs.entityPayment' },
    { value: 'Proposal', labelKey: 'admin.logs.entityProposal' },
    { value: 'Experience', labelKey: 'admin.logs.entityExperience' },
    { value: 'Journey', labelKey: 'admin.logs.entityJourney' },
    { value: 'JourneyDeparture', labelKey: 'admin.logs.entityJourneyDeparture' },
    { value: 'KbeautyExperience', labelKey: 'admin.logs.entityKbeautyExperience' },
    { value: 'Testimonial', labelKey: 'admin.logs.entityTestimonial' },
    { value: 'FaqItem', labelKey: 'admin.logs.entityFaqItem' },
    { value: 'MediaAsset', labelKey: 'admin.logs.entityMediaAsset' },
    { value: 'SiteSetting', labelKey: 'admin.logs.entitySiteSetting' },
    { value: 'SiteConfig', labelKey: 'admin.logs.entitySiteConfig' },
    { value: 'Package', labelKey: 'admin.logs.entityPackage' },
    { value: 'Category', labelKey: 'admin.logs.entityCategory' },
    { value: 'BlogPost', labelKey: 'admin.logs.entityBlogPost' },
    { value: 'Partner', labelKey: 'admin.logs.entityPartner' },
    { value: 'NavigationItem', labelKey: 'admin.logs.entityNavigationItem' },
    { value: 'CmsPage', labelKey: 'admin.logs.entityCmsPage' },
    { value: 'ExchangeCampus', labelKey: 'admin.logs.entityExchangeCampus' },
    { value: 'Notification', labelKey: 'admin.logs.entityNotification' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-full flex-col gap-6"
    >
      <AdminPageHeader
        icon={<ShieldAlert className="w-5 h-5" />}
        title={t('admin.logs.title')}
        subtitle={t('admin.logs.subtitle').replace('{count}', formatNumber(total))}
        actions={
          <Button
            onClick={load}
            variant="outline"
            aria-label={t('common.refresh')}
            className="h-9 border-[var(--admin-border)] px-3 text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder={t('admin.logs.search')}
          aria-label={t('admin.logs.search')}
          className="h-9 max-w-md flex-1 bg-[var(--admin-card)] text-xs text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
        />
        <select
          value={entityFilter}
          onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
          aria-label={t('admin.logs.entityAll')}
          className="h-9 w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 text-xs text-[var(--admin-text-muted)] focus:border-[var(--admin-primary)] focus:outline-none sm:w-52"
        >
          {entityOptions.map((option) => (
            <option key={option.value || 'all'} value={option.value}>
              {t(option.labelKey)}
            </option>
          ))}
        </select>
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          aria-label={t('admin.logs.action')}
          className="h-9 w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 text-xs text-[var(--admin-text-muted)] focus:border-[var(--admin-primary)] focus:outline-none sm:w-52"
        >
          <option value="">{t('admin.book.filterAll')}</option>
          {actionOptions.map((action) => (
            <option key={action} value={action}>
              {action}
            </option>
          ))}
        </select>
      </div>

      {debouncedSearch && (
        <p className="text-[10px] text-[var(--admin-text-muted)]">{t('admin.logs.searchScope')}</p>
      )}

      {error ? (
        <AdminErrorState message={error} onRetry={load} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--admin-border)] bg-black/5 text-[10px] uppercase tracking-wider text-[var(--admin-text-muted)]">
                <th className="p-4 font-semibold">{t('admin.logs.dateTime')}</th>
                <th className="hidden p-4 font-semibold sm:table-cell">{t('admin.logs.user')}</th>
                <th className="p-4 font-semibold">{t('admin.logs.action')}</th>
                <th className="hidden p-4 font-semibold md:table-cell">{t('admin.logs.entity')}</th>
                <th className="hidden p-4 font-semibold lg:table-cell">{t('admin.logs.details')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-0">
                    <AdminTableSkeleton rows={10} columns={5} />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-0">
                    <AdminEmptyState
                      title={
                        logs.length === 0
                          ? t('admin.logs.empty')
                          : debouncedSearch
                            ? t('admin.logs.searchEmpty')
                            : t('state.searchEmpty')
                      }
                      description={logs.length === 0 && !debouncedSearch ? undefined : t('state.searchEmptyHint')}
                      icon={<ShieldAlert className="w-5 h-5" />}
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[var(--admin-border)] transition-colors hover:bg-[var(--admin-border)]/20"
                  >
                    <td className="p-4 font-mono text-xs whitespace-nowrap text-[var(--admin-text-muted)]">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1 text-[var(--admin-text-main)]">
                          <Clock className="w-3 h-3" /> {formatDate(row.createdAt)}
                        </span>
                        <span className="ml-4">
                          {formatDate(row.createdAt, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="hidden p-4 sm:table-cell">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--admin-border)]">
                          <User className="w-3 h-3 text-[var(--admin-text-muted)]" />
                        </span>
                        <div className="min-w-0">
                          <p className="max-w-[150px] truncate text-[11px] font-semibold text-[var(--admin-text-main)]">
                            {row.user?.name ?? t('admin.logs.system')}
                          </p>
                          <p className="text-[9px] text-[var(--admin-text-muted)]">
                            {row.user?.role ?? 'SYSTEM'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-block max-w-[220px] truncate rounded-full border px-2 py-0.5 text-[10px] font-bold ${actionStyle(row.action)}`}
                        title={row.action}
                      >
                        {row.action}
                      </span>
                    </td>
                    <td className="hidden p-4 text-[11px] font-semibold uppercase text-[var(--admin-text-muted)] md:table-cell">
                      {row.entity}
                    </td>
                    <td className="hidden max-w-[260px] truncate p-4 font-mono text-[10px] text-[var(--admin-text-muted)] lg:table-cell">
                      {row.details ?? '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <AdminPagination
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        disabled={loading || Boolean(error)}
      />
    </motion.div>
  );
}
