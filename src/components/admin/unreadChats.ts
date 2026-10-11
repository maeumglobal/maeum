/**
 * Contagem REAL de conversas não lidas para o badge da navegação.
 *
 * Módulo server-only (sem `'use client'`): roda dentro do layout `/admin`, no
 * servidor, junto com a checagem de papel.
 *
 * ## Por que o import é tolerante
 *
 * `getUnreadChatCount` está sendo escrito em `src/actions/chatActions.ts` em
 * paralelo. Um `import { getUnreadChatCount } from '@/actions/chatActions'`
 * estático quebraria o build (`TS2305`) enquanto a action não existir, e o
 * layout inteiro deixaria de compilar — inclusive a proteção de acesso. Por
 * isso o módulo é importado dinamicamente e a função é procurada em runtime.
 *
 * TODO(chat): remover o fallback para `getAdminChats` assim que
 * `getUnreadChatCount` estiver exportada por `chatActions.ts`.
 */

/** Route das ações — o painel nunca deve quebrar por causa de um badge. */
type UnreadCountAction = () => Promise<{ success: boolean; data?: { count?: number } | unknown; unread?: number }>;

function readCount(payload: unknown): number {
  if (typeof payload !== 'object' || payload === null) return 0;
  const record = payload as Record<string, unknown>;
  if (typeof record.unread === 'number' && Number.isFinite(record.unread)) return Math.max(0, record.unread);
  const data = record.data;
  if (typeof data === 'object' && data !== null) {
    const inner = (data as Record<string, unknown>).count;
    if (typeof inner === 'number' && Number.isFinite(inner)) return Math.max(0, inner);
  }
  return 0;
}

export async function getUnreadChatCountSafe(): Promise<number> {
  try {
    const mod = (await import('@/actions/chatActions')) as unknown as Record<string, unknown>;
    const candidate = mod.getUnreadChatCount;
    if (typeof candidate === 'function') {
      const result = await (candidate as UnreadCountAction)();
      return result?.success ? readCount(result) : 0;
    }
  } catch {
    // cai no fallback abaixo
  }

  // ── Fallback temporário ──────────────────────────────────
  // `getAdminChats` já existe e traz as conversas do atendente; contamos
  // manualmente as não lidas. É aproximado (não distingue `readAt` por
  // mensagem) e SOME assim que `getUnreadChatCount` existir.
  try {
    const mod = (await import('@/actions/chatActions')) as unknown as Record<string, unknown>;
    const candidate = mod.getAdminChats;
    if (typeof candidate !== 'function') return 0;
    const result = (await (candidate as () => Promise<{ success: boolean; chats?: unknown[] }>)()) as {
      success: boolean;
      chats?: unknown[];
    };
    if (!result?.success || !Array.isArray(result.chats)) return 0;
    return result.chats.filter((chat) => {
      const record = chat as { status?: unknown; readAt?: unknown; messages?: unknown };
      if (record.status === 'closed') return false;
      if (record.readAt == null) return true;
      const messages = Array.isArray(record.messages) ? record.messages : [];
      return messages.some((message) => {
        const m = message as { readAt?: unknown; senderType?: unknown };
        return m.readAt == null && m.senderType !== 'consultant';
      });
    }).length;
  } catch {
    return 0;
  }
}
