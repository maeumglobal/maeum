import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getAuth } from '@/lib/auth';
import { buildNoIndexMetadata } from '@/lib/seo';
import type { Role } from '@/lib/session';
import DashboardShell from './DashboardShell';

/**
 * Layout do portal (`/dashboard/*`).
 *
 * ## Autorização — o que é feito ONDE
 *
 * | camada                              | o que garante                                              |
 * |-------------------------------------|------------------------------------------------------------|
 * | `src/proxy.ts` (edge)               | assinatura do cookie + redireciona por papel (307)          |
 * | **este arquivo (servidor)**         | `getAuth()` (revalida `isActive`/`sessionVersion` no banco) |
 * | `DashboardShell` + `AdminGuard`     | não renderiza `children` enquanto o papel não bater        |
 * | server actions                      | `requireStaff()`/`requireUser()` com escopo no WHERE        |
 *
 * ## O bug que este layout corrigia
 *
 * A versão anterior era `'use client'` e o guard de papel era curto-circuited:
 * quando `pathname` era uma das três rotas conhecidas a condição inteira
 * virava `false` e `setChecked(true)` acontecia — um `customer` logado
 * renderizava o painel admin de 12 abas inteiro. Além disso o layout não tinha
 * `noindex`.
 *
 * ## Por que o redirect de papel é dividido
 *
 * Um layout do App Router NÃO recebe o pathname da rota filha (`/dashboard` não
 * tem segmento dinâmico, então `params` é `{}`), logo o servidor não consegue
 * comparar "path atual × papel" aqui. O que o servidor consegue — e faz — é:
 * validar a sessão no banco e mandar para `/login` quem não tem. O
 * cruzamento papel × rota é feito pelo `RoleGate`/`AdminGuard` no cliente, que
 * não renderiza o conteúdo protegido enquanto não confirma. A checagem
 * autoritativa de dado continua sendo das server actions.
 */
export const metadata: Metadata = buildNoIndexMetadata('Portal | Maeum Global', '/dashboard');

/** `getAuth()`/`redirect()` exigem render por request: nunca cachear. */
export const dynamic = 'force-dynamic';

/** Casa de cada papel. Espelha `homeForRole` de `@/components/AdminGuard`. */
const ROLE_HOME: Record<Role, string> = {
  super_admin: '/dashboard/admin',
  admin: '/dashboard/admin',
  consultora: '/dashboard/consultora',
  customer: '/dashboard/cliente',
};

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const auth = await getAuth();

  // Sem sessão válida (cookie ausente, expirado, usuário desativado ou
  // `sessionVersion` divergente) o portal não renderiza nada.
  if (!auth) {
    redirect(`/login?next=${encodeURIComponent('/dashboard')}`);
  }

  const home = ROLE_HOME[auth.user.role] ?? ROLE_HOME.customer;

  return (
    <DashboardShell home={home}>
      {children}
    </DashboardShell>
  );
}