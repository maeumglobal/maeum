'use client';

/**
 * Experiências.
 *
 * ## Alinhamento com a action (era o bug que impedia editar)
 *
* `updateExperience` grava as categorias na tabela `ExperienceCategory` e lê o
 * campo do payload como **`categoryIds`** (array de ids). O formulário anterior
 * mandava esse campo, mas a action antiga tentava escrevê-lo no model
 * `Experience` — PrismaValidationError em toda edição.
 *
 * Confirmado no código: `normalizeCategoryIds(f.categoryIds)` e
 * `experienceCategory.createMany(...)`. O formulário envia `categoryIds: string[]`
 * e o `pick()` da action converte para o formato aceito.
 *
 * ## Outros bugs corrigidos
 *
 * - `subtitle` estava no estado mas NÃO no formulário: nunca era salvo.
 * - O slug era regenerado a CADA tecla do título e, pior, ganhava `-<Date.now()>`
 *   no submit — cada edição quebrava a URL pública `/experiencias/<slug>`.
 *   Agora o slug é sugerido só na criação e nunca é forçado quando vazio, o que
 *   deixa a action preservar o slug salvo.
 * - `durationHours`/`pricePerPerson` sem validação: `Number('')` virava 0 e a
 *   action aceitava silenciosamente.
 * - Debounce na busca + paginação de verdade.
 */
import { useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Compass, Edit3, MapPin, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  createExperience,
  deleteExperience,
  getCategories,
  getExperiences,
  updateExperience,
} from '@/actions/experienceActions';
import SmartImage from '@/components/SmartImage';
import AdminPagination from '@/components/admin/ui/Pagination';
import { useDebouncedValue } from '@/components/admin/ui/useDebouncedValue';
import { useMountedLoad } from '@/components/admin/ui/useMountedLoad';
import {
  AdminCardSkeleton,
  AdminEmptyState,
  AdminErrorState,
  AdminPageHeader,
} from '@/components/admin/ui/States';

interface ExperienceCategoryLink {
  categoryId: string;
  category?: { id: string; slug: string; name: string };
}

interface ExperienceRow {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  location: string;
  description: string | null;
  durationHours: number;
  pricePerPerson: number;
  mainImage: string | null;
  status: string;
  bookingType: string;
  categories?: ExperienceCategoryLink[];
}

interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  destination: string;
  isActive: boolean;
}

interface ExperienceForm {
  title: string;
  subtitle: string;
  slug: string;
  location: string;
  description: string;
  durationHours: string;
  pricePerPerson: string;
  mainImage: string;
  bookingType: string;
  status: string;
  categoryIds: string[];
}

const EMPTY_FORM: ExperienceForm = {
  title: '',
  subtitle: '',
  slug: '',
  location: 'Seul',
  description: '',
  durationHours: '2',
  pricePerPerson: '',
  mainImage: '',
  bookingType: 'direct',
  status: 'active',
  categoryIds: [],
};

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

export default function AdminExperiencesHome() {
  const { t, formatCurrency } = useLanguage();
  const { toast } = useToast();

  const [experiences, setExperiences] = useState<ExperienceRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExperienceRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ExperienceForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const debouncedSearch = useDebouncedValue(search);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [expRes, catRes] = await Promise.all([
      getExperiences({ page, pageSize, search: debouncedSearch, status: statusFilter || undefined }),
      getCategories(),
    ]);

    if (expRes.success) {
      setExperiences((expRes.items ?? []) as unknown as ExperienceRow[]);
      setTotal(expRes.total ?? 0);
      setTotalPages(expRes.totalPages ?? 1);
    } else {
      setExperiences([]);
      setTotal(0);
      setTotalPages(1);
      setError(expRes.error ?? t('state.errorTitle'));
    }

    if (catRes.success && catRes.data) setCategories(catRes.data as CategoryRow[]);
    setLoading(false);
  }, [page, pageSize, debouncedSearch, statusFilter, t]);

  useMountedLoad(loadData);

  const openModal = (item?: ExperienceRow) => {
    setFormErrors({});
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        subtitle: item.subtitle ?? '',
        // Slug preenchido mas NÃO forçado: a action só regenera se o valor
        // enviado for diferente do salvo (e usa `uniqueSlug`).
        slug: item.slug,
        location: item.location,
        description: item.description ?? '',
        durationHours: String(item.durationHours),
        pricePerPerson: String(item.pricePerPerson),
        mainImage: item.mainImage ?? '',
        bookingType: item.bookingType,
        status: item.status,
        categoryIds: (item.categories ?? []).map((link) => link.categoryId),
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

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('admin.exp.deleteConfirm'))) return;
    const res = await deleteExperience(id);
    if (res.success) {
      toast(t('admin.exp.deleted'));
      await loadData();
    } else {
      toast(res.error ?? t('state.errorTitle'), 'error');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) errors.title = t('state.errorTitle');

    const duration = parseDecimal(formData.durationHours);
    if (duration === null || duration <= 0) errors.durationHours = t('admin.exp.durationInvalid');

    const price = parseDecimal(formData.pricePerPerson);
    if (price === null || price <= 0) errors.pricePerPerson = t('admin.exp.priceInvalid');

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    // Na criação, se o admin não digitar slug, sugerimos a partir do título —
    // SEM `Date.now()`. Na edição, slug vazio = preservar o que está no banco.
    const slug = formData.slug.trim() || (editingItem ? '' : slugifyLocal(formData.title));

    setIsSubmitting(true);
    const payload = {
      title: formData.title,
      subtitle: formData.subtitle,
      slug,
      location: formData.location,
      description: formData.description,
      durationHours: duration as number,
      pricePerPerson: price as number,
      mainImage: formData.mainImage,
      bookingType: formData.bookingType,
      status: formData.status,
      categoryIds: formData.categoryIds,
    };

    const res = editingItem ? await updateExperience(editingItem.id, payload) : await createExperience(payload);
    setIsSubmitting(false);

    if (res.success) {
      toast(editingItem ? t('admin.exp.updated') : t('admin.exp.created'));
      closeModal();
      await loadData();
    } else {
      toast(res.error ?? t('state.errorTitle'), 'error');
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

  const activeCategories = useMemo(() => categories.filter((category) => category.isActive), [categories]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-full flex-col gap-6"
    >
      <AdminPageHeader
        icon={<Compass className="w-5 h-5" />}
        title={t('admin.exp.title')}
        subtitle={t('admin.exp.subtitle')}
        actions={
          <>
            <span className="rounded bg-[var(--admin-border)]/50 px-2 py-1 text-xs text-[var(--admin-text-muted)]">
              {t('admin.exp.total').replace('{count}', String(total))}
            </span>
            <Button
              onClick={loadData}
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
              <Plus className="w-4 h-4 mr-1" /> {t('admin.exp.newExperience')}
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder={t('admin.exp.search')}
          aria-label={t('admin.exp.search')}
          className="h-9 max-w-md flex-1 bg-[var(--admin-card)] text-xs text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          aria-label={t('admin.exp.status')}
          className="h-9 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 text-xs text-[var(--admin-text-muted)] focus:border-[var(--admin-primary)] focus:outline-none"
        >
          <option value="">{t('admin.book.filterAll')}</option>
          <option value="active">{t('admin.exp.statusActive')}</option>
          <option value="draft">{t('admin.exp.statusDraft')}</option>
          <option value="inactive">{t('admin.exp.statusInactive')}</option>
        </select>
      </div>

      {error ? (
        <AdminErrorState message={error} onRetry={loadData} />
      ) : loading && experiences.length === 0 ? (
        <AdminCardSkeleton count={6} />
      ) : experiences.length === 0 ? (
        <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)]">
          <AdminEmptyState
            title={t('admin.exp.empty')}
            description={debouncedSearch ? t('state.searchEmptyHint') : undefined}
            icon={<Compass className="w-5 h-5" />}
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
          {experiences.map((experience) => (
            <motion.article
              key={experience.id}
              layout
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] transition-all hover:border-[var(--admin-primary)]/50"
            >
              <div className="relative h-40 overflow-hidden">
                {experience.mainImage ? (
                  <SmartImage
                    src={experience.mainImage}
                    alt=""
                    fill
                    sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-[var(--admin-border)]/30">
                    <Compass className="h-10 w-10 text-[var(--admin-text-muted)] opacity-40" />
                  </span>
                )}
              </div>

              <div className="p-4">
                <div className="mb-2">
                  <h3 className="truncate text-sm font-bold text-[var(--admin-text-main)]">
                    {experience.title}
                  </h3>
                  {experience.subtitle && (
                    <p className="truncate text-[10px] text-[var(--admin-text-muted)]">
                      {experience.subtitle}
                    </p>
                  )}
                  <p className="mt-0.5 flex items-center gap-1 text-[10px] text-[var(--admin-text-muted)]">
                    <MapPin className="w-3 h-3" /> {experience.location}
                  </p>
                </div>

                <div className="mb-3 flex flex-wrap gap-1.5">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${
                      STATUS_BADGE[experience.status] ?? STATUS_BADGE.inactive
                    }`}
                  >
                    {statusBadgeLabel(experience.status)}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${
                      BOOKING_BADGE[experience.bookingType] ?? BOOKING_BADGE.request
                    }`}
                  >
                    {experience.bookingType === 'direct'
                      ? t('admin.exp.bookingDirect')
                      : t('admin.exp.bookingRequest')}
                  </span>
                  {(experience.categories?.length ?? 0) > 0 && (
                    <span
                      className="rounded-full border border-[var(--admin-chart-cyan)]/40 bg-[var(--admin-chart-cyan)]/10 px-2 py-0.5 text-[9px] font-bold text-[var(--admin-chart-cyan)]"
                      title={experience.categories?.map((link) => link.category?.name).join(', ')}
                    >
                      {experience.categories?.length}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 text-[11px] text-[var(--admin-text-muted)]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {t('admin.exp.hours').replace('{hours}', String(experience.durationHours))}
                    </span>
                    <span className="font-bold text-[var(--admin-accent-green)]">
                      {formatCurrency(experience.pricePerPerson)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <button
                      type="button"
                      onClick={() => openModal(experience)}
                      aria-label={t('admin.exp.editExperience')}
                      className="rounded-md p-1.5 text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-border)] hover:text-[var(--admin-primary)]"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(experience.id)}
                      aria-label={t('admin.exp.deleteConfirm')}
                      className="rounded-md p-1.5 text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-accent-red)]/10 hover:text-[var(--admin-accent-red)]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
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
                  {editingItem ? t('admin.exp.editExperience') : t('admin.exp.newExperience')}
                </h3>
                <button
                  type="button"
                  onClick={closeModal}
                  aria-label={t('admin.common.cancel')}
                  className="text-[var(--admin-text-muted)] transition-colors hover:text-[var(--admin-text-main)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-6">
                <form id="expForm" onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="exp-title" className="text-xs font-semibold text-[var(--admin-text-main)]">
                      {t('admin.exp.name')} *
                    </label>
                    <Input
                      id="exp-title"
                      required
                      value={formData.title}
                      onChange={(e) => {
                        const title = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          title,
                          // Sugestão de slug só na criação — nunca a cada tecla
                          // de um item já salvo (quebrava a URL pública).
                          slug: editingItem ? prev.slug : slugifyLocal(title),
                        }));
                      }}
                      className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                      placeholder={t('admin.exp.namePlaceholder')}
                    />
                    {formErrors.title && (
                      <span className="text-[10px] text-[var(--admin-accent-red)]">{formErrors.title}</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="exp-subtitle" className="text-xs font-semibold text-[var(--admin-text-main)]">
                      {t('admin.exp.subtitleField')}
                    </label>
                    <Input
                      id="exp-subtitle"
                      value={formData.subtitle}
                      onChange={(e) => setFormData((prev) => ({ ...prev, subtitle: e.target.value }))}
                      className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="exp-slug" className="text-xs font-semibold text-[var(--admin-text-main)]">
                      {t('admin.exp.slug')}
                    </label>
                    <Input
                      id="exp-slug"
                      value={formData.slug}
                      onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                      className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                    />
                    <span className="text-[10px] text-[var(--admin-text-muted)]">{t('admin.exp.slugHint')}</span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="exp-location" className="text-xs font-semibold text-[var(--admin-text-main)]">
                        {t('admin.exp.location')}
                      </label>
                      <Input
                        id="exp-location"
                        value={formData.location}
                        onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                        className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="exp-duration" className="text-xs font-semibold text-[var(--admin-text-main)]">
                        {t('admin.exp.duration')} *
                      </label>
                      <Input
                        id="exp-duration"
                        inputMode="decimal"
                        value={formData.durationHours}
                        onChange={(e) => setFormData((prev) => ({ ...prev, durationHours: e.target.value }))}
                        aria-invalid={Boolean(formErrors.durationHours)}
                        className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                      />
                      {formErrors.durationHours && (
                        <span className="text-[10px] text-[var(--admin-accent-red)]">
                          {formErrors.durationHours}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="exp-price" className="text-xs font-semibold text-[var(--admin-text-main)]">
                        {t('admin.exp.price')} *
                      </label>
                      <Input
                        id="exp-price"
                        inputMode="decimal"
                        value={formData.pricePerPerson}
                        onChange={(e) => setFormData((prev) => ({ ...prev, pricePerPerson: e.target.value }))}
                        aria-invalid={Boolean(formErrors.pricePerPerson)}
                        className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                        placeholder="690,00"
                      />
                      {formErrors.pricePerPerson && (
                        <span className="text-[10px] text-[var(--admin-accent-red)]">
                          {formErrors.pricePerPerson}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="exp-booking" className="text-xs font-semibold text-[var(--admin-text-main)]">
                        {t('admin.exp.bookingType')}
                      </label>
                      <select
                        id="exp-booking"
                        value={formData.bookingType}
                        onChange={(e) => setFormData((prev) => ({ ...prev, bookingType: e.target.value }))}
                        className="h-10 rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 text-sm text-[var(--admin-text-main)] focus:border-[var(--admin-primary)] focus:outline-none"
                      >
                        <option value="direct">{t('admin.exp.bookingDirect')}</option>
                        <option value="request">{t('admin.exp.bookingRequest')}</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="exp-image" className="text-xs font-semibold text-[var(--admin-text-main)]">
                      {t('admin.exp.mainImage')}
                    </label>
                    <Input
                      id="exp-image"
                      value={formData.mainImage}
                      onChange={(e) => setFormData((prev) => ({ ...prev, mainImage: e.target.value }))}
                      className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                      placeholder="/api/media/… ou https://…"
                    />
                    {formData.mainImage && (
                      <div className="relative mt-1 h-32 w-full overflow-hidden rounded-lg border border-[var(--admin-border)]">
                        <SmartImage
                          src={formData.mainImage}
                          alt=""
                          fill
                          sizes="560px"
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="exp-description" className="text-xs font-semibold text-[var(--admin-text-main)]">
                      {t('admin.exp.description')}
                    </label>
                    <textarea
                      id="exp-description"
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      className="flex min-h-[80px] w-full resize-none rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm text-[var(--admin-text-main)] focus-visible:border-[var(--admin-primary)] focus-visible:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="exp-status" className="text-xs font-semibold text-[var(--admin-text-main)]">
                      {t('admin.exp.status')}
                    </label>
                    <select
                      id="exp-status"
                      value={formData.status}
                      onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                      className="h-10 rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 text-sm text-[var(--admin-text-main)] focus:border-[var(--admin-primary)] focus:outline-none"
                    >
                      <option value="active">{t('admin.exp.statusActive')}</option>
                      <option value="draft">{t('admin.exp.statusDraft')}</option>
                      <option value="inactive">{t('admin.exp.statusInactive')}</option>
                    </select>
                  </div>

                  {activeCategories.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-semibold text-[var(--admin-text-main)]">
                        {t('admin.exp.categories')}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {activeCategories.map((category) => {
                          const selected = formData.categoryIds.includes(category.id);
                          return (
                            <button
                              key={category.id}
                              type="button"
                              aria-pressed={selected}
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  categoryIds: selected
                                    ? prev.categoryIds.filter((id) => id !== category.id)
                                    : [...prev.categoryIds, category.id],
                                }))
                              }
                              className={`rounded border px-2 py-1 text-[10px] transition-all ${
                                selected
                                  ? 'border-[var(--admin-primary)] bg-[var(--admin-primary)] font-bold text-black'
                                  : 'border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:border-[var(--admin-primary)]'
                              }`}
                            >
                              {category.name}
                            </button>
                          );
                        })}
                      </div>
                      <span className="text-[10px] text-[var(--admin-text-muted)]">
                        {t('admin.exp.categoriesHint')}
                      </span>
                    </div>
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
                  form="expForm"
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
