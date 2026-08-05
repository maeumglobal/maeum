'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ─── JORNADAS ───────────────────────────────────────────────
export async function getJourneys({
  page = 1,
  pageSize = 20,
  search = '',
  status,
  category,
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  category?: string;
} = {}) {
  try {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { subtitle: { contains: search } },
      ];
    }

    const [journeys, total] = await Promise.all([
      prisma.journey.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip: (page - 1) * pageSize,
        include: { departures: { orderBy: { startDate: 'asc' } } },
      }),
      prisma.journey.count({ where }),
    ]);

    return { success: true, data: journeys, total, pages: Math.ceil(total / pageSize) };
  } catch (error) {
    console.error('getJourneys error:', error);
    return { success: false, error: 'Erro ao buscar jornadas.' };
  }
}

export async function createJourney(data: {
  slug: string;
  title: string;
  subtitle?: string;
  concept?: string;
  durationDays?: number;
  pricePerPerson: number;
  totalSpots?: number;
  mainImage?: string;
  included?: string[];
  notIncluded?: string[];
  status?: string;
  category?: string;
}) {
  try {
    const journey = await prisma.journey.create({
      data: {
        slug: data.slug,
        title: data.title,
        subtitle: data.subtitle,
        concept: data.concept,
        destinations: JSON.stringify(['Seul']),
        durationDays: data.durationDays || 10,
        totalSpots: data.totalSpots || 15,
        pricePerPerson: data.pricePerPerson,
        priceCurrency: 'BRL',
        mainImage: data.mainImage,
        gallery: JSON.stringify([]),
        included: JSON.stringify(data.included || []),
        notIncluded: JSON.stringify(data.notIncluded || []),
        itinerary: JSON.stringify([]),
        highlights: JSON.stringify([]),
        paymentOptions: JSON.stringify({ pix: true, boleto_parcelas: 48, credit_card_parcelas: 24 }),
        status: data.status || 'active',
        category: data.category || 'premium',
      },
    });
    revalidatePath('/dashboard/admin');
    return { success: true, data: journey };
  } catch (error) {
    console.error('createJourney error:', error);
    return { success: false, error: 'Erro ao criar jornada.' };
  }
}

export async function updateJourney(id: string, data: Partial<{
  title: string;
  subtitle: string;
  durationDays: number;
  pricePerPerson: number;
  totalSpots: number;
  mainImage: string;
  status: string;
  category: string;
  included: string[];
  notIncluded: string[];
}>) {
  try {
    const updateData: Record<string, unknown> = { ...data };
    if (data.included) updateData.included = JSON.stringify(data.included);
    if (data.notIncluded) updateData.notIncluded = JSON.stringify(data.notIncluded);

    const journey = await prisma.journey.update({ where: { id }, data: updateData });
    revalidatePath('/dashboard/admin');
    return { success: true, data: journey };
  } catch (error) {
    console.error('updateJourney error:', error);
    return { success: false, error: 'Erro ao atualizar jornada.' };
  }
}

export async function deleteJourney(id: string) {
  try {
    await prisma.journey.delete({ where: { id } });
    revalidatePath('/dashboard/admin');
    return { success: true };
  } catch (error) {
    console.error('deleteJourney error:', error);
    return { success: false, error: 'Erro ao excluir jornada.' };
  }
}

// ─── DEPARTURES ─────────────────────────────────────────────
export async function createJourneyDeparture(data: {
  journeyId: string;
  startDate: string;
  endDate: string;
  totalSpots?: number;
  availableSpots?: number;
  notes?: string;
}) {
  try {
    const departure = await prisma.journeyDeparture.create({
      data: {
        journeyId: data.journeyId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        totalSpots: data.totalSpots || 15,
        availableSpots: data.availableSpots || data.totalSpots || 15,
        status: 'available',
        notes: data.notes,
      },
    });
    revalidatePath('/dashboard/admin');
    return { success: true, data: departure };
  } catch (error) {
    console.error('createJourneyDeparture error:', error);
    return { success: false, error: 'Erro ao criar data de saída.' };
  }
}

export async function updateJourneyDeparture(id: string, data: { status?: string; availableSpots?: number; notes?: string }) {
  try {
    const departure = await prisma.journeyDeparture.update({ where: { id }, data });
    revalidatePath('/dashboard/admin');
    return { success: true, data: departure };
  } catch (error) {
    return { success: false, error: 'Erro ao atualizar data de saída.' };
  }
}

export async function deleteJourneyDeparture(id: string) {
  try {
    await prisma.journeyDeparture.delete({ where: { id } });
    revalidatePath('/dashboard/admin');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Erro ao excluir data de saída.' };
  }
}
