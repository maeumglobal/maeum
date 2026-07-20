'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

async function ensureUserExists(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    await prisma.user.create({
      data: {
        id: userId,
        name: 'Super Administrador',
        email: 'admin@maeum.com',
        role: 'super_admin'
      }
    });
  }
}

export async function getNotifications(userId: string) {
  try {
    await ensureUserExists(userId);
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: notifications };
  } catch (error) {
    console.error('getNotifications error:', error);
    return { success: false, error: 'Failed to fetch notifications' };
  }
}

export async function markAsRead(notificationId: string) {
  try {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('markAsRead error:', error);
    return { success: false, error: 'Failed to mark as read' };
  }
}

export async function markAllAsRead(userId: string) {
  try {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('markAllAsRead error:', error);
    return { success: false, error: 'Failed to mark all as read' };
  }
}

export async function deleteNotification(notificationId: string) {
  try {
    await prisma.notification.delete({
      where: { id: notificationId }
    });
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('deleteNotification error:', error);
    return { success: false, error: 'Failed to delete notification' };
  }
}

export async function createTestNotification(userId: string) {
  try {
    await ensureUserExists(userId);
    await prisma.notification.create({
      data: {
        userId,
        title: 'Novo Pagamento Confirmado',
        message: 'Um novo cliente finalizou o pagamento do roteiro de Luxo em Seul.',
        linkUrl: '/dashboard/admin?tab=finance_group'
      }
    });
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('createTestNotification error:', error);
    return { success: false, error: 'Failed to create notification' };
  }
}
