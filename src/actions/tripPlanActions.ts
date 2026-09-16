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

// ─── INTERCÂMBIO INQUIRY ACTION ─────────────────────────────
export type ExchangeInquiryInput = {
  nome: string;
  email: string;
  phone: string;
  pais?: string;
  idioma?: string;
  idade?: string;
  campusName?: string;
  cursoName?: string;
  nivel?: string;
  semanas?: string;
  periodo?: string;
  hospedagem?: boolean;
  seguro?: boolean;
  transfer?: boolean;
  observacoes?: string;
};

export async function submitExchangeInquiryAction(data: ExchangeInquiryInput) {
  try {
    if (!data.nome || !data.email || !data.phone) {
      return { success: false, error: 'Preencha pelo menos Nome, E-mail e WhatsApp.' };
    }

    const consultants = await prisma.user.findMany({
      where: { role: 'consultora', isActive: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    const assignedConsultantId = consultants.length > 0 ? consultants[0].id : null;

    const notesDetails: string[] = [
      `Tipo: Solicitação de Intercâmbio (Lexis Korea)`,
      `País de Residência: ${data.pais || 'Não informado'}`,
      `Idioma de Atendimento: ${data.idioma || 'Português'}`,
      `Idade: ${data.idade || 'Não informada'}`,
      `Campus: ${data.campusName || 'Não selecionado'}`,
      `Curso: ${data.cursoName || 'Não selecionado'}`,
      `Nível de Coreano: ${data.nivel || 'Iniciante'}`,
      `Duração: ${data.semanas ? `${data.semanas} semanas` : 'A definir'}`,
      `Período Pretendido: ${data.periodo || 'A definir'}`,
      `Serviços Adicionais: ${[
        data.hospedagem ? 'Hospedagem' : null,
        data.seguro ? 'Seguro Viagem' : null,
        data.transfer ? 'Transfer Aeroporto' : null,
      ].filter(Boolean).join(', ') || 'Nenhum'}`,
    ];
    if (data.observacoes) notesDetails.push(`Observações: ${data.observacoes}`);

    const lead = await prisma.lead.create({
      data: {
        name: data.nome.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
        destination: 'Coreia do Sul - Intercâmbio',
        origin: 'intercambio_lexis',
        status: 'novo',
        consultantId: assignedConsultantId,
        notes: notesDetails.join('\n'),
      },
    });

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
              title: 'Nova Solicitação de Intercâmbio',
              message: `${data.nome} solicitou informações sobre intercâmbio na Lexis Korea (${data.campusName || 'Coreia'}).`,
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
    console.error('submitExchangeInquiryAction error:', error);
    return { success: false, error: 'Erro ao enviar solicitação de intercâmbio. Tente novamente.' };
  }
}

// ─── RESERVA DE EXPERIÊNCIA OU JORNADA ──────────────────────
export type BookingInquiryInput = {
  name: string;
  email: string;
  phone: string;
  type: 'experiencia' | 'jornada';
  itemTitle: string;
  itemSlug: string;
  date?: string;
  participants?: number;
  totalPrice?: number;
  categoryName?: string;
  notes?: string;
};

export async function submitBookingInquiryAction(data: BookingInquiryInput) {
  try {
    if (!data.name || !data.email || !data.phone) {
      return { success: false, error: 'Preencha Nome, E-mail e WhatsApp para continuar.' };
    }

    const consultants = await prisma.user.findMany({
      where: { role: 'consultora', isActive: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    const assignedConsultantId = consultants.length > 0 ? consultants[0].id : null;

    const notesDetails: string[] = [
      `Interesse: ${data.type === 'experiencia' ? 'Experiência' : 'Jornada em Grupo'} - ${data.itemTitle}`,
      `Slug: ${data.itemSlug}`,
      `Data Pretendida: ${data.date || 'A combinar'}`,
      `Participantes: ${data.participants || 1}`,
      data.categoryName ? `Categoria: ${data.categoryName}` : null,
      data.totalPrice ? `Valor Estimado: R$ ${data.totalPrice.toLocaleString('pt-BR')}` : null,
      data.notes ? `Observações do Cliente: ${data.notes}` : null,
    ].filter(Boolean) as string[];

    const lead = await prisma.lead.create({
      data: {
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
        destination: data.itemTitle,
        budget: data.totalPrice || null,
        origin: data.type === 'experiencia' ? 'reserva_experiencia' : 'reserva_jornada',
        status: 'novo',
        consultantId: assignedConsultantId,
        notes: notesDetails.join('\n'),
      },
    });

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
              title: `Nova Reserva: ${data.itemTitle}`,
              message: `${data.name} solicitou reserva para ${data.itemTitle} (${data.participants || 1} pessoas).`,
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
    console.error('submitBookingInquiryAction error:', error);
    return { success: false, error: 'Erro ao enviar solicitação de reserva. Tente novamente.' };
  }
}

// ─── NEWSLETTER SUBSCRIPTION ────────────────────────────────
export async function submitNewsletterAction(email: string) {
  try {
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Por favor, insira um e-mail válido.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await prisma.lead.findFirst({
      where: { email: cleanEmail, origin: 'newsletter' },
    });

    if (existing) {
      return { success: true, message: 'Você já está cadastrado em nossa newsletter!' };
    }

    await prisma.lead.create({
      data: {
        name: cleanEmail.split('@')[0],
        email: cleanEmail,
        destination: 'Newsletter Maeum Global',
        origin: 'newsletter',
        status: 'novo',
        notes: 'Inscrição realizada via formulário de newsletter.',
      },
    });

    revalidatePath('/dashboard/admin');
    return { success: true, message: 'Inscrição realizada com sucesso! Bem-vindo(a) à Maeum Global.' };
  } catch (error: any) {
    console.error('submitNewsletterAction error:', error);
    return { success: false, error: 'Não foi possível cadastrar seu e-mail. Tente novamente.' };
  }
}