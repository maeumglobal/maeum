'use server';

/**
 * Usuários & equipe.
 *
 * Autorização: TUDO aqui é `requireAdmin()` (super_admin | admin). Atendentes
 * não gerem contas — para o widget público e seletores existe `getConsultants()`,
 * que devolve somente a equipe e nada de e-mail/senha.
 *
 * Correções aplicadas nesta reescrita:
 *  - `createUser` não usa mais `supabaseAdmin.auth.admin.createUser` (a
 *    "service role key" do projeto é a anon key → 401 em tudo). Grava direto no
 *    Prisma, com `hashPassword` (scrypt), `$transaction` e checagem de e-mail.
 *  - `deleteUser` NÃO apaga a linha: desativa a conta e incrementa
 *    `sessionVersion`, senão o usuário continuaria logando. Apagar a linha
 *    também apagaria o histórico de `AdminLog` (onDelete: Cascade).
 */
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { auditLog } from '@/lib/audit';
import { hashPassword, generatePassword } from '@/lib/password';
import { notifyUser, notifyUsers } from '@/lib/notify';
import { str, strOrNull, phoneDigits, isValidEmail, normalizeEmail, safeUrl, toBool } from '@/lib/validate';
import {
  pick,
  paginate,
  pageMeta,
  fail,
  ok,
  type ActionInput,
  type ActionResult,
  type ListResult,
} from '@/lib/actionKit';

const ROLES = ['super_admin', 'admin', 'consultora', 'customer'] as const;
type Role = (typeof ROLES)[number];

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  avatarUrl: string | null;
  jobTitle: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  avatarUrl: true,
  jobTitle: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

function revalidateUsers() {
  revalidatePath('/admin/equipe');
  revalidatePath('/dashboard/admin');
}

// ─── LEITURA ────────────────────────────────────────────────

export async function getUsers(input: {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
} = {}): Promise<ListResult<unknown>> {
  try {
    await requireAdmin();
    const { page, pageSize, skip, take } = paginate(input.page, input.pageSize);
    const search = String(input.search ?? '').trim().slice(0, 120);

    const where: Record<string, unknown> = {};
    if (input.role && isRole(input.role)) where.role = input.role;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        take,
        skip,
        select: {
          ...USER_SELECT,
          _count: { select: { assignedLeads: true, notifications: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const meta = pageMeta(total, page, pageSize);
    return { success: true, data, items: data, ...meta, pages: meta.totalPages };
  } catch (error) {
    return {
      ...fail(error, 'Erro ao buscar usuários.'),
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 1,
      pages: 1,
    };
  }
}

/**
 * Lista mínima da equipe para seletores (atribuição de lead, widget de chat).
 * Sem e-mail, sem hash, sem contadores — só o necessário para exibir/escolher.
 */
export async function getConsultants(): Promise<
  ActionResult<Array<{ id: string; name: string; role: string; avatarUrl: string | null }>>
> {
  try {
    await requireAdmin();
    const data = await prisma.user.findMany({
      where: { isActive: true, role: { in: ['super_admin', 'admin', 'consultora'] } },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
      take: 100,
      select: { id: true, name: true, role: true, avatarUrl: true },
    });
    return ok(data);
  } catch (error) {
    return fail(error, 'Erro ao buscar a equipe.');
  }
}

// ─── ESCRITA ────────────────────────────────────────────────

export async function createUser(
  input: ActionInput,
): Promise<ActionResult<AdminUser> & { temporaryPassword?: string }> {
  try {
    const ctx = await requireAdmin();
    const f = pick(input);

    const name = str(f.name, 120);
    const email = normalizeEmail(str(f.email, 180));
    const phone = phoneDigits(strOrNull(f.phone, 40));
    const roleRaw = str(f.role, 20) || 'customer';
    const role: Role = isRole(roleRaw) ? roleRaw : 'customer';

    if (name.length < 2) return { success: false, error: 'Informe o nome completo.' };
    if (!isValidEmail(email)) return { success: false, error: 'E-mail inválido.' };

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) return { success: false, error: 'E-mail já cadastrado.' };

    // Senha: usa a informada ou gera uma forte. NUNCA em texto puro.
    const provided = str(f.password, 200);
    const plain = provided.length >= 8 ? provided : generatePassword(12);
    const passwordHash = hashPassword(plain);

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name,
          email,
          role,
          phone: phone || null,
          avatarUrl: safeUrl(strOrNull(f.avatarUrl, 500)),
          jobTitle: strOrNull(f.jobTitle, 120),
          passwordHash,
          isActive: toBool(f.isActive, true),
        },
        select: USER_SELECT,
      });
      // A notificação confirma que o cadastro saiu.
      await tx.notification.create({
        data: {
          userId: created.id,
          title: 'Bem-vindo à Maeum Global',
          message: 'Sua conta foi criada. Use "primeiro acesso" para definir sua senha.',
          category: 'system',
          linkUrl: '/login',
        },
      });
      return created;
    });

    auditLog({
      userId: ctx.user.id,
      action: 'user.create',
      entity: 'User',
      entityId: user.id,
      details: `role=${user.role}`,
    });
    revalidateUsers();
    return { success: true, data: user, temporaryPassword: provided ? undefined : plain };
  } catch (error) {
    return fail(error, 'Erro ao criar usuário.');
  }
}

export async function updateUser(id: string, input: ActionInput): Promise<ActionResult<AdminUser>> {
  try {
    const ctx = await requireAdmin();
    const f = pick(input);

    const current = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
    if (!current) return { success: false, error: 'Usuário não encontrado.' };

    const data: Record<string, unknown> = {};

    const name = str(f.name, 120);
    if (name.length >= 2) data.name = name;

    const emailRaw = normalizeEmail(str(f.email, 180));
    if (emailRaw) {
      if (!isValidEmail(emailRaw)) return { success: false, error: 'E-mail inválido.' };
      data.email = emailRaw;
    }

    if (f.phone !== undefined) data.phone = phoneDigits(strOrNull(f.phone, 40)) || null;
    if (f.avatarUrl !== undefined) data.avatarUrl = safeUrl(strOrNull(f.avatarUrl, 500));
    if (f.jobTitle !== undefined) data.jobTitle = strOrNull(f.jobTitle, 120);

    if (f.role !== undefined) {
      const roleRaw = str(f.role, 20);
      if (!isRole(roleRaw)) return { success: false, error: 'Papel inválido.' };
      if (id === ctx.user.id && roleRaw !== current.role) {
        return { success: false, error: 'Você não pode alterar o próprio papel.' };
      }
      data.role = roleRaw;
      data.sessionVersion = { increment: 1 }; // invalida sessões antigas
    }

    if (f.isActive !== undefined) {
      const isActive = toBool(f.isActive, true);
      if (id === ctx.user.id && !isActive) {
        return { success: false, error: 'Você não pode desativar a própria conta.' };
      }
      data.isActive = isActive;
      data.sessionVersion = { increment: 1 };
    }

    if (Object.keys(data).length === 0) return { success: false, error: 'Nada para atualizar.' };

    const user = await prisma.user.update({ where: { id }, data, select: USER_SELECT });

    auditLog({ userId: ctx.user.id, action: 'user.update', entity: 'User', entityId: id });
    revalidateUsers();
    return ok(user);
  } catch (error) {
    return fail(error, 'Erro ao atualizar usuário.');
  }
}

export async function updateUserRole(id: string, role: string): Promise<ActionResult<AdminUser>> {
  try {
    const ctx = await requireAdmin();
    if (!isRole(role)) return { success: false, error: 'Papel inválido.' };
    if (id === ctx.user.id && role !== ctx.user.role) {
      return { success: false, error: 'Você não pode alterar o próprio papel.' };
    }

    const user = await prisma.user.update({
      where: { id },
      // sessão incrementada: o token antigo (com o papel velho) deixa de valer
      data: { role, sessionVersion: { increment: 1 } },
      select: USER_SELECT,
    });

    auditLog({
      userId: ctx.user.id,
      action: 'user.role_change',
      entity: 'User',
      entityId: id,
      details: `role=${role}`,
    });
    revalidateUsers();
    return ok(user);
  } catch (error) {
    return fail(error, 'Erro ao atualizar papel do usuário.');
  }
}

export async function toggleUserActive(id: string): Promise<ActionResult<AdminUser>> {
  try {
    const ctx = await requireAdmin();
    if (id === ctx.user.id) {
      return { success: false, error: 'Você não pode desativar a própria conta.' };
    }

    const current = await prisma.user.findUnique({ where: { id }, select: { id: true, isActive: true } });
    if (!current) return { success: false, error: 'Usuário não encontrado.' };

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: !current.isActive, sessionVersion: { increment: 1 } },
      select: USER_SELECT,
    });

    auditLog({
      userId: ctx.user.id,
      action: user.isActive ? 'user.activate' : 'user.deactivate',
      entity: 'User',
      entityId: id,
    });
    revalidateUsers();
    return ok(user);
  } catch (error) {
    return fail(error, 'Erro ao alterar status do usuário.');
  }
}

/**
 * "Exclui" = desativa. Apagar a linha deixava o usuário logando (o login valida
 * só e-mail/senha no `User`) e apagava o histórico de auditoria em cascata.
 */
export async function deleteUser(id: string): Promise<ActionResult<AdminUser>> {
  try {
    const ctx = await requireAdmin();
    if (id === ctx.user.id) {
      return { success: false, error: 'Você não pode excluir a própria conta.' };
    }

    const current = await prisma.user.findUnique({ where: { id }, select: { id: true, isActive: true } });
    if (!current) return { success: false, error: 'Usuário não encontrado.' };

    const user = await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        sessionVersion: { increment: 1 },
        resetTokenHash: null,
        resetTokenExpiry: null,
      },
      select: USER_SELECT,
    });

    auditLog({ userId: ctx.user.id, action: 'user.deactivate', entity: 'User', entityId: id });
    revalidateUsers();
    return ok(user);
  } catch (error) {
    return fail(error, 'Erro ao excluir usuário.');
  }
}

// ─── NOTIFICAÇÃO ────────────────────────────────────────────

export async function sendNotificationToUser(input: ActionInput): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requireAdmin();
    const f = pick(input);

    const userId = str(f.userId, 64);
    const title = str(f.title, 200);
    const message = str(f.message, 1000);
    if (!userId || !title || !message) {
      return { success: false, error: 'Informe destinatário, título e mensagem.' };
    }

    const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!target) return { success: false, error: 'Destinatário não encontrado.' };

    await notifyUser(userId, {
      title,
      message,
      type: str(f.type, 20) || 'info',
      priority: str(f.priority, 20) || 'normal',
      category: str(f.category, 20) || 'system',
      linkUrl: safeUrl(strOrNull(f.linkUrl, 500)),
    });

    auditLog({ userId: ctx.user.id, action: 'notification.send', entity: 'User', entityId: userId });
    revalidatePath('/dashboard/admin');
    return { success: true };
  } catch (error) {
    return fail(error, 'Erro ao enviar notificação.');
  }
}

export async function sendNotificationToAll(
  input: ActionInput,
): Promise<ActionResult<{ count: number }> & { count: number }> {
  try {
    const ctx = await requireAdmin();
    const f = pick(input);

    const title = str(f.title, 200);
    const message = str(f.message, 1000);
    if (!title || !message) return { success: false, error: 'Informe título e mensagem.', count: 0 };

    const users = await prisma.user.findMany({ where: { isActive: true }, select: { id: true }, take: 5000 });
    await notifyUsers(
      users.map((u) => u.id),
      {
        title,
        message,
        type: str(f.type, 20) || 'info',
        priority: str(f.priority, 20) || 'normal',
        category: str(f.category, 20) || 'system',
        linkUrl: safeUrl(strOrNull(f.linkUrl, 500)),
      },
    );

    auditLog({
      userId: ctx.user.id,
      action: 'notification.broadcast',
      entity: 'Notification',
      details: `${users.length} destinatários`,
    });
    revalidatePath('/dashboard/admin');
    return { success: true, data: { count: users.length }, count: users.length };
  } catch (error) {
    return { ...fail(error, 'Erro ao enviar notificações.'), count: 0 };
  }
}