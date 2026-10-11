'use client';

/**
 * Pacotes — CRUD completo de `Package`.
 *
 * ## Contrato lido nas actions (não deduzido)
 *
 * `createPackage`/`updatePackage` gravam `gallery`, `itinerary`, `included` e
 * `notIncluded` com `toJsonArray(f.<campo>, 60)`. Em `src/lib/validate.ts`,
 * `toJsonArray` tenta `JSON.parse` e, se não for um array, cai no fallback que
 * divide por `/\\r?\\n/`, apaga linhas vazias e devolve `JSON.stringify(items)`.
 * Ou seja: **um item por linha no textarea é exatamente o formato esperado** —
 * nada de montar JSON à mão no cliente (e nada de objeto: um objeto por linha
 * viraria `"[object Object]"`).
 *
 * A leitura segue pelo mesmo caminho: `parseStringArray` (usada por
 * `/pacotes/page.tsx` e `/pacotes/[slug]/page.tsx`) transforma o JSON de volta
 * em `string[]`.
 *
 * ## Slug
 *
 * `updatePackage` só reescreve o slug quando o valor enviado, já normalizado,
 * difere do salvo (`slugify(stripLegacyTimestamp(x)) !== current.slug`), e passa
 * pelo `uniqueSlug(..., excludeId)`. Logo: preservar é seguro e nunca há
 * `Date.now()` no caminho do slug.
 *
 * ## Busca e filtro de destino
 *
 * `getPackages` aceita `{ page, pageSize, status, search, destination, category }`
 * e filtra tudo no servidor (com debounce de 300 ms no `search`).
 */
import { useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Edit3,
  Eye,
  ExternalLink,
  Package as PackageIcon,
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
  createPackage,
  deletePackage,
  getPackageBySlug,
  getPackages,
  updatePackage,
  updatePackageStatus,
} from '@/actions/packageActions';
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

interface PackageRow {
  id: string;
  title: string;
  slug: string;
  destination: string | null;
  price: number;
  category: string;
  description: string | null;
  gallery: string;
  itinerary: string;
  included: string;
  notIncluded: string;
  status: string;
}

interface PackageForm {
  title: string;
  slug: string;
  destination: string;
  price: string;
  category: string;
  description: string;
  gallery: string;
  itinerary: string;
  included: string;
  notIncluded: string;
  status: string;
}

interface PublicPreview {
  title: string;
  destination: string | null;
  price: number;
  status: string;
  days: number;
  images: number;
}

const EMPTY_FORM: PackageForm = {
  title: '',
  slug: '',
  destination: '',
  price: '',
  category: 'standard',
  description: '',
  gallery: '',
  itinerary: '',
  included: '',
  notIncluded: '',
  status: 'active',
};

const CATEGORIES = ['drip', 'standard', 'luxury', 'experience'] as const;

const CATEGORY_BADGE: Record<string, string> = {
  drip: 'border-[var(--admin-primary)]/30 bg-[var(--admin-primary)]/20 text-[var(--admin-primary)]',
  standard: 'border-gray-700 bg-gray-900/30 text-gray-300',
  luxury: 'border-yellow-800 bg-yellow-900/30 text-yellow-400',
  experience: 'border-cyan-800 bg-cyan-900/30 text-cyan-400',
};

/** Mesmo normalizador de `slugify`/`uniqueSlug` (server), usado só na criação. */
function slugifyLocal(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[çÇ]/g, 'c')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 80)
    .replace(/-+$/g, '');
}

/** JSON `string[]` -> textarea (uma linha por item). Espelha `parseStringArray`. */
function jsonArrayToLines(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed
        .map((entry) => (typeof entry === 'string' ? entry : String(entry)))
        .join('\n');
    }
  } catch {
    /* registros antigos podem guardar texto puro: devolve como está */
  }
  return trimmed;
}

/** Aceita `690`, `690,50` e `1.234,50`. */
function parseDecimal(raw: string): number | null {
  const cleaned = raw.trim();
  if (!cleaned) return null;
  const normalized = /,\d{1,2}$/.test(cleaned)
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned.replace(',', '.');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

export default function AdminPackagesHome() {
  const { t, formatCurrency, formatNumber } = useLanguage();
  const { toast } = useToast();

  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PackageRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<PackageForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<PublicPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const debouncedSearch = useDebouncedValue(search);
  const debouncedDestination = useDebouncedValue(destinationFilter);

  const loadPackages = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getPackages({
      page,
      pageSize,
      status: statusFilter || undefined,
      search: debouncedSearch.trim() || undefined,
      destination: debouncedDestination.trim() || undefined,
    });
    if (res.success) {
      setPackages((res.items ?? []) as unknown as PackageRow[]);
      setTotal(res.total ?? 0);
      setTotalPages(res.totalPages ?? 1);
    } else {
      setPackages([]);
      setTotal(0);
      setTotalPages(1);
      setError(res.error ?? t('state.errorTitle'));
    }
    setLoading(false);
  }, [page, pageSize, statusFilter, debouncedSearch, debouncedDestination, t]);

  useMountedLoad(loadPackages);

  /** `getPackages` já filtra no servidor; a lista exibida é a página devolvida. */
  const visiblePackages = useMemo(() => packages, [packages]);

  const destinations = useMemo(() => {
    const unique = new Set<string>();
    for (const item of packages) {
      const value = (item.destination ?? '').trim();
      if (value) unique.add(value);
    }
    return [...unique].sort((a, b) => a.localeCompare(b));
  }, [packages]);

  const statusLabel = useCallback(
    (status: string): string =>
      status === 'active' ? t('admin.pkg.statusActive') : t('admin.pkg.statusInactive'),
    [t],
  );

  const categoryLabel = useCallback(
    (category: string): string => {
      switch (category) {
        case 'drip':
          return t('admin.pkg.categoryDrip');
        case 'luxury':
          return t('admin.pkg.categoryLuxury');
        case 'experience':
          return t('admin.pkg.categoryExperience');
        default:
          return t('admin.pkg.categoryStandard');
      }
    },
    [t],
  );

  const openModal = (item?: PackageRow) => {
    setFormErrors({});
    setPreview(null);
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        slug: item.slug,
        destination: item.destination ?? '',
        price: String(item.price),
        category: item.category,
        description: item.description ?? '',
        gallery: jsonArrayToLines(item.gallery),
        itinerary: jsonArrayToLines(item.itinerary),
        included: jsonArrayToLines(item.included),
        notIncluded: jsonArrayToLines(item.notIncluded),
        status: item.status,
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
    setPreview(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const errors: Record<string, string> = {};

    if (formData.title.trim().length < 3) errors.title = t('admin.pkg.nameRequired');

    const price = parseDecimal(formData.price);
    if (price === null || price < 0) errors.price = t('admin.pkg.priceInvalid');

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    // Criação sem slug digitado: sugestão a partir do título (sem Date.now()).
    // Edição: o slug salvo vai junto e `updatePackage` o preserva.
    const slug = formData.slug.trim() || (editingItem ? '' : slugifyLocal(formData.title));

    setIsSubmitting(true);
    const payload = {
      title: formData.title.trim(),
      slug,
      destination: formData.destination,
      price: formData.price,
      category: formData.category,
      description: formData.description,
      gallery: formData.gallery,
      itinerary: formData.itinerary,
      included: formData.included,
      notIncluded: formData.notIncluded,
      status: formData.status,
    };
    const res = editingItem
      ? await updatePackage(editingItem.id, payload)
      : await createPackage(payload);
    setIsSubmitting(false);

    if (res.success) {
      toast(editingItem ? t('admin.pkg.updated') : t('admin.pkg.created'));
      closeModal();
      await loadPackages();
    } else {
      toast(res.error ?? t('state.errorTitle'), 'error');
    }
  };

  const handleToggleStatus = async (item: PackageRow) => {
    const next = item.status === 'active' ? 'inactive' : 'active';
    setBusy(true);
    const res = await updatePackageStatus(item.id, next);
    setBusy(false);
    if (res.success) {
      toast(
        t('admin.pkg.statusChanged')
          .replace('{name}', item.title)
          .replace('{status}', statusLabel(next)),
      );
      await loadPackages();
    } else {
      toast(res.error ?? t('state.errorTitle'), 'error');
    }
  };

  const handleDelete = async (item: PackageRow) => {
    const confirmed = window.confirm(t('admin.pkg.deleteConfirm').replace('{name}', item.title));
    if (!confirmed) return;
    setBusy(true);
    const res = await deletePackage(item.id);
    setBusy(false);
    if (res.success) {
      toast(t('admin.pkg.deleted'));
      if (editingItem?.id === item.id) closeModal();
      await loadPackages();
    } else {
      toast(res.error ?? t('state.errorTitle'), 'error');
    }
  };

  /** Confere o que a página pública `/pacotes/<slug>` vai encontrar no banco. */
  const handlePreview = async () => {
    const slug = formData.slug.trim();
    if (!slug) {
      toast(t('admin.pkg.slug'), 'error');
      return;
    }
    setPreviewLoading(true);
    setPreview(null);
    const res = await getPackageBySlug(slug);
    setPreviewLoading(false);
    if (!res.success || !res.data) {
      toast(res.error ?? t('state.errorTitle'), 'error');
      return;
    }
    const data = res.data;
    setPreview({
      title: data.title,
      destination: data.destination,
      price: data.price,
      status: data.status,
      days: jsonArrayToLines(data.itinerary).split('\n').filter((line) => line.trim().length > 0).length,
      images: jsonArrayToLines(data.gallery).split('\n').filter((line) => line.trim().length > 0).length,
    });
  };

  const formGalleryPreview = useMemo(
    () =>
      formData.gallery
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)[0] ?? '',
    [formData.gallery],
  );

  const isFiltering = Boolean(debouncedSearch.trim() || debouncedDestination.trim());

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-full flex-col gap-6"
    >
      <AdminPageHeader
        icon={<PackageIcon className="w-5 h-5" />}
        title={t('admin.pkg.title')}
        subtitle={t('admin.pkg.subtitle')}
        actions={
          <>
            <span className="rounded bg-[var(--admin-border)]/50 px-2 py-1 text-xs text-[var(--admin-text-muted)]">
              {t('admin.pkg.total').replace('{count}', formatNumber(total))}
            </span>
            <Button
              onClick={loadPackages}
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
              <Plus className="w-4 h-4 mr-1" /> {t('admin.pkg.newPackage')}
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
          placeholder={t('admin.pkg.search')}
          aria-label={t('admin.pkg.search')}
          className="h-9 max-w-md flex-1 bg-[var(--admin-card)] text-xs text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          aria-label={t('admin.pkg.status')}
          className="h-9 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 text-xs text-[var(--admin-text-muted)] focus:border-[var(--admin-primary)] focus:outline-none"
        >
          <option value="">{t('admin.pkg.allStatuses')}</option>
          <option value="active">{t('admin.pkg.statusActive')}</option>
          <option value="inactive">{t('admin.pkg.statusInactive')}</option>
        </select>
        <select
          value={destinationFilter}
          onChange={(e) => {
            setDestinationFilter(e.target.value);
            setPage(1);
          }}
          aria-label={t('admin.pkg.destination')}
          className="h-9 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 text-xs text-[var(--admin-text-muted)] focus:border-[var(--admin-primary)] focus:outline-none"
        >
          <option value="">{t('admin.pkg.destinationAll')}</option>
          {destinations.map((destination) => (
            <option key={destination} value={destination}>
              {destination}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <AdminErrorState message={error} onRetry={loadPackages} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--admin-border)] bg-black/5 text-[10px] uppercase tracking-wider text-[var(--admin-text-muted)]">
                <th className="p-4 font-semibold">{t('admin.pkg.name')}</th>
                <th className="hidden p-4 font-semibold md:table-cell">{t('admin.pkg.destination')}</th>
                <th className="hidden p-4 font-semibold lg:table-cell">{t('admin.pkg.category')}</th>
                <th className="hidden p-4 font-semibold sm:table-cell">{t('admin.pkg.price')}</th>
                <th className="p-4 font-semibold">{t('admin.pkg.status')}</th>
                <th className="p-4 text-right font-semibold">{t('admin.team.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && packages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <AdminTableSkeleton rows={8} columns={5} />
                  </td>
                </tr>
              ) : visiblePackages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <AdminEmptyState
                      title={t('admin.pkg.empty')}
                      description={isFiltering ? t('state.searchEmptyHint') : undefined}
                      icon={<PackageIcon className="w-5 h-5" />}
                      action={
                        <Button
                          onClick={() => openModal()}
                          className="mt-2 bg-[var(--admin-primary)] font-semibold text-black hover:bg-[var(--admin-primary-hover)]"
                        >
                          <Plus className="w-4 h-4 mr-1" /> {t('admin.pkg.createFirst')}
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                visiblePackages.map((item) => {
                  const cover = jsonArrayToLines(item.gallery)
                    .split('\n')
                    .map((line) => line.trim())
                    .filter(Boolean)[0];
                  return (
                    <tr
                      key={item.id}
                      className="group border-b border-[var(--admin-border)] transition-colors hover:bg-[var(--admin-border)]/20"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[var(--admin-border)]">
                            {cover ? (
                              <SmartImage
                                src={cover}
                                alt=""
                                fill
                                sizes="40px"
                                className="object-cover"
                                unoptimizedMedia
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center">
                                <PackageIcon className="w-4 h-4 text-[var(--admin-text-muted)]" />
                              </span>
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="max-w-[240px] truncate text-xs font-semibold text-[var(--admin-text-main)]">
                              {item.title}
                            </p>
                            <p className="truncate text-[10px] text-[var(--admin-text-muted)]">
                              {item.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden p-4 text-[11px] text-[var(--admin-text-main)] md:table-cell">
                        {item.destination || t('admin.pkg.destinationNone')}
                      </td>
                      <td className="hidden p-4 md:table-cell lg:table-cell">
                        <span
                          className={`rounded-full border px-2 py-1 text-[10px] font-bold ${
                            CATEGORY_BADGE[item.category] ?? CATEGORY_BADGE.standard
                          }`}
                          title={categoryLabel(item.category)}
                        >
                          {item.category}
                        </span>
                      </td>
                      <td className="hidden p-4 text-[11px] font-bold text-[var(--admin-accent-green)] sm:table-cell">
                        {formatCurrency(item.price)}
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
                          <a
                            href={`/pacotes/${item.slug}`}
                            target="_blank"
                            rel="noreferrer noopener"
                            aria-label={t('admin.pkg.publicPage')}
                            title={t('admin.pkg.publicPage')}
                            className="rounded-md p-1.5 text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-border)] hover:text-[var(--admin-primary)]"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void handleToggleStatus(item)}
                            aria-label={
                              item.status === 'active'
                                ? t('admin.pkg.deactivate')
                                : t('admin.pkg.activate')
                            }
                            title={
                              item.status === 'active'
                                ? t('admin.pkg.deactivate')
                                : t('admin.pkg.activate')
                            }
                            className="rounded-md p-1.5 text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-border)] hover:text-[var(--admin-primary)] disabled:opacity-40"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openModal(item)}
                            aria-label={t('admin.pkg.editPackage')}
                            className="rounded-md p-1.5 text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-border)] hover:text-[var(--admin-primary)]"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void handleDelete(item)}
                            aria-label={t('admin.pkg.deleteConfirm').replace('{name}', item.title)}
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

      {/* ── Criar / editar pacote ─────────────────────────────────────── */}
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
              className="fixed top-1/2 left-1/2 z-[101] flex max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-bg)] shadow-2xl"
            >
              <header className="flex items-center justify-between gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
                <h3 className="text-lg font-bold text-[var(--admin-text-main)]">
                  {editingItem ? t('admin.pkg.editPackage') : t('admin.pkg.newPackage')}
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
                <form id="pkgForm" onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="pkg-title" className="text-xs font-semibold text-[var(--admin-text-main)]">
                      {t('admin.pkg.name')} *
                    </label>
                    <Input
                      id="pkg-title"
                      required
                      value={formData.title}
                      onChange={(e) => {
                        const title = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          title,
                          // Sugestão de slug apenas na criação; um pacote salvo
                          // nunca tem a URL pública trocada sozinha.
                          slug: editingItem ? prev.slug : slugifyLocal(title),
                        }));
                      }}
                      aria-invalid={Boolean(formErrors.title)}
                      placeholder={t('admin.pkg.namePlaceholder')}
                      className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                    />
                    {formErrors.title && (
                      <span className="text-[10px] text-[var(--admin-accent-red)]">{formErrors.title}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="pkg-slug" className="text-xs font-semibold text-[var(--admin-text-main)]">
                        {t('admin.pkg.slug')}
                      </label>
                      <Input
                        id="pkg-slug"
                        value={formData.slug}
                        onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                        className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                      />
                      <span className="text-[10px] text-[var(--admin-text-muted)]">
                        {t('admin.pkg.slugHint')}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="pkg-destination"
                        className="text-xs font-semibold text-[var(--admin-text-main)]"
                      >
                        {t('admin.pkg.destination')}
                      </label>
                      <Input
                        id="pkg-destination"
                        value={formData.destination}
                        onChange={(e) => setFormData((prev) => ({ ...prev, destination: e.target.value }))}
                        placeholder={t('admin.pkg.destinationPlaceholder')}
                        className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="pkg-price" className="text-xs font-semibold text-[var(--admin-text-main)]">
                        {t('admin.pkg.price')} *
                      </label>
                      <Input
                        id="pkg-price"
                        inputMode="decimal"
                        value={formData.price}
                        onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                        aria-invalid={Boolean(formErrors.price)}
                        placeholder="0,00"
                        className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                      />
                      {formErrors.price && (
                        <span className="text-[10px] text-[var(--admin-accent-red)]">{formErrors.price}</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="pkg-category"
                        className="text-xs font-semibold text-[var(--admin-text-main)]"
                      >
                        {t('admin.pkg.category')}
                      </label>
                      <select
                        id="pkg-category"
                        value={formData.category}
                        onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                        className="h-10 rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 text-sm text-[var(--admin-text-main)] focus:border-[var(--admin-primary)] focus:outline-none"
                      >
                        {CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {categoryLabel(category)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="pkg-status"
                        className="text-xs font-semibold text-[var(--admin-text-main)]"
                      >
                        {t('admin.pkg.status')}
                      </label>
                      <select
                        id="pkg-status"
                        value={formData.status}
                        onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                        className="h-10 rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 text-sm text-[var(--admin-text-main)] focus:border-[var(--admin-primary)] focus:outline-none"
                      >
                        <option value="active">{t('admin.pkg.statusActive')}</option>
                        <option value="inactive">{t('admin.pkg.statusInactive')}</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="pkg-gallery"
                      className="text-xs font-semibold text-[var(--admin-text-main)]"
                    >
                      {t('admin.pkg.gallery')}
                    </label>
                    <textarea
                      id="pkg-gallery"
                      value={formData.gallery}
                      onChange={(e) => setFormData((prev) => ({ ...prev, gallery: e.target.value }))}
                      placeholder={'/api/media/…  |  https://…'}
                      className="flex min-h-[80px] w-full resize-y rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm text-[var(--admin-text-main)] focus-visible:border-[var(--admin-primary)] focus-visible:outline-none"
                    />
                    <span className="text-[10px] text-[var(--admin-text-muted)]">
                      {t('admin.pkg.galleryHint')}
                    </span>
                    {formGalleryPreview && (
                      <div className="relative mt-1 h-32 w-full overflow-hidden rounded-lg border border-[var(--admin-border)]">
                        <SmartImage
                          src={formGalleryPreview}
                          alt=""
                          fill
                          sizes="640px"
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="pkg-description"
                      className="text-xs font-semibold text-[var(--admin-text-main)]"
                    >
                      {t('admin.pkg.description')}
                    </label>
                    <textarea
                      id="pkg-description"
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      className="flex min-h-[90px] w-full resize-y rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm text-[var(--admin-text-main)] focus-visible:border-[var(--admin-primary)] focus-visible:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="pkg-itinerary"
                      className="text-xs font-semibold text-[var(--admin-text-main)]"
                    >
                      {t('admin.pkg.itinerary')}
                    </label>
                    <textarea
                      id="pkg-itinerary"
                      value={formData.itinerary}
                      onChange={(e) => setFormData((prev) => ({ ...prev, itinerary: e.target.value }))}
                      className="flex min-h-[110px] w-full resize-y rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm text-[var(--admin-text-main)] focus-visible:border-[var(--admin-primary)] focus-visible:outline-none"
                    />
                    <span className="text-[10px] text-[var(--admin-text-muted)]">
                      {t('admin.pkg.itineraryHint')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="pkg-included"
                        className="text-xs font-semibold text-[var(--admin-text-main)]"
                      >
                        {t('admin.pkg.included')}
                      </label>
                      <textarea
                        id="pkg-included"
                        value={formData.included}
                        onChange={(e) => setFormData((prev) => ({ ...prev, included: e.target.value }))}
                        className="flex min-h-[110px] w-full resize-y rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm text-[var(--admin-text-main)] focus-visible:border-[var(--admin-primary)] focus-visible:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="pkg-not-included"
                        className="text-xs font-semibold text-[var(--admin-text-main)]"
                      >
                        {t('admin.pkg.notIncluded')}
                      </label>
                      <textarea
                        id="pkg-not-included"
                        value={formData.notIncluded}
                        onChange={(e) => setFormData((prev) => ({ ...prev, notIncluded: e.target.value }))}
                        className="flex min-h-[110px] w-full resize-y rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm text-[var(--admin-text-main)] focus-visible:border-[var(--admin-primary)] focus-visible:outline-none"
                      />
                    </div>
                  </div>

                  <div
                    role="status"
                    className="flex flex-col gap-2 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[var(--admin-text-main)]">
                        {t('admin.pkg.preview')}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void handlePreview()}
                        disabled={previewLoading}
                        className="h-8 border-[var(--admin-border)] px-3 text-xs text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50"
                      >
                        <Eye className={`w-3.5 h-3.5 mr-1 ${previewLoading ? 'animate-pulse' : ''}`} />
                        {previewLoading ? t('admin.pkg.previewChecking') : t('admin.pkg.preview')}
                      </Button>
                    </div>
                    {preview ? (
                      <ul className="flex flex-col gap-1 text-[11px] text-[var(--admin-text-muted)]">
                        <li className="font-semibold text-[var(--admin-text-main)]">{preview.title}</li>
                        <li>{preview.destination || t('admin.pkg.destinationNone')}</li>
                        <li>{formatCurrency(preview.price)}</li>
                        <li>{statusLabel(preview.status)}</li>
                        <li>
                          {t('admin.pkg.previewDays').replace('{count}', formatNumber(preview.days))}
                        </li>
                        <li>
                          {t('admin.pkg.previewImages').replace('{count}', formatNumber(preview.images))}
                        </li>
                        <li>{t('admin.pkg.previewHidden')}</li>
                      </ul>
                    ) : (
                      <p className="text-[10px] text-[var(--admin-text-muted)]">
                        {previewLoading ? t('admin.pkg.previewChecking') : t('admin.pkg.previewEmpty')}
                      </p>
                    )}
                  </div>
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
                  form="pkgForm"
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
