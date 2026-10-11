import Link from 'next/link';
import { Compass, Home, MapPin } from 'lucide-react';
import { resolveRequestLocale, localizedPathname } from '@/lib/seo';

/**
 * 404 do site.
 *
 * - Server Component, sem hooks: renderiza igual em SSG e em render dinâmico.
 * - `resolveRequestLocale()` é memoizado e tem try/catch → cai em 'pt'.
 * - O Next já marca páginas 404 como `noindex`; não é preciso declarar robots.
 * - Só aponta para rotas que EXISTEM em `src/app/` (ver `src/app/sitemap.ts`).
 */

const COPY = {
  pt: {
    code: 'Erro 404',
    title: 'Página não encontrada',
    message:
      'O endereço que você tentou abrir não existe ou foi movido. Aproveite e veja nossos destinos.',
    destinations: 'Ver destinos',
    contact: 'Falar com uma consultora',
  },
  en: {
    code: 'Error 404',
    title: 'Page not found',
    message:
      'The address you tried to open does not exist or has moved. Take a look at our destinations.',
    destinations: 'See destinations',
    contact: 'Talk to a consultant',
  },
  es: {
    code: 'Error 404',
    title: 'Pagina no encontrada',
    message:
      'La direccion que intentas abrir no existe o fue movida. Mira nuestros destinos.',
    destinations: 'Ver destinos',
    contact: 'Hablar con una consultora',
  },
} as const;

const LINK_ICONS = { home: Home, pin: MapPin, compass: Compass } as const;

export default async function NotFound() {
  const locale = await resolveRequestLocale();
  const copy = COPY[locale] ?? COPY.pt;

  const links: { href: string; label: string; icon: keyof typeof LINK_ICONS }[] = [
    { href: localizedPathname('/', locale), label: 'Home', icon: 'home' },
    { href: localizedPathname('/destinos', locale), label: '/destinos', icon: 'pin' },
    { href: localizedPathname('/coreia-do-sul', locale), label: '/coreia-do-sul', icon: 'compass' },
    { href: localizedPathname('/contato', locale), label: copy.contact, icon: 'compass' },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-6 py-24 text-center">
      <div className="max-w-xl w-full">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{copy.code}</p>
        <h1 className="mt-3 font-heading text-5xl sm:text-6xl font-light text-secondary">
          {copy.title}
        </h1>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{copy.message}</p>

        <Link
          href={localizedPathname('/destinos', locale)}
          className="mt-8 inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-[#0F0A08] font-bold text-[10px] py-4 px-8 rounded-none uppercase tracking-widest transition-colors"
        >
          <Compass aria-hidden className="h-4 w-4" />
          {copy.destinations}
        </Link>

        <nav aria-label="Links úteis" className="mt-12 border-t border-border/70 pt-8">
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs uppercase tracking-widest">
            {links.map((link) => {
              const Icon = LINK_ICONS[link.icon];
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors"
                  >
                    <Icon aria-hidden className="h-4 w-4" />
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
