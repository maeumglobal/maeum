'use server';

/**
 * Leads do CRM.
 *
 * Autorização por recurso: `requireStaff()` para o atendente, mas o filtro de
 * posse entra no WHERE do Prisma — uma consultora só enxerga os leads em que
 * `consultantId === ctx.user.id`, independentemente do que o navegador mande.
 * Reatribuir dono e excluir são `requireAdmin()`.
 */
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireStaff } from '@/lib/auth';
import { isAdmin } from '@/lib/session';
import { auditLog } from '@/lib/audit';
import { notifyUser } from '@/lib/notify';
import { str } from '@/lib/validate';
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

const LEAD_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  destination: true,
  budget: true,
  status: true,
  notes: true,
  origin: true,
  consultantId: true,
  lastContactedAt: true,
  createdAt: true,
  updatedAt: true,
  consultant: { select: { id: true, name: true, email: true } },
  _count: { select: { proposals: true, chats: true } },
} as const;

const LEAD_STATUSES = [
  'novo',
  'contato',
  'atendimento',
  'proposta',
  'proposta_enviada',
  'fechado',
  'perdido',
] as const;

export interface LeadSummary {
  id: string;
  name: string;
  status: string;
  consultantId: string | null;
  updatedAt: Date;
}

function revalidateLeads() {
  revalidatePath('/dashboard/admin');
  revalidatePath('/dashboard/consultora');
  revalidatePath('/admin');
}

export async function getLeads(input: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  consultantId?: string;
} = {}): Promise<ListResult<unknown>> {
  try {
    const ctx = await requireStaff();
    const { page, pageSize, skip, take } = paginate(input.page, input.pageSize);
    const search = String(input.search ?? '').trim().slice(0, 120);

    const where: Record<string, unknown> = {};
    if (input.status) where.status = String(input.status).slice(0, 30);

    // consultantId vindo do cliente é ignorado para atendentes.
    if (!isAdmin(ctx.user.role)) {
      where.consultantId = ctx.user.id;
    } else if (input.consultantId) {
      where.consultantId = String(input.consultantId).slice(0, 64);
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { destination: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.lead.findMany({ where, orderBy: { createdAt: 'desc' }, take, skip, select: LEAD_SELECT }),
      prisma.lead.count({ where }),
    ]);

    const meta = pageMeta(total, page, pageSize);
    return { success: true, data, items: data, ...meta, pages: meta.totalPages };
  } catch (error) {
    return {
      ...fail(error, 'Erro ao buscar leads.'),
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 1,
      pages: 1,
    };
  }
}

export async function updateLeadStatusAction(id: string, status: string): Promise<ActionResult<LeadSummary>> {
  try {
    const ctx = await requireStaff();
    if (!(LEAD_STATUSES as readonly string[]).includes(status)) {
      return { success: false, error: 'Status de lead inválido.' };
    }

    // updateMany aplica a posse no próprio UPDATE.
    const scope = isAdmin(ctx.user.role) ? { id } : { id, consultantId: ctx.user.id };
    const result = await prisma.lead.updateMany({
      where: scope,
      data: { status, lastContactedAt: new Date() },
    });
    if (result.count === 0) return { success: false, error: 'Lead não encontrado.' };

    const lead = await prisma.lead.findUnique({
      where: { id },
      select: { id: true, name: true, status: true, consultantId: true, updatedAt: true },
    });
    if (!lead) return { success: false, error: 'Lead não encontrado.' };

    auditLog({
      userId: ctx.user.id,
      action: 'lead.status_change',
      entity: 'Lead',
      entityId: id,
      details: `status=${status}`,
    });
    revalidateLeads();
    return ok(lead);
  } catch (error) {
    return fail(error, 'Erro ao atualizar status do lead.');
  }
}

/** Reatribuir dono é privileged: só admin. */
export async function updateLeadConsultantAction(
  id: string,
  consultantId: string | null,
): Promise<ActionResult<LeadSummary>> {
  try {
    const ctx = await requireAdmin();
    const target = consultantId ? str(consultantId, 64) : null;

    if (target) {
      const consultant = await prisma.user.findUnique({
        where: { id: target },
        select: { id: true, role: true, isActive: true },
      });
      if (!consultant || !consultant.isActive) return { success: false, error: 'Consultora não encontrada.' };
      if (!['consultora', 'admin', 'super_admin'].includes(consultant.role)) {
        return { success: false, error: 'O usuário selecionado não é da equipe.' };
      }
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: { consultantId: target },
      select: { id: true, name: true, status: true, consultantId: true, updatedAt: true },
    });
    if (!lead) return { success: false, error: 'Lead não encontrado.' };

    auditLog({
      userId: ctx.user.id,
      action: 'lead.assign',
      entity: 'Lead',
      entityId: id,
      details: `consultantId=${target ?? 'null'}`,
    });
    await notifyUser(target, {
      title: 'Novo lead atribuído a você',
      message: `O lead "${lead.name}" foi atribuído a você.`,
      type: 'info',
      category: 'lead',
      linkUrl: '/dashboard/consultora',
    });
    revalidateLeads();
    return ok(lead);
  } catch (error) {
    return fail(error, 'Erro ao atribuir lead.');
  }
}

export async function deleteLeadAction(id: string): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requireAdmin();
    await prisma.lead.delete({ where: { id } });
    auditLog({ userId: ctx.user.id, action: 'lead.delete', entity: 'Lead', entityId: id });
    revalidateLeads();
    return { success: true };
  } catch (error) {
    return fail(error, 'Erro ao excluir lead.');
  }
}

// ─── MÉTRICAS DO PORTAL DA CONSULTORA ────────────────────────

export interface ConsultantOverview {
  leads: {
    total: number;
    /** Contagem por status real do funil (`Lead.status`). */
    byStatus: Record<string, number>;
  };
  proposals: {
    total: number;
    byStatus: Record<string, number>;
    /** Propostas que saíram do rascunho (enviadas, visualizadas, decididas). */
    sentTotal: number;
    approvedTotal: number;
    /** Soma de `totalValue` das propostas ainda em aberto (draft/sent/viewed). */
    openValue: number;
    /** Soma de `totalValue` das propostas aprovadas. */
    approvedValue: number;
    /** Ticket médio REAL = approvedValue / approvedTotal. `null` sem aprovadas. */
    avgTicket: number | null;
    /** approvedTotal / sentTotal em %. `null` quando nada foi enviado. */
    conversionRate: number | null;
  };
  chats: { open: number; total: number };
  bookings: {
    total: number;
    /** Reservas com `startDate` no futuro e status pending/confirmed. */
    upcoming: number;
    /** Soma de `totalPrice` das reservas ativas (pending/confirmed). */
    activeValue: number;
  };
}

function toCountMap(
  rows: Array<{ status: string; count: number }>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const row of rows) out[row.status] = (out[row.status] ?? 0) + row.count;
  return out;
}

/**
 * Números do painel `/dashboard/consultora`.
 *
 * REGRA: tudo aqui é CONTAGEM/AGREGATE no Postgres, escopado em
 * `consultantId = ctx.user.id`. Não existe nenhum valor de fallback no
 * componente — quando a contagem é zero a tela mostra zero, e quando não há
 * base para um cálculo (ticket médio, conversão) o campo vem `null` e a UI
 * diz "sem dados suficientes".
 *
 * `requireStaff()` primeiro; admin também recebe apenas o próprio escopo
 * (o layout manda admin para `/dashboard/admin`).
 */
export async function getConsultantOverview(): Promise<ActionResult<ConsultantOverview>> {
  try {
    const ctx = await requireStaff();
    const me = ctx.user.id;
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const OPEN_PROPOSAL_STATUSES = ['draft', 'sent', 'viewed'];
    const ACTIVE_BOOKING_STATUSES = ['pending', 'confirmed'];

    const [
      leadGroups,
      leadTotal,
      proposalGroups,
      proposalTotal,
      openValue,
      approvedValue,
      openChats,
      totalChats,
      bookingTotal,
      upcomingBookings,
      activeBookingValue,
    ] = await Promise.all([
      prisma.lead.groupBy({
        by: ['status'],
        where: { consultantId: me },
        _count: { _all: true },
      }),
      prisma.lead.count({ where: { consultantId: me } }),
      prisma.proposal.groupBy({
        by: ['status'],
        where: { consultantId: me },
        _count: { _all: true },
        _sum: { totalValue: true },
      }),
      prisma.proposal.count({ where: { consultantId: me } }),
      prisma.proposal.aggregate({
        where: { consultantId: me, status: { in: OPEN_PROPOSAL_STATUSES } },
        _sum: { totalValue: true },
      }),
      prisma.proposal.aggregate({
        where: { consultantId: me, status: 'approved' },
        _sum: { totalValue: true },
      }),
      prisma.chat.count({ where: { consultantId: me, status: 'open' } }),
      prisma.chat.count({ where: { consultantId: me } }),
      prisma.booking.count({ where: { proposal: { consultantId: me } } }),
      prisma.booking.count({
        where: {
          proposal: { consultantId: me },
          status: { in: ACTIVE_BOOKING_STATUSES },
          startDate: { gte: today },
        },
      }),
      prisma.booking.aggregate({
        where: { proposal: { consultantId: me }, status: { in: ACTIVE_BOOKING_STATUSES } },
        _sum: { totalPrice: true },
      }),
    ]);

    const leadsByStatus = toCountMap(
      leadGroups.map((row) => ({ status: row.status, count: row._count._all })),
    );
    const proposalsByStatus = toCountMap(
      proposalGroups.map((row) => ({ status: row.status, count: row._count._all })),
    );

    const countOf = (map: Record<string, number>, ...keys: string[]): number =>
      keys.reduce((acc, key) => acc + (map[key] ?? 0), 0);

    const approvedTotal = countOf(proposalsByStatus, 'approved');
    // "Enviada" = já saiu do rascunho (o cliente chegou a ver/decidir).
    const sentTotal = countOf(
      proposalsByStatus,
      'sent',
      'viewed',
      'approved',
      'rejected',
      'expired',
    );
    const approvedSum = approvedValue._sum.totalValue ?? 0;

    return ok({
      leads: { total: leadTotal, byStatus: leadsByStatus },
      proposals: {
        total: proposalTotal,
        byStatus: proposalsByStatus,
        sentTotal,
        approvedTotal,
        openValue: openValue._sum.totalValue ?? 0,
        approvedValue: approvedSum,
        avgTicket: approvedTotal > 0 ? approvedSum / approvedTotal : null,
        conversionRate: sentTotal > 0 ? (approvedTotal / sentTotal) * 100 : null,
      },
      chats: { open: openChats, total: totalChats },
      bookings: {
        total: bookingTotal,
        upcoming: upcomingBookings,
        activeValue: activeBookingValue._sum.totalPrice ?? 0,
      },
    });
  } catch (error) {
    return fail(error, 'Erro ao carregar as métricas do painel.');
  }
}

// ─── CRIAÇÃO MANUAL (backoffice) ────────────────────────────

export async function createLeadAction(input: ActionInput): Promise<ActionResult<unknown>> {
  try {
    const ctx = await requireStaff();
    const f = pick(input);

    const name = str(f.name, 120);
    if (name.length < 2) return { success: false, error: 'Informe o nome do lead.' };

    const budget = Number(str(f.budget, 20));

    const lead = await prisma.lead.create({
      data: {
        name,
        email: str(f.email, 180).toLowerCase(),
        phone: str(f.phone, 40) || null,
        destination: str(f.destination, 160) || null,
        budget: Number.isFinite(budget) && budget > 0 ? budget : null,
        status: 'novo',
        origin: str(f.origin, 60) || 'manual',
        consultantId: isAdmin(ctx.user.role) ? str(f.consultantId, 64) || null : ctx.user.id,
        notes: str(f.notes, 4000) || null,
      },
      select: LEAD_SELECT,
    });

    auditLog({ userId: ctx.user.id, action: 'lead.create', entity: 'Lead', entityId: lead.id });
    revalidateLeads();
    return ok(lead);
  } catch (error) {
    return fail(error, 'Erro ao criar lead.');
  }
}