/**
 * Rate limit em memória (Map com TTL), por chave + janela deslizante fixa.
 *
 * Suficiente para uma única instância do Node. Em serverless com múltiplas
 * instâncias o limite é por instância — aceitável para antispam de formulários.
 * Trocar por Upstash/Redis antes de escalar horizontalmente.
 */
import { headers } from 'next/headers';

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

const MAX_KEYS = 10_000;

function sweep(now: number): void {
  if (buckets.size < MAX_KEYS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  // Ainda acima do teto: descarta as entradas mais antigas pela ordem de inserção.
  while (buckets.size > MAX_KEYS) {
    const first = buckets.keys().next();
    if (first.done) break;
    buckets.delete(first.value);
  }
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  /** Segundos até a janela liberar. */
  retryAfter: number;
  limit: number;
}

export interface RateLimitOptions {
  /** Máximo de requisições na janela. */
  limit?: number;
  /** Tamanho da janela em ms. */
  windowMs?: number;
}

/** 5 requisições a cada 10 minutos — padrão dos formulários públicos. */
export const FORM_LIMIT = 5;
export const FORM_WINDOW_MS = 10 * 60 * 1000;

/** Incrementa e avalia o contador da chave. */
export function rateLimit(key: string, opts: RateLimitOptions = {}): RateLimitResult {
  const limit = Math.max(1, opts.limit ?? FORM_LIMIT);
  const windowMs = Math.max(1000, opts.windowMs ?? FORM_WINDOW_MS);
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0, limit };
  }

  bucket.count += 1;
  const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
  if (bucket.count > limit) {
    return { ok: false, remaining: 0, retryAfter, limit };
  }
  return { ok: true, remaining: limit - bucket.count, retryAfter: 0, limit };
}

/** IP do visitante (x-forwarded-for → x-real-ip → fallback). */
export async function getClientIp(): Promise<string> {
  try {
    const h = await headers();
    const forwarded = h.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0]!.trim().slice(0, 50);
    return (h.get('x-real-ip') || h.get('cf-connecting-ip') || '0.0.0.0').slice(0, 50);
  } catch {
    return '0.0.0.0';
  }
}

/**
 * Atalho para formulários públicos: `5` por `10min` por IP.
 * Devolve `true` quando ainda há orçamento.
 */
export async function allowFormAction(scope: string, extra = ''): Promise<boolean> {
  const ip = await getClientIp();
  const result = rateLimit(`${scope}:${ip}${extra ? `:${extra}` : ''}`, {
    limit: FORM_LIMIT,
    windowMs: FORM_WINDOW_MS,
  });
  return result.ok;
}

/** Usado quando o limite estourou — mensagem exibida ao visitante. */
export const RATE_LIMIT_MESSAGE = 'Muitas solicitações em pouco tempo. Tente novamente em alguns minutos.';