'use server';

/**
 * Chat de atendimento — cliente ↔ atendente.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * POR QUE ESTE ARQUIVO FOI REESCRITO DO ZERO
 * ═══════════════════════════════════════════════════════════════════════════
 * As 4 actions anteriores NÃO tinham nenhuma checagem de autorização:
 *   - `initClientChat` aceitava `customerId`/`consultantId` do cliente, ou seja,
 *     o visitante escolhia a própria identidade E indicava a atendente;
 *   - `getChatMessages(chatId)` era um oráculo de IDOR: qualquer chatId lido no
 *     navegador trazia a conversa inteira de outra pessoa;
 *   - `sendMessage` aceitaria `senderId` do cliente — impersonação trivial;
 *   - `getAdminChats()` listava todas as conversas (nome + e-mail) para
 *     qualquer visitante anônimo.
 *
 * O modelo agora separa dois mundos:
 *   - ATENDENTE (`requireStaff`) → `staffChatList`, `staffMessages`,
 *     `staffSendMessage`, `setChatStatus`, `markAllChatsRead`,
 *     `getUnreadChatCount`, `assignChat` (admin).
 *   - VISITANTE anônimo (`startVisitorChat`, `getVisitorMessages`,
 *     `sendVisitorMessage`) → precisa do `visitorToken`, cuja prova de posse é
 *     `Chat.visitorTokenHash = sha256(token)` (ver `assertVisitorOwnership`).
 *
 * Nenhuma action aceita `customerId`, `consultantId` ou `senderId` do cliente:
 * a identidade do autor vem SEMPRE do token HMAC do cookie (`ctx.user.id`).
 *
 * Regras aplicadas (BRIEF):
 *  - entrada por `ActionInput` (FormData ou objeto) via `pick()`;
 *  - saída por `ActionResult<T>` (`ok`/`fail`/`failPublic`), nunca exceção;
 *  - `revalidatePath` em toda mutação + `auditLog` nas administrativas;
 *  - listas paginadas (max 100) com `select` explícito;
 *  - joins por `Map` (nunca `find()` dentro de `map`).
 */

import { revalidatePath } from 'next/cache';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { requireStaff, requireAdmin, assertChatAccess, getRequestMeta, type AuthContext } from '@/lib/auth';
import { isAdmin } from '@/lib/session';
import { auditLog } from '@/lib/audit';
import { notifyUser } from '@/lib/notify';
import { pickAvailableConsultant, listPublicConsultants, CHAT_ROUTING_ERROR } from '@/lib/chatRouting';
import { allowFormAction, rateLimit, getClientIp, RATE_LIMIT_MESSAGE } from '@/lib/rateLimit';
import { sha256 } from '@/lib/password';
import { str, isValidEmail, normalizeEmail, safeUrl } from '@/lib/validate';
import {
  pick,
  paginate,
  pageMeta,
  fail,
  ok,
  failPublic,
  GENERIC_ERROR,
  type ActionInput,
  type ActionResult,
  type ListResult,
} from '@/lib/actionKit';

/* ══════════════════════════════════════════════════════════════════════════
 * Contratos (exportados como TIPO — apagado em tempo de compilação, seguro
 * dentro de um arquivo 'use server')
 * ══════════════════════════════════════════════════════════════════════════ */

export type ChatSenderType = 'visitor' | 'consultant' | 'system';
export type ChatStatus = 'open' | 'pending' | 'closed';

export interface ChatMessageDto {
  id: string;
  chatId: string;
  senderId: string | null;
  senderType: ChatSenderType;
  content: string;
  clientKey: string | null;
  readAt: string | null;
  attachmentUrl: string | null;
  attachmentType: string | null;
  attachmentName: string | null;
  /** ISO-8601 (UTC). Serializar como string evita divergência de TZ do cliente. */
  createdAt: string;
}

export interface PublicConsultantDto {
  id: string;
  name: string;
  avatarUrl: string | null;
  jobTitle: string | null;
  isActive: boolean;
}

export interface StartVisitorChatDto {
  chatId: string;
  /** Prova de posse — o navegador guarda (sessionStorage) e reenvia sempre. */
  visitorToken: string;
  consultant: { id: string; name: string; avatarUrl: string | null };
  messages: ChatMessageDto[];
}

export interface VisitorThreadDto {
  messages: ChatMessageDto[];
  unreadCount: number;
  status: ChatStatus;
  consultant: { id: string; name: string; avatarUrl: string | null };
}

export interface ChatRowDto {
  id: string;
  status: ChatStatus;
  visitorName: string;
  visitorEmail: string | null;
  visitorKind: 'lead' | 'customer' | 'unknown';
  preview: string | null;
  lastMessageAt: string;
  createdAt: string;
  closedAt: string | null;
  unread: boolean;
  consultant: { id: string; name: string; avatarUrl: string | null };
}

export interface SendMessageDto {
  message: ChatMessageDto;
  /** `true` quando o `clientKey` já existia (retry idempotente). */
  duplicate: boolean;
}

/* ══════════════════════════════════════════════════════════════════════════
 * Constantes e helpers internos (NÃO exportados: um arquivo 'use server'
 * só pode exportar funções async)
 * ══════════════════════════════════════════════════════════════════════════ */

const MAX_MESSAGE_LENGTH = 2000;
const MAX_NAME_LENGTH = 120;
const PREVIEW_LENGTH = 160;
const UNREAD_SCAN_LIMIT = 500;
const STATUSES: readonly ChatStatus[] = ['open', 'pending', 'closed'];
const SENDER_TYPES: readonly ChatSenderType[] = ['visitor', 'consultant', 'system'];

const ERR_NAME_REQUIRED = 'Informe seu nome.';
const ERR_EMAIL_INVALID = 'E-mail inválido.';
const ERR_MESSAGE_REQUIRED = 'Escreva sua mensagem.';
const ERR_MESSAGE_TOO_LONG = `Sua mensagem pode ter no máximo ${MAX_MESSAGE_LENGTH} caracteres.`;
const ERR_CHAT_NOT_FOUND = 'Conversa não encontrada.';
const ERR_CHAT_INVALID_TOKEN = 'Conversa não encontrada.';
const ERR_NO_CONTENT = 'Escreva sua mensagem.';
const ERR_SEND_FAILED = 'Não foi possível enviar a mensagem.';
const ERR_STATUS_INVALID = 'Status de conversa inválido.';
const ERR_ATTACHMENT_INVALID = 'Anexo inválido.';
const ERR_START_FAILED = 'Não foi possível iniciar o atendimento. Tente novamente.';

const MESSAGE_SELECT = {
  id: true,
  chatId: true,
  senderId: true,
  senderType: true,
  content: true,
  clientKey: true,
  readAt: true,
  attachmentUrl: true,
  attachmentType: true,
  attachmentName: true,
  createdAt: true,
} as const;

type MessageRow = {
  id: string;
  chatId: string;
  senderId: string | null;
  senderType: string;
  content: string;
  clientKey: string | null;
  readAt: Date | null;
  attachmentUrl: string | null;
  attachmentType: string | null;
  attachmentName: string | null;
  createdAt: Date;
};

function toSenderType(value: string): ChatSenderType {
  return (SENDER_TYPES as readonly string[]).includes(value) ? (value as ChatSenderType) : 'visitor';
}

function toMessageDto(row: MessageRow): ChatMessageDto {
  return {
    id: row.id,
    chatId: row.chatId,
    senderId: row.senderId,
    senderType: toSenderType(row.senderType),
    content: row.content,
    clientKey: row.clientKey,
    readAt: row.readAt ? row.readAt.toISOString() : null,
    attachmentUrl: row.attachmentUrl,
    attachmentType: row.attachmentType,
    attachmentName: row.attachmentName,
    createdAt: row.createdAt.toISOString(),
  };
}

function preview(content: string): string {
  const flat = content.replace(/\s+/g, ' ').trim();
  return flat.length > PREVIEW_LENGTH ? `${flat.slice(0, PREVIEW_LENGTH)}…` : flat;
}

function revalidateConversations() {
  revalidatePath('/admin/conversas');
  revalidatePath('/dashboard/consultora');
  revalidatePath('/dashboard/admin');
}

/** UUID (ou qualquer id não vazio) — corta oráculo de IDOR por string gigante. */
function readId(value: FormDataEntryValue | undefined, max = 64): string {
  const raw = str(value, max);
  return raw.length >= 8 && raw.length <= max ? raw : '';
}

/** `since` ISO vindo do navegador — inválido viria `null` (fetch completo). */
function readSince(value: FormDataEntryValue | undefined): Date | null {
  const raw = str(value, 40);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function readClientKey(value: FormDataEntryValue | undefined): string {
  const raw = str(value, 64);
  return raw.length >= 8 && raw.length <= 64 ? raw : '';
}

/* ══════════════════════════════════════════════════════════════════════════
 * Prova de posse do chat de visitante (`Chat.visitorTokenHash`)
 * ══════════════════════════════════════════════════════════════════════════
 * A coluna foi adicionada ao schema junto com esta reescrita. O Prisma Client
 * gerado ainda NÃO conhece o campo (`prisma generate` está fora do escopo),
 * então o acesso fica isolado em duas funções com um delegate tipado à mão.
 * Depois de rodar `prisma generate` + o SQL do aplicar.sql, estas duas funções
 * podem voltar a usar `prisma.chat` diretamente.
 * ══════════════════════════════════════════════════════════════════════════ */

interface TokenChatRow {
  id: string;
  status: string;
  visitorTokenHash: string | null;
  consultantId: string;
  consultant: { id: string; name: string; avatarUrl: string | null };
}

interface TokenDelegate {
  findUnique(args: { where: { id: string }; select: unknown }): Promise<TokenChatRow | null>;
  update(args: { where: { id: string }; data: { visitorTokenHash: string | null } }): Promise<unknown>;
}

function asTokenDelegate(delegate: unknown): TokenDelegate {
  return delegate as TokenDelegate;
}

async function storeVisitorTokenHash(delegate: unknown, chatId: string, hash: string): Promise<void> {
  await asTokenDelegate(delegate).update({
    where: { id: chatId },
    data: { visitorTokenHash: hash },
  });
}

async function readVisitorChat(delegate: unknown, chatId: string): Promise<TokenChatRow | null> {
  return asTokenDelegate(delegate).findUnique({
    where: { id: chatId },
    select: {
      id: true,
      status: true,
      visitorTokenHash: true,
      consultantId: true,
      consultant: { select: { id: true, name: true, avatarUrl: true } },
    },
  });
}

/** `timingSafeEqual` sobre hex de 64 posições — sem oráculo de tempo. */
function tokenMatches(storedHash: string | null, token: string): boolean {
  if (!storedHash || !token) return false;
  const expected = Buffer.from(storedHash, 'utf8');
  const actual = Buffer.from(sha256(token), 'utf8');
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

/** Lê o chat e valida a posse pelo token. `null` = chat inexistente OU token errado. */
async function assertVisitorOwnership(
  chatId: string,
  visitorToken: string,
): Promise<TokenChatRow | null> {
  if (!chatId || !visitorToken) return null;
  const chat = await readVisitorChat(prisma.chat, chatId);
  if (!chat) return null;
  if (!tokenMatches(chat.visitorTokenHash, visitorToken)) return null;
  return chat;
}

/* ══════════════════════════════════════════════════════════════════════════
 * Autorização da equipe
 * ══════════════════════════════════════════════════════════════════════════ */

/**
 * `assertChatAccess` (src/lib/auth.ts) só conhece posse por `consultantId` /
 * `customerId` — um admin que NÃO é a atendente設計ada tomaria 403 e perderia
 * acesso à própria inbox. Aqui admin vê tudo (é o comportamento esperado do
 * painel); para qualquer outro papel vale a regra de posse do helper.
 */
async function assertStaffChatAccess(chatId: string, ctx: AuthContext): Promise<void> {
  if (isAdmin(ctx.user.role)) return;
  await assertChatAccess(chatId, ctx.user.id);
}

/** Escopo de leitura do atendente: cada consultant vê só o que é dele. */
function staffScope(ctx: AuthContext, status?: string): Record<string, unknown> {
  const where: Record<string, unknown> = {};
  if (!isAdmin(ctx.user.role)) where.consultantId = ctx.user.id;
  if (status && STATUSES.includes(status as ChatStatus)) where.status = status;
  return where;
}

/** Anexos só podem apontar para a mídia interna ou para https. */
function readAttachmentUrl(value: FormDataEntryValue | undefined): string | null | undefined {
  const url = safeUrl(str(value, 500));
  if (!url) return undefined;
  if (url.startsWith('/api/media/') || url.startsWith('https://')) return url;
  return undefined;
}

/**
 * Idempotência por `clientKey` (`@@unique([chatId, clientKey])`).
 * `clientKey` NULL nunca colide porque NULL != NULL no Postgres — por isso as
 * mensagens de sistema (clientKey ausente) podem se repetir livremente.
 */
async function findExistingMessage(chatId: string, clientKey: string): Promise<ChatMessageDto | null> {
  const row = await prisma.chatMessage.findUnique({
    where: { chatId_clientKey: { chatId, clientKey } },
    select: MESSAGE_SELECT,
  });
  return row ? toMessageDto(row) : null;
}

/* ══════════════════════════════════════════════════════════════════════════
 * 1. Catálogo público da equipe
 * ══════════════════════════════════════════════════════════════════════════ */

/**
 * PÚBLICA. Substitui o `getUsers({ role: 'consultora' })` (que expunha e-mail,
 * telefone, papel e isActive de todas as usuárias em `/contato`).
 * `select` mínimo + `isActive = true` no WHERE.
 */
export async function getPublicConsultants(): Promise<ActionResult<PublicConsultantDto[]>> {
  try {
    return ok(await listPublicConsultants());
  } catch (error) {
    console.error('[chat] getPublicConsultants:', error instanceof Error ? error.message : error);
    return failPublic('Não foi possível carregar a equipe.');
  }
}

/* ══════════════════════════════════════════════════════════════════════════
 * 2. Início do atendimento (visitante anônimo)
 * ══════════════════════════════════════════════════════════════════════════ */

/**
 * PÚBLICA. Cria (ou reaproveita) o Lead pelo e-mail, escolhe a atendente por
 * round-robin em `src/lib/chatRouting.ts`, abre o chat e grava a 1ª mensagem.
 *
 * NÃO aceita `customerId` nem `consultantId` — a atendente é sempre escolhida
 * pelo servidor e o visitante é sempre `senderId = null` / `senderType=visitor`.
 */
export async function startVisitorChat(input: ActionInput): Promise<ActionResult<StartVisitorChatDto>> {
  try {
    const f = pick(input);

    // Honeypot: campo invisível que só bots preenchem. Resposta genérica para
    // não ensinar o que filtramos.
    if (str(f.company, 120).length > 0) {
      return { success: false, error: ERR_START_FAILED };
    }

    if (!(await allowFormAction('chat:start'))) {
      return { success: false, error: RATE_LIMIT_MESSAGE };
    }

    const name = str(f.name, MAX_NAME_LENGTH);
    if (name.length < 2) return { success: false, error: ERR_NAME_REQUIRED };

    const email = normalizeEmail(str(f.email, 180));
    if (!isValidEmail(email)) return { success: false, error: ERR_EMAIL_INVALID };

    const content = str(f.message, MAX_MESSAGE_LENGTH + 1);
    if (content.length === 0) return { success: false, error: ERR_MESSAGE_REQUIRED };
    if (content.length > MAX_MESSAGE_LENGTH) return { success: false, error: ERR_MESSAGE_TOO_LONG };

    const firstClientKey = readClientKey(f.clientKey) || null;

    const consultant = await pickAvailableConsultant();
    if (!consultant) {
      console.error('[chat] startVisitorChat: nenhuma atendente ativa');
      return { success: false, error: CHAT_ROUTING_ERROR };
    }

    // Lead sem duplicar: a busca é pelo e-mail normalizado, então cada visita de
    // retorno reaproveita o mesmo registro (a versão anterior criava um Lead
    // novo por visita e o `Chat.customerId` guardava esse id de Lead).
    const existingLead = await prisma.lead.findFirst({
      where: { email },
      orderBy: { updatedAt: 'desc' },
      select: { id: true },
    });
    const leadId =
      existingLead?.id ??
      (
        await prisma.lead.create({
          data: { name, email, status: 'novo', origin: 'chat', consultantId: consultant.id },
          select: { id: true },
        })
      ).id;

    const visitorToken = randomUUID();
    const now = new Date();

    const { chat, message } = await prisma.$transaction(async (tx) => {
      const created = await tx.chat.create({
        data: {
          consultantId: consultant.id,
          leadId,
          customerId: null,
          status: 'open',
          lastMessageAt: now,
          lastMessagePreview: preview(content),
          readAt: null,
        },
        select: { id: true },
      });
      const first = await tx.chatMessage.create({
        data: {
          chatId: created.id,
          senderId: null,
          senderType: 'visitor',
          content,
          clientKey: firstClientKey,
        },
        select: MESSAGE_SELECT,
      });
      await storeVisitorTokenHash(tx.chat, created.id, sha256(visitorToken));
      return { chat: created, message: first };
    });

    await notifyUser(consultant.id, {
      title: 'Nova conversa no site',
      message: `${name} iniciou um atendimento pelo site.`,
      type: 'info',
      category: 'chat',
      linkUrl: `/admin/conversas?chat=${chat.id}`,
    });

    const meta = await getRequestMeta();
    // `AdminLog.userId` é FK de User e visitante não tem User: o ator do log é a
    // atendente que recebeu a conversa, com `details` marcando a origem.
    auditLog({
      userId: consultant.id,
      action: 'chat.start',
      entity: 'Chat',
      entityId: chat.id,
      details: `origem=site;lead=${leadId};consultant=${consultant.id}`,
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    });
    revalidateConversations();

    return ok({
      chatId: chat.id,
      visitorToken,
      consultant: { id: consultant.id, name: consultant.name, avatarUrl: consultant.avatarUrl },
      messages: [toMessageDto(message)],
    });
  } catch (error) {
    console.error('[chat] startVisitorChat:', error instanceof Error ? error.message : error);
    return failPublic(ERR_START_FAILED);
  }
}

/* ══════════════════════════════════════════════════════════════════════════
 * 3. Leitura pelo visitante (com token)
 * ══════════════════════════════════════════════════════════════════════════ */

/**
 * PÚBLICA, mas exige `visitorToken`. Sem o hash válido o retorno é SEMPRE
 * genérico (`Conversa não encontrada.`) — não dá para distinguir chat inexistente
 * de token errado.
 *
 * `since` transforma o polling em incremental (só o que chegou depois).
 */
export async function getVisitorMessages(
  chatId: string,
  input: ActionInput = null,
): Promise<ActionResult<VisitorThreadDto>> {
  try {
    const f = pick(input);
    const visitorToken = str(f.visitorToken, 64);
    const chatIdSafe = readId(f.chatId ?? chatId);
    const since = readSince(f.since);
    const take = Math.min(200, Math.max(1, Number(str(f.take, 4)) || 100));

    const chat = await assertVisitorOwnership(chatIdSafe, visitorToken);
    if (!chat) return { success: false, error: ERR_CHAT_INVALID_TOKEN };

    const where = { chatId: chat.id, ...(since ? { createdAt: { gt: since } } : {}) };
    const rows = await prisma.chatMessage.findMany({
      where,
      orderBy: since ? { createdAt: 'asc' } : [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
      select: MESSAGE_SELECT,
    });
    const ordered = since ? rows : rows.slice().reverse();

    let unreadCount = 0;
    if (!since) {
      // Não-lidas do visitante = mensagens da atendente posteriores à última
      // mensagem dele. Um único aggregate.
      const lastVisitor = await prisma.chatMessage.findFirst({
        where: { chatId: chat.id, senderType: 'visitor' },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      });
      unreadCount = await prisma.chatMessage.count({
        where: {
          chatId: chat.id,
          senderType: 'consultant',
          ...(lastVisitor ? { createdAt: { gt: lastVisitor.createdAt } } : {}),
        },
      });
    }

    return ok({
      messages: ordered.map(toMessageDto),
      unreadCount,
      status: (STATUSES as readonly string[]).includes(chat.status) ? (chat.status as ChatStatus) : 'open',
      consultant: chat.consultant,
    });
  } catch (error) {
    console.error('[chat] getVisitorMessages:', error instanceof Error ? error.message : error);
    return failPublic(GENERIC_ERROR);
  }
}

/* ══════════════════════════════════════════════════════════════════════════
 * 4. Envio pelo visitante (com token)
 * ══════════════════════════════════════════════════════════════════════════ */

/**
 * PÚBLICA com `visitorToken`. `clientKey` é obrigatório e vira chave de
 * idempotência (`@@unique([chatId, clientKey])`): apertar Enter duas vezes ou
 * reenviar uma mensagem que falhou NUNCA duplica a linha.
 *
 * Reabrir conversa finalizada é intencional — o visitante respondeu, o SLA
 * recomeça.
 */
export async function sendVisitorMessage(input: ActionInput): Promise<ActionResult<SendMessageDto>> {
  try {
    const f = pick(input);
    const chatId = readId(f.chatId);
    const visitorToken = str(f.visitorToken, 64);
    const clientKey = readClientKey(f.clientKey);
    const content = str(f.content, MAX_MESSAGE_LENGTH + 1);

    if (!clientKey) return { success: false, error: ERR_SEND_FAILED };
    if (content.length === 0) return { success: false, error: ERR_MESSAGE_REQUIRED };
    if (content.length > MAX_MESSAGE_LENGTH) return { success: false, error: ERR_MESSAGE_TOO_LONG };

    const chat = await assertVisitorOwnership(chatId, visitorToken);
    if (!chat) return { success: false, error: ERR_CHAT_NOT_FOUND };

    // Antispam: 20 mensagens por minuto por conversa (o rate limit de formulário
    // público é 5/10min e seria rápido demais para um atendimento).
    const ip = await getClientIp();
    const limit = rateLimit(`chat:msg:${chat.id}`, { limit: 20, windowMs: 60_000 });
    if (!limit.ok) {
      console.warn(`[chat] rate limit visitante ${chat.id} ip=${ip} retry=${limit.retryAfter}`);
      return { success: false, error: RATE_LIMIT_MESSAGE };
    }

    const existing = await findExistingMessage(chat.id, clientKey);
    if (existing) return ok({ message: existing, duplicate: true });

    const now = new Date();
    let created;
    try {
      created = await prisma.chatMessage.create({
        data: {
          chatId: chat.id,
          senderId: null,
          senderType: 'visitor',
          content,
          clientKey,
        },
        select: MESSAGE_SELECT,
      });
    } catch (error) {
      // P2002 = outra requisição com o mesmo clientKey venceu a corrida.
      const winner = await findExistingMessage(chat.id, clientKey);
      if (winner) return ok({ message: winner, duplicate: true });
      throw error;
    }

    await prisma.chat.update({
      where: { id: chat.id },
      data: {
        lastMessageAt: now,
        lastMessagePreview: preview(content),
        ...(chat.status === 'closed' ? { status: 'open', closedAt: null } : {}),
      },
      select: { id: true },
    });

    await notifyUser(chat.consultantId, {
      title: 'Nova mensagem',
      message: preview(content),
      type: 'info',
      category: 'chat',
      linkUrl: `/admin/conversas?chat=${chat.id}`,
    });

    const meta = await getRequestMeta();
    auditLog({
      userId: chat.consultantId,
      action: 'chat.message_visitor',
      entity: 'Chat',
      entityId: chat.id,
      details: `message=${created.id}`,
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    });

    return ok({ message: toMessageDto(created), duplicate: false });
  } catch (error) {
    console.error('[chat] sendVisitorMessage:', error instanceof Error ? error.message : error);
    return failPublic(ERR_SEND_FAILED);
  }
}

/* ══════════════════════════════════════════════════════════════════════════
 * 5. Inbox da equipe
 * ══════════════════════════════════════════════════════════════════════════ */

/**
 * `requireStaff()`. Atendente vê apenas `consultantId = ctx.user.id`; admin vê
 * tudo. `unread` = existe mensagem de visitante posterior a `Chat.readAt`.
 *
 * Joins por `Map` (2 queries em lote) em vez do antigo `leads.find()` dentro do
 * `.map()` — que era O(n·m) e rodava a cada poll.
 */
export async function staffChatList(input: ActionInput = null): Promise<ListResult<ChatRowDto>> {
  const emptyMeta = {
    items: [] as ChatRowDto[],
    data: undefined as ChatRowDto[] | undefined,
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 1,
    pages: 1,
  };
  try {
    const ctx = await requireStaff();
    const f = pick(input);
    const { page, pageSize, skip, take } = paginate(f.page, f.pageSize);
    const status = str(f.status, 20);
    const search = str(f.search, 120);

    const where = staffScope(ctx, status);
    if (search) {
      // O filtro acontece no Postgres (join real) — o Map abaixo só enriquece.
      where.OR = [
        { lead: { is: { name: { contains: search, mode: 'insensitive' } } } },
        { lead: { is: { email: { contains: search, mode: 'insensitive' } } } },
        { customer: { is: { name: { contains: search, mode: 'insensitive' } } } },
        { customer: { is: { email: { contains: search, mode: 'insensitive' } } } },
        { lastMessagePreview: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy = [{ lastMessageAt: 'desc' as const }, { id: 'desc' as const }];

    const [rows, total, unreadScan] = await Promise.all([
      prisma.chat.findMany({
        where,
        orderBy,
        take,
        skip,
        select: {
          id: true,
          status: true,
          leadId: true,
          customerId: true,
          lastMessageAt: true,
          lastMessagePreview: true,
          readAt: true,
          createdAt: true,
          closedAt: true,
          consultant: { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
      prisma.chat.count({ where }),
      // Aggregate ÚNICO de não-lidas para o escopo inteiro (o `gt` do readAt é
      // por chat, então a comparação final acontece no JS via Set).
      prisma.chat.findMany({
        where: { ...staffScope(ctx, status), messages: { some: { senderType: 'visitor' } } },
        take: UNREAD_SCAN_LIMIT,
        select: {
          id: true,
          readAt: true,
          messages: {
            where: { senderType: 'visitor' },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { createdAt: true },
          },
        },
      }),
    ]);

    const unreadIds = new Set<string>();
    for (const row of unreadScan) {
      const lastVisitor = row.messages[0]?.createdAt;
      if (!lastVisitor) continue;
      if (lastVisitor.getTime() > (row.readAt ? row.readAt.getTime() : 0)) unreadIds.add(row.id);
    }

    const leadIds = [...new Set(rows.map((r) => r.leadId).filter((id): id is string => !!id))];
    const customerIds = [...new Set(rows.map((r) => r.customerId).filter((id): id is string => !!id))];

    const [leads, customers] = await Promise.all([
      leadIds.length
        ? prisma.lead.findMany({ where: { id: { in: leadIds } }, select: { id: true, name: true, email: true } })
        : Promise.resolve([]),
      customerIds.length
        ? prisma.user.findMany({ where: { id: { in: customerIds } }, select: { id: true, name: true, email: true } })
        : Promise.resolve([]),
    ]);

    const leadById = new Map(leads.map((l) => [l.id, l]));
    const customerById = new Map(customers.map((c) => [c.id, c]));

    const items: ChatRowDto[] = rows.map((row) => {
      const lead = row.leadId ? leadById.get(row.leadId) : undefined;
      const customer = row.customerId ? customerById.get(row.customerId) : undefined;
      return {
        id: row.id,
        status: (STATUSES as readonly string[]).includes(row.status) ? (row.status as ChatStatus) : 'open',
        visitorName: lead?.name ?? customer?.name ?? '—',
        visitorEmail: lead?.email ?? customer?.email ?? null,
        visitorKind: lead ? 'lead' : customer ? 'customer' : 'unknown',
        preview: row.lastMessagePreview,
        lastMessageAt: row.lastMessageAt.toISOString(),
        createdAt: row.createdAt.toISOString(),
        closedAt: row.closedAt ? row.closedAt.toISOString() : null,
        unread: unreadIds.has(row.id),
        consultant: row.consultant,
      };
    });

    const meta = pageMeta(total, page, pageSize);
    return { ...ok(items), items, ...meta, pages: meta.totalPages };
  } catch (error) {
    return { ...fail<ChatRowDto[]>(error, 'Erro ao buscar conversas.'), ...emptyMeta };
  }
}

/**
 * `requireStaff()` + posse da conversa. Marca `Chat.readAt` e carimba
 * `ChatMessage.readAt` das mensagens de visitante — antes esse campo era
 * declarado no schema e nunca lido nem escrito.
 */
export async function staffMessages(
  chatId: string,
  input: ActionInput = null,
): Promise<ActionResult<{ messages: ChatMessageDto[]; status: ChatStatus }>> {
  try {
    const ctx = await requireStaff();
    const f = pick(input);
    const id = readId(f.chatId ?? chatId);
    if (!id) return { success: false, error: ERR_CHAT_NOT_FOUND };

    await assertStaffChatAccess(id, ctx);

    const since = readSince(f.since);
    const take = Math.min(200, Math.max(1, Number(str(f.take, 4)) || 100));

    const rows = await prisma.chatMessage.findMany({
      where: { chatId: id, ...(since ? { createdAt: { gt: since } } : {}) },
      orderBy: since ? { createdAt: 'asc' } : [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
      select: MESSAGE_SELECT,
    });

    const now = new Date();
    await Promise.all([
      prisma.chat.update({ where: { id }, data: { readAt: now }, select: { id: true } }),
      prisma.chatMessage.updateMany({
        where: { chatId: id, senderType: 'visitor', readAt: null },
        data: { readAt: now },
      }),
    ]);

    const chat = await prisma.chat.findUnique({
      where: { id },
      select: { status: true },
    });

    const ordered = since ? rows : rows.slice().reverse();
    return ok({
      messages: ordered.map(toMessageDto),
      status:
        chat && (STATUSES as readonly string[]).includes(chat.status) ? (chat.status as ChatStatus) : 'open',
    });
  } catch (error) {
    return fail(error, 'Erro ao buscar mensagens.');
  }
}

/**
 * `requireStaff()` + posse da conversa. O autor é SEMPRE `ctx.user.id`
 * (`senderType = 'consultant'`) — o `senderId: 'admin_id'` que existia no
 * componente permitia, no melhor caso, mensagem com autor órfão.
 */
export async function staffSendMessage(input: ActionInput): Promise<ActionResult<SendMessageDto>> {
  try {
    const ctx = await requireStaff();
    const f = pick(input);
    const chatId = readId(f.chatId);
    const clientKey = readClientKey(f.clientKey);
    const content = str(f.content, MAX_MESSAGE_LENGTH + 1);
    const attachmentUrl = readAttachmentUrl(f.attachmentUrl);
    const attachmentName = str(f.attachmentName, 160) || null;
    const attachmentType = str(f.attachmentType, 120) || null;

    if (!clientKey) return { success: false, error: ERR_SEND_FAILED };
    if (content.length === 0 && !attachmentUrl) return { success: false, error: ERR_NO_CONTENT };
    if (content.length > MAX_MESSAGE_LENGTH) return { success: false, error: ERR_MESSAGE_TOO_LONG };
    if (attachmentUrl === undefined) return { success: false, error: ERR_ATTACHMENT_INVALID };

    await assertStaffChatAccess(chatId, ctx);

    const existing = await findExistingMessage(chatId, clientKey);
    if (existing) return ok({ message: existing, duplicate: true });

    const now = new Date();
    let created;
    try {
      created = await prisma.chatMessage.create({
        data: {
          chatId,
          senderId: ctx.user.id,
          senderType: 'consultant',
          content: content || (attachmentName ?? ''),
          clientKey,
          attachmentUrl,
          attachmentName,
          attachmentType,
          readAt: now,
        },
        select: MESSAGE_SELECT,
      });
    } catch (error) {
      const winner = await findExistingMessage(chatId, clientKey);
      if (winner) return ok({ message: winner, duplicate: true });
      throw error;
    }

    const chat = await prisma.chat.update({
      where: { id: chatId },
      data: {
        lastMessageAt: now,
        lastMessagePreview: preview(content || (attachmentName ?? '')),
        status: 'open',
        closedAt: null,
      },
      select: { id: true, customerId: true },
    });

    // O cliente do portal é um User: aí sim há notificação de verdade.
    await notifyUser(chat.customerId, {
      title: 'Nova mensagem da sua consultora',
      message: preview(content || (attachmentName ?? '')),
      type: 'info',
      category: 'chat',
      linkUrl: '/dashboard/cliente',
    });

    auditLog({
      userId: ctx.user.id,
      action: 'chat.message_staff',
      entity: 'Chat',
      entityId: chatId,
      details: `message=${created.id}${attachmentUrl ? ';anexo=1' : ''}`,
    });
    revalidateConversations();

    return ok({ message: toMessageDto(created), duplicate: false });
  } catch (error) {
    return fail(error, 'Erro ao enviar mensagem.');
  }
}

/* ══════════════════════════════════════════════════════════════════════════
 * 6. Status, atribuição e leitura
 * ══════════════════════════════════════════════════════════════════════════ */

export async function setChatStatus(
  chatId: string,
  status: string,
): Promise<ActionResult<{ id: string; status: ChatStatus; closedAt: string | null }>> {
  try {
    const ctx = await requireStaff();
    const id = readId(chatId);
    if (!id || !(STATUSES as readonly string[]).includes(status)) {
      return { success: false, error: ERR_STATUS_INVALID };
    }

    await assertStaffChatAccess(id, ctx);

    const now = new Date();
    const chat = await prisma.chat.update({
      where: { id },
      data:
        status === 'closed'
          ? { status: 'closed', closedAt: now }
          : { status, closedAt: null },
      select: { id: true, status: true, closedAt: true },
    });

    auditLog({
      userId: ctx.user.id,
      action: 'chat.status_change',
      entity: 'Chat',
      entityId: id,
      details: `status=${status}`,
    });
    revalidateConversations();

    return ok({
      id: chat.id,
      status: chat.status as ChatStatus,
      closedAt: chat.closedAt ? chat.closedAt.toISOString() : null,
    });
  } catch (error) {
    return fail(error, 'Erro ao atualizar a conversa.');
  }
}

/** Transferência de conversa: `requireAdmin()` (atendente não reatribui a si). */
export async function assignChat(chatId: string, consultantId: string): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireAdmin();
    const id = readId(chatId);
    const target = readId(consultantId);
    if (!id || !target) return { success: false, error: 'Conversa ou atendente inválida.' };

    const consultant = await prisma.user.findUnique({
      where: { id: target },
      select: { id: true, role: true, isActive: true },
    });
    if (!consultant || !consultant.isActive || !['consultora', 'admin', 'super_admin'].includes(consultant.role)) {
      return { success: false, error: 'Atendente inválida ou inativa.' };
    }

    const chat = await prisma.chat.update({
      where: { id },
      data: { consultantId: target },
      select: { id: true },
    });

    await notifyUser(target, {
      title: 'Conversa atribuída a você',
      message: 'Uma conversa foi transferida para o seu atendimento.',
      type: 'info',
      category: 'chat',
      linkUrl: `/admin/conversas?chat=${id}`,
    });

    auditLog({
      userId: ctx.user.id,
      action: 'chat.assign',
      entity: 'Chat',
      entityId: id,
      details: `consultantId=${target}`,
    });
    revalidateConversations();

    return ok(chat);
  } catch (error) {
    return fail(error, 'Erro ao atribuir a conversa.');
  }
}

export async function markAllChatsRead(): Promise<ActionResult<{ updated: number }>> {
  try {
    const ctx = await requireStaff();
    const now = new Date();
    const result = await prisma.chat.updateMany({
      where: { consultantId: ctx.user.id, readAt: { lt: now } },
      data: { readAt: now },
    });
    await prisma.chatMessage.updateMany({
      where: { readAt: null, chat: { consultantId: ctx.user.id } },
      data: { readAt: now },
    });
    return ok({ updated: result.count });
  } catch (error) {
    return fail(error, 'Erro ao marcar as conversas como lidas.');
  }
}

/** Badge do cabeçalho do painel (substitui o "!" literal do layout). */
export async function getUnreadChatCount(): Promise<ActionResult<{ count: number }>> {
  try {
    const ctx = await requireStaff();
    const scope = staffScope(ctx);
    const rows = await prisma.chat.findMany({
      where: { ...scope, messages: { some: { senderType: 'visitor' } } },
      take: UNREAD_SCAN_LIMIT,
      select: {
        id: true,
        readAt: true,
        messages: {
          where: { senderType: 'visitor' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
      },
    });

    let count = 0;
    for (const row of rows) {
      const lastVisitor = row.messages[0]?.createdAt;
      if (lastVisitor && lastVisitor.getTime() > (row.readAt ? row.readAt.getTime() : 0)) count += 1;
    }
    return ok({ count });
  } catch (error) {
    return fail(error, 'Erro ao contar as conversas não lidas.');
  }
}
