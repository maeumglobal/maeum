'use client';

/**
 * Intercâmbio — instituições (leitura) e criação de campi.
 *
 * ## O que é possível e o que NÃO é possível aqui
 *
 * `getExchangeInstitutions()` é a ÚNICA action de intercâmbio: ela é pública
 * (as páginas `/intercambios` e `/coreia-do-sul/intercambio` montam os cards a
 * partir do mesmo retorno) e devolve `ExchangeInstitution → campuses → programs`.
 * Não existe action para criar/editar instituição nem para mexer em
 * `ExchangeProgram` — por isso esta tela é explicitamente de leitura para esses
 * dois modelos e só cria `ExchangeCampus`. O aviso `admin.exchange.programsNote`
 * deixa isso claro na própria interface, sem inventar endpoint novo.
 *
 * Atenção ao filtro da action: `where: { isActive: true }` em instituições,
 * campi e programas. Instituições desativadas NÃO aparecem aqui — pendência
 * anotada no relatório (precisa de uma action de leitura com `requireStaff`).
 */
import { useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building,
  ExternalLink,
  GraduationCap,
  MapPin,
  Plus,
  RefreshCw,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  createExchangeCampus,
  getExchangeInstitutions,
  type ExchangeInstitutionView,
} from '@/actions/businessActions';
import SmartImage from '@/components/SmartImage';
import { useMountedLoad } from '@/components/admin/ui/useMountedLoad';
import {
  AdminCardSkeleton,
  AdminEmptyState,
  AdminErrorState,
  AdminPageHeader,
} from '@/components/admin/ui/States';

interface CampusForm {
  institutionId: string;
  name: string;
  city: string;
  location: string;
  description: string;
  mainImage: string;
}

const EMPTY_FORM: CampusForm = {
  institutionId: '',
  name: '',
  city: '',
  location: '',
  description: '',
  mainImage: '',
};

export default function AdminExchangeHome() {
  const { t, formatCurrency, formatNumber } = useLanguage();
  const { toast } = useToast();

  const [institutions, setInstitutions] = useState<ExchangeInstitutionView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<CampusForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const loadInstitutions = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getExchangeInstitutions();
    if (res.success && res.data) {
      setInstitutions(res.data);
    } else {
      setInstitutions([]);
      setError(res.error ?? t('state.errorTitle'));
    }
    setLoading(false);
  }, [t]);

  useMountedLoad(loadInstitutions);

  const totals = useMemo(
    () => ({
      institutions: institutions.length,
      campuses: institutions.reduce((sum, institution) => sum + institution.campuses.length, 0),
      programs: institutions.reduce(
        (sum, institution) =>
          sum + institution.campuses.reduce((inner, campus) => inner + campus.programs.length, 0),
        0,
      ),
    }),
    [institutions],
  );

  const openModal = (institutionId: string) => {
    setFormErrors({});
    setFormData({ ...EMPTY_FORM, institutionId });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(EMPTY_FORM);
    setFormErrors({});
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.institutionId) errors.institutionId = t('admin.exchange.institutionRequired');
    if (formData.name.trim().length < 2) errors.name = t('admin.exchange.campusNameRequired');
    if (formData.city.trim().length < 2) errors.city = t('admin.exchange.cityRequired');

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    const res = await createExchangeCampus({
      institutionId: formData.institutionId,
      name: formData.name,
      city: formData.city,
      location: formData.location,
      description: formData.description,
      mainImage: formData.mainImage,
    });
    setIsSubmitting(false);

    if (res.success) {
      toast(t('admin.exchange.created'));
      closeModal();
      await loadInstitutions();
    } else {
      toast(res.error ?? t('state.errorTitle'), 'error');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-full flex-col gap-6"
    >
      <AdminPageHeader
        icon={<GraduationCap className="w-5 h-5" />}
        title={t('admin.exchange.title')}
        subtitle={t('admin.exchange.subtitle')}
        actions={
          <>
            <a
              href="/intercambios"
              target="_blank"
              rel="noreferrer noopener"
              aria-label={t('admin.exchange.siteExchange')}
              title={t('admin.exchange.siteExchange')}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--admin-border)] px-3 text-xs text-[var(--admin-text-main)] transition-colors hover:bg-[var(--admin-border)]/50"
            >
              <ExternalLink className="w-3.5 h-3.5" /> {t('admin.exchange.siteExchange')}
            </a>
            <a
              href="/coreia-do-sul/intercambio"
              target="_blank"
              rel="noreferrer noopener"
              aria-label={t('admin.exchange.siteKorea')}
              title={t('admin.exchange.siteKorea')}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--admin-border)] px-3 text-xs text-[var(--admin-text-main)] transition-colors hover:bg-[var(--admin-border)]/50"
            >
              <ExternalLink className="w-3.5 h-3.5" /> {t('admin.exchange.siteKorea')}
            </a>
            <Button
              onClick={loadInstitutions}
              variant="outline"
              aria-label={t('common.refresh')}
              className="h-9 border-[var(--admin-border)] px-3 text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              onClick={() => openModal('')}
              disabled={institutions.length === 0}
              className="h-9 bg-[var(--admin-primary)] px-4 font-semibold text-black hover:bg-[var(--admin-primary-hover)]"
            >
              <Plus className="w-4 h-4 mr-1" /> {t('admin.exchange.newCampus')}
            </Button>
          </>
        }
      />

      <div
        role="status"
        className="flex flex-col gap-1 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-4 text-[11px] text-[var(--admin-text-muted)]"
      >
        <p>{t('admin.exchange.readOnlyNote')}</p>
        <p>{t('admin.exchange.programsNote')}</p>
        {institutions.length > 0 && (
          <p>
            {t('admin.exchange.total').replace('{count}', formatNumber(totals.institutions))}
            {' · '}
            {t('admin.exchange.campuses').replace('{count}', formatNumber(totals.campuses))}
            {' · '}
            {t('admin.exchange.programs').replace('{count}', formatNumber(totals.programs))}
          </p>
        )}
      </div>

      {error ? (
        <AdminErrorState message={error} onRetry={loadInstitutions} />
      ) : loading && institutions.length === 0 ? (
        <AdminCardSkeleton count={4} />
      ) : institutions.length === 0 ? (
        <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)]">
          <AdminEmptyState
            title={t('admin.exchange.empty')}
            icon={<GraduationCap className="w-5 h-5" />}
          />
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {institutions.map((institution) => (
            <li
              key={institution.id}
              className="overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)]"
            >
              <div className="flex flex-col gap-3 border-b border-[var(--admin-border)] p-4 sm:flex-row sm:items-center">
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[var(--admin-border)]">
                  {institution.logoUrl ? (
                    <SmartImage
                      src={institution.logoUrl}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-contain"
                      unoptimizedMedia
                      placeholderLabel={institution.name}
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">
                      <Building className="w-5 h-5 text-[var(--admin-text-muted)]" />
                    </span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[var(--admin-text-main)]">
                    {institution.name}
                  </p>
                  <p className="flex flex-wrap items-center gap-2 text-[10px] text-[var(--admin-text-muted)]">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {institution.country}
                    </span>
                    <span>· {institution.slug}</span>
                    {institution.website && (
                      <a
                        href={institution.website}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 text-[var(--admin-primary)] hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {t('admin.exchange.viewOnSite')}
                      </a>
                    )}
                  </p>
                  {institution.description && (
                    <p className="mt-1 text-[11px] text-[var(--admin-text-main)]">
                      {institution.description}
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => openModal(institution.id)}
                  aria-label={t('admin.exchange.addCampusTo').replace('{name}', institution.name)}
                  className="h-9 shrink-0 bg-[var(--admin-primary)] px-3 text-xs font-semibold text-black hover:bg-[var(--admin-primary-hover)]"
                >
                  <Plus className="w-4 h-4 mr-1" /> {t('admin.exchange.newCampus')}
                </Button>
              </div>

              {institution.campuses.length === 0 ? (
                <p className="p-4 text-[11px] text-[var(--admin-text-muted)]">
                  {t('admin.exchange.emptyCampuses')}
                </p>
              ) : (
                <ul className="flex flex-col divide-y divide-[var(--admin-border)]">
                  {institution.campuses.map((campus) => (
                    <li key={campus.id} className="flex flex-col gap-3 p-4 lg:flex-row">
                      <div className="flex min-w-0 flex-1 gap-3">
                        <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-[var(--admin-border)]">
                          {campus.mainImage || institution.logoUrl ? (
                            <SmartImage
                              src={campus.mainImage ?? institution.logoUrl ?? ''}
                              alt=""
                              fill
                              sizes="80px"
                              className="object-cover"
                              unoptimizedMedia
                              placeholderLabel={campus.name}
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center">
                              <Building className="w-4 h-4 text-[var(--admin-text-muted)]" />
                            </span>
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[var(--admin-text-main)]">
                            {campus.name}
                          </p>
                          <p className="flex flex-wrap items-center gap-2 text-[10px] text-[var(--admin-text-muted)]">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {campus.city}
                            </span>
                            {campus.location && <span>· {campus.location}</span>}
                          </p>
                          {campus.description && (
                            <p className="mt-1 text-[11px] text-[var(--admin-text-main)]">
                              {campus.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-[var(--admin-text-muted)]">
                          {t('admin.exchange.programsLabel')}
                        </p>
                        {campus.programs.length === 0 ? (
                          <p className="text-[10px] text-[var(--admin-text-muted)]">—</p>
                        ) : (
                          <ul className="flex flex-col gap-1">
                            {campus.programs.map((program) => (
                              <li
                                key={program.id}
                                className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2"
                              >
                                <p className="text-[11px] font-semibold text-[var(--admin-text-main)]">
                                  {program.name}
                                </p>
                                <p className="text-[10px] text-[var(--admin-text-muted)]">
                                  {t('admin.exchange.weeks')
                                    .replace('{min}', formatNumber(program.durationWeeksMin))
                                    .replace('{max}', formatNumber(program.durationWeeksMax))}
                                  {' · '}
                                  {t('admin.exchange.level')}: {program.levelRequired}
                                  {program.enrollmentFee > 0
                                    ? ` · ${t('admin.exchange.enrollmentFee')}: ${formatCurrency(program.enrollmentFee)}`
                                    : ''}
                                </p>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* ── Novo campus ────────────────────────────────────────────────── */}
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
                  {t('admin.exchange.newCampus')}
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
                <form id="campusForm" onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="campus-institution"
                      className="text-xs font-semibold text-[var(--admin-text-main)]"
                    >
                      {t('admin.exchange.institution')} *
                    </label>
                    <select
                      id="campus-institution"
                      value={formData.institutionId}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, institutionId: e.target.value }))
                      }
                      aria-invalid={Boolean(formErrors.institutionId)}
                      className="h-10 rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 text-sm text-[var(--admin-text-main)] focus:border-[var(--admin-primary)] focus:outline-none"
                    >
                      <option value="">{t('admin.exchange.selectInstitution')}</option>
                      {institutions.map((institution) => (
                        <option key={institution.id} value={institution.id}>
                          {institution.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.institutionId && (
                      <span className="text-[10px] text-[var(--admin-accent-red)]">
                        {formErrors.institutionId}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="campus-name"
                        className="text-xs font-semibold text-[var(--admin-text-main)]"
                      >
                        {t('admin.exchange.campusName')} *
                      </label>
                      <Input
                        id="campus-name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                        aria-invalid={Boolean(formErrors.name)}
                        className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                      />
                      {formErrors.name && (
                        <span className="text-[10px] text-[var(--admin-accent-red)]">{formErrors.name}</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="campus-city"
                        className="text-xs font-semibold text-[var(--admin-text-main)]"
                      >
                        {t('admin.exchange.city')} *
                      </label>
                      <Input
                        id="campus-city"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                        aria-invalid={Boolean(formErrors.city)}
                        className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                      />
                      {formErrors.city && (
                        <span className="text-[10px] text-[var(--admin-accent-red)]">{formErrors.city}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="campus-location"
                      className="text-xs font-semibold text-[var(--admin-text-main)]"
                    >
                      {t('admin.exchange.location')}
                    </label>
                    <Input
                      id="campus-location"
                      value={formData.location}
                      onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                      className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="campus-image"
                      className="text-xs font-semibold text-[var(--admin-text-main)]"
                    >
                      {t('admin.exchange.mainImage')}
                    </label>
                    <Input
                      id="campus-image"
                      value={formData.mainImage}
                      onChange={(e) => setFormData((prev) => ({ ...prev, mainImage: e.target.value }))}
                      placeholder="/api/media/…  |  https://…"
                      className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
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
                    <label
                      htmlFor="campus-description"
                      className="text-xs font-semibold text-[var(--admin-text-main)]"
                    >
                      {t('admin.exchange.description')}
                    </label>
                    <textarea
                      id="campus-description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, description: e.target.value }))
                      }
                      className="flex min-h-[90px] w-full resize-y rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm text-[var(--admin-text-main)] focus-visible:border-[var(--admin-primary)] focus-visible:outline-none"
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
                  form="campusForm"
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[var(--admin-primary)] font-semibold text-black hover:bg-[var(--admin-primary-hover)]"
                >
                  {isSubmitting ? t('admin.state.loading') : t('admin.common.create')}
                </Button>
              </footer>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
