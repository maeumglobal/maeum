import React from 'react';
import type { Metadata } from 'next';
import AdminGuard from '@/components/AdminGuard';
import { buildNoIndexMetadata } from '@/lib/seo';
import ConversasClient from './ConversasClient';

/**
 * Inbox de conversas — rota interna.
 *
 * - Server Component: a proteção real está em `src/proxy.ts` (edge) e nas
 *   server actions (`requireStaff`); o `AdminGuard` evita o flash de conteúdo
 *   protegido para quem não tem o papel.
 * - `force-dynamic`: a lista depende de cookie de sessão e nunca deve ser
 *   cacheada nem indexada.
 * - `?chat=<id>` vem do `linkUrl` das notificações (`notifyUser`) para abrir
 *   direto na conversa.
 */
export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  return buildNoIndexMetadata('Conversas | Maeum Global', '/admin/conversas');
}

export default async function AdminConversasPage({
  searchParams,
}: {
  searchParams?: Promise<{ chat?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params?.chat) ? params?.chat[0] : params?.chat;
  const initialChatId = typeof raw === 'string' && raw.length >= 8 && raw.length <= 64 ? raw : undefined;

  return (
    <AdminGuard requireRole="staff">
      <div className="flex h-full min-h-0 w-full flex-col p-4 sm:p-8">
        <ConversasClient initialChatId={initialChatId} />
      </div>
    </AdminGuard>
  );
}
