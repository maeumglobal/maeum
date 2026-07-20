'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getLeads() {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        consultant: { select: { name: true } },
      }
    });
    return { success: true, data: leads };
  } catch (error) {
    console.error('Error fetching leads:', error);
    return { success: false, error: 'Erro ao buscar leads.' };
  }
}

export async function createLead(data: {
  name: string;
  email?: string;
  phone?: string;
  destination?: string;
  budget?: number;
  notes?: string;
}) {
  try {
    const newLead = await prisma.lead.create({
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        destination: data.destination || null,
        budget: data.budget || null,
        notes: data.notes || null,
        status: 'novo', // default status
      }
    });
    revalidatePath('/dashboard/admin');
    return { success: true, data: newLead };
  } catch (error) {
    console.error('Error creating lead:', error);
    return { success: false, error: 'Erro ao criar lead.' };
  }
}

export async function updateLeadStatus(id: string, status: string) {
  try {
    const updated = await prisma.lead.update({
      where: { id },
      data: { status }
    });
    revalidatePath('/dashboard/admin');
    return { success: true, data: updated };
  } catch (error) {
    console.error('Error updating lead status:', error);
    return { success: false, error: 'Erro ao atualizar status do lead.' };
  }
}

export async function deleteLead(id: string) {
  try {
    await prisma.lead.delete({
      where: { id }
    });
    revalidatePath('/dashboard/admin');
    return { success: true };
  } catch (error) {
    console.error('Error deleting lead:', error);
    return { success: false, error: 'Erro ao excluir lead.' };
  }
}
