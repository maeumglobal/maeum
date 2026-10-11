'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  defaultCurrency,
  getLocaleFromCookieHeader,
  getLocaleFromPathname,
  hasLocalePrefix,
  intlLocale,
  isLocale,
  localizedPath,
  serializeLocaleCookie,
  stripLocalePrefix,
  type Locale,
} from '@/i18n/config';
import { getDictionary, type TranslationKey } from '@/i18n';
import { translate } from '@/i18n/resolve';
import { useSiteContent } from '@/contexts/SiteContentContext';

export type { TranslationKey };
export { localizedPath, stripLocalePrefix, getLocaleFromPathname, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE };

/**
 * `t()` aceita a chave canônica (type-safe) e a chave legada (o texto em
 * português) — a segunda sobrecarga existe para não quebrar as chamadas
 * dinâmicas como `t(j.tag)`.
 */
type TFunction = {
  (key: TranslationKey): string;
  (key: string): string;
};

export interface LanguageContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: TFunction;
  /** Mapa achatado (canônico + legado) do idioma ativo. */
  dict: Record<string, string>;
  /** `lang` HTML correspondente ao idioma ativo. */
  htmlLang: string;
  /** Prefixa um caminho com o idioma ativo. */
  localizedPath: (path: string, locale?: Locale) => string;
  /** Remove o prefixo de idioma de um caminho. */
  stripLocalePrefix: (path: string) => string;
  /** Helpers `Intl` já com o locale correto — usar no lugar de `toLocaleString()`. */
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (
    value: number,
    currency?: string,
    options?: Omit<Intl.NumberFormatOptions, 'style' | 'currency'>,
  ) => string;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export type LanguageProviderProps = {
  children: ReactNode;
  /** Locale resolvido no servidor a partir do header `x-maeum-locale` (fonte de SEO). */
  initialLocale: Locale;
};

/** Evento disparado quando o cookie de locale muda. */
const LOCALE_EVENT = 'maeum:localechange';

function subscribeToLocale(onStoreChange: () => void): () => void {
  window.addEventListener(LOCALE_EVENT, onStoreChange);
  return () => window.removeEventListener(LOCALE_EVENT, onStoreChange);
}

function readLocaleCookie(): Locale | null {
  return getLocaleFromCookieHeader(document.cookie);
}

/** No servidor (e no primeiro render do cliente) não há cookie legível. */
function readLocaleCookieOnServer(): Locale | null {
  return null;
}

export function LanguageProvider({ children, initialLocale }: LanguageProviderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  /**
   * O cookie é estado externo: `useSyncExternalStore` mantém a leitura em SSR e
   * hydration-safe (o snapshot do servidor é sempre `null`, então o primeiro
   * paint usa o locale do servidor) sem precisar de efeito com `setState`.
   */
  const cookieLocale = useSyncExternalStore(
    subscribeToLocale,
    readLocaleCookie,
    readLocaleCookieOnServer,
  );

  /**
   * Ordem de resolução: prefixo da URL (autoritativo em navegações soft),
   * depois o cookie (preferência salva), depois o locale do servidor.
   */
  const locale = hasLocalePrefix(pathname) ? getLocaleFromPathname(pathname) : (cookieLocale ?? initialLocale);

  // Overrides de texto do painel (por idioma). Têm prioridade sobre o dicionário.
  const { text: textOverrides } = useSiteContent();
  const overrides = textOverrides?.[locale];

  const dict = useMemo(() => getDictionary(locale), [locale]);

  const setLocale = useCallback(
    (l: Locale) => {
      if (!isLocale(l)) return;
      setIsModalOpen(false);

      // Cookie de 1 ano, path=/ — é o que o servidor e o próximo mount leem.
      document.cookie = serializeLocaleCookie(l);
      window.dispatchEvent(new Event(LOCALE_EVENT));

      // Mantém URL/SEO coerentes com o idioma. `localizedPath` já remove um
      // prefixo existente, então trocar pt <-> en/es nunca duplica o prefixo.
      const target = localizedPath(stripLocalePrefix(pathname), l);
      if (target !== pathname) router.push(target);
    },
    [pathname, router],
  );

  const formatDate = useCallback(
    (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
      const value = date instanceof Date ? date : new Date(date);
      if (Number.isNaN(value.getTime())) return '';
      return new Intl.DateTimeFormat(intlLocale[locale], options).format(value);
    },
    [locale],
  );

  const formatNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions) => {
      if (!Number.isFinite(value)) return '';
      return new Intl.NumberFormat(intlLocale[locale], options).format(value);
    },
    [locale],
  );

  const formatCurrency = useCallback(
    (
      value: number,
      currency: string = defaultCurrency[locale],
      options?: Omit<Intl.NumberFormatOptions, 'style' | 'currency'>,
    ) => {
      if (!Number.isFinite(value)) return '';
      return new Intl.NumberFormat(intlLocale[locale], {
        style: 'currency',
        currency,
        ...options,
      }).format(value);
    },
    [locale],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      setLocale,
      t: ((key: string) => translate(key, locale, overrides)) as TFunction,
      dict,
      htmlLang: intlLocale[locale],
      localizedPath: (path: string, l?: Locale) => localizedPath(path, l ?? locale),
      stripLocalePrefix,
      formatDate,
      formatNumber,
      formatCurrency,
      isModalOpen,
      setIsModalOpen,
    }),
    [locale, setLocale, overrides, dict, formatDate, formatNumber, formatCurrency, isModalOpen],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}