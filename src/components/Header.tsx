'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, User, LogOut, LayoutDashboard, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { FlagES, FlagPT, FlagEN } from '@/components/Flags';
import AuthModal, { type AuthMode } from '@/components/AuthModal';
import { useMedia, useNavigation } from '@/contexts/SiteContentContext';
import { navLabel, isExternalNav, topLevelItems } from '@/lib/cmsData';
import SmartImage from '@/components/SmartImage';
import { localizedPath } from '@/i18n/config';

/**
 * Menu de fallback.
 *
 * Usado apenas enquanto o painel "Configurações > Navegação" não tiver nenhum
 * item ativo em `main` (banco vazio, site recém-instalado ou banco fora do ar).
 * Assim o site nunca fica sem menu e o que o administrador configura tem
 * prioridade sobre a lista embutida.
 */
const FALLBACK_MAIN = [
  { key: 'COREIA DO SUL', href: '/' },
  { key: 'Destinos', href: '/destinos' },
  { key: 'Experiências', href: '/experiencias' },
  { key: 'Intercâmbio', href: '/coreia-do-sul/intercambio' },
  { key: 'Pacotes', href: '/pacotes' },
  { key: 'Jornadas', href: '/jornadas' },
  { key: 'Sobre Nós', href: '/sobre' },
  { key: 'Contato', href: '/contato' },
];

const ROLE_HOME: Record<string, string> = {
  super_admin: '/dashboard/admin',
  admin: '/dashboard/admin',
  consultora: '/dashboard/consultora',
  customer: '/dashboard/cliente',
};

interface NavLink {
  key: string;
  label: string;
  href: string;
  external: boolean;
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const { locale, setLocale, t, isModalOpen, setIsModalOpen } = useLanguage();
  const siteLogo = useMedia('site_logo');
  const navFromDb = useNavigation('main');

  /*
   * Menu vem do painel (tabela `NavigationItem`) e já traz `labelEn`/`labelEs`.
   * Só caímos no fallback estático quando não há nenhum item ativo.
   */
  const navItems = useMemo<NavLink[]>(() => {
    const fromDb = topLevelItems(navFromDb);
    if (fromDb.length > 0) {
      // Deduplica por label normalizado (evita itens repetidos no banco/painel)
      const seen = new Set<string>();
      return fromDb
        .map((item) => {
          const external = isExternalNav(item.url);
          return {
            key: item.id,
            label: navLabel(item, locale),
            href: external ? item.url : localizedPath(item.url, locale),
            external,
          };
        })
        .filter((item) => {
          const norm = item.label.trim().toLowerCase();
          if (seen.has(norm)) return false;
          seen.add(norm);
          return true;
        });
    }
    return FALLBACK_MAIN.map((item) => ({
      key: item.key,
      label: t(item.key),
      href: localizedPath(item.href, locale),
      external: false,
    }));
  }, [navFromDb, locale, t]);

  const closeAll = useCallback(() => {
    setMobileMenuOpen(false);
    setIsUserMenuOpen(false);
    setIsModalOpen(false);
  }, [setIsModalOpen]);

  /*
   * Fecha os menus ao navegar. Em vez de copiar `pathname` para o estado dentro
   * de um efeito (render em cascata), ajustamos o estado durante o render — o
   * padrão oficial do React para "derivar de props".
   */
  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    if (mobileMenuOpen) setMobileMenuOpen(false);
    if (isUserMenuOpen) setIsUserMenuOpen(false);
    if (isModalOpen) setIsModalOpen(false);
  }

  // ESC fecha o que estiver aberto.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      closeAll();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [closeAll]);

  // Clique fora dos popovers.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (isModalOpen && !target.closest('[data-language-selector]')) setIsModalOpen(false);
      if (isUserMenuOpen && !target.closest('[data-user-selector]')) setIsUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isModalOpen, setIsModalOpen, isUserMenuOpen]);

  // Sombra da barra ao rolar (listener passivo, um único registro).
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const userMenuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!isUserMenuOpen) return;
    const first = userMenuRef.current?.querySelector<HTMLElement>('a, button');
    first?.focus();
  }, [isUserMenuOpen]);

  const openAuth = (mode: AuthMode) => {
    setAuthMode(mode);
    setShowAuthModal(true);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    closeAll();
    await logout();
    // Rotas internas nunca recebem prefixo de locale (ver SKIP_PREFIXES).
    router.push('/');
  };

  const dashboardHref = user ? (ROLE_HOME[user.role] ?? '/dashboard') : '/login';
  const navLinkClass = (active: boolean) =>
    `whitespace-nowrap text-[10px] font-bold uppercase tracking-widest transition-colors hover:text-[#C8A27C] xl:text-[11px] ${
      active ? 'text-[#C8A27C]' : 'text-foreground/80'
    }`;
  const navLinkMobileClass = (active: boolean) =>
    `text-xs font-bold uppercase tracking-widest hover:text-[#C8A27C] ${
      active ? 'text-[#C8A27C]' : 'text-foreground'
    }`;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 w-full px-6 transition-all duration-300 md:px-12 ${
          scrolled
            ? 'border-b border-border/40 bg-background/95 py-3 backdrop-blur'
            : 'border-b border-transparent bg-transparent py-5'
        }`}
      >
        <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between">
          <Link href={localizedPath('/', locale)} className="flex shrink-0 items-center py-1">
            <SmartImage
              src={siteLogo || '/images/logo.png'}
              alt={t('Logotipo da Maeum Global')}
              width={170}
              height={55}
              className="h-10 w-auto object-contain sm:h-12"
              priority
            />
          </Link>

          <nav
            aria-label={t('Menu')}
            className="hidden flex-nowrap items-center gap-3 lg:flex xl:gap-6 2xl:gap-8"
          >
            {navItems.map((item) =>
              item.external ? (
                <a
                  key={item.key}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={navLinkClass(false)}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={pathname === item.href ? 'page' : undefined}
                  className={navLinkClass(pathname === item.href)}
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          <div className="hidden shrink-0 items-center gap-3 lg:flex xl:gap-4">
            <div className="relative" data-language-selector>
              <button
                type="button"
                onClick={() => setIsModalOpen(!isModalOpen)}
                aria-haspopup="menu"
                aria-expanded={isModalOpen}
                aria-label={t('Escolher idioma')}
                className="flex items-center gap-1.5 rounded-full border border-transparent px-2 py-1.5 text-foreground/80 transition-colors hover:border-border hover:text-primary"
              >
                {locale === 'es' ? (
                  <FlagES title={t('Español')} />
                ) : locale === 'pt' ? (
                  <FlagPT title={t('Português')} />
                ) : (
                  <FlagEN title={t('English')} />
                )}
                <span className="text-xs font-bold">{locale.toUpperCase()}</span>
              </button>
              {isModalOpen && (
                <div
                  role="menu"
                  aria-label={t('Escolher idioma')}
                  className="absolute right-0 top-full z-50 mt-2 w-48 animate-in fade-in slide-in-from-top-2 rounded-xl border border-border bg-card p-2 shadow-lg duration-150"
                >
                  <div className="flex flex-col gap-1">
                    {(
                      [
                        { code: 'pt', label: t('Português'), Flag: FlagPT },
                        { code: 'es', label: t('Espanhol'), Flag: FlagES },
                        { code: 'en', label: t('Inglês'), Flag: FlagEN },
                      ] as const
                    ).map(({ code, label, Flag }) => (
                      <button
                        key={code}
                        type="button"
                        role="menuitemradio"
                        aria-checked={locale === code}
                        onClick={() => setLocale(code)}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                          locale === code
                            ? 'bg-accent/15 text-accent'
                            : 'text-foreground/80 hover:bg-white/5 hover:text-foreground'
                        }`}
                      >
                        <Flag title={label} />
                        <span>{label}</span>
                        {locale === code && (
                          <Check className="ml-auto h-3.5 w-3.5" aria-hidden="true" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {user ? (
              <div className="relative" data-user-selector>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  aria-haspopup="menu"
                  aria-expanded={isUserMenuOpen}
                  aria-label={t('Opções da conta')}
                  className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs transition-all ${
                    isUserMenuOpen ? 'border-accent/30 bg-accent/15' : 'border-border hover:bg-white/5'
                  }`}
                >
                  <User className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  <span className="max-w-[100px] truncate text-foreground">{user.name}</span>
                </button>
                {isUserMenuOpen && (
                  <div
                    ref={userMenuRef}
                    role="menu"
                    aria-label={t('Minha conta')}
                    className="absolute right-0 top-full z-50 mt-2 w-48 animate-in fade-in slide-in-from-top-2 rounded-xl border border-border bg-card p-2 shadow-lg duration-150"
                  >
                    <div className="flex flex-col gap-1">
                      <Link
                        href={dashboardHref}
                        onClick={() => setIsUserMenuOpen(false)}
                        role="menuitem"
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-foreground/80 transition-colors hover:bg-accent/15 hover:text-accent"
                      >
                        <LayoutDashboard className="h-4 w-4 text-accent" aria-hidden="true" />
                        <span>{t('Meu Painel')}</span>
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        role="menuitem"
                        className="mt-1 flex w-full items-center gap-2 rounded-lg border-t border-border px-3 py-2 text-left text-xs text-red-500/80 transition-colors hover:bg-red-500/10 hover:text-red-500"
                      >
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                        <span>{t('Sair da Conta')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => openAuth('login')}
                  className="px-3 py-1.5 text-xs font-semibold text-foreground/80 transition-colors hover:text-primary"
                >
                  {t('Entrar')}
                </button>
                <button
                  type="button"
                  onClick={() => openAuth('register')}
                  className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition-transform hover:scale-105 hover:bg-accent-hover"
                >
                  {t('Cadastrar')}
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            className="p-2 text-foreground/80 hover:text-primary lg:hidden"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={mobileMenuOpen ? t('Fechar menu') : t('Abrir menu')}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>

        <div
          id="mobile-menu"
          hidden={!mobileMenuOpen}
          className="fixed inset-x-0 top-[60px] flex animate-in fade-in slide-in-from-top-5 flex-col gap-6 border-b border-border bg-background p-6 shadow-lg duration-200 lg:hidden"
        >
          <nav aria-label={t('Menu')} className="flex flex-col gap-4">
            {navItems.map((item) =>
              item.external ? (
                <a
                  key={item.key}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                  className={navLinkMobileClass(false)}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={pathname === item.href ? 'page' : undefined}
                  className={navLinkMobileClass(pathname === item.href)}
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          <div className="h-px bg-border/50" />

          <div
            className="flex justify-center gap-4 py-2"
            role="group"
            aria-label={t('Escolher idioma')}
          >
            {(
              [
                { code: 'pt', label: 'PT', Flag: FlagPT },
                { code: 'es', label: 'ES', Flag: FlagES },
                { code: 'en', label: 'EN', Flag: FlagEN },
              ] as const
            ).map(({ code, label, Flag }) => (
              <button
                key={code}
                type="button"
                onClick={() => setLocale(code)}
                aria-pressed={locale === code}
                aria-label={t(code === 'pt' ? 'Português' : code === 'es' ? 'Español' : 'English')}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors ${
                  locale === code
                    ? 'border border-accent/20 bg-accent/15 text-accent'
                    : 'border border-transparent text-foreground/60'
                }`}
              >
                <Flag title={label} />
                <span className="text-xs font-bold">{label}</span>
              </button>
            ))}
          </div>

          <div className="h-px bg-border/50" />

          {user ? (
            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {t('Sessão: {nome}').replace('{nome}', user.name)}
              </p>
              <Link
                href={dashboardHref}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 py-1 text-sm text-foreground/80"
              >
                <LayoutDashboard className="h-4 w-4 text-accent" aria-hidden="true" />
                {t('Meu Painel')}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 py-1 text-left text-sm text-red-500"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                {t('Sair da Conta')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => openAuth('login')}
                className="rounded-xl border border-border py-2.5 text-center text-xs font-bold text-secondary transition-all hover:bg-muted"
              >
                {t('Entrar')}
              </button>
              <button
                type="button"
                onClick={() => openAuth('register')}
                className="rounded-xl bg-primary py-2.5 text-center text-xs font-bold text-white transition-all hover:bg-accent-hover"
              >
                {t('Cadastrar')}
              </button>
            </div>
          )}
        </div>
      </header>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
        defaultMode={authMode}
      />
    </>
  );
}
