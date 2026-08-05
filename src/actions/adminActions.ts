'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

// ─── TIPOS ─────────────────────────────────────────────────
interface AdminLogData {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  result?: 'success' | 'error';
}

// ─── LOGS ─────────────────────────────────────────────────
export async function createAdminLog(data: AdminLogData) {
  try {
    const log = await prisma.adminLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        details: data.details ? JSON.stringify(data.details) : null,
        ipAddress: data.ipAddress,
        result: data.result ?? 'success',
      },
    });
    return { success: true, data: log };
  } catch (error) {
    console.error('createAdminLog error:', error);
    return { success: false };
  }
}

export async function getLogs({
  page = 1,
  pageSize = 20,
  action,
  entity,
  userId,
}: {
  page?: number;
  pageSize?: number;
  action?: string;
  entity?: string;
  userId?: string;
} = {}) {
  try {
    const where: Record<string, unknown> = {};
    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (userId) where.userId = userId;

    const [logs, total] = await Promise.all([
      prisma.adminLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip: (page - 1) * pageSize,
        include: { user: { select: { name: true, email: true, role: true } } },
      }),
      prisma.adminLog.count({ where }),
    ]);

    return { success: true, data: logs, total, pages: Math.ceil(total / pageSize) };
  } catch (error) {
    console.error('getLogs error:', error);
    return { success: false, error: 'Erro ao buscar logs.' };
  }
}

// ─── MÉTRICAS DO DASHBOARD ─────────────────────────────────
export async function getAdminStats() {
  try {
    const today = new Date();
    const currentMonthStart = startOfMonth(today);
    const previousMonthStart = startOfMonth(subMonths(today, 1));
    const previousMonthEnd = endOfMonth(subMonths(today, 1));

    const calcChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    // Revenue
    const [currentRevenue, previousRevenue] = await Promise.all([
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'paid', createdAt: { gte: currentMonthStart } } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'paid', createdAt: { gte: previousMonthStart, lte: previousMonthEnd } } }),
    ]);

    const curRev = currentRevenue._sum.amount ?? 0;
    const prevRev = previousRevenue._sum.amount ?? 0;

    // Bookings
    const [currentBookings, previousBookings] = await Promise.all([
      prisma.booking.count({ where: { status: 'confirmed', createdAt: { gte: currentMonthStart } } }),
      prisma.booking.count({ where: { status: 'confirmed', createdAt: { gte: previousMonthStart, lte: previousMonthEnd } } }),
    ]);

    // Leads
    const [currentLeads, previousLeads] = await Promise.all([
      prisma.lead.count({ where: { createdAt: { gte: currentMonthStart } } }),
      prisma.lead.count({ where: { createdAt: { gte: previousMonthStart, lte: previousMonthEnd } } }),
    ]);

    // Ticket médio
    const currentTicket = currentBookings > 0 ? curRev / currentBookings : 0;
    const previousTicket = previousBookings > 0 ? prevRev / previousBookings : 0;

    // Taxa de conversão
    const currentConversion = currentLeads > 0 ? (currentBookings / currentLeads) * 100 : 0;
    const previousConversion = previousLeads > 0 ? (previousBookings / previousLeads) * 100 : 0;

    // Totais gerais
    const [totalUsers, totalExperiences, totalJourneys, totalPartners] = await Promise.all([
      prisma.user.count({ where: { role: 'customer' } }),
      prisma.experience.count({ where: { status: 'active' } }),
      prisma.journey.count({ where: { status: 'active' } }),
      prisma.partner.count({ where: { status: 'active' } }),
    ]);

    // Consultas recentes
    const recentLeads = await prisma.lead.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, status: true, budget: true, destination: true, createdAt: true },
    });

    // Pagamentos recentes
    const recentPayments = await prisma.payment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { booking: { select: { client: { select: { name: true, email: true } } } } },
    });

    return {
      success: true,
      data: {
        metrics: {
          revenue: { value: curRev, change: calcChange(curRev, prevRev) },
          bookings: { value: currentBookings, change: calcChange(currentBookings, previousBookings) },
          leads: { value: currentLeads, change: calcChange(currentLeads, previousLeads) },
          conversion: { value: currentConversion, change: currentConversion - previousConversion },
          ticket: { value: currentTicket, change: calcChange(currentTicket, previousTicket) },
        },
        totals: { users: totalUsers, experiences: totalExperiences, journeys: totalJourneys, partners: totalPartners },
        recentLeads,
        recentPayments,
      },
    };
  } catch (error) {
    console.error('getAdminStats error:', error);
    return { success: false, error: 'Erro ao carregar estatísticas.' };
  }
}
