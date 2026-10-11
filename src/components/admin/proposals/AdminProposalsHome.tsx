'use client';

/**
 * Propostas â€” tela que nÃ£o existia.
 *
 * `Proposal`, `ProposalItem` e `Booking` existiam no schema, o portal do cliente
 * jÃ¡ aprova propostas (`approveClientProposal`) e `/proposta/[unique_link]`
 * exibe o link pÃºblico â€” mas nenhuma tela do painel listava ou criava propostas.
 *
 * ## Contrato lido nas actions (nÃ£o deduzido)
 *
 * - `getProposals({ page, pageSize, status, consultantId })`: `consultantId` sÃ³
 *   Ã© respeitado para admin; para atendente a action FORÃ‡A o prÃ³prio id no
 *   `where`. Por isso a tela nÃ£o manda `consultantId` na listagem.
 * - `createProposal(input)`: cria SEMPRE como `draft`, monta o `uniqueLink` com
 *   `crypto.randomUUID()` (nada de `Date.now()`), soma `quantity * price` quando
 *   `totalValue` vem vazio/zero, aceita `leadId` alÃ©m de `customerId` e notifica
 *   o cliente. `customerId` Ã© obrigatÃ³rio; `consultantId` Ã© opcional e ignorado
 *   para nÃ£o-admin.
 * - `items`: `pick()` transforma cada objeto em JSON e junta com `\n`;
 *   `normalizeItems` roda `parseStringArray` e faz `JSON.parse` de cada linha,
 *   ignorando a linha que nÃ£o for objeto vÃ¡lido. Mandamos array de objetos.
 * - `updateProposalStatus(id, status)`: aceita `draft|sent|viewed|approved|
 *   rejected|expired`, valida posse no banco, marca `viewedAt` em `viewed` e
 *   fecha o `Lead` quando a proposta foi aprovada.
 *
 * ## Lista de clientes/consultoras
 *
 * `getUsers({ role: 'customer' })` e `getConsultants()` sÃ£o `requireAdmin()`.
 * Se falharem, a lista de propostas continua funcionando e apenas os seletores
 * do formulÃ¡rio ficam vazios (com aviso visÃ­vel) â€” nunca o contrÃ¡rio.
 *
 * ## Busca
 *
 * `getProposals` aceita `search` e filtra no servidor (debounce de 300 ms).
 */
import { useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  FileText,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  createProposal,
  getProposals,
  updateProposalStatus,
} from '@/actions/businessActions';
import { getConsultants, getUsers } from '@/actions/usersActions';
import AdminPagination from '@/components/admin/ui/Pagination';
import { useDebouncedValue } from '@/components/admin/ui/useDebouncedValue';
import { useMountedLoad } from '@/components/admin/ui/useMountedLoad';
import {
  AdminEmptyState,
  AdminErrorState,
  AdminPageHeader,
  AdminTableSkeleton,
} from '@/components/admin/ui/States';

interface ProposalItemRow {
  id: string;
  name: string;
  type: string;
  refId: string | null;
  quantity: number;
  price: number;
  details: string | null;
}

interface ProposalRow {
  id: string;
  title: string;
  status: string;
  totalValue: number;
  uniqueLink: string | null;
  consultantId: string;
  customerId: string | null;
  leadId: string | null;
  version: number;
  notes: string | null;
  validUntil: string | null;
  viewedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  consultant?: { id: string; name: string; email: string } | null;
  customer?: { id: string; name: string; email: string } | null;
  lead?: { id: string; name: string; email: string } | null;
  items?: ProposalItemRow[];
}

interface OptionRow {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

interface ConsultantRow {
  id: string;
  name: string;
  role: string;
}

interface ItemDraft {
  key: string;
  name: string;
  type: string;
  quantity: string;
  price: string;
  details: string;
}

interface ProposalForm {
  title: string;
  customerId: string;
  consultantId: string;
  validUntil: string;
  notes: string;
  totalValue: string;
}

const EMPTY_FORM: ProposalForm = {
  title: '',
  customerId: '',
  consultantId: '',
  validUntil: '',
  notes: '',
  totalValue: '',
};

const ITEM_TYPES = ['package', 'experience', 'journey', 'service', 'discount'] as const;

const STATUS_KEYS: Record<string, string> = {
  draft: 'admin.prop.statusDraft',
  sent: 'admin.prop.statusSent',
  viewed: 'admin.prop.statusViewed',
  approved: 'admin.prop.statusApproved',
  rejected: 'admin.prop.statusRejected',
  expired: 'admin.prop.statusExpired',
};

const STATUS_BADGE: Record<string, string> = {
  draft: 'border-gray-700 bg-gray-900/30 text-gray-400',
  sent: 'border-blue-800 bg-blue-900/30 text-blue-400',
  viewed: 'border-cyan-800 bg-cyan-900/30 text-cyan-400',
  approved: 'border-green-800 bg-green-900/30 text-green-400',
  rejected: 'border-red-800 bg-red-900/30 text-red-400',
  expired: 'border-yellow-800 bg-yellow-900/30 text-yellow-400',
};

/** TransiÃ§Ãµes de status coherence com o fluxo comercial (o action aceita todas). */
const TRANSITIONS: Record<string, readonly string[]> = {
  draft: ['sent', 'expired'],
  sent: ['viewed', 'approved', 'rejected', 'expired'],
  viewed: ['approved', 'rejected', 'expired'],
  approved: ['expired'],
  rejected: ['draft', 'expired'],
  expired: ['draft', 'sent'],
};

function newItem(): ItemDraft {
  return { key: crypto.randomUUID(), name: '', type: 'package', quantity: '1', price: '', details: '' };
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

/** As actions devolvem `ActionResult<unknown>`: lÃª o status sem `any`. */
function statusFromResult(data: unknown, fallback: string): string {
  if (data && typeof data === 'object' && 'status' in data && typeof data.status === 'string') {
    return data.status;
  }
  return fallback;
}

export default function AdminProposalsHome() {
  const { t, formatCurrency, formatDate, formatNumber } = useLanguage();
  const { toast } = useToast();

  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [customers, setCustomers] = useState<OptionRow[]>([]);
  const [consultants, setConsultants] = useState<ConsultantRow[]>([]);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ProposalForm>(EMPTY_FORM);
  const [items, setItems] = useState<ItemDraft[]>(() => [newItem()]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const debouncedSearch = useDebouncedValue(search);

  const loadProposals = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getProposals({
      page,
      pageSize,
      status: statusFilter || undefined,
      search: debouncedSearch.trim() || undefined,
    });
    if (res.success) {
      setProposals((res.items ?? []) as unknown as ProposalRow[]);
      setTotal(res.total ?? 0);
      setTotalPages(res.totalPages ?? 1);
    } else {
      setProposals([]);
      setTotal(0);
      setTotalPages(1);
      setError(res.error ?? t('state.errorTitle'));
    }
    setLoading(false);
  }, [page, pageSize, statusFilter, debouncedSearch, t]);

  useMountedLoad(loadProposals);

  /** Seletores do formulÃ¡rio: carregados uma vez, independentes da paginaÃ§Ã£o. */
  const loadOptions = useCallback(async () => {
    setLoadingOptions(true);
    const [customerRes, consultantRes] = await Promise.all([
      getUsers({ role: 'customer', pageSize: 100 }),
      getConsultants(),
    ]);

    if (customerRes.success) {
      setCustomers(
        (customerRes.items ?? [])
          .map((row) => row as unknown as OptionRow)
          .filter((row) => row.isActive !== false),
      );
    }
    if (consultantRes.success && consultantRes.data) {
      setConsultants(consultantRes.data as ConsultantRow[]);
    }
    if (!customerRes.success && !consultantRes.success) {
      setOptionsError(customerRes.error ?? consultantRes.error ?? t('state.errorTitle'));
    }
    setLoadingOptions(false);
  }, [t]);

  useMountedLoad(loadOptions);

const visibleProposals = useMemo(() => proposals, [proposals]);

  const statusLabel = useCallback(
    (status: string): string => t(STATUS_KEYS[status] ?? STATUS_KEYS.draft!),
    [t],
  );

  const itemTypeLabel = useCallback(
    (type: string): string => {
      switch (type) {
        case 'experience':
          return t('admin.props.itemTypeExperience');
        case 'journey':
          return t('admin.props.itemTypeJourney');
        case 'service':
          return t('admin.props.itemTypeService');
        case 'discount':
          return t('admin.props.itemTypeDiscount');
        default:
          return t('admin.props.itemTypePackage');
      }
    },
    [t],
  );

  const clientOf = useCallback(
    (proposal: ProposalRow): { name: string; isLead: boolean } => {
      if (proposal.customer?.name) return { name: proposal.customer.name, isLead: false };
      if (proposal.lead?.name) return { name: proposal.lead.name, isLead: true };
      return { name: t('admin.prop.client'), isLead: false };
    },
    [t],
  );

  /** Soma sÃ³ das linhas preenchidas â€” Ã© o que `createProposal` receberia. */
  const itemsTotal = useMemo(
    () =>
      items
        .filter((item) => item.name.trim().length > 0)
        .reduce((sum, item) => {
          const price = parseDecimal(item.price) ?? 0;
          const quantity = Math.max(1, Math.trunc(Number(item.quantity) || 1));
          return sum + price * quantity;
        }, 0),
    [items],
  );

  const openModal = () => {
    setFormErrors({});
    setFormData(EMPTY_FORM);
    setItems([newItem()]);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(EMPTY_FORM);
    setItems([newItem()]);
    setFormErrors({});
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const errors: Record<string, string> = {};

    if (formData.title.trim().length < 2) errors.title = t('admin.props.titleRequired');
    if (!formData.customerId) errors.customerId = t('admin.props.customerRequired');

    const filled = items.filter((item) => item.name.trim().length > 0);
    if (filled.length === 0) {
      errors.items = t('admin.props.itemsRequired');
    } else if (
      filled.some((item) => {
        const price = parseDecimal(item.price);
        return price === null || price < 0;
      })
    ) {
      errors.items = t('admin.props.itemsInvalid');
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const manualTotal = parseDecimal(formData.totalValue);

    setIsSubmitting(true);
    const res = await createProposal({
      title: formData.title.trim(),
      customerId: formData.customerId,
      consultantId: formData.consultantId,
      validUntil: formData.validUntil,
      notes: formData.notes,
      totalValue: manualTotal !== null && manualTotal > 0 ? manualTotal : itemsTotal,
      // `pick()` serializa cada objeto em JSON e `normalizeItems` reidrata.
      items: filled.map((item) => ({
        name: item.name.trim(),
        type: item.type,
        refId: '',
        quantity: Math.max(1, Math.trunc(Number(item.quantity) || 1)),
        price: parseDecimal(item.price) ?? 0,
        details: item.details.trim(),
      })),
    });
    setIsSubmitting(false);

    if (res.success) {
      toast(t('admin.props.created'));
      closeModal();
      setPage(1);
      await loadProposals();
    } else {
      toast(res.error ?? t('state.errorTitle'), 'error');
    }
  };

  const handleStatusChange = async (proposal: ProposalRow, next: string) => {
    if (next === proposal.status) return;
    setBusy(true);
    const res = await updateProposalStatus(proposal.id, next);
    setBusy(false);
    if (res.success) {
      toast(
        t('admin.props.statusChanged').replace(
          '{status}',
          statusLabel(statusFromResult(res.data, next)),
        ),
      );
      await loadProposals();
    } else {
      toast(res.error ?? t('state.errorTitle'), 'error');
    }
  };

  const handleCopyLink = async (proposal: ProposalRow) => {
    if (!proposal.uniqueLink) {
      toast(t('admin.props.noLink'), 'error');
      return;
    }
    const url = `${window.location.origin}/proposta/${proposal.uniqueLink}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(proposal.id);
      window.setTimeout(() => setCopiedId(null), 2500);
    } catch {
      toast(t('admin.props.copyFailed'), 'error');
    }
  };

  const isFiltering = Boolean(debouncedSearch.trim());

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-full flex-col gap-6"
    >
      <AdminPageHeader
        icon={<FileText className="w-5 h-5" />}
        title={t('admin.props.title')}
        subtitle={t('admin.props.subtitle').replace('{count}', formatNumber(total))}
        actions={
          <>
            <Button
              onClick={loadProposals}
              variant="outline"
              aria-label={t('common.refresh')}
              className="h-9 border-[var(--admin-border)] px-3 text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              onClick={openModal}
              className="h-9 bg-[var(--admin-primary)] px-4 font-semibold text-black hover:bg-[var(--admin-primary-hover)]"
            >
              <Plus className="w-4 h-4 mr-1" /> {t('admin.props.newProposal')}
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
          placeholder={t('admin.props.search')}
          aria-label={t('admin.props.search')}
          className="h-9 max-w-md flex-1 bg-[var(--admin-card)] text-xs text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          aria-label={t('admin.props.allStatuses')}
          className="h-9 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 text-xs text-[var(--admin-text-muted)] focus:border-[var(--admin-primary)] focus:outline-none"
        >
          <option value="">{t('admin.props.allStatuses')}</option>
          {Object.keys(STATUS_KEYS).map((status) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </select>
      </div>

      <p className="text-[10px] text-[var(--admin-text-muted)]">{t('admin.props.transitionHint')}</p>

      {error ? (
        <AdminErrorState message={error} onRetry={loadProposals} />
      ) : loading && proposals.length === 0 ? (
        <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)]">
          <AdminTableSkeleton rows={6} columns={4} />
        </div>
      ) : visibleProposals.length === 0 ? (
        <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)]">
          <AdminEmptyState
            title={t('admin.props.empty')}
            description={isFiltering ? t('state.searchEmptyHint') : undefined}
            icon={<FileText className="w-5 h-5" />}
            action={
              <Button
                onClick={openModal}
                className="mt-2 bg-[var(--admin-primary)] font-semibold text-black hover:bg-[var(--admin-primary-hover)]"
              >
                <Plus className="w-4 h-4 mr-1" /> {t('admin.props.createFirst')}
              </Button>
            }
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visibleProposals.map((proposal) => {
            const client = clientOf(proposal);
            const expanded = expandedId === proposal.id;
            return (
              <motion.div
                key={proposal.id}
                layout
                className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] transition-colors hover:border-[var(--admin-primary)]/40"
              >
                <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--admin-border)]">
                      <User className="w-4 h-4 text-[var(--admin-text-muted)]" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[var(--admin-text-main)]">
                        {proposal.title}
                      </p>
                      <p className="truncate text-[10px] text-[var(--admin-text-muted)]">
                        {client.name}
                        {client.isLead ? ` Â· ${t('admin.props.leadCustomer')}` : ''}
                        {proposal.consultant?.name ? ` Â· ${proposal.consultant.name}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-center">
                      <p className="text-[9px] uppercase text-[var(--admin-text-muted)]">
                        {t('admin.prop.total')}
                      </p>
                      <p className="text-xs font-bold text-[var(--admin-accent-green)]">
                        {formatCurrency(proposal.totalValue)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] uppercase text-[var(--admin-text-muted)]">
                        {t('admin.props.version')}
                      </p>
                      <p className="text-xs text-[var(--admin-text-main)]">
                        {formatNumber(proposal.version)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] uppercase text-[var(--admin-text-muted)]">
                        {t('admin.prop.validUntil')}
                      </p>
                      <p className="text-[10px] text-[var(--admin-text-muted)]">
                        {proposal.validUntil ? formatDate(proposal.validUntil) : t('admin.prop.noValidUntil')}
                      </p>
                    </div>

                    <label className="flex flex-col gap-1">
                      <span className="sr-only">{t('admin.props.allStatuses')}</span>
                      <select
                        value={proposal.status}
                        disabled={busy}
                        onChange={(e) => void handleStatusChange(proposal, e.target.value)}
                        aria-label={t('admin.props.statusOf')}
                        className={`cursor-pointer appearance-none rounded border px-2 py-1 text-[10px] font-bold outline-none disabled:opacity-50 ${
                          STATUS_BADGE[proposal.status] ?? STATUS_BADGE.draft
                        }`}
                      >
                        {[proposal.status, ...(TRANSITIONS[proposal.status] ?? [])].map((status) => (
                          <option key={status} value={status}>
                            {statusLabel(status)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : proposal.id)}
                      aria-expanded={expanded}
                      aria-label={expanded ? t('admin.props.hideDetail') : t('admin.props.showDetail')}
                      className="rounded-md p-1.5 text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-border)] hover:text-[var(--admin-primary)]"
                    >
                      {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {expanded && (
                  <div className="border-t border-[var(--admin-border)] bg-[var(--admin-bg)]/40 p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--admin-text-muted)]">
                        {t('admin.prop.items')}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[var(--admin-text-muted)]">
                          {t('admin.props.itemsCount').replace(
                            '{count}',
                            formatNumber(proposal.items?.length ?? 0),
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => void handleCopyLink(proposal)}
                          aria-label={t('admin.props.copyLink')}
                          title={t('admin.props.copyLink')}
                          className="inline-flex items-center gap-1 rounded border border-[var(--admin-border)] px-2 py-1 text-[10px] font-semibold text-[var(--admin-text-main)] transition-colors hover:bg-[var(--admin-border)]/50"
                        >
                          <Copy className="w-3 h-3" /> {t('admin.props.copyLink')}
                        </button>
                        {proposal.uniqueLink ? (
                          <a
                            href={`/proposta/${proposal.uniqueLink}`}
                            target="_blank"
                            rel="noreferrer noopener"
                            aria-label={t('admin.props.openLink')}
                            title={t('admin.props.openLink')}
                            className="inline-flex items-center gap-1 rounded border border-[var(--admin-primary)]/50 px-2 py-1 text-[10px] font-semibold text-[var(--admin-primary)] transition-colors hover:bg-[var(--admin-primary)]/10"
                          >
                            <ExternalLink className="w-3 h-3" /> {t('admin.props.openLink')}
                          </a>
                        ) : (
                          <span className="text-[10px] text-[var(--admin-text-muted)]">
                            {t('admin.props.noLink')}
                          </span>
                        )}
                      </div>
                    </div>

                    {copiedId === proposal.id && (
                      <p
                        role="status"
                        className="mb-2 text-[10px] font-semibold text-[var(--admin-accent-green)]"
                      >
                        {t('admin.props.copied')}
                      </p>
                    )}

                    {(proposal.items?.length ?? 0) > 0 ? (
                      <div className="overflow-x-auto rounded-lg border border-[var(--admin-border)]">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-[var(--admin-border)] bg-black/5 text-[9px] uppercase tracking-wider text-[var(--admin-text-muted)]">
                              <th className="p-3 font-semibold">{t('admin.props.itemName')}</th>
                              <th className="p-3 font-semibold">{t('admin.props.itemType')}</th>
                              <th className="p-3 text-right font-semibold">{t('admin.props.quantity')}</th>
                              <th className="p-3 text-right font-semibold">{t('admin.props.unitPrice')}</th>
                              <th className="p-3 text-right font-semibold">{t('admin.props.itemTotal')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {proposal.items?.map((item) => (
                              <tr
                                key={item.id}
                                className="border-b border-[var(--admin-border)] last:border-0"
                              >
                                <td className="p-3">
                                  <p className="text-[11px] font-semibold text-[var(--admin-text-main)]">
                                    {item.name}
                                  </p>
                                  {item.details && (
                                    <p className="text-[10px] text-[var(--admin-text-muted)]">
                                      {item.details}
                                    </p>
                                  )}
                                </td>
                                <td className="p-3 text-[10px] text-[var(--admin-text-muted)]">
                                  {itemTypeLabel(item.type)}
                                </td>
                                <td className="p-3 text-right text-[11px] text-[var(--admin-text-main)]">
                                  {formatNumber(item.quantity)}
                                </td>
                                <td className="p-3 text-right text-[11px] text-[var(--admin-text-main)]">
                                  {formatCurrency(item.price)}
                                </td>
                                <td className="p-3 text-right text-[11px] font-bold text-[var(--admin-accent-green)]">
                                  {formatCurrency(item.price * item.quantity)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-[11px] text-[var(--admin-text-muted)]">
                        {t('admin.props.itemsRequired')}
                      </p>
                    )}

                    <dl className="mt-3 grid grid-cols-1 gap-2 text-[10px] text-[var(--admin-text-muted)] sm:grid-cols-3">
                      <div>
                        <dt className="font-semibold text-[var(--admin-text-main)]">
                          {t('admin.props.createdAt')}
                        </dt>
                        <dd>{proposal.createdAt ? formatDate(proposal.createdAt) : 'â€”'}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-[var(--admin-text-main)]">
                          {t('admin.props.versionLabel')}
                        </dt>
                        <dd>{proposal.updatedAt ? formatDate(proposal.updatedAt) : 'â€”'}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-[var(--admin-text-main)]">
                          {t('admin.props.viewedAt')}
                        </dt>
                        <dd>{proposal.viewedAt ? formatDate(proposal.viewedAt) : 'â€”'}</dd>
                      </div>
                    </dl>

                    {proposal.notes && (
                      <p className="mt-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] p-3 text-[11px] text-[var(--admin-text-main)]">
                        {proposal.notes}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
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

      {/* â”€â”€ Nova proposta â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
                  {t('admin.props.newProposal')}
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
                <form id="proposalForm" onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="prop-title"
                      className="text-xs font-semibold text-[var(--admin-text-main)]"
                    >
                      {t('admin.props.title')} *
                    </label>
                    <Input
                      id="prop-title"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder={t('admin.prop.itemPlaceholder')}
                      aria-invalid={Boolean(formErrors.title)}
                      className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                    />
                    {formErrors.title && (
                      <span className="text-[10px] text-[var(--admin-accent-red)]">
                        {formErrors.title}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="prop-customer"
                        className="text-xs font-semibold text-[var(--admin-text-main)]"
                      >
                        {t('admin.prop.client')} *
                      </label>
                      <select
                        id="prop-customer"
                        value={formData.customerId}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, customerId: e.target.value }))
                        }
                        aria-invalid={Boolean(formErrors.customerId)}
                        className="h-10 rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 text-sm text-[var(--admin-text-main)] focus:border-[var(--admin-primary)] focus:outline-none"
                      >
                        <option value="">{t('admin.props.selectCustomer')}</option>
                        {customers.map((customer) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.name}
                          </option>
                        ))}
                      </select>
                      {formErrors.customerId ? (
                        <span className="text-[10px] text-[var(--admin-accent-red)]">
                          {formErrors.customerId}
                        </span>
                      ) : (
                        <span className="text-[10px] text-[var(--admin-text-muted)]">
                          {loadingOptions
                            ? t('admin.state.loading')
                            : customers.length === 0
                              ? t('admin.props.noCustomers')
                              : ''}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="prop-consultant"
                        className="text-xs font-semibold text-[var(--admin-text-main)]"
                      >
                        {t('admin.prop.consultant')}
                      </label>
                      <select
                        id="prop-consultant"
                        value={formData.consultantId}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, consultantId: e.target.value }))
                        }
                        className="h-10 rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 text-sm text-[var(--admin-text-main)] focus:border-[var(--admin-primary)] focus:outline-none"
                      >
                        <option value="">{t('admin.props.selectConsultant')}</option>
                        {consultants.map((consultant) => (
                          <option key={consultant.id} value={consultant.id}>
                            {consultant.name}
                          </option>
                        ))}
                      </select>
                      <span className="text-[10px] text-[var(--admin-text-muted)]">
                        {consultants.length === 0 && !loadingOptions
                          ? t('admin.props.nothingToSelect')
                          : t('admin.props.consultantHint')}
                      </span>
                    </div>
                  </div>

                  {optionsError && (
                    <p className="text-[10px] text-[var(--admin-accent-red)]">{optionsError}</p>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="prop-valid-until"
                        className="text-xs font-semibold text-[var(--admin-text-main)]"
                      >
                        {t('admin.props.validity')}
                      </label>
                      <Input
                        id="prop-valid-until"
                        type="date"
                        value={formData.validUntil}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, validUntil: e.target.value }))
                        }
                        className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="prop-total"
                        className="text-xs font-semibold text-[var(--admin-text-main)]"
                      >
                        {t('admin.props.totalValue')}
                      </label>
                      <Input
                        id="prop-total"
                        inputMode="decimal"
                        value={formData.totalValue}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, totalValue: e.target.value }))
                        }
                        placeholder={formatCurrency(itemsTotal)}
                        className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                      />
                      <span className="text-[10px] text-[var(--admin-text-muted)]">
                        {t('admin.props.totalAuto')}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="prop-notes"
                      className="text-xs font-semibold text-[var(--admin-text-main)]"
                    >
                      {t('admin.props.notes')}
                    </label>
                    <textarea
                      id="prop-notes"
                      value={formData.notes}
                      onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                      className="flex min-h-[70px] w-full resize-y rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm text-[var(--admin-text-main)] focus-visible:border-[var(--admin-primary)] focus-visible:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-2 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-[var(--admin-text-main)]">
                        {t('admin.prop.items')}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setItems((prev) => [...prev, newItem()])}
                        aria-label={t('admin.props.addItem')}
                        className="h-8 border-[var(--admin-border)] px-3 text-xs text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> {t('admin.props.addItem')}
                      </Button>
                    </div>

                    {formErrors.items && (
                      <span className="text-[10px] text-[var(--admin-accent-red)]">
                        {formErrors.items}
                      </span>
                    )}

                    {items.map((item, index) => (
                      <div
                        key={item.key}
                        className="flex flex-col gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] p-3"
                      >
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[2fr_1fr]">
                          <div className="flex flex-col gap-1">
                            <label
                              htmlFor={`prop-item-name-${item.key}`}
                              className="text-[10px] text-[var(--admin-text-muted)]"
                            >
                              {t('admin.props.itemName')}
                            </label>
                            <Input
                              id={`prop-item-name-${item.key}`}
                              value={item.name}
                              onChange={(e) =>
                                setItems((prev) =>
                                  prev.map((row) =>
                                    row.key === item.key ? { ...row, name: e.target.value } : row,
                                  ),
                                )
                              }
                              className="h-9 bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)]"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label
                              htmlFor={`prop-item-type-${item.key}`}
                              className="text-[10px] text-[var(--admin-text-muted)]"
                            >
                              {t('admin.props.itemType')}
                            </label>
                            <select
                              id={`prop-item-type-${item.key}`}
                              value={item.type}
                              onChange={(e) =>
                                setItems((prev) =>
                                  prev.map((row) =>
                                    row.key === item.key ? { ...row, type: e.target.value } : row,
                                  ),
                                )
                              }
                              className="h-9 rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-2 text-xs text-[var(--admin-text-main)] focus:border-[var(--admin-primary)] focus:outline-none"
                            >
                              {ITEM_TYPES.map((type) => (
                                <option key={type} value={type}>
                                  {itemTypeLabel(type)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_auto]">
                          <div className="flex flex-col gap-1">
                            <label
                              htmlFor={`prop-item-qty-${item.key}`}
                              className="text-[10px] text-[var(--admin-text-muted)]"
                            >
                              {t('admin.props.quantity')}
                            </label>
                            <Input
                              id={`prop-item-qty-${item.key}`}
                              inputMode="numeric"
                              value={item.quantity}
                              onChange={(e) =>
                                setItems((prev) =>
                                  prev.map((row) =>
                                    row.key === item.key
                                      ? { ...row, quantity: e.target.value }
                                      : row,
                                  ),
                                )
                              }
                              className="h-9 bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)]"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label
                              htmlFor={`prop-item-price-${item.key}`}
                              className="text-[10px] text-[var(--admin-text-muted)]"
                            >
                              {t('admin.props.unitPrice')}
                            </label>
                            <Input
                              id={`prop-item-price-${item.key}`}
                              inputMode="decimal"
                              value={item.price}
                              onChange={(e) =>
                                setItems((prev) =>
                                  prev.map((row) =>
                                    row.key === item.key ? { ...row, price: e.target.value } : row,
                                  ),
                                )
                              }
                              className="h-9 bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)]"
                            />
                          </div>
                          <button
                            type="button"
                            disabled={items.length === 1}
                            onClick={() =>
                              setItems((prev) => prev.filter((row) => row.key !== item.key))
                            }
                            aria-label={t('admin.props.removeItem')}
                            title={t('admin.props.removeItem')}
                            className="mt-auto h-9 rounded-md border border-[var(--admin-border)] px-2 text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-accent-red)]/10 hover:text-[var(--admin-accent-red)] disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label
                            htmlFor={`prop-item-details-${item.key}`}
                            className="text-[10px] text-[var(--admin-text-muted)]"
                          >
                            {t('admin.props.notes')}
                          </label>
                          <Input
                            id={`prop-item-details-${item.key}`}
                            value={item.details}
                            onChange={(e) =>
                              setItems((prev) =>
                                prev.map((row) =>
                                  row.key === item.key ? { ...row, details: e.target.value } : row,
                                ),
                              )
                            }
                            className="h-9 bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)]"
                          />
                        </div>

                        <p className="text-right text-[10px] font-bold text-[var(--admin-accent-green)]">
                          {t('admin.props.itemTotal')}:{' '}
                          {formatCurrency(
                            (parseDecimal(item.price) ?? 0) *
                              Math.max(1, Math.trunc(Number(item.quantity) || 1)),
                          )}
                        </p>
                        <span className="sr-only">
                          {t('admin.props.itemsCount').replace('{count}', String(index + 1))}
                        </span>
                      </div>
                    ))}
                  </div>
                </form>
              </div>

              <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
                <p className="text-[10px] text-[var(--admin-text-muted)]">
                  {t('admin.props.totalValue')}: {formatCurrency(itemsTotal)}
                </p>
                <div className="flex gap-3">
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
                    form="proposalForm"
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[var(--admin-primary)] font-semibold text-black hover:bg-[var(--admin-primary-hover)]"
                  >
                    {isSubmitting ? (
                      t('admin.state.loading')
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-1" /> {t('admin.common.create')}
                      </>
                    )}
                  </Button>
                </div>
              </footer>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
