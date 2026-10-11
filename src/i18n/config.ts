export const locales = ['pt', 'en', 'es'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'pt';

export const localeNames: Record<Locale, string> = {
  pt: 'Português',
  en: 'English',
  es: 'Español',
};

export const htmlLang: Record<Locale, string> = {
  pt: 'pt-BR',
  en: 'en-US',
  es: 'es-ES',
};

/** Locale do `Intl` — usar sempre que precisar formatar moeda/data/número. */
export const intlLocale: Record<Locale, string> = htmlLang;

export const localeFlags: Record<Locale, string> = {
  pt: 'PT',
  en: 'EN',
  es: 'ES',
};

/** Moeda padrão exibida para cada idioma (os valores do site estão em BRL). */
export const defaultCurrency: Record<Locale, string> = {
  pt: 'BRL',
  en: 'BRL',
  es: 'BRL',
};

/** Nome do cookie que persiste a escolha de idioma. */
export const LOCALE_COOKIE = 'maeum_locale';

/** 1 ano, em segundos. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && (locales as readonly string[]).includes(value);

/** Header de requisição definido pelo `src/proxy.ts` com o locale ativo. */
export const LOCALE_HEADER = 'x-maeum-locale';

/**
 * Extrai o locale de um pathname. `pt` (padrão) não tem prefixo na URL,
 * então um caminho sem prefixo é tratado como português.
 */
export function getLocaleFromPathname(pathname: string): Locale {
  const match = pathname.match(/^\/(pt|en|es)(?=\/|$)/);
  if (match && isLocale(match[1])) return match[1];
  return defaultLocale;
}

/** `true` quando o pathname traz um prefixo de locale explícito. */
export function hasLocalePrefix(pathname: string): boolean {
  return /^\/(pt|en|es)(?=\/|$)/.test(pathname);
}

/**
 * Lê o locale de um cabeçalho `Cookie` cru (uso no servidor).
 * Devolve `null` quando o cookie não existe ou não é válido.
 */
export function getLocaleFromCookieHeader(cookieHeader: string | null | undefined): Locale | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const [name, ...rest] = part.split('=');
    if (name?.trim() === LOCALE_COOKIE) {
      const value = rest.join('=').trim();
      if (isLocale(value)) return value;
    }
  }
  return null;
}

/** Serializa o cookie de locale com 1 ano de validade. */
export function serializeLocaleCookie(locale: Locale): string {
  return `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
}

/**
 * Caminho localizado para uma rota. Português mantém a URL (sem prefixo);
 * en/es recebem o prefixo. Aceita paths já prefixados (idempotente) e
 * preserva query string e hash.
 */
export function localizedPath(path: string, locale: Locale = defaultLocale): string {
  const hashIndex = path.indexOf('#');
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : '';
  const withoutHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path;

  const queryIndex = withoutHash.indexOf('?');
  const query = queryIndex >= 0 ? withoutHash.slice(queryIndex) : '';
  const pathname = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;

  const bare = stripLocalePrefix(pathname || '/');
  if (locale === defaultLocale) return bare + query + hash;
  // Raiz do idioma sem barra final: o Next normaliza `/en/` -> `/en`, então
  // emitir `/en/` geraria um redirect extra (e um ping-pong se o proxy também
  // redirecionasse). `/en` é o que `src/lib/seo.ts` usa como canônico.
  return `/${locale}${bare === '/' ? '' : bare}${query}${hash}`;
}

/** Remove o prefixo de locale, devolvendo a rota canônica (pt). */
export function stripLocalePrefix(pathname: string): string {
  const match = pathname.match(/^\/(pt|en|es)(?=\/|$)/);
  if (!match) return pathname || '/';
  const rest = pathname.slice(match[1].length + 1);
  return rest === '' ? '/' : rest;
}