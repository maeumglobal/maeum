'use server';

/**
 * Formulários públicos (planejamento de viagem, intercâmbio, reserva de
 * experiência/jornada, newsletter).
 *
 * São PÚBLICAS por design. Antes disso significava "sem proteção nenhuma":
 * qualquer POST criava Lead + Notificação para toda a equipe. Agora cada action:
 *  - valida com `zod` (limites de tamanho, formatos, e-mail real);
 *  - tem rate limit de 5 requisições / 10 min por IP (`src/lib/rateLimit.ts`);
 *  - tem campo honeypot `website` que precisa continuar vazio;
 *  - não devolve `String(error)` — o vazamento de erro do Prisma era público.
 */
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { notifyUsers, getStaffIds } from '@/lib/notify';
import { isValidEmail, normalizeEmail, phoneDigits } from '@/lib/validate';
import { pick, fail, zodMessage, type ActionInput, type ActionResult } from '@/lib/actionKit';
import { allowFormAction, RATE_LIMIT_MESSAGE } from '@/lib/rateLimit';

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
  website?: string;
};

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

const tripPlanSchema = z
  .object({
    name: z.string().trim().min(2, 'Informe seu nome.').max(120, 'Nome muito longo.'),
    email: z.string().trim().min(3, 'Informe seu e-mail.').max(180, 'E-mail muito longo.'),
    phone: z.string().trim().max(40, 'Telefone inválido.').optional(),
    tripType: z.enum(['ida_volta', 'so_ida'], { message: 'Selecione o tipo de viagem.' }),
    departDate: z.string().trim().regex(isoDate, 'Informe a data de ida.'),
    returnDate: z.string().trim().regex(isoDate, 'Informe a data de volta.').optional(),
    travelers: z.coerce.number().int().min(1, 'Mínimo de 1 viajante.').max(40, 'Máximo de 40 viajantes.'),
    budgetPerPerson: z.string().trim().max(40).optional(),
    interests: z.string().trim().max(400).optional(),
    message: z.string().trim().max(2000).optional(),
    website: z.string().max(0, 'Requisição bloqueada.').optional(),
  })
  .refine((data) => data.tripType !== 'ida_volta' || !!data.returnDate, {
    message: 'Informe a data de volta.',
    path: ['returnDate'],
  })
  .refine((data) => !data.returnDate || data.returnDate >= data.departDate, {
    message: 'A data de volta deve ser posterior à de ida.',
    path: ['returnDate'],
  });

const exchangeSchema = z.object({
  nome: z.string().trim().min(2, 'Informe seu nome.').max(120, 'Nome muito longo.'),
  email: z.string().trim().min(3, 'Informe seu e-mail.').max(180, 'E-mail muito longo.'),
  phone: z.string().trim().min(6, 'Informe seu WhatsApp.').max(40, 'Telefone inválido.'),
  pais: z.string().trim().max(80).optional(),
  idioma: z.string().trim().max(60).optional(),
  idade: z.string().trim().max(10).optional(),
  campusName: z.string().trim().max(140).optional(),
  cursoName: z.string().trim().max(140).optional(),
  nivel: z.string().trim().max(80).optional(),
  semanas: z.string().trim().max(20).optional(),
  periodo: z.string().trim().max(80).optional(),
  hospedagem: z.coerce.boolean().optional(),
  seguro: z.coerce.boolean().optional(),
  transfer: z.coerce.boolean().optional(),
  observacoes: z.string().trim().max(2000).optional(),
  website: z.string().max(0, 'Requisição bloqueada.').optional(),
});

const bookingSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome.').max(120, 'Nome muito longo.'),
  email: z.string().trim().min(3, 'Informe seu e-mail.').max(180, 'E-mail muito longo.'),
  phone: z.string().trim().min(6, 'Informe seu WhatsApp.').max(40, 'Telefone inválido.'),
  type: z.enum(['experiencia', 'jornada'], { message: 'Selecione o tipo de reserva.' }),
  itemTitle: z.string().trim().min(2, 'Selecione o item.').max(200),
  itemSlug: z.string().trim().max(200).optional(),
  date: z.string().trim().regex(isoDate, 'Data inválida.').optional(),
  participants: z.coerce.number().int().min(1).max(40).optional(),
  totalPrice: z.coerce.number().min(0).max(10_000_000).optional(),
  categoryName: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(2000).optional(),
  website: z.string().max(0, 'Requisição bloqueada.').optional(),
});

function revalidatePublicLeads() {
  revalidatePath('/dashboard/admin');
  revalidatePath('/dashboard/consultora');
}

// ─── PLANEJAMENTO DE VIAGEM ─────────────────────────────────

export async function submitTripPlanAction(input: ActionInput): Promise<ActionResult<{ leadId: string }>> {
  try {
    if (!(await allowFormAction('trip-plan'))) {
      return { success: false, error: RATE_LIMIT_MESSAGE };
    }

    const f = pick(input);
    const parsed = tripPlanSchema.safeParse({
      name: f.name,
      email: f.email,
      phone: f.phone ?? undefined,
      tripType: f.tripType,
      departDate: f.departDate,
      returnDate: f.returnDate || undefined,
      travelers: f.travelers,
      budgetPerPerson: f.budgetPerPerson ?? undefined,
      interests: f.interests ?? undefined,
      message: f.message ?? undefined,
      website: f.website ?? undefined,
    });
    if (!parsed.success) return { success: false, error: zodMessage(parsed.error) };

    const data = parsed.data;
    if (!isValidEmail(data.email)) return { success: false, error: 'E-mail inválido.' };

    const consultantId = await pickConsultant();

    const notes = [
      `Trecho: ${data.tripType === 'ida_volta' ? 'Ida e volta' : 'Somente ida'}`,
      `Ida: ${data.departDate}`,
      ...(data.tripType === 'ida_volta' && data.returnDate ? [`Volta: ${data.returnDate}`] : []),
      `Viajantes: ${data.travelers}`,
      ...(data.budgetPerPerson ? [`Orçamento por pessoa: ${data.budgetPerPerson}`] : []),
      ...(data.interests ? [`Interesse: ${data.interests}`] : []),
      ...(data.message ? [`Observações: ${data.message}`] : []),
    ].join('\n');

    const lead = await prisma.lead.create({
      data: {
        name: data.name,
        email: normalizeEmail(data.email),
        phone: data.phone ? phoneDigits(data.phone) : null,
        destination: 'Coreia do Sul',
        budget: data.budgetPerPerson ? parseMaybeNumber(data.budgetPerPerson) : null,
        origin: 'planejamento_site',
        status: 'novo',
        consultantId,
        notes,
      },
      select: { id: true },
    });

    await notifyUsers(consultantId ? [consultantId] : await getStaffIds(), {
      title: 'Nova solicitação de planejamento',
      message: `${data.name} quer planejar uma viagem (${data.tripType === 'ida_volta' ? 'ida e volta' : 'só ida'}) — partida em ${data.departDate}.`,
      type: 'info',
      priority: 'high',
      category: 'lead',
      linkUrl: '/dashboard/admin?tab=leads',
    });

    revalidatePublicLeads();
    return { success: true, data: { leadId: lead.id } };
  } catch (error) {
    return fail(error, 'Não foi possível enviar seu planejamento. Tente novamente.');
  }
}

// ─── INTERCÂMBIO ────────────────────────────────────────────

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
  website?: string;
};

export async function submitExchangeInquiryAction(
  input: ActionInput,
): Promise<ActionResult<{ leadId: string }>> {
  try {
    if (!(await allowFormAction('intercambio'))) {
      return { success: false, error: RATE_LIMIT_MESSAGE };
    }

    const f = pick(input);
    const parsed = exchangeSchema.safeParse({
      nome: f.nome,
      email: f.email,
      phone: f.phone,
      pais: f.pais ?? undefined,
      idioma: f.idioma ?? undefined,
      idade: f.idade ?? undefined,
      campusName: f.campusName ?? undefined,
      cursoName: f.cursoName ?? undefined,
      nivel: f.nivel ?? undefined,
      semanas: f.semanas ?? undefined,
      periodo: f.periodo ?? undefined,
      hospedagem: f.hospedagem ?? false,
      seguro: f.seguro ?? false,
      transfer: f.transfer ?? false,
      observacoes: f.observacoes ?? undefined,
      website: f.website ?? undefined,
    });
    if (!parsed.success) return { success: false, error: zodMessage(parsed.error) };

    const data = parsed.data;
    if (!isValidEmail(data.email)) return { success: false, error: 'E-mail inválido.' };

    const consultantId = await pickConsultant();

    const notes = [
      'Tipo: Solicitação de Intercâmbio (Lexis Korea)',
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
      ]
        .filter(Boolean)
        .join(', ') || 'Nenhum'}`,
      ...(data.observacoes ? [`Observações: ${data.observacoes}`] : []),
    ].join('\n');

    const lead = await prisma.lead.create({
      data: {
        name: data.nome,
        email: normalizeEmail(data.email),
        phone: phoneDigits(data.phone),
        destination: 'Coreia do Sul - Intercâmbio',
        origin: 'intercambio_lexis',
        status: 'novo',
        consultantId,
        notes,
      },
      select: { id: true },
    });

    await notifyUsers(consultantId ? [consultantId] : await getStaffIds(), {
      title: 'Nova solicitação de intercâmbio',
      message: `${data.nome} solicitou informações sobre intercâmbio na Lexis Korea (${data.campusName || 'Coreia'}).`,
      type: 'info',
      priority: 'high',
      category: 'lead',
      linkUrl: '/dashboard/admin?tab=leads',
    });

    revalidatePublicLeads();
    return { success: true, data: { leadId: lead.id } };
  } catch (error) {
    return fail(error, 'Erro ao enviar solicitação de intercâmbio. Tente novamente.');
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
  website?: string;
};

export async function submitBookingInquiryAction(
  input: ActionInput,
): Promise<ActionResult<{ leadId: string }>> {
  try {
    if (!(await allowFormAction('booking-inquiry'))) {
      return { success: false, error: RATE_LIMIT_MESSAGE };
    }

    const f = pick(input);
    const parsed = bookingSchema.safeParse({
      name: f.name,
      email: f.email,
      phone: f.phone,
      type: f.type,
      itemTitle: f.itemTitle,
      itemSlug: f.itemSlug ?? undefined,
      date: f.date || undefined,
      participants: f.participants ?? undefined,
      totalPrice: f.totalPrice ?? undefined,
      categoryName: f.categoryName ?? undefined,
      notes: f.notes ?? undefined,
      website: f.website ?? undefined,
    });
    if (!parsed.success) return { success: false, error: zodMessage(parsed.error) };

    const data = parsed.data;
    if (!isValidEmail(data.email)) return { success: false, error: 'E-mail inválido.' };

    const consultantId = await pickConsultant();

    const notes = [
      `Interesse: ${data.type === 'experiencia' ? 'Experiência' : 'Jornada em Grupo'} - ${data.itemTitle}`,
      ...(data.itemSlug ? [`Slug: ${data.itemSlug}`] : []),
      `Data Pretendida: ${data.date || 'A combinar'}`,
      `Participantes: ${data.participants || 1}`,
      ...(data.categoryName ? [`Categoria: ${data.categoryName}`] : []),
      ...(data.totalPrice ? [`Valor Estimado: R$ ${data.totalPrice.toLocaleString('pt-BR')}`] : []),
      ...(data.notes ? [`Observações do Cliente: ${data.notes}`] : []),
    ].join('\n');

    const lead = await prisma.lead.create({
      data: {
        name: data.name,
        email: normalizeEmail(data.email),
        phone: phoneDigits(data.phone),
        destination: data.itemTitle.slice(0, 160),
        budget: data.totalPrice ?? null,
        origin: data.type === 'experiencia' ? 'reserva_experiencia' : 'reserva_jornada',
        status: 'novo',
        consultantId,
        notes,
      },
      select: { id: true },
    });

    await notifyUsers(consultantId ? [consultantId] : await getStaffIds(), {
      title: `Nova reserva: ${data.itemTitle}`,
      message: `${data.name} solicitou reserva para ${data.itemTitle} (${data.participants || 1} pessoas).`,
      type: 'info',
      priority: 'high',
      category: 'lead',
      linkUrl: '/dashboard/admin?tab=leads',
    });

    revalidatePublicLeads();
    return { success: true, data: { leadId: lead.id } };
  } catch (error) {
    return fail(error, 'Erro ao enviar solicitação de reserva. Tente novamente.');
  }
}

// ─── NEWSLETTER ─────────────────────────────────────────────

export async function submitNewsletterAction(
  input: ActionInput | string,
): Promise<ActionResult<{ leadId: string }> & { message?: string }> {
  try {
    if (!(await allowFormAction('newsletter'))) {
      return { success: false, error: RATE_LIMIT_MESSAGE };
    }

    const f = pick(typeof input === 'string' ? { email: input } : input);
    const email = normalizeEmail(String(f.email ?? '')).slice(0, 180);
    if (!isValidEmail(email)) return { success: false, error: 'Por favor, insira um e-mail válido.' };

    const existing = await prisma.lead.findFirst({
      where: { email, origin: 'newsletter' },
      select: { id: true },
    });
    if (existing) {
      return {
        success: true,
        data: { leadId: existing.id },
        message: 'Você já está cadastrado em nossa newsletter!',
      };
    }

    const lead = await prisma.lead.create({
      data: {
        name: email.split('@')[0]!.slice(0, 120) || 'Newsletter',
        email,
        destination: 'Newsletter Maeum Global',
        origin: 'newsletter',
        status: 'novo',
        notes: 'Inscrição realizada via formulário de newsletter.',
      },
      select: { id: true },
    });

    revalidatePublicLeads();
    return {
      success: true,
      data: { leadId: lead.id },
      message: 'Inscrição realizada com sucesso! Bem-vindo(a) à Maeum Global.',
    };
  } catch (error) {
    return fail(error, 'Não foi possível cadastrar seu e-mail. Tente novamente.');
  }
}

// ─── INTERNOS ──────────────────────────────────────────────

function parseMaybeNumber(value: string): number | null {
  const cleaned = value.replace(/[^0-9.,]/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Consultora ativa com menos leads nos últimos 30 dias (round-robin leve). */
async function pickConsultant(): Promise<string | null> {
  const consultants = await prisma.user.findMany({
    where: { role: 'consultora', isActive: true },
    orderBy: { createdAt: 'asc' },
    take: 50,
    select: { id: true },
  });
  if (consultants.length === 0) return null;

  const counts = await Promise.all(
    consultants.map((c) =>
      prisma.lead.count({
        where: { consultantId: c.id, createdAt: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) } },
      }),
    ),
  );
  return consultants[counts.indexOf(Math.min(...counts))]?.id ?? null;
}