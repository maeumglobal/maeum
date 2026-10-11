'use client';

import { useEffect } from 'react';

/**
 * Captura falhas no próprio ROOT LAYOUT (o `<html>`/`<body>` foi substituído
 * por este componente), portanto:
 *  - precisa renderizar `<html>` e `<body>`;
 *  - NÃO pode usar Tailwind, `next/link`, `useLanguage()` ou qualquer provider
 *    do layout — nada disso está disponível aqui. Por isso o CSS é inline.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[global-error]', error.digest ?? '', error.message);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1A0F14',
          color: '#F3E8DC',
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '32rem' }}>
          <p
            style={{
              margin: 0,
              fontSize: '0.7rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: '#A18D95',
            }}
          >
            Erro 500
          </p>
          <h1 style={{ margin: '0.75rem 0 0', fontSize: '2rem', fontWeight: 400, lineHeight: 1.2 }}>
            Maeum Global está temporariamente fora do ar
          </h1>
          <p style={{ margin: '1rem 0 0', fontSize: '0.95rem', lineHeight: 1.6, color: '#C9B7BE' }}>
            Algo quebrou ao montar a página. Recarregue para tentar novamente — se persistir, fale com
            a gente pelo WhatsApp.
          </p>
          {error.digest ? (
            <p style={{ margin: '1.25rem 0 0', fontSize: '0.7rem', color: '#7E6B73' }}>
              ref: {error.digest}
            </p>
          ) : null}
          <div
            style={{
              marginTop: '2rem',
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={reset}
              style={{
                cursor: 'pointer',
                border: 'none',
                backgroundColor: '#C8A27C',
                color: '#0F0A08',
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                padding: '0.9rem 1.75rem',
              }}
            >
              Tentar novamente
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- global-error substitui o root layout; um <a> puro não depende do router */}
            <a
              href="/"
              style={{
                display: 'inline-block',
                border: '1px solid #C8A27C',
                color: '#C8A27C',
                textDecoration: 'none',
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                padding: '0.9rem 1.75rem',
              }}
            >
              Início
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
