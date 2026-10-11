/**
 * Utilitários compartilhados pela camada de server actions.
 *
 * Existe para evitar 12 cópias idênticas de (a) normalização de entrada,
 * (b) paginação e (c) mapeamento de erro. É server-only: NÃO cria RPC para o
 * cliente porque não vive num módulo `'use server'`.
 *
 * REGRA: nenhuma mensagem de erro devolvida ao cliente pode conter nome de
 * tabela, constraint, conexão ou stack — `fail()` traduz tudo para texto
 * genérico ou para as traduções de Prisma abaixo.
 */
import { Prisma } from '@prisma/client';
import { AuthError } from '@/lib/auth';

export interface ActionResult<T = undefined> {
  success: boolean;
  error?: string;
  data?: T;
}

/** Retorno padrão das listagens paginadas (`items` + `data` legado). */
export type ListResult<T> = ActionResult<T[]> & {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  /** alias legado de `totalPages` (componentes antigos) */
  pages: number;
};

/** Entrada aceita pelas actions: FormData (preferido) ou objeto simples. */
export type ActionInput =
  | FormData
  | Record<string, unknown>
  | null
  | undefined;

export const GENERIC_ERROR = 'Não foi possível concluir a operação. Tente novamente.';
export const SESSION_ERROR = 'Sua sessão expirou. Faça login novamente.';
export const FORBIDDEN_ERROR = 'Você não tem permissão para esta ação.';

/**
 * Converte FormData (ou objeto simples vindo de um componente cliente legado)
 * em um registro de `FormDataEntryValue` compatível com `src/lib/validate.ts`.
 *
 * Campos repetidos (checkbox, multi-select) são unidos por `\n` — que é
 * exatamente o formato que `parseStringArray`/`toJsonArray` entendem.
 */
export function pick(input: ActionInput): Record<string, FormDataEntryValue | undefined> {
  const out: Record<string, FormDataEntryValue | undefined> = {};
  if (!input) return out;

  const set = (key: string, value: FormDataEntryValue) => {
    const prev = out[key];
    if (prev === undefined) out[key] = value;
    else if (Array.isArray(prev)) out[key] = [...(prev as unknown[]), value].join('\n');
    else out[key] = `${String(prev)}\n${String(value)}`;
  };

  if (typeof FormData !== 'undefined' && input instanceof FormData) {
    input.forEach((value, key) => set(key, value));
    return out;
  }

  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === null || item === undefined) continue;
        set(key, typeof item === 'object' ? (JSON.stringify(item) as unknown as FormDataEntryValue) : (String(item) as FormDataEntryValue));
      }
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      out[key] = String(value);
    } else if (typeof value === 'object') {
      out[key] = JSON.stringify(value);
    } else if (typeof value === 'string' || value instanceof File) {
      out[key] = value;
    }
  }
  return out;
}

/** Normaliza paginação: page >= 1, pageSize entre 1 e 100 (default 20). */
export function paginate(page: unknown, pageSize: unknown): {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
} {
  const rawPage = Number(typeof page === 'string' ? page : (page ?? 1));
  const rawSize = Number(typeof pageSize === 'string' ? pageSize : (pageSize ?? 20));
  const safePage = Number.isFinite(rawPage) ? Math.floor(rawPage) : 1;
  const safeSize = Number.isFinite(rawSize) ? Math.floor(rawSize) : 20;
  const finalPage = Math.max(1, Math.min(100000, safePage));
  const finalSize = Math.max(1, Math.min(100, safeSize || 20));
  return { page: finalPage, pageSize: finalSize, skip: (finalPage - 1) * finalSize, take: finalSize };
}

/** Metadados de paginação no formato padrão do BRIEF. */
export function pageMeta(total: number, page: number, pageSize: number) {
  return {
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export function ok<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

/**
 * Adapta um delegate do Prisma para a assinatura enxuta de `uniqueSlug`
 * (que só precisa de `findFirst`). Evita espalhar `as never` pelas actions.
 */
export function slugSource<T extends object>(model: T): { findFirst: (args: unknown) => Promise<{ id: string } | null> } {
  return model as unknown as { findFirst: (args: unknown) => Promise<{ id: string } | null> };
}

/**
 * Traduz exceções para mensagens amigáveis.
 * - AuthError  → 401/403 genéricos
 * - P2002/P2003/P2025 → texto de negócio
 * - qualquer outra coisa → `fallback` (o erro real só vai para o log).
 */
export function fail<T = undefined>(error: unknown, fallback: string = GENERIC_ERROR): ActionResult<T> {
  if (error instanceof AuthError) {
    return { success: false, error: error.status === 403 ? FORBIDDEN_ERROR : SESSION_ERROR };
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') return { success: false, error: 'Registro duplicado.' };
    if (error.code === 'P2003') return { success: false, error: 'Vinculação inválida.' };
    if (error.code === 'P2025') return { success: false, error: 'Não encontrado.' };
  }
  console.error('[action] falha:', error instanceof Error ? error.message : error);
  return { success: false, error: fallback };
}

/** `fail` para quando a action é pública: nunca revela motivo interno. */
export function failPublic<T = undefined>(fallback: string = GENERIC_ERROR): ActionResult<T> {
  return { success: false, error: fallback };
}

/** Extrai a mensagem da primeira issue do zod (zod v4). */
export function zodMessage(error: { issues?: Array<{ message?: string }> }): string {
  return error.issues?.[0]?.message || 'Dados inválidos.';
}