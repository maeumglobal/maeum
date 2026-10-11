/**
 * Sessão assinada (stateless) — HMAC-SHA256 via Web Crypto.
 *
 * Por que não Supabase Auth?
 *  1) O `SUPABASE_SERVICE_ROLE_KEY` do projeto é na verdade a anon key, então
 *     `auth.admin.createUser` falha com 401 e nenhum atendente novo pode ser criado.
 *  2) Os uids do `auth.users` nunca foram casados com os ids do Prisma `User`,
 *     quebrando leads/chat/propostas da atendente.
 *  3) Edge Functions do Supabase custam money por invocação.
 *
 * A sessão é um cookie HttpOnly assinado. O papel (role) NUNCA é lido do
 * cliente: `src/lib/auth.ts` revalida contra o banco a cada requisição.
 *
 * Usa apenas `crypto.subtle` para funcionar tanto no runtime Node (server
 * actions) quanto no runtime Edge do `proxy.ts`.
 */

export const SESSION_COOKIE = 'maeum_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 dias

export type Role = 'super_admin' | 'admin' | 'consultora' | 'customer';

export const STAFF_ROLES: readonly Role[] = ['super_admin', 'admin', 'consultora'];
export const ADMIN_ROLES: readonly Role[] = ['super_admin', 'admin'];

export interface SessionPayload {
  /** User.id (Prisma) */
  uid: string;
  /** papel no momento da emissão — revalidado no servidor */
  role: Role;
  /** User.sessionVersion — permite invalidar tokens antigos */
  v: number;
  /** expiresAt em segundos (epoch) */
  exp: number;
}

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'AUTH_SECRET ausente ou muito curto (mín. 32 chars). Defina em .env antes de produção.',
      );
    }
    return 'maeum-dev-only-insecure-secret-please-set-AUTH_SECRET';
  }
  return s;
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array {
  const pad = value.length % 4 === 0 ? '' : '='.repeat(4 - (value.length % 4));
  const bin = atob(value.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacHex(data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function isRole(value: unknown): value is Role {
  return value === 'super_admin' || value === 'admin' || value === 'consultora' || value === 'customer';
}

export async function signSession(
  input: { uid: string; role: Role; v: number },
  ttlSeconds: number = SESSION_TTL_SECONDS,
): Promise<string> {
  const payload: SessionPayload = {
    uid: input.uid,
    role: input.role,
    v: input.v,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const body = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await hmacHex(body);
  return `${body}.${sig}`;
}

export async function verifySession(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;

  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  let expected: string;
  try {
    expected = await hmacHex(body);
  } catch {
    return null;
  }
  if (!constantTimeEqual(sig, expected)) return null;

  try {
    const parsed = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as Partial<SessionPayload>;
    if (typeof parsed.uid !== 'string' || !isRole(parsed.role)) return null;
    if (typeof parsed.exp !== 'number' || parsed.exp * 1000 < Date.now()) return null;
    return {
      uid: parsed.uid,
      role: parsed.role,
      v: typeof parsed.v === 'number' ? parsed.v : 0,
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}

export function isStaff(role: Role | undefined | null): boolean {
  return !!role && STAFF_ROLES.includes(role);
}

export function isAdmin(role: Role | undefined | null): boolean {
  return !!role && ADMIN_ROLES.includes(role);
}
