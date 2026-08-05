'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ─── PARCEIROS ───────────────────────────────────────────────
export async function getPartners({ category, status }: { category?: string; status?: string } = {}) {
  try {
    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (status) where.status = status;
    const data = await prisma.partner.findMany({ where, orderBy: { createdAt: 'desc' } });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Erro ao buscar parceiros.' };
  }
}

export async function createPartner(data: {
  name: string;
  category?: string;
  contactEmail?: string;
  phone?: string;
  website?: string;
  description?: string;
  logoUrl?: string;
}) {
  try {
    const partner = await prisma.partner.create({
      data: { name: data.name, category: data.category, contactEmail: data.contactEmail, phone: data.phone, website: data.website, description: data.description, logoUrl: data.logoUrl, status: 'active' },
    });
    revalidatePath('/dashboard/admin');
    return { success: true, data: partner };
  } catch (error) {
    return { success: false, error: 'Erro ao criar parceiro.' };
  }
}

export async function updatePartner(id: string, data: Partial<{ name: string; category: string; contactEmail: string; phone: string; website: string; description: string; status: string }>) {
  try {
    const partner = await prisma.partner.update({ where: { id }, data });
    revalidatePath('/dashboard/admin');
    return { success: true, data: partner };
  } catch (error) {
    return { success: false, error: 'Erro ao atualizar parceiro.' };
  }
}

export async function deletePartner(id: string) {
  try {
    await prisma.partner.delete({ where: { id } });
    revalidatePath('/dashboard/admin');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Erro ao excluir parceiro.' };
  }
}

// ─── INTERCÂMBIO ─────────────────────────────────────────────
export async function getExchangeInstitutions() {
  try {
    const data = await prisma.exchangeInstitution.findMany({
      include: { campuses: { include: { programs: true } } },
    });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Erro ao buscar instituições.' };
  }
}

export async function createExchangeCampus(data: {
  institutionId: string;
  name: string;
  city: string;
  location?: string;
  description?: string;
  mainImage?: string;
}) {
  try {
    const campus = await prisma.exchangeCampus.create({
      data: { institutionId: data.institutionId, name: data.name, city: data.city, location: data.location, description: data.description, mainImage: data.mainImage },
    });
    revalidatePath('/dashboard/admin');
    return { success: true, data: campus };
  } catch (error) {
    return { success: false, error: 'Erro ao criar campus.' };
  }
}

// ─── RESERVAS ────────────────────────────────────────────────
export async function getBookings({
  page = 1,
  pageSize = 20,
  status,
  clientId,
}: {
  page?: number;
  pageSize?: number;
  status?: string;
  clientId?: string;
} = {}) {
  try {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip: (page - 1) * pageSize,
        include: {
          client: { select: { name: true, email: true, phone: true } },
          package: { select: { title: true, destination: true } },
          proposal: { select: { title: true, totalValue: true } },
          payments: { orderBy: { dueDate: 'asc' } },
          timeline: { orderBy: { eventDate: 'asc' } },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    return { success: true, data: bookings, total, pages: Math.ceil(total / pageSize) };
  } catch (error) {
    console.error('getBookings error:', error);
    return { success: false, error: 'Erro ao buscar reservas.' };
  }
}

export async function updateBookingStatus(id: string, status: string) {
  try {
    const booking = await prisma.booking.update({ where: { id }, data: { status } });
    revalidatePath('/dashboard/admin');
    return { success: true, data: booking };
  } catch (error) {
    return { success: false, error: 'Erro ao atualizar status da reserva.' };
  }
}

export async function updatePaymentStatus(id: string, status: string) {
  try {
    const updateData: Record<string, unknown> = { status };
    if (status === 'paid') updateData.paidAt = new Date();
    const payment = await prisma.payment.update({ where: { id }, data: updateData });
    revalidatePath('/dashboard/admin');
    return { success: true, data: payment };
  } catch (error) {
    return { success: false, error: 'Erro ao atualizar pagamento.' };
  }
}

// ─── PROPOSTAS ───────────────────────────────────────────────
export async function getProposals({
  page = 1,
  pageSize = 20,
  status,
}: {
  page?: number;
  pageSize?: number;
  status?: string;
} = {}) {
  try {
    const where = status ? { status } : {};
    const [proposals, total] = await Promise.all([
      prisma.proposal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip: (page - 1) * pageSize,
        include: {
          consultant: { select: { name: true } },
          items: true,
        },
      }),
      prisma.proposal.count({ where }),
    ]);
    return { success: true, data: proposals, total, pages: Math.ceil(total / pageSize) };
  } catch (error) {
    return { success: false, error: 'Erro ao buscar propostas.' };
  }
}

export async function createProposal(data: {
  title: string;
  consultantId: string;
  customerId: string;
  leadId?: string;
  totalValue: number;
  items: Array<{ name: string; type: string; price: number; details?: string }>;
}) {
  try {
    const uniqueLink = data.title.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      + '-' + Date.now();

    const proposal = await prisma.proposal.create({
      data: {
        title: data.title,
        consultantId: data.consultantId,
        customerId: data.customerId,
        leadId: data.leadId,
        totalValue: data.totalValue,
        uniqueLink,
        status: 'draft',
        items: { create: data.items.map(i => ({ name: i.name, type: i.type, price: i.price, details: i.details })) },
      },
      include: { items: true },
    });
    revalidatePath('/dashboard/admin');
    return { success: true, data: proposal };
  } catch (error) {
    return { success: false, error: 'Erro ao criar proposta.' };
  }
}

export async function updateProposalStatus(id: string, status: string) {
  try {
    const proposal = await prisma.proposal.update({ where: { id }, data: { status } });
    revalidatePath('/dashboard/admin');
    return { success: true, data: proposal };
  } catch (error) {
    return { success: false, error: 'Erro ao atualizar proposta.' };
  }
}
