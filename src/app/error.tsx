'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { getLocaleFromPathname, localizedPath, type Locale } from '@/i18n/config';

/**
 * Error boundary do segmento raiz — capturada por `src/app/error.tsx`.
 *
 * ⚠️ NÃO usa `useLanguage()` de propósito: se a exceção veio do próprio
 * LanguageProvider, o hook lançaria de novo e a página ficaria em branco.
 * O idioma vem da URL (`/en/...`, `/es/...`), que é sempre derivável.
 */

const COPY: Record<Locale, { title: string; message: string; retry: string; home: string; hint: string }> = {
  pt: {
    title: 'Algo deu errado',
    message: 'Não conseguimos carregar esta página. Tente novamente em alguns segundos.',
    retry: 'Tentar novamente',
    home: 'Voltar para o início',
    hint: 'Se o problema persistir, fale com a gente pelo WhatsApp.',
  },
  en: {
    title: 'Something went wrong',
    message: 'We could not load this page. Please try again in a few seconds.',
    retry: 'Try again',
    home: 'Back to home',
    hint: 'If the problem persists, contact us on WhatsApp.',
  },
  es: {
    title: 'Algo salio mal',
    message: 'No pudimos cargar esta pagina. Intentalo de nuevo en unos segundos.',
    retry: 'Reintentar',
    home: 'Volver al inicio',
    hint: 'Si el problema persiste, contactanos por WhatsApp.',
  },
};

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const copy = COPY[locale] ?? COPY.pt;

  useEffect(() => {
    // Em produção isto aparece no console do servidor/browser; nenhum dado
    // sensível é logado aqui.
    console.error('[app-error]', error.digest ?? '', error.message);
  }, [error]);

  const home = localizedPath('/', locale);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-6 py-20 text-center">
      <div className="max-w-lg">
        <AlertTriangle aria-hidden className="mx-auto h-12 w-12 text-accent" />
        <p className="mt-6 text-xs uppercase tracking-[0.3em] text-muted-foreground">Erro 500</p>
        <h1 className="mt-3 font-heading text-4xl sm:text-5xl font-light text-secondary">
          {copy.title}
        </h1>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{copy.message}</p>
        <p className="mt-2 text-xs text-muted-foreground/80">{copy.hint}</p>
        {error.digest ? (
          <p className="mt-4 font-mono text-[10px] text-muted-foreground/60">ref: {error.digest}</p>
        ) : null}

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-[#0F0A08] font-bold text-[10px] py-4 px-8 rounded-none uppercase tracking-widest transition-colors"
          >
            <RefreshCw aria-hidden className="h-4 w-4" />
            {copy.retry}
          </button>
          <Link
            href={home}
            className="inline-flex items-center gap-2 bg-transparent border border-accent text-accent hover:bg-accent/10 font-bold text-[10px] py-4 px-8 rounded-none uppercase tracking-widest transition-colors"
          >
            <Home aria-hidden className="h-4 w-4" />
            {copy.home}
          </Link>
        </div>
      </div>
    </div>
  );
}
