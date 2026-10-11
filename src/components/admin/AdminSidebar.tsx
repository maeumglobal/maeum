'use client';

/**
 * Barra lateral do painel operacional (`/dashboard/admin`).
 *
 * Correção: lia `user?.avatar_url` — o campo do `AuthUser` é `avatarUrl` (o
 * alias `avatar_url` existe por compatibilidade, mas era melhor usar o nome
 * canônico). Tudo aqui virou `t()`.
 */
import { useState } from 'react';
import {
  Activity,
  ClipboardList,
  Compass,
  FileText,
  Handshake,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  UserCog,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface SubItem {
  id: string;
  labelKey: string;
}

interface NavItem {
  id: string;
  labelKey: string;
  icon: typeof LayoutDashboard;
  subItems?: SubItem[];
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard_home', labelKey: 'admin.nav.home', icon: LayoutDashboard },
  { id: 'leads', labelKey: 'admin.leads.title', icon: ClipboardList },
  { id: 'users', labelKey: 'admin.users.title', icon: UserCog },
  { id: 'reservas', labelKey: 'admin.book.title', icon: Package },
  {
    id: 'vendas',
    labelKey: 'admin.nav.groupSales',
    icon: Handshake,
    subItems: [{ id: 'propostas', labelKey: 'admin.props.title' }],
  },
  {
    id: 'produtos',
    labelKey: 'admin.nav.groupCatalog',
    icon: Compass,
    subItems: [
      { id: 'jornadas', labelKey: 'admin.jrn.title' },
      { id: 'experiencias', labelKey: 'admin.exp.title' },
      { id: 'kbeauty', labelKey: 'admin.kbeauty.title' },
      { id: 'categorias', labelKey: 'admin.cat.title' },
      { id: 'pacotes', labelKey: 'admin.pkg.title' },
      { id: 'parceiros', labelKey: 'admin.partner.title' },
      { id: 'intercambio', labelKey: 'admin.exchange.title' },
    ],
  },
  {
    id: 'cms',
    labelKey: 'admin.nav.groupContent',
    icon: FileText,
    subItems: [
      { id: 'blog', labelKey: 'admin.blog.title' },
      { id: 'depoimentos_faq', labelKey: 'admin.tf.tabFaq' },
      { id: 'paginas', labelKey: 'admin.cmsPages.title' },
    ],
  },
  { id: 'logs', labelKey: 'admin.logs.title', icon: Activity },
  {
    id: 'config',
    labelKey: 'admin.nav.groupSettings',
    icon: Settings,
    subItems: [
      { id: 'sitecontent', labelKey: 'admin.cms.title' },
      { id: 'visual', labelKey: 'admin.cfg.title' },
      { id: 'navegacao', labelKey: 'admin.navEditor.title' },
    ],
  },
];

export default function AdminSidebar({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (key: string) => {
    setExpandedMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const initials = (name: string): string =>
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || '—';

  return (
    <aside className="flex h-screen w-[280px] shrink-0 flex-col border-r border-[var(--admin-border)] bg-[var(--admin-bg)] font-sans">
      <div className="flex flex-col items-center justify-center p-6 pb-2">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mb-3 h-12 w-12 text-[var(--admin-primary)]"
          aria-hidden="true"
        >
          <path d="M12 2L2 22h20L12 2z" />
          <path d="M12 12l-5 8h10l-5-8z" />
        </svg>
        <div className="text-center">
          <h1 className="mb-1 text-sm font-bold uppercase tracking-widest text-[var(--admin-primary)]">Maeum</h1>
          <h2 className="mb-2 text-[10px] font-light uppercase tracking-[0.2em] text-[var(--admin-primary)]">
            Global
          </h2>
          <div className="rounded bg-[var(--admin-accent-red)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
            {t('admin.nav.title')}
          </div>
        </div>
      </div>

      <nav aria-label={t('admin.nav.adminPanel')} className="flex-1 overflow-y-auto px-4 pb-4">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeTab === item.id || (item.subItems?.some((sub) => sub.id === activeTab) ?? false);
            const isExpanded = expandedMenus[item.id] ?? isActive;

            return (
              <li key={item.id} className="flex flex-col">
                <button
                  type="button"
                  onClick={() => (item.subItems ? toggleMenu(item.id) : onTabChange(item.id))}
                  aria-expanded={item.subItems ? isExpanded : undefined}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-all duration-200 ${
                    isActive && !item.subItems
                      ? 'bg-[var(--admin-border)] text-[var(--admin-text-main)]'
                      : 'text-[var(--admin-text-muted)] hover:bg-[var(--admin-border)]/50 hover:text-[var(--admin-text-main)]'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive && !item.subItems ? 'text-[var(--admin-primary)]' : ''
                      }`}
                    />
                    <span className="truncate font-medium">{t(item.labelKey)}</span>
                  </span>
                </button>

                <AnimatePresence>
                  {item.subItems && isExpanded && (
                    <motion.ul
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-1 flex flex-col gap-1 overflow-hidden pl-9"
                    >
                      {item.subItems.map((sub) => (
                        <li key={sub.id}>
                          <button
                            type="button"
                            onClick={() => onTabChange(sub.id)}
                            className={`w-full py-1.5 text-left text-xs transition-colors ${
                              activeTab === sub.id
                                ? 'font-semibold text-[var(--admin-primary)]'
                                : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)]'
                            }`}
                          >
                            {t(sub.labelKey)}
                          </button>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-[var(--admin-border)] p-4">
        <div className="mb-4 flex items-center gap-3 px-2">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--admin-border)] text-[11px] font-bold text-[var(--admin-primary)]">
            {user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- avatar arbitrário vindo do painel (host fora da allowlist do next.config)
              <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              initials(user?.name ?? '')
            )}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-bold text-[var(--admin-text-main)]">
              {user?.name ?? '—'}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-[var(--admin-text-muted)]">
              {user?.role ?? '—'}
            </span>
          </span>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="flex w-full items-center gap-2 px-2 py-2 text-xs text-[var(--admin-text-muted)] transition-colors hover:text-[var(--admin-text-main)]"
        >
          <LogOut className="w-4 h-4" />
          <span>{t('admin.nav.logout')}</span>
        </button>
      </div>
    </aside>
  );
}
