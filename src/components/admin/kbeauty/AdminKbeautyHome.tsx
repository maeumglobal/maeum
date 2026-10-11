'use client';

/**
 * Experiências K-Beauty (`KbeautyExperience`).
 *
 * ## Por que esta tela existe
 *
 * A página pública `src/app/coreia-do-sul/k-beauty/page.tsx` lê
 * `prisma.kbeautyExperience` direto no servidor — e `getKbeautyExperiences`,
 * `createKbeautyExperience`, `updateKbeautyExperience` e
 * `deleteKbeautyExperience` não eram chamadas por NENHUM componente. A tabela
 * tinha 1 registro que ninguém conseguia editar.
 *
 * ## Campos e o que a página pública realmente usa
 *
 * Lidos por `/coreia-do-sul/k-beauty`: `status` (só `active`), `slug`,
 * `title`, `subtitle`, `location`, `description`, `durationHours`,
 * `pricePerPerson`, `priceCurrency`, `mainImage`, `included`.
 *
 * Guardados, mas ainda NÃO renderizados pela página: `highlights`, `gallery`,
 * `bookingType`, `isPartnerExperience`, `isIncludedInJourney` e
 * `availableFrom`. Ficam editáveis (e o aviso está na tela) para quando a
 * página for ampliada — nada é perdido por salvá-los.
 *
 * ## Decisões
 *
 * - **Slug estável**: `slugify` só na criação; ao editar o slug salvo é
 *   enviado como está e a action (`uniqueSlug` com `excludeId`) só troca se o
 *   valor realmente mudou. Nunca `Date.now()`.
 * - **`highlights`/`included`/`gallery`**: um item por linha no formulário; o
 *   servidor normaliza para JSON (`toJsonArray`) e a página lê com
 *   `JSON.parse` + filtro de strings.
 * - **`availableFrom`**: gravado pelo `create` e pelo `update` (o update
 *   historicamente ignorava o campo; agora persiste).
 * - **`getKbeautyExperiences()` não pagina** (`take: 200`), então não há
 *   `Pagination` aqui: a busca é filtrada no cliente, sobre a lista inteira.
 */
import { useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Clock,
  Compass,
  Edit3,
  Images,
  MapPin,
  Plus,
  RefreshCw,
  Sparkles,
  TriangleAlert,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  createKbeautyExperience,
  deleteKbeautyExperience,
  getKbeautyExperiences,
  updateKbeautyExperience,
} from '@/actions/experienceActions';
import AdminImageUpload from '@/components/admin/content/AdminImageUpload';
import SmartImage from '@/components/SmartImage';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDebouncedValue } from '@/components/admin/ui/useDebouncedValue';
import { useMountedLoad } from '@/components/admin/ui/useMountedLoad';
import {
  AdminCardSkeleton,
  AdminEmptyState,
  AdminErrorState,
  AdminPageHeader,
} from '@/components/admin/ui/States';

interface KbeautyRow {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  location: string;
  description: string | null;
  highlights: string;
  included: string;
  durationHours: number;
  pricePerPerson: number;
  priceCurrency: string;
  mainImage: string | null;
  gallery: string;
  status: string;
  bookingType: string;
  isPartnerExperience: boolean;
  isIncludedInJourney: boolean;
  availableFrom: string | Date | null;
}

type KbeautyForm = {
  title: string;
  subtitle: string;
  slug: string;
  location: string;
  description: string;
  highlights: string;
  included: string;
  gallery: string;
  durationHours: string;
  pricePerPerson: string;
  priceCurrency: string;
  mainImage: string;
  status: string;
  bookingType: string;
  isPartnerExperience: boolean;
  isIncludedInJourney: boolean;
  availableFrom: string;
};

const EMPTY_FORM: KbeautyForm = {
  title: '',
  subtitle: '',
  slug: '',
  location: 'Seul',
  description: '',
  highlights: '',
  included: '',
  gallery: '',
  durationHours: '2',
  pricePerPerson: '',
  priceCurrency: 'BRL',
  mainImage: '',
  status: 'active',
  bookingType: 'request',
  isPartnerExperience: false,
  isIncludedInJourney: false,
  availableFrom: '',
};

const CURRENCIES = ['BRL', 'USD', 'EUR', 'KRW', 'JPY'] as const;

const STATUS_BADGE: Record<string, string> = {
  active: 'border-green-800 bg-green-900/30 text-green-400',
  draft: 'border-yellow-800 bg-yellow-900/30 text-yellow-400',
  inactive: 'border-gray-700 bg-gray-900/30 text-gray-400',
};

const BOOKING_BADGE: Record<string, string> = {
  direct: 'border-blue-800 bg-blue-900/30 text-blue-400',
  request: 'border-purple-800 bg-purple-900/30 text-purple-400',
};

/** Aceita `690`, `690,50`, `1.234,50`. */
function parseDecimal(raw: string): number | null {
  const cleaned = raw.trim();
  if (!cleaned) return null;
  const normalized = /,\d{1,2}$/.test(cleaned)
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned.replace(',', '.');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function slugifyLocal(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ç/g, 'c')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 80);
}

/** Lê `string[]` do JSON salvo; devolve lista vazia em qualquer falha. */
function parseStringList(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value || '[]');
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : [];
  } catch {
    return [];
  }
}

function toLines(items: string[]): string {
  return items.join('\n');
}

/** `Date` (ISO do Prisma) → `YYYY-MM-DD` para o `<input type="date">`. */
function toDateInput(value: string | Date | null): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export default function AdminKbeautyHome() {
  const { t, formatCurrency, formatNumber } = useLanguage();
  const { toast } = useToast();

  const [rows, setRows] = useState<KbeautyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<KbeautyForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const debouncedSearch = useDebouncedValue(search);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getKbeautyExperiences();
    if (res.success) {
      setRows(Array.isArray(res.data) ? (res.data as KbeautyRow[]) : []);
    } else {
      setRows([]);
      setError(res.error ?? t('admin.state.errorTitle'));
    }
    setLoading(false);
  }, [t]);

  useMountedLoad(loadRows);

  const filtered = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter && row.status !== statusFilter) return false;
      if (!query) return true;
      return [row.title, row.subtitle ?? '', row.location, row.slug]
        .some((field) => field.toLowerCase().includes(query));
    });
  }, [rows, debouncedSearch, statusFilter]);

  const activeCount = useMemo(() => rows.filter((row) => row.status === 'active').length, [rows]);

  /** URLs digitadas na galeria (uma por linha) para a prévia do formulário. */
  const galleryDraft = useMemo(
    () => [
      ...new Set(
        formData.gallery
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean),
      ),
    ],
    [formData.gallery],
  );

  const openModal = (row?: KbeautyRow) => {
    setFormErrors({});
    if (row) {
      setEditingId(row.id);
      setFormData({
        title: row.title,
        subtitle: row.subtitle ?? '',
        slug: row.slug,
        location: row.location,
        description: row.description ?? '',
        highlights: toLines(parseStringList(row.highlights)),
        included: toLines(parseStringList(row.included)),
        gallery: toLines(parseStringList(row.gallery)),
        durationHours: String(row.durationHours),
        pricePerPerson: String(row.pricePerPerson),
        priceCurrency: row.priceCurrency || 'BRL',
        mainImage: row.mainImage ?? '',
        status: row.status,
        bookingType: row.bookingType,
        isPartnerExperience: row.isPartnerExperience,
        isIncludedInJourney: row.isIncludedInJourney,
        availableFrom: toDateInput(row.availableFrom),
      });
    } else {
      setEditingId(null);
      setFormData(EMPTY_FORM);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const errors: Record<string, string> = {};
    if (formData.title.trim().length < 3) errors.title = t('admin.exp.name');

    const duration = parseDecimal(formData.durationHours);
    if (duration === null || duration <= 0) errors.durationHours = t('admin.kbeauty.durationInvalid');

    const price = parseDecimal(formData.pricePerPerson);
    if (price === null || price <= 0) errors.pricePerPerson = t('admin.kbeauty.priceInvalid');

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload: Record<string, unknown> = {
      title: formData.title.trim(),
      subtitle: formData.subtitle,
      // Criação sem slug → sugerido a partir do título (nunca `Date.now()`).
      // Edição → o slug salvo vai junto e a action só troca se mudou.
      slug: formData.slug.trim() || (editingId ? '' : slugifyLocal(formData.title)),
      location: formData.location,
      description: formData.description,
      highlights: formData.highlights,
      included: formData.included,
      gallery: formData.gallery,
      durationHours: duration,
      pricePerPerson: price,
      priceCurrency: formData.priceCurrency,
      mainImage: formData.mainImage,
      status: formData.status,
      bookingType: formData.bookingType,
      isPartnerExperience: formData.isPartnerExperience,
      isIncludedInJourney: formData.isIncludedInJourney,
    };
    // `availableFrom` é gravado tanto no create quanto no update.
    payload.availableFrom = formData.availableFrom;


    setIsSubmitting(true);
    const res = editingId
      ? await updateKbeautyExperience(editingId, payload)
      : await createKbeautyExperience(payload);
    setIsSubmitting(false);

    if (res.success) {
      toast(editingId ? t('admin.kbeauty.updated') : t('admin.kbeauty.created'));
      closeModal();
      await loadRows();
    } else {
      toast(res.error ?? t('admin.state.errorTitle'), 'error');
    }
  };

  const handleDelete = async (row: KbeautyRow) => {
    if (!window.confirm(t('admin.kbeauty.deleteConfirm').replace('{title}', row.title))) return;
    setBusy(true);
    const res = await deleteKbeautyExperience(row.id);
    setBusy(false);
    if (res.success) {
      toast(t('admin.kbeauty.deleted'));
      await loadRows();
    } else {
      toast(res.error ?? t('admin.state.errorTitle'), 'error');
    }
  };

  const statusBadgeLabel = useCallback(
    (status: string): string => {
      if (status === 'active') return t('admin.exp.statusActive');
      if (status === 'draft') return t('admin.exp.statusDraft');
      return t('admin.exp.statusInactive');
    },
    [t],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-full flex-col gap-6"
    >
      <AdminPageHeader
        icon={<Sparkles className="w-5 h-5" />}
        title={t('admin.kbeauty.title')}
        subtitle={t('admin.kbeauty.subtitle')}
        actions={
          <>
            <span className="rounded bg-[var(--admin-border)]/50 px-2 py-1 text-xs text-[var(--admin-text-muted)]">
              {t('admin.exp.total').replace('{count}', String(rows.length))}
            </span>
            <Button
              onClick={loadRows}
              variant="outline"
              aria-label={t('admin.common.refresh')}
              className="h-9 border-[var(--admin-border)] px-3 text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              onClick={() => openModal()}
              className="h-9 bg-[var(--admin-primary)] px-4 font-semibold text-black hover:bg-[var(--admin-primary-hover)]"
            >
              <Plus className="w-4 h-4 mr-1" /> {t('admin.kbeauty.newExperience')}
            </Button>
          </>
        }
      />

      <p className="flex items-start gap-2 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-4 text-[11px] leading-relaxed text-[var(--admin-text-muted)]">
        <TriangleAlert className="mt-0.5 w-4 h-4 shrink-0 text-[var(--admin-primary)]" />
        <span>{t('admin.kbeauty.publicHint')}</span>
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('admin.kbeauty.search')}
          aria-label={t('admin.kbeauty.search')}
          className="h-9 max-w-md flex-1 bg-[var(--admin-card)] text-xs text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label={t('admin.exp.status')}
          className="h-9 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 text-xs text-[var(--admin-text-muted)] focus:border-[var(--admin-primary)] focus:outline-none"
        >
          <option value="">{t('admin.book.filterAll')}</option>
          <option value="active">{t('admin.exp.statusActive')}</option>
          <option value="draft">{t('admin.exp.statusDraft')}</option>
          <option value="inactive">{t('admin.exp.statusInactive')}</option>
        </select>
        <span className="self-center text-[10px] text-[var(--admin-text-muted)]">
          {t('admin.navEditor.activeItems').replace('{count}', String(activeCount))}
        </span>
      </div>

      {error ? (
        <AdminErrorState message={error} onRetry={loadRows} />
      ) : loading && rows.length === 0 ? (
        <AdminCardSkeleton count={4} />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)]">
          <AdminEmptyState
            title={t('admin.kbeauty.empty')}
            description={debouncedSearch ? t('admin.state.searchEmptyHint') : undefined}
            icon={<Sparkles className="w-5 h-5" />}
            action={
              <Button
                onClick={() => openModal()}
                className="mt-2 bg-[var(--admin-primary)] font-semibold text-black hover:bg-[var(--admin-primary-hover)]"
              >
                <Plus className="w-4 h-4 mr-1" /> {t('admin.exp.createFirst')}
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((row) => {
            const gallery = parseStringList(row.gallery);
            const cover = row.mainImage || gallery[0] || '';
            return (
              <motion.article
                key={row.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] transition-all hover:border-[var(--admin-primary)]/50"
              >
                <div className="relative h-40 overflow-hidden">
                  {cover ? (
                    <SmartImage
                      src={cover}
                      alt=""
                      fill
                      sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-[var(--admin-border)]/30">
                      <Sparkles className="h-10 w-10 text-[var(--admin-text-muted)] opacity-40" />
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <h3 className="truncate text-sm font-bold text-[var(--admin-text-main)]">
                    {row.title}
                  </h3>
                  {row.subtitle && (
                    <p className="truncate text-[10px] text-[var(--admin-text-muted)]">{row.subtitle}</p>
                  )}
                  <p className="mt-0.5 flex items-center gap-1 text-[10px] text-[var(--admin-text-muted)]">
                    <MapPin className="w-3 h-3" /> {row.location}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${
                        STATUS_BADGE[row.status] ?? STATUS_BADGE.inactive
                      }`}
                    >
                      {statusBadgeLabel(row.status)}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${
                        BOOKING_BADGE[row.bookingType] ?? BOOKING_BADGE.request
                      }`}
                    >
                      {row.bookingType === 'direct'
                        ? t('admin.exp.bookingDirect')
                        : t('admin.exp.bookingRequest')}
                    </span>
                    {row.isPartnerExperience && (
                      <span className="rounded-full border border-[var(--admin-chart-cyan)]/40 bg-[var(--admin-chart-cyan)]/10 px-2 py-0.5 text-[9px] font-bold text-[var(--admin-chart-cyan)]">
                        {t('admin.kbeauty.partner')}
                      </span>
                    )}
                    {row.isIncludedInJourney && (
                      <span className="rounded-full border border-purple-800 bg-purple-900/30 px-2 py-0.5 text-[9px] font-bold text-purple-400">
                        {t('admin.kbeauty.includedInJourney')}
                      </span>
                    )}
                    {gallery.length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[var(--admin-border)] bg-[var(--admin-border)]/30 px-2 py-0.5 text-[9px] font-bold text-[var(--admin-text-muted)]">
                        <Images className="w-2.5 h-2.5" />
                        {t('admin.kbeauty.galleryCount').replace('{count}', String(gallery.length))}
                      </span>
                    )}
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-[var(--admin-border)] pt-3">
                    <span className="flex items-center gap-1 text-[11px] text-[var(--admin-text-muted)]">
                      <Clock className="w-3 h-3" />
                      {t('admin.exp.hours').replace(
                        '{hours}',
                        formatNumber(row.durationHours, { maximumFractionDigits: 1 }),
                      )}
                    </span>
                    <span className="text-xs font-bold text-[var(--admin-accent-green)]">
                      {formatCurrency(row.pricePerPerson, row.priceCurrency)}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => openModal(row)}
                      aria-label={t('admin.kbeauty.editExperience')}
                      title={t('admin.kbeauty.editExperience')}
                      className="rounded-md p-1.5 text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-border)] hover:text-[var(--admin-primary)]"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleDelete(row)}
                      aria-label={t('admin.kbeauty.deleteConfirm').replace('{title}', row.title)}
                      title={t('admin.kbeauty.deleteConfirm').replace('{title}', row.title)}
                      className="rounded-md p-1.5 text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-accent-red)]/10 hover:text-[var(--admin-accent-red)] disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      {/* ── Criar / editar experiência K-Beauty ───────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.button
              type="button"
              aria-label={t('admin.common.close')}
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
              role="dialog"
              aria-modal="true"
              aria-label={
                editingId ? t('admin.kbeauty.editExperience') : t('admin.kbeauty.newExperience')
              }
              className="fixed top-1/2 left-1/2 z-[101] flex max-h-[90vh] w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-bg)] shadow-2xl"
            >
              <header className="flex items-center justify-between gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
                <h3 className="text-lg font-bold text-[var(--admin-text-main)]">
                  {editingId ? t('admin.kbeauty.editExperience') : t('admin.kbeauty.newExperience')}
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
                <form id="kbeautyForm" onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="kb-title"
                        className="text-xs font-semibold text-[var(--admin-text-main)]"
                      >
                        {t('admin.exp.name')} *
                      </label>
                      <Input
                        id="kb-title"
                        required
                        value={formData.title}
                        onChange={(event) => {
                          const title = event.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            title,
                            slug: editingId ? prev.slug : slugifyLocal(title),
                          }));
                        }}
                        aria-invalid={Boolean(formErrors.title)}
                        placeholder={t('admin.exp.namePlaceholder')}
                        className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                      />
                      {formErrors.title && (
                        <span className="text-[10px] text-[var(--admin-accent-red)]">
                          {formErrors.title}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="kb-slug"
                        className="text-xs font-semibold text-[var(--admin-text-main)]"
                      >
                        {t('admin.exp.slug')}
                      </label>
                      <Input
                        id="kb-slug"
                        value={formData.slug}
                        onChange={(event) =>
                          setFormData((prev) => ({ ...prev, slug: event.target.value }))
                        }
                        aria-describedby="kb-slug-hint"
                        className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                      />
                      <span id="kb-slug-hint" className="text-[10px] text-[var(--admin-text-muted)]">
                        {t('admin.exp.slugHint')}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="kb-subtitle"
                        className="text-xs font-semibold text-[var(--admin-text-main)]"
                      >
                        {t('admin.exp.subtitleField')}
                      </label>
                      <Input
                        id="kb-subtitle"
                        value={formData.subtitle}
                        onChange={(event) =>
                          setFormData((prev) => ({ ...prev, subtitle: event.target.value }))
                        }
                        className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="kb-location"
                        className="text-xs font-semibold text-[var(--admin-text-main)]"
                      >
                        {t('admin.exp.location')}
                      </label>
                      <Input
                        id="kb-location"
                        value={formData.location}
                        onChange={(event) =>
                          setFormData((prev) => ({ ...prev, location: event.target.value }))
                        }
                        placeholder={t('admin.kbeauty.locationPlaceholder')}
                        className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="kb-duration"
                        className="text-xs font-semibold text-[var(--admin-text-main)]"
                      >
                        {t('admin.exp.duration')} *
                      </label>
                      <Input
                        id="kb-duration"
                        inputMode="decimal"
                        value={formData.durationHours}
                        onChange={(event) =>
                          setFormData((prev) => ({ ...prev, durationHours: event.target.value }))
                        }
                        aria-invalid={Boolean(formErrors.durationHours)}
                        className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                      />
                      {formErrors.durationHours && (
                        <span className="text-[10px] text-[var(--admin-accent-red)]">
                          {formErrors.durationHours}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="kb-price"
                        className="text-xs font-semibold text-[var(--admin-text-main)]"
                      >
                        {t('admin.exp.price')} *
                      </label>
                      <Input
                        id="kb-price"
                        inputMode="decimal"
                        value={formData.pricePerPerson}
                        onChange={(event) =>
                          setFormData((prev) => ({ ...prev, pricePerPerson: event.target.value }))
                        }
                        aria-invalid={Boolean(formErrors.pricePerPerson)}
                        placeholder="690,00"
                        className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                      />
                      {formErrors.pricePerPerson && (
                        <span className="text-[10px] text-[var(--admin-accent-red)]">
                          {formErrors.pricePerPerson}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="kb-currency"
                        className="text-xs font-semibold text-[var(--admin-text-main)]"
                      >
                        {t('admin.kbeauty.currency')}
                      </label>
                      <select
                        id="kb-currency"
                        value={formData.priceCurrency}
                        onChange={(event) =>
                          setFormData((prev) => ({ ...prev, priceCurrency: event.target.value }))
                        }
                        className="h-10 rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 text-sm text-[var(--admin-text-main)] focus-visible:border-[var(--admin-primary)] focus-visible:outline-none"
                      >
                        {CURRENCIES.map((currency) => (
                          <option key={currency} value={currency}>
                            {currency}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="kb-available"
                        className="text-xs font-semibold text-[var(--admin-text-main)]"
                      >
                        {t('admin.kbeauty.availableFrom')}
                      </label>
                      <Input
                        id="kb-available"
                        type="date"
                        disabled={isSubmitting}
                        value={formData.availableFrom}
                        onChange={(event) =>
                          setFormData((prev) => ({ ...prev, availableFrom: event.target.value }))
                        }
                        className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="kb-status"
                        className="text-xs font-semibold text-[var(--admin-text-main)]"
                      >
                        {t('admin.exp.status')}
                      </label>
                      <select
                        id="kb-status"
                        value={formData.status}
                        onChange={(event) =>
                          setFormData((prev) => ({ ...prev, status: event.target.value }))
                        }
                        className="h-10 rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 text-sm text-[var(--admin-text-main)] focus-visible:border-[var(--admin-primary)] focus-visible:outline-none"
                      >
                        <option value="active">{t('admin.exp.statusActive')}</option>
                        <option value="draft">{t('admin.exp.statusDraft')}</option>
                        <option value="inactive">{t('admin.exp.statusInactive')}</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="kb-booking"
                        className="text-xs font-semibold text-[var(--admin-text-main)]"
                      >
                        {t('admin.exp.bookingType')}
                      </label>
                      <select
                        id="kb-booking"
                        value={formData.bookingType}
                        onChange={(event) =>
                          setFormData((prev) => ({ ...prev, bookingType: event.target.value }))
                        }
                        className="h-10 rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 text-sm text-[var(--admin-text-main)] focus-visible:border-[var(--admin-primary)] focus-visible:outline-none"
                      >
                        <option value="direct">{t('admin.exp.bookingDirect')}</option>
                        <option value="request">{t('admin.exp.bookingRequest')}</option>
                      </select>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-[var(--admin-text-main)]">
                    <input
                      type="checkbox"
                      checked={formData.isPartnerExperience}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, isPartnerExperience: event.target.checked }))
                      }
                      className="h-4 w-4 accent-[var(--admin-primary)]"
                    />
                    {t('admin.kbeauty.partner')}
                  </label>

                  <label className="flex items-center gap-2 text-xs text-[var(--admin-text-main)]">
                    <input
                      type="checkbox"
                      checked={formData.isIncludedInJourney}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, isIncludedInJourney: event.target.checked }))
                      }
                      className="h-4 w-4 accent-[var(--admin-primary)]"
                    />
                    {t('admin.kbeauty.includedInJourney')}
                  </label>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="kb-description"
                      className="text-xs font-semibold text-[var(--admin-text-main)]"
                    >
                      {t('admin.exp.description')}
                    </label>
                    <textarea
                      id="kb-description"
                      value={formData.description}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, description: event.target.value }))
                      }
                      className="flex min-h-[90px] w-full resize-none rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm text-[var(--admin-text-main)] focus-visible:border-[var(--admin-primary)] focus-visible:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="kb-included"
                        className="text-xs font-semibold text-[var(--admin-text-main)]"
                      >
                        {t('admin.kbeauty.included')}
                      </label>
                      <textarea
                        id="kb-included"
                        rows={5}
                        value={formData.included}
                        onChange={(event) =>
                          setFormData((prev) => ({ ...prev, included: event.target.value }))
                        }
                        aria-describedby="kb-included-hint"
                        className="flex w-full resize-y rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm text-[var(--admin-text-main)] focus-visible:border-[var(--admin-primary)] focus-visible:outline-none"
                      />
                      <span id="kb-included-hint" className="text-[10px] text-[var(--admin-text-muted)]">
                        {t('admin.kbeauty.includedHint')}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="kb-highlights"
                        className="text-xs font-semibold text-[var(--admin-text-main)]"
                      >
                        {t('admin.kbeauty.highlights')}
                      </label>
                      <textarea
                        id="kb-highlights"
                        rows={5}
                        value={formData.highlights}
                        onChange={(event) =>
                          setFormData((prev) => ({ ...prev, highlights: event.target.value }))
                        }
                        aria-describedby="kb-highlights-hint"
                        className="flex w-full resize-y rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm text-[var(--admin-text-main)] focus-visible:border-[var(--admin-primary)] focus-visible:outline-none"
                      />
                      <span id="kb-highlights-hint" className="text-[10px] text-[var(--admin-text-muted)]">
                        {t('admin.kbeauty.highlightsHint')}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="kb-gallery"
                      className="text-xs font-semibold text-[var(--admin-text-main)]"
                    >
                      {t('admin.kbeauty.gallery')}
                    </label>
                    <textarea
                      id="kb-gallery"
                      rows={4}
                      value={formData.gallery}
                      onChange={(event) => setFormData((prev) => ({ ...prev, gallery: event.target.value }))}
                      aria-describedby="kb-gallery-hint"
                      className="flex w-full resize-y rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm text-[var(--admin-text-main)] focus-visible:border-[var(--admin-primary)] focus-visible:outline-none"
                    />
                    <span id="kb-gallery-hint" className="text-[10px] text-[var(--admin-text-muted)]">
                      {t('admin.kbeauty.galleryHint')}
                    </span>
                    {galleryDraft.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {galleryDraft.map((line) => (
                          <span
                            key={line}
                            className="relative h-14 w-20 overflow-hidden rounded-lg border border-[var(--admin-border)]"
                          >
                            <SmartImage src={line} alt="" fill sizes="80px" className="object-cover" />
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <AdminImageUpload
                    currentUrl={formData.mainImage}
                    onUrlChange={(url) => setFormData((prev) => ({ ...prev, mainImage: url }))}
                    folder="kbeauty"
                    label={t('admin.exp.mainImage')}
                  />

                  <p className="flex items-start gap-2 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-3 text-[10px] leading-relaxed text-[var(--admin-text-muted)]">
                    <Compass className="mt-0.5 w-3.5 h-3.5 shrink-0 text-[var(--admin-primary)]" />
                    {t('admin.kbeauty.unusedFieldsHint')}
                  </p>
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
                  form="kbeautyForm"
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[var(--admin-primary)] font-semibold text-black hover:bg-[var(--admin-primary-hover)]"
                >
                  {isSubmitting
                    ? t('admin.state.loading')
                    : editingId
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