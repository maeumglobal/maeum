'use server';

/**
 * Parceria, intercâmbio, reservas, pagamentos e propostas.
 *
 * Autorização por recurso:
 *  - `requireStaff()` para leituras operacionais;
 *  - `requireAdmin()` para criar/editar parceiros, campi e qualquer coisa
 *    financeira (pagamentos);
 *  - RESERVAS e PROPOSTAS: o WHERE filtra por `consultantId === ctx.user.id`
 *    para atendentes — a checagem acontece no banco, não depois do fetch.
 */
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireStaff } from '@/lib/auth';
import { isAdmin } from '@/lib/session';
import { auditLog } from '@/lib/audit';
import { notifyUser } from '@/lib/notify';
import {
  str,
  strOrNull,
  toInt,
  toNumber,
  isValidEmail,
  normalizeEmail,
  safeUrl,
  parseStringArray,
} from '@/lib/validate';
import {
  pick,
  paginate,
  pageMeta,
  fail,
  ok,
  type ActionInput,
  type ActionResult,
  type ListResult,
} from '@/lib/actionKit';

const PARTNER_SELECT = {
  id: true,
  name: true,
  category: true,
  contactEmail: true,
  phone: true,
  website: true,
  logoUrl: true,
  description: true,
  status: true,
  sortOrder: true,
} as const;

const BOOKING_SELECT = {
  id: true,
  status: true,
  startDate: true,
  endDate: true,
  totalPrice: true,
  notes: true,
  createdAt: true,
  clientId: true,
  packageId: true,
  proposalId: true,
  client: { select: { id: true, name: true, email: true, phone: true } },
  package: { select: { id: true, title: true, destination: true } },
  proposal: { select: { id: true, title: true, totalValue: true } },
  payments: {
    orderBy: { dueDate: 'asc' },
    take: 30,
    select: { id: true, amount: true, status: true, dueDate: true, paidAt: true, paymentUrl: true },
  },
  timeline: {
    orderBy: { eventDate: 'asc' },
    take: 60,
    select: { id: true, eventDate: true, eventTime: true, title: true, description: true },
  },
} as const;

const PROPOSAL_SELECT = {
  id: true,
  title: true,
  status: true,
  totalValue: true,
  uniqueLink: true,
  consultantId: true,
  customerId: true,
  leadId: true,
  version: true,
  notes: true,
  validUntil: true,
  viewedAt: true,
  createdAt: true,
  updatedAt: true,
  consultant: { select: { id: true, name: true, email: true } },
  customer: { select: { id: true, name: true, email: true } },
  // Propostas de lead não têm `customer`: sem esta relação o painel só conseguia
  // exibir o UUID e o administrador não sabia para quem a proposta foi escrita.
  lead: { select: { id: true, name: true, email: true } },
  items: {
    take: 50,
    select: { id: true, name: true, type: true, refId: true, quantity: true, price: true, details: true },
  },
} as const;

const BOOKING_STATUS = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'] as const;
const PAYMENT_STATUS = ['pending', 'paid', 'failed', 'refunded', 'cancelled'] as const;

export interface ExchangeProgramView {
  id: string;
  name: string;
  slug: string;
  durationWeeksMin: number;
  durationWeeksMax: number;
  levelRequired: string;
  enrollmentFee: number;
}

export interface ExchangeCampusView {
  id: string;
  name: string;
  city: string;
  location: string | null;
  description: string | null;
  mainImage: string | null;
  programs: ExchangeProgramView[];
}

export interface ExchangeInstitutionView {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  country: string;
  website: string | null;
  logoUrl: string | null;
  campuses: ExchangeCampusView[];
}

function revalidateSales() {
  revalidatePath('/dashboard/admin');
  revalidatePath('/dashboard/consultora');
  revalidatePath('/dashboard/cliente');
}

// ─── PARCEIROS ──────────────────────────────────────────────

export async function getPartners(input: {
  page?: number;
  pageSize?: number;
  category?: string;
  status?: string;
  search?: string;
} = {}): Promise<ListResult<unknown>> {
  try {
    await requireStaff();
    const { page, pageSize, skip, take } = paginate(input.page, input.pageSize);

    const where: Record<string, unknown> = {};
    if (input.category) where.category = String(input.category).slice(0, 80);
    if (input.status) where.status = String(input.status).slice(0, 30);

    const search = str(input.search, 120);
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.partner.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        take,
        skip,
        select: PARTNER_SELECT,
      }),
      prisma.partner.count({ where }),
    ]);

    const meta = pageMeta(total, page, pageSize);
    return { success: true, data, items: data, ...meta, pages: meta.totalPages };
  } catch (error) {
    return {
      ...fail(error, 'Erro ao buscar parceiros.'),
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 1,
      pages: 1,
    };
  }
}

export async function createPartner(input: ActionInput): Promise<ActionResult<unknown>> {
  try {
    const ctx = await requireAdmin();
    const f = pick(input);

    const name = str(f.name, 140);
    if (name.length < 2) return { success: false, error: 'Informe o nome do parceiro.' };

    const contactEmailRaw = normalizeEmail(str(f.contactEmail, 180));
    if (contactEmailRaw && !isValidEmail(contactEmailRaw)) {
      return { success: false, error: 'E-mail de contato inválido.' };
    }

    const partner = await prisma.partner.create({
      data: {
        name,
        category: strOrNull(f.category, 80),
        contactEmail: contactEmailRaw || null,
        phone: strOrNull(f.phone, 40),
        website: safeUrl(strOrNull(f.website, 300)),
        logoUrl: safeUrl(strOrNull(f.logoUrl, 500)),
        description: strOrNull(f.description, 2000),
        status: 'active',
      },
      select: PARTNER_SELECT,
    });

    auditLog({ userId: ctx.user.id, action: 'partner.create', entity: 'Partner', entityId: partner.id });
    revalidatePath('/dashboard/admin');
    return ok(partner);
  } catch (error) {
    return fail(error, 'Erro ao criar parceiro.');
  }
}

export async function updatePartner(id: string, input: ActionInput): Promise<ActionResult<unknown>> {
  try {
    const ctx = await requireAdmin();
    const f = pick(input);

    const data: Record<string, unknown> = {};
    const name = str(f.name, 140);
    if (name.length >= 2) data.name = name;
    if (f.category !== undefined) data.category = strOrNull(f.category, 80);
    if (f.contactEmail !== undefined) data.contactEmail = normalizeEmail(str(f.contactEmail, 180)) || null;
    if (f.phone !== undefined) data.phone = strOrNull(f.phone, 40);
    if (f.website !== undefined) data.website = safeUrl(strOrNull(f.website, 300));
    if (f.logoUrl !== undefined) data.logoUrl = safeUrl(strOrNull(f.logoUrl, 500));
    if (f.description !== undefined) data.description = strOrNull(f.description, 2000);
    if (f.sortOrder !== undefined) data.sortOrder = toInt(f.sortOrder, { min: 0, max: 9999, fallback: 0 });
    if (f.status !== undefined) {
      const status = str(f.status, 20);
      if (status !== 'active' && status !== 'inactive') return { success: false, error: 'Status inválido.' };
      data.status = status;
    }

    if (Object.keys(data).length === 0) return { success: false, error: 'Nada para atualizar.' };

    const partner = await prisma.partner.update({ where: { id }, data, select: PARTNER_SELECT });
    auditLog({ userId: ctx.user.id, action: 'partner.update', entity: 'Partner', entityId: id });
    revalidatePath('/dashboard/admin');
    return ok(partner);
  } catch (error) {
    return fail(error, 'Erro ao atualizar parceiro.');
  }
}

export async function deletePartner(id: string): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requireAdmin();
    await prisma.partner.delete({ where: { id } });
    auditLog({ userId: ctx.user.id, action: 'partner.delete', entity: 'Partner', entityId: id });
    revalidatePath('/dashboard/admin');
    return { success: true };
  } catch (error) {
    return fail(error, 'Erro ao excluir parceiro.');
  }
}

// ─── INTERCÂMBIO ────────────────────────────────────────────

/**
 * Leitura PÚBLICA: a página /coreia-do-sul/intercambio monta os cards do
 * intercâmbio direto deste retorno. Por isso: só instituição/campus ativos,
 * `select` explícito e limites.
 */
export async function getExchangeInstitutions(): Promise<ActionResult<ExchangeInstitutionView[]>> {
  try {
    const data = await prisma.exchangeInstitution.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      take: 20,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        country: true,
        website: true,
        logoUrl: true,
        campuses: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          take: 12,
          select: {
            id: true,
            name: true,
            city: true,
            location: true,
            description: true,
            mainImage: true,
            programs: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
              take: 8,
              select: {
                id: true,
                name: true,
                slug: true,
                durationWeeksMin: true,
                durationWeeksMax: true,
                levelRequired: true,
                enrollmentFee: true,
              },
            },
          },
        },
      },
    });
    return ok(data);
  } catch (error) {
    return fail(error, 'Erro ao buscar instituições.');
  }
}

export async function createExchangeCampus(input: ActionInput): Promise<ActionResult<unknown>> {
  try {
    const ctx = await requireAdmin();
    const f = pick(input);

    const institutionId = str(f.institutionId, 64);
    const name = str(f.name, 140);
    const city = str(f.city, 100);
    if (!institutionId) return { success: false, error: 'Selecione a instituição.' };
    if (name.length < 2) return { success: false, error: 'Informe o nome do campus.' };
    if (city.length < 2) return { success: false, error: 'Informe a cidade.' };

    const campus = await prisma.exchangeCampus.create({
      data: {
        institutionId,
        name,
        city,
        location: strOrNull(f.location, 140),
        description: strOrNull(f.description, 2000),
        mainImage: safeUrl(strOrNull(f.mainImage, 500)),
      },
      select: {
        id: true,
        institutionId: true,
        name: true,
        city: true,
        location: true,
        description: true,
        mainImage: true,
      },
    });

    auditLog({
      userId: ctx.user.id,
      action: 'exchange.campus_create',
      entity: 'ExchangeCampus',
      entityId: campus.id,
    });
    revalidatePath('/coreia-do-sul/intercambio');
    revalidatePath('/intercambios');
    return ok(campus);
  } catch (error) {
    return fail(error, 'Erro ao criar campus.');
  }
}

// ─── RESERVAS ───────────────────────────────────────────────

export async function getBookings(input: {
  page?: number;
  pageSize?: number;
  status?: string;
  clientId?: string;
} = {}): Promise<ListResult<unknown>> {
  try {
    const ctx = await requireStaff();
    const { page, pageSize, skip, take } = paginate(input.page, input.pageSize);

    const where: Record<string, unknown> = {};
    if (input.status) where.status = String(input.status).slice(0, 30);

    // Atendente enxerga apenas reservas ligadas às propostas dele (ou a si mesmo).
    if (!isAdmin(ctx.user.role)) {
      where.OR = [{ clientId: ctx.user.id }, { proposal: { consultantId: ctx.user.id } }];
    } else if (input.clientId) {
      where.clientId = String(input.clientId).slice(0, 64);
    }

    const [data, total] = await Promise.all([
      prisma.booking.findMany({ where, orderBy: { createdAt: 'desc' }, take, skip, select: BOOKING_SELECT }),
      prisma.booking.count({ where }),
    ]);

    const meta = pageMeta(total, page, pageSize);
    return { success: true, data, items: data, ...meta, pages: meta.totalPages };
  } catch (error) {
    return {
      ...fail(error, 'Erro ao buscar reservas.'),
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 1,
      pages: 1,
    };
  }
}

export async function updateBookingStatus(id: string, status: string): Promise<ActionResult<unknown>> {
  try {
    const ctx = await requireStaff();
    if (!(BOOKING_STATUS as readonly string[]).includes(status)) {
      return { success: false, error: 'Status de reserva inválido.' };
    }

    // `updateMany` aplica o filtro de posse no próprio UPDATE: um atendente não
    // consegue reescrever a reserva de outro atendente.
    const scope = isAdmin(ctx.user.role)
      ? { id }
      : { id, OR: [{ clientId: ctx.user.id }, { proposal: { consultantId: ctx.user.id } }] };

    const result = await prisma.booking.updateMany({ where: scope, data: { status } });
    if (result.count === 0) return { success: false, error: 'Reserva não encontrada.' };

    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { id: true, status: true, clientId: true, updatedAt: true },
    });

    auditLog({
      userId: ctx.user.id,
      action: 'booking.status_change',
      entity: 'Booking',
      entityId: id,
      details: `status=${status}`,
    });
    revalidateSales();
    return ok(booking);
  } catch (error) {
    return fail(error, 'Erro ao atualizar status da reserva.');
  }
}

/** Pagamentos são dado financeiro: só admin. */
export async function updatePaymentStatus(id: string, status: string): Promise<ActionResult<unknown>> {
  try {
    const ctx = await requireAdmin();
    if (!(PAYMENT_STATUS as readonly string[]).includes(status)) {
      return { success: false, error: 'Status de pagamento inválido.' };
    }

    const payment = await prisma.payment.update({
      where: { id },
      data: { status, paidAt: status === 'paid' ? new Date() : undefined },
      select: { id: true, status: true, amount: true, paidAt: true, bookingId: true },
    });

    if (status === 'paid') {
      const booking = await prisma.booking.findUnique({
        where: { id: payment.bookingId },
        select: { clientId: true },
      });
      await notifyUser(booking?.clientId, {
        title: 'Pagamento confirmado',
        message: 'Recebemos a confirmação do seu pagamento. Obrigado!',
        type: 'success',
        category: 'booking',
        linkUrl: '/dashboard/cliente',
      });
    }

    auditLog({
      userId: ctx.user.id,
      action: 'payment.status_change',
      entity: 'Payment',
      entityId: id,
      details: `status=${status}`,
    });
    revalidateSales();
    return ok(payment);
  } catch (error) {
    return fail(error, 'Erro ao atualizar pagamento.');
  }
}

// ─── PROPOSTAS ──────────────────────────────────────────────

export async function getProposals(input: {
  page?: number;
  pageSize?: number;
  status?: string;
  consultantId?: string;
  search?: string;
} = {}): Promise<ListResult<unknown>> {
  try {
    const ctx = await requireStaff();
    const { page, pageSize, skip, take } = paginate(input.page, input.pageSize);

    const where: Record<string, unknown> = {};
    if (input.status) where.status = String(input.status).slice(0, 30);

    const search = str(input.search, 120);
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { uniqueLink: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Atendente NUNCA escolhe o consultantId vindo do cliente: é forçado ao próprio id.
    if (!isAdmin(ctx.user.role)) {
      where.consultantId = ctx.user.id;
    } else if (input.consultantId) {
      where.consultantId = String(input.consultantId).slice(0, 64);
    }

    const [data, total] = await Promise.all([
      prisma.proposal.findMany({ where, orderBy: { createdAt: 'desc' }, take, skip, select: PROPOSAL_SELECT }),
      prisma.proposal.count({ where }),
    ]);

    const meta = pageMeta(total, page, pageSize);
    return { success: true, data, items: data, ...meta, pages: meta.totalPages };
  } catch (error) {
    return {
      ...fail(error, 'Erro ao buscar propostas.'),
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 1,
      pages: 1,
    };
  }
}

export async function createProposal(input: ActionInput): Promise<ActionResult<unknown>> {
  try {
    const ctx = await requireStaff();
    const f = pick(input);

    const title = str(f.title, 200);
    const customerId = str(f.customerId, 64);
    const requestedConsultant = str(f.consultantId, 64);
    if (title.length < 2) return { success: false, error: 'Informe o título da proposta.' };
    if (!customerId) return { success: false, error: 'Selecione o cliente.' };

    const consultantId = isAdmin(ctx.user.role) && requestedConsultant ? requestedConsultant : ctx.user.id;

    const items = normalizeItems(f.items);
    if (items.length === 0) return { success: false, error: 'Adicione ao menos um item.' };
    if (items.length > 50) return { success: false, error: 'Máximo de 50 itens por proposta.' };

    const totalValue =
      toNumber(f.totalValue, { min: 0, max: 10_000_000, fallback: 0 }) ||
      items.reduce((acc, item) => acc + item.price * item.quantity, 0);

    const proposal = await prisma.proposal.create({
      data: {
        title,
        consultantId,
        customerId,
        leadId: strOrNull(f.leadId, 64),
        totalValue,
        // token do link público: aleatório e não enumerável (nada de Date.now())
        uniqueLink: `${slugToken(title)}-${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`,
        status: 'draft',
        notes: strOrNull(f.notes, 2000),
        validUntil: parseDateOrNull(strOrNull(f.validUntil, 40)),
        items: { create: items },
      },
      select: PROPOSAL_SELECT,
    });

    auditLog({
      userId: ctx.user.id,
      action: 'proposal.create',
      entity: 'Proposal',
      entityId: proposal.id,
      details: `total=${totalValue}`,
    });
    await notifyUser(customerId, {
      title: 'Nova proposta disponível',
      message: `A proposta "${proposal.title}" está pronta para você conferir.`,
      type: 'info',
      category: 'proposal',
      linkUrl: `/proposta/${proposal.uniqueLink}`,
    });
    revalidateSales();
    return ok(proposal);
  } catch (error) {
    return fail(error, 'Erro ao criar proposta.');
  }
}

export async function updateProposalStatus(id: string, status: string): Promise<ActionResult<unknown>> {
  try {
    const ctx = await requireStaff();
    if (!['draft', 'sent', 'viewed', 'approved', 'rejected', 'expired'].includes(status)) {
      return { success: false, error: 'Status de proposta inválido.' };
    }

    const existing = await prisma.proposal.findUnique({
      where: { id },
      select: { id: true, consultantId: true, customerId: true, title: true, leadId: true },
    });
    if (!existing) return { success: false, error: 'Proposta não encontrada.' };
    if (!isAdmin(ctx.user.role) && existing.consultantId !== ctx.user.id) {
      return { success: false, error: 'Você não tem acesso a esta proposta.' };
    }

    const proposal = await prisma.proposal.update({
      where: { id },
      data: { status, viewedAt: status === 'viewed' ? new Date() : undefined },
      select: {
        id: true,
        title: true,
        status: true,
        version: true,
        uniqueLink: true,
        customerId: true,
        consultantId: true,
        updatedAt: true,
      },
    });

    if (status === 'approved' && existing.leadId) {
      await prisma.lead
        .update({ where: { id: existing.leadId }, data: { status: 'fechado' } })
        .catch(() => undefined);
    }

    auditLog({
      userId: ctx.user.id,
      action: 'proposal.status_change',
      entity: 'Proposal',
      entityId: id,
      details: `status=${status}`,
    });
    await notifyUser(existing.customerId, {
      title: status === 'approved' ? 'Proposta aprovada' : 'Proposta atualizada',
      message: `A proposta "${proposal.title}" está com o status: ${status}.`,
      type: status === 'approved' ? 'success' : 'info',
      category: 'proposal',
      linkUrl: `/proposta/${proposal.uniqueLink}`,
    });
    revalidateSales();
    return ok(proposal);
  } catch (error) {
    return fail(error, 'Erro ao atualizar proposta.');
  }
}

// ─── INTERNOS ──────────────────────────────────────────────

interface NormalizedItem {
  name: string;
  type: string;
  refId: string | null;
  quantity: number;
  price: number;
  details: string | null;
}

/** Aceita array de objetos, array de JSON string ou JSON único. */
function normalizeItems(raw: FormDataEntryValue | undefined): NormalizedItem[] {
  const out: NormalizedItem[] = [];
  for (const entry of parseStringArray(raw, 50)) {
    if (!entry) continue;
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(entry) as Record<string, unknown>;
    } catch {
      continue; // item inválido é ignorado (não derruba a proposta inteira)
    }
    if (!parsed || typeof parsed !== 'object') continue;
    const name = String(parsed.name ?? '').slice(0, 160).trim();
    if (!name) continue;
    out.push({
      name,
      type: String(parsed.type ?? 'package').slice(0, 30),
      refId: parsed.refId ? String(parsed.refId).slice(0, 64) : null,
      quantity: Math.max(1, Math.min(99, Math.round(Number(parsed.quantity) || 1))),
      price: Math.max(0, Math.min(10_000_000, Number(parsed.price) || 0)),
      details: parsed.details ? String(parsed.details).slice(0, 500) : null,
    });
  }
  return out;
}

function slugToken(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 40) || 'proposta';
}

function parseDateOrNull(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}