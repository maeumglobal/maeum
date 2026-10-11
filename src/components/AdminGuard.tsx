'use client';

/**
 * Barreira de UI para rotas internas.
 *
 * A proteção real acontece em três camadas:
 *  1. `src/proxy.ts` (edge) — sem cookie assinado não entra em /admin ou /dashboard.
 *  2. Server actions / server components — `requireUser/requireStaff/requireAdmin`
 *     revalidam `isActive`, `sessionVersion` e `role` no Postgres.
 *  3. Este componente — apenas evita mostrar a tela enquanto não há sessão,
 *     e evita piscar conteúdo protegido para quem não tem o papel.
 *
 * NUNCA confiar em papel vindo de storage: o `user` aqui vem do servidor
 * (`getAuth()` via `/api/me`) e o papel não é exibido ao usuário.
 */

import { useEffect, useMemo, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Role } from '@/lib/session';

/** Papéis aceitos, ou um grupo (`staff`/`admin`). */
export type RequireRole = Role | 'staff' | 'admin';

const STAFF_ROLES: readonly Role[] = ['super_admin', 'admin', 'consultora'];
const ADMIN_ROLES: readonly Role[] = ['super_admin', 'admin'];

/** Casa "de casa" de cada papel. */
const ROLE_HOME: Record<Role, string> = {
  super_admin: '/dashboard/admin',
  admin: '/dashboard/admin',
  consultora: '/dashboard/consultora',
  customer: '/dashboard/cliente',
};

export function homeForRole(role: Role | undefined | null): string {
  return role && ROLE_HOME[role] ? ROLE_HOME[role] : '/dashboard';
}

function matches(role: Role | undefined | null, requireRole: RequireRole): boolean {
  if (!role) return false;
  if (requireRole === 'staff') return STAFF_ROLES.includes(role);
  if (requireRole === 'admin') return ADMIN_ROLES.includes(role);
  return role === requireRole;
}

function GuardShell({ message }: { message: string }) {
  return (
    <div
      className="flex min-h-screen w-full items-center justify-center bg-background px-6 text-foreground"
      role="status"
      aria-live="polite"
    >
      <div className="flex animate-pulse flex-col items-center">
        <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

export default function AdminGuard({
  children,
  requireRole = 'staff',
}: {
  children: ReactNode;
  /** Padrão: `staff` (super_admin | admin | consultora). */
  requireRole?: RequireRole;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  const role = user?.role ?? null;
  const allowed = useMemo(() => matches(role, requireRole), [role, requireRole]);

  // Rotas internas nunca recebem prefixo de locale (ver SKIP_PREFIXES em proxy.ts),
  // por isso os redirecionamentos usam o caminho canônico.
  useEffect(() => {
    if (loading) return;

    if (!user) {
      const next = pathname && pathname !== '/login' ? pathname : '';
      const query = next ? `?next=${encodeURIComponent(next)}` : '';
      router.replace(`/login${query}`);
      return;
    }

    if (!allowed) {
      router.replace(homeForRole(role));
    }
  }, [loading, user, allowed, role, pathname, router]);

  if (loading) return <GuardShell message={t('Verificando segurança...')} />;
  if (!user || !allowed) return <GuardShell message={t('Protegendo sua conta...')} />;

  return <>{children}</>;
}