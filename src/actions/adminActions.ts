'use server';

/**
 * Auditoria e métricas do painel.
 *
 * Autorização: `requireAdmin()` em tudo. A trilha de auditoria é gravada por
 * `auditLog()` (src/lib/audit.ts) a partir das próprias actions de mutação —
 * a antiga `createAdminLog` exportada aqui NUNCA foi chamada por ninguém e por
 * isso a tela de logs mostrava só as 2 linhas do seed. Ela foi REMOVIDA.
 *
 * Correções de dados em `getAdminStats`:
 *  - faturamento filtra por `Payment.paidAt` (antes `createdAt`, que contava
 *    boleto emitido como receita);
 *  - `conversion.change` virou variação percentual relativa, igual às demais
 *    métricas (antes era delta absoluto em pontos percentuais).
 */
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { auditLog } from '@/lib/audit';
import { pick, paginate, pageMeta, fail, ok, type ActionInput, type ActionResult, type ListResult } from '@/lib/actionKit';
import { str, strOrNull, toInt, toNumber, safeUrl } from '@/lib/validate';
import { revalidatePath } from 'next/cache';

const LOG_SELECT = {
  id: true,
  action: true,
  entity: true,
  entityId: true,
  details: true,
  ipAddress: true,
  result: true,
  createdAt: true,
  user: { select: { id: true, name: true, email: true, role: true } },
} as const;

/** Variação percentual relativa entre dois períodos. */
function calcChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// ─── LOGS ───────────────────────────────────────────────────

export async function getLogs(input: {
  page?: number;
  pageSize?: number;
  action?: string;
  entity?: string;
  userId?: string;
} = {}): Promise<ListResult<unknown>> {
  try {
    await requireAdmin();
    const { page, pageSize, skip, take } = paginate(input.page, input.pageSize);

    const where: Record<string, unknown> = {};
    if (input.action) where.action = String(input.action).slice(0, 100);
    if (input.entity) where.entity = String(input.entity).slice(0, 100);
    if (input.userId) where.userId = String(input.userId).slice(0, 64);

    const [logs, total] = await Promise.all([
      prisma.adminLog.findMany({ where, orderBy: { createdAt: 'desc' }, take, skip, select: LOG_SELECT }),
      prisma.adminLog.count({ where }),
    ]);

    const meta = pageMeta(total, page, pageSize);
    return { success: true, data: logs, items: logs, ...meta, pages: meta.totalPages };
  } catch (error) {
    return { ...fail(error, 'Erro ao buscar logs.'), items: [], total: 0, page: 1, pageSize: 20, totalPages: 1, pages: 1 };
  }
}

// ─── MÉTRICAS DO DASHBOARD ──────────────────────────────────

export async function getAdminStats(): Promise<{ success: boolean; error?: string; data?: unknown }> {
  try {
    await requireAdmin();

    const now = new Date();
    const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const previousMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    const currentPaidWhere = { status: 'paid', paidAt: { gte: currentMonthStart, lt: nextMonthStart } };
    const previousPaidWhere = { status: 'paid', paidAt: { gte: previousMonthStart, lt: currentMonthStart } };

    const [
      currentRevenue,
      previousRevenue,
      currentBookings,
      previousBookings,
      currentLeads,
      previousLeads,
      totalUsers,
      totalExperiences,
      totalJourneys,
      totalPartners,
      totalDepartures,
      recentLeads,
      recentPayments,
    ] = await Promise.all([
      prisma.payment.aggregate({ _sum: { amount: true }, where: currentPaidWhere }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: previousPaidWhere }),
      prisma.booking.count({ where: { status: 'confirmed', createdAt: { gte: currentMonthStart, lt: nextMonthStart } } }),
      prisma.booking.count({ where: { status: 'confirmed', createdAt: { gte: previousMonthStart, lt: currentMonthStart } } }),
      prisma.lead.count({ where: { createdAt: { gte: currentMonthStart, lt: nextMonthStart } } }),
      prisma.lead.count({ where: { createdAt: { gte: previousMonthStart, lt: currentMonthStart } } }),
      prisma.user.count({ where: { role: 'customer' } }),
      prisma.experience.count({ where: { status: 'active' } }),
      prisma.journey.count({ where: { status: 'active' } }),
      prisma.partner.count({ where: { status: 'active' } }),
      prisma.journeyDeparture.count({ where: { status: 'available', startDate: { gte: now } } }),
      prisma.lead.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, status: true, budget: true, destination: true, createdAt: true },
      }),
      prisma.payment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          amount: true,
          status: true,
          paidAt: true,
          createdAt: true,
          booking: { select: { id: true, client: { select: { name: true, email: true } } } },
        },
      }),
    ]);

    const curRev = currentRevenue._sum.amount ?? 0;
    const prevRev = previousRevenue._sum.amount ?? 0;

    const currentTicket = currentBookings > 0 ? curRev / currentBookings : 0;
    const previousTicket = previousBookings > 0 ? prevRev / previousBookings : 0;

    const currentConversion = currentLeads > 0 ? (currentBookings / currentLeads) * 100 : 0;
    const previousConversion = previousLeads > 0 ? (previousBookings / previousLeads) * 100 : 0;

    return {
      success: true,
      data: {
        metrics: {
          revenue: { value: curRev, change: calcChange(curRev, prevRev) },
          bookings: { value: currentBookings, change: calcChange(currentBookings, previousBookings) },
          leads: { value: currentLeads, change: calcChange(currentLeads, previousLeads) },
          // variacao RELATIVA (%) — igual a todas as outras métricas
          conversion: { value: currentConversion, change: calcChange(currentConversion, previousConversion) },
          ticket: { value: currentTicket, change: calcChange(currentTicket, previousTicket) },
        },
        totals: {
          users: totalUsers,
          experiences: totalExperiences,
          journeys: totalJourneys,
          partners: totalPartners,
          upcomingDepartures: totalDepartures,
        },
        recentLeads,
        recentPayments,
      },
    };
  } catch (error) {
    return fail(error, 'Erro ao carregar estatísticas.');
  }
}

// ─── SÉRIES REAIS DOS GRÁFICOS ──────────────────────────────
//
// Antes these charts were fed by hardcoded arrays presented as real numbers.
// Everything below comes from Prisma: `Payment.paidAt` for revenue (only money
// that actually landed), `Booking.status` for the status split and
// `Booking.packageId → Package.title` for the per-package distribution.

export interface RevenuePoint {
  /** `YYYY-MM` — chave estável para o eixo X. */
  key: string;
  /** Rótulo já traduzido no cliente pelo locale (ex.: `jan/26`). */
  year: number;
  month: number;
  revenue: number;
  count: number;
}

/** `YYYY-MM` do primeiro dia do mês, em UTC. */
function monthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

/**
 * Faturamento recebido mês a mês.
 *
 * @param months 6 ou 12 (o painel oferece os dois).
 */
export async function getRevenueSeries(months = 6): Promise<ActionResult<RevenuePoint[]>> {
  try {
    await requireAdmin();
    const total = Math.max(1, Math.min(24, Math.round(Number(months)) || 6));

    const now = new Date();
    const firstMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (total - 1), 1));

    const payments = await prisma.payment.findMany({
      where: { status: 'paid', paidAt: { gte: firstMonth } },
      select: { amount: true, paidAt: true },
      take: 20_000,
    });

    const buckets = new Map<string, RevenuePoint>();
    for (let i = 0; i < total; i += 1) {
      const d = new Date(Date.UTC(firstMonth.getUTCFullYear(), firstMonth.getUTCMonth() + i, 1));
      buckets.set(monthKey(d.getUTCFullYear(), d.getUTCMonth()), {
        key: monthKey(d.getUTCFullYear(), d.getUTCMonth()),
        year: d.getUTCFullYear(),
        month: d.getUTCMonth(),
        revenue: 0,
        count: 0,
      });
    }

    for (const p of payments) {
      if (!p.paidAt) continue;
      const key = monthKey(p.paidAt.getUTCFullYear(), p.paidAt.getUTCMonth());
      const bucket = buckets.get(key);
      if (!bucket) continue;
      bucket.revenue += p.amount;
      bucket.count += 1;
    }

    return ok([...buckets.values()]);
  } catch (error) {
    return fail(error, 'Erro ao carregar a série de faturamento.');
  }
}

/** Contagem real de reservas agrupada por status. */
export async function getBookingsByStatus(): Promise<
  ActionResult<Array<{ status: string; count: number }>>
> {
  try {
    await requireAdmin();
    const grouped = await prisma.booking.groupBy({ by: ['status'], _count: { _all: true } });
    const rows = grouped
      .map((g) => ({ status: String(g.status || 'outro'), count: g._count._all }))
      .sort((a, b) => b.count - a.count);
    return ok(rows);
  } catch (error) {
    return fail(error, 'Erro ao agrupar reservas por status.');
  }
}

/** Distribuição real de reservas por pacote (inclui as sem pacote). */
export async function getBookingsByPackage(
  take = 6,
): Promise<ActionResult<Array<{ title: string; count: number }>>> {
  try {
    await requireAdmin();
    const limit = Math.max(1, Math.min(20, Math.round(Number(take)) || 6));

    const grouped = await prisma.booking.groupBy({
      by: ['packageId'],
      _count: { _all: true },
      orderBy: { _count: { packageId: 'desc' } },
      take: limit,
    });

    const ids = grouped
      .map((g) => g.packageId)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);

    const packages = ids.length
      ? await prisma.package.findMany({ where: { id: { in: ids } }, select: { id: true, title: true } })
      : [];
    const titleById = new Map(packages.map((p) => [p.id, p.title]));

    // O resto das reservas (fora do top-N e as sem pacote) entra em "Sem pacote".
    const topIds = grouped.map((g) => g.packageId).filter((id): id is string => typeof id === 'string');
    const rest = await prisma.booking.count({
      where: topIds.length ? { NOT: { packageId: { in: topIds } } } : {},
    });

    const rows = grouped.map((g) => ({
      title: g.packageId ? (titleById.get(g.packageId) ?? 'Pacote removido') : 'Sem pacote',
      count: g._count._all,
    }));

    if (rest > 0) rows.push({ title: 'Outros pacotes', count: rest });

    return ok(rows);
  } catch (error) {
    return fail(error, 'Erro ao agrupar reservas por pacote.');
  }
}

export interface FinancialSummaryData {
  receivedThisMonth: number;
  receivedChange: number;
  pending: number;
  refunded: number;
  totalReceived: number;
  averageTicket: number;
  paidCount: number;
  pendingCount: number;
}

/**
 * Resumo financeiro — 100% derivado de `Payment`.
 * `receivedChange` compara o mês corrente com o anterior em `paidAt`.
 */
export async function getFinancialSummary(): Promise<ActionResult<FinancialSummaryData>> {
  try {
    await requireAdmin();

    const now = new Date();
    const currentStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const previousStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const nextStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    const [currentMonth, previousMonth, pending, refunded, totals] = await Promise.all([
      prisma.payment.aggregate({
        _sum: { amount: true },
        _count: { _all: true },
        where: { status: 'paid', paidAt: { gte: currentStart, lt: nextStart } },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'paid', paidAt: { gte: previousStart, lt: currentStart } },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        _count: { _all: true },
        where: { status: 'pending' },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: { in: ['refunded', 'cancelled'] } },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        _count: { _all: true },
        where: { status: 'paid' },
      }),
    ]);

    const received = currentMonth._sum.amount ?? 0;
    const previous = previousMonth._sum.amount ?? 0;

    return ok({
      receivedThisMonth: received,
      receivedChange: calcChange(received, previous),
      pending: pending._sum.amount ?? 0,
      refunded: refunded._sum.amount ?? 0,
      totalReceived: totals._sum.amount ?? 0,
      averageTicket: totals._count._all > 0 ? (totals._sum.amount ?? 0) / totals._count._all : 0,
      paidCount: totals._count._all,
      pendingCount: pending._count._all,
    });
  } catch (error) {
    return fail(error, 'Erro ao carregar o resumo financeiro.');
  }
}

export interface RecentPaymentRow {
  id: string;
  amount: number;
  status: string;
  paidAt: Date | null;
  createdAt: Date;
  clientName: string;
  packageTitle: string | null;
}

/**
 * Pagamentos recentes COM o nome do cliente e o título do pacote.
 *
 * `getAdminStats` (mantido intacto) só devolve `booking.id`; mostrar isso na
 * tela fazia o painel exibir "Pacote Padrão" e `ui-avatars?name=C` para todo
 * mundo. Aqui os joins são explícitos.
 */
export async function getRecentPayments(take = 5): Promise<ActionResult<RecentPaymentRow[]>> {
  try {
    await requireAdmin();
    const limit = Math.max(1, Math.min(20, Math.round(Number(take)) || 5));

    const data = await prisma.payment.findMany({
      orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      select: {
        id: true,
        amount: true,
        status: true,
        paidAt: true,
        createdAt: true,
        booking: {
          select: {
            client: { select: { name: true } },
            package: { select: { title: true } },
          },
        },
      },
    });

    return ok(
      data.map((p) => ({
        id: p.id,
        amount: p.amount,
        status: p.status,
        paidAt: p.paidAt,
        createdAt: p.createdAt,
        clientName: p.booking?.client?.name ?? '',
        packageTitle: p.booking?.package?.title ?? null,
      })),
    );
  } catch (error) {
    return fail(error, 'Erro ao buscar pagamentos recentes.');
  }
}

// ─── EDIÇÃO DE DEPOIMENTO ───────────────────────────────────

const TESTIMONIAL_SELECT = {
  id: true,
  name: true,
  destination: true,
  text: true,
  rating: true,
  avatarUrl: true,
  status: true,
  sortOrder: true,
} as const;

/**
 * Edição de depoimento — `contentActions.ts` só expunha criar/aprovar/rejeitar/
 * excluir, então o texto de um depoimento aprovado era imutável pelo painel.
 */
export async function updateTestimonial(
  id: string,
  input: ActionInput,
): Promise<ActionResult<unknown>> {
  try {
    const ctx = await requireAdmin();
    const f = pick(input);
    const target = str(f.id, 64) || str(id, 64);
    if (!target) return { success: false, error: 'Depoimento não encontrado.' };

    const data: Record<string, unknown> = {};
    const name = str(f.name, 120);
    if (name.length >= 2) data.name = name;
    if (f.destination !== undefined) data.destination = strOrNull(f.destination, 120);
    if (f.text !== undefined) {
      const text = str(f.text, 2000);
      if (text.length < 10) return { success: false, error: 'O depoimento é muito curto.' };
      data.text = text;
    }
    if (f.rating !== undefined) data.rating = toInt(f.rating, { min: 1, max: 5, fallback: 5 });
    if (f.avatarUrl !== undefined) data.avatarUrl = safeUrl(strOrNull(f.avatarUrl, 500));
    if (f.sortOrder !== undefined) data.sortOrder = toInt(f.sortOrder, { min: 0, max: 9999, fallback: 0 });
    if (f.status !== undefined) {
      const status = str(f.status, 20);
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return { success: false, error: 'Status inválido.' };
      }
      data.status = status;
    }

    if (Object.keys(data).length === 0) return { success: false, error: 'Nada para atualizar.' };

    const testimonial = await prisma.testimonial.update({
      where: { id: target },
      data,
      select: TESTIMONIAL_SELECT,
    });

    auditLog({
      userId: ctx.user.id,
      action: 'testimonial.update',
      entity: 'Testimonial',
      entityId: target,
    });
    revalidatePath('/');
    revalidatePath('/dashboard/admin');
    return ok(testimonial);
  } catch (error) {
    return fail(error, 'Erro ao atualizar depoimento.');
  }
}

// ─── LINK DE COBRANÇA INTERNO ───────────────────────────────

const PAYMENT_METHODS = ['pix', 'boleto', 'transferencia'] as const;
const PAYMENT_PATH_PREFIX = '/p/';

export interface PaymentLinkData {
  id: string;
  token: string;
  paymentUrl: string;
  amount: number;
  status: string;
  dueDate: string | null;
  clientName: string;
  packageTitle: string | null;
  bookingId: string;
}

/** Extrai o token de `/p/<uuid>` — base do link público. */
function tokenFromPaymentUrl(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/\/p\/([A-Za-z0-9-]{8,64})\/?$/);
  return match ? match[1]! : null;
}

/**
 * Cria (ou atualiza) uma cobrança com link público próprio.
 *
 * O painel antigo fabricava um link de checkout do Stripe com sufixo aleatório e
 * oferecia mandar esse link morto por WhatsApp. Não há integração Stripe no
 * projeto, então o que existe agora é um link real servindo `/p/<uuid>`, lido
 * pela página pública que mostra valor, vencimento e as instruções de Pix/
 * boleto cadastradas em `SiteConfig`.
 *
 * TODO: quando o Stripe for integrado, trocar este fluxo por Checkout Session
 * + `/api/stripe/webhook` e manter apenas `stripeSessionId`/`paymentUrl`.
 */
export async function createPaymentLink(
  input: ActionInput,
): Promise<ActionResult<PaymentLinkData> & { payment?: PaymentLinkData }> {
  try {
    const ctx = await requireAdmin();
    const f = pick(input);

    const bookingId = str(f.bookingId, 64);
    if (!bookingId) return { success: false, error: 'Selecione a reserva a ser cobrada.' };

    const amount = toNumber(f.amount, { min: 0, max: 10_000_000, fallback: 0 });
    if (amount <= 0) return { success: false, error: 'Informe um valor maior que zero.' };

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        totalPrice: true,
        client: { select: { id: true, name: true } },
        package: { select: { title: true } },
      },
    });
    if (!booking) return { success: false, error: 'Reserva não encontrada.' };

    const methodRaw = str(f.method, 30);
    const method = (PAYMENT_METHODS as readonly string[]).includes(methodRaw)
      ? methodRaw
      : 'pix';

    // Token criptográfico: não enumerável, diferente de um id sequencial.
    const token = crypto.randomUUID();
    const paymentUrl = `${PAYMENT_PATH_PREFIX}${token}`;

    const payment = await prisma.payment.create({
      data: {
        bookingId,
        clientId: booking.client.id,
        amount,
        status: 'pending',
        paymentMethod: method,
        paymentUrl,
        dueDate: parseDate(strOrNull(f.dueDate, 40)),
      },
      select: {
        id: true,
        amount: true,
        status: true,
        dueDate: true,
        paymentUrl: true,
        booking: {
          select: {
            id: true,
            client: { select: { name: true } },
            package: { select: { title: true } },
          },
        },
      },
    });

    auditLog({
      userId: ctx.user.id,
      action: 'payment.link_create',
      entity: 'Payment',
      entityId: payment.id,
      details: `amount=${amount} booking=${bookingId}`,
    });
    revalidatePath('/dashboard/admin');
    revalidatePath('/dashboard/cliente');

    const data = toPaymentLinkData(payment);
    return { success: true, data, payment: data };
  } catch (error) {
    return fail(error, 'Não foi possível gerar o link de cobrança.');
  }
}

/** Reemite o link público de uma cobrança que ainda está pendente. */
export async function regeneratePaymentLink(id: string): Promise<ActionResult<PaymentLinkData> & { payment?: PaymentLinkData }> {
  try {
    const ctx = await requireAdmin();
    const paymentId = str(id, 64);
    if (!paymentId) return { success: false, error: 'Pagamento não encontrado.' };

    const current = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: { id: true, status: true },
    });
    if (!current) return { success: false, error: 'Pagamento não encontrado.' };
    if (current.status === 'paid') {
      return { success: false, error: 'Pagamento já quitado — não é possível gerar novo link.' };
    }

    const token = crypto.randomUUID();
    const paymentUrl = `${PAYMENT_PATH_PREFIX}${token}`;

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: { paymentUrl },
      select: {
        id: true,
        amount: true,
        status: true,
        dueDate: true,
        paymentUrl: true,
        booking: {
          select: {
            id: true,
            client: { select: { name: true } },
            package: { select: { title: true } },
          },
        },
      },
    });

    auditLog({
      userId: ctx.user.id,
      action: 'payment.link_regenerate',
      entity: 'Payment',
      entityId: payment.id,
    });
    revalidatePath('/dashboard/admin');

    const data = toPaymentLinkData(payment);
    return { success: true, data, payment: data };
  } catch (error) {
    return fail(error, 'Não foi possível reemitir o link de cobrança.');
  }
}

// ─── PERFIL PÚBLICO DO USUÁRIO ─────────────────────────────

const PROFILE_LOCALES = ['pt', 'en', 'es'] as const;

/**
 * Atualiza os campos de perfil que `usersActions.updateUser` NÃO cobre
 * (`User.bio` e `User.locale`) — sem eles a tela de edição de usuário tinha
 * dois campos que salvavam nada em silêncio.
 *
 * `requireAdmin()` + `auditLog`, igual ao resto das escritas administrativas.
 */
export async function updateUserProfile(
  id: string,
  input: ActionInput,
): Promise<ActionResult<{ id: string; bio: string | null; locale: string }>> {
  try {
    const ctx = await requireAdmin();
    const f = pick(input);
    const userId = str(f.id, 64) || str(id, 64);
    if (!userId) return { success: false, error: 'Usuário não encontrado.' };

    const data: Record<string, unknown> = {};
    if (f.bio !== undefined) data.bio = strOrNull(f.bio, 1000);
    if (f.locale !== undefined) {
      const locale = str(f.locale, 5);
      if (!(PROFILE_LOCALES as readonly string[]).includes(locale)) {
        return { success: false, error: 'Idioma inválido.' };
      }
      data.locale = locale;
    }

    if (Object.keys(data).length === 0) return { success: false, error: 'Nada para atualizar.' };

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, bio: true, locale: true },
    });

    auditLog({ userId: ctx.user.id, action: 'user.profile_update', entity: 'User', entityId: userId });
    revalidatePath('/admin/equipe');
    revalidatePath('/dashboard/admin');
    return ok(user);
  } catch (error) {
    return fail(error, 'Erro ao atualizar o perfil do usuário.');
  }
}

// ─── INTERNOS ──────────────────────────────────────────────

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00.000Z` : value;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toPaymentLinkData(payment: {
  id: string;
  amount: number;
  status: string;
  dueDate: Date | null;
  paymentUrl: string | null;
  booking: {
    id: string;
    client: { name: string };
    package: { title: string } | null;
  };
}): PaymentLinkData {
  return {
    id: payment.id,
    token: tokenFromPaymentUrl(payment.paymentUrl) ?? '',
    paymentUrl: payment.paymentUrl ?? '',
    amount: payment.amount,
    status: payment.status,
    dueDate: payment.dueDate ? payment.dueDate.toISOString() : null,
    clientName: payment.booking?.client?.name ?? '',
    packageTitle: payment.booking?.package?.title ?? null,
    bookingId: payment.booking?.id ?? '',
  };
}