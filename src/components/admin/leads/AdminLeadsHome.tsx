'use client';

/**
 * CRM / Leads.
 *
 * Correções: (1) busca com debounce de 300ms — antes cada tecla disparava um
 * round-trip ao Postgres; (2) `getUsers({ role: 'consultora' })` sem paginação
 * virava um limitador silencioso; (3) TODO `if (res.success)` sem `else`
 * deixava falha invisível — exclusão, mudança de status e reatribuição agora
 * Kirst toast de erro; (4) pageSize 20/50/100 com pager de verdade.
 *
 * + `createLeadAction` ligada: lead de telefone, indicação ou evento não passa
 * pelo formulário público, então a equipe precisa registrar na mão.
 */
import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, Plus, RefreshCw, Trash2, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  getLeads,
  updateLeadStatusAction,
  updateLeadConsultantAction,
  deleteLeadAction,
  createLeadAction,
} from '@/actions/leadsActions';
import { getConsultants } from '@/actions/usersActions';
import AdminPagination from '@/components/admin/ui/Pagination';
import { useDebouncedValue } from '@/components/admin/ui/useDebouncedValue';
import { useMountedLoad } from '@/components/admin/ui/useMountedLoad';
import { AdminEmptyState, AdminErrorState, AdminPageHeader, AdminTableSkeleton } from '@/components/admin/ui/States';

interface ConsultantRow {
  id: string;
  name: string;
  role: string;
  avatarUrl: string | null;
}

interface LeadRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  destination: string | null;
  origin: string | null;
  status: string;
  consultantId: string | null;
  budget: number | null;
  createdAt: string;
}

/** Campos do formulário de "novo lead" (todos opcionais menos o nome). */
interface LeadForm {
  name: string;
  email: string;
  phone: string;
  destination: string;
  budget: string;
  origin: string;
  notes: string;
  consultantId: string;
}

const EMPTY_LEAD_FORM: LeadForm = {
  name: '',
  email: '',
  phone: '',
  destination: '',
  budget: '',
  origin: '',
  notes: '',
  consultantId: '',
};

const STATUS_STYLE: Record<string, string> = {
  novo: 'bg-blue-900/30 text-blue-400 border-blue-800',
  contato: 'bg-cyan-900/30 text-cyan-400 border-cyan-800',
  atendimento: 'bg-yellow-900/30 text-yellow-400 border-yellow-800',
  proposta: 'bg-purple-900/30 text-purple-400 border-purple-800',
  proposta_enviada: 'bg-purple-900/30 text-purple-400 border-purple-800',
  fechado: 'bg-green-900/30 text-green-400 border-green-800',
  perdido: 'bg-red-900/30 text-red-400 border-red-800',
};


export default function AdminLeadsHome() {
  const { t, formatNumber } = useLanguage();
  const { toast } = useToast();

  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [consultants, setConsultants] = useState<ConsultantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isLeadSubmitting, setIsLeadSubmitting] = useState(false);
  const [leadForm, setLeadForm] = useState<LeadForm>(EMPTY_LEAD_FORM);
  const [leadErrors, setLeadErrors] = useState<Record<string, string>>({});


  const debouncedSearch = useDebouncedValue(search);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getLeads({
      page,
      pageSize,
      search: debouncedSearch,
      status: statusFilter || undefined,
    });
    if (res.success) {
      setLeads((res.items ?? []) as unknown as LeadRow[]);
      setTotal(res.total ?? 0);
      setTotalPages(res.totalPages ?? 1);
    } else {
      setLeads([]);
      setTotal(0);
      setTotalPages(1);
      setError(res.error ?? t('state.errorTitle'));
    }
    setLoading(false);
  }, [page, pageSize, debouncedSearch, statusFilter, t]);

  useMountedLoad(load);

  // Equipe: `getConsultants` já é uma lista curta e sem e-mail/senha.
  useEffect(() => {
    let active = true;
    void (async () => {
      const res = await getConsultants();
      if (!active) return;
      if (res.success && res.data) setConsultants(res.data as ConsultantRow[]);
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    const res = await updateLeadStatusAction(id, status);
    if (res.success) {
      toast(t('admin.leads.statusUpdated').replace('{status}', status));
      await load();
    } else {
      toast(res.error ?? t('state.errorTitle'), 'error');
    }
  };

  const handleConsultantChange = async (id: string, consultantId: string) => {
    const res = await updateLeadConsultantAction(id, consultantId || null);
    if (res.success) {
      toast(t('admin.leads.assigned'));
      await load();
    } else {
      toast(res.error ?? t('state.errorTitle'), 'error');
    }
  };

const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(t('admin.leads.deleteConfirm').replace('{name}', name))) return;
    const res = await deleteLeadAction(id);
    if (res.success) {
      toast(t('admin.leads.deleted'));
      await load();
    } else {
      toast(res.error ?? t('state.errorTitle'), 'error');
    }
  };

  const openLeadModal = () => {
    setLeadErrors({});
    setLeadForm(EMPTY_LEAD_FORM);
    setIsLeadModalOpen(true);
  };

  const closeLeadModal = () => {
    setIsLeadModalOpen(false);
    setLeadErrors({});
  };

  /**
   * `createLeadAction` grava `budget` como Float e `origin` como texto livre.
   * O orçamento em branco precisa virar `''` (a action trata como null) — enviar
   * `NaN` gravaria lixo ou o Postgres recusaria o Float.
   */
  const handleCreateLead = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isLeadSubmitting) return;

    const errors: Record<string, string> = {};
    if (leadForm.name.trim().length < 2) errors.name = t('admin.leads.nameRequired');
    if (leadForm.email.trim() && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(leadForm.email.trim())) {
      errors.email = t('admin.leads.emailInvalid');
    }
    const budgetRaw = leadForm.budget.trim().replace(',', '.');
    if (budgetRaw && (!Number.isFinite(Number(budgetRaw)) || Number(budgetRaw) < 0)) {
      errors.budget = t('admin.leads.budgetInvalid');
    }
    setLeadErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsLeadSubmitting(true);
    try {
      const res = await createLeadAction({
        name: leadForm.name.trim(),
        email: leadForm.email.trim(),
        phone: leadForm.phone.trim(),
        destination: leadForm.destination.trim(),
        budget: budgetRaw,
        origin: leadForm.origin.trim(),
        notes: leadForm.notes.trim(),
        consultantId: leadForm.consultantId,
      });
      if (res.success) {
        toast(t('admin.leads.created'), 'success');
        closeLeadModal();
        await load();
      } else {
        toast(res.error ?? t('state.errorTitle'), 'error');
      }
    } catch {
      toast(t('state.errorTitle'), 'error');
    } finally {
      setIsLeadSubmitting(false);
    }
  };


  const statusOptions = [
    { value: '', labelKey: 'admin.leads.statusAll' },
    { value: 'novo', labelKey: 'admin.leads.statusNew' },
    { value: 'atendimento', labelKey: 'admin.leads.statusContact' },
    { value: 'proposta', labelKey: 'admin.leads.statusProposal' },
    { value: 'fechado', labelKey: 'admin.leads.statusClosed' },
    { value: 'perdido', labelKey: 'admin.leads.statusLost' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-full flex-col gap-6"
    >
      <AdminPageHeader
        icon={<Users className="w-5 h-5" />}
        title={t('admin.leads.title')}
        subtitle={t('admin.leads.subtitle').replace('{count}', formatNumber(total))}
        actions={
          <>
            <Button
              onClick={load}
              variant="outline"
              aria-label={t('state.retry')}
              className="h-9 border-[var(--admin-border)] px-3 text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              onClick={openLeadModal}
              className="h-9 bg-[var(--admin-primary)] px-4 font-semibold text-black hover:bg-[var(--admin-primary-hover)]"
            >
              <Plus className="w-4 h-4 mr-1" /> {t('admin.leads.newLead')}
            </Button>
          </>
        }

      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder={t('admin.leads.search')}
          aria-label={t('admin.leads.search')}
          className="h-9 max-w-md flex-1 bg-[var(--admin-card)] text-xs text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          aria-label={t('admin.leads.statusAll')}
          className="h-9 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 text-xs text-[var(--admin-text-muted)] focus:border-[var(--admin-primary)] focus:outline-none"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {t(option.labelKey)}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <AdminErrorState message={error} onRetry={load} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--admin-border)] bg-black/5 text-[10px] uppercase tracking-wider text-[var(--admin-text-muted)]">
                <th className="p-4 font-semibold">{t('admin.leads.title')}</th>
                <th className="hidden p-4 font-semibold sm:table-cell">{t('admin.list.interest')}</th>
                <th className="hidden p-4 font-semibold md:table-cell">{t('admin.leads.responsible')}</th>
                <th className="p-4 font-semibold">{t('admin.list.statusPaid')}</th>
                <th className="p-4 text-right font-semibold">{t('admin.team.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && leads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-0">
                    <AdminTableSkeleton rows={8} columns={4} />
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-0">
                    <AdminEmptyState
                      title={t('admin.leads.empty')}
                      description={debouncedSearch ? t('state.searchEmptyHint') : undefined}
                      icon={<Users className="w-5 h-5" />}
                    />
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="group border-b border-[var(--admin-border)] transition-colors hover:bg-[var(--admin-border)]/20"
                  >
                    <td className="p-4">
                      <p className="max-w-[200px] truncate text-sm font-bold text-[var(--admin-text-main)]">
                        {lead.name}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] text-[var(--admin-text-muted)]">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {lead.email || '—'}
                        </span>
                        {lead.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {lead.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="hidden p-4 sm:table-cell">
                      <p className="max-w-[150px] truncate text-[11px] font-semibold text-[var(--admin-text-main)]">
                        {lead.destination ?? t('admin.list.genericInterest')}
                      </p>
                      <p className="max-w-[150px] truncate text-[10px] text-[var(--admin-text-muted)]">
                        {t('admin.list.origin')}: {lead.origin ?? t('admin.list.originUnknown')}
                      </p>
                    </td>
                    <td className="hidden p-4 md:table-cell">
                      <select
                        value={lead.consultantId ?? ''}
                        onChange={(e) => void handleConsultantChange(lead.id, e.target.value)}
                        aria-label={t('admin.leads.responsible')}
                        className="h-7 max-w-[140px] rounded border border-[var(--admin-border)] bg-transparent px-2 text-[10px] text-[var(--admin-text-main)] focus:border-[var(--admin-primary)] focus:outline-none"
                      >
                        <option value="">{t('admin.leads.unassigned')}</option>
                        {consultants.map((consultant) => (
                          <option key={consultant.id} value={consultant.id}>
                            {consultant.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4">
                      <select
                        value={lead.status}
                        onChange={(e) => void handleStatusChange(lead.id, e.target.value)}
                        aria-label={t('admin.list.statusPaid')}
                        className={`cursor-pointer appearance-none rounded-full border px-2 py-1 text-[10px] font-bold outline-none ${
                          STATUS_STYLE[lead.status] ?? ''
                        }`}
                      >
                        {statusOptions
                          .filter((option) => option.value !== '')
                          .map((option) => (
                            <option key={option.value} value={option.value}>
                              {t(option.labelKey)}
                            </option>
                          ))}
                      </select>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                        <button
                          type="button"
                          onClick={() => void handleDelete(lead.id, lead.name)}
                          aria-label={t('admin.leads.deleteConfirm').replace('{name}', lead.name)}
                          className="rounded-md p-1.5 text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-accent-red)]/10 hover:text-[var(--admin-accent-red)]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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

      {/* ── Novo lead ──────────────────────────────────── */}
      <AnimatePresence>
        {isLeadModalOpen && (
          <>
            <motion.button
              type="button"
              aria-label={t('admin.common.cancel')}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeLeadModal}
              className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 z-[101] flex max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-bg)] shadow-2xl"
            >
              <header className="flex items-center justify-between gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
                <h3 className="text-lg font-bold text-[var(--admin-text-main)]">{t('admin.leads.newLead')}</h3>
                <button
                  type="button"
                  onClick={closeLeadModal}
                  aria-label={t('admin.common.cancel')}
                  className="text-[var(--admin-text-muted)] transition-colors hover:text-[var(--admin-text-main)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </header>

              <form id="leadForm" onSubmit={handleCreateLead} className="flex flex-col gap-4 overflow-y-auto p-6">
                <p className="text-[10px] text-[var(--admin-text-muted)]">{t('admin.leads.newLeadHint')}</p>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="lead-name" className="text-xs font-semibold text-[var(--admin-text-main)]">
                    {t('admin.leads.fieldName')} *
                  </label>
                  <Input
                    id="lead-name"
                    required
                    value={leadForm.name}
                    onChange={(e) => setLeadForm((prev) => ({ ...prev, name: e.target.value }))}
                    aria-invalid={Boolean(leadErrors.name)}
                    className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                  />
                  {leadErrors.name && (
                    <span className="text-[10px] text-[var(--admin-accent-red)]">{leadErrors.name}</span>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="lead-email" className="text-xs font-semibold text-[var(--admin-text-main)]">
                      {t('admin.leads.fieldEmail')}
                    </label>
                    <Input
                      id="lead-email"
                      type="email"
                      value={leadForm.email}
                      onChange={(e) => setLeadForm((prev) => ({ ...prev, email: e.target.value }))}
                      aria-invalid={Boolean(leadErrors.email)}
                      className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                    />
                    {leadErrors.email && (
                      <span className="text-[10px] text-[var(--admin-accent-red)]">{leadErrors.email}</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="lead-phone" className="text-xs font-semibold text-[var(--admin-text-main)]">
                      {t('admin.leads.fieldPhone')}
                    </label>
                    <Input
                      id="lead-phone"
                      inputMode="tel"
                      value={leadForm.phone}
                      onChange={(e) => setLeadForm((prev) => ({ ...prev, phone: e.target.value }))}
                      className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="lead-destination" className="text-xs font-semibold text-[var(--admin-text-main)]">
                      {t('admin.leads.fieldDestination')}
                    </label>
                    <Input
                      id="lead-destination"
                      value={leadForm.destination}
                      onChange={(e) => setLeadForm((prev) => ({ ...prev, destination: e.target.value }))}
                      className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="lead-budget" className="text-xs font-semibold text-[var(--admin-text-main)]">
                      {t('admin.leads.fieldBudget')}
                    </label>
                    <Input
                      id="lead-budget"
                      inputMode="decimal"
                      value={leadForm.budget}
                      onChange={(e) => setLeadForm((prev) => ({ ...prev, budget: e.target.value }))}
                      placeholder="15000,00"
                      aria-invalid={Boolean(leadErrors.budget)}
                      className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                    />
                    {leadErrors.budget && (
                      <span className="text-[10px] text-[var(--admin-accent-red)]">{leadErrors.budget}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="lead-origin" className="text-xs font-semibold text-[var(--admin-text-main)]">
                      {t('admin.leads.fieldOrigin')}
                    </label>
                    <Input
                      id="lead-origin"
                      value={leadForm.origin}
                      onChange={(e) => setLeadForm((prev) => ({ ...prev, origin: e.target.value }))}
                      placeholder={t('admin.leads.originPlaceholder')}
                      className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="lead-consultant" className="text-xs font-semibold text-[var(--admin-text-main)]">
                      {t('admin.leads.responsible')}
                    </label>
                    <select
                      id="lead-consultant"
                      value={leadForm.consultantId}
                      onChange={(e) => setLeadForm((prev) => ({ ...prev, consultantId: e.target.value }))}
                      className="h-10 rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 text-sm text-[var(--admin-text-main)] focus:border-[var(--admin-primary)] focus:outline-none"
                    >
                      <option value="">{t('admin.leads.unassigned')}</option>
                      {consultants.map((consultant) => (
                        <option key={consultant.id} value={consultant.id}>
                          {consultant.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="lead-notes" className="text-xs font-semibold text-[var(--admin-text-main)]">
                    {t('admin.leads.fieldNotes')}
                  </label>
                  <textarea
                    id="lead-notes"
                    value={leadForm.notes}
                    onChange={(e) => setLeadForm((prev) => ({ ...prev, notes: e.target.value }))}
                    className="flex min-h-[80px] w-full resize-none rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm text-[var(--admin-text-main)] focus-visible:border-[var(--admin-primary)] focus-visible:outline-none"
                  />
                </div>
              </form>

              <footer className="flex justify-end gap-3 border-t border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeLeadModal}
                  disabled={isLeadSubmitting}
                  className="border-[var(--admin-border)] text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50"
                >
                  {t('admin.common.cancel')}
                </Button>
                <Button
                  form="leadForm"
                  type="submit"
                  disabled={isLeadSubmitting}
                  className="bg-[var(--admin-primary)] font-semibold text-black hover:bg-[var(--admin-primary-hover)]"
                >
                  {isLeadSubmitting ? t('admin.state.loading') : t('admin.common.create')}
                </Button>
              </footer>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

