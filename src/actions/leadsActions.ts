'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getLeads({
  page = 1,
  pageSize = 20,
  search = '',
  status,
  consultantId,
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  consultantId?: string;
} = {}) {
  try {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (consultantId) where.consultantId = consultantId;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip: (page - 1) * pageSize,
        include: { consultant: { select: { name: true } } },
      }),
      prisma.lead.count({ where }),
    ]);

    return { success: true, data: leads, total, pages: Math.ceil(total / pageSize) };
  } catch (error) {
    console.error('getLeads error:', error);
    return { success: false, error: 'Erro ao buscar leads.' };
  }
}

export async function updateLeadStatusAction(id: string, status: string) {
  try {
    const lead = await prisma.lead.update({ where: { id }, data: { status } });
    revalidatePath('/dashboard/admin');
    return { success: true, data: lead };
  } catch (error) {
    return { success: false, error: 'Erro ao atualizar status do lead.' };
  }
}

export async function updateLeadConsultantAction(id: string, consultantId: string | null) {
  try {
    const lead = await prisma.lead.update({ where: { id }, data: { consultantId } });
    revalidatePath('/dashboard/admin');
    return { success: true, data: lead };
  } catch (error) {
    return { success: false, error: 'Erro ao atribuir lead.' };
  }
}

export async function deleteLeadAction(id: string) {
  try {
    await prisma.lead.delete({ where: { id } });
    revalidatePath('/dashboard/admin');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Erro ao excluir lead.' };
  }
}
