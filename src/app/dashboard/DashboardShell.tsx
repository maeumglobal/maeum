'use client';

/**
 * Shell do portal (`/dashboard/*`).
 *
 * ## O que este componente corrige
 *
 * O layout anterior (`src/app/dashboard/layout.tsx`, `'use client'`) fazia a
 * checagem de papel ASSIM:
 *
 * ```ts
 * if (allowedRoute && pathname !== allowedRoute &&
 *     (pathname === '/dashboard' || !Object.values(ROLE_ROUTES).includes(pathname))) {
 *   router.push(allowedRoute);
 *   return;
 * }
 * setChecked(true);
 * ```
 *
 * Quando `pathname` ERA uma das três rotas conhecidas, a condição inteira
 * virava `false` e o `setChecked(true)` acontecia — ou seja, a proteção só valia
 * para caminhos desconhecidos. Um `customer` logado renderizava o painel admin
 * de 12 abas inteiro.
 *
 * ## Onde a autorização está AGORA
 *
 * 1. `src/proxy.ts` (edge) — assinatura do cookie + papel por rota;
 * 2. `src/app/dashboard/layout.tsx` (servidor) — `getAuth()` e redirect;
 * 3. este componente — `<AuthGuard requireRole=…>` + `RoleGate`, que não
 *    renderiza `children` enquanto o caminho não bater com a casa do papel;
 * 4. as server actions — `requireStaff()` / `requireUser()` com o escopo no
 *    WHERE do Prisma (a checagem autoritativa de dado).
 *
 * ## Por que `/dashboard/admin` não recebe este chrome
 *
 * A tela admin tem o próprio shell full-screen (`AdminSidebar` + `AdminHeader`,
 * com as 12 abas em estado local). Aninhar duas barras laterais quebraria o
 * layout e duplicaria a navegação — então, para essa seção, este componente
 * só faz o papel de gate e delega o chrome para a própria página.
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  Check,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  RefreshCw,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMountedLoad } from '@/components/admin/ui/useMountedLoad';
import AdminGuard, { type RequireRole } from '@/components/AdminGuard';
import { getNotifications, markAsRead, markAllAsRead } from '@/actions/notificationActions';
import { getUnreadChatCount } from '@/actions/chatActions';

interface ShellNotification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  linkUrl: string | null;
  createdAt: string | Date;
}

interface ShellLink {
  id: string;
  href: string;
  labelKey: string;
  icon: typeof LayoutDashboard;
  /** Só para quem tem o papel correspondente. */
  staffOnly?: boolean;
  adminOnly?: boolean;
  badge?: number;
}

/**
 * Rotas internas que EXISTEM de fato. O layout antigo listava nove itens do
 * menu da consultora apontando para telas jamais implementadas.
 */
const LINKS: ShellLink[] = [
  { id: 'panel', href: '/dashboard/admin', labelKey: 'admin.nav.backToDashboard', icon: LayoutDashboard },
  { id: 'consultora', href: '/dashboard/consultora', labelKey: 'portal.myPanel', icon: LayoutDashboard, staffOnly: true },
  { id: 'cliente', href: '/dashboard/cliente', labelKey: 'portal.myPanel', icon: LayoutDashboard },
  { id: 'conversas', href: '/admin/conversas', labelKey: 'admin.nav.conversations', icon: MessageSquare, staffOnly: true },
  { id: 'equipe', href: '/admin/equipe', labelKey: 'admin.nav.team', icon: Users, adminOnly: true },
];

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || '—'
  );
}

function ShellSkeleton({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-dvh w-full flex-col items-center justify-center gap-3 bg-background text-foreground"
    >
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
    </div>
  );
}

export default function DashboardShell({
  home,
  children,
}: {
  /** Casa do papel, resolvida no servidor pelo layout. */
  home: string;
  children: ReactNode;
}) {
  const { t, formatDate, localizedPath } = useLanguage();
  const { user, loading, isStaff, isAdmin, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [unreadChats, setUnreadChats] = useState(0);
  const [notifications, setNotifications] = useState<ShellNotification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const normalizedPath = (pathname || '/dashboard').replace(/\/+$/, '') || '/dashboard';
  const isAdminSection = normalizedPath.startsWith('/dashboard/admin');
  const isConsultantSection = normalizedPath.startsWith('/dashboard/consultora');
  // `/dashboard` (índice) não tem tela: `src/proxy.ts` já redireciona para a casa
  // do papel, mas mesmo que chegue aqui o papel exigido é o da casa do usuário.
  const requireRole: RequireRole = isAdminSection
    ? 'admin'
    : isConsultantSection
      ? 'staff'
      : home === '/dashboard/admin'
        ? 'admin'
        : home === '/dashboard/consultora'
          ? 'staff'
          : 'customer';

  const onRoleHome = normalizedPath === home || normalizedPath === '/dashboard';

  const loadNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    try {
      const res = await getNotifications({ userId: user?.id, pageSize: 8 });
      if (res.success) {
        setNotifications((res.items ?? []) as unknown as ShellNotification[]);
        setUnreadNotifications(res.unread ?? 0);
      }
    } finally {
      setNotificationsLoading(false);
    }
  }, [user?.id]);

  const loadUnreadChats = useCallback(async () => {
    if (!isStaff) {
      setUnreadChats(0);
      return;
    }
    try {
      const res = await getUnreadChatCount();
      if (res.success) setUnreadChats(res.data?.count ?? 0);
    } catch {
      // Badge nunca derruba o painel.
    }
  }, [isStaff]);

  useMountedLoad(loadNotifications);
  useMountedLoad(loadUnreadChats);

  useEffect(() => {
    if (!notificationsOpen) return;
    function onClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [notificationsOpen]);

  /**
   * `RoleGate`: enquanto o caminho não for a casa do papel, redireciona e
   * NÃO renderiza `children`. É o que impede um `customer` de ver (mesmo que
   * por um frame) o conteúdo de `/dashboard/admin`.
   *
   * O redirect acontece em efeito (nunca durante o render) e o JSX abaixo só
   * sai do skeleton quando `onRoleHome` é verdadeiro.
   */
  useEffect(() => {
    if (loading) return;
    if (onRoleHome) return;
    router.replace(home);
  }, [loading, onRoleHome, home, router]);

  const visibleLinks = LINKS.filter((link) => {
    if (link.adminOnly && !isAdmin) return false;
    if (link.staffOnly && !isStaff) return false;
    if (link.id === 'panel' && !isAdmin) return false;
    if (link.id === 'consultora' && !isStaff) return false;
    return true;
  }).map((link) =>
    link.id === 'conversas' ? { ...link, badge: unreadChats } : link,
  );

  const handleMarkAll = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadNotifications(0);
    const res = await markAllAsRead(user?.id);
    if (!res.success) await loadNotifications();
  };

  const handleMarkOne = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadNotifications((count) => Math.max(0, count - 1));
    const res = await markAsRead(id);
    if (!res.success) await loadNotifications();
  };

  const handleLogout = async () => {
    setSigningOut(true);
    await logout();
  };

  const greeting = t('portal.welcome').replace('{name}', user?.name?.split(' ')[0] ?? '—');

  const navList = (
    <nav aria-label={t('portal.menu')} className="flex flex-col gap-1">
      {visibleLinks.map((link) => {
        const Icon = link.icon;
        const active = normalizedPath === link.href || normalizedPath.startsWith(`${link.href}/`);
        const badge = link.badge ?? 0;
        return (
          <Link
            key={link.id}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            onClick={() => setMenuOpen(false)}
            className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors ${
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground/70 hover:bg-muted hover:text-foreground'
            }`}
          >
            <span className="flex min-w-0 items-center gap-3">
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{t(link.labelKey)}</span>
            </span>
            {badge > 0 && (
              <span
                className="min-w-5 rounded-full bg-destructive px-1.5 py-0.5 text-center text-[10px] font-bold text-white"
                aria-label={t('portal.unreadChats').replace('{count}', String(badge))}
              >
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const userBlock = (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-card text-xs font-bold text-accent">
        {user?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatar arbitrário gravado pelo usuário (host fora da allowlist do next.config)
          <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          initials(user?.name ?? '')
        )}
      </span>
      <span className="flex min-w-0 flex-col">
        {/* O PAPÉL NÃO É EXIBIDO: permissão é decisão de servidor, não informação de UI. */}
        <span className="truncate text-sm font-semibold text-foreground">{user?.name ?? '—'}</span>
        <span className="truncate text-[11px] text-muted-foreground">{user?.email ?? ''}</span>
      </span>
    </div>
  );

  const sidebarInner = (
    <div className="flex h-full min-h-0 flex-col gap-6 p-5">
      <Link href="/" className="flex items-center gap-2" aria-label="Maeum Global">
        <span className="text-lg font-light tracking-[0.3em] text-accent">MAEUM</span>
        <span className="text-[9px] uppercase tracking-[0.35em] text-muted-foreground">Global</span>
      </Link>

      {navList}

      <div className="mt-auto flex flex-col gap-4 border-t border-border pt-4">
        {userBlock}
        <button
          type="button"
          onClick={() => void handleLogout()}
          disabled={signingOut}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-foreground/70 transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />
          <span>{signingOut ? t('portal.signingOut') : t('portal.switchAccount')}</span>
        </button>
        <Link
          href={localizedPath('/')}
          className="flex items-center gap-2 px-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {t('portal.backToSite')}
        </Link>
      </div>
    </div>
  );

  const header = (
    <header className="sticky top-0 z-30 flex w-full items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? t('portal.closeMenu') : t('portal.openMenu')}
          className="rounded-lg border border-border p-2 text-foreground/80 transition-colors hover:bg-muted md:hidden"
        >
          {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{greeting}</p>
          <p className="truncate text-[11px] text-muted-foreground">{t('admin.nav.title')}</p>
        </div>
      </div>

      <div className="flex items-center gap-2" ref={notificationsRef}>
        <button
          type="button"
          onClick={() => void loadNotifications()}
          title={t('admin.common.refresh')}
          aria-label={t('admin.common.refresh')}
          className="rounded-lg border border-border p-2 text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
        >
          <RefreshCw className={`h-4 w-4 ${notificationsLoading ? 'animate-spin' : ''}`} />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen((open) => !open)}
            aria-expanded={notificationsOpen}
            aria-label={t('admin.header.notifications')}
            className="relative rounded-lg border border-border p-2 text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
          >
            <Bell className="h-4 w-4" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 rounded-full bg-destructive px-1 text-center text-[10px] font-bold text-white">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 z-40 mt-2 flex w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
              <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                <h2 className="text-sm font-semibold text-foreground">
                  {t('admin.header.notifications')}
                </h2>
                {unreadNotifications > 0 && (
                  <button
                    type="button"
                    onClick={() => void handleMarkAll()}
                    className="rounded-md bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    {t('admin.header.markAllRead')}
                  </button>
                )}
              </div>

              <ul className="max-h-80 overflow-y-auto">
                {notificationsLoading && notifications.length === 0 ? (
                  <li className="px-4 py-6 text-center text-xs text-muted-foreground">
                    {t('admin.header.loading')}
                  </li>
                ) : notifications.length === 0 ? (
                  <li className="px-4 py-6 text-center text-xs text-muted-foreground">
                    {t('admin.header.notificationsEmpty')}
                  </li>
                ) : (
                  notifications.map((notification) => (
                    <li
                      key={notification.id}
                      className={`border-b border-border/60 px-4 py-3 ${notification.isRead ? '' : 'bg-primary/5'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground">{notification.title}</p>
                          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                            {notification.message}
                          </p>
                          <span className="mt-1 block text-[10px] text-muted-foreground/70">
                            {formatDate(notification.createdAt, {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {notification.linkUrl && (
                            <Link
                              href={notification.linkUrl}
                              onClick={() => setNotificationsOpen(false)}
                              className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                            >
                              {t('admin.header.viewDetails')}
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                        {!notification.isRead && (
                          <button
                            type="button"
                            onClick={() => void handleMarkOne(notification.id)}
                            title={t('admin.header.markRead')}
                            aria-label={t('admin.header.markRead')}
                            className="shrink-0 rounded-md border border-border p-1.5 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>

        <span className="hidden h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border bg-card text-xs font-bold text-accent sm:flex">
          {user?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- avatar arbitrário gravado pelo usuário
            <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            initials(user?.name ?? '')
          )}
        </span>
      </div>
    </header>
  );

  return (
    <AdminGuard requireRole={requireRole}>
      {loading || !onRoleHome ? (
        <ShellSkeleton label={t('portal.checking')} />
      ) : isAdminSection ? (
        // `/dashboard/admin` tem shell próprio (AdminSidebar + AdminHeader).
        <>{children}</>
      ) : (
        <div className="flex min-h-dvh w-full bg-background text-foreground">
          <aside className="hidden shrink-0 border-r border-border bg-card/40 md:flex md:w-64 lg:w-72">
            {sidebarInner}
          </aside>

          {menuOpen && (
            <div className="fixed inset-0 z-40 md:hidden">
              <button
                type="button"
                aria-label={t('portal.closeMenu')}
                onClick={() => setMenuOpen(false)}
                className="absolute inset-0 bg-black/60"
              />
              <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-border bg-background shadow-2xl">
                {sidebarInner}
              </div>
            </div>
          )}

          <div className="flex min-w-0 flex-1 flex-col">
            {header}
            <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
          </div>
        </div>
      )}
    </AdminGuard>
  );
}