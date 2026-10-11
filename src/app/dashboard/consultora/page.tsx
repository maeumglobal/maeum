'use client';

/**
 * Portal da consultora (`/dashboard/consultora`).
 *
 * ## O que mudou em relação à versão anterior
 *
 * **Identidade.** Não existe mais o antigo serviço de autenticação do Supabase
 * nem qualquer id fixo: o `id` vem de `useAuth()` e TODAS as leituras são
 * filtradas no servidor. Antes, a lista de conversas, os leads e o filtro
 * `consultantId` da própria consultora comparavam o uid do Supabase Auth com o
 * `User.id` do Prisma — dois universos que nunca se intersectavam, então os
 * três maiores blocos do painel sempre mostravam zero.
 *
 * **Números.** Saíram `|| 28450`, `metaMensal = 37000`,
 * `comissaoEstimada = totalVendido * 0.15`, as tendências `+20%/+15%/+40%`, o
 * badge `5` fixo no sino, as 4 "Próximas Atividades" inventadas e o
 * `percentMeta`. Tudo o que aparece agora é `count`/`aggregate` do Postgres via
 * `getConsultantOverview()`, ou "—" quando não há base para o cálculo.
 *
 * **Escopo.** `getProposals`/`getBookings`/`getLeads` recebem o filtro do
 * próprio papel: para a consultora o `WHERE` é `consultantId = ctx.user.id`, no
 * banco. Antes o componente baixava TODAS as propostas e TODAS as reservas e
 * filtrava depois — vazamento de nome, e-mail, telefone e valor de clientes de
 * outras consultoras.
 *
 * **UX morto.** Menu, sino, busca e botões são elementos interativos de verdade
 * (`Link`/`button` com `aria-current`); a busca é controlada, com debounce, e vai
 * para o `WHERE` da action.
 *
 * **Status.** `StatusBadge` compara com os status REAIS de `Lead`
 * (`novo | contato | atendimento | proposta | proposta_enviada | fechado |
 * perdido`). Antes comparava com `atendimento | contact | proposal` e caía
 * sempre no default.
 */

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Calendar,
  Check,
  CreditCard,
  ExternalLink,
  FileText,
  MessageSquare,
  Package,
  RefreshCw,
  Search,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { useMountedLoad } from '@/components/admin/ui/useMountedLoad';
import { useDebouncedValue } from '@/components/admin/ui/useDebouncedValue';
import AdminPagination from '@/components/admin/ui/Pagination';
import { getConsultantOverview, getLeads, type ConsultantOverview } from '@/actions/leadsActions';
import { getBookings, getProposals } from '@/actions/businessActions';
import { staffChatList, type ChatRowDto } from '@/actions/chatActions';
import { getAdminStats } from '@/actions/adminActions';

/* ── Linhas das listas ──────────────────────────────────────── */

interface LeadRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  destination: string | null;
  budget: number | null;
  status: string;
  origin: string | null;
  lastContactedAt: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface ProposalRow {
  id: string;
  title: string;
  status: string;
  totalValue: number;
  version: number;
  uniqueLink: string | null;
  validUntil: string | Date | null;
  updatedAt: string | Date;
  customer: { id: string; name: string; email: string } | null;
}

interface BookingRow {
  id: string;
  status: string;
  startDate: string | Date | null;
  endDate: string | Date | null;
  totalPrice: number | null;
  createdAt: string | Date;
  client: { id: string; name: string } | null;
  package: { id: string; title: string; destination: string | null } | null;
}

interface PageState {
  total: number;
  totalPages: number;
  pageSize: number;
}

interface AdminStats {
  metrics: {
    revenue: { value: number };
    bookings: { value: number };
    leads: { value: number };
    conversion: { value: number };
    ticket: { value: number };
  };
}

type TabKey = 'overview' | 'enquiries' | 'proposals' | 'bookings' | 'conversations';

const PAGE_SIZE = 20;

/** Filtros de status que espelham `LEAD_STATUSES` de `@/actions/leadsActions`. */
const LEAD_STATUS_OPTIONS: Array<{ value: string; labelKey: string }> = [
  { value: '', labelKey: 'admin.leads.statusAll' },
  { value: 'novo', labelKey: 'admin.leads.statusNew' },
  { value: 'contato', labelKey: 'admin.leads.statusContact' },
  { value: 'proposta', labelKey: 'admin.cons.leadsStatusProposal' },
  { value: 'proposta_enviada', labelKey: 'admin.cons.leadsStatusSent' },
  { value: 'fechado', labelKey: 'admin.leads.statusClosed' },
  { value: 'perdido', labelKey: 'admin.leads.statusLost' },
];

const MATERIALS: Array<{ href: string; labelKey: string; icon: typeof Package }> = [
  { href: '/pacotes', labelKey: 'home.nav.packages', icon: Package },
  { href: '/experiencias', labelKey: 'home.nav.experiences', icon: Activity },
  { href: '/jornadas', labelKey: 'home.nav.journeys', icon: Calendar },
  { href: '/intercambios', labelKey: 'home.nav.exchange', icon: Users },
  { href: '/termos-de-uso', labelKey: 'home.footer.legal.termsOfUse', icon: FileText },
  { href: '/contato', labelKey: 'home.nav.contact', icon: MessageSquare },
];

const USEFUL_LINKS: Array<{ href: string; labelKey: string }> = [
  { href: '/', labelKey: 'home.nav.home' },
  { href: '/jornadas', labelKey: 'home.nav.journeys' },
  { href: '/contato', labelKey: 'home.nav.contact' },
];

export default function ConsultoraDashboard() {
  const { user, isAdmin } = useAuth();
  const { t, formatCurrency, formatNumber, formatDate, localizedPath } = useLanguage();
  const { toast } = useToast();

  const [tab, setTab] = useState<TabKey>('overview');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [leadStatus, setLeadStatus] = useState('');
  const [leadPage, setLeadPage] = useState(1);
  const [proposalPage, setProposalPage] = useState(1);
  const [bookingPage, setBookingPage] = useState(1);

  const [overview, setOverview] = useState<ConsultantOverview | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [chats, setChats] = useState<ChatRowDto[]>([]);

  const [leadsPage, setLeadsPage] = useState<PageState>({ total: 0, totalPages: 1, pageSize: PAGE_SIZE });
  const [proposalsPage, setProposalsPage] = useState<PageState>({ total: 0, totalPages: 1, pageSize: PAGE_SIZE });
  const [bookingsPage, setBookingsPage] = useState<PageState>({ total: 0, totalPages: 1, pageSize: PAGE_SIZE });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.id ?? null;

  /* ── Formatação (Intl do locale ativo, com guardas de null/NaN) ── */
  const money = useCallback(
    (value: number | null | undefined): string =>
      typeof value === 'number' && Number.isFinite(value) ? formatCurrency(value) : '—',
    [formatCurrency],
  );
  const count = useCallback(
    (value: number | null | undefined): string =>
      typeof value === 'number' && Number.isFinite(value) ? formatNumber(value) : '—',
    [formatNumber],
  );
  const day = useCallback(
    (value: string | Date | null | undefined): string => (value ? formatDate(value) : '—'),
    [formatDate],
  );
  const clock = useCallback(
    (value: string | Date | null | undefined): string =>
      value ? formatDate(value, { hour: '2-digit', minute: '2-digit' }) : '—',
    [formatDate],
  );

  /* ── Carga de dados ────────────────────────────────────────── */

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    try {
      if (tab === 'overview') {
        const [overviewRes, leadsRes, chatsRes, bookingsRes, statsRes] = await Promise.all([
          getConsultantOverview(),
          getLeads({ page: 1, pageSize: 5 }),
          staffChatList({ page: 1, pageSize: 5, status: 'open' }),
          getBookings({ page: 1, pageSize: 5, status: 'confirmed' }),
          isAdmin ? getAdminStats() : Promise.resolve(null),
        ]);

        if (!overviewRes.success) {
          setError(overviewRes.error ?? t('cons.dataError'));
          return;
        }
        setOverview(overviewRes.data ?? null);
        setLeads((leadsRes.items ?? []) as unknown as LeadRow[]);
        setChats((chatsRes.items ?? []) as unknown as ChatRowDto[]);
        setBookings((bookingsRes.items ?? []) as unknown as BookingRow[]);
        setAdminStats((statsRes?.data as AdminStats | undefined) ?? null);
        return;
      }

      if (tab === 'enquiries') {
        const res = await getLeads({
          page: leadPage,
          pageSize: PAGE_SIZE,
          search: debouncedSearch,
          status: leadStatus || undefined,
        });
        if (!res.success) {
          setError(res.error ?? t('cons.dataError'));
          return;
        }
        setLeads((res.items ?? []) as unknown as LeadRow[]);
        setLeadsPage({ total: res.total, totalPages: res.totalPages, pageSize: res.pageSize });
        return;
      }

      if (tab === 'proposals') {
        const res = await getProposals({ page: proposalPage, pageSize: PAGE_SIZE });
        if (!res.success) {
          setError(res.error ?? t('cons.dataError'));
          return;
        }
        setProposals((res.items ?? []) as unknown as ProposalRow[]);
        setProposalsPage({ total: res.total, totalPages: res.totalPages, pageSize: res.pageSize });
        return;
      }

      if (tab === 'bookings') {
        const res = await getBookings({ page: bookingPage, pageSize: PAGE_SIZE });
        if (!res.success) {
          setError(res.error ?? t('cons.dataError'));
          return;
        }
        setBookings((res.items ?? []) as unknown as BookingRow[]);
        setBookingsPage({ total: res.total, totalPages: res.totalPages, pageSize: res.pageSize });
        return;
      }

      const chatsRes = await staffChatList({ page: 1, pageSize: 20, status: 'open' });
      if (!chatsRes.success) {
        setError(chatsRes.error ?? t('cons.dataError'));
        return;
      }
      setChats((chatsRes.items ?? []) as unknown as ChatRowDto[]);
    } catch {
      setError(t('cons.dataError'));
    } finally {
      setLoading(false);
    }
  }, [userId, tab, leadPage, debouncedSearch, leadStatus, proposalPage, bookingPage, isAdmin, t]);

  useMountedLoad(load);

  const changeTab = useCallback((next: TabKey) => {
    setTab(next);
    setError(null);
  }, []);

  /* ── Badges de status (alinhados ao enum real do banco) ────── */

  const leadBadge = useCallback(
    (status: string): { label: string; className: string } => {
      const map: Record<string, { label: string; className: string }> = {
        novo: { label: t('admin.leads.statusNew'), className: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' },
        contato: { label: t('admin.leads.statusContact'), className: 'bg-violet-500/10 text-violet-300 border-violet-500/30' },
        atendimento: { label: t('admin.leads.statusContact'), className: 'bg-violet-500/10 text-violet-300 border-violet-500/30' },
        proposta: { label: t('cons.leadsStatusProposal'), className: 'bg-sky-500/10 text-sky-300 border-sky-500/30' },
        proposta_enviada: { label: t('cons.leadsStatusSent'), className: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
        fechado: { label: t('admin.leads.statusClosed'), className: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/40' },
        perdido: { label: t('admin.leads.statusLost'), className: 'bg-destructive/10 text-red-300 border-destructive/30' },
      };
      return map[status] ?? { label: status || '—', className: 'bg-muted text-muted-foreground border-border' };
    },
    [t],
  );

  const proposalBadge = useCallback(
    (status: string): { label: string; className: string } => {
      const map: Record<string, { label: string; className: string }> = {
        draft: { label: t('prop.statusDraft'), className: 'bg-muted text-muted-foreground border-border' },
        sent: { label: t('prop.statusSent'), className: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
        viewed: { label: t('prop.statusViewed'), className: 'bg-sky-500/10 text-sky-300 border-sky-500/30' },
        approved: { label: t('prop.statusApproved'), className: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/40' },
        rejected: { label: t('prop.statusRejected'), className: 'bg-destructive/10 text-red-300 border-destructive/30' },
        expired: { label: t('prop.statusExpired'), className: 'bg-muted text-muted-foreground border-border' },
      };
      return map[status] ?? { label: status || '—', className: 'bg-muted text-muted-foreground border-border' };
    },
    [t],
  );

  const bookingBadge = useCallback(
    (status: string): { label: string; className: string } => {
      const map: Record<string, { label: string; className: string }> = {
        pending: { label: t('admin.book.statusPending'), className: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
        confirmed: { label: t('admin.book.statusConfirmed'), className: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' },
        in_progress: { label: t('admin.book.statusInProgress'), className: 'bg-sky-500/10 text-sky-300 border-sky-500/30' },
        completed: { label: t('admin.book.statusCompleted'), className: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/40' },
        cancelled: { label: t('admin.book.statusCancelled'), className: 'bg-destructive/10 text-red-300 border-destructive/30' },
      };
      return map[status] ?? { label: status || '—', className: 'bg-muted text-muted-foreground border-border' };
    },
    [t],
  );

  /* ── Métricas derivados ───────────────────────────────────── */

  const metrics = useMemo(() => {
    if (!overview) return null;
    const { leads: leadStats, proposals: proposalStats, chats: chatStats, bookings: bookingStats } = overview;
    return [
      {
        id: 'funnel',
        icon: Users,
        label: t('cons.metricFunnel'),
        value: count(leadStats.total),
        hint: `${t('cons.metricNewLeads')}: ${count(leadStats.byStatus.novo ?? 0)}`,
      },
      {
        id: 'openValue',
        icon: TrendingUp,
        label: t('cons.metricOpenValue'),
        value: money(proposalStats.openValue),
        hint: `${t('cons.metricSentProposals')}: ${count(proposalStats.sentTotal)}`,
      },
      {
        id: 'approved',
        icon: Check,
        label: t('cons.metricApprovedProposals'),
        value: count(proposalStats.approvedTotal),
        hint: money(proposalStats.approvedValue),
      },
      {
        id: 'ticket',
        icon: CreditCard,
        label: t('cons.metricAvgTicket'),
        value: proposalStats.avgTicket === null ? '—' : money(proposalStats.avgTicket),
        hint: proposalStats.avgTicket === null ? t('cons.notEnoughData') : t('cons.metricApprovedProposals'),
      },
      {
        id: 'conversion',
        icon: FileText,
        label: t('cons.metricConversion'),
        value:
          proposalStats.conversionRate === null
            ? '—'
            : `${formatNumber(Math.round(proposalStats.conversionRate))}%`,
        hint:
          proposalStats.conversionRate === null
            ? t('cons.notEnoughData')
            : `${count(proposalStats.approvedTotal)} / ${count(proposalStats.sentTotal)}`,
      },
      {
        id: 'chats',
        icon: MessageSquare,
        label: t('cons.metricOpenChats'),
        value: count(chatStats.open),
        hint: `${t('admin.book.title')}: ${count(bookingStats.total)}`,
      },
    ];
  }, [overview, count, money, formatNumber, t]);

  const tabs: Array<{ id: TabKey; labelKey: string; badge?: number }> = [
    { id: 'overview', labelKey: 'cons.tabOverview' },
    { id: 'enquiries', labelKey: 'cons.tabEnquiries', badge: leadsPage.total || undefined },
    { id: 'proposals', labelKey: 'cons.tabProposals', badge: proposalsPage.total || undefined },
    { id: 'bookings', labelKey: 'cons.tabBookings', badge: bookingsPage.total || undefined },
    { id: 'conversations', labelKey: 'cons.tabConversations' },
  ];

  const card = 'rounded-2xl border border-border bg-card p-5';
  const tableHead = 'pb-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground';

  return (
    <div className="flex flex-col gap-6">
      {/* Cabeçalho da página */}
      <header className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-light text-foreground">
            {t('cons.tabOverview')}
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-muted-foreground">{t('cons.realDataNote')}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            void load();
            toast(t('common.refresh'), 'info');
          }}
          disabled={loading}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground/80 transition-colors hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          {t('common.refresh')}
        </button>
      </header>

      {/* Abas */}
      <div
        role="tablist"
        aria-label={t('portal.menu')}
        className="flex gap-1 overflow-x-auto border-b border-border pb-1"
      >
        {tabs.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-current={active ? 'page' : undefined}
              onClick={() => changeTab(item.id)}
              className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${
                active
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t(item.labelKey)}
              {item.badge !== undefined && (
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {count(item.badge)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-xs text-foreground"
        >
          {error}
        </div>
      )}

      {loading && (
        <div role="status" aria-live="polite" className="flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          {t('admin.state.loading')}
        </div>
      )}

      {/* ─── VISÃO GERAL ───────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {(metrics ?? []).map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.id} className={`${card} flex flex-col gap-3`}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-accent/30 bg-background">
                      <Icon className="h-4 w-4 text-accent" />
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {metric.label}
                    </span>
                  </div>
                  <p className="font-heading text-2xl font-light text-foreground">{metric.value}</p>
                  <p className="text-[10px] text-muted-foreground">{metric.hint}</p>
                </div>
              );
            })}
            {!metrics && loading && (
              Array.from({ length: 6 }, (_, index) => (
                <div key={`metric-skeleton-${index}`} className={`${card} h-28 animate-pulse`} />
              ))
            )}
          </div>

          {isAdmin && adminStats && (
            <section className={`${card} flex flex-col gap-2`}>
              <h2 className="text-sm font-semibold text-foreground">{t('dash.overviewTitle')}</h2>
              <p className="text-xs text-muted-foreground">{t('dash.metricSource')}</p>
              <dl className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {[
                  { label: t('dash.metricRevenue'), value: money(adminStats.metrics.revenue.value) },
                  { label: t('dash.metricBookings'), value: count(adminStats.metrics.bookings.value) },
                  { label: t('dash.metricLeads'), value: count(adminStats.metrics.leads.value) },
                  {
                    label: t('dash.metricConversion'),
                    value: `${formatNumber(Math.round(adminStats.metrics.conversion.value))}%`,
                  },
                  { label: t('dash.metricTicket'), value: money(adminStats.metrics.ticket.value) },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-border bg-background p-3">
                    <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</dt>
                    <dd className="mt-1 text-lg font-semibold text-foreground">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            {/* Consultas recentes */}
            <section className={`${card} xl:col-span-2`}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-foreground">{t('cons.recentEnquiries')}</h2>
                <button
                  type="button"
                  onClick={() => changeTab('enquiries')}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent transition-colors hover:text-foreground"
                >
                  {t('cons.viewAll')}
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              {leads.length === 0 && !loading ? (
                <EmptyState title={t('cons.noEnquiries')} description={t('cons.noEnquiriesHint')} />
              ) : (
                <ul className="flex flex-col divide-y divide-border">
                  {leads.map((lead) => (
                    <li key={lead.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-background text-[11px] font-bold text-accent">
                          {lead.name.trim().charAt(0).toUpperCase() || '—'}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-foreground">{lead.name}</p>
                          <p className="truncate text-[10px] text-muted-foreground">
                            {lead.destination ?? t('cons.noDestination')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-muted-foreground">{day(lead.updatedAt)}</span>
                        <StatusPill {...leadBadge(lead.status)} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Conversas */}
            <section className={`${card} flex flex-col`}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-foreground">{t('admin.nav.conversations')}</h2>
                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                  {count(chats.length)}
                </span>
              </div>

              {chats.length === 0 && !loading ? (
                <EmptyState title={t('cons.noChats')} description={t('cons.noChatsHint')} />
              ) : (
                <ul className="flex flex-1 flex-col divide-y divide-border">
                  {chats.map((chat) => (
                    <li key={chat.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 truncate text-xs font-semibold text-foreground">
                          {chat.visitorName}
                          {chat.unread && (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" aria-hidden="true" />
                          )}
                        </p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          {chat.preview ?? t('cli.chatEmptyHint')}
                        </p>
                      </div>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {clock(chat.lastMessageAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <Link
                href="/admin/conversas"
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/85"
              >
                {t('cons.openInbox')}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </section>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            {/* Reservas confirmadas — dados reais de `Booking.status` */}
            <section className={`${card} xl:col-span-2`}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-foreground">{t('cons.recentBookings')}</h2>
                <button
                  type="button"
                  onClick={() => changeTab('bookings')}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent transition-colors hover:text-foreground"
                >
                  {t('cons.viewAllBookings')}
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              {bookings.length === 0 && !loading ? (
                <EmptyState title={t('cons.noBookings')} description={t('cons.noBookingsHint')} />
              ) : (
                <ul className="flex flex-col divide-y divide-border">
                  {bookings.map((booking) => (
                    <li key={booking.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-foreground">
                          {booking.package?.title ?? t('cons.bookingNoPackage')}
                        </p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          {booking.client?.name ?? '—'} · {day(booking.startDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-accent">{money(booking.totalPrice)}</span>
                        <StatusPill {...bookingBadge(booking.status)} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Materiais e links — todos navegáveis */}
            <section className={`${card} flex flex-col gap-6`}>
              <div>
                <h2 className="mb-3 text-sm font-semibold text-foreground">{t('cons.quickMaterials')}</h2>
                <div className="grid grid-cols-3 gap-2">
                  {MATERIALS.map((material) => {
                    const Icon = material.icon;
                    return (
                      <Link
                        key={material.href}
                        href={localizedPath(material.href)}
                        className="flex flex-col items-center gap-2 rounded-xl border border-border bg-background p-3 text-center transition-colors hover:border-accent/50"
                      >
                        <Icon className="h-4 w-4 text-accent" />
                        <span className="text-[9px] leading-tight text-muted-foreground">
                          {t(material.labelKey)}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div>
                <h2 className="mb-3 text-sm font-semibold text-foreground">{t('cons.usefulLinks')}</h2>
                <div className="flex flex-col gap-1">
                  {USEFUL_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={localizedPath(link.href)}
                      className="flex items-center justify-between rounded-lg px-2 py-2 text-xs text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <span className="truncate">{t(link.labelKey)}</span>
                      <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* ─── CONSULTAS ────────────────────────────────────────── */}
      {tab === 'enquiries' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative flex-1">
              <span className="sr-only">{t('cons.searchPlaceholder')}</span>
              <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setLeadPage(1);
                }}
                placeholder={t('cons.searchPlaceholder')}
                className="w-full rounded-xl border border-border bg-card py-2 pr-3 pl-9 text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
              />
            </label>

            <label className="flex items-center gap-2">
              <span className="sr-only sm:not-sr-only text-[11px] text-muted-foreground">
                {t('cons.filterStatus')}
              </span>
              <select
                value={leadStatus}
                onChange={(event) => {
                  setLeadStatus(event.target.value);
                  setLeadPage(1);
                }}
                className="rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:border-accent focus:outline-none"
              >
                {LEAD_STATUS_OPTIONS.map((option) => (
                  <option key={option.value || 'all'} value={option.value}>
                    {t(option.labelKey)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <section className={`${card} overflow-x-auto`}>
            {leads.length === 0 && !loading ? (
              <EmptyState title={t('cons.noEnquiries')} description={t('cons.noEnquiriesHint')} />
            ) : (
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className={tableHead}>{t('admin.book.client')}</th>
                    <th scope="col" className={tableHead}>{t('cons.destinationPackage')}</th>
                    <th scope="col" className={tableHead}>{t('admin.exp.status')}</th>
                    <th scope="col" className={tableHead}>{t('cons.lastActivity')}</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-b border-border/50 last:border-0">
                      <td className="py-3 pr-4">
                        <p className="text-xs font-semibold text-foreground">{lead.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {lead.origin ?? t('cons.unknownOrigin')}
                        </p>
                      </td>
                      <td className="py-3 pr-4 text-[11px] text-foreground/80">
                        {lead.destination ?? t('cons.noDestination')}
                        {lead.budget !== null && Number.isFinite(lead.budget) && (
                          <span className="block text-[10px] text-muted-foreground">{money(lead.budget)}</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <StatusPill {...leadBadge(lead.status)} />
                      </td>
                      <td className="py-3 text-[10px] text-muted-foreground">{day(lead.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <AdminPagination
            page={leadPage}
            totalPages={leadsPage.totalPages}
            total={leadsPage.total}
            pageSize={leadsPage.pageSize}
            onPageChange={setLeadPage}
            disabled={loading}
          />
        </div>
      )}

      {/* ─── PROPOSTAS ────────────────────────────────────────── */}
      {tab === 'proposals' && (
        <div className="flex flex-col gap-4">
          <section className={`${card} overflow-x-auto`}>
            {proposals.length === 0 && !loading ? (
              <EmptyState title={t('cons.noProposals')} description={t('cons.noProposalsHint')} />
            ) : (
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className={tableHead}>{t('prop.consultant')}</th>
                    <th scope="col" className={tableHead}>{t('admin.book.client')}</th>
                    <th scope="col" className={tableHead}>{t('admin.exp.status')}</th>
                    <th scope="col" className={tableHead}>{t('admin.book.total')}</th>
                    <th scope="col" className={tableHead}>{t('cons.validUntil')}</th>
                    <th scope="col" className={tableHead}><span className="sr-only">{t('cons.openProposal')}</span></th>
                  </tr>
                </thead>
                <tbody>
                  {proposals.map((proposal) => {
                    const badge = proposalBadge(proposal.status);
                    return (
                      <tr key={proposal.id} className="border-b border-border/50 last:border-0">
                        <td className="py-3 pr-4">
                          <p className="text-xs font-semibold text-foreground">{proposal.title}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {t('cli.versionLabel').replace('{version}', String(proposal.version))}
                          </p>
                        </td>
                        <td className="py-3 pr-4 text-[11px] text-foreground/80">
                          {proposal.customer?.name ?? '—'}
                        </td>
                        <td className="py-3 pr-4">
                          <StatusPill {...badge} />
                        </td>
                        <td className="py-3 pr-4 text-xs font-semibold text-accent">
                          {money(proposal.totalValue)}
                        </td>
                        <td className="py-3 pr-4 text-[10px] text-muted-foreground">
                          {day(proposal.validUntil)}
                        </td>
                        <td className="py-3 text-right">
                          {proposal.uniqueLink ? (
                            <a
                              href={`/proposta/${proposal.uniqueLink}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
                            >
                              {t('cons.openProposal')}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">
                              {t('cons.publicLinkMissing')}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>

          <AdminPagination
            page={proposalPage}
            totalPages={proposalsPage.totalPages}
            total={proposalsPage.total}
            pageSize={proposalsPage.pageSize}
            onPageChange={setProposalPage}
            disabled={loading}
          />
        </div>
      )}

      {/* ─── RESERVAS ─────────────────────────────────────────── */}
      {tab === 'bookings' && (
        <div className="flex flex-col gap-4">
          <section className={`${card} overflow-x-auto`}>
            {bookings.length === 0 && !loading ? (
              <EmptyState title={t('cons.noBookings')} description={t('cons.noBookingsHint')} />
            ) : (
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className={tableHead}>{t('admin.book.package')}</th>
                    <th scope="col" className={tableHead}>{t('admin.book.client')}</th>
                    <th scope="col" className={tableHead}>{t('admin.book.period')}</th>
                    <th scope="col" className={tableHead}>{t('admin.exp.status')}</th>
                    <th scope="col" className={tableHead}>{t('admin.book.total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-border/50 last:border-0">
                      <td className="py-3 pr-4">
                        <p className="text-xs font-semibold text-foreground">
                          {booking.package?.title ?? t('cons.bookingNoPackage')}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {booking.package?.destination ?? t('cons.noDestination')}
                        </p>
                      </td>
                      <td className="py-3 pr-4 text-[11px] text-foreground/80">
                        {booking.client?.name ?? '—'}
                      </td>
                      <td className="py-3 pr-4 text-[10px] text-muted-foreground">
                        {day(booking.startDate)} → {day(booking.endDate)}
                      </td>
                      <td className="py-3 pr-4">
                        <StatusPill {...bookingBadge(booking.status)} />
                      </td>
                      <td className="py-3 text-xs font-semibold text-accent">
                        {money(booking.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <AdminPagination
            page={bookingPage}
            totalPages={bookingsPage.totalPages}
            total={bookingsPage.total}
            pageSize={bookingsPage.pageSize}
            onPageChange={setBookingPage}
            disabled={loading}
          />
        </div>
      )}

      {/* ─── CONVERSAS ────────────────────────────────────────── */}
      {tab === 'conversations' && (
        <div className="flex flex-col gap-4">
          <section className={`${card}`}>
            {chats.length === 0 && !loading ? (
              <EmptyState title={t('cons.noChats')} description={t('cons.noChatsHint')} />
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {chats.map((chat) => (
                  <li key={chat.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-xs font-semibold text-foreground">
                        {chat.visitorName}
                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-normal text-muted-foreground">
                          {chat.visitorKind}
                        </span>
                        {chat.unread && (
                          <span className="text-[9px] font-bold text-destructive">
                            {t('cons.unreadLabel').replace('{count}', '1')}
                          </span>
                        )}
                      </p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {chat.preview ?? t('cli.chatEmptyHint')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-muted-foreground">{clock(chat.lastMessageAt)}</span>
                      <Link
                        href={`/admin/conversas?chat=${chat.id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
                      >
                        {t('cons.openInbox')}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <Link
            href="/admin/conversas"
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/85"
          >
            {t('cons.openInbox')}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

/* ── Componentes locais ─────────────────────────────────────── */

function StatusPill({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-md border px-2 py-1 text-[9px] font-bold uppercase tracking-wider ${className}`}
    >
      {label}
    </span>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center gap-2 border border-dashed border-border rounded-2xl px-6 py-10 text-center">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="max-w-sm text-xs text-muted-foreground">{description}</p>
    </div>
  );
}