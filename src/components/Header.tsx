'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, User, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user: currentUser, logout } = useAuth();

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
    { label: 'Coreia do Sul', href: '/coreia-do-sul' },
    { label: 'Destinos', href: '/destinos' },
    { label: 'Experiências', href: '/coreia-do-sul/experiencias' },
    { label: 'Intercâmbio', href: '/coreia-do-sul/intercambio' },
    { label: 'Jornadas', href: '/coreia-do-sul/jornadas' },
    { label: 'Journal', href: '/journal' },
    { label: 'Contato', href: '/contato' }
  ];

  return (
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
          {/* User profile dropdown or Login Actions */}
          {currentUser ? (
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-4 py-1.5 border border-border rounded-full text-xs hover:bg-muted transition-all">
                <User className="h-3.5 w-3.5 text-primary" />
                <span className="max-w-[100px] truncate">{currentUser.name}</span>
              </button>
              <div className="absolute right-0 top-full mt-1.5 w-10 rounded-md border border-border bg-card p-1 shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150">
                <Link
                  href={
                    currentUser.role === 'super_admin' || currentUser.role === 'admin'
                      ? '/dashboard/admin'
                      : currentUser.role === 'consultora'
                      ? '/dashboard/consultora'
                      : '/dashboard/cliente'
                  }
                  className="w-full text-left px-3 py-2 text-xs rounded hover:bg-primary/5 hover:text-primary transition-colors flex items-center gap-2 text-foreground/80"
                >
                  <LayoutDashboard className="h-4 w-4 text-primary" />
                  <span>Meu Painel</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-xs rounded hover:bg-red-50 hover:text-red-650 transition-colors flex items-center gap-2 text-red-500 border-t border-border mt-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sair da Conta</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                href="/login"
                className="text-xs font-semibold text-foreground/80 hover:text-primary px-3 py-1.5 transition-colors"
              >
                Entrar
              </Link>
              <Link
                href="/login"
                className="bg-primary hover:bg-accent-hover text-white text-xs font-semibold px-4 py-2 rounded-full shadow-sm transition-transform hover:scale-105"
              >
                Cadastrar
              </Link>
            </div>
          )}

          <Link href="/contato">
            <Button size="sm" className="bg-primary hover:bg-accent-hover text-white text-xs font-semibold rounded-full px-5">
              SOLICITAR ORÇAMENTO
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

          {/* User actions on Mobile */}
          {currentUser ? (
            <div className="flex flex-col gap-3">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Sessão: {currentUser.name} ({currentUser.role})
              </div>
              <Link
                href={getDashboardLink()}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-sm text-foreground/80 py-1"
              >
                <LayoutDashboard className="h-4 w-4 text-primary" />
                Meu Painel
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm text-red-500 py-1 text-left"
              >
                <LogOut className="h-4 w-4" />
                Sair da Conta
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/login"
                className="text-center border border-border hover:bg-muted text-secondary font-bold text-xs py-2.5 rounded-xl transition-all"
              >
                Entrar
              </Link>
              <Link
                href="/login"
                className="text-center bg-primary hover:bg-accent-hover text-white font-bold text-xs py-2.5 rounded-xl transition-all"
              >
                Cadastrar
              </Link>
            </div>
          )}

          <Link href="/contato" onClick={() => setMobileMenuOpen(false)}>
            <Button className="w-full bg-primary hover:bg-accent-hover text-white rounded-full">
              SOLICITAR ORÇAMENTO
            </Button>
          </Link>
        </div>
      )}

    </header>
  );
}
