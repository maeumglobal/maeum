/**
 * Criação de notificações internas.
 *
 * Fica fora de `'use server'` de propósito: se `notifyUser` fosse exportada por
 * `notificationActions.ts`, o Next.js a exporia como um endpoint público e
 * qualquer visitante conseguiria disparar notificações. Aqui ela é um módulo
 * server-only importável por qualquer action.
 */
import { prisma } from '@/lib/prisma';

export interface NotifyInput {
  title: string;
  message: string;
  /** info | success | warning | error */
  type?: string;
  /** low | normal | high */
  priority?: string;
  /** system | chat | lead | booking | proposal */
  category?: string;
  linkUrl?: string | null;
}

/** Notifica um usuário. Nunca lança: falha de notificação não quebra a operação. */
export async function notifyUser(userId: string | null | undefined, input: NotifyInput): Promise<void> {
  if (!userId) return;
  try {
    await prisma.notification.create({
      data: {
        userId,
        title: input.title.slice(0, 200),
        message: input.message.slice(0, 1000),
        type: input.type ?? 'info',
        priority: input.priority ?? 'normal',
        category: input.category ?? 'system',
        linkUrl: input.linkUrl ?? null,
      },
    });
  } catch (error) {
    console.error('[notify] falha ao criar notificação:', error instanceof Error ? error.message : error);
  }
}

/** Notifica vários usuários em paralelo (bounded pela lista recebida). */
export async function notifyUsers(userIds: Array<string | null | undefined>, input: NotifyInput): Promise<void> {
  const targets = [...new Set(userIds.filter((id): id is string => !!id))];
  await Promise.all(targets.map((id) => notifyUser(id, input)));
}

/** Todos os membros da equipe ativos (super_admin, admin, consultora). */
export async function getStaffIds(): Promise<string[]> {
  const rows = await prisma.user.findMany({
    where: { isActive: true, role: { in: ['super_admin', 'admin', 'consultora'] } },
    select: { id: true },
    take: 100,
  });
  return rows.map((r) => r.id);
}