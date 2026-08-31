'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export type TripPlanInput = {
  name: string;
  email: string;
  phone?: string;
  tripType: 'ida_volta' | 'so_ida';
  departDate: string;
  returnDate?: string;
  travelers: number;
  budgetPerPerson?: string;
  interests?: string;
  message?: string;
  notes?: string;
};

function maskName(name: string): string {
  return (name || '').trim() || 'Visitante';
}

export async function submitTripPlanAction(data: TripPlanInput) {
  try {
    if (!data.name || !data.email || !data.departDate || !data.travelers) {
      return { success: false, error: 'Preencha nome, e-mail, data de ida e número de viajantes.' };
    }

    // 1. Seleciona a consultora ativa (round-robin leve: a que tiver menos leads do mês)
    const consultants = await prisma.user.findMany({
      where: { role: 'consultora', isActive: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    let assignedConsultantId: string | null = null;
    if (consultants.length > 0) {
      const counts = await Promise.all(
        consultants.map(c =>
          prisma.lead.count({
            where: { consultantId: c.id, createdAt: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) } },
          })
        )
      );
      const minCount = Math.min(...counts);
      const idx = counts.indexOf(minCount);
      assignedConsultantId = consultants[idx].id;
    }

    // 2. Monta notas estruturadas para o lead
    const notesDetails: string[] = [];
    notesDetails.push(`Trecho: ${data.tripType === 'ida_volta' ? 'Ida e volta' : 'Somente ida'}`);
    notesDetails.push(`Ida: ${data.departDate}`);
    if (data.tripType === 'ida_volta' && data.returnDate) notesDetails.push(`Volta: ${data.returnDate}`);
    notesDetails.push(`Viajantes: ${data.travelers}`);
    if (data.budgetPerPerson) notesDetails.push(`Orçamento por pessoa: ${data.budgetPerPerson}`);
if (data.interests) notesDetails.push(`Interesse: ${data.interests}`);
  if (data.message) notesDetails.push(`Observações: ${data.message}`);

    const lead = await prisma.lead.create({
      data: {
        name: maskName(data.name),
        email: data.email.trim(),
        phone: data.phone?.trim() || null,
        destination: 'Coreia do Sul',
        budget: data.budgetPerPerson ? parseMaybeNumber(data.budgetPerPerson) : null,
        origin: 'planejamento_site',
        status: 'novo',
        consultantId: assignedConsultantId,
        notes: notesDetails.join('\n'),
      },
    });

    // 3. Notifica super_admin e consultoras
    const notifyUsers = await prisma.user.findMany({
      where: { isActive: true, role: { in: ['super_admin', 'admin', 'consultora'] } },
      select: { id: true },
    });

    if (notifyUsers.length > 0) {
      await Promise.all(
        notifyUsers.map(u =>
          prisma.notification.create({
            data: {
              userId: u.id,
              title: 'Nova solicitação de planejamento',
              message: `${maskName(data.name)} quer planejar uma viagem (${data.tripType === 'ida_volta' ? 'ida e volta' : 'só ida'}) — partida em ${data.departDate}.`,
              type: 'info',
              priority: 'high',
              category: 'lead',
              linkUrl: '/dashboard/admin?tab=leads',
            },
          })
        )
      );
    }

    revalidatePath('/dashboard/admin');
    revalidatePath('/dashboard/consultora');

    return { success: true, data: { leadId: lead.id } };
  } catch (error: any) {
    console.error('submitTripPlanAction error:', error);
    return { success: false, error: 'Não foi possível enviar seu planejamento. Tente novamente.' };
  }
}

function parseMaybeNumber(value: string): number | null {
  const cleaned = value.replace(/[^0-9.,]/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}