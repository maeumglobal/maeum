'use client';

/**
 * Client wrapper de `/login`.
 *
 * O `page.tsx` é um Server Component (metadata, `noindex`), mas a UI precisa de
 * `useLanguage` (idioma + `t()`) e do `AuthContext`. Todos os links usam
 * `localizedPath` para preservar o idioma do visitante.
 */

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizedPath } from '@/i18n/config';

export default function LoginClient() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const { isAuthenticated, loading } = useAuth();

  // Já autenticado → vai direto para a casa do papel.
  useEffect(() => {
    if (loading || !isAuthenticated) return;
    const next = new URLSearchParams(window.location.search).get('next');
    router.replace(next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard');
  }, [isAuthenticated, loading, router]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="grid flex-1 place-items-center px-4 py-12">
        <AuthModal
          isOpen
          presentation="page"
          onClose={() => router.replace(localizedPath('/', locale))}
          onSuccess={() => router.refresh()}
          title={t('MAEUM GLOBAL')}
          subtitle={t('Portal de Acesso')}
        />
      </div>

      <footer className="flex flex-col items-center justify-center gap-2 border-t border-border py-6 text-[10px] text-muted-foreground">
        <div className="flex gap-4">
          <Link
            href={localizedPath('/politica-de-privacidade', locale)}
            className="transition-colors hover:text-primary"
          >
            {t('Política de Privacidade')}
          </Link>
          <Link
            href={localizedPath('/termos-de-uso', locale)}
            className="transition-colors hover:text-primary"
          >
            {t('Termos de Uso')}
          </Link>
        </div>
        <div>{t('Todos os direitos reservados.')}</div>
      </footer>
    </div>
  );
}