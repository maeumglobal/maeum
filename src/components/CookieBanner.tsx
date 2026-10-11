'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, Cookie, Check, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizedPath } from '@/i18n/config';

const STORAGE_KEY = 'cookie-consent';

export default function CookieBanner() {
  const { t, locale } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const animateTimer: ReturnType<typeof setTimeout>[] = [];

    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      // localStorage bloqueado (modo privado): mostramos mesmo assim.
    }

    const showTimer = setTimeout(() => {
      setIsVisible(true);
      animateTimer.push(setTimeout(() => setIsAnimating(true), 100));
    }, 1500);

    return () => {
      clearTimeout(showTimer);
      for (const timer of animateTimer) clearTimeout(timer);
    };
  }, []);

  const handleAccept = (type: 'all' | 'necessary') => {
    setIsAnimating(false);
    setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, type);
      } catch {
        // Sem persistência o banner some da sessão atual — comportamento aceitável.
      }
      setIsVisible(false);
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      role="dialog"
      aria-label={t('Banner de cookies')}
      className={`fixed inset-x-0 bottom-0 z-50 border-t border-border/50 bg-background/98 shadow-2xl backdrop-blur-md transition-all duration-300 ${
        isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex flex-1 items-start gap-4">
            <div className="shrink-0 rounded-full bg-primary/10 p-2.5">
              <Cookie className="h-5 w-5 text-accent" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4 text-accent" aria-hidden="true" />
                <h3 className="font-heading text-sm font-semibold text-secondary">
                  {t('Privacidade e Cookies')}
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t(
                  'Utilizamos cookies essenciais para o funcionamento do site e cookies analíticos para melhorar sua experiência.',
                )}{' '}
                <Link
                  href={localizedPath('/politica-de-privacidade', locale)}
                  className="font-medium text-primary hover:underline"
                >
                  {t('Política de Privacidade')}
                </Link>
                .
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <Button
              type="button"
              onClick={() => handleAccept('necessary')}
              variant="outline"
              size="sm"
              className="rounded-full border-border px-5 py-2.5 text-xs font-semibold transition-colors hover:bg-muted"
            >
              {t('Rejeitar')}
            </Button>
            <Button
              type="button"
              onClick={() => handleAccept('all')}
              size="sm"
              className="rounded-full bg-primary px-6 py-2.5 text-xs font-semibold text-white shadow-md transition-all hover:scale-105 hover:bg-accent-hover"
            >
              <Check className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              {t('Aceitar Todos')}
            </Button>
            <button
              type="button"
              onClick={() => handleAccept('necessary')}
              className="p-2 text-muted-foreground transition-colors hover:text-secondary"
              aria-label={t('Fechar')}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}