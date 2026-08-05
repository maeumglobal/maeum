'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ─── DADOS DO CLIENTE ────────────────────────────────────────
export async function getClientData(userId: string) {
  try {
    const [booking, proposal, chat] = await Promise.all([
      prisma.booking.findFirst({
        where: { clientId: userId },
        orderBy: { createdAt: 'desc' },
        include: {
          package: { select: { title: true, destination: true } },
          payments: { orderBy: { dueDate: 'asc' } },
          timeline: { orderBy: { eventDate: 'asc' } },
        },
      }),
      prisma.proposal.findFirst({
        where: { customerId: userId },
        orderBy: { createdAt: 'desc' },
        include: { items: true, consultant: { select: { name: true, email: true, avatarUrl: true } } },
      }),
      prisma.chat.findFirst({
        where: { customerId: userId },
        include: { consultant: { select: { name: true, avatarUrl: true } } },
      }),
    ]);

    let messages: unknown[] = [];
    if (chat) {
      messages = await prisma.chatMessage.findMany({
        where: { chatId: chat.id },
        orderBy: { createdAt: 'asc' },
        take: 100,
      });
    }

    const documents = await prisma.document.findMany({
      where: { clientId: userId },
      orderBy: { createdAt: 'desc' },
    });

    const notifications = await prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return { success: true, data: { booking, proposal, chat, messages, documents, notifications } };
  } catch (error) {
    console.error('getClientData error:', error);
    return { success: false, error: 'Erro ao carregar dados do cliente.' };
  }
}

export async function sendClientMessage(data: {
  userId: string;
  content: string;
}) {
  try {
    const chat = await prisma.chat.findFirst({ where: { customerId: data.userId } });
    if (!chat) return { success: false, error: 'Nenhuma conversa encontrada.' };

    const message = await prisma.chatMessage.create({
      data: {
        chatId: chat.id,
        senderId: data.userId,
        content: data.content,
      },
    });
    revalidatePath('/dashboard/cliente');
    return { success: true, data: message };
  } catch (error) {
    console.error('sendClientMessage error:', error);
    return { success: false, error: 'Erro ao enviar mensagem.' };
  }
}

export async function getClientMessages(userId: string) {
  try {
    const chat = await prisma.chat.findFirst({ where: { customerId: userId } });
    if (!chat) return { success: true, data: [], chatId: null };

    const messages = await prisma.chatMessage.findMany({
      where: { chatId: chat.id },
      orderBy: { createdAt: 'asc' },
    });
    return { success: true, data: messages, chatId: chat.id };
  } catch (error) {
    return { success: false, error: 'Erro ao buscar mensagens.' };
  }
}

export async function approveClientProposal(proposalId: string, userId: string) {
  try {
    const proposal = await prisma.proposal.update({
      where: { id: proposalId },
      data: { status: 'approved' },
    });

    // Update lead status if associated
    if (proposal.leadId) {
      await prisma.lead.update({
        where: { id: proposal.leadId },
        data: { status: 'fechado' },
      });
    }

    // Notify consultant
    await prisma.notification.create({
      data: {
        userId: proposal.consultantId,
        title: 'Proposta Aprovada!',
        message: `O cliente aprovou a proposta: ${proposal.title}`,
        type: 'success',
        category: 'booking',
        priority: 'high',
        linkUrl: '/dashboard/admin',
      },
    });

    revalidatePath('/dashboard/cliente');
    return { success: true, data: proposal };
  } catch (error) {
    console.error('approveClientProposal error:', error);
    return { success: false, error: 'Erro ao aprovar proposta.' };
  }
}

export async function requestProposalChanges(proposalId: string, notes: string) {
  try {
    const proposal = await prisma.proposal.update({
      where: { id: proposalId },
      data: { status: 'draft', notes },
    });

    await prisma.notification.create({
      data: {
        userId: proposal.consultantId,
        title: 'Revisão Solicitada na Proposta',
        message: `Cliente solicitou alterações: ${notes.substring(0, 100)}`,
        type: 'warning',
        category: 'booking',
        priority: 'high',
        linkUrl: '/dashboard/admin',
      },
    });

    revalidatePath('/dashboard/cliente');
    return { success: true, data: proposal };
  } catch (error) {
    return { success: false, error: 'Erro ao solicitar alterações.' };
  }
}

export async function uploadClientDocument(data: {
  clientId: string;
  uploadedById: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  category?: string;
}) {
  try {
    const doc = await prisma.document.create({
      data: {
        clientId: data.clientId,
        uploadedById: data.uploadedById,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize,
        category: data.category || 'general',
      },
    });
    revalidatePath('/dashboard/cliente');
    return { success: true, data: doc };
  } catch (error) {
    return { success: false, error: 'Erro ao salvar documento.' };
  }
}

export async function getClientNotifications(userId: string) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return { success: true, data: notifications };
  } catch (error) {
    return { success: false, error: 'Erro ao buscar notificações.' };
  }
}
