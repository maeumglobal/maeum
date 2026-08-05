'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ─── CAPTURA DE LEAD PELO FORMULÁRIO DO SITE ────────────────
export async function submitLeadAction(data: {
  name: string;
  phone: string;
  email: string;
  interest: string;
  origin: string;
}) {
  try {
    // Find default consultant to auto-assign
    const consultant = await prisma.user.findFirst({ where: { role: 'consultora', isActive: true } });

    const newLead = await prisma.lead.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        destination: data.interest,
        origin: data.origin,
        status: 'novo',
        consultantId: consultant?.id ?? null,
        notes: 'Lead captado dinamicamente via formulário da landing page.',
      },
    });

    // Notify consultant
    if (consultant) {
      await prisma.notification.create({
        data: {
          userId: consultant.id,
          title: 'Novo Lead Captado!',
          message: `${data.name} demonstrou interesse em ${data.interest}. Contato: ${data.phone}`,
          type: 'info',
          category: 'lead',
          priority: 'high',
          linkUrl: '/dashboard/admin',
        },
      });
    }

    revalidatePath('/dashboard/admin');
    return { success: true, lead: newLead };
  } catch (error: unknown) {
    console.error('Error submitting lead:', error);
    return { success: false, error: String(error) };
  }
}

// ─── PROPOSTA ────────────────────────────────────────────────
export async function updateProposalStatusAction(
  proposalId: string,
  status: 'approved' | 'changes_requested',
  notes?: string
) {
  try {
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
    });

    if (!proposal) return { success: false, error: 'Proposta não encontrada.' };

    const updatedProposal = await prisma.proposal.update({
      where: { id: proposalId },
      data: {
        status: status === 'approved' ? 'approved' : 'draft',
        notes: notes,
        version: { increment: 1 },
      },
    });

    // Update associated lead
    if (proposal.leadId) {
      await prisma.lead.update({
        where: { id: proposal.leadId },
        data: { status: status === 'approved' ? 'fechado' : 'atendimento' },
      });
    }

    // Notify the consultant
    if (proposal.consultantId) {
      await prisma.notification.create({
        data: {
          userId: proposal.consultantId,
          title: status === 'approved' ? 'Proposta Aprovada!' : 'Revisão Solicitada',
          message:
            status === 'approved'
              ? `Cliente aprovou: ${proposal.title}`
              : `Cliente solicitou revisão: ${notes?.substring(0, 100) || ''}`,
          type: status === 'approved' ? 'success' : 'warning',
          category: 'booking',
          priority: 'high',
          linkUrl: '/dashboard/admin',
        },
      });
    }

    revalidatePath('/dashboard/admin');
    revalidatePath('/dashboard/cliente');
    return { success: true, proposal: updatedProposal };
  } catch (error: unknown) {
    console.error('Error updating proposal:', error);
    return { success: false, error: String(error) };
  }
}

// ─── MENSAGEM DE CHAT ────────────────────────────────────────
export async function submitChatMessageAction(chatId: string, senderId: string, content: string) {
  try {
    const message = await prisma.chatMessage.create({
      data: { chatId, senderId, content },
    });
    revalidatePath('/dashboard/cliente');
    return { success: true, message };
  } catch (error: unknown) {
    return { success: false, error: String(error) };
  }
}

// ─── UPLOAD DE DOCUMENTO ────────────────────────────────────
export async function uploadDocumentAction(
  clientId: string,
  data: { file_name: string; file_url: string; file_size: number; category: string }
) {
  try {
    const doc = await prisma.document.create({
      data: {
        clientId,
        uploadedById: clientId,
        fileName: data.file_name,
        fileUrl: data.file_url,
        fileSize: data.file_size,
        category: data.category,
      },
    });
    revalidatePath('/dashboard/cliente');
    return { success: true, document: doc };
  } catch (error: unknown) {
    return { success: false, error: String(error) };
  }
}

// ─── CRIAR PROPOSTA ──────────────────────────────────────────
export async function createProposalAction(
  clientId: string,
  consultantId: string,
  title: string,
  items: Array<{ name: string; type: string; price: number; details?: string }>,
  totalAmount: number
) {
  try {
    const uniqueLink =
      title.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') +
      '-' +
      Math.floor(Math.random() * 9999);

    const proposal = await prisma.proposal.create({
      data: {
        title,
        consultantId,
        customerId: clientId,
        totalValue: totalAmount,
        uniqueLink,
        status: 'draft',
        version: 1,
        items: {
          create: items.map(i => ({ name: i.name, type: i.type, price: i.price, details: i.details })),
        },
      },
      include: { items: true },
    });

    revalidatePath('/dashboard/admin');
    return { success: true, proposal };
  } catch (error: unknown) {
    return { success: false, error: String(error) };
  }
}
