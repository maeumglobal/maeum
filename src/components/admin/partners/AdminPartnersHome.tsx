'use client';

/**
 * Parceiros â€” CRUD de `Partner` + reordenaÃ§Ã£o por `sortOrder`.
 *
 * ## Onde o parceiro aparece no site
 *
 * Ãšnica pÃ¡gina pÃºblica que lÃª `Partner`: `/sobre` (`prisma.partner.findMany`
 * com `status: 'active'`, `orderBy: { sortOrder: 'asc' }`, `take: 24`), que usa
 * `logoUrl`, `name`, `category` e `website` â€” no card e no JSON-LD
 * `mainEntity.member`.
 *
 * ## ReordenaÃ§Ã£o
 *
 * `getPartners` ordena por `[{ sortOrder: 'asc' }, { name: 'asc' }]`. Trocar
 * `sortOrder` de dois vizinhos com o MESMO valor (o padrÃ£o, jÃ¡ que
 * `createPartner` nÃ£o recebe `sortOrder`) nÃ£o mudaria nada â€” por isso os dois
 * updates saem com valores distintos (`min` e `max + 1`), via `Promise.all`, com
 * rollback do estado otimista se qualquer um falhar.
 *
 * ## Busca
 *
 * `getPartners` aceita `{ page, pageSize, category, status, search }` e filtra
 * no servidor (com debounce de 300 ms no `search`).
 */
import { useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowDown,
  ArrowUp,
  Building2,
  Edit3,
  ExternalLink,
  Mail,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  createPartner,
  deletePartner,
  getPartners,
  updatePartner,
} from '@/actions/businessActions';
import SmartImage from '@/components/SmartImage';
import AdminPagination from '@/components/admin/ui/Pagination';
import { useDebouncedValue } from '@/components/admin/ui/useDebouncedValue';
import { useMountedLoad } from '@/components/admin/ui/useMountedLoad';
import {
  AdminEmptyState,
  AdminErrorState,
  AdminPageHeader,
  AdminTableSkeleton,
} from '@/components/admin/ui/States';

interface PartnerRow {
  id: string;
  name: string;
  category: string | null;
  contactEmail: string | null;
  phone: string | null;
  website: string | null;
  logoUrl: string | null;
  description: string | null;
  status: string;
  sortOrder: number;
}

interface PartnerForm {
  name: string;
  category: string;
  contactEmail: string;
  phone: string;
  website: string;
  logoUrl: string;
  description: string;
  status: string;
  sortOrder: string;
}

const EMPTY_FORM: PartnerForm = {
  name: '',
  category: '',
  contactEmail: '',
  phone: '',
  website: '',
  logoUrl: '',
  description: '',
  status: 'active',
  sortOrder: '0',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export default function AdminPartnersHome() {
  const { t, formatNumber } = useLanguage();
  const { toast } = useToast();

  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PartnerRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<PartnerForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const debouncedSearch = useDebouncedValue(search);

  const loadPartners = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getPartners({
      page,
      pageSize,
      status: statusFilter || undefined,
      search: debouncedSearch.trim() || undefined,
    });
    if (res.success) {
      setPartners((res.items ?? []) as unknown as PartnerRow[]);
      setTotal(res.total ?? 0);
      setTotalPages(res.totalPages ?? 1);
    } else {
      setPartners([]);
      setTotal(0);
      setTotalPages(1);
      setError(res.error ?? t('state.errorTitle'));
    }
    setLoading(false);
  }, [page, pageSize, statusFilter, debouncedSearch, t]);

  useMountedLoad(loadPartners);

const visiblePartners = useMemo(() => partners, [partners]);

  const statusLabel = useCallback(
    (status: string): string =>
      status === 'active' ? t('admin.partner.statusActive') : t('admin.partner.statusInactive'),
    [t],
  );

  const openModal = (item?: PartnerRow) => {
    setFormErrors({});
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        category: item.category ?? '',
        contactEmail: item.contactEmail ?? '',
        phone: item.phone ?? '',
        website: item.website ?? '',
        logoUrl: item.logoUrl ?? '',
        description: item.description ?? '',
        status: item.status,
        sortOrder: String(item.sortOrder),
      });
    } else {
      setEditingItem(null);
      setFormData(EMPTY_FORM);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const errors: Record<string, string> = {};

    if (formData.name.trim().length < 2) errors.name = t('admin.partner.nameRequired');
    if (formData.contactEmail.trim() && !EMAIL_RE.test(formData.contactEmail.trim())) {
      errors.contactEmail = t('admin.partner.emailInvalid');
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    // `createPartner` grava `status: 'active'` e ignora `sortOrder`; os dois
    // campos sÃ³ entram no payload de ediÃ§Ã£o, que Ã© quem os aceita.
    const payload: Record<string, unknown> = {
      name: formData.name,
      category: formData.category,
      contactEmail: formData.contactEmail,
      phone: formData.phone,
      website: formData.website,
      logoUrl: formData.logoUrl,
      description: formData.description,
    };
    if (editingItem) {
      payload.status = formData.status;
      payload.sortOrder = formData.sortOrder;
    }

    setIsSubmitting(true);
    const res = editingItem ? await updatePartner(editingItem.id, payload) : await createPartner(payload);
    setIsSubmitting(false);

    if (res.success) {
      toast(editingItem ? t('admin.partner.updated') : t('admin.partner.created'));
      closeModal();
      await loadPartners();
    } else {
      toast(res.error ?? t('state.errorTitle'), 'error');
    }
  };

  const handleDelete = async (item: PartnerRow) => {
    const confirmed = window.confirm(
      t('admin.partner.deleteConfirm').replace('{name}', item.name),
    );
    if (!confirmed) return;
    setBusy(true);
    const res = await deletePartner(item.id);
    setBusy(false);
    if (res.success) {
      toast(t('admin.partner.deleted'));
      if (editingItem?.id === item.id) closeModal();
      await loadPartners();
    } else {
      toast(res.error ?? t('state.errorTitle'), 'error');
    }
  };

  const handleToggleStatus = async (item: PartnerRow) => {
    const next = item.status === 'active' ? 'inactive' : 'active';
    setBusy(true);
    const res = await updatePartner(item.id, { status: next });
    setBusy(false);
    if (res.success) {
      toast(
        t('admin.partner.statusChanged')
          .replace('{name}', item.name)
          .replace('{status}', statusLabel(next)),
      );
      await loadPartners();
    } else {
      toast(res.error ?? t('state.errorTitle'), 'error');
    }
  };

  /**
   * Troca o parceiro com o vizinho da pÃ¡gina (Ã­ndice sempre calculado sobre a
   * ordem do servidor, entÃ£o filtrar nÃ£o embaralha a reordenaÃ§Ã£o).
   *
   * Os dois `updatePartner` saem juntos e com valores DISTINTOS â€” dois registros
   * com o mesmo `sortOrder` (o padrÃ£o do `createPartner`) continuariam empatados
   * e a troca seria um no-op silencioso.
   */
  const handleReorder = async (item: PartnerRow, direction: 'up' | 'down') => {
    const index = partners.findIndex((row) => row.id === item.id);
    const target = direction === 'up' ? index - 1 : index + 1;
    if (index < 0 || target < 0 || target >= partners.length) return;
    const neighbour = partners[target];
    if (!neighbour) return;

    const previous = partners;
    const low = Math.min(item.sortOrder, neighbour.sortOrder);
    const high = Math.max(item.sortOrder, neighbour.sortOrder) + 1;
    const movedValue = direction === 'up' ? high : low;
    const neighbourValue = direction === 'up' ? low : high;

    const optimistic = [...partners];
    optimistic[index] = neighbour;
    optimistic[target] = item;
    setPartners(optimistic);
    setBusy(true);

    const [first, second] = await Promise.all([
      updatePartner(item.id, { sortOrder: movedValue }),
      updatePartner(neighbour.id, { sortOrder: neighbourValue }),
    ]);
    setBusy(false);

    if (!first.success || !second.success) {
      setPartners(previous);
      toast(first.error ?? second.error ?? t('admin.partner.reorderFailed'), 'error');
      await loadPartners();
      return;
    }
    toast(t('admin.partner.reordered'));
    await loadPartners();
  };

  const isFiltering = Boolean(debouncedSearch.trim());

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-full flex-col gap-6"
    >
      <AdminPageHeader
        icon={<Building2 className="w-5 h-5" />}
        title={t('admin.partner.title')}
        subtitle={t('admin.partner.subtitle')}
        actions={
          <>
            <span className="rounded bg-[var(--admin-border)]/50 px-2 py-1 text-xs text-[var(--admin-text-muted)]">
              {t('admin.partner.total').replace('{count}', formatNumber(total))}
            </span>
            <Button
              onClick={loadPartners}
              variant="outline"
              aria-label={t('common.refresh')}
              className="h-9 border-[var(--admin-border)] px-3 text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              onClick={() => openModal()}
              className="h-9 bg-[var(--admin-primary)] px-4 font-semibold text-black hover:bg-[var(--admin-primary-hover)]"
            >
              <Plus className="w-4 h-4 mr-1" /> {t('admin.partner.newPartner')}
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder={t('admin.partner.search')}
          aria-label={t('admin.partner.search')}
          className="h-9 max-w-md flex-1 bg-[var(--admin-card)] text-xs text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          aria-label={t('admin.partner.status')}
          className="h-9 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 text-xs text-[var(--admin-text-muted)] focus:border-[var(--admin-primary)] focus:outline-none"
        >
          <option value="">{t('admin.partner.allStatuses')}</option>
          <option value="active">{t('admin.partner.statusActive')}</option>
          <option value="inactive">{t('admin.partner.statusInactive')}</option>
        </select>
      </div>

      <p className="text-[10px] text-[var(--admin-text-muted)]">
        {t('admin.partner.orderHint')}
      </p>

      {error ? (
        <AdminErrorState message={error} onRetry={loadPartners} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--admin-border)] bg-black/5 text-[10px] uppercase tracking-wider text-[var(--admin-text-muted)]">
                <th className="w-10 p-4 font-semibold">#</th>
                <th className="p-4 font-semibold">{t('admin.partner.name')}</th>
                <th className="hidden p-4 font-semibold md:table-cell">
                  {t('admin.partner.contact')}
                </th>
                <th className="hidden p-4 font-semibold lg:table-cell">
                  {t('admin.partner.sortOrder')}
                </th>
                <th className="p-4 font-semibold">{t('admin.partner.status')}</th>
                <th className="p-4 text-right font-semibold">{t('admin.team.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && partners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <AdminTableSkeleton rows={6} columns={4} />
                  </td>
                </tr>
              ) : visiblePartners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <AdminEmptyState
                      title={t('admin.partner.empty')}
                      description={isFiltering ? t('state.searchEmptyHint') : undefined}
                      icon={<Building2 className="w-5 h-5" />}
                      action={
                        <Button
                          onClick={() => openModal()}
                          className="mt-2 bg-[var(--admin-primary)] font-semibold text-black hover:bg-[var(--admin-primary-hover)]"
                        >
                          <Plus className="w-4 h-4 mr-1" /> {t('admin.partner.createFirst')}
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                visiblePartners.map((item) => {
                  const position = partners.findIndex((row) => row.id === item.id);
                  return (
                    <tr
                      key={item.id}
                      className="group border-b border-[var(--admin-border)] transition-colors hover:bg-[var(--admin-border)]/20"
                    >
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            disabled={busy || position <= 0}
                            onClick={() => void handleReorder(item, 'up')}
                            aria-label={t('admin.partner.moveUp')}
                            title={t('admin.partner.moveUp')}
                            className="text-[var(--admin-text-muted)] transition-colors hover:text-[var(--admin-primary)] disabled:cursor-not-allowed disabled:opacity-25"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={busy || position < 0 || position >= partners.length - 1}
                            onClick={() => void handleReorder(item, 'down')}
                            aria-label={t('admin.partner.moveDown')}
                            title={t('admin.partner.moveDown')}
                            className="text-[var(--admin-text-muted)] transition-colors hover:text-[var(--admin-primary)] disabled:cursor-not-allowed disabled:opacity-25"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[var(--admin-border)]">
                            {item.logoUrl ? (
                              <SmartImage
                                src={item.logoUrl}
                                alt=""
                                fill
                                sizes="40px"
                                className="object-contain"
                                unoptimizedMedia
                                placeholderLabel={t('admin.partner.noLogo')}
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center">
                                <Building2 className="w-4 h-4 text-[var(--admin-text-muted)]" />
                              </span>
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="max-w-[220px] truncate text-xs font-semibold text-[var(--admin-text-main)]">
                              {item.name}
                            </p>
                            <p className="truncate text-[10px] text-[var(--admin-text-muted)]">
                              {item.category || 'â€”'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden p-4 md:table-cell">
                        <div className="flex flex-col gap-1">
                          {item.contactEmail && (
                            <span className="flex items-center gap-1 text-[11px] text-[var(--admin-text-main)]">
                              <Mail className="w-3 h-3 text-[var(--admin-text-muted)]" />
                              <span className="max-w-[180px] truncate">{item.contactEmail}</span>
                            </span>
                          )}
                          {item.website && (
                            <a
                              href={item.website}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="flex items-center gap-1 text-[10px] text-[var(--admin-primary)] hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span className="max-w-[180px] truncate">{t('admin.partner.openSite')}</span>
                            </a>
                          )}
                          {!item.contactEmail && !item.website && (
                            <span className="text-[11px] text-[var(--admin-text-muted)]">â€”</span>
                          )}
                        </div>
                      </td>
                      <td className="hidden p-4 text-[11px] text-[var(--admin-text-main)] lg:table-cell">
                        {formatNumber(item.sortOrder)}
                      </td>
                      <td className="p-4">
                        <span
                          className={`rounded-full border px-2 py-1 text-[10px] font-bold ${
                            item.status === 'active'
                              ? 'border-green-800 bg-green-900/30 text-green-400'
                              : 'border-gray-700 bg-gray-900/30 text-gray-400'
                          }`}
                        >
                          {statusLabel(item.status)}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void handleToggleStatus(item)}
                            aria-label={
                              item.status === 'active'
                                ? t('admin.partner.statusInactive')
                                : t('admin.partner.statusActive')
                            }
                            className="rounded border border-[var(--admin-border)] px-2 py-1 text-[10px] font-semibold text-[var(--admin-text-main)] transition-colors hover:bg-[var(--admin-border)]/50 disabled:opacity-40"
                          >
                            {item.status === 'active'
                              ? t('admin.partner.statusInactive')
                              : t('admin.partner.statusActive')}
                          </button>
                          <button
                            type="button"
                            onClick={() => openModal(item)}
                            aria-label={t('admin.partner.editPartner')}
                            className="rounded-md p-1.5 text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-border)] hover:text-[var(--admin-primary)]"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void handleDelete(item)}
                            aria-label={t('admin.partner.deleteConfirm').replace('{name}', item.name)}
                            className="rounded-md p-1.5 text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-accent-red)]/10 hover:text-[var(--admin-accent-red)] disabled:opacity-40"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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

      {/* â”€â”€ Criar / editar parceiro â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.button
              type="button"
              aria-label={t('admin.common.cancel')}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 z-[101] flex max-h-[90vh] w-full max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-bg)] shadow-2xl"
            >
              <header className="flex items-center justify-between gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
                <h3 className="text-lg font-bold text-[var(--admin-text-main)]">
                  {editingItem ? t('admin.partner.editPartner') : t('admin.partner.newPartner')}
                </h3>
                <button
                  type="button"
                  onClick={closeModal}
                  aria-label={t('admin.common.close')}
                  className="text-[var(--admin-text-muted)] transition-colors hover:text-[var(--admin-text-main)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-6">
                <form id="partnerForm" onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="partner-name"
                      className="text-xs font-semibold text-[var(--admin-text-main)]"
                    >
                      {t('admin.partner.name')} *
                    </label>
                    <Input
                      id="partner-name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      aria-invalid={Boolean(formErrors.name)}
                      placeholder={t('admin.partner.namePlaceholder')}
                      className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                    />
                    {formErrors.name && (
                      <span className="text-[10px] text-[var(--admin-accent-red)]">{formErrors.name}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="partner-category"
                        className="text-xs font-semibold text-[var(--admin-text-main)]"
                      >
                        {t('admin.partner.category')}
                      </label>
                      <Input
                        id="partner-category"
                        value={formData.category}
                        onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                        placeholder={t('admin.partner.categoryPlaceholder')}
                        className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="partner-email"
                        className="text-xs font-semibold text-[var(--admin-text-main)]"
                      >
                        {t('admin.partner.contactEmail')}
                      </label>
                      <Input
                        id="partner-email"
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => setFormData((prev) => ({ ...prev, contactEmail: e.target.value }))}
                        aria-invalid={Boolean(formErrors.contactEmail)}
                        className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                      />
                      {formErrors.contactEmail && (
                        <span className="text-[10px] text-[var(--admin-accent-red)]">
                          {formErrors.contactEmail}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="partner-phone"
                        className="text-xs font-semibold text-[var(--admin-text-main)]"
                      >
                        {t('admin.partner.phone')}
                      </label>
                      <Input
                        id="partner-phone"
                        value={formData.phone}
                        onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                        className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="partner-website"
                        className="text-xs font-semibold text-[var(--admin-text-main)]"
                      >
                        {t('admin.partner.website')}
                      </label>
                      <Input
                        id="partner-website"
                        value={formData.website}
                        onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                        placeholder="https://â€¦"
                        className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="partner-logo"
                      className="text-xs font-semibold text-[var(--admin-text-main)]"
                    >
                      {t('admin.partner.logoUrl')}
                    </label>
                    <Input
                      id="partner-logo"
                      value={formData.logoUrl}
                      onChange={(e) => setFormData((prev) => ({ ...prev, logoUrl: e.target.value }))}
                      placeholder="/api/media/â€¦  |  https://â€¦"
                      className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                    />
                    <span className="text-[10px] text-[var(--admin-text-muted)]">
                      {t('admin.partner.logoHint')}
                    </span>
                    {formData.logoUrl && (
                      <div className="relative mt-1 h-20 w-32 overflow-hidden rounded-lg border border-[var(--admin-border)]">
                        <SmartImage
                          src={formData.logoUrl}
                          alt=""
                          fill
                          sizes="128px"
                          className="object-contain"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="partner-description"
                      className="text-xs font-semibold text-[var(--admin-text-main)]"
                    >
                      {t('admin.partner.description')}
                    </label>
                    <textarea
                      id="partner-description"
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      className="flex min-h-[90px] w-full resize-y rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm text-[var(--admin-text-main)] focus-visible:border-[var(--admin-primary)] focus-visible:outline-none"
                    />
                  </div>

                  {editingItem && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="partner-status"
                          className="text-xs font-semibold text-[var(--admin-text-main)]"
                        >
                          {t('admin.partner.status')}
                        </label>
                        <select
                          id="partner-status"
                          value={formData.status}
                          onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                          className="h-10 rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 text-sm text-[var(--admin-text-main)] focus:border-[var(--admin-primary)] focus:outline-none"
                        >
                          <option value="active">{t('admin.partner.statusActive')}</option>
                          <option value="inactive">{t('admin.partner.statusInactive')}</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="partner-sort-order"
                          className="text-xs font-semibold text-[var(--admin-text-main)]"
                        >
                          {t('admin.partner.sortOrder')}
                        </label>
                        <Input
                          id="partner-sort-order"
                          inputMode="numeric"
                          value={formData.sortOrder}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, sortOrder: e.target.value }))
                          }
                          className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                        />
                        <span className="text-[10px] text-[var(--admin-text-muted)]">
                          {t('admin.partner.sortOrderHint')}
                        </span>
                      </div>
                    </div>
                  )}

                  {!editingItem && (
                    <p className="text-[10px] text-[var(--admin-text-muted)]">
                      {t('admin.partner.createNote')}
                    </p>
                  )}
                </form>
              </div>

              <footer className="flex justify-end gap-3 border-t border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="border-[var(--admin-border)] text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50"
                >
                  {t('admin.common.cancel')}
                </Button>
                <Button
                  form="partnerForm"
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[var(--admin-primary)] font-semibold text-black hover:bg-[var(--admin-primary-hover)]"
                >
                  {isSubmitting
                    ? t('admin.state.loading')
                    : editingItem
                      ? t('admin.common.update')
                      : t('admin.common.create')}
                </Button>
              </footer>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
