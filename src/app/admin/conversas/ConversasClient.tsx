'use client';

/**
 * Inbox de conversas da equipe (`/admin/conversas`).
 *
 * O que mudou em relação à versão anterior:
 *  - `getAdminChats()` sem filtro (cada atendente via as conversas de TODAS as
 *    outras) → `staffChatList()` com escopo no servidor: consultant vê só
 *    `consultantId = ctx.user.id`, admin vê tudo.
 *  - `senderId: 'admin_id'` (autor literal) → autor real vindo de
 *    `staffSendMessage`, que usa `ctx.user.id` do cookie assinado; o lado da
 *    bolha vem de `senderType`.
 *  - busca era um `<input>` morto (sem `value`/`onChange`) → busca funcional com
 *    debounce de 300 ms + `useDeferredValue`, filtrada no Postgres.
 *  - "Finalizar" era um `<span>` → botão que chama `setChatStatus(id,'closed')`,
 *    com chip de status visível e opção de reabrir.
 *  - polling com `setInterval` (3s/5s, sobreposto, sem pausa) → `setTimeout`
 *    auto-agendado com token de sequência, pausa em `document.hidden`, e
 *    backoff exponencial até 30s em caso de erro.
 *  - envio otimista SUMIA no poll seguinte → reconciliação por `clientKey`
 *    (`mergeMessages`) + `isSending` + guarda de Enter duplicado; se a action
 *    falha, a mensagem fica marcada com botão de reenviar (nunca se perde texto).
 *  - as 10 strings hardcoded foram para `t()`.
 *  - `assignChat` ligada: seletor "Atendente" no cabeçalho da thread. A action é
 *    `requireAdmin()`, então para a consultora o seletor aparece DESABILITADO
 *    com o motivo visível, e `getConsultants()` nem é chamada (seria recusada).
 */

import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCheck,
  Loader2,
  MessageSquare,
  Paperclip,
  RefreshCw,
  Search,
  Send,
  User,
  X,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  assignChat,
  getUnreadChatCount,
  markAllChatsRead,
  setChatStatus,
  staffChatList,
  staffMessages,
  staffSendMessage,
  type ChatMessageDto,
  type ChatRowDto,
  type ChatSenderType,
  type ChatStatus,
} from '@/actions/chatActions';
import { getConsultants } from '@/actions/usersActions';

/* ── Constantes ─────────────────────────────────────────────────────────── */

const LIST_POLL_MS = 10_000;
const MESSAGE_POLL_MS = 5_000;
const POLL_MAX_MS = 30_000;
const SEARCH_DEBOUNCE_MS = 300;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const HISTORY_LIMIT = 100;
const FULL_REFRESH_EVERY = 20;
const NEAR_BOTTOM_PX = 90;
const PAGE_SIZE = 30;

const STATUS_FILTERS: ReadonlyArray<{ value: 'all' | ChatStatus; label: string }> = [
  { value: 'all', label: 'Todas' },
  { value: 'open', label: 'Abertas' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'closed', label: 'Finalizadas' },
];

/* ── Tipos ──────────────────────────────────────────────────────────────── */

interface RowMessage {
  id: string;
  chatId: string;
  clientKey: string | null;
  senderType: ChatSenderType;
  senderId: string | null;
  content: string;
  createdAt: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  readAt: string | null;
  pending?: boolean;
  failed?: boolean;
}

interface Attachment {
  url: string;
  type: string | null;
  name: string;
}

interface ConsultantOption {
  id: string;
  name: string;
  role: string;
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

function toRowMessage(dto: ChatMessageDto): RowMessage {
  return {
    id: dto.id,
    chatId: dto.chatId,
    clientKey: dto.clientKey,
    senderType: dto.senderType,
    senderId: dto.senderId,
    content: dto.content,
    createdAt: dto.createdAt,
    attachmentUrl: dto.attachmentUrl,
    attachmentName: dto.attachmentName,
    readAt: dto.readAt,
  };
}

/**
 * Reconciliação otimista: o servidor manda, as temporárias (pending/failed)
 * sobrevivem até o mesmo `clientKey` chegar. Sem isso a mensagem do usuário
 * desaparecia no primeiro poll. `replace` (refresh completo) também poda o
 * histórico que saiu da janela do servidor.
 */
function mergeMessages(local: RowMessage[], incoming: ChatMessageDto[], replace = false): RowMessage[] {
  const byId = new Map<string, RowMessage>();
  if (!replace) {
    for (const message of local) {
      if (!message.pending && !message.failed) byId.set(message.id, message);
    }
  }
  const serverKeys = new Set<string>();
  for (const dto of incoming) {
    byId.set(dto.id, toRowMessage(dto));
    if (dto.clientKey) serverKeys.add(dto.clientKey);
  }
  for (const message of local) {
    if (!message.pending && !message.failed) continue;
    if (message.clientKey && serverKeys.has(message.clientKey)) continue;
    byId.set(message.id, message);
  }
  return [...byId.values()];
}

function newestServerTimestamp(messages: RowMessage[]): string | null {
  let newest: number | null = null;
  for (const message of messages) {
    if (message.pending || message.failed) continue;
    const time = Date.parse(message.createdAt);
    if (Number.isFinite(time) && (newest === null || time > newest)) newest = time;
  }
  return newest === null ? null : new Date(newest).toISOString();
}

function backoffDelay(failures: number, base: number): number {
  if (failures <= 0) return base;
  return Math.min(POLL_MAX_MS, base * 2 ** Math.min(failures - 1, 4));
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}

function statusLabel(t: (key: string) => string, status: ChatStatus): string {
  if (status === 'pending') return t('Pendente');
  if (status === 'closed') return t('Finalizada');
  return t('Aberta');
}

function statusClasses(status: ChatStatus): string {
  if (status === 'closed') return 'border-[#3D2620] bg-[#150D0B] text-gray-400';
  if (status === 'pending') return 'border-amber-500/40 bg-amber-500/10 text-amber-300';
  return 'border-green-500/30 bg-green-500/10 text-green-300';
}

/* ── Linha da lista (memo) ──────────────────────────────────────────────── */

const ChatListItem = React.memo(function ChatListItem({
  chat,
  active,
  onSelect,
  timeLabel,
  statusText,
  previewLabel,
  unreadLabel,
}: {
  chat: ChatRowDto;
  active: boolean;
  onSelect: (id: string) => void;
  timeLabel: (iso: string) => string;
  statusText: string;
  previewLabel: string;
  unreadLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(chat.id)}
      aria-current={active ? 'true' : undefined}
      className={`flex w-full cursor-pointer items-start justify-between gap-3 border-b border-[#3D2620]/30 px-4 py-4 text-left transition-colors ${
        active ? 'border-l-2 border-l-[#C8A27C] bg-[#2A1616]/50' : 'hover:bg-[#1A1110]'
      }`}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#3D2620] bg-[#2A1112]">
          <User className="h-4 w-4 text-[#C8A27C]" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className={`truncate text-[11px] font-semibold ${active ? 'text-white' : 'text-gray-300'}`}>
              {chat.visitorName}
            </span>
            {chat.unread && (
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#C8A27C]"
                role="img"
                aria-label={unreadLabel}
              />
            )}
          </span>
          <span className="block max-w-[9rem] truncate text-[9px] text-gray-500 sm:max-w-[14rem]">
            {chat.preview || previewLabel}
          </span>
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1.5">
        <span className="text-[8px] text-gray-500">{timeLabel(chat.lastMessageAt)}</span>
        <span
          className={`rounded-sm border px-1.5 py-0.5 text-[7px] uppercase tracking-widest ${statusClasses(chat.status)}`}
        >
          {statusText}
        </span>
      </span>
    </button>
  );
});

/* ── Mensagem (memo) ────────────────────────────────────────────────────── */

const MessageRow = React.memo(function MessageRow({
  message,
  mine,
  reduceMotion,
  onRetry,
  retryLabel,
  failedLabel,
  time,
}: {
  message: RowMessage;
  mine: boolean;
  reduceMotion: boolean;
  onRetry: (message: RowMessage) => void;
  retryLabel: string;
  failedLabel: string;
  time: string;
}) {
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-md ${
          mine ? 'rounded-tr-none bg-[#592224] text-white' : 'rounded-tl-none bg-white text-[#0F0A08]'
        } ${message.pending && !reduceMotion ? 'opacity-70' : ''}`}
      >
        {message.attachmentUrl && (
          <a
            href={message.attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`mb-1.5 flex items-center gap-2 text-[10px] underline underline-offset-2 ${
              mine ? 'text-white/90' : 'text-[#7A4B2A]'
            }`}
          >
            <Paperclip className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{message.attachmentName || failedLabel}</span>
          </a>
        )}

        <p className={`text-[11px] leading-relaxed ${mine ? 'font-light' : 'font-medium'}`}>{message.content}</p>

        <div className="mt-1.5 flex items-center justify-end gap-1">
          {message.failed ? (
            <button
              type="button"
              onClick={() => onRetry(message)}
              className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-red-300 underline"
            >
              <RefreshCw className="h-2.5 w-2.5" aria-hidden="true" />
              {retryLabel}
            </button>
          ) : (
            <>
              <span className={`text-[7px] ${mine ? 'text-white/70' : 'text-gray-400'}`}>{time}</span>
              {mine &&
                (message.pending ? (
                  <Loader2 className="h-3 w-3 animate-spin text-white/60" aria-hidden="true" />
                ) : (
                  <CheckCheck className="h-3 w-3 text-blue-300" aria-hidden="true" />
                ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
});

/* ── Inbox ──────────────────────────────────────────────────────────────── */

export default function ConversasClient({ initialChatId }: { initialChatId?: string } = {}) {
  const { t, formatDate } = useLanguage();
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const reduceMotion = usePrefersReducedMotion();

  const [chats, setChats] = useState<ChatRowDto[]>([]);
  const [total, setTotal] = useState(0);
  const [listLoading, setListLoadedOnce] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const deferredSearch = useDeferredValue(debouncedSearch);
  const [statusFilter, setStatusFilter] = useState<'all' | ChatStatus>('all');

  const [activeId, setActiveId] = useState<string | null>(initialChatId ?? null);
  const [messages, setMessages] = useState<RowMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(() => Boolean(initialChatId));
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [chatStatus, setChatStatusState] = useState<ChatStatus>('open');

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileThread, setMobileThread] = useState(false);

  /* ── Atribuição de atendente (só admin) ────────────────────── */
  const [consultants, setConsultants] = useState<ConsultantOption[]>([]);
  const [assigning, setAssigning] = useState(false);
  /**
   * Atendente exibido enquanto a lista não volta do servidor. `assignChat` já
   * gravou no banco; manter o valor evita o seletor "pular" para o atendente
   * anterior no primeiro render depois do `setAssigning(false)`.
   */
  const [assignedTo, setAssignedTo] = useState<{ chatId: string; consultantId: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inFlightRef = useRef(false);
  const listSeqRef = useRef(0);
  const msgSeqRef = useRef(0);
  const msgCycleRef = useRef(0);
  const lastSyncRef = useRef<string | null>(null);
  const nearBottomRef = useRef(true);
  const activeIdRef = useRef<string | null>(null);

  // Espelho do id ativo em ref (o lint proíbe ler/escrever ref durante render).
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  /** Com busca/filtro ativo a lista é sob demanda: polling só no modo padrão. */
  const shouldPollList = useMemo(() => !deferredSearch && statusFilter === 'all', [deferredSearch, statusFilter]);

  /* ── Busca com debounce ───────────────────────────────────────────────── */

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  /* ── Equipe para o seletor de atendente ─────────────────────────────────── */

  /**
   * `getConsultants()` é `requireAdmin()`: para a consultora a chamada seria
   * recusada, então ela nem é disparada — o seletor aparece desabilitado com o
   * motivo visível. `setState` acontece no `.then`, nunca no corpo do efeito.
   */
  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    void (async () => {
      const result = await getConsultants();
      if (!active || !result.success) return;
      setConsultants((result.data ?? []) as ConsultantOption[]);
    })();
    return () => {
      active = false;
    };
  }, [isAdmin]);

  /* ── Carga da lista ───────────────────────────────────────────────────── */

  const loadList = useCallback(async (): Promise<boolean> => {
    const seq = ++listSeqRef.current;
    try {
      const result = await staffChatList({
        pageSize: PAGE_SIZE,
        status: statusFilter,
        search: deferredSearch || undefined,
      });
      if (seq !== listSeqRef.current) return false;
      if (result.success) {
        setChats(result.items);
        setTotal(result.total);
        setListError(null);
        setListLoadedOnce(true);
        return true;
      }
      setListError(t(result.error ?? 'Erro ao buscar conversas.'));
      return false;
    } catch {
      if (seq === listSeqRef.current) setListError(t('Erro ao buscar conversas.'));
      return false;
    }
  }, [deferredSearch, statusFilter, t]);

  useEffect(() => {
    let active = true;
    void (async () => {
      if (active) await loadList();
    })();
    return () => {
      active = false;
    };
  }, [loadList]);

  useEffect(() => {
    if (!shouldPollList) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let failures = 0;

    const tick = async () => {
      if (cancelled) return;
      if (document.visibilityState !== 'hidden') {
        failures = (await loadList()) ? 0 : failures + 1;
      }
      if (cancelled) return;
      timer = setTimeout(() => void tick(), backoffDelay(failures, LIST_POLL_MS));
    };

    timer = setTimeout(() => void tick(), LIST_POLL_MS);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [loadList, shouldPollList]);

  /* ── Badge de não lidas (polling 10s, pausa se oculta) ────────────────── */

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      if (!cancelled && document.visibilityState !== 'hidden') {
        try {
          const result = await getUnreadChatCount();
          if (!cancelled && result.success && result.data) setUnreadCount(result.data.count);
        } catch {
          /* silencioso: é só um badge */
        }
      }
      if (!cancelled) timer = setTimeout(() => void tick(), LIST_POLL_MS);
    };

    void tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  /* ── Mensagens da conversa aberta ─────────────────────────────────────── */

  const loadMessages = useCallback(
    async (chatId: string): Promise<boolean> => {
      const seq = ++msgSeqRef.current;
      const full = msgCycleRef.current % FULL_REFRESH_EVERY === 0;
      const since = full ? null : lastSyncRef.current;
      try {
        const result = await staffMessages(chatId, { since: since ?? undefined, take: HISTORY_LIMIT });
        if (seq !== msgSeqRef.current || activeIdRef.current !== chatId) return false;
        if (result.success && result.data) {
          msgCycleRef.current += 1;
          setMessages((current) => mergeMessages(current, result.data?.messages ?? [], full));
          setChatStatusState(result.data.status);
          setMessagesError(null);
          return true;
        }
        setMessagesError(t(result.error ?? 'Erro ao buscar mensagens.'));
        return false;
      } catch {
        if (seq === msgSeqRef.current) setMessagesError(t('Erro ao buscar mensagens.'));
        return false;
      } finally {
        if (seq === msgSeqRef.current) setMessagesLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    if (!activeId) return;
    // Só refs aqui: o estado da thread é zerado no handler de seleção
    // (`selectChat`), evitando render em cascata dentro do efeito.
    msgSeqRef.current += 1;
    msgCycleRef.current = 0;
    lastSyncRef.current = null;
    void loadMessages(activeId);
  }, [activeId, loadMessages]);

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let failures = 0;

    const tick = async () => {
      if (cancelled) return;
      if (document.visibilityState === 'hidden') {
        timer = setTimeout(() => void tick(), MESSAGE_POLL_MS);
        return;
      }
      failures = (await loadMessages(activeId)) ? 0 : failures + 1;
      if (cancelled) return;
      timer = setTimeout(() => void tick(), backoffDelay(failures, MESSAGE_POLL_MS));
    };

    timer = setTimeout(() => void tick(), MESSAGE_POLL_MS);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void tick();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      msgSeqRef.current += 1;
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [activeId, loadMessages]);

  useEffect(() => {
    const timestamp = newestServerTimestamp(messages);
    if (timestamp) lastSyncRef.current = timestamp;
  }, [messages]);

  /* ── Auto-scroll condicional ──────────────────────────────────────────── */

  const handleScroll = useCallback(() => {
    const node = scrollRef.current;
    if (!node) return;
    nearBottomRef.current = node.scrollHeight - node.scrollTop - node.clientHeight < NEAR_BOTTOM_PX;
  }, []);

  useEffect(() => {
    if (!nearBottomRef.current) return;
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [messages, reduceMotion]);

  /* ── Ações ────────────────────────────────────────────────────────────── */

  const activeChat = useMemo(
    () => (activeId ? (chats.find((chat) => chat.id === activeId) ?? null) : null),
    [chats, activeId],
  );

  const timeLabel = useCallback(
    (iso: string) => formatDate(iso, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
    [formatDate],
  );

  const selectChat = useCallback(
    (id: string) => {
      if (id === activeIdRef.current) return;
      setMessages([]);
      setMessagesError(null);
      setMessagesLoading(true);
      setAttachment(null);
      setInput('');
      setAssignedTo(null);
      setMobileThread(true);
      setActiveId(id);
    },
    [],
  );

  /** Atendente exibido no cabeçalho: o local pós-escrita ou o que veio da lista. */
  const assigneeId = useMemo(() => {
    if (assignedTo && assignedTo.chatId === activeId) return assignedTo.consultantId;
    return activeChat?.consultant.id ?? '';
  }, [activeChat, activeId, assignedTo]);

  const handleAssign = useCallback(
    async (consultantId: string) => {
      const chatId = activeIdRef.current;
      if (!chatId || !consultantId || assigning) return;

      setAssigning(true);
      try {
        const result = await assignChat(chatId, consultantId);
        if (result.success) {
          setAssignedTo({ chatId, consultantId });
          toast(t('admin.chat.transferred'), 'success');
          void loadList();
        } else {
          toast(t(result.error ?? 'Erro ao atribuir a conversa.'), 'error');
        }
      } catch {
        toast(t('admin.chat.assignFailed'), 'error');
      } finally {
        setAssigning(false);
      }
    },
    [assigning, loadList, t, toast],
  );

  const closeThreadOnMobile = useCallback(() => {
    setMobileThread(false);
  }, []);

  const send = useCallback(
    async (text: string, attachmentToSend: Attachment | null, retry?: RowMessage) => {
      const chatId = activeIdRef.current;
      if (!chatId) return;
      if (!retry && inFlightRef.current) return;

      const content = text.trim();
      if ((!content && !attachmentToSend) || content.length > MAX_MESSAGE_LENGTH) return;

      const clientKey = retry?.clientKey ?? crypto.randomUUID();
      const temp: RowMessage = retry
        ? { ...retry, content, pending: true, failed: false }
        : {
            id: `tmp:${clientKey}`,
            chatId,
            clientKey,
            senderType: 'consultant',
            senderId: user?.id ?? null,
            content,
            createdAt: new Date().toISOString(),
            attachmentUrl: attachmentToSend?.url ?? null,
            attachmentName: attachmentToSend?.name ?? null,
            readAt: null,
            pending: true,
          };

      inFlightRef.current = true;
      setSending(true);
      setMessages((current) =>
        retry ? current.map((message) => (message.id === retry.id ? temp : message)) : [...current, temp],
      );
      if (!retry) {
        setInput('');
        setAttachment(null);
        nearBottomRef.current = true;
      }

      const markFailed = () => {
        setMessages((current) =>
          current.map((message) =>
            message.clientKey === clientKey ? { ...message, pending: false, failed: true } : message,
          ),
        );
      };

      try {
        const result = await staffSendMessage({
          chatId,
          content,
          clientKey,
          attachmentUrl: attachmentToSend?.url,
          attachmentName: attachmentToSend?.name,
          attachmentType: attachmentToSend?.type,
        });
        if (result.success && result.data) {
          const real = toRowMessage(result.data.message);
          setMessages((current) => current.map((message) => (message.clientKey === clientKey ? real : message)));
          void loadList();
        } else {
          markFailed();
          toast(t(result.error ?? 'Erro ao enviar mensagem.'), 'error');
        }
      } catch {
        markFailed();
        toast(t('Não foi possível enviar a mensagem. Verifique sua conexão e tente de novo.'), 'error');
      } finally {
        inFlightRef.current = false;
        setSending(false);
      }
    },
    [loadList, t, toast, user?.id],
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const content = input.trim();
      if ((!content && !attachment) || inFlightRef.current) return;
      void send(content, attachment);
    },
    [attachment, input, send],
  );

  const handleRetry = useCallback(
    (failed: RowMessage) => {
      void send(failed.content, null, failed);
    },
    [send],
  );

  const handleUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;
      if (file.size > MAX_ATTACHMENT_BYTES) {
        toast(t('A imagem deve ter no máximo 5 MB.'), 'error');
        return;
      }
      setUploading(true);
      try {
        const body = new FormData();
        body.set('file', file);
        body.set('folder', 'chat');
        const response = await fetch('/api/media', {
          method: 'POST',
          body,
          credentials: 'same-origin',
          headers: { Accept: 'application/json' },
        });
        const payload = (await response.json()) as {
          success?: boolean;
          url?: string;
          mimeType?: string;
          filename?: string;
          error?: string;
        };
        if (!response.ok || !payload?.success || !payload.url) {
          throw new Error(payload?.error ?? 'upload');
        }
        setAttachment({ url: payload.url, type: payload.mimeType ?? null, name: payload.filename ?? file.name });
      } catch {
        toast(t('Não foi possível enviar o anexo.'), 'error');
      } finally {
        setUploading(false);
      }
    },
    [t, toast],
  );

  const changeStatus = useCallback(
    async (status: ChatStatus) => {
      const chatId = activeIdRef.current;
      if (!chatId) return;
      setStatusSaving(true);
      try {
        const result = await setChatStatus(chatId, status);
        if (result.success && result.data) {
          setChatStatusState(result.data.status);
          toast(t(status === 'closed' ? 'Conversa finalizada.' : 'Conversa atualizada.'), 'success');
          void loadList();
        } else {
          toast(t(result.error ?? 'Erro ao atualizar a conversa.'), 'error');
        }
      } catch {
        toast(t('Erro ao atualizar a conversa.'), 'error');
      } finally {
        setStatusSaving(false);
      }
    },
    [loadList, t, toast],
  );

  const handleMarkAllRead = useCallback(async () => {
    try {
      const result = await markAllChatsRead();
      if (result.success) {
        setUnreadCount(0);
        setChats((current) => current.map((chat) => ({ ...chat, unread: false })));
        toast(t('Conversas marcadas como lidas.'), 'success');
      }
    } catch {
      toast(t('Não foi possível marcar as conversas como lidas.'), 'error');
    }
  }, [t, toast]);

  /* ── Render ───────────────────────────────────────────────────────────── */

  const listView = (
    <div className="flex h-full flex-col border-r border-[#3D2620] bg-[#150D0B]">
      <div className="border-b border-[#3D2620] p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#C8A27C]">
            {t('Conversas ativas')}
          </span>
          {unreadCount > 0 && (
            <span className="rounded-sm bg-[#8A3324] px-1.5 py-0.5 text-[8px] font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={t('Buscar conversas...')}
            aria-label={t('Buscar conversas')}
            className="w-full rounded-sm border border-[#3D2620] bg-[#0F0A08] py-2 pl-9 pr-8 text-[10px] text-gray-300 focus:border-[#C8A27C] focus:outline-none"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              aria-label={t('Limpar busca')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              aria-pressed={statusFilter === filter.value}
              className={`cursor-pointer rounded-sm border px-2 py-1 text-[8px] uppercase tracking-widest transition-colors ${
                statusFilter === filter.value
                  ? 'border-[#C8A27C] bg-[#2A1616] text-[#C8A27C]'
                  : 'border-[#3D2620] text-gray-500 hover:text-gray-300'
              }`}
            >
              {t(filter.label)}
            </button>
          ))}
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => void handleMarkAllRead()}
              className="ml-auto cursor-pointer rounded-sm border border-[#3D2620] px-2 py-1 text-[8px] uppercase tracking-widest text-gray-400 hover:text-white"
            >
              {t('Marcar todas como lidas')}
            </button>
          )}
        </div>
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
        {listLoading && (
          <ul className="divide-y divide-[#3D2620]/30" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((slot) => (
              <li key={slot} className="flex items-center gap-3 px-4 py-4">
                <span className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-[#1A1110]" />
                <span className="flex-1 space-y-2">
                  <span className="block h-2.5 w-1/2 animate-pulse rounded bg-[#1A1110]" />
                  <span className="block h-2 w-3/4 animate-pulse rounded bg-[#1A1110]" />
                </span>
              </li>
            ))}
          </ul>
        )}

        {!listLoading && listError && (
          <div role="alert" className="flex flex-col items-center gap-3 p-6 text-center">
            <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
            <p className="text-[10px] text-gray-400">{listError}</p>
            <button
              type="button"
              onClick={() => {
                setListLoadedOnce(false);
                void loadList();
              }}
              className="flex cursor-pointer items-center gap-2 rounded-sm border border-[#3D2620] px-3 py-1.5 text-[9px] uppercase tracking-widest text-[#C8A27C] hover:bg-[#2A1616]"
            >
              <RefreshCw className="h-3 w-3" aria-hidden="true" />
              {t('Tentar novamente')}
            </button>
          </div>
        )}

        {!listLoading && !listError && chats.length === 0 && (
          <div className="flex flex-col items-center gap-2 p-8 text-center">
            <MessageSquare className="h-8 w-8 text-[#3D2620]" aria-hidden="true" />
            <p className="text-[10px] text-gray-500">{t('Nenhuma conversa encontrada.')}</p>
          </div>
        )}

        {!listLoading &&
          !listError &&
          chats.map((chat) => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              active={chat.id === activeId}
              onSelect={selectChat}
              timeLabel={timeLabel}
              statusText={statusLabel(t, chat.status)}
              previewLabel={t('Nova conversa...')}
              unreadLabel={t('Mensagens não lidas')}
            />
          ))}
      </div>

      {!listLoading && !listError && total > chats.length && (
        <p className="border-t border-[#3D2620] px-4 py-2 text-[8px] text-gray-500">
          {t('Mostrando')} {chats.length} {t('de')} {total}
        </p>
      )}
    </div>
  );

  const emptyView = (
    <div className="relative flex h-full flex-col items-center justify-center bg-[#1A1211]">
      <MessageSquare className="mb-4 h-12 w-12 text-[#3D2620]" aria-hidden="true" />
      <p className="text-[12px] text-gray-500">{t('Selecione uma conversa ao lado para iniciar.')}</p>
    </div>
  );

  const threadView = (
    <div className="relative flex h-full flex-col bg-[#1A1211]">
      <div className="flex h-auto shrink-0 flex-col justify-center gap-1 border-b border-[#3D2620] bg-[#150D0B] px-4 py-2.5 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={closeThreadOnMobile}
              aria-label={t('Voltar para a lista')}
              className="cursor-pointer p-2 text-[#C8A27C] lg:hidden"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#3D2620] bg-[#2A1112]">
              <User className="h-4 w-4 text-[#C8A27C]" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h4 className="truncate text-[11px] font-semibold text-white">
                {activeChat?.visitorName ?? t('Conversa')}
              </h4>
              <p className="truncate text-[9px] text-gray-500">
                {activeChat?.visitorEmail ?? (user ? t('Você') : '')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`hidden rounded-sm border px-2 py-1 text-[9px] font-semibold uppercase tracking-widest sm:inline-block ${statusClasses(chatStatus)}`}
            >
              {statusLabel(t, chatStatus)}
            </span>
            {chatStatus !== 'closed' && (
              <button
                type="button"
                disabled={statusSaving}
                onClick={() => void changeStatus('closed')}
                className="cursor-pointer rounded-sm border border-[#C8A27C]/40 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-[#C8A27C] transition-colors hover:bg-[#2A1616] disabled:opacity-50"
              >
                {statusSaving ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" /> : t('Finalizar')}
              </button>
            )}
            {chatStatus === 'closed' && (
              <button
                type="button"
                disabled={statusSaving}
                onClick={() => void changeStatus('open')}
                className="cursor-pointer rounded-sm border border-[#3D2620] px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-gray-300 hover:bg-[#2A1616] disabled:opacity-50"
              >
                {t('Reabrir')}
              </button>
            )}
            {chatStatus === 'open' && (
              <button
                type="button"
                disabled={statusSaving}
                onClick={() => void changeStatus('pending')}
                aria-label={t('Marcar como pendente')}
                className="hidden cursor-pointer rounded-sm border border-[#3D2620] px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-white disabled:opacity-50 sm:inline-block"
              >
                {t('Pendente')}
              </button>
            )}

            {/* Transferência de atendente: `assignChat` exige admin. */}
            <label htmlFor="chat-assignee" className="sr-only">
              {t('admin.chat.assignee')}
            </label>
            <select
              id="chat-assignee"
              value={assigneeId}
              disabled={assigning || !isAdmin}
              onChange={(event) => void handleAssign(event.target.value)}
              aria-label={t('admin.chat.assignee')}
              title={isAdmin ? undefined : t('admin.chat.assignAdminOnly')}
              className="max-w-[10rem] cursor-pointer rounded-sm border border-[#3D2620] bg-[#0F0A08] px-2 py-1.5 text-[9px] font-semibold text-gray-300 focus:border-[#C8A27C] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">{t('admin.chat.unassigned')}</option>
              {consultants.map((consultant) => (
                <option key={consultant.id} value={consultant.id}>
                  {consultant.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p role="status" className="truncate text-[8px] text-gray-500">
          {assigning
            ? t('admin.chat.assigning')
            : t('admin.chat.assigneeStatus').replace(
                '{name}',
                consultants.find((c) => c.id === assigneeId)?.name ?? t('admin.chat.unassigned'),
              )}
          {!isAdmin && ` — ${t('admin.chat.assignAdminOnly')}`}
        </p>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        aria-label={t('Mensagens da conversa')}
        className="custom-scrollbar relative z-10 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-6"
      >
        {messagesLoading && (
          <div className="space-y-3" aria-hidden="true">
            {[0, 1, 2].map((slot) => (
              <div key={slot} className={`h-12 animate-pulse rounded-2xl bg-[#1A1110] ${slot % 2 ? 'self-end' : ''}`} />
            ))}
          </div>
        )}

        {!messagesLoading && messagesError && (
          <div role="alert" className="flex flex-col items-center gap-3 py-6 text-center">
            <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
            <p className="text-[10px] text-gray-400">{messagesError}</p>
            <button
              type="button"
              onClick={() => {
                setMessagesLoading(true);
                msgCycleRef.current = 0;
                if (activeId) void loadMessages(activeId);
              }}
              className="flex cursor-pointer items-center gap-2 rounded-sm border border-[#3D2620] px-3 py-1.5 text-[9px] uppercase tracking-widest text-[#C8A27C] hover:bg-[#2A1616]"
            >
              <RefreshCw className="h-3 w-3" aria-hidden="true" />
              {t('Tentar novamente')}
            </button>
          </div>
        )}

        {!messagesLoading &&
          !messagesError &&
          messages.map((message) => (
            <MessageRow
              key={message.id}
              message={message}
              mine={message.senderType === 'consultant'}
              reduceMotion={reduceMotion}
              onRetry={handleRetry}
              retryLabel={t('Reenviar')}
              failedLabel={t('Mensagem não enviada')}
              time={formatDate(message.createdAt, { hour: '2-digit', minute: '2-digit' })}
            />
          ))}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex shrink-0 flex-col gap-2 border-t border-[#3D2620] bg-[#150D0B] px-4 py-3"
      >
        {attachment && (
          <div className="flex items-center justify-between gap-3 rounded-sm border border-[#3D2620] bg-[#0F0A08] px-3 py-2">
            <span className="flex min-w-0 items-center gap-2 text-[9px] text-gray-300">
              <Paperclip className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{attachment.name}</span>
            </span>
            <button
              type="button"
              onClick={() => setAttachment(null)}
              aria-label={t('Remover anexo')}
              className="cursor-pointer text-gray-500 hover:text-white"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
            onChange={(event) => void handleUpload(event)}
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            aria-label={t('Anexar imagem')}
            className="shrink-0 cursor-pointer text-gray-400 transition-colors hover:text-[#C8A27C] disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Paperclip className="h-4 w-4" aria-hidden="true" />
            )}
          </button>

          <div className="flex flex-1 items-center rounded-full border border-[#3D2620] bg-[#0F0A08] px-4 py-2.5">
            <input
              type="text"
              value={input}
              maxLength={MAX_MESSAGE_LENGTH}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t('Escreva sua resposta...')}
              aria-label={t('Escreva sua resposta')}
              className="w-full bg-transparent text-[11px] text-white focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={(!input.trim() && !attachment) || sending}
            aria-label={t('Enviar mensagem')}
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#C8A27C] text-[#0F0A08] transition-colors hover:bg-[#B8906C] disabled:opacity-50"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="-ml-0.5 h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="flex h-full w-full flex-col gap-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl text-white">{t('Conversas')}</h1>
          <p className="mt-1 text-[11px] font-light text-gray-400">{t('Atenda seus clientes em tempo real.')}</p>
        </div>
        <p className="text-[9px] uppercase tracking-widest text-gray-500">
          {t('Atendente')}: <span className="text-[#C8A27C]">{user?.name ?? '—'}</span>
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-md border border-[#3D2620] bg-[#120B0A]">
        <div className="flex h-full min-h-[32rem]">
          {/* No mobile a lista vira drawer: a thread ocupa a tela inteira. */}
          <div className={`h-full w-full lg:block lg:w-[35%] ${mobileThread ? 'hidden' : 'block'}`}>{listView}</div>
          <div className={`h-full w-full lg:block lg:w-[65%] ${mobileThread ? 'block' : 'hidden lg:block'}`}>
            {activeId ? threadView : emptyView}
          </div>
        </div>
      </div>
    </div>
  );
}
