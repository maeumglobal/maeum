'use server';

/**
 * Notificações do usuário.
 *
 * Autorização: `requireUser()` para tudo — a lista é SEMPRE a do usuário da
 * sessão. O `userId` que os componentes antigos mandavam é validado (se não
 * bater com a sessão, a chamada é recusada).
 *
 * REMOVIDO — `ensureUserExists`: criava um `User` com `email:'admin@maeum.com'`,
 * que já existe e é `@unique` → P2002 garantido em toda leitura de notificação.
 * A sessão sempre traz um `User` válido do Prisma, não há necessidade de criar.
 *
 * REMOVIDO — `getUnreadCount`: `getNotifications` já devolve `unread` no mesmo
 * round-trip (mesma query, `Promise.all`), então a action era um round-trip
 * extra para um número que o cliente já tinha em mãos.
 *
 * O helper `notifyUser()` fica em `src/lib/notify.ts` (módulo server-only) de
 * propósito: exportá-lo daqui o transformaria num endpoint público do Next.js.
 */
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireUser, requireStaff } from '@/lib/auth';
import { auditLog } from '@/lib/audit';
import {
  pick,
  paginate,
  pageMeta,
  fail,
  type ActionInput,
  type ActionResult,
  type ListResult,
} from '@/lib/actionKit';

const NOTIFICATION_SELECT = {
  id: true,
  title: true,
  message: true,
  type: true,
  priority: true,
  category: true,
  isRead: true,
  linkUrl: true,
  createdAt: true,
  readAt: true,
} as const;

const NOT_SELF = 'not-self';

/** Garante que o caller não está pedindo dados de outra pessoa. */
function assertSelf(claimed: FormDataEntryValue | undefined, real: string): void {
  const value = String(claimed ?? '').trim();
  if (value && value !== real) throw new Error(NOT_SELF);
}

export async function getNotifications(
  input?: string | { userId?: string; page?: number; pageSize?: number },
): Promise<ListResult<unknown> & { unread: number }> {
  const opts = typeof input === 'string' ? { userId: input } : (input ?? {});
  try {
    const ctx = await requireUser();
    assertSelf(opts.userId, ctx.user.id);
    const { page, pageSize, skip, take } = paginate(opts.page, opts.pageSize);

    const [data, total, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: ctx.user.id },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        select: NOTIFICATION_SELECT,
      }),
      prisma.notification.count({ where: { userId: ctx.user.id } }),
      prisma.notification.count({ where: { userId: ctx.user.id, isRead: false } }),
    ]);

    const meta = pageMeta(total, page, pageSize);
    return { success: true, data, items: data, unread, ...meta, pages: meta.totalPages };
  } catch (error) {
    if (error instanceof Error && error.message === NOT_SELF) {
      return {
        success: false,
        error: 'Você não tem acesso a estas notificações.',
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 1,
        pages: 1,
        unread: 0,
      };
    }
    return {
      ...fail(error, 'Erro ao buscar notificações.'),
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 1,
      pages: 1,
      unread: 0,
    };
  }
}

export async function markAsRead(notificationId: string): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requireUser();
    // Posse no WHERE: só marca notificação da própria conta.
    const result = await prisma.notification.updateMany({
      where: { id: String(notificationId ?? '').slice(0, 64), userId: ctx.user.id },
      data: { isRead: true, readAt: new Date() },
    });
    if (result.count === 0) return { success: false, error: 'Notificação não encontrada.' };

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    return fail(error, 'Erro ao marcar como lida.');
  }
}

export async function markAllAsRead(userId?: string): Promise<ActionResult<{ count: number }>> {
  try {
    const ctx = await requireUser();
    assertSelf(userId, ctx.user.id);

    const result = await prisma.notification.updateMany({
      where: { userId: ctx.user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    revalidatePath('/', 'layout');
    return { success: true, data: { count: result.count } };
  } catch (error) {
    if (error instanceof Error && error.message === NOT_SELF) {
      return { success: false, error: 'Você não tem acesso a estas notificações.' };
    }
    return fail(error, 'Erro ao marcar todas como lidas.');
  }
}

export async function deleteNotification(notificationId: string): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requireUser();
    const result = await prisma.notification.deleteMany({
      where: { id: String(notificationId ?? '').slice(0, 64), userId: ctx.user.id },
    });
    if (result.count === 0) return { success: false, error: 'Notificação não encontrada.' };

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    return fail(error, 'Erro ao excluir notificação.');
  }
}

/** Notificação de teste — só equipe, e sempre para a própria conta. */
export async function createTestNotification(
  input: ActionInput | string = {},
): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requireStaff();
    const f = pick(typeof input === 'string' ? { userId: input } : input);
    assertSelf(f.userId, ctx.user.id);

    await prisma.notification.create({
      data: {
        userId: ctx.user.id,
        title: 'Teste de notificação',
        message: 'Se você está lendo isso, o canal de notificações está funcionando.',
        type: 'info',
        category: 'system',
        linkUrl: '/dashboard/admin',
      },
    });

    auditLog({ userId: ctx.user.id, action: 'notification.test', entity: 'Notification' });
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === NOT_SELF) {
      return { success: false, error: 'Você não tem acesso a estas notificações.' };
    }
    return fail(error, 'Erro ao criar notificação.');
  }
}