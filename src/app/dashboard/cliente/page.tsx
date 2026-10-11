'use client';

/**
 * Portal do cliente (`/dashboard/cliente`).
 *
 * ## O que mudou em relação à versão anterior
 *
 * **Identidade.** O arquivo importava `@/lib/db` (mock em browser storage) e
 * `@/lib/supabaseAuth`, os dois já removidos. Pior: usava o UUID fixo do seed
 * (`'d1eebc…'`) como fallback de identidade em quatro pontos — com
 * `getClientData(userId)` sem autorização isso era IMPERSONAÇÃO total
 * (qualquer pessoa viajava a conta do cliente de exemplo). Hoje a identidade vem
 * de `useAuth()` e `getClientData()` não recebe argumento nenhum: o `clientId`
 * está no `WHERE`, derivado da sessão.
 *
 * **Mensagens.** `isClient` comparava `msg.sender_id` com o mesmo UUID fixo, o
 * que fazia TODA mensagem renderizar como se fosse da consultora. Agora é por
 * `senderType`. E sumiu o `setTimeout` de 2s que empurrava uma resposta falsa da
 * consultora no armazenamento do navegador.
 *
 * **Propostas.** Antes `handleProposalStatus` chamava `approveClientProposal`
 * (status approved + notifica + lead fechado) e DEPOIS `updateProposalStatusAction`
 * (status novo, `version:{increment:1}`, notifica de novo): escrita dupla,
 * notificação duplicada e versão incrementada duas vezes. Agora há UMA action
 * por ação, o retorno é tratado e a lista é recarregada.
 *
 * **Perfil.** O formulário fazia `setProfileSaved(true)` + `setTimeout` e não
 * persistia nada, exibindo "✓ Dados atualizados com sucesso!". Agora grava de
 * verdade via `updateMyProfile` (nome, telefone, idioma, avatar) e só mostra o
 * sucesso quando a escrita volta `success: true`.
 *
 * **Documentos.** Antes gravava DOIS `Document` por upload (`uploadClientDocument`
 * + `uploadDocumentAction`) e apontava `fileUrl` para um caminho `/uploads/docs/`
 * que não existe — então todo download dava 404 e os bytes nunca eram enviados.
 * Agora os bytes vão para `POST /api/media/client`, o `Document` é criado uma
 * única vez e o `fileUrl` é `/api/media/<id>`.
 *
 * **Notificações.** O portal mostrava um contador que era, na verdade, o total
 * de notificações (`getClientData().notifications.length`) rotulado como "não
 * lidas", e nenhuma tela listava as notificações. Agora existe a aba
 * "Notificações": `getClientNotifications()` alimenta a lista, `markAsRead`/
 * `markAllAsRead` marcam no servidor e a lista é reconciliada localmente
 * (falha da action devolve o item para "não lida"). Falha ao carregar a lista
 * não derruba o portal: vira estado de erro só da aba.
 *
 * **Valores.** As chamadas diretas de formatação de número quebravam com
 * null/NaN, e havia moeda errada (`US$` sobre valores em BRL). Tudo passa pelos
 * helpers `Intl` do `useLanguage()`.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Bell,
  Calendar,
  Check,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  MessageSquare,
  RefreshCw,
  Send,
  Trash2,
  Upload,
  User,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { useMountedLoad } from '@/components/admin/ui/useMountedLoad';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getClientData,
  getClientNotifications,
  getClientProposals,
  getClientMessages,
  sendClientMessage,
  approveClientProposal,
  requestProposalChanges,
  uploadClientDocument,
  deleteClientDocument,
  updateMyProfile,
  type ClientBooking,
  type ClientChatMessage,
  type ClientChatSummary,
  type ClientDocument,
  type ClientProposal,
  type ClientProposalRow,
} from '@/actions/clientActions';
import { markAllAsRead, markAsRead } from '@/actions/notificationActions';

type TabKey = 'viagem' | 'propostas' | 'chat' | 'documentos' | 'financeiro' | 'notificacoes' | 'perfil';

const LOCALES: Array<{ value: string; labelKey: string }> = [
  { value: 'pt', labelKey: 'admin.cms.languagePt' },
  { value: 'en', labelKey: 'admin.cms.languageEn' },
  { value: 'es', labelKey: 'admin.cms.languageEs' },
];

interface ClientNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  category: string;
  isRead: boolean;
  linkUrl: string | null;
  createdAt: string;
}

/**
 * `getClientNotifications` devolve `Record<string, unknown>[]` (a action é
 * genérica). A conversão é feita aqui, com guarda por campo — nada de `any`
 * nem de `String(row.x)` cego em JSX.
 */
function toNotification(row: Record<string, unknown>): ClientNotification {
  const linkUrl = typeof row.linkUrl === 'string' && row.linkUrl.length > 0 ? row.linkUrl : null;
  return {
    id: typeof row.id === 'string' ? row.id : '',
    title: typeof row.title === 'string' ? row.title : '',
    message: typeof row.message === 'string' ? row.message : '',
    type: typeof row.type === 'string' ? row.type : 'info',
    category: typeof row.category === 'string' ? row.category : 'system',
    isRead: row.isRead === true,
    linkUrl,
    createdAt: typeof row.createdAt === 'string' ? row.createdAt : '',
  };
}

export default function ClienteDashboard() {
  const { user, refresh } = useAuth();
  const { t, formatCurrency, formatNumber, formatDate } = useLanguage();
  const { toast } = useToast();

  const [tab, setTab] = useState<TabKey>('propostas');

  const [booking, setBooking] = useState<ClientBooking | null>(null);
  const [proposal, setProposal] = useState<ClientProposal | null>(null);
  const [proposals, setProposals] = useState<ClientProposalRow[]>([]);
  const [chat, setChat] = useState<ClientChatSummary | null>(null);
  const [messages, setMessages] = useState<ClientChatMessage[]>([]);
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [notificationBusy, setNotificationBusy] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [chatInput, setChatInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [proposalBusy, setProposalBusy] = useState(false);
  const [changeNotes, setChangeNotes] = useState('');
  const [showChangeForm, setShowChangeForm] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [profileForm, setProfileForm] = useState(() => ({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    locale: user?.locale ?? 'pt',
  }));

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userId = user?.id ?? null;

  /* ── Formatação ─────────────────────────────────────────── */

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
    (value: string | Date | null | undefined): string =>
      value ? formatDate(value, { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—',
    [formatDate],
  );
  const clock = useCallback(
    (value: string | Date | null | undefined): string =>
      value ? formatDate(value, { hour: '2-digit', minute: '2-digit' }) : '—',
    [formatDate],
  );

  /* ── Carga de dados ─────────────────────────────────────── */

  const loadData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setLoadError(null);
    setNotificationsLoading(true);
    setNotificationsError(null);

    try {
      const [dataRes, proposalsRes, messagesRes, notificationsRes] = await Promise.all([
        getClientData(),
        getClientProposals({ page: 1, pageSize: 20 }),
        getClientMessages(),
        getClientNotifications(),
      ]);

      // Falha da lista de notificações NÃO derruba o portal inteiro: vira o
      // estado de erro da aba e o resto da tela continua utilizável.
      if (notificationsRes.success) {
        setNotifications((notificationsRes.data ?? []).map(toNotification));
      } else {
        setNotifications([]);
        setNotificationsError(notificationsRes.error ?? t('cons.dataError'));
      }

      if (!dataRes.success) {
        setLoadError(dataRes.error ?? t('cli.loadError'));
        return;
      }

      const data = dataRes.data;
      setBooking(data?.booking ?? null);
      setProposal(data?.proposal ?? null);
      setChat(data?.chat ?? null);
      setDocuments(data?.documents ?? []);
      setMessages(messagesRes.success ? (messagesRes.data ?? []) : []);
      setProposals(proposalsRes.success ? (proposalsRes.items ?? []) : []);
    } catch {
      setLoadError(t('cli.loadError'));
    } finally {
      setLoading(false);
      setNotificationsLoading(false);
    }
  }, [userId, t]);

  useMountedLoad(loadData);

  useEffect(() => {
    if (tab !== 'chat') return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, tab]);

  /* ── Ações ──────────────────────────────────────────────── */

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    const content = chatInput.trim();
    if (!content || sendingMessage) return;

    setSendingMessage(true);
    try {
      const res = await sendClientMessage({ content });
      if (!res.success) {
        toast(res.error ?? t('cons.dataError'), 'error');
        return;
      }
      setChatInput('');
      const messagesRes = await getClientMessages();
      if (messagesRes.success) setMessages(messagesRes.data ?? []);
    } catch {
      toast(t('cons.dataError'), 'error');
    } finally {
      setSendingMessage(false);
    }
  };

  /** UMA action por ação — approve OU request changes, nunca as duas. */
  const handleProposalStatus = async (action: 'approved' | 'changes_requested') => {
    if (!proposal || proposalBusy) return;

    if (action === 'changes_requested' && changeNotes.trim().length < 3) {
      toast(t('cli.requestChanges'), 'error');
      return;
    }

    setProposalBusy(true);
    try {
      const res =
        action === 'approved'
          ? await approveClientProposal(proposal.id)
          : await requestProposalChanges(proposal.id, changeNotes.trim());

      if (!res.success) {
        toast(res.error ?? t('cons.dataError'), 'error');
        return;
      }

      toast(
        action === 'approved' ? t('cli.proposalApprovedOk') : t('cli.proposalChangesOk'),
        'success',
      );
      setChangeNotes('');
      setShowChangeForm(false);
      await loadData();
    } catch {
      toast(t('cons.dataError'), 'error');
    } finally {
      setProposalBusy(false);
    }
  };

  /** Envia os BYTES do arquivo e só então registra o `Document`. */
  const handleDocUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || uploading) return;

    if (file.size > 5 * 1024 * 1024) {
      toast(t('cli.fileTooLarge'), 'error');
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.set('file', file);
      const upload = await fetch('/api/media/client', { method: 'POST', body });
      const payload = (await upload.json()) as { success?: boolean; url?: string; error?: string };

      if (!upload.ok || !payload.success || !payload.url) {
        toast(payload.error ?? t('cli.uploadFailed'), 'error');
        return;
      }

      const created = await uploadClientDocument({
        fileName: file.name,
        fileUrl: payload.url,
        fileSize: file.size,
        mimeType: file.type,
        category: 'passport',
      });

      if (!created.success) {
        toast(created.error ?? t('cli.uploadFailed'), 'error');
        return;
      }

      toast(t('cli.documentUploaded'), 'success');
      await loadData();
    } catch {
      toast(t('cli.uploadFailed'), 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (document: ClientDocument) => {
    const res = await deleteClientDocument(document.id);
    if (!res.success) {
      toast(res.error ?? t('cons.dataError'), 'error');
      return;
    }
    toast(t('cli.documentUploaded'), 'success');
    await loadData();
  };

  /**
   * `markAsRead` grava no banco e a lista é reconciliada localmente — o item
   * some do "não lidas" na hora, sem esperar um round-trip extra. Se a action
   * falhar, o item volta a ficar não lida (nada de sucesso mentiroso).
   */
  const handleMarkRead = async (id: string) => {
    if (notificationBusy) return;
    setNotificationBusy(id);
    try {
      const res = await markAsRead(id);
      if (!res.success) {
        toast(res.error ?? t('cons.dataError'), 'error');
        return;
      }
      setNotifications((current) =>
        current.map((notification) => (notification.id === id ? { ...notification, isRead: true } : notification)),
      );
    } catch {
      toast(t('cons.dataError'), 'error');
    } finally {
      setNotificationBusy(null);
    }
  };

  const handleMarkAllRead = async () => {
    if (notificationBusy) return;
    setNotificationBusy('all');
    try {
      const res = await markAllAsRead();
      if (!res.success) {
        toast(res.error ?? t('cons.dataError'), 'error');
        return;
      }
      setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));
      toast(
        t('cli.notificationsAllRead').replace('{count}', count(res.data?.count ?? 0)),
        'success',
      );
    } catch {
      toast(t('cons.dataError'), 'error');
    } finally {
      setNotificationBusy(null);
    }
  };

  const handleProfileSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (profileSaving) return;

    setProfileSaving(true);
    setProfileError(null);
    setProfileSaved(false);

    try {
      let avatarUrl: string | undefined;

      if (avatarFile) {
        const body = new FormData();
        body.set('file', avatarFile);
        const upload = await fetch('/api/media/client', { method: 'POST', body });
        const payload = (await upload.json()) as { success?: boolean; url?: string; error?: string };
        if (!upload.ok || !payload.success || !payload.url) {
          setProfileError(payload.error ?? t('cli.uploadFailed'));
          return;
        }
        avatarUrl = payload.url;
      } else if (removeAvatar) {
        avatarUrl = '';
      }

      const res = await updateMyProfile({
        name: profileForm.name,
        phone: profileForm.phone,
        locale: profileForm.locale,
        ...(avatarUrl === undefined ? {} : { avatarUrl }),
      });

      if (!res.success) {
        setProfileError(res.error ?? t('cons.dataError'));
        return;
      }

      setAvatarFile(null);
      setRemoveAvatar(false);
      setProfileSaved(true);
      // `refresh()` relê `/api/me` no servidor: o cabeçalho passa a refletir
      // o nome/avatar recém-gravados.
      await refresh();
      await loadData();
      toast(t('cli.profileSaved'), 'success');
    } catch {
      setProfileError(t('cons.dataError'));
    } finally {
      setProfileSaving(false);
    }
  };

  /* ── Derivados ──────────────────────────────────────────── */

  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  );

  const awaitingApproval =
    proposal?.status === 'sent' || proposal?.status === 'viewed' || proposal?.status === 'draft';

  const proposalBadge = (status: string): { label: string; className: string } => {
    const map: Record<string, { label: string; className: string }> = {
      draft: { label: t('prop.statusDraft'), className: 'bg-muted text-muted-foreground border-border' },
      sent: { label: t('prop.statusSent'), className: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
      viewed: { label: t('prop.statusViewed'), className: 'bg-sky-500/10 text-sky-600 border-sky-500/30' },
      approved: { label: t('prop.statusApproved'), className: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' },
      rejected: { label: t('prop.statusRejected'), className: 'bg-destructive/10 text-destructive border-destructive/30' },
      expired: { label: t('prop.statusExpired'), className: 'bg-muted text-muted-foreground border-border' },
    };
    return map[status] ?? { label: status || '—', className: 'bg-muted text-muted-foreground border-border' };
  };

  const paymentBadge = (status: string): { label: string; className: string } =>
    status === 'paid'
      ? { label: t('admin.list.statusPaid'), className: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' }
      : { label: t('admin.list.statusPending'), className: 'bg-amber-500/10 text-amber-600 border-amber-500/30' };

  const tabs: Array<{ id: TabKey; labelKey: string; icon: typeof Calendar; badge?: number }> = [
    { id: 'viagem', labelKey: 'cli.myTrip', icon: Calendar },
    {
      id: 'propostas',
      labelKey: 'cli.proposals',
      icon: FileText,
      badge: awaitingApproval ? 1 : proposals.length || undefined,
    },
    { id: 'chat', labelKey: 'cli.chatWithConsultant', icon: MessageSquare },
    { id: 'documentos', labelKey: 'cli.documents', icon: Upload },
    { id: 'financeiro', labelKey: 'cli.financial', icon: Calendar },
    {
      id: 'notificacoes',
      labelKey: 'cli.notifications',
      icon: Bell,
      badge: unreadNotifications || undefined,
    },
    { id: 'perfil', labelKey: 'cli.myProfile', icon: User },
  ];

  const avatarPreview = avatarFile ? URL.createObjectURL(avatarFile) : user?.avatarUrl ?? null;
  const nextDestination = booking?.package?.destination ?? null;
  const timeline = booking?.timeline ?? [];
  const payments = booking?.payments ?? [];

  return (
    <div className="flex flex-col gap-8">
      {/* Cabeçalho */}
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-primary bg-card text-lg font-bold text-accent">
            {user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- avatar gravado pelo próprio usuário (host fora da allowlist do next.config)
              <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              (user?.name?.trim().charAt(0) ?? '—').toUpperCase()
            )}
          </span>
          <div className="min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">
              {t('cli.panelTitle')}
            </span>
            <h1 className="truncate font-heading text-2xl font-light text-foreground">
              {t('portal.welcome').replace('{name}', user?.name ?? '—')}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {nextDestination && (
            <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground">
              <MapPin className="h-3.5 w-3.5 text-accent" />
              {nextDestination}
            </span>
          )}
          {unreadNotifications > 0 && (
            <span className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground">
              <RefreshCw className="h-3.5 w-3.5 text-accent" />
              {t('admin.header.unread').replace('{count}', count(unreadNotifications))}
            </span>
          )}
          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground/80 transition-colors hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {t('common.refresh')}
          </button>
        </div>
      </header>

      {loadError && (
        <div
          role="alert"
          className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-xs text-foreground"
        >
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Navegação */}
        <nav
          aria-label={t('cli.panelTitle')}
          className="flex h-fit flex-col gap-1 rounded-2xl border border-border bg-card p-4"
        >
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground/75 hover:bg-muted'
                }`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{t(item.labelKey)}</span>
                </span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-white">
                    {count(item.badge)}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Conteúdo */}
        <div className="min-w-0 lg:col-span-3">
          {/* ─── VIAGEM ─────────────────────────────────────── */}
          {tab === 'viagem' && (
            <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
              <h2 className="mb-6 flex items-center gap-2 font-heading text-2xl font-light text-foreground">
                <Calendar className="h-5 w-5 text-accent" />
                {booking?.package?.title ?? t('cli.myTrip')}
              </h2>

              {timeline.length === 0 ? (
                <EmptyState
                  icon={<AlertTriangle className="h-8 w-8 text-amber-500" />}
                  title={t('cli.noTripTitle')}
                  description={t('cli.noTripHint')}
                />
              ) : (
                <ol className="relative flex flex-col gap-8 border-l-2 border-primary/20 pl-6">
                  {timeline.map((event) => (
                    <li key={event.id} className="relative">
                      <span
                        aria-hidden="true"
                        className="absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 border-primary bg-background"
                      />
                      <div className="flex flex-col gap-1 text-xs sm:flex-row sm:items-center sm:justify-between">
                        <span className="font-bold text-primary">
                          {day(event.eventDate)}
                          {event.eventTime ? ` · ${event.eventTime}` : ''}
                        </span>
                        {booking?.package?.destination && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {booking.package.destination}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-1 font-heading text-lg font-medium text-foreground">{event.title}</h3>
                      {event.description && (
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {event.description}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </section>
          )}

          {/* ─── PROPOSTAS ──────────────────────────────────── */}
          {tab === 'propostas' && (
            <div className="flex flex-col gap-6">
              {proposal ? (
                <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
                  <div className="mb-6 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <span className="inline-block rounded bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                        {t('cli.versionLabel').replace('{version}', String(proposal.version))}
                      </span>
                      <h2 className="mt-1 font-heading text-2xl font-light text-foreground">
                        {proposal.title}
                      </h2>
                    </div>
                    <span
                      className={`self-start whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold ${proposalBadge(proposal.status).className}`}
                    >
                      {proposalBadge(proposal.status).label}
                    </span>
                  </div>

                  <ul className="mb-6 flex flex-col gap-3">
                    {(proposal.items ?? []).map((item) => (
                      <li
                        key={item.id}
                        className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-start sm:justify-between"
                      >
                        <div className="min-w-0">
                          <span className="rounded bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                            {item.type}
                          </span>
                          <h3 className="mt-1 text-sm font-bold text-foreground">{item.name}</h3>
                          {item.details && (
                            <p className="mt-0.5 text-xs text-muted-foreground">{item.details}</p>
                          )}
                        </div>
                        <span className="shrink-0 text-sm font-bold text-primary">
                          {money(
                            typeof item.price === 'number' && Number.isFinite(item.price)
                              ? item.price * (item.quantity > 0 ? item.quantity : 1)
                              : null,
                          )}
                        </span>
                      </li>
                    ))}
                    {(proposal.items ?? []).length === 0 && (
                      <li className="text-xs text-muted-foreground">{t('cli.emptyState')}</li>
                    )}
                  </ul>

                  <div className="mb-6 flex items-center justify-between border-t border-border pt-4">
                    <span className="text-xs font-semibold uppercase text-muted-foreground">
                      {t('cli.totalAmount')}
                    </span>
                    <span className="font-heading text-2xl font-bold text-primary">
                      {money(proposal.totalValue)}
                    </span>
                  </div>

                  {proposal.notes && (
                    <p className="mb-6 rounded-xl border border-border bg-background p-4 text-xs leading-relaxed text-foreground/80">
                      {proposal.notes}
                    </p>
                  )}

                  {proposal.uniqueLink && (
                    <Link
                      href={`/proposta/${proposal.uniqueLink}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-accent hover:underline"
                    >
                      {t('cli.openPublicLink')}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  )}

                  {awaitingApproval && (
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <Button
                          onClick={() => void handleProposalStatus('approved')}
                          disabled={proposalBusy}
                          className="flex-1 bg-primary py-3 font-bold text-primary-foreground hover:bg-primary/85"
                        >
                          {proposalBusy ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="mr-2 h-4 w-4" />
                          )}
                          {t('cli.approveProposal')}
                        </Button>
                        <Button
                          onClick={() => setShowChangeForm((open) => !open)}
                          disabled={proposalBusy}
                          variant="outline"
                          className="flex-1 border-border py-3 font-bold text-destructive hover:bg-destructive/10"
                        >
                          {t('cli.requestChanges')}
                        </Button>
                      </div>

                      {showChangeForm && (
                        <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-border bg-background p-4">
                          <label
                            htmlFor="change-notes"
                            className="text-xs font-semibold text-foreground"
                          >
                            {t('prop.changesLabel')}
                          </label>
                          <Input
                            id="change-notes"
                            value={changeNotes}
                            onChange={(event) => setChangeNotes(event.target.value)}
                            placeholder={t('prop.changesPlaceholder')}
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              onClick={() => setShowChangeForm(false)}
                              className="text-xs font-bold"
                            >
                              {t('common.cancel')}
                            </Button>
                            <Button
                              onClick={() => void handleProposalStatus('changes_requested')}
                              disabled={proposalBusy || changeNotes.trim().length < 3}
                              className="bg-primary text-xs font-bold text-primary-foreground hover:bg-primary/85"
                            >
                              {t('prop.sending')}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              ) : (
                <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
                  <EmptyState
                    icon={<FileText className="h-8 w-8 text-muted-foreground" />}
                    title={t('cli.noProposalsTitle')}
                    description={t('cli.noProposalsHint')}
                  />
                </section>
              )}

              {/* Histórico: todas as propostas do cliente, com link público */}
              <section className="rounded-3xl border border-border bg-card p-6">
                <h2 className="mb-4 font-heading text-lg font-light text-foreground">
                  {t('cli.proposalsList')}
                </h2>
                {proposals.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{t('cli.emptyState')}</p>
                ) : (
                  <ul className="flex flex-col divide-y divide-border">
                    {proposals.map((row) => (
                      <li
                        key={row.id}
                        className="flex flex-wrap items-center justify-between gap-3 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-foreground">{row.title}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {t('cli.versionLabel').replace('{version}', String(row.version))} ·{' '}
                            {t('cons.validUntil')}: {day(row.validUntil)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-primary">{money(row.totalValue)}</span>
                          <span
                            className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-semibold ${proposalBadge(row.status).className}`}
                          >
                            {proposalBadge(row.status).label}
                          </span>
                          {row.uniqueLink ? (
                            <Link
                              href={`/proposta/${row.uniqueLink}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
                            >
                              {t('cli.openPublicLink')}
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">
                              {t('cli.noProposalLink')}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}

          {/* ─── CHAT ───────────────────────────────────────── */}
          {tab === 'chat' && (
            <section className="flex h-[560px] flex-col overflow-hidden rounded-3xl border border-border bg-card">
              <div className="flex items-center gap-3 border-b border-border bg-muted/40 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-background text-xs font-bold text-accent">
                  {chat?.consultant.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- avatar da consultora gravado no painel
                    <img
                      src={chat.consultant.avatarUrl}
                      alt=""
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    (chat?.consultant.name?.trim().charAt(0) ?? '—').toUpperCase()
                  )}
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold text-foreground">
                    {chat?.consultant.name ?? t('cli.consultantLabel')}
                  </h2>
                  {/* Status real da conversa — nada de "online" fixo. */}
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                    {chat ? (
                      <>
                        {chat.status === 'closed' ? (
                          <Check className="h-2.5 w-2.5" />
                        ) : (
                          <Clock className="h-2.5 w-2.5" />
                        )}
                        {chat.status === 'closed' ? t('prop.statusRejected') : t('cli.awaitingApproval')}
                      </>
                    ) : (
                      t('cli.consultantChatNote')
                    )}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                    <MessageSquare className="h-8 w-8 text-muted-foreground" />
                    <p className="text-xs font-semibold text-foreground">{t('cli.chatEmpty')}</p>
                    <p className="max-w-xs text-xs text-muted-foreground">{t('cli.chatEmptyHint')}</p>
                  </div>
                ) : (
                  <ul className="flex flex-col gap-4">
                    {messages.map((message) => {
                      // Autoridade vem do `senderType` gravado pelo servidor —
                      // nunca de uma comparação com id fixo.
                      const mine = message.senderType === 'customer';
                      return (
                        <li
                          key={message.id}
                          className={`flex max-w-[75%] flex-col ${mine ? 'self-end items-end' : 'self-start items-start'}`}
                        >
                          <span
                            className={`rounded-2xl px-3.5 py-3 text-xs leading-relaxed ${
                              mine
                                ? 'rounded-tr-none bg-primary text-primary-foreground'
                                : 'rounded-tl-none border border-border bg-muted text-foreground'
                            }`}
                          >
                            {message.content}
                          </span>
                          <span className="mt-1 px-1 text-[9px] text-muted-foreground">
                            {clock(message.createdAt)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-border p-3">
                <label htmlFor="chat-input" className="sr-only">
                  {t('cli.typeMessage')}
                </label>
                <Input
                  id="chat-input"
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  placeholder={t('cli.typeMessage')}
                  className="flex-1 rounded-xl"
                  disabled={sendingMessage}
                />
                <Button
                  type="submit"
                  disabled={sendingMessage || chatInput.trim().length === 0}
                  className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/85"
                >
                  {sendingMessage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span className="sr-only">{t('cli.sendMessage')}</span>
                </Button>
              </form>
            </section>
          )}

          {/* ─── DOCUMENTOS ────────────────────────────────── */}
          {tab === 'documentos' && (
            <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <h2 className="font-heading text-2xl font-light text-foreground">
                  {t('cli.documentsTitle')}
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-muted-foreground">{t('cli.uploadAccepted')}</span>
                  <label
                    htmlFor="upload-doc"
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition-opacity ${
                      uploading ? 'pointer-events-none opacity-60' : ''
                    }`}
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {uploading ? t('admin.img.uploading') : t('cli.uploadDocument')}
                  </label>
                  <input
                    id="upload-doc"
                    type="file"
                    className="sr-only"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.gif"
                    onChange={handleDocUpload}
                    disabled={uploading}
                  />
                </div>
              </div>

              {documents.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border px-8 py-10 text-center text-xs text-muted-foreground">
                  {t('cli.noDocuments')}
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {documents.map((document) => (
                    <li
                      key={document.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background p-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <FileText className="h-8 w-8 shrink-0 text-accent" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-foreground">
                            {document.fileName}
                          </p>
                          <p className="text-[10px] uppercase text-muted-foreground">
                            {document.category === 'passport'
                              ? t('cli.categoryPassport')
                              : t('cli.categoryGeneral')}
                            {' · '}
                            {typeof document.fileSize === 'number' && Number.isFinite(document.fileSize)
                              ? `${formatNumber(Math.round(document.fileSize / 1024))} KB`
                              : '—'}
                            {' · '}
                            {day(document.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={document.fileUrl}
                          download={document.fileName}
                          title={t('cli.downloadDocument')}
                          aria-label={t('cli.downloadDocument')}
                          className="rounded-lg border border-border p-2 text-primary transition-colors hover:bg-muted"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => void handleDeleteDocument(document)}
                          title={t('admin.header.deleteNotification')}
                          aria-label={t('admin.header.deleteNotification')}
                          className="rounded-lg border border-border p-2 text-destructive transition-colors hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* ─── FINANCEIRO ────────────────────────────────── */}
          {tab === 'financeiro' && (
            <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
              <h2 className="mb-6 border-b border-border pb-4 font-heading text-2xl font-light text-foreground">
                {t('cli.financialTitle')}
              </h2>

              {payments.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border px-8 py-10 text-center text-xs text-muted-foreground">
                  {t('cli.noPayments')}
                </p>
              ) : (
                <ul className="flex flex-col gap-4">
                  {payments.map((payment, index) => (
                    <li
                      key={payment.id}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-background p-4"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground">
                          {t('cli.installment').replace('{number}', String(index + 1))}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t('cli.dueDate').replace('{date}', day(payment.dueDate))}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-heading text-base font-bold text-primary">
                          {money(payment.amount)}
                        </span>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${paymentBadge(payment.status).className}`}
                        >
                          {paymentBadge(payment.status).label}
                        </span>
                        {payment.paymentUrl && (
                          <a
                            href={payment.paymentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
                          >
                            {t('admin.payPage.title')}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* ─── NOTIFICAÇÕES ────────────────────────────── */}
          {tab === 'notificacoes' && (
            <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <h2 className="font-heading text-2xl font-light text-foreground">
                  {t('cli.notificationsTitle')}
                </h2>
                <Button
                  type="button"
                  onClick={() => void handleMarkAllRead()}
                  disabled={notificationBusy !== null || unreadNotifications === 0}
                  variant="outline"
                  className="border-border text-xs font-bold text-foreground/80 hover:bg-muted"
                >
                  {notificationBusy === 'all' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  {t('admin.header.markAllRead')}
                </Button>
              </div>

              <p role="status" className="sr-only">
                {t('admin.header.unread').replace('{count}', count(unreadNotifications))}
              </p>

              {notificationsError ? (
                <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-center">
                  <p className="text-xs text-red-200">{notificationsError}</p>
                  <Button
                    type="button"
                    onClick={() => void loadData()}
                    variant="outline"
                    className="border-border text-xs font-bold text-foreground/80 hover:bg-muted"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t('state.retry')}
                  </Button>
                </div>
              ) : notificationsLoading && notifications.length === 0 ? (
                <ul className="flex flex-col gap-3" aria-hidden="true">
                  {[0, 1, 2].map((slot) => (
                    <li
                      key={`notif-skeleton-${slot}`}
                      className="h-20 animate-pulse rounded-xl border border-border bg-background"
                    />
                  ))}
                </ul>
              ) : notifications.length === 0 ? (
                <EmptyState
                  icon={<Bell className="h-8 w-8 text-muted-foreground" />}
                  title={t('cli.notificationsEmpty')}
                  description={t('cli.notificationsEmptyHint')}
                />
              ) : (
                <ul className="flex flex-col gap-3">
                  {notifications.map((notification) => (
                    <li
                      key={notification.id}
                      className={`flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border bg-background p-4 ${
                        notification.isRead ? '' : 'border-primary/40'
                      }`}
                    >
                      <div className="flex min-w-0 gap-3">
                        <span
                          aria-hidden="true"
                          className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                            notification.isRead ? 'bg-transparent' : 'bg-primary'
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground">{notification.title}</p>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            {notification.message}
                          </p>
                          <p className="mt-1.5 text-[10px] text-muted-foreground">
                            {notification.isRead
                              ? t('admin.header.allRead')
                              : t('cli.notificationUnread')}
                            {' · '}
                            {clock(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {notification.linkUrl && (
                          <Link
                            href={notification.linkUrl}
                            onClick={() => {
                              if (!notification.isRead) void handleMarkRead(notification.id);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-[11px] font-semibold text-accent transition-colors hover:bg-muted"
                          >
                            {t('admin.header.viewDetails')}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                        {!notification.isRead && (
                          <Button
                            type="button"
                            onClick={() => void handleMarkRead(notification.id)}
                            disabled={notificationBusy !== null}
                            variant="outline"
                            className="border-border text-[11px] font-bold text-foreground/80 hover:bg-muted"
                          >
                            {notificationBusy === notification.id ? (
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            {t('admin.header.markRead')}
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* ─── PERFIL ─────────────────────────────────────── */}
          {tab === 'perfil' && (
            <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
              <h2 className="mb-1 border-b border-border pb-4 font-heading text-2xl font-light text-foreground">
                {t('cli.profileTitle')}
              </h2>
              <p className="mb-6 text-xs text-muted-foreground">{t('cli.profileHint')}</p>

              {profileSaved && (
                <p className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-200">
                  ✓ {t('cli.profileSaved')}
                </p>
              )}
              {profileError && (
                <p
                  role="alert"
                  className="mb-6 rounded-xl border border-destructive/40 bg-destructive/10 p-3.5 text-xs text-red-200"
                >
                  {profileError}
                </p>
              )}

              <form onSubmit={handleProfileSubmit} className="flex max-w-md flex-col gap-4">
                <div className="flex items-center gap-4">
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-primary bg-background text-lg font-bold text-accent">
                    {avatarPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element -- preview local / avatar gravado no banco
                      <img
                        src={avatarPreview}
                        alt=""
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      (profileForm.name.trim().charAt(0) ?? '—').toUpperCase()
                    )}
                  </span>
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="avatar-input"
                      className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {user?.avatarUrl ? t('cli.changeAvatar') : t('cli.chooseAvatar')}
                    </label>
                    <input
                      id="avatar-input"
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="sr-only"
                      onChange={(event) => {
                        setAvatarFile(event.target.files?.[0] ?? null);
                        setRemoveAvatar(false);
                        event.target.value = '';
                      }}
                    />
                    {user?.avatarUrl && !avatarFile && (
                      <button
                        type="button"
                        onClick={() => setRemoveAvatar(true)}
                        className="w-fit text-[11px] font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                      >
                        {t('cli.removeAvatar')}
                      </button>
                    )}
                    <span className="text-[10px] text-muted-foreground">{t('cli.avatarHint')}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="profile-name" className="text-xs font-semibold text-foreground">
                    {t('admin.users.name')}
                  </label>
                  <Input
                    id="profile-name"
                    required
                    value={profileForm.name}
                    onChange={(event) =>
                      setProfileForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="profile-email" className="text-xs font-semibold text-foreground">
                    {t('admin.users.email')}
                  </label>
                  <Input id="profile-email" type="email" value={user?.email ?? ''} readOnly disabled />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="profile-phone" className="text-xs font-semibold text-foreground">
                    {t('cli.phoneLabel')}
                  </label>
                  <Input
                    id="profile-phone"
                    value={profileForm.phone}
                    onChange={(event) =>
                      setProfileForm((prev) => ({ ...prev, phone: event.target.value }))
                    }
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="profile-locale" className="text-xs font-semibold text-foreground">
                    {t('cli.preferredLocale')}
                  </label>
                  <select
                    id="profile-locale"
                    value={profileForm.locale}
                    onChange={(event) =>
                      setProfileForm((prev) => ({ ...prev, locale: event.target.value }))
                    }
                    className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground focus-visible:border-ring focus-visible:outline-none"
                  >
                    {LOCALES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {t(option.labelKey)}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  type="submit"
                  disabled={profileSaving}
                  className="mt-2 bg-primary font-bold text-primary-foreground hover:bg-primary/85"
                >
                  {profileSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  {profileSaving ? t('cli.saving') : t('cli.saveProfile')}
                </Button>
              </form>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border px-8 py-14 text-center">
      {icon}
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      <p className="max-w-sm text-xs text-muted-foreground">{description}</p>
    </div>
  );
}