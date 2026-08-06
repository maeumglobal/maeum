'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, User, LogOut, LayoutDashboard, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { FlagES, FlagPT, FlagEN } from '@/components/Flags';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import AuthModal from '@/components/AuthModal';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const { user: currentUser, logout } = useAuth();
  const { locale, setLocale, t, isModalOpen, setIsModalOpen } = useLanguage();

  // Close modals when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (isModalOpen && !target.closest('[data-language-selector]')) {
        setIsModalOpen(false);
      }
      if (isUserMenuOpen && !target.closest('[data-user-selector]')) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isModalOpen, setIsModalOpen, isUserMenuOpen]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const getDashboardLink = () => {
    if (!currentUser) return '/login';
    if (currentUser.role === 'super_admin' || currentUser.role === 'admin') return '/dashboard/admin';
    if (currentUser.role === 'consultora') return '/dashboard/consultora';
    return '/dashboard/cliente';
  };

  const navItems = [
    { label: t('Home'), href: '/' },
    { label: t('Destinos'), href: '/destinos' },
    { label: t('Experiências'), href: '/experiencias' },
    { label: t('Intercâmbio'), href: '/coreia-do-sul/intercambio' },
    { label: t('Pacotes'), href: '/pacotes' },
    { label: t('Sobre Nós'), href: '/sobre' },
    { label: t('Contato'), href: '/contato' }
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 px-4 md:px-8 py-3 bg-transparent relative">
        <div className="absolute inset-0 -z-10 bg-background/95 backdrop-blur" />
      <div className="mx-auto flex max-w-7xl items-center justify-between relative z-10">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 relative">
          <span className="opacity-0 font-heading text-2xl font-bold tracking-widest select-none" aria-hidden="true">
            MAEUM
          </span>
          <div className="absolute inset-0 flex items-center">
            <Image
              src="/images/logo.png"
              alt="MAEUM Logo"
              width={160}
              height={60}
              className="h-[60px] w-auto object-contain"
              priority
            />
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === item.href ? 'text-primary' : 'text-foreground/80'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-4">
          
          {/* Language Selector */}
          <div className="relative">
            <button 
              onClick={() => setIsModalOpen(!isModalOpen)}
              className="flex items-center gap-1.5 text-foreground/80 hover:text-primary transition-colors px-2 py-1.5 border border-transparent hover:border-border rounded-full"
              data-language-selector
            >
              {locale === 'es' ? <FlagES /> : locale === 'pt' ? <FlagPT /> : <FlagEN />}
              <span className="text-xs font-bold">{locale === 'es' ? 'ES' : locale === 'pt' ? 'PT' : 'EN'}</span>
            </button>
            
            {/* Language Modal */}
            {isModalOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border bg-card p-2 shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-150" data-language-selector>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => setLocale('pt')}
                    className={`flex items-center gap-2.5 w-full px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${locale === 'pt' ? 'bg-accent/15 text-accent' : 'text-foreground/80 hover:text-foreground hover:bg-white/5'}`}
                  >
                    <FlagPT />
                    <span>{t('Português')}</span>
                    {locale === 'pt' && <Check className="h-3.5 w-3.5 ml-auto" />}
                  </button>
                  <button
                    onClick={() => setLocale('es')}
                    className={`flex items-center gap-2.5 w-full px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${locale === 'es' ? 'bg-accent/15 text-accent' : 'text-foreground/80 hover:text-foreground hover:bg-white/5'}`}
                  >
                    <FlagES />
                    <span>{t('Espanhol')}</span>
                    {locale === 'es' && <Check className="h-3.5 w-3.5 ml-auto" />}
                  </button>
                  <button
                    onClick={() => setLocale('en')}
                    className={`flex items-center gap-2.5 w-full px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${locale === 'en' ? 'bg-accent/15 text-accent' : 'text-foreground/80 hover:text-foreground hover:bg-white/5'}`}
                  >
                    <FlagEN />
                    <span>{t('Inglês')}</span>
                    {locale === 'en' && <Check className="h-3.5 w-3.5 ml-auto" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User profile dropdown or Login Actions */}
          {currentUser ? (
            <div className="relative" data-user-selector>
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={`flex items-center gap-1.5 px-4 py-1.5 border rounded-full text-xs transition-all ${isUserMenuOpen ? 'bg-accent/15 border-accent/30' : 'border-border hover:bg-white/5'}`}
              >
                <User className="h-3.5 w-3.5 text-accent" />
                <span className="max-w-[100px] truncate text-foreground">{currentUser.name}</span>
              </button>
              
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border bg-card p-2 shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex flex-col gap-1">
                    <Link
                      href={
                        currentUser.role === 'super_admin' || currentUser.role === 'admin'
                          ? '/dashboard/admin'
                          : currentUser.role === 'consultora'
                          ? '/dashboard/consultora'
                          : '/dashboard/cliente'
                      }
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-accent/15 hover:text-accent transition-colors flex items-center gap-2 text-foreground/80"
                    >
                      <LayoutDashboard className="h-4 w-4 text-accent" />
                      <span>{t('Meu Painel')}</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-colors flex items-center gap-2 text-red-500/80 border-t border-border mt-1"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>{t('Sair da Conta')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                className="text-xs font-semibold text-foreground/80 hover:text-primary px-3 py-1.5 transition-colors"
              >
                {t('Entrar')}
              </button>
              <button
                onClick={() => { setAuthMode('register'); setShowAuthModal(true); }}
                className="bg-primary hover:bg-accent-hover text-white text-xs font-semibold px-4 py-2 rounded-full shadow-sm transition-transform hover:scale-105"
              >
                {t('Cadastrar')}
              </button>
            </div>
          )}

          <Link href="/contato">
            <Button size="sm" className="bg-primary hover:bg-accent-hover text-white text-xs font-semibold rounded-full px-5">
              {t('SOLICITAR ORÇAMENTO')}
            </Button>
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <button
          className="md:hidden text-foreground/80 hover:text-primary"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[60px] bg-background border-b border-border shadow-lg p-6 flex flex-col gap-6 animate-in fade-in slide-in-from-top-5 duration-200">
          <div className="flex flex-col gap-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-base font-semibold hover:text-primary ${
                  pathname === item.href ? 'text-primary' : 'text-foreground'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="h-px bg-border/50" />

          {/* Mobile Language Selector */}
          <div className="flex justify-center gap-4 py-2">
            <button
              onClick={() => setLocale('pt')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${locale === 'pt' ? 'bg-accent/15 text-accent border border-accent/20' : 'text-foreground/60 border border-transparent'}`}
            >
              <FlagPT />
              <span className="text-xs font-bold">PT</span>
            </button>
            <button
              onClick={() => setLocale('es')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${locale === 'es' ? 'bg-accent/15 text-accent border border-accent/20' : 'text-foreground/60 border border-transparent'}`}
            >
              <FlagES />
              <span className="text-xs font-bold">ES</span>
            </button>
            <button
              onClick={() => setLocale('en')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${locale === 'en' ? 'bg-accent/15 text-accent border border-accent/20' : 'text-foreground/60 border border-transparent'}`}
            >
              <FlagEN />
              <span className="text-xs font-bold">EN</span>
            </button>
          </div>
          
          <div className="h-px bg-border/50" />

          {/* User actions on Mobile */}
          {currentUser ? (
            <div className="flex flex-col gap-3">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {t('Sessão:')} {currentUser.name} ({currentUser.role})
              </div>
              <Link
                href={getDashboardLink()}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-sm text-foreground/80 py-1"
              >
                <LayoutDashboard className="h-4 w-4 text-accent" />
                {t('Meu Painel')}
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm text-red-500 py-1 text-left"
              >
                <LogOut className="h-4 w-4" />
                {t('Sair da Conta')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setAuthMode('login'); setShowAuthModal(true); setMobileMenuOpen(false); }}
                className="text-center border border-border hover:bg-muted text-secondary font-bold text-xs py-2.5 rounded-xl transition-all"
              >
                {t('Entrar')}
              </button>
              <button
                onClick={() => { setAuthMode('register'); setShowAuthModal(true); setMobileMenuOpen(false); }}
                className="text-center bg-primary hover:bg-accent-hover text-white font-bold text-xs py-2.5 rounded-xl transition-all"
              >
                {t('Cadastrar')}
              </button>
            </div>
          )}

          <Link href="/contato" onClick={() => setMobileMenuOpen(false)}>
            <Button className="w-full bg-primary hover:bg-accent-hover text-white rounded-full">
              {t('SOLICITAR ORÇAMENTO')}
            </Button>
          </Link>
        </div>
      )}

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
