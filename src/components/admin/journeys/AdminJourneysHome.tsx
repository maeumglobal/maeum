'use client';

/**
 * Jornadas + datas de saída.
 *
 * ## Bugs corrigidos
 *
 * 1. **`selectedJourney` ficava obsoleto.** Era guardado como OBJETO em estado;
 *    depois de `loadJourneys()` o modal continuava mostrando a versão antiga —
 *    `departures.length` da tabela vinha de `j.departures` (atual) enquanto o
 *    modal usava o objeto antigo (pre data da criação). Agora só o **id** é
 *    guardado e o objeto é DERIVADO de `journeys.find(...)` a cada render, então
 *    nunca dessincroniza.
 * 2. **`Number('')` virava 0** em `durationDays`/`totalSpots`/`availableSpots`
 *    (`AdminJourneysHome.tsx:87-88`): uma parcela deixada em branco gravava 0
 *    vagas. Agora há validação explícita (`>= 1`) e `availableSpots <= totalSpots`.
 * 3. **Slug com `Date.now()` a cada edição** — quebrava a URL pública
 *    `/jornadas/<slug>`. Confirmado na action: `updateJourney` preserva o slug
 *    salvo; o formulário só envia quando o campo foi realmente alterado.
* 4. As datas de saída só apareciam dentro do modal. Agora aparecem também na
 *    tabela (próxima saída + total), sem abrir nada.
 *
 * + `getJourneyDepartures`/`updateJourneyDeparture` ligados: antes a tela só
 *   CRIAVA e EXCLUÍDAS saídas — não dava para corrigir datas, vagas nem status
 *   depois do lançamento. A edição mantém o `status` coerente com o CHECK do
 *   banco (`sold_out` só com `availableSpots = 0`, `aplicar.sql`), senão o
 *   `UPDATE` volta com violação de constraint.
 */
import { useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays,
  Edit3,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  createJourney,
  createJourneyDeparture,
  deleteJourney,
  deleteJourneyDeparture,
  getJourneyDepartures,
  getJourneys,
  updateJourney,
  updateJourneyDeparture,
} from '@/actions/journeyActions';

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

interface DepartureRow {
  id: string;
  startDate: string;
  endDate: string;
  totalSpots: number;
  availableSpots: number;
  status: string;
  notes: string | null;
  priceAdjustment: number;
}


interface JourneyRow {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  concept: string | null;
  durationDays: number;
  totalSpots: number;
  pricePerPerson: number;
  mainImage: string | null;
  status: string;
  category: string;
  departures?: DepartureRow[];
}

interface JourneyForm {
  title: string;
  subtitle: string;
  slug: string;
  concept: string;
  durationDays: string;
  totalSpots: string;
  pricePerPerson: string;
  mainImage: string;
  status: string;
  category: string;
}

const EMPTY_FORM: JourneyForm = {
  title: '',
  subtitle: '',
  slug: '',
  concept: '',
  durationDays: '10',
  totalSpots: '15',
  pricePerPerson: '',
  mainImage: '',
  status: 'active',
  category: 'premium',
};

interface DepartureForm {
  startDate: string;
  endDate: string;
  totalSpots: string;
  availableSpots: string;
  notes: string;
}

const EMPTY_DEPARTURE: DepartureForm = {
  startDate: '',
  endDate: '',
  totalSpots: '15',
  availableSpots: '15',
  notes: '',
};

/** Formulário de EDIÇÃO de uma saída (reusa as mesmas colunas do banco). */
interface DepartureEditForm {
  startDate: string;
  endDate: string;
  totalSpots: string;
  availableSpots: string;
  status: string;
  notes: string;
  priceAdjustment: string;
}

const EMPTY_DEPARTURE_EDIT: DepartureEditForm = {
  startDate: '',
  endDate: '',
  totalSpots: '15',
  availableSpots: '15',
  status: 'available',
  notes: '',
  priceAdjustment: '0',
};

/** `YYYY-MM-DD` para `<input type="date">`; '' quando não há data utilizável. */
function toDateInput(value: string): string {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return '';
  return new Date(time).toISOString().slice(0, 10);
}


const CATEGORY_BADGE: Record<string, string> = {
  premium: 'border-[var(--admin-primary)]/30 bg-[var(--admin-primary)]/20 text-[var(--admin-primary)]',
  army: 'border-purple-800 bg-purple-900/30 text-purple-400',
  essence: 'border-cyan-800 bg-cyan-900/30 text-cyan-400',
  luxury: 'border-yellow-800 bg-yellow-900/30 text-yellow-400',
};

const DEPARTURE_BADGE: Record<string, string> = {
  available: 'border-green-800 bg-green-900/30 text-green-400',
  limited: 'border-yellow-800 bg-yellow-900/30 text-yellow-400',
  sold_out: 'border-gray-700 bg-gray-900/30 text-gray-400',
  cancelled: 'border-red-800 bg-red-900/30 text-red-400',
};

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

function parseIntStrict(raw: string): number | null {
  const value = Number(raw.trim());
  if (!Number.isFinite(value)) return null;
  return Math.trunc(value);
}

function parseDecimal(raw: string): number | null {
  const cleaned = raw.trim();
  if (!cleaned) return null;
  const normalized = /,\d{1,2}$/.test(cleaned)
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned.replace(',', '.');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

export default function AdminJourneysHome() {
  const { t, formatCurrency, formatDate, formatNumber } = useLanguage();
  const { toast } = useToast();

  const [journeys, setJourneys] = useState<JourneyRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<JourneyRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<JourneyForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

// Só o ID é guardado — o objeto é derivado abaixo (nunca dessincroniza).
  const [departuresForId, setDeparturesForId] = useState<string | null>(null);
  const [departureForm, setDepartureForm] = useState<DepartureForm>(EMPTY_DEPARTURE);
  const [departureErrors, setDepartureErrors] = useState<Record<string, string>>({});

  // Saídas recarregadas por `getJourneyDepartures` (fonte da verdade do modal).
  const [departures, setDepartures] = useState<DepartureRow[]>([]);
  const [departuresLoading, setDeparturesLoading] = useState(false);
  const [departuresError, setDeparturesError] = useState<string | null>(null);
  const [editingDepartureId, setEditingDepartureId] = useState<string | null>(null);
  const [departureEdit, setDepartureEdit] = useState<DepartureEditForm>(EMPTY_DEPARTURE_EDIT);
  const [departureEditErrors, setDepartureEditErrors] = useState<Record<string, string>>({});


  const debouncedSearch = useDebouncedValue(search);

  const loadJourneys = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getJourneys({
      page,
      pageSize,
      search: debouncedSearch,
      category: categoryFilter || undefined,
    });
    if (res.success) {
      setJourneys((res.items ?? []) as unknown as JourneyRow[]);
      setTotal(res.total ?? 0);
      setTotalPages(res.totalPages ?? 1);
    } else {
      setJourneys([]);
      setTotal(0);
      setTotalPages(1);
      setError(res.error ?? t('state.errorTitle'));
    }
    setLoading(false);
  }, [page, pageSize, debouncedSearch, categoryFilter, t]);

  useMountedLoad(loadJourneys);

  /** Derivado: se a jornada sumiu da página atual, o modal fecha sozinho. */
  const selectedJourney = useMemo(
    () => journeys.find((journey) => journey.id === departuresForId) ?? null,
    [journeys, departuresForId],
  );

  const openModal = (item?: JourneyRow) => {
    setFormErrors({});
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        subtitle: item.subtitle ?? '',
        slug: item.slug,
        concept: item.concept ?? '',
        durationDays: String(item.durationDays),
        totalSpots: String(item.totalSpots),
        pricePerPerson: String(item.pricePerPerson),
        mainImage: item.mainImage ?? '',
        status: item.status,
        category: item.category,
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
    if (!window.confirm(t('admin.jrn.deleteConfirm'))) return;
    const res = await deleteJourney(id);
    if (res.success) {
      toast(t('admin.jrn.deleted'));
      if (departuresForId === id) setDeparturesForId(null);
      await loadJourneys();
    } else {
      toast(res.error ?? t('state.errorTitle'), 'error');
    }
  };

  /**
   * Recarrega as saídas da jornada aberta. `getJourneyDepartures` é a fonte da
   * verdade do modal: `getJourneys` embute no máximo 20 saídas e o modal não
   * pode mostrar uma lista truncada como se fosse completa.
   */
  const loadDepartures = useCallback(
    async (journeyId: string) => {
      setDeparturesLoading(true);
      setDeparturesError(null);
      try {
        const res = await getJourneyDepartures(journeyId);
        if (res.success) {
          setDepartures((res.data ?? []) as unknown as DepartureRow[]);
        } else {
          setDepartures([]);
          setDeparturesError(res.error ?? t('state.errorTitle'));
        }
      } catch {
        setDepartures([]);
        setDeparturesError(t('state.errorTitle'));
      } finally {
        setDeparturesLoading(false);
      }
    },
    [t],
  );

  const openDepartures = useCallback(
    (journeyId: string) => {
      setDeparturesForId(journeyId);
      setDepartureErrors({});
      setEditingDepartureId(null);
      setDepartureEditErrors({});
      void loadDepartures(journeyId);
    },
    [loadDepartures],
  );

  const closeDepartures = useCallback(() => {
    setDeparturesForId(null);
    setEditingDepartureId(null);
    setDepartureEditErrors({});
  }, []);


  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) errors.title = t('state.errorTitle');

    const duration = parseIntStrict(formData.durationDays);
    if (duration === null || duration < 1 || duration > 365) errors.durationDays = t('admin.jrn.durationInvalid');

    const spots = parseIntStrict(formData.totalSpots);
    if (spots === null || spots < 1) errors.totalSpots = t('admin.jrn.spotsInvalid');

    const price = parseDecimal(formData.pricePerPerson);
    if (price === null || price <= 0) errors.pricePerPerson = t('admin.jrn.priceInvalid');

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    // Slug: só entra no payload quando o admin mudou de fato. Sem isso, a
    // action receberia o slug salvo, o `uniqueSlug` não dispararia e nada
    // quebraria; e sem `Date.now()` a URL pública nunca muda sozinha.
    const slugChanged =
      formData.slug.trim().length > 0 && formData.slug.trim() !== (editingItem?.slug ?? '');

    setIsSubmitting(true);
    const payload = {
      title: formData.title,
      subtitle: formData.subtitle,
      slug: slugChanged ? formData.slug.trim() : editingItem ? formData.slug.trim() : slugifyLocal(formData.title),
      concept: formData.concept,
      durationDays: duration as number,
      totalSpots: spots as number,
      pricePerPerson: price as number,
      mainImage: formData.mainImage,
      status: formData.status,
      category: formData.category,
    };

    const res = editingItem ? await updateJourney(editingItem.id, payload) : await createJourney(payload);
    setIsSubmitting(false);

    if (res.success) {
      toast(editingItem ? t('admin.jrn.updated') : t('admin.jrn.created'));
      closeModal();
      await loadJourneys();
    } else {
      toast(res.error ?? t('state.errorTitle'), 'error');
    }
  };

  const handleAddDeparture = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedJourney) return;

    const errors: Record<string, string> = {};
    if (!departureForm.startDate) errors.startDate = t('admin.jrn.startDate');
    if (!departureForm.endDate) errors.endDate = t('admin.jrn.endDate');
    if (departureForm.startDate && departureForm.endDate && departureForm.endDate <= departureForm.startDate) {
      errors.endDate = t('admin.jrn.startDate');
    }

    const totalSpots = parseIntStrict(departureForm.totalSpots);
    if (totalSpots === null || totalSpots < 1) errors.totalSpots = t('admin.jrn.spotsInvalid');

    const availableSpots = parseIntStrict(departureForm.availableSpots);
    if (availableSpots === null || availableSpots < 0) errors.availableSpots = t('admin.jrn.spotsInvalid');
    else if (totalSpots !== null && availableSpots > totalSpots) errors.availableSpots = t('admin.jrn.spotsRangeInvalid');

    setDepartureErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    const res = await createJourneyDeparture({
      journeyId: selectedJourney.id,
      startDate: departureForm.startDate,
      endDate: departureForm.endDate,
      totalSpots,
      availableSpots,
      notes: departureForm.notes,
    });
    setIsSubmitting(false);

    if (res.success) {
      toast(t('admin.jrn.departureAdded'));
      setDepartureForm(EMPTY_DEPARTURE);
      setDepartureErrors({});
      await loadJourneys();
      await loadDepartures(selectedJourney.id);
    } else {
      toast(res.error ?? t('state.errorTitle'), 'error');
    }
  };

  const handleDeleteDeparture = async (id: string) => {
    if (!window.confirm(t('admin.tf.deleteConfirm'))) return;
    const res = await deleteJourneyDeparture(id);
    if (res.success) {
      toast(t('admin.jrn.departureRemoved'));
      if (editingDepartureId === id) setEditingDepartureId(null);
      await loadJourneys();
      if (selectedJourney) await loadDepartures(selectedJourney.id);
    } else {
      toast(res.error ?? t('state.errorTitle'), 'error');
    }
  };

  const startEditDeparture = (departure: DepartureRow) => {
    setDepartureEditErrors({});
    setDepartureEdit({
      startDate: toDateInput(departure.startDate),
      endDate: toDateInput(departure.endDate),
      totalSpots: String(departure.totalSpots),
      availableSpots: String(departure.availableSpots),
      status: departure.status,
      notes: departure.notes ?? '',
      priceAdjustment: String(departure.priceAdjustment ?? 0),
    });
    setEditingDepartureId(departure.id);
  };

  /**
   * Coerência com o CHECK do banco (`JourneyDeparture_soldout_chk` /
   * `JourneyDeparture_spots_chk` em `aplicar.sql`). O ajuste acontece no
   * `onChange` (evento), nunca em efeito: reabrir vagas tira o `sold_out`;
   * zerar as vagas marca `sold_out` sozinho.
   */
  const changeEditSpots = (field: 'totalSpots' | 'availableSpots', value: string) => {
    setDepartureEdit((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'availableSpots') {
        const spots = parseIntStrict(value);
        if (prev.status === 'sold_out' && spots !== null && spots > 0) next.status = 'available';
        if (spots === 0 && prev.status !== 'cancelled') next.status = 'sold_out';
      }
      if (field === 'totalSpots') {
        const total = parseIntStrict(value);
        const available = parseIntStrict(prev.availableSpots);
        if (total !== null && available !== null && available > total) next.availableSpots = String(total);
      }
      return next;
    });
  };

  const handleUpdateDeparture = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedJourney || !editingDepartureId || isSubmitting) return;

    const errors: Record<string, string> = {};
    if (!departureEdit.startDate) errors.startDate = t('admin.jrn.startDate');
    if (!departureEdit.endDate) errors.endDate = t('admin.jrn.endDate');
    if (
      departureEdit.startDate &&
      departureEdit.endDate &&
      departureEdit.endDate < departureEdit.startDate
    ) {
      errors.endDate = t('admin.jrn.datesInvalid');
    }

    const totalSpots = parseIntStrict(departureEdit.totalSpots);
    if (totalSpots === null || totalSpots < 1) errors.totalSpots = t('admin.jrn.spotsInvalid');

    const availableSpots = parseIntStrict(departureEdit.availableSpots);
    if (availableSpots === null || availableSpots < 0) errors.availableSpots = t('admin.jrn.spotsInvalid');
    else if (totalSpots !== null && availableSpots > totalSpots) {
      errors.availableSpots = t('admin.jrn.spotsRangeInvalid');
    }

    // CHECK: `sold_out` só existe com `availableSpots = 0`.
    if (departureEdit.status === 'sold_out' && availableSpots !== 0) {
      errors.status = t('admin.jrn.soldOutNeedsZero');
    }
    const priceAdjustment = parseDecimal(departureEdit.priceAdjustment);

    setDepartureEditErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      const res = await updateJourneyDeparture(editingDepartureId, {
        startDate: departureEdit.startDate,
        endDate: departureEdit.endDate,
        totalSpots,
        availableSpots,
        status: departureEdit.status,
        notes: departureEdit.notes,
        priceAdjustment: priceAdjustment ?? 0,
      });
      if (res.success) {
        toast(t('admin.jrn.departureUpdated'));
        setEditingDepartureId(null);
        setDepartureEditErrors({});
        await loadJourneys();
        await loadDepartures(selectedJourney.id);
      } else {
        toast(res.error ?? t('state.errorTitle'), 'error');
      }
    } catch {
      toast(t('state.errorTitle'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const departureLabel = useCallback(
    (status: string): string => {
      switch (status) {
        case 'available':
          return t('admin.jrn.departureStatusAvailable');
        case 'limited':
          return t('admin.jrn.departureStatusLimited');
        case 'cancelled':
          return t('admin.jrn.departureStatusCancelled');
        default:
          return t('admin.jrn.departureStatusSoldOut');
      }
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
        title={t('admin.jrn.title')}
        subtitle={t('admin.jrn.subtitle')}
        actions={
          <>
            <Button
              onClick={loadJourneys}
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
              <Plus className="w-4 h-4 mr-1" /> {t('admin.jrn.newJourney')}
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder={t('admin.jrn.search')}
          aria-label={t('admin.jrn.search')}
          className="h-9 max-w-md flex-1 bg-[var(--admin-card)] text-xs text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
        />
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          aria-label={t('admin.jrn.allCategories')}
          className="h-9 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 text-xs text-[var(--admin-text-muted)] focus:border-[var(--admin-primary)] focus:outline-none"
        >
          <option value="">{t('admin.jrn.allCategories')}</option>
          <option value="premium">premium</option>
          <option value="army">army</option>
          <option value="essence">essence</option>
          <option value="luxury">luxury</option>
        </select>
      </div>

      {error ? (
        <AdminErrorState message={error} onRetry={loadJourneys} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--admin-border)] bg-black/5 text-[10px] uppercase tracking-wider text-[var(--admin-text-muted)]">
                <th className="p-4 font-semibold">{t('admin.jrn.name')}</th>
                <th className="hidden p-4 font-semibold md:table-cell">{t('admin.jrn.category')}</th>
                <th className="hidden p-4 font-semibold lg:table-cell">{t('admin.jrn.departures')}</th>
                <th className="hidden p-4 font-semibold sm:table-cell">{t('admin.jrn.price')}</th>
                <th className="p-4 font-semibold">{t('admin.jrn.status')}</th>
                <th className="p-4 text-right font-semibold">{t('admin.team.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && journeys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <AdminTableSkeleton rows={8} columns={5} />
                  </td>
                </tr>
              ) : journeys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <AdminEmptyState
                      title={t('admin.jrn.empty')}
                      description={debouncedSearch ? t('state.searchEmptyHint') : undefined}
                      icon={<Sparkles className="w-5 h-5" />}
                    />
                  </td>
                </tr>
              ) : (
                journeys.map((journey) => {
                  const next = journey.departures?.[0];
                  return (
                    <tr
                      key={journey.id}
                      className="group border-b border-[var(--admin-border)] transition-colors hover:bg-[var(--admin-border)]/20"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[var(--admin-border)]">
                            {journey.mainImage ? (
                              <SmartImage
                                src={journey.mainImage}
                                alt=""
                                fill
                                sizes="40px"
                                className="object-cover"
                                unoptimizedMedia
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center">
                                <Sparkles className="w-4 h-4 text-[var(--admin-text-muted)]" />
                              </span>
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="max-w-[200px] truncate text-xs font-semibold text-[var(--admin-text-main)]">
                              {journey.title}
                            </p>
                            <p className="text-[10px] text-[var(--admin-text-muted)]">
                              {formatNumber(journey.durationDays)} • {formatNumber(journey.totalSpots)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden p-4 md:table-cell">
                        <span
                          className={`rounded-full border px-2 py-1 text-[10px] font-bold ${
                            CATEGORY_BADGE[journey.category] ?? CATEGORY_BADGE.premium
                          }`}
                        >
                          {journey.category}
                        </span>
                      </td>
                      {/* As saídas aparecem na TABELA, não só no modal. */}
                      <td className="hidden p-4 lg:table-cell">
                        {next ? (
                          <div className="flex flex-col gap-1">
                            <span className="flex items-center gap-1 text-[11px] text-[var(--admin-text-main)]">
                              <CalendarDays className="w-3 h-3 text-[var(--admin-primary)]" />
                              {formatDate(next.startDate, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </span>
                            <span className="text-[10px] text-[var(--admin-text-muted)]">
                              {t('admin.jrn.departuresCount').replace(
                                '{count}',
                                String(journey.departures?.length ?? 0),
                              )}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[var(--admin-text-muted)]">
                            {t('admin.jrn.noDepartures')}
                          </span>
                        )}
                      </td>
                      <td className="hidden p-4 text-[11px] font-bold text-[var(--admin-accent-green)] sm:table-cell">
                        {formatCurrency(journey.pricePerPerson)}
                      </td>
                      <td className="p-4">
                        <span
                          className={`rounded-full border px-2 py-1 text-[10px] font-bold ${
                            journey.status === 'active'
                              ? 'border-green-800 bg-green-900/30 text-green-400'
                              : 'border-yellow-800 bg-yellow-900/30 text-yellow-400'
                          }`}
                        >
                          {journey.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                          <button
                            type="button"
                            onClick={() => openDepartures(journey.id)}
                            aria-label={t('admin.jrn.departuresTitle')}
                            title={t('admin.jrn.departuresTitle')}
                            className="rounded-md p-1.5 text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-border)] hover:text-[var(--admin-primary)]"
                          >
                            <CalendarDays className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => openModal(journey)}
                            aria-label={t('admin.jrn.editJourney')}
                            className="rounded-md p-1.5 text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-border)] hover:text-[var(--admin-primary)]"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(journey.id)}
                            aria-label={t('admin.jrn.deleteConfirm')}
                            className="rounded-md p-1.5 text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-accent-red)]/10 hover:text-[var(--admin-accent-red)]"
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

      {/* ── Criar / editar jornada ─────────────────────── */}
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
                  {editingItem ? t('admin.jrn.editJourney') : t('admin.jrn.newJourney')}
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
                <form id="journeyForm" onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="jrn-title" className="text-xs font-semibold text-[var(--admin-text-main)]">
                      {t('admin.jrn.name')} *
                    </label>
                    <Input
                      id="jrn-title"
                      required
                      value={formData.title}
                      onChange={(e) => {
                        const title = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          title,
                          slug: editingItem ? prev.slug : slugifyLocal(title),
                        }));
                      }}
                      className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                      placeholder={t('admin.jrn.namePlaceholder')}
                    />
                    {formErrors.title && (
                      <span className="text-[10px] text-[var(--admin-accent-red)]">{formErrors.title}</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="jrn-subtitle" className="text-xs font-semibold text-[var(--admin-text-main)]">
                      {t('admin.jrn.subtitleField')}
                    </label>
                    <Input
                      id="jrn-subtitle"
                      value={formData.subtitle}
                      onChange={(e) => setFormData((prev) => ({ ...prev, subtitle: e.target.value }))}
                      className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="jrn-slug" className="text-xs font-semibold text-[var(--admin-text-main)]">
                      {t('admin.exp.slug')}
                    </label>
                    <Input
                      id="jrn-slug"
                      value={formData.slug}
                      onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                      className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="jrn-duration" className="text-xs font-semibold text-[var(--admin-text-main)]">
                        {t('admin.jrn.duration')} *
                      </label>
                      <Input
                        id="jrn-duration"
                        inputMode="numeric"
                        value={formData.durationDays}
                        onChange={(e) => setFormData((prev) => ({ ...prev, durationDays: e.target.value }))}
                        aria-invalid={Boolean(formErrors.durationDays)}
                        className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                      />
                      {formErrors.durationDays && (
                        <span className="text-[10px] text-[var(--admin-accent-red)]">
                          {formErrors.durationDays}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="jrn-spots" className="text-xs font-semibold text-[var(--admin-text-main)]">
                        {t('admin.jrn.spots')} *
                      </label>
                      <Input
                        id="jrn-spots"
                        inputMode="numeric"
                        value={formData.totalSpots}
                        onChange={(e) => setFormData((prev) => ({ ...prev, totalSpots: e.target.value }))}
                        aria-invalid={Boolean(formErrors.totalSpots)}
                        className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                      />
                      {formErrors.totalSpots && (
                        <span className="text-[10px] text-[var(--admin-accent-red)]">{formErrors.totalSpots}</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="jrn-price" className="text-xs font-semibold text-[var(--admin-text-main)]">
                        {t('admin.jrn.price')} *
                      </label>
                      <Input
                        id="jrn-price"
                        inputMode="decimal"
                        value={formData.pricePerPerson}
                        onChange={(e) => setFormData((prev) => ({ ...prev, pricePerPerson: e.target.value }))}
                        aria-invalid={Boolean(formErrors.pricePerPerson)}
                        className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                        placeholder="12000,00"
                      />
                      {formErrors.pricePerPerson && (
                        <span className="text-[10px] text-[var(--admin-accent-red)]">
                          {formErrors.pricePerPerson}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="jrn-category" className="text-xs font-semibold text-[var(--admin-text-main)]">
                        {t('admin.jrn.category')}
                      </label>
                      <select
                        id="jrn-category"
                        value={formData.category}
                        onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                        className="h-10 rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 text-sm text-[var(--admin-text-main)] focus:border-[var(--admin-primary)] focus:outline-none"
                      >
                        <option value="premium">premium</option>
                        <option value="army">army</option>
                        <option value="essence">essence</option>
                        <option value="luxury">luxury</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="jrn-status" className="text-xs font-semibold text-[var(--admin-text-main)]">
                        {t('admin.jrn.status')}
                      </label>
                      <select
                        id="jrn-status"
                        value={formData.status}
                        onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                        className="h-10 rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 text-sm text-[var(--admin-text-main)] focus:border-[var(--admin-primary)] focus:outline-none"
                      >
                        <option value="active">active</option>
                        <option value="draft">draft</option>
                        <option value="soldout">soldout</option>
                        <option value="archived">archived</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="jrn-image" className="text-xs font-semibold text-[var(--admin-text-main)]">
                      {t('admin.exp.mainImage')}
                    </label>
                    <Input
                      id="jrn-image"
                      value={formData.mainImage}
                      onChange={(e) => setFormData((prev) => ({ ...prev, mainImage: e.target.value }))}
                      className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                      placeholder="/api/media/… ou https://…"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="jrn-concept" className="text-xs font-semibold text-[var(--admin-text-main)]">
                      {t('admin.jrn.concept')}
                    </label>
                    <textarea
                      id="jrn-concept"
                      value={formData.concept}
                      onChange={(e) => setFormData((prev) => ({ ...prev, concept: e.target.value }))}
                      className="flex min-h-[90px] w-full resize-none rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm text-[var(--admin-text-main)] focus-visible:border-[var(--admin-primary)] focus-visible:outline-none"
                    />
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
                  form="journeyForm"
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

      {/* ── Saídas ─────────────────────────────────────── */}
      <AnimatePresence>
        {selectedJourney && (
          <>
            <motion.button
              type="button"
              aria-label={t('admin.common.close')}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDepartures}
              className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 z-[101] flex max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-bg)] shadow-2xl"
            >
              <header className="flex items-center justify-between gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-[var(--admin-text-main)]">
                    {t('admin.jrn.departuresTitle')}
                  </h3>
                  <p className="truncate text-[11px] text-[var(--admin-text-muted)]">
                    {selectedJourney.title}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void loadDepartures(selectedJourney.id)}
                    disabled={departuresLoading}
                    aria-label={t('admin.jrn.reloadDepartures')}
                    title={t('admin.jrn.reloadDepartures')}
                    className="h-8 border-[var(--admin-border)] px-2.5 text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${departuresLoading ? 'animate-spin' : ''}`} />
                  </Button>
                  <button
                    type="button"
                    onClick={closeDepartures}
                    aria-label={t('admin.common.close')}
                    className="text-[var(--admin-text-muted)] transition-colors hover:text-[var(--admin-text-main)]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </header>

              <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
                {departuresError ? (
                  <AdminErrorState
                    message={departuresError}
                    onRetry={() => void loadDepartures(selectedJourney.id)}
                  />
                ) : departuresLoading && departures.length === 0 ? (
                  <div className="flex flex-col gap-2" aria-hidden="true">
                    {[0, 1, 2].map((slot) => (
                      <div
                        key={`dep-skeleton-${slot}`}
                        className="h-14 animate-pulse rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)]"
                      />
                    ))}
                  </div>
                ) : departures.length > 0 ? (
                  <ul className="flex flex-col gap-2">
                    {departures.map((departure) => (
                      <li
                        key={departure.id}
                        className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-[var(--admin-card)] p-3 ${
                          editingDepartureId === departure.id
                            ? 'border-[var(--admin-primary)]'
                            : 'border-[var(--admin-border)]'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[var(--admin-text-main)]">
                            {formatDate(departure.startDate)} → {formatDate(departure.endDate)}
                          </p>
                          <p className="text-[10px] text-[var(--admin-text-muted)]">
                            {formatNumber(departure.availableSpots)} / {formatNumber(departure.totalSpots)}
                            {departure.priceAdjustment ? ` · ${t('admin.jrn.priceAdjustment')}: ${departure.priceAdjustment}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${
                              DEPARTURE_BADGE[departure.status] ?? DEPARTURE_BADGE.sold_out
                            }`}
                          >
                            {departureLabel(departure.status)}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (editingDepartureId === departure.id) {
                                setEditingDepartureId(null);
                                setDepartureEditErrors({});
                              } else {
                                startEditDeparture(departure);
                              }
                            }}
                            aria-label={t('admin.jrn.editDeparture')}
                            title={t('admin.jrn.editDeparture')}
                            className="p-1 text-[var(--admin-text-muted)] transition-colors hover:text-[var(--admin-primary)]"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteDeparture(departure.id)}
                            aria-label={t('admin.jrn.departureRemoved')}
                            className="p-1 text-[var(--admin-text-muted)] transition-colors hover:text-[var(--admin-accent-red)]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-[var(--admin-text-muted)]">{t('admin.jrn.noDepartures')}</p>
                )}

                {/* ── Editar saída ─────────────────────────────── */}
                <AnimatePresence>
                  {editingDepartureId && (
                    <motion.form
                      key="departure-edit"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={handleUpdateDeparture}
                      className="flex flex-col gap-3 overflow-hidden rounded-xl border border-[var(--admin-primary)]/50 bg-[var(--admin-card)] p-4"
                    >
                      <p className="text-xs font-semibold text-[var(--admin-text-main)]">
                        {t('admin.jrn.editDeparture')}
                      </p>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="flex flex-col gap-1">
                          <label htmlFor="dep-edit-start" className="text-[10px] text-[var(--admin-text-muted)]">
                            {t('admin.jrn.startDate')}
                          </label>
                          <Input
                            id="dep-edit-start"
                            type="date"
                            required
                            value={departureEdit.startDate}
                            onChange={(e) =>
                              setDepartureEdit((prev) => ({ ...prev, startDate: e.target.value }))
                            }
                            aria-invalid={Boolean(departureEditErrors.startDate)}
                            className="h-9 bg-[var(--admin-bg)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)]"
                          />
                          {departureEditErrors.startDate && (
                            <span className="text-[10px] text-[var(--admin-accent-red)]">
                              {departureEditErrors.startDate}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          <label htmlFor="dep-edit-end" className="text-[10px] text-[var(--admin-text-muted)]">
                            {t('admin.jrn.endDate')}
                          </label>
                          <Input
                            id="dep-edit-end"
                            type="date"
                            required
                            value={departureEdit.endDate}
                            onChange={(e) => setDepartureEdit((prev) => ({ ...prev, endDate: e.target.value }))}
                            aria-invalid={Boolean(departureEditErrors.endDate)}
                            className="h-9 bg-[var(--admin-bg)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)]"
                          />
                          {departureEditErrors.endDate && (
                            <span className="text-[10px] text-[var(--admin-accent-red)]">
                              {departureEditErrors.endDate}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="flex flex-col gap-1">
                          <label htmlFor="dep-edit-total" className="text-[10px] text-[var(--admin-text-muted)]">
                            {t('admin.jrn.totalSpots')}
                          </label>
                          <Input
                            id="dep-edit-total"
                            inputMode="numeric"
                            value={departureEdit.totalSpots}
                            onChange={(e) => changeEditSpots('totalSpots', e.target.value)}
                            aria-invalid={Boolean(departureEditErrors.totalSpots)}
                            className="h-9 bg-[var(--admin-bg)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)]"
                          />
                          {departureEditErrors.totalSpots && (
                            <span className="text-[10px] text-[var(--admin-accent-red)]">
                              {departureEditErrors.totalSpots}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          <label
                            htmlFor="dep-edit-available"
                            className="text-[10px] text-[var(--admin-text-muted)]"
                          >
                            {t('admin.jrn.availableSpots')}
                          </label>
                          <Input
                            id="dep-edit-available"
                            inputMode="numeric"
                            value={departureEdit.availableSpots}
                            onChange={(e) => changeEditSpots('availableSpots', e.target.value)}
                            aria-invalid={Boolean(departureEditErrors.availableSpots)}
                            className="h-9 bg-[var(--admin-bg)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)]"
                          />
                          {departureEditErrors.availableSpots && (
                            <span className="text-[10px] text-[var(--admin-accent-red)]">
                              {departureEditErrors.availableSpots}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="flex flex-col gap-1">
                          <label htmlFor="dep-edit-status" className="text-[10px] text-[var(--admin-text-muted)]">
                            {t('admin.jrn.status')}
                          </label>
                          <select
                            id="dep-edit-status"
                            value={departureEdit.status}
                            onChange={(e) =>
                              setDepartureEdit((prev) => ({ ...prev, status: e.target.value }))
                            }
                            aria-invalid={Boolean(departureEditErrors.status)}
                            className="h-9 rounded-md border border-[var(--admin-border)] bg-[var(--admin-bg)] px-2 text-sm text-[var(--admin-text-main)] focus:border-[var(--admin-primary)] focus:outline-none"
                          >
                            <option value="available">{t('admin.jrn.departureStatusAvailable')}</option>
                            <option value="limited">{t('admin.jrn.departureStatusLimited')}</option>
                            <option value="sold_out">{t('admin.jrn.departureStatusSoldOut')}</option>
                            <option value="cancelled">{t('admin.jrn.departureStatusCancelled')}</option>
                          </select>
                          {departureEditErrors.status && (
                            <span className="text-[10px] text-[var(--admin-accent-red)]">
                              {departureEditErrors.status}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          <label
                            htmlFor="dep-edit-price"
                            className="text-[10px] text-[var(--admin-text-muted)]"
                          >
                            {t('admin.jrn.priceAdjustment')}
                          </label>
                          <Input
                            id="dep-edit-price"
                            inputMode="decimal"
                            value={departureEdit.priceAdjustment}
                            onChange={(e) =>
                              setDepartureEdit((prev) => ({ ...prev, priceAdjustment: e.target.value }))
                            }
                            placeholder="0,00"
                            className="h-9 bg-[var(--admin-bg)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)]"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label htmlFor="dep-edit-notes" className="text-[10px] text-[var(--admin-text-muted)]">
                          {t('admin.jrn.concept')}
                        </label>
                        <Input
                          id="dep-edit-notes"
                          value={departureEdit.notes}
                          onChange={(e) => setDepartureEdit((prev) => ({ ...prev, notes: e.target.value }))}
                          className="h-9 bg-[var(--admin-bg)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)]"
                        />
                      </div>

                      <p className="text-[10px] text-[var(--admin-text-muted)]">
                        {t('admin.jrn.soldOutHint')}
                      </p>

                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEditingDepartureId(null);
                            setDepartureEditErrors({});
                          }}
                          disabled={isSubmitting}
                          className="h-9 border-[var(--admin-border)] text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50"
                        >
                          {t('admin.common.cancel')}
                        </Button>
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="h-9 bg-[var(--admin-primary)] font-semibold text-black hover:bg-[var(--admin-primary-hover)]"
                        >
                          {isSubmitting ? t('admin.state.loading') : t('admin.common.save')}
                        </Button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>


                <form
                  onSubmit={handleAddDeparture}
                  className="flex flex-col gap-3 rounded-xl border border-[var(--admin-border)]/50 bg-[var(--admin-card)] p-4"
                >
                  <p className="text-xs font-semibold text-[var(--admin-text-main)]">
                    {t('admin.jrn.newDeparture')}
                  </p>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                      <label htmlFor="dep-start" className="text-[10px] text-[var(--admin-text-muted)]">
                        {t('admin.jrn.startDate')}
                      </label>
                      <Input
                        id="dep-start"
                        type="date"
                        required
                        value={departureForm.startDate}
                        onChange={(e) => setDepartureForm((prev) => ({ ...prev, startDate: e.target.value }))}
                        aria-invalid={Boolean(departureErrors.startDate)}
                        className="h-9 bg-[var(--admin-bg)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)]"
                      />
                      {departureErrors.startDate && (
                        <span className="text-[10px] text-[var(--admin-accent-red)]">
                          {departureErrors.startDate}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <label htmlFor="dep-end" className="text-[10px] text-[var(--admin-text-muted)]">
                        {t('admin.jrn.endDate')}
                      </label>
                      <Input
                        id="dep-end"
                        type="date"
                        required
                        value={departureForm.endDate}
                        onChange={(e) => setDepartureForm((prev) => ({ ...prev, endDate: e.target.value }))}
                        aria-invalid={Boolean(departureErrors.endDate)}
                        className="h-9 bg-[var(--admin-bg)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)]"
                      />
                      {departureErrors.endDate && (
                        <span className="text-[10px] text-[var(--admin-accent-red)]">{departureErrors.endDate}</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                      <label htmlFor="dep-total" className="text-[10px] text-[var(--admin-text-muted)]">
                        {t('admin.jrn.totalSpots')}
                      </label>
                      <Input
                        id="dep-total"
                        inputMode="numeric"
                        value={departureForm.totalSpots}
                        onChange={(e) => setDepartureForm((prev) => ({ ...prev, totalSpots: e.target.value }))}
                        aria-invalid={Boolean(departureErrors.totalSpots)}
                        className="h-9 bg-[var(--admin-bg)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)]"
                      />
                      {departureErrors.totalSpots && (
                        <span className="text-[10px] text-[var(--admin-accent-red)]">
                          {departureErrors.totalSpots}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <label htmlFor="dep-available" className="text-[10px] text-[var(--admin-text-muted)]">
                        {t('admin.jrn.availableSpots')}
                      </label>
                      <Input
                        id="dep-available"
                        inputMode="numeric"
                        value={departureForm.availableSpots}
                        onChange={(e) => setDepartureForm((prev) => ({ ...prev, availableSpots: e.target.value }))}
                        aria-invalid={Boolean(departureErrors.availableSpots)}
                        className="h-9 bg-[var(--admin-bg)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)]"
                      />
                      {departureErrors.availableSpots && (
                        <span className="text-[10px] text-[var(--admin-accent-red)]">
                          {departureErrors.availableSpots}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="dep-notes" className="text-[10px] text-[var(--admin-text-muted)]">
                      {t('admin.jrn.concept')}
                    </label>
                    <Input
                      id="dep-notes"
                      value={departureForm.notes}
                      onChange={(e) => setDepartureForm((prev) => ({ ...prev, notes: e.target.value }))}
                      className="h-9 bg-[var(--admin-bg)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)]"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-9 bg-[var(--admin-primary)] font-semibold text-black hover:bg-[var(--admin-primary-hover)]"
                  >
                    <Plus className="w-4 h-4 mr-1" /> {t('admin.jrn.addDeparture')}
                  </Button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
