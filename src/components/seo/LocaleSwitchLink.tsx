import { localeNames, locales, type Locale } from '@/i18n/config';
import { languageAlternates } from '@/lib/seo';

/**
 * Lista de links para o MESMO conteúdo em pt/en/es, cada um com `hreflang`.
 *
 * Server Component (não precisa de JS para funcionar — bom para SEO e para
 * no-JS). Deve ser usado dentro de um `<nav>` já posicionado pelo Header/Footer;
 * o componente devolve apenas a lista de âncoras.
 *
 * Não substitui o seletor de idioma do Header (que troca client-side), mas
 * garante que os crawlers encontrem as três versões em qualquer página.
 */
export default function LocaleSwitchLink({
  path = '/',
  locale = 'pt',
  className,
  label,
}: {
  /** Path interno canônico (pt, sem prefixo): '/destinos'. */
  path?: string;
  /** Locale atual — recebe `aria-current="true"`. */
  locale?: Locale;
  className?: string;
  /** Rótulo acessível do grupo. */
  label?: string;
}) {
  const alternates = languageAlternates(path);

  return (
    <ul
      aria-label={label ?? 'Idioma'}
      className={className ?? 'flex items-center gap-3 text-xs uppercase tracking-widest'}
    >
      {locales.map((l) => (
        <li key={l}>
          <a
            href={alternates[l]}
            hrefLang={l}
            lang={l}
            aria-current={l === locale ? 'true' : undefined}
            className={l === locale ? 'text-accent font-semibold' : 'hover:text-accent transition-colors'}
          >
            {localeNames[l]}
          </a>
        </li>
      ))}
    </ul>
  );
}
