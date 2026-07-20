'use server';

import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, subMonths, subDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export async function getDashboardData() {
  try {
    const today = new Date();
    const currentMonthStart = startOfMonth(today);
    const previousMonthStart = startOfMonth(subMonths(today, 1));
    const previousMonthEnd = endOfMonth(subMonths(today, 1));

    // 1. Faturamento Total
    // TODO: Sum of all successful payments (completed bookings or paid stripe sessions)
    const currentRevenueResult = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'paid', createdAt: { gte: currentMonthStart } }
    });
    const previousRevenueResult = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'paid', createdAt: { gte: previousMonthStart, lte: previousMonthEnd } }
    });

    const currentRevenue = currentRevenueResult._sum.amount || 0;
    const previousRevenue = previousRevenueResult._sum.amount || 0;
    
    // Calculate percentage changes safely
    const calcChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const revenueChange = calcChange(currentRevenue, previousRevenue);

    // 2. Reservas Confirmadas
    const currentBookings = await prisma.booking.count({
      where: { status: 'confirmed', createdAt: { gte: currentMonthStart } }
    });
    const previousBookings = await prisma.booking.count({
      where: { status: 'confirmed', createdAt: { gte: previousMonthStart, lte: previousMonthEnd } }
    });
    const bookingsChange = calcChange(currentBookings, previousBookings);

    // 3. Novas Consultas (Leads)
    const currentLeads = await prisma.lead.count({
      where: { createdAt: { gte: currentMonthStart } }
    });
    const previousLeads = await prisma.lead.count({
      where: { createdAt: { gte: previousMonthStart, lte: previousMonthEnd } }
    });
    const leadsChange = calcChange(currentLeads, previousLeads);

    // 4. Ticket Médio
    const currentTicket = currentBookings > 0 ? currentRevenue / currentBookings : 0;
    const previousTicket = previousBookings > 0 ? previousRevenue / previousBookings : 0;
    const ticketChange = calcChange(currentTicket, previousTicket);

    // 5. Taxa de Conversão (Bookings / Leads)
    const currentConversion = currentLeads > 0 ? (currentBookings / currentLeads) * 100 : 0;
    const previousConversion = previousLeads > 0 ? (previousBookings / previousLeads) * 100 : 0;
    const conversionChange = currentConversion - previousConversion; // Absolute percentage points

    // 6. Consultas Recentes
    const recentConsultations = await prisma.lead.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        budget: true,
        destination: true,
        createdAt: true,
      }
    });

    // 7. Pagamentos Recentes
    const recentPayments = await prisma.payment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        booking: {
          select: {
            packageId: true,
          }
        }
      }
    });

    // Return the aggregated data
    return {
      success: true,
      data: {
        metrics: {
          revenue: { value: currentRevenue, change: revenueChange },
          bookings: { value: currentBookings, change: bookingsChange },
          leads: { value: currentLeads, change: leadsChange },
          conversion: { value: currentConversion, change: conversionChange },
          ticket: { value: currentTicket, change: ticketChange },
        },
        recentConsultations,
        recentPayments
      }
    };
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    return { success: false, error: 'Erro ao carregar dados do dashboard.' };
  }
}
