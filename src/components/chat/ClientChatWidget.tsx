'use client';

/**
 * Chat de atendimento — widget público.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DECISÕES DE PRODUTO (leia antes de mexer)
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. SEM ANEXO PARA O VISITANTE. `POST /api/media` chama `requireStaff()`, então
 *    um visitante anônimo não tem upload possível sem abrir um buraco de
 *    segurança (bucket público) ou uma Edge Function (que o projeto não paga).
 *    O clipe fica visível, DESABILITADO, com o aviso de que o envio de arquivos
 *    acontece na central da atendente. Anexos de verdade existem no inbox
 *    (`/admin/conversas`), onde há sessão de staff.
 *
 * 2. SEM "TEMPO REAL" DE VERDADE. Não existe publicação no Supabase Realtime
 *    (o projeto não paga Edge Functions) e o Next 16 não tem canal push nativo
 *    do servidor para o navegador. O que existe e é usado aqui:
 *      - polling de 5s com `setTimeout` auto-agendado (nunca `setInterval` com
 *        requisições sobrepostas);
 *      - pausa em `document.hidden` e em `navigator.onLine === false`;
 *      - backoff exponencial 5s → 10s → 20s → 30s em caso de erro;
 *      - `seqRef` como token de sequência: respostas de uma conversa que já foi
 *        trocada são descartadas (server actions são RPC e não aceitam
 *        `AbortController`, então o token é o mecanismo correto de cancelamento);
 *      - busca incremental com `since` + refresh completo a cada 20 ciclos, para
 *        que uma colisão de timestamp de milissegundos nunca perca mensagem.
 *
 * 3. INSTÂNCIA ÚNICA. O widget pode ser montado em vários lugares (página
 *    /contato + layout raiz). Quem monta primeiro reivindica o slot em
 *    `sessionStorage` (síncrono, sem race entre dois efeitos do mesmo commit) e
 *    só esse renderiza o container `data-maeum-chat`.
 *
 * 4. MONTAGEM. `mode` default `'auto'`: em `/contato` o widget aparece embutido
 *    no grid (comportamento histórico, `src/app/contato/page.tsx` continua
 *    importando sem props); em qualquer outra rota vira balão flutuante. Para
 *    ter o widget no site inteiro, monte `<ClientChatWidget />` no layout raiz —
 *    aí o `auto` resolve para `'floating'`.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import {
  AlertTriangle,
  CheckCheck,
  ChevronLeft,
  Loader2,
  MessageCircle,
  Paperclip,
  RefreshCw,
  Send,
  Users,
  WifiOff,
  X,
} from 'lucide-react';
import SmartImage from '@/components/SmartImage';
import { stripLocalePrefix, useLanguage } from '@/contexts/LanguageContext';
import {
  getPublicConsultants,
  getVisitorMessages,
  sendVisitorMessage,
  startVisitorChat,
  type ChatMessageDto,
  type ChatSenderType,
  type ChatStatus,
  type PublicConsultantDto,
} from '@/actions/chatActions';

/* ── Constantes ─────────────────────────────────────────────────────────── */

const POLL_MS = 5_000;
const POLL_MAX_MS = 30_000;
const HISTORY_LIMIT = 100;
const FULL_REFRESH_EVERY = 20;
const MAX_MESSAGE_LENGTH = 2000;
const NEAR_BOTTOM_PX = 90;
const STORAGE_KEY = 'maeum_chat_session_v1';
const SLOT_KEY = 'maeum:chat-widget-slot';

/* ── Tipos ──────────────────────────────────────────────────────────────── */

export type ChatWidgetMode = 'auto' | 'inline' | 'floating';

export interface ClientChatWidgetProps {
  /** `auto` decide pelo pathname; `inline` é o painel no grid; `floating` é o balão. */
  mode?: ChatWidgetMode;
  className?: string;
}

interface StoredSession {
  chatId: string;
  visitorToken: string;
}

interface UiMessage {
  id: string;
  clientKey: string | null;
  senderType: ChatSenderType;
  content: string;
  /** ISO-8601 (UTC, vindo do servidor) ou ISO do relógio local (otimista). */
  createdAt: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  pending?: boolean;
  failed?: boolean;
}

type ConnectionState = 'online' | 'reconnecting' | 'offline';

/* ── Helpers puros ──────────────────────────────────────────────────────── */

function readSession(): StoredSession | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    if (typeof parsed?.chatId !== 'string' || typeof parsed?.visitorToken !== 'string') return null;
    return { chatId: parsed.chatId, visitorToken: parsed.visitorToken };
  } catch {
    return null;
  }
}

function writeSession(session: StoredSession): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* modo privado / storage bloqueado: a conversa vive só na sessão atual */
  }
}

function clearSession(): void {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** `true` para a primeira instância da aba. Síncrono → sem race entre efeitos. */
function claimSlot(): boolean {
  try {
    if (window.sessionStorage.getItem(SLOT_KEY)) return false;
    if (document.querySelector('[data-maeum-chat]')) return false;
    window.sessionStorage.setItem(SLOT_KEY, '1');
    return true;
  } catch {
    return true;
  }
}

function backoffDelay(failures: number): number {
  if (failures <= 0) return POLL_MS;
  return Math.min(POLL_MAX_MS, POLL_MS * 2 ** Math.min(failures - 1, 4));
}

function toUiMessage(dto: ChatMessageDto): UiMessage {
  return {
    id: dto.id,
    clientKey: dto.clientKey,
    senderType: dto.senderType,
    content: dto.content,
    createdAt: dto.createdAt,
    attachmentUrl: dto.attachmentUrl,
    attachmentName: dto.attachmentName,
  };
}

/**
 * Reconciliação: as mensagens do servidor são a fonte da verdade, as temporárias
 * (pending/failed) sobrevivem até serem substituídas pelo mesmo `clientKey`.
 * É o que impede a mensagem otimista de sumir quando o poll devolve o histórico.
 *
 * `replace = true` (refresh completo) descarta o que está além da janela do
 * servidor — sem isso a lista cresceria para sempre, a cada full refresh.
 */
function mergeMessages(local: UiMessage[], incoming: ChatMessageDto[], replace = false): UiMessage[] {
  const byId = new Map<string, UiMessage>();
  if (!replace) {
    for (const message of local) {
      if (!message.pending && !message.failed) byId.set(message.id, message);
    }
  }

  const serverKeys = new Set<string>();
  for (const dto of incoming) {
    byId.set(dto.id, toUiMessage(dto));
    if (dto.clientKey) serverKeys.add(dto.clientKey);
  }

  for (const message of local) {
    if (!message.pending && !message.failed) continue;
    if (message.clientKey && serverKeys.has(message.clientKey)) continue;
    byId.set(message.id, message);
  }

  return [...byId.values()];
}

function newestServerTimestamp(messages: UiMessage[]): string | null {
  let newest: number | null = null;
  for (const message of messages) {
    if (message.pending || message.failed) continue;
    const time = Date.parse(message.createdAt);
    if (Number.isFinite(time) && (newest === null || time > newest)) newest = time;
  }
  return newest === null ? null : new Date(newest).toISOString();
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

/* ── Componentes memoizados ─────────────────────────────────────────────── */

const ConsultantAvatar = React.memo(function ConsultantAvatar({
  name,
  avatarUrl,
  size = 32,
}: {
  name: string;
  avatarUrl: string | null;
  size?: number;
}) {
  const { t } = useLanguage();
  if (avatarUrl) {
    return (
      <span className="relative block shrink-0 overflow-hidden rounded-full border border-[#3D2620] bg-[#2A1616]">
        <SmartImage src={avatarUrl} alt={name} width={size} height={size} className="h-full w-full object-cover" />
      </span>
    );
  }
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full border border-[#3D2620] bg-[#2A1616] text-[#C8A27C]"
      style={{ width: size, height: size }}
      role="img"
      aria-label={t('Consultora')}
    >
      <Users className="h-1/2 w-1/2" aria-hidden="true" />
    </span>
  );
});

const TeamStack = React.memo(function TeamStack({ consultants }: { consultants: PublicConsultantDto[] }) {
  const visible = consultants.slice(0, 3);
  const extra = consultants.length - visible.length;
  if (visible.length === 0) return null;
  return (
    <div className="hidden items-center sm:flex" aria-hidden="true">
      {visible.map((consultant, index) => (
        <span
          key={consultant.id}
          className={`${index > 0 ? '-ml-2' : ''} rounded-full border-2 border-[#18110F] ${
            consultant.avatarUrl ? 'overflow-hidden' : 'flex h-7 w-7 items-center justify-center bg-[#2A1616]'
          }`}
          style={{ zIndex: visible.length - index }}
        >
          {consultant.avatarUrl ? (
            <SmartImage src={consultant.avatarUrl} alt="" width={28} height={28} className="h-7 w-7 object-cover" />
          ) : (
            <span className="text-[8px] font-bold text-[#C8A27C]">{consultant.name.charAt(0).toUpperCase()}</span>
          )}
        </span>
      ))}
      {extra > 0 && (
        <span className="-ml-2 z-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#18110F] bg-[#2A1616] text-[8px] font-bold text-[#C8A27C]">
          +{extra}
        </span>
      )}
    </div>
  );
});

const ChatBubble = React.memo(function ChatBubble({
  message,
  mine,
  reduceMotion,
  onRetry,
  retryLabel,
  errorLabel,
}: {
  message: UiMessage;
  mine: boolean;
  reduceMotion: boolean;
  onRetry: (message: UiMessage) => void;
  retryLabel: string;
  errorLabel: string;
}) {
  const { formatDate } = useLanguage();
  // O helper do `useLanguage()` usa o locale do app (`pt-BR`/`en-US`/`es-ES`) em
  // vez de `toLocaleTimeString([])`, que ignorava o idioma e quebrava a
  // hidratação quando o fuso do Node difere do navegador.
  const time = formatDate(message.createdAt, { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-md sm:max-w-[80%] ${
          mine ? 'rounded-tr-none bg-[#592224] text-white' : 'rounded-tl-none bg-white text-[#0F0A08]'
        } ${message.pending && !reduceMotion ? 'opacity-70' : ''}`}
      >
        {message.attachmentUrl ? (
          <a
            href={message.attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`mb-1.5 flex items-center gap-2 text-[10px] underline underline-offset-2 ${
              mine ? 'text-white/90' : 'text-[#7A4B2A]'
            }`}
          >
            <Paperclip className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{message.attachmentName || errorLabel}</span>
          </a>
        ) : null}

        <p className={`text-[11px] leading-relaxed ${mine ? 'font-light' : 'font-medium'}`}>
          {message.content}
        </p>

        <div className={`mt-1.5 flex items-center justify-end gap-1 ${mine ? '' : 'text-[#0F0A08]/40'}`}>
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

        {message.failed && <span className="sr-only">{errorLabel}</span>}
      </div>
    </div>
  );
});

/* ── Widget ─────────────────────────────────────────────────────────────── */

export default function ClientChatWidget(props: ClientChatWidgetProps = {}) {
  const { mode = 'auto', className = '' } = props;
  const pathname = usePathname();
  const { t } = useLanguage();
  const reduceMotion = usePrefersReducedMotion();

  const [isPrimary, setIsPrimary] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  const [step, setStep] = useState<'form' | 'chat'>('form');
  const [chatId, setChatId] = useState<string | null>(null);
  const [visitorToken, setVisitorToken] = useState<string>('');
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [consultants, setConsultants] = useState<PublicConsultantDto[]>([]);
  const [consultant, setConsultant] = useState<{ id: string; name: string; avatarUrl: string | null } | null>(null);
  const [status, setStatus] = useState<ChatStatus>('open');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connection, setConnection] = useState<ConnectionState>('online');
  const [unread, setUnread] = useState(false);

  const [form, setForm] = useState({ name: '', email: '', message: '', company: '' });
  const [input, setInput] = useState('');

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const inFlightRef = useRef(false);
  const seqRef = useRef(0);
  const cycleRef = useRef(0);
  const lastSyncRef = useRef<string | null>(null);
  const nearBottomRef = useRef(true);
  const lastSeenAtRef = useRef(0);
  const chatIdRef = useRef<string | null>(null);
  const tokenRef = useRef<string>('');

  const resolvedMode: 'inline' | 'floating' = useMemo(() => {
    if (mode !== 'auto') return mode;
    const path = stripLocalePrefix(pathname || '/');
    return path === '/contato' || path === '/contato/' ? 'inline' : 'floating';
  }, [mode, pathname]);

  /* ── Instância única +-mount ─────────────────────────────────────────── */

  // `setState` síncrono aqui é intencional: sem ele não existe forma de saber,
  // no cliente, se esta instância é a dona do slot nem se o `document` está
  // pronto (SSR não tem `sessionStorage`). Uma vez, no mount, sem loop.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- gate de mount (ver comentário acima)
    setMounted(true);
    setIsPrimary(claimSlot());
    lastSeenAtRef.current = Date.now();
  }, []);

  /* ── Catálogo público da equipe (uma vez) ────────────────────────────── */

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const result = await getPublicConsultants();
        if (!cancelled && result.success && result.data) setConsultants(result.data);
      } catch {
        /* a lista é decorativa: se falhar, o cabeçalho mostra a equipe sem rostos */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ── Restaura a conversa anterior (mesma aba) ────────────────────────── */

  useEffect(() => {
    if (!isPrimary) return;
    const stored = readSession();
    if (!stored) return;
    let cancelled = false;
    void (async () => {
      try {
        const result = await getVisitorMessages(stored.chatId, { visitorToken: stored.visitorToken });
        if (cancelled) return;
        if (result.success && result.data) {
          chatIdRef.current = stored.chatId;
          tokenRef.current = stored.visitorToken;
          setChatId(stored.chatId);
          setVisitorToken(stored.visitorToken);
          setConsultant(result.data.consultant);
          setStatus(result.data.status);
          setMessages(result.data.messages.map(toUiMessage));
          setStep('chat');
          if (resolvedMode === 'floating') setOpen(true);
        } else {
          // Token inválido (storage antigo, sessão expirada no servidor): recomeça.
          clearSession();
        }
      } catch {
        clearSession();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isPrimary, resolvedMode]);

  /* ── Polling incremental com pausa, backoff e token de sequência ──────── */

  useEffect(() => {
    if (step !== 'chat' || !chatId || !visitorToken) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let failures = 0;

    const schedule = (delay: number) => {
      if (cancelled) return;
      timer = setTimeout(() => {
        void tick();
      }, delay);
    };

    const tick = async () => {
      if (cancelled) return;

      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        schedule(POLL_MS);
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        setConnection('offline');
        schedule(POLL_MS);
        return;
      }

      const seq = ++seqRef.current;
      const full = cycleRef.current % FULL_REFRESH_EVERY === 0;
      const since = full ? null : lastSyncRef.current;

      try {
        const result = await getVisitorMessages(chatId, {
          visitorToken,
          since: since ?? undefined,
          take: HISTORY_LIMIT,
        });
        // Resposta obsoleta (a troca de conversa já limpou o estado): descarta.
        if (cancelled || seq !== seqRef.current) return;

        if (result.success && result.data) {
          cycleRef.current += 1;
          failures = 0;
          setConnection('online');
          setConsultant(result.data.consultant);
          setStatus(result.data.status);
          const incoming = result.data.messages;
          if (incoming.some((dto) => dto.senderType === 'consultant' && Date.parse(dto.createdAt) > lastSeenAtRef.current)) {
            setUnread(true);
          }
          setMessages((current) => mergeMessages(current, incoming, full));
        } else {
          failures += 1;
          setConnection('reconnecting');
        }
      } catch {
        failures += 1;
        setConnection('reconnecting');
      }

      schedule(backoffDelay(failures));
    };

    void tick();

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void tick();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('online', onVisibility);

    return () => {
      cancelled = true;
      seqRef.current += 1;
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('online', onVisibility);
    };
  }, [step, chatId, visitorToken, resolvedMode, open]);

  /* ── Marca como lida ao abrir + cursor de incremental ────────────────── */
  /* O reset acontece nos MESMOS handlers que mudam `open` (nunca em effect),
     para não provocar um render em cascata a cada abertura.              */

  useEffect(() => {
    const timestamp = newestServerTimestamp(messages);
    if (timestamp) lastSyncRef.current = timestamp;
  }, [messages]);

  /* ── Auto-scroll só quando o usuário já estava perto do fim ──────────── */

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

  /* ── Foco ao abrir ───────────────────────────────────────────────────── */

  useEffect(() => {
    if (resolvedMode !== 'floating' || !open) return;
    panelRef.current?.focus();
  }, [resolvedMode, open]);

  /* ── Ações ───────────────────────────────────────────────────────────── */

  /** Único caminho para abrir/fechar o balão: zera o marcador de não lida. */
  const setDrawer = useCallback((next: boolean) => {
    setOpen(next);
    if (next) {
      setUnread(false);
      lastSeenAtRef.current = Date.now();
    }
  }, []);

  const toggleDrawer = useCallback(() => {
    setDrawer(!open);
  }, [open, setDrawer]);

  const startChat = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (inFlightRef.current) return;
      const content = form.message.trim();
      if (form.name.trim().length < 2 || !form.email.trim()) return;

      inFlightRef.current = true;
      setSending(true);
      setError(null);

      const clientKey = crypto.randomUUID();
      try {
        const result = await startVisitorChat({
          name: form.name.trim(),
          email: form.email.trim(),
          message: content,
          clientKey,
          company: form.company,
        });

        if (!result.success || !result.data) {
          setError(t(result.error ?? 'Não foi possível iniciar o atendimento. Tente novamente.'));
          return;
        }

        const session: StoredSession = { chatId: result.data.chatId, visitorToken: result.data.visitorToken };
        writeSession(session);
        chatIdRef.current = session.chatId;
        tokenRef.current = session.visitorToken;
        setChatId(session.chatId);
        setVisitorToken(session.visitorToken);
        setConsultant(result.data.consultant);
        setStatus('open');
        setInput(content);
        setMessages(mergeMessages([], result.data.messages));
        setStep('chat');
        setForm({ name: '', email: '', message: '', company: '' });
      } catch {
        setError(t('Não foi possível iniciar o atendimento. Tente novamente.'));
      } finally {
        inFlightRef.current = false;
        setSending(false);
      }
    },
    [form, t],
  );

  const send = useCallback(
    async (text: string, retry?: UiMessage) => {
      const activeChatId = chatIdRef.current;
      const token = tokenRef.current;
      if (!activeChatId || !token) return;
      if (!retry && inFlightRef.current) return;

      const content = text.trim();
      if (!content || content.length > MAX_MESSAGE_LENGTH) return;

      const clientKey = retry?.clientKey ?? crypto.randomUUID();
      const temp: UiMessage = retry
        ? { ...retry, pending: true, failed: false }
        : {
            id: `tmp:${clientKey}`,
            clientKey,
            senderType: 'visitor',
            content,
            createdAt: new Date().toISOString(),
            pending: true,
          };

      inFlightRef.current = true;
      setSending(true);
      setError(null);
      setMessages((current) =>
        retry ? current.map((message) => (message.id === retry.id ? temp : message)) : [...current, temp],
      );
      if (!retry) setInput('');

      const markFailed = () => {
        setMessages((current) =>
          current.map((message) =>
            message.clientKey === clientKey ? { ...message, pending: false, failed: true } : message,
          ),
        );
      };

      try {
        const result = await sendVisitorMessage({ chatId: activeChatId, visitorToken: token, content, clientKey });
        if (result.success && result.data) {
          const real = toUiMessage(result.data.message);
          setMessages((current) => current.map((message) => (message.clientKey === clientKey ? real : message)));
        } else {
          // NUNCA perde o texto: a mensagem fica marcada como falha, com retry.
          markFailed();
          setError(t(result.error ?? 'Não foi possível enviar a mensagem.'));
        }
      } catch {
        markFailed();
        setError(t('Não foi possível enviar a mensagem. Verifique sua conexão e tente de novo.'));
      } finally {
        inFlightRef.current = false;
        setSending(false);
      }
    },
    [t],
  );

  const handleRetry = useCallback(
    (failed: UiMessage) => {
      void send(failed.content, failed);
    },
    [send],
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const content = input.trim();
      if (!content || inFlightRef.current) return;
      void send(content);
    },
    [input, send],
  );

  const resetConversation = useCallback(() => {    clearSession();
    chatIdRef.current = null;
    tokenRef.current = '';
    seqRef.current += 1;
    lastSyncRef.current = null;
    cycleRef.current = 0;
    setChatId(null);
    setVisitorToken('');
    setMessages([]);
    setConsultant(null);
    setInput('');
    setStatus('open');
    setStep('form');
  }, []);

  const handlePanelKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (resolvedMode !== 'floating') return;
      if (event.key !== 'Escape' || !open) return;
      event.stopPropagation();
      setDrawer(false);
    },
    [resolvedMode, open, setDrawer],
  );

  /* ── Derivados ───────────────────────────────────────────────────────── */

  const firstName = consultant?.name?.split(' ')[0] ?? '';

  const connectionLabel =
    connection === 'offline'
      ? t('Sem conexão. Suas mensagens serão enviadas quando a internet voltar.')
      : connection === 'reconnecting'
        ? t('Reconectando…')
        : '';

  /* ── Painel (conteúdo) ─────────────────────────────────────────────────
     Sem cabeçalho próprio: as duas variantes (inline e flutuante) já têm o
     cabeçalho com a atendente e o indicador de conexão logo acima.        */

  const panel = (
    <div className="flex min-h-0 flex-1 flex-col">
      {status === 'closed' && (
        <p className="mx-4 mb-2 rounded-md border border-[#3D2620] bg-[#150D0B] px-3 py-2 text-[9px] text-gray-400">
          {t('Esta conversa foi finalizada. Envie uma mensagem para reabrir o atendimento.')}
        </p>
      )}

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        aria-label={t('Mensagens do atendimento')}
        className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-6"
      >
        {messages.length === 0 && (
          <p className="py-6 text-center text-[10px] text-gray-500">{t('Nenhuma mensagem ainda.')}</p>
        )}
        {messages.map((message) => (
          <ChatBubble
            key={message.id}
            message={message}
            mine={message.senderType === 'visitor'}
            reduceMotion={reduceMotion}
            onRetry={handleRetry}
            retryLabel={t('Reenviar')}
            errorLabel={t('Mensagem não enviada')}
          />
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex shrink-0 items-center gap-3 border-t border-[#3D2620] bg-[#150D0B] px-4 py-3"
      >
        {/* Anexo indisponível para visitante: /api/media exige sessão de staff. */}
        <span
          title={t('O envio de anexos está disponível na central da atendente.')}
          aria-label={t('O envio de anexos está disponível na central da atendente.')}
          className="shrink-0 cursor-not-allowed text-gray-600"
        >
          <Paperclip className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="flex flex-1 items-center rounded-full border border-[#3D2620] bg-[#0F0A08] px-4 py-2.5">
          <input
            type="text"
            value={input}
            maxLength={MAX_MESSAGE_LENGTH}
            onChange={(event) => setInput(event.target.value)}
            placeholder={t('Digite sua mensagem...')}
            aria-label={t('Digite sua mensagem...')}
            className="w-full bg-transparent text-[11px] text-white focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={!input.trim() || sending}
          aria-label={t('Enviar mensagem')}
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#C8A27C] text-[#0F0A08] transition-colors hover:bg-[#B8906C] disabled:opacity-50"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="-ml-0.5 h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </form>
    </div>
  );

  const formView = (
    <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-8">
      <div className="relative w-full max-w-sm rounded-xl border border-[#3D2620] bg-[#150D0B] p-6 text-center shadow-lg">
        <span className="absolute -top-6 left-1/2 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border border-[#3D2620] bg-[#2A1616]">
          <MessageCircle className="h-5 w-5 text-[#C8A27C]" aria-hidden="true" />
        </span>

        <h3 className="mb-2 mt-4 font-heading text-sm text-white">
          {t('Olá! Sou a')} {firstName || t('Consultora')}.
        </h3>
        <p className="mb-6 text-[10px] text-gray-400">{t('Para iniciarmos nosso atendimento, por favor, me diga seu nome e e-mail.')}</p>

        <form onSubmit={startChat} className="flex flex-col gap-3 text-left">
          <div>
            <label htmlFor="maeum-chat-name" className="mb-1 block pl-1 text-[9px] uppercase tracking-widest text-gray-400">
              {t('Seu Nome')}
            </label>
            <input
              id="maeum-chat-name"
              required
              minLength={2}
              maxLength={120}
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-md border border-[#3D2620] bg-[#0F0A08] p-2.5 text-[11px] text-white focus:border-[#C8A27C] focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="maeum-chat-email" className="mb-1 block pl-1 text-[9px] uppercase tracking-widest text-gray-400">
              {t('E-mail')}
            </label>
            <input
              id="maeum-chat-email"
              required
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className="w-full rounded-md border border-[#3D2620] bg-[#0F0A08] p-2.5 text-[11px] text-white focus:border-[#C8A27C] focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="maeum-chat-message" className="mb-1 block pl-1 text-[9px] uppercase tracking-widest text-gray-400">
              {t('Como podemos ajudar?')}
            </label>
            <textarea
              id="maeum-chat-message"
              required
              rows={3}
              maxLength={MAX_MESSAGE_LENGTH}
              value={form.message}
              onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
              className="w-full resize-y rounded-md border border-[#3D2620] bg-[#0F0A08] p-2.5 text-[11px] text-white focus:border-[#C8A27C] focus:outline-none"
            />
          </div>

          {/* Honeypot: invisível para humanos, preenchido por bots. */}
          <div aria-hidden="true" className="absolute left-[-9999px] top-[-9999px] h-0 w-0 overflow-hidden">
            <label htmlFor="maeum-chat-company">Company</label>
            <input
              id="maeum-chat-company"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={form.company}
              onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))}
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="mt-2 w-full cursor-pointer rounded-md bg-[#C8A27C] py-3 text-[10px] font-bold uppercase tracking-widest text-[#0F0A08] transition-all hover:bg-[#B8906C] disabled:opacity-50"
          >
            {sending ? t('Conectando...') : t('Começar a Conversar')}
          </button>
        </form>
      </div>
    </div>
  );

  const errorBar = error ? (
    <div role="alert" className="flex items-start gap-2 border-b border-[#3D2620] bg-[#2A1112] px-4 py-2.5 text-[9px] text-red-200">
      <AlertTriangle className="mt-px h-3 w-3 shrink-0" aria-hidden="true" />
      <span className="flex-1">{error}</span>
      <button type="button" onClick={() => setError(null)} aria-label={t('Fechar')} className="shrink-0 opacity-70 hover:opacity-100">
        <X className="h-3 w-3" aria-hidden="true" />
      </button>
    </div>
  ) : null;

  if (!mounted || !isPrimary) return null;

  /* ── Variante embutida (página /contato) ─────────────────────────────── */

  if (resolvedMode === 'inline') {
    return (
      <div
        data-maeum-chat=""
        className={`flex h-[600px] flex-col overflow-hidden rounded-sm border border-[#3D2620] bg-[#120B0A] shadow-2xl sm:h-[650px] lg:w-[70%] ${className}`}
      >
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#3D2620] bg-[#18110F] px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {consultant ? (
              <ConsultantAvatar name={consultant.name} avatarUrl={consultant.avatarUrl} size={32} />
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#3D2620] bg-[#2A1616]">
                <Users className="h-4 w-4 text-[#C8A27C]" aria-hidden="true" />
              </span>
            )}
            <div className="min-w-0">
              <h3 className="truncate text-[10px] font-bold uppercase tracking-widest text-white sm:text-[11px]">
                {consultant
                  ? `${t('CHAT COM')} ${firstName}`
                  : t('CHAT COM NOSSAS CONSULTORAS')}
              </h3>
              <p className="mt-0.5 flex items-center gap-1.5 text-[8px] text-gray-400 sm:text-[9px]">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${connection === 'online' ? 'bg-green-500' : 'bg-amber-500'}`}
                  aria-hidden="true"
                />
                {connectionLabel || t('Online agora')}
              </p>
            </div>
          </div>
          <TeamStack consultants={consultants} />
        </header>

        {errorBar}
        {step === 'chat' ? panel : formView}
      </div>
    );
  }

  /* ── Variante flutuante (site inteiro) ────────────────────────────────── */

  const drawer = (
    <div
      ref={panelRef}
      tabIndex={-1}
      onKeyDown={handlePanelKeyDown}
      role="dialog"
      aria-modal="false"
      aria-label={t('Atendimento Maeum Global')}
      data-maeum-chat=""
      className="flex h-[70vh] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-t-2xl border border-[#3D2620] bg-[#120B0A] shadow-2xl outline-none"
    >
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#3D2620] bg-[#18110F] px-3">
        <div className="flex min-w-0 items-center gap-2">
          {consultant ? (
            <ConsultantAvatar name={consultant.name} avatarUrl={consultant.avatarUrl} size={28} />
          ) : (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#3D2620] bg-[#2A1616]">
              <Users className="h-3.5 w-3.5 text-[#C8A27C]" aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-[10px] font-bold uppercase tracking-widest text-white">
              {consultant ? `${t('CHAT COM')} ${firstName}` : t('CHAT COM NOSSAS CONSULTORAS')}
            </p>
            {step === 'chat' && (
              <p className="mt-0.5 flex items-center gap-1.5 text-[8px] text-gray-400">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${connection === 'online' ? 'bg-green-500' : 'bg-amber-500'}`}
                  aria-hidden="true"
                />
                {connectionLabel || t('Online agora')}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {step === 'chat' && (
            <button
              type="button"
              onClick={resetConversation}
              className="px-2 py-1 text-[8px] uppercase tracking-widest text-gray-500 hover:text-white"
            >
              {t('Nova')}
            </button>
          )}
          <button
            type="button"
            onClick={() => setDrawer(false)}
            aria-label={t('Fechar atendimento')}
            className="p-1.5 text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      {errorBar}
      {step === 'chat' ? panel : formView}
    </div>
  );

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] flex justify-end sm:z-[90]" style={{ zIndex: 90 }}>
      <div className="pointer-events-auto flex flex-col items-end">
        {open && drawer}
        <button
          type="button"
          onClick={toggleDrawer}
          aria-expanded={open}
          aria-label={open ? t('Fechar atendimento') : t('Abrir atendimento')}
          className="m-4 flex cursor-pointer items-center gap-2 rounded-full border border-[#3D2620] bg-[#C8A27C] px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#0F0A08] shadow-2xl transition-colors hover:bg-[#B8906C]"
        >
          {open ? <ChevronLeft className="h-4 w-4" aria-hidden="true" /> : <MessageCircle className="h-4 w-4" aria-hidden="true" />}
          <span className="hidden sm:inline">{t('CHAT COM NOSSAS CONSULTORAS')}</span>
          <span className="sm:hidden">{t('Chat')}</span>
          {!open && unread && (
            <span
              className="h-2 w-2 rounded-full bg-[#8A3324]"
              aria-hidden="true"
              style={{ boxShadow: '0 0 0 3px rgba(138,51,36,0.25)' }}
            />
          )}
          {connection === 'offline' && <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />}
        </button>
      </div>
    </div>,
    document.body,
  );
}
