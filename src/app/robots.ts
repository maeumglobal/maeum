import type { MetadataRoute } from 'next';
import { SITE_URL, siteUrl } from '@/lib/seo';

/**
 * Regras do robots.txt.
 *
 * `robots.txt` não é mecanismo de segurança — é apenas uma declaração para
 * crawlers. A proteção real de `/admin`, `/dashboard`, `/login` e `/proposta`
 * continua sendo `src/proxy.ts` + `src/lib/auth.ts`.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          // Áreas autenticadas
          '/admin',
          '/admin/',
          '/dashboard',
          '/dashboard/',
          // Login / recuperação de senha
          '/login',
          // Propostas privadas (link único por cliente)
          '/proposta/',
          '/proposta',
          // API interna e assets gerados
          '/api/',
          '/_next/',
          // Páginas internas de SEO que não devem ser rastreadas
          '/search',
        ],
      },
    ],
    host: SITE_URL,
    sitemap: siteUrl('/sitemap.xml'),
  };
}
