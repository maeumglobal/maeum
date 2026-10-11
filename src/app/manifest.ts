import type { MetadataRoute } from 'next';

/**
 * Manifest (PWA) servido em `/manifest.webmanifest` e referenciado por
 * `metadata.manifest` no layout raiz.
 *
 * Ícones apontam para arquivos que EXISTEM em `public/`:
 *  - `/images/favicon.png` (476x446)
 *  - `/images/logo.png`    (994x748)
 * `sizes: 'any'` é usado de propósito: nenhum dos dois PNGs é quadrado, então
 * declarar '192x192' seria mentira e o Android mostraria a imagem esticada.
 * Quando existirem PNGs quadrados reais (192/512), troque aqui.
 *
 * As cores espelham `--background-color` e `--accent-color` de `globals.css`.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Maeum Global — Turismo & Intercâmbio de Luxo na Ásia',
    short_name: 'Maeum Global',
    description:
      'Agência de viagens de luxo e intercâmbio: roteiros sob medida, hotéis 5 estrelas e experiências exclusivas na Coreia do Sul.',
    lang: 'pt-BR',
    dir: 'ltr',
    start_url: '/',
    scope: '/',
    id: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#1A0F14',
    theme_color: '#1A0F14',
    categories: ['travel', 'lifestyle', 'business'],
    icons: [
      {
        src: '/images/favicon.png',
        sizes: 'any',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/images/logo.png',
        sizes: 'any',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
