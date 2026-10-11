'use server';

/**
 * Autenticação — server actions.
 *
 * Toda a lógica vive no servidor: o papel (role) é lido do Postgres e nunca do
 * navegador. O cookie `maeum_session` é HttpOnly + SameSite=Lax e assinado com
 * HMAC-SHA256 (ver src/lib/session.ts).
 */
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword, generatePassword, sha256 } from '@/lib/password';
import {
  signSession,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  type Role,
} from '@/lib/session';
import { getAuth } from '@/lib/auth';
import { auditLog } from '@/lib/audit';
import { isValidEmail, normalizeEmail } from '@/lib/validate';

export interface AuthResult {
  success: boolean;
  error?: string;
  /** Preenchido apenas no login/registro — usado para redirecionar. */
  redirectTo?: string;
}

const loginSchema = z.object({
  email: z.string().min(1, 'Informe o e-mail.'),
  password: z.string().min(1, 'Informe a senha.'),
});

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome completo.').max(120),
  email: z.string().min(3, 'Informe o e-mail.'),
  password: z
    .string()
    .min(8, 'A senha precisa ter ao menos 8 caracteres.')
    .max(200, 'Senha muito longa.'),
  phone: z.string().trim().max(40).optional(),
});

function homeFor(role: Role): string {
  switch (role) {
    case 'super_admin':
    case 'admin':
      return '/dashboard/admin';
    case 'consultora':
      return '/dashboard/consultora';
    default:
      return '/dashboard/cliente';
  }
}

async function issueSession(user: { id: string; role: string; sessionVersion: number }) {
  const role = (['super_admin', 'admin', 'consultora', 'customer'].includes(user.role)
    ? user.role
    : 'customer') as Role;

  const token = await signSession({ uid: user.id, role, v: user.sessionVersion });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
  return role;
}

export async function loginAction(_prev: AuthResult | null, formData: FormData): Promise<AuthResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }

  const email = normalizeEmail(parsed.data.email);
  const user = await prisma.user.findUnique({ where: { email } });

  // Mensagem genérica: não revela se o e-mail existe.
  const GENERIC = 'E-mail ou senha incorretos.';
  if (!user) return { success: false, error: GENERIC };
  if (!user.isActive) {
    return { success: false, error: 'Conta desativada. Fale com o administrador.' };
  }
  if (!user.passwordHash) {
    return {
      success: false,
      error: 'Esta conta ainda não possui senha. Use "primeiro acesso" ou contate o suporte.',
    };
  }
  if (!verifyPassword(parsed.data.password, user.passwordHash)) {
    await auditLog({
      userId: user.id,
      action: 'auth.login_failed',
      entity: 'User',
      entityId: user.id,
      details: 'Senha incorreta',
      result: 'failure',
    });
    return { success: false, error: GENERIC };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLoginAt: new Date(),
      resetTokenHash: null,
      resetTokenExpiry: null,
    },
  });

  const role = await issueSession(user);
  await auditLog({
    userId: user.id,
    action: 'auth.login',
    entity: 'User',
    entityId: user.id,
  });

  const requested = String(formData.get('next') ?? '');
  const redirectTo =
    requested.startsWith('/') && !requested.startsWith('//') ? requested : homeFor(role);

  revalidatePath('/', 'layout');
  return { success: true, redirectTo };
}

export async function registerAction(
  _prev: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    phone: formData.get('phone') ?? '',
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }
  if (!isValidEmail(parsed.data.email)) {
    return { success: false, error: 'E-mail inválido.' };
  }

  const email = normalizeEmail(parsed.data.email);
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return { success: false, error: 'Já existe uma conta com este e-mail.' };
  }

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      phone: parsed.data.phone || null,
      // Auto-cadastro público NUNCA pode criar privileged roles.
      role: 'customer',
      passwordHash: hashPassword(parsed.data.password),
    },
    select: { id: true, role: true, sessionVersion: true },
  });

  await issueSession(user);
  revalidatePath('/', 'layout');
  return { success: true, redirectTo: homeFor('customer') };
}

export async function logoutAction(): Promise<void> {
  const ctx = await getAuth();
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  if (ctx) {
    await auditLog({
      userId: ctx.user.id,
      action: 'auth.logout',
      entity: 'User',
      entityId: ctx.user.id,
    });
  }
  revalidatePath('/', 'layout');
  redirect('/');
}

/**
 * Recuperação de senha sem dependência de e-mail transacional:
 * gera um token de uso único e devolve o link. Em produção, integre com
 * Resend/SES chamando `sendPasswordResetEmail` abaixo.
 */
export async function requestPasswordResetAction(
  _prev: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  const email = normalizeEmail(String(formData.get('email') ?? ''));
  if (!isValidEmail(email)) return { success: false, error: 'E-mail inválido.' };

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  const GENERIC = 'Se o e-mail existir, enviaremos o link de redefinição.';

  if (!user) return { success: true, error: GENERIC };

  const raw = generatePassword(32);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetTokenHash: sha256(raw),
      resetTokenExpiry: new Date(Date.now() + 1000 * 60 * 60),
    },
  });

  // Log temporário de desenvolvimento — em produção envie por e-mail.
  if (process.env.NODE_ENV !== 'production') {
    console.info(`[auth] link de redefinição para ${email}: /login?reset=${raw}`);
  }

  return { success: true, error: GENERIC };
}

export async function resetPasswordAction(
  _prev: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  const raw = String(formData.get('token') ?? '');
  const password = String(formData.get('password') ?? '');
  if (raw.length < 20) return { success: false, error: 'Link de redefinição inválido.' };
  if (password.length < 8) {
    return { success: false, error: 'A senha precisa ter ao menos 8 caracteres.' };
  }

  const user = await prisma.user.findFirst({
    where: { resetTokenHash: sha256(raw) },
  });
  if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    return { success: false, error: 'Link expirado. Solicite um novo.' };
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hashPassword(password),
      resetTokenHash: null,
      resetTokenExpiry: null,
      sessionVersion: { increment: 1 },
    },
    select: { id: true, role: true, sessionVersion: true },
  });

  await issueSession(updated);
  revalidatePath('/', 'layout');
  return { success: true, redirectTo: homeFor(updated.role as Role) };
}

export async function changePasswordAction(
  _prev: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  const ctx = await getAuth();
  if (!ctx) return { success: false, error: 'Faça login novamente.' };

  const current = String(formData.get('currentPassword') ?? '');
  const next = String(formData.get('newPassword') ?? '');
  if (next.length < 8) {
    return { success: false, error: 'A nova senha precisa ter ao menos 8 caracteres.' };
  }

  const row = await prisma.user.findUnique({
    where: { id: ctx.user.id },
    select: { passwordHash: true },
  });
  if (!row?.passwordHash || !verifyPassword(current, row.passwordHash)) {
    return { success: false, error: 'Senha atual incorreta.' };
  }

  await prisma.user.update({
    where: { id: ctx.user.id },
    data: { passwordHash: hashPassword(next), sessionVersion: { increment: 1 } },
  });

  await issueSession({ id: ctx.user.id, role: ctx.user.role, sessionVersion: ctx.session.v + 1 });
  revalidatePath('/', 'layout');
  return { success: true };
}
