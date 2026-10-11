'use client';

import { useEffect } from 'react';
import { RefreshCw, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * `error.tsx` do painel interno.
 *
 * Sem isto, uma exceção de render em `/admin/*` derrubava a rota inteira para a
 * tela de erro global do Next — que não pertence ao painel e oferece só um
 * link para o home. Aqui o admin vê o que houve e pode tentar de novo sem
 * sair do backoffice.
 *
 * ⚠️ A mensagem NÃO é exibida: ela pode conter nome de tabela/constraint em
 * produção. O objeto completo vai para o console do navegador.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLanguage();

  useEffect(() => {
    // Log para diagnóstico; nada de dado sensível é exibido na tela.
    console.error('[admin] erro de render:', error);
  }, [error]);

  return (
    <div
      role="alert"
      className="admin-dashboard flex min-h-[50vh] w-full flex-col items-center justify-center gap-4 bg-[var(--admin-bg)] px-4 text-center text-[var(--admin-text-main)]"
    >
      <TriangleAlert className="w-8 h-8 text-[var(--admin-accent-red)]" />
      <h1 className="text-lg font-bold">{t('state.errorTitle')}</h1>
      <p className="max-w-md text-xs text-[var(--admin-text-muted)]">
        {error.digest ? `digest: ${error.digest}` : t('admin.dash.errorMetrics')}
      </p>
      <Button
        onClick={reset}
        className="bg-[var(--admin-primary)] font-semibold text-black hover:bg-[var(--admin-primary-hover)]"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        {t('state.retry')}
      </Button>
    </div>
  );
}
