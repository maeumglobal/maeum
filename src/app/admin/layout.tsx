import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getAuth } from '@/lib/auth';
import { isStaff } from '@/lib/session';
import { buildNoIndexMetadata } from '@/lib/seo';
import AdminGuard from '@/components/AdminGuard';
import AdminNav from '@/components/admin/AdminNav';
import { getUnreadChatCountSafe } from '@/components/admin/unreadChats';

/**
 * Layout do painel interno (`/admin/*`).
 *
 * ## O que mudou
 *
 * Antes este arquivo era um segundo shell admin, paralelo e desconectado do
 * `/dashboard/admin`: nove links de navegação apontavam para o caractere `#`
 * (Minhas Consultas, Reservas, Propostas, Pagamentos, Pacotes & Experiências,
 * Materiais de Apoio, Agenda, Comissões, Relatórios) — rotas que NUNCA existiram.
 * "Dashboard" ficava ativo em TODAS as rotas e o badge de conversas era um
 * `"!"` literal.
 *
 * Agora a navegação lista APENAS rotas que existem de fato (`ADMIN_ROUTES` em
 * `src/components/admin/AdminNav.tsx`), o item ativo é derivado de
 * `usePathname()` e o badge usa a contagem real de conversas não lidas.
 *
 * A checagem de papel é feita AQUI, no servidor, a partir de `getAuth()` — que
 * revalida `isActive` e `sessionVersion` no Postgres. `src/proxy.ts` já
 * bloqueia no edge, mas o layout é a última linha de defesa da navegação: as
 * server actions também revalidam, porém antes delas a tela já renderizaria.
 */
export const metadata: Metadata = buildNoIndexMetadata('Painel | Maeum Global', '/admin');

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const auth = await getAuth();

  if (!auth) {
    redirect('/login?next=/admin');
  }

  const { role } = auth.user;

  // Cliente nunca entra no backoffice: vai para o próprio portal.
  if (role === 'customer') {
    redirect('/dashboard/cliente');
  }

  // `isStaff` cobre super_admin | admin | consultora. Papel desconhecido no
  // banco cai no mesmo tratamento de "sem acesso".
  if (!isStaff(role)) {
    redirect('/dashboard');
  }

  const unreadChats = await getUnreadChatCountSafe();

  return (
    <AdminGuard requireRole="staff">
      <div className="admin-dashboard flex min-h-screen w-full flex-col bg-[var(--admin-bg)] text-[var(--admin-text-main)] font-sans">
        <AdminNav unreadChats={unreadChats} />
        <main className="flex-1 w-full min-w-0 p-4 sm:p-8 overflow-x-hidden">{children}</main>
      </div>
    </AdminGuard>
  );
}
