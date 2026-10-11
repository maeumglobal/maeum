'use client';

/**
 * Navegação do painel interno (`/admin/*`).
 *
 * ## Mapa de rotas reais
 *
 * O layout anterior listava nove itens que apontavam para `href="#"` — telas
 * que nunca foram implementadas. Aqui só entram rotas que existem hoje:
 *
 * | rota                  | quem entra                      | o que faz                          |
 * |-----------------------|---------------------------------|------------------------------------|
 * | `/dashboard/admin`    | super_admin, admin              | painel operacional completo (CRM, reservas, catálogo, CMS, logs) |
 * | `/admin/conversas`    | super_admin, admin, consultora  | caixa de entrada do chat            |
 * | `/admin/equipe`       | super_admin, admin              | gestão de acessos da equipe        |
 *
 * Tudo o mais que o painel mostra (reservas, propostas, jornadas, blog, FAQ…)
 * é uma ABA dentro de `/dashboard/admin`, não uma rota — por isso não entra
 * aqui. Deixar isso explícito era parte do bug: os itens-mortos prometiam telas
 * que não existiam.
 */
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, LogOut, MessageSquare, Users, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

export type AdminRouteId = 'dashboard' | 'conversas' | 'equipe';

export interface AdminRoute {
  id: AdminRouteId;
  href: string;
  labelKey: string;
  fallbackLabel: string;
  icon: typeof LayoutDashboard;
  /** Só aparece para papéis adicionais. */
  adminOnly?: boolean;
}

/** Fonte única de verdade da navegação interna. */
export const ADMIN_ROUTES: readonly AdminRoute[] = [
  {
    id: 'dashboard',
    href: '/dashboard/admin',
    labelKey: 'admin.nav.backToDashboard',
    fallbackLabel: 'Ir para o painel completo',
    icon: LayoutDashboard,
  },
  {
    id: 'conversas',
    href: '/admin/conversas',
    labelKey: 'admin.nav.conversations',
    fallbackLabel: 'Conversas',
    icon: MessageSquare,
  },
  {
    id: 'equipe',
    href: '/admin/equipe',
    labelKey: 'admin.nav.team',
    fallbackLabel: 'Equipe',
    icon: Users,
    adminOnly: true,
  },
];

export default function AdminNav({ unreadChats = 0 }: { unreadChats?: number }) {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuth();
  const { t } = useLanguage();
  const [signingOut, setSigningOut] = useState(false);

  const visible = ADMIN_ROUTES.filter((route) => !route.adminOnly || isAdmin);

  const isActive = (route: AdminRoute): boolean => {
    if (route.id === 'dashboard') return pathname.startsWith('/dashboard/admin');
    return pathname === route.href || pathname.startsWith(`${route.href}/`);
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-[var(--admin-border)] bg-[var(--admin-card)]">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Maeum Global">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center border-2 border-[var(--admin-primary)]"
          >
            <span className="h-3 w-3 border border-[var(--admin-primary)]" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-sm font-bold tracking-[0.3em] text-[var(--admin-primary)]">MAEUM</span>
            <span className="text-[8px] tracking-[0.4em] text-[var(--admin-text-muted)]">GLOBAL</span>
          </span>
        </Link>

        <nav aria-label={t('admin.nav.adminPanel')} className="flex flex-1 flex-wrap items-center gap-2">
          {visible.map((route) => {
            const Icon = route.icon;
            const active = isActive(route);
            const showBadge = route.id === 'conversas' && unreadChats > 0;
            return (
              <Link
                key={route.id}
                href={route.href}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-[var(--admin-primary)] text-black'
                    : 'border border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:bg-[var(--admin-border)]/40 hover:text-[var(--admin-text-main)]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t(route.labelKey) || route.fallbackLabel}
                {showBadge && (
                  <span
                    className="min-w-5 rounded-full bg-[var(--admin-accent-red)] px-1.5 py-0.5 text-center text-[10px] font-bold text-white"
                    aria-label={t('admin.header.unread').replace('{count}', String(unreadChats))}
                  >
                    {unreadChats > 99 ? '99+' : unreadChats}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <span className="block max-w-[160px] truncate text-xs font-semibold text-[var(--admin-text-main)]">
              {user?.name ?? '—'}
            </span>
            <span className="block text-[10px] uppercase tracking-wider text-[var(--admin-text-muted)]">
              {user?.role ?? ''}
            </span>
          </div>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="hidden h-9 w-9 items-center justify-center rounded-lg border border-[var(--admin-border)] text-[var(--admin-text-muted)] transition-colors hover:text-[var(--admin-text-main)] sm:inline-flex"
            title={t('admin.nav.home')}
            aria-label={t('admin.nav.home')}
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            type="button"
            onClick={() => {
              setSigningOut(true);
              void logout();
            }}
            disabled={signingOut}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--admin-border)] px-3 text-xs font-semibold text-[var(--admin-text-muted)] transition-colors hover:text-[var(--admin-text-main)] disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">{t('admin.nav.logout')}</span>
          </button>
        </div>
      </div>

      <p className="mx-auto w-full max-w-7xl px-4 pb-3 text-[10px] text-[var(--admin-text-muted)] sm:px-6">
        {t('admin.nav.onlyRealRoutes')}
      </p>
    </header>
  );
}
