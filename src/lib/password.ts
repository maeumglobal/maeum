/**
 * Hash de senha com scrypt (Node crypto nativo — zero dependências).
 *
 * Formato armazenado em `User.passwordHash`:
 *   scrypt$N$r$p$<saltHex>$<hashHex>
 *
 * Compatível com senhas antigas em texto puro (seed legado): `verifyPassword`
 * aceita o formato novo e rejeita/reponta o legado com aviso.
 */
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';

const N = 16384; // custo de CPU (2^14)
const R = 8;
const P = 1;
const KEYLEN = 64;
const SALT_BYTES = 16;

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_BYTES);
  const derived = scryptSync(password.normalize('NFKC'), salt, KEYLEN, { N, r: R, p: P });
  return `scrypt$${N}$${R}$${P}$${salt.toString('hex')}$${derived.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (!stored) return false;

  // Senha em texto puro (seed legado) — comparação constantemente segura.
  if (!stored.startsWith('scrypt$')) {
    const a = Buffer.from(stored);
    const b = Buffer.from(password.normalize('NFKC'));
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  }

  const parts = stored.split('$');
  if (parts.length !== 6) return false;
  const [, nStr, rStr, pStr, saltHex, hashHex] = parts;
  const n = Number(nStr);
  const r = Number(rStr);
  const p = Number(pStr);
  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) return false;

  try {
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(hashHex, 'hex');
    const derived = scryptSync(password.normalize('NFKC'), salt, expected.length, { N: n, r, p });
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/** Indica se o hash está no formato legado (texto puro). */
export function isLegacyHash(stored: string | null | undefined): boolean {
  return !!stored && !stored.startsWith('scrypt$');
}

/** Senha aleatória forte, usada quando o admin cria um usuário sem informar uma. */
export function generatePassword(bytes = 12): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const buf = randomBytes(bytes);
  let out = '';
  for (let i = 0; i < bytes; i += 1) out += alphabet[buf[i]! % alphabet.length];
  return out;
}

/** Hash de SHA-256 — usado para rate limiting e identificadores de idempotência. */
export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
