'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// INICIAR CHAT (Cliente)
export async function initClientChat(data: { name: string; email: string; message: string; customerId?: string }) {
  try {
    // Acha uma consultora (ex: a primeira ativa, ou faz um rodízio real depois)
    const consultant = await prisma.user.findFirst({
      where: { role: 'consultora', isActive: true },
      select: { id: true, name: true, avatarUrl: true },
    });

    if (!consultant) {
      return { success: false, error: 'Nenhuma consultora disponível no momento.' };
    }

    // Criar Lead se necessário para registrar o contato inicial
    let leadId = data.customerId;
    if (!leadId) {
      const lead = await prisma.lead.create({
        data: {
          name: data.name,
          email: data.email,
          status: 'novo',
          origin: 'chat_site',
          consultantId: consultant.id,
        },
      });
      leadId = lead.id;
    }

    // Criar o Chat
    const chat = await prisma.chat.create({
      data: {
        consultantId: consultant.id,
        customerId: leadId,
      },
    });

    // Criar a primeira mensagem
    await prisma.chatMessage.create({
      data: {
        chatId: chat.id,
        senderId: leadId,
        content: data.message,
      },
    });

    return { 
      success: true, 
      chatId: chat.id, 
      customerId: leadId,
      consultant: {
        id: consultant.id,
        name: consultant.name,
        avatarUrl: consultant.avatarUrl
      }
    };
  } catch (error) {
    console.error('initClientChat error:', error);
    return { success: false, error: 'Erro ao iniciar o chat.' };
  }
}

// ENVIAR MENSAGEM
export async function sendMessage(data: { chatId: string; senderId: string; content: string }) {
  try {
    const message = await prisma.chatMessage.create({
      data: {
        chatId: data.chatId,
        senderId: data.senderId,
        content: data.content,
      },
    });

    // Atualiza o updatedAt do chat para jogar pra cima na lista
    await prisma.chat.update({
      where: { id: data.chatId },
      data: { updatedAt: new Date() }
    });

    return { success: true, message };
  } catch (error) {
    console.error('sendMessage error:', error);
    return { success: false, error: 'Erro ao enviar mensagem.' };
  }
}

// BUSCAR MENSAGENS DE UM CHAT
export async function getChatMessages(chatId: string) {
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
    });
    return { success: true, messages };
  } catch (error) {
    console.error('getChatMessages error:', error);
    return { success: false, error: 'Erro ao buscar mensagens.' };
  }
}

// BUSCAR CHATS DO ADMIN (Para a tela "Conversas")
export async function getAdminChats(consultantId?: string) {
  try {
    // Se passar consultantId, busca só os dele, senão busca todos (pra super_admin)
    const whereClause = consultantId ? { consultantId } : {};

    const chats = await prisma.chat.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'desc' },
      include: {
        consultant: {
          select: { id: true, name: true, avatarUrl: true }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    // Como o customerId é um ID de Lead, vamos buscar os Leads associados
    const customerIds = chats.map(c => c.customerId);
    const leads = await prisma.lead.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, name: true, email: true }
    });

    const chatsWithLeadData = chats.map(chat => ({
      ...chat,
      customer: leads.find(l => l.id === chat.customerId) || { name: 'Visitante Desconhecido' }
    }));

    return { success: true, chats: chatsWithLeadData };
  } catch (error) {
    console.error('getAdminChats error:', error);
    return { success: false, error: 'Erro ao buscar conversas.' };
  }
}
