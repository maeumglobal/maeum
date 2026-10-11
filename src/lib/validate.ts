/**
 * Validação e sanitização compartilhada por server actions e formulários.
 * Sem dependências além de `zod` (já instalado).
 */
import { z } from 'zod';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/** Converte para string, removendo NUL e limitando o tamanho. */
export function str(value: FormDataEntryValue | null | undefined, max = 5000): string {
  if (value == null) return '';
  return String(value).replace(/\0/g, '').trim().slice(0, max);
}

export function strOrNull(value: FormDataEntryValue | null | undefined, max = 5000): string | null {
  const v = str(value, max);
  return v.length ? v : null;
}

/** `''`/ausente → null. Campo opcional do Prisma rejeita string vazia. */
export function blankToNull(value: FormDataEntryValue | null | undefined): string | null {
  const v = str(value);
  return v.length ? v : null;
}

export function toNumber(
  value: FormDataEntryValue | null | undefined,
  opts: { min?: number; max?: number; fallback?: number } = {},
): number {
  const raw = str(value, 64).replace(',', '.');
  const n = Number(raw);
  if (!Number.isFinite(n)) return opts.fallback ?? 0;
  const clamped = Math.min(opts.max ?? Number.MAX_SAFE_INTEGER, Math.max(opts.min ?? -Number.MAX_SAFE_INTEGER, n));
  return clamped;
}

export function toInt(
  value: FormDataEntryValue | null | undefined,
  opts: { min?: number; max?: number; fallback?: number } = {},
): number {
  return Math.round(toNumber(value, opts));
}

export function toBool(value: FormDataEntryValue | null | undefined, fallback = false): boolean {
  if (value == null) return fallback;
  const v = String(value).toLowerCase();
  return v === 'true' || v === '1' || v === 'on' || v === 'yes';
}

/**
 * Slug URL-safe e único, derivado de texto com acentos.
 * `ç`→`c`, `ã`→`a`, espaços→`-`.
 */
export function slugify(input: string, maxLen = 80): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[çÇ]/g, 'c')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, maxLen)
    .replace(/-+$/g, '');
}

/**
 * Gera um slug garantidamente único consultando a tabela via Prisma.
 * `excludeId` permite preservar o slug ao editar o próprio registro.
 */
export async function uniqueSlug(
  model: { findFirst: (args: unknown) => Promise<{ id: string } | null> },
  base: string,
  excludeId?: string,
): Promise<string> {
  const root = slugify(base) || 'item';
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const candidate = attempt === 0 ? root : `${root}-${attempt + 1}`;
    const found = await model.findFirst({ where: { slug: candidate }, select: { id: true } });
    if (!found || found.id === excludeId) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

/** Serializa array para JSON com limite de itens. */
export function toJsonArray(value: FormDataEntryValue | null | undefined, maxItems = 60): string {
  if (value == null) return '[]';
  const raw = String(value).trim();
  if (!raw) return '[]';
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return JSON.stringify(parsed.slice(0, maxItems));
  } catch {
    // Aceita newline-separated (textarea).
  }
  const items = raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, maxItems);
  return JSON.stringify(items);
}

/** Lê array JSON (string[]), com fallback. */
export function parseStringArray(value: unknown, maxItems = 60): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v)).slice(0, maxItems);
  if (typeof value !== 'string' || !value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map((v) => String(v)).slice(0, maxItems);
  } catch {
    /* ignore */
  }
  return value
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, maxItems);
}

/** URL absoluta http(s) ou caminho interno — bloqueia `javascript:`/`data:`. */
export function safeUrl(value: string | null | undefined): string | null {
  const v = str(value, 2000);
  if (!v) return null;
  if (v.startsWith('/') && !v.startsWith('//')) return v;
  if (/^https?:\/\//i.test(v)) return v;
  return null;
}

/** Telefone apenas dígitos (com opcional +). */
export function phoneDigits(value: string | null | undefined, max = 20): string {
  const v = str(value, 40).replace(/[^\d+]/g, '');
  return v.slice(0, max);
}

export const emailSchema = z.string().refine(isValidEmail, { message: 'E-mail inválido.' });
