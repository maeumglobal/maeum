'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * `error.tsx` do portal (`/dashboard/*`).
 *
 * Sem isto, uma exceção de render em `/dashboard/*` derrubava a rota inteira
 * para a tela de erro global do Next. Aqui o usuário vê o que aconteceu e
 * tenta de novo sem perder a sessão.
 *
 * ⚠️ A mensagem da exceção NÃO é exibida: em produção ela pode conter nome de
 * tabela/constraint. O objeto completo vai para o console do navegador.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLanguage();

  useEffect(() => {
    console.error('[dashboard] erro de render:', error);
  }, [error]);

  return (
    <div
      role="alert"
      className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-4 bg-background px-4 text-center text-foreground"
    >
      <TriangleAlert className="h-9 w-9 text-destructive" />
      <h1 className="font-heading text-xl font-semibold">{t('admin.state.errorTitle')}</h1>
      <p className="max-w-md text-xs text-muted-foreground">
        {error.digest ? `digest: ${error.digest}` : t('admin.dash.errorMetrics')}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          onClick={reset}
          className="bg-primary font-semibold text-primary-foreground hover:bg-primary/80"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          {t('admin.state.retry')}
        </Button>
        <Link
          href="/"
          className="text-xs font-semibold text-accent underline-offset-4 hover:underline"
        >
          {t('portal.backToSite')}
        </Link>
      </div>
    </div>
  );
}