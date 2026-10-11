/**
 * i18n no servidor (Server Components).
 *
 * Server Components não podem usar `useLanguage()`. Esta camada reproduz o
 * mesmo contrato de tradução/formatatação no servidor, com duas garantias:
 *
 * - **mesma resolução de chaves** que o cliente: `translate()` de
 *   `@/i18n/resolve` (chave canônica → alias → legada exata → legada
 *   normalizada), incluindo os overrides do CMS (`SiteSetting` `cms_text`);
 * - **mesmos helpers de locale** do `LanguageContext`: `formatDate`,
 *   `formatNumber` e `formatCurrency` usam `intlLocale[locale]`, então nunca
 *   há formatação numérica/data sem locale nem divergência entre o HTML do
 *   servidor e a hidratação do cliente.
 *
 * `getServerI18n()` é memoizado com `cache()`: uma ida ao banco de overrides
 * e uma leitura do header `x-maeum-locale` por request, mesmo com várias
 * páginas/painéis aninhados na mesma renderização.
 */
import { cache } from 'react';
import { intlLocale, localizedPath, type Locale } from '@/i18n/config';
import { getDictionary, type Dict } from '@/i18n';
import { translate } from '@/i18n/resolve';
import { getTextOverrides } from '@/lib/cmsData';
import { resolveRequestLocale } from '@/lib/seo';

export interface ServerI18n {
  locale: Locale;
  /** `htmlLang` do idioma (ex.: 'pt-BR'). */
  htmlLang: string;
  /** Traduz chave canônica OU chave legada (texto em pt). */
  t: (key: string) => string;
  /** Dicionário achatado do idioma (para lookups pontuais sem log de warning). */
  dict: Dict;
  /** Prefixa um path interno com o idioma ativo (preserva query e hash). */
  lp: (path: string) => string;
  formatDate: (value: Date | string | number | null | undefined, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (value: number | null | undefined, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (
    value: number | null | undefined,
    currency?: string | null,
    options?: Omit<Intl.NumberFormatOptions, 'style' | 'currency'>,
  ) => string;
  /**
   * Escolhe a variante En/Es de uma coluna do Prisma (`title`, `description`…).
   * Devolve `null` quando todas as variantes estão vazias.
   */
  localizedField: (variants: Partial<Record<Locale, string | null>>) => string | null;
  /** Substitui `{chave}` em um template por valores. */
  fill: (template: string, vars: Record<string, string | number>) => string;
}

export const getServerI18n = cache(async (): Promise<ServerI18n> => {
  const locale = await resolveRequestLocale();
  const intl = intlLocale[locale] ?? 'pt-BR';

  let overrides: Record<string, string> | undefined;
  try {
    overrides = (await getTextOverrides())?.[locale];
  } catch {
    // CMS fora do ar → dicionário puro (mesmo fallback do layout raiz).
    overrides = undefined;
  }

  const dict = getDictionary(locale);

  const t = (key: string): string => translate(key, locale, overrides);

  const formatDate: ServerI18n['formatDate'] = (value, options) => {
    if (value === null || value === undefined || value === '') return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(intl, options).format(date);
  };

  const formatNumber: ServerI18n['formatNumber'] = (value, options) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return '';
    return new Intl.NumberFormat(intl, options).format(value);
  };

  const formatCurrency: ServerI18n['formatCurrency'] = (value, currency, options) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return '';
    return new Intl.NumberFormat(intl, {
      style: 'currency',
      currency: currency || 'BRL',
      ...options,
    }).format(value);
  };

  const localizedField: ServerI18n['localizedField'] = (variants) => {
    const preferred = variants[locale];
    const chosen = [preferred, variants.pt, variants.en, variants.es].find(
      (value) => typeof value === 'string' && value.trim().length > 0,
    );
    return typeof chosen === 'string' ? chosen.trim() : null;
  };

  const fill: ServerI18n['fill'] = (template, vars) =>
    template.replace(/\{(\w+)\}/g, (whole, key: string) => {
      const value = vars[key];
      return value === undefined || value === null ? whole : String(value);
    });

  return {
    locale,
    htmlLang: intl,
    t,
    dict,
    lp: (path: string) => localizedPath(path, locale),
    formatDate,
    formatNumber,
    formatCurrency,
    localizedField,
    fill,
  };
});

export default getServerI18n;