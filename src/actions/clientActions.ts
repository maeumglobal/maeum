'use server';

/**
 * Portal do cliente (`/dashboard/cliente`).
 *
 * TODO aqui é derivado da SESSÃO, nunca de um id enviado pelo navegador.
 * Correções aplicadas:
 *  - `getClientData(userId)` e `approveClientProposal(proposalId, userId)` eram
 *    IDOR: o `userId` vinha do cliente e, na segunda, nem era usado — qualquer
 *    pessoa logada aprovava a proposta de qualquer outra. Os parâmetros foram
 *    REMOVIDOS das assinaturas e o filtro passou para o WHERE do Prisma.
 */
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { auditLog } from '@/lib/audit';
import { notifyUser } from '@/lib/notify';
import { str, safeUrl } from '@/lib/validate';
import { pick, paginate, pageMeta, fail, ok, type ActionInput, type ActionResult, type ListResult } from '@/lib/actionKit';

export interface ClientChatMessage {
  id: string;
  chatId: string;
  senderId: string | null;
  senderType: string;
  content: string;
  createdAt: Date;
}

export interface ClientProposal {
  id: string;
  title: string;
  status: string;
  totalValue: number;
  version: number;
  notes: string | null;
  uniqueLink: string | null;
  validUntil: Date | null;
  updatedAt: Date;
  items: Array<{
    id: string;
    name: string;
    type: string;
    quantity: number;
    price: number;
    details: string | null;
  }>;
  consultant: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
  };
}

export interface ClientBooking {
  id: string;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  totalPrice: number | null;
  notes: string | null;
  package: { id: string; title: string; destination: string | null } | null;
  payments: Array<{
    id: string;
    amount: number;
    status: string;
    dueDate: Date | null;
    paidAt: Date | null;
    paymentUrl: string | null;
  }>;
  timeline: Array<{
    id: string;
    eventDate: Date;
    eventTime: string | null;
    title: string;
    description: string | null;
  }>;
}

export interface ClientChatSummary {
  id: string;
  status: string;
  subject: string | null;
  lastMessageAt: Date;
  consultant: { id: string; name: string; avatarUrl: string | null };
}

export interface ClientDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  category: string;
  createdAt: Date;
}

export interface ClientData {
  booking: ClientBooking | null;
  proposal: ClientProposal | null;
  chat: ClientChatSummary | null;
  messages: ClientChatMessage[];
  documents: ClientDocument[];
  notifications: Array<Record<string, unknown>>;
}

const CLIENT_BOOKING_SELECT = {
  id: true,
  status: true,
  startDate: true,
  endDate: true,
  totalPrice: true,
  notes: true,
  package: { select: { id: true, title: true, destination: true } },
  payments: {
    orderBy: { dueDate: 'asc' },
    take: 50,
    select: { id: true, amount: true, status: true, dueDate: true, paidAt: true, paymentUrl: true },
  },
  timeline: {
    orderBy: { eventDate: 'asc' },
    take: 80,
    select: { id: true, eventDate: true, eventTime: true, title: true, description: true },
  },
} as const;

const CLIENT_PROPOSAL_SELECT = {
  id: true,
  title: true,
  status: true,
  totalValue: true,
  version: true,
  notes: true,
  uniqueLink: true,
  validUntil: true,
  updatedAt: true,
  items: {
    take: 50,
    select: { id: true, name: true, type: true, quantity: true, price: true, details: true },
  },
  consultant: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
} as const;

const CLIENT_CHAT_SELECT = {
  id: true,
  status: true,
  subject: true,
  lastMessageAt: true,
  consultant: { select: { id: true, name: true, avatarUrl: true } },
} as const;

const MESSAGE_SELECT = {
  id: true,
  chatId: true,
  senderId: true,
  senderType: true,
  content: true,
  createdAt: true,
} as const;

function revalidateClient() {
  revalidatePath('/dashboard/cliente');
}

// ─── DADOS DO CLIENTE ────────────────────────────────────────

export async function getClientData(): Promise<ActionResult<ClientData>> {
  try {
    const ctx = await requireUser();
    const me = ctx.user.id;

    const [booking, proposal, chat, documents, notifications] = await Promise.all([
      prisma.booking.findFirst({
        where: { clientId: me },
        orderBy: { createdAt: 'desc' },
        select: CLIENT_BOOKING_SELECT,
      }),
      prisma.proposal.findFirst({
        where: { customerId: me },
        orderBy: { createdAt: 'desc' },
        select: CLIENT_PROPOSAL_SELECT,
      }),
      prisma.chat.findFirst({
        where: { customerId: me },
        orderBy: { lastMessageAt: 'desc' },
        select: CLIENT_CHAT_SELECT,
      }),
      prisma.document.findMany({
        where: { clientId: me },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          fileName: true,
          fileUrl: true,
          fileSize: true,
          mimeType: true,
          category: true,
          createdAt: true,
        },
      }),
      prisma.notification.findMany({
        where: { userId: me, isRead: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, title: true, message: true, type: true, category: true, linkUrl: true, createdAt: true },
      }),
    ]);

    let messages: ClientChatMessage[] = [];
    if (chat) {
      messages = await prisma.chatMessage.findMany({
        where: { chatId: chat.id },
        orderBy: { createdAt: 'asc' },
        take: 100,
        select: MESSAGE_SELECT,
      });
    }

    return ok({
      booking,
      proposal,
      chat,
      messages,
      documents,
      notifications,
    });
  } catch (error) {
    return fail(error, 'Erro ao carregar dados do cliente.');
  }
}

export async function getClientMessages(): Promise<ActionResult<ClientChatMessage[]> & { chatId: string | null }> {
  try {
    const ctx = await requireUser();
    const chat = await prisma.chat.findFirst({
      where: { customerId: ctx.user.id },
      orderBy: { lastMessageAt: 'desc' },
      select: { id: true },
    });
    if (!chat) return { success: true, data: [], chatId: null };

    const messages = await prisma.chatMessage.findMany({
      where: { chatId: chat.id },
      orderBy: { createdAt: 'asc' },
      take: 200,
      select: MESSAGE_SELECT,
    });
    return { success: true, data: messages, chatId: chat.id };
  } catch (error) {
    return { ...fail<ClientChatMessage[]>(error, 'Erro ao buscar mensagens.'), chatId: null };
  }
}

export async function sendClientMessage(input: ActionInput): Promise<ActionResult<ClientChatMessage>> {
  try {
    const ctx = await requireUser();
    const f = pick(input);

    const content = str(f.content, 4000);
    if (content.length === 0) return { success: false, error: 'Digite uma mensagem.' };

    const chat = await prisma.chat.findFirst({
      where: { customerId: ctx.user.id, status: { not: 'closed' } },
      orderBy: { lastMessageAt: 'desc' },
      select: { id: true, consultantId: true },
    });
    if (!chat) return { success: false, error: 'Nenhuma conversa encontrada.' };

    const message = await prisma.chatMessage.create({
      data: { chatId: chat.id, senderId: ctx.user.id, senderType: 'customer', content },
      select: MESSAGE_SELECT,
    });

    await prisma.chat.update({
      where: { id: chat.id },
      data: { lastMessageAt: new Date(), lastMessagePreview: content.slice(0, 160), readAt: null },
    });

    await notifyUser(chat.consultantId, {
      title: 'Nova mensagem do cliente',
      message: content.slice(0, 160),
      type: 'info',
      category: 'chat',
      linkUrl: `/admin/conversas?chat=${chat.id}`,
    });

    revalidateClient();
    return ok(message);
  } catch (error) {
    return fail(error, 'Erro ao enviar mensagem.');
  }
}

// ─── PROPOSTA ───────────────────────────────────────────────

export async function approveClientProposal(proposalId: string): Promise<ActionResult<Record<string, unknown>>> {
  try {
    const ctx = await requireUser();

    // Posse validada no WHERE: o cliente só aprova proposta em que é o customer.
    const proposal = await prisma.proposal
      .update({
        where: { id: proposalId, customerId: ctx.user.id },
        data: { status: 'approved', viewedAt: new Date() },
        select: { id: true, title: true, status: true, leadId: true, consultantId: true, customerId: true },
      })
      .catch((error: unknown) => {
        if (error && typeof error === 'object' && (error as { code?: string }).code === 'P2025') return null;
        throw error;
      });

    if (!proposal) return { success: false, error: 'Proposta não encontrada.' };

    if (proposal.leadId) {
      await prisma.lead
        .update({ where: { id: proposal.leadId }, data: { status: 'fechado' } })
        .catch(() => undefined);
    }

    await notifyUser(proposal.consultantId, {
      title: 'Proposta aprovada!',
      message: `O cliente aprovou a proposta: ${proposal.title}`,
      type: 'success',
      priority: 'high',
      category: 'proposal',
      linkUrl: '/dashboard/admin',
    });

    auditLog({
      userId: ctx.user.id,
      action: 'proposal.client_approved',
      entity: 'Proposal',
      entityId: proposal.id,
    });
    revalidateClient();
    revalidatePath('/proposta/[unique_link]', 'page');
    return ok(proposal);
  } catch (error) {
    return fail(error, 'Erro ao aprovar proposta.');
  }
}

export async function requestProposalChanges(
  proposalId: string,
  notes: string,
): Promise<ActionResult<Record<string, unknown>>> {
  try {
    const ctx = await requireUser();
    const message = str(notes, 1000);
    if (message.length < 3) return { success: false, error: 'Descreva o ajuste solicitado.' };

    const proposal = await prisma.proposal
      .update({
        where: { id: proposalId, customerId: ctx.user.id },
        data: { status: 'draft', notes: message },
        select: { id: true, title: true, status: true, consultantId: true },
      })
      .catch((error: unknown) => {
        if (error && typeof error === 'object' && (error as { code?: string }).code === 'P2025') return null;
        throw error;
      });

    if (!proposal) return { success: false, error: 'Proposta não encontrada.' };

    await notifyUser(proposal.consultantId, {
      title: 'Revisão solicitada na proposta',
      message: `Cliente solicitou alterações: ${message.slice(0, 100)}`,
      type: 'warning',
      priority: 'high',
      category: 'proposal',
      linkUrl: '/dashboard/admin',
    });

    auditLog({
      userId: ctx.user.id,
      action: 'proposal.client_request_changes',
      entity: 'Proposal',
      entityId: proposal.id,
    });
    revalidateClient();
    return ok(proposal);
  } catch (error) {
    return fail(error, 'Erro ao solicitar alterações.');
  }
}

// ─── DOCUMENTOS ─────────────────────────────────────────────

export async function uploadClientDocument(input: ActionInput): Promise<ActionResult<Record<string, unknown>>> {
  try {
    const ctx = await requireUser();
    const f = pick(input);

    const fileName = str(f.fileName, 200);
    const fileUrl = safeUrl(str(f.fileUrl, 500));
    if (fileName.length < 2) return { success: false, error: 'Informe o nome do arquivo.' };
    if (!fileUrl) return { success: false, error: 'Arquivo inválido.' };

    const fileSizeRaw = Number(str(f.fileSize, 20));
    const fileSize = Number.isFinite(fileSizeRaw) && fileSizeRaw > 0 ? Math.round(fileSizeRaw) : null;

    const doc = await prisma.document.create({
      data: {
        // clientId e uploadedById vêm da sessão — nunca do formulário.
        clientId: ctx.user.id,
        uploadedById: ctx.user.id,
        fileName,
        fileUrl,
        fileSize,
        mimeType: normalizeMime(f.mimeType),
        category: str(f.category, 40) || 'general',
        notes: str(f.notes, 500) || null,
      },
      select: {
        id: true,
        fileName: true,
        fileUrl: true,
        fileSize: true,
        category: true,
        createdAt: true,
      },
    });

    auditLog({
      userId: ctx.user.id,
      action: 'document.upload',
      entity: 'Document',
      entityId: doc.id,
      details: fileName,
    });
    revalidateClient();
    return ok(doc);
  } catch (error) {
    return fail(error, 'Erro ao salvar documento.');
  }
}

export async function getClientNotifications(): Promise<ActionResult<Array<Record<string, unknown>>>> {
  try {
    const ctx = await requireUser();
    const notifications = await prisma.notification.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        category: true,
        isRead: true,
        linkUrl: true,
        createdAt: true,
      },
    });
    return ok(notifications);
  } catch (error) {
    return fail(error, 'Erro ao buscar notificações.');
  }
}

// ─── PERFIL ─────────────────────────────────────────────────

export interface ClientProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  locale: string;
  avatarUrl: string | null;
}

const PROFILE_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  locale: true,
  avatarUrl: true,
} as const;

const LOCALES = ['pt', 'en', 'es'] as const;

/**
 * Atualiza o perfil do próprio cliente.
 *
 * O que mudou: o formulário "Meu Perfil" do portal fazia
 * `setProfileSaved(true)` + `setTimeout` e NÃO gravava nada — mostrava
 * "✓ Dados atualizados com sucesso!" sem nenhuma escrita no banco.
 *
 * Contrato:
 *  - identidade (id) vem SEMPRE da sessão; o e-mail NÃO é editável aqui
 *    (mudá-lo exigiria refazer o login e invalidar `sessionVersion`);
 *  - `avatarUrl` precisa passar por `safeUrl` (caminho interno ou https) —
 *    o que o `<img>` renderiza precisa ser um valor controlado, não
 *    `javascript:`/`data:` vindo do formulário.
 */
export async function updateMyProfile(input: ActionInput): Promise<ActionResult<ClientProfile>> {
  try {
    const ctx = await requireUser();
    const f = pick(input);

    const name = str(f.name, 120);
    if (name.length < 2) return { success: false, error: 'Informe seu nome completo.' };

    const phoneRaw = str(f.phone, 40);
    const localeRaw = str(f.locale, 5).toLowerCase();
    const locale = (LOCALES as readonly string[]).includes(localeRaw) ? localeRaw : ctx.user.locale;
    const avatarUrl = f.avatarUrl === undefined ? undefined : safeUrl(str(f.avatarUrl, 500));

    if (f.avatarUrl !== undefined && str(f.avatarUrl, 500).length > 0 && !avatarUrl) {
      return { success: false, error: 'Foto de perfil inválida.' };
    }

    const profile = await prisma.user.update({
      where: { id: ctx.user.id },
      data: {
        name,
        phone: phoneRaw.length ? phoneRaw : null,
        locale,
        ...(avatarUrl === undefined ? {} : { avatarUrl }),
      },
      select: PROFILE_SELECT,
    });

    auditLog({
      userId: ctx.user.id,
      action: 'profile.update',
      entity: 'User',
      entityId: ctx.user.id,
      details: `locale=${locale};avatar=${avatarUrl ? '1' : '0'}`,
    });

    revalidateClient();
    return ok(profile);
  } catch (error) {
    return fail(error, 'Erro ao salvar o perfil.');
  }
}

// ─── PROPOSTAS DO CLIENTE ────────────────────────────────────

export interface ClientProposalRow {
  id: string;
  title: string;
  status: string;
  totalValue: number;
  version: number;
  validUntil: Date | null;
  updatedAt: Date;
  createdAt: Date;
  /** Token do link privado — o portal monta `/proposta/<uniqueLink>`. */
  uniqueLink: string | null;
  itemCount: number;
}

/**
 * Lista paginada das propostas do cliente.
 *
 * `getClientData()` devolve só a MAIS RECENTE (findFirst) — suficiente para o
 * card principal, mas insuficiente para o portal listar o histórico. Aqui a
 * posse está no WHERE (`customerId = sessão`), nunca em um id enviado pelo
 * navegador.
 */
export async function getClientProposals(
  input: { page?: number; pageSize?: number; status?: string } = {},
): Promise<ListResult<ClientProposalRow>> {
  try {
    const ctx = await requireUser();
    const { page, pageSize, skip, take } = paginate(input.page, input.pageSize);
    const status = str(input.status, 30);

    const where: Record<string, unknown> = { customerId: ctx.user.id };
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.proposal.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take,
        skip,
        select: {
          id: true,
          title: true,
          status: true,
          totalValue: true,
          version: true,
          validUntil: true,
          updatedAt: true,
          createdAt: true,
          uniqueLink: true,
          _count: { select: { items: true } },
        },
      }),
      prisma.proposal.count({ where }),
    ]);

    const rows: ClientProposalRow[] = items.map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      totalValue: row.totalValue,
      version: row.version,
      validUntil: row.validUntil,
      updatedAt: row.updatedAt,
      createdAt: row.createdAt,
      uniqueLink: row.uniqueLink,
      itemCount: row._count.items,
    }));

    const meta = pageMeta(total, page, pageSize);
    return { success: true, data: rows, items: rows, ...meta, pages: meta.totalPages };
  } catch (error) {
    return {
      ...fail<ClientProposalRow[]>(error, 'Erro ao buscar as propostas.'),
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 1,
      pages: 1,
    };
  }
}

/** Remove um documento do próprio cliente. Posse no `updateMany`. */
export async function deleteClientDocument(documentId: string): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requireUser();
    const id = str(documentId, 64);
    if (id.length < 8) return { success: false, error: 'Documento inválido.' };

    const result = await prisma.document.deleteMany({
      where: { id, clientId: ctx.user.id },
    });
    if (result.count === 0) return { success: false, error: 'Documento não encontrado.' };

    auditLog({
      userId: ctx.user.id,
      action: 'document.delete',
      entity: 'Document',
      entityId: id,
    });
    revalidateClient();
    return { success: true };
  } catch (error) {
    return fail(error, 'Erro ao excluir o documento.');
  }
}

// ─── INTERNOS ──────────────────────────────────────────────

function normalizeMime(value: FormDataEntryValue | undefined): string | null {
  const mime = str(value, 120);
  return /^[a-z0-9.+-]+\/[a-z0-9.+-]+$/i.test(mime) ? mime.toLowerCase() : null;
}