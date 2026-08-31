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

export const localeFlags: Record<Locale, string> = {
  pt: 'PT',
  en: 'EN',
  es: 'ES',
};

export const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && (locales as readonly string[]).includes(value);

/**
 * Extracts the locale from a pathname. `pt` (default) has no URL prefix,
 * so an unprefixed path is treated as Portuguese.
 */
export function getLocaleFromPathname(pathname: string): Locale {
  const match = pathname.match(/^\/(pt|en|es)(?=\/|$)/);
  if (match && isLocale(match[1])) return match[1];
  return defaultLocale;
}

/**
 * Returns the localized path for a given route path and locale.
 * Portuguese routes keep the same URL (no prefix); en/es get a prefix.
 */
export function localizedPath(path: string, locale: Locale = defaultLocale): string {
  if (locale === defaultLocale) return path;
  const normalized = path === '/' ? '' : path;
  return `/${locale}${normalized}`;
}

/**
 * Removes the locale prefix from a pathname, returning the canonical (pt) route.
 */
export function stripLocalePrefix(pathname: string): string {
  const match = pathname.match(/^\/(pt|en|es)(?=\/|$)/);
  if (!match) return pathname;
  const rest = pathname.slice(match[1].length + 1);
  return rest === '' ? '/' : rest;
}
