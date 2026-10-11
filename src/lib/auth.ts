/**
 * Autorização no servidor.
 *
 * REGRA INVARIÁVEL: nenhuma server action de escrita/leitura sensível pode
 * confiar no papel enviado pelo navegador. Todas passam por `requireUser` /
 * `requireStaff` / `requireAdmin`, que leem o cookie assinado e revalidam
 * `role`, `isActive` e `sessionVersion` direto do Postgres.
 */
import { cookies, headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import {
  SESSION_COOKIE,
  verifySession,
  type Role,
  type SessionPayload,
  isAdmin as roleIsAdmin,
  isStaff as roleIsStaff,
} from '@/lib/session';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone: string | null;
  avatarUrl: string | null;
  jobTitle: string | null;
  locale: string;
}

export interface AuthContext {
  user: AuthUser;
  session: SessionPayload;
}

export class AuthError extends Error {
  readonly status: 401 | 403;
  constructor(message: string, status: 401 | 403 = 401) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

const SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  phone: true,
  avatarUrl: true,
  jobTitle: true,
  locale: true,
  isActive: true,
  sessionVersion: true,
} as const;

function normalizeRole(raw: string): Role {
  return raw === 'super_admin' || raw === 'admin' || raw === 'consultora' || raw === 'customer'
    ? raw
    : 'customer';
}

/** Lê e valida a sessão. Retorna null quando não há sessão válida/ativa. */
export async function getAuth(): Promise<AuthContext | null> {
  const store = await cookies();
  const payload = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!payload) return null;

  const row = await prisma.user.findUnique({ where: { id: payload.uid }, select: SELECT });
  if (!row) return null;
  if (!row.isActive) return null;
  if (row.sessionVersion !== payload.v) return null;

  const role = normalizeRole(row.role);
  return {
    user: {
      id: row.id,
      email: row.email,
      name: row.name,
      role,
      phone: row.phone,
      avatarUrl: row.avatarUrl,
      jobTitle: row.jobTitle,
      locale: row.locale,
    },
    session: { ...payload, role },
  };
}

/** Igual a getAuth, mas lança AuthError(401). */
export async function requireUser(): Promise<AuthContext> {
  const ctx = await getAuth();
  if (!ctx) throw new AuthError('Sessão inválida ou expirada. Faça login novamente.', 401);
  return ctx;
}

/** Exige super_admin | admin | consultora. */
export async function requireStaff(): Promise<AuthContext> {
  const ctx = await requireUser();
  if (!roleIsStaff(ctx.user.role)) {
    throw new AuthError('Acesso restrito à equipe Maeum.', 403);
  }
  return ctx;
}

/** Exige super_admin | admin. */
export async function requireAdmin(): Promise<AuthContext> {
  const ctx = await requireUser();
  if (!roleIsAdmin(ctx.user.role)) {
    throw new AuthError('Acesso restrito a administradores.', 403);
  }
  return ctx;
}

/** Require sem exceção — para branches condicionais. */
export async function tryRequireAdmin(): Promise<AuthContext | null> {
  const ctx = await getAuth();
  return ctx && roleIsAdmin(ctx.user.role) ? ctx : null;
}

/**
 * Verifica se um chat pertence ao ator (atendente responsável ou o cliente).
 * Usar SEMPRE antes de ler/escrever mensagens.
 */
export async function assertChatAccess(chatId: string, userId: string): Promise<void> {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    select: { consultantId: true, customerId: true },
  });
  if (!chat) throw new AuthError('Conversa não encontrada.', 401);
  if (chat.consultantId === userId || chat.customerId === userId) return;
  throw new AuthError('Você não tem acesso a esta conversa.', 403);
}

export async function getRequestMeta(): Promise<{ ip: string | null; userAgent: string | null }> {
  const h = await headers();
  const forwarded = h.get('x-forwarded-for');
  return {
    ip: forwarded ? forwarded.split(',')[0]!.trim() : h.get('x-real-ip'),
    userAgent: h.get('user-agent'),
  };
}
