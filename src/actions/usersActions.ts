'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// ─── USUÁRIOS ────────────────────────────────────────────────
export async function getUsers({
  page = 1,
  pageSize = 20,
  search = '',
  role,
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
} = {}) {
  try {
    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip: (page - 1) * pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          avatarUrl: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              assignedLeads: true,
              notifications: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { success: true, data: users, total, pages: Math.ceil(total / pageSize) };
  } catch (error) {
    console.error('getUsers error:', error);
    return { success: false, error: 'Erro ao buscar usuários.' };
  }
}

export async function createUser(data: {
  name: string;
  email: string;
  password?: string;
  role?: string;
  phone?: string;
}) {
  try {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return { success: false, error: 'E-mail já cadastrado.' };

    const pwd = data.password || 'maeum2026';
    const role = data.role || 'customer';

    // 1. Create user in Supabase Auth invisibly
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: pwd,
      email_confirm: true,
      user_metadata: { name: data.name, role: role }
    });

    if (authError) {
      console.error('Supabase Auth Error:', authError);
      return { success: false, error: 'Erro ao criar credenciais de login: ' + authError.message };
    }

    const authUserId = authData.user.id;

    // 2. Insert into maeum_users (public table)
    await supabaseAdmin.from('maeum_users').insert([{
      id: authUserId,
      email: data.email,
      name: data.name,
      role: role,
      phone: data.phone,
      is_active: true
    }]);

    // 3. Insert into Prisma User table
    const user = await prisma.user.create({
      data: {
        id: authUserId,
        name: data.name,
        email: data.email,
        passwordHash: pwd,
        role: role,
        phone: data.phone,
      },
      select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true },
    });
    
    revalidatePath('/dashboard/admin');
    return { success: true, data: user };
  } catch (error) {
    console.error('createUser error:', error);
    return { success: false, error: 'Erro interno ao criar usuário.' };
  }
}

export async function updateUser(id: string, data: Partial<{
  name: string;
  email: string;
  role: string;
  phone: string;
  avatarUrl: string;
  isActive: boolean;
}>) {
  try {
    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, phone: true, isActive: true },
    });
    revalidatePath('/dashboard/admin');
    return { success: true, data: user };
  } catch (error) {
    console.error('updateUser error:', error);
    return { success: false, error: 'Erro ao atualizar usuário.' };
  }
}

export async function updateUserRole(id: string, role: string) {
  try {
    const user = await prisma.user.update({ where: { id }, data: { role } });
    revalidatePath('/dashboard/admin');
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: 'Erro ao atualizar papel do usuário.' };
  }
}

export async function toggleUserActive(id: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return { success: false, error: 'Usuário não encontrado.' };
    const updated = await prisma.user.update({ where: { id }, data: { isActive: !user.isActive } });
    revalidatePath('/dashboard/admin');
    return { success: true, data: updated };
  } catch (error) {
    return { success: false, error: 'Erro ao alterar status do usuário.' };
  }
}

export async function deleteUser(id: string) {
  try {
    await prisma.user.delete({ where: { id } });
    revalidatePath('/dashboard/admin');
    return { success: true };
  } catch (error) {
    console.error('deleteUser error:', error);
    return { success: false, error: 'Erro ao excluir usuário.' };
  }
}

export async function sendNotificationToUser(data: {
  userId: string;
  title: string;
  message: string;
  type?: string;
  priority?: string;
  category?: string;
  linkUrl?: string;
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type || 'info',
        priority: data.priority || 'normal',
        category: data.category || 'system',
        linkUrl: data.linkUrl,
      },
    });
    revalidatePath('/dashboard/admin');
    return { success: true, data: notification };
  } catch (error) {
    return { success: false, error: 'Erro ao enviar notificação.' };
  }
}

export async function sendNotificationToAll(data: {
  title: string;
  message: string;
  type?: string;
  priority?: string;
  category?: string;
  linkUrl?: string;
}) {
  try {
    const users = await prisma.user.findMany({ where: { isActive: true }, select: { id: true } });
    await Promise.all(
      users.map(u =>
        prisma.notification.create({
          data: {
            userId: u.id,
            title: data.title,
            message: data.message,
            type: data.type || 'info',
            priority: data.priority || 'normal',
            category: data.category || 'system',
            linkUrl: data.linkUrl,
          },
        })
      )
    );
    revalidatePath('/dashboard/admin');
    return { success: true, count: users.length };
  } catch (error) {
    return { success: false, error: 'Erro ao enviar notificações.' };
  }
}
