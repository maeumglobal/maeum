/**
 * Resolução de chaves de tradução.
 *
 * Ordem de resolução de `t(key)`:
 *
 *  1. Chave canônica (`home.hero.kicker`) — resolução direta.
 *  2. Chave legada exata: o texto em pt passa a ser procurado no índice
 *     legado. Se a frase existe em mais de um grupo, vence a primeira
 *     ocorrência (ver `LEGACY_AMBIGUITY` em `aliases.ts`).
 *  3. Chave legada normalizada: sem acento, sem espaço nas pontas e sem
 *     diferença de fim de linha. É o que faz `t('VERAO')` encontrar `'VERÃO'`
 *     e as páginas legais (CRLF) casarem com o dicionário (LF).
 *  4. Devolve a própria chave e, em desenvolvimento, loga um aviso claro.
 */
import {
  canonicalDict,
  legacyIndex,
  normalizedLegacyIndex,
  normalizeKey,
  ambiguousLegacyKeys,
  type TranslationKey,
} from './index';
import { LEGACY_ALIASES, normalizedAliases } from './aliases';
import type { Locale } from './config';

const isDev = process.env.NODE_ENV !== 'production';
const warned = new Set<string>();

/** Resolve a chave pedida para um id canônico, ou `null` se não existir. */
export function resolveKey(key: string): TranslationKey | null {
  if (Object.prototype.hasOwnProperty.call(canonicalDict, key)) return key as TranslationKey;

  const alias = LEGACY_ALIASES[key];
  if (alias) return alias;

  const exact = legacyIndex.get(key);
  if (exact) return exact[0] as TranslationKey;

  const norm = normalizeKey(key);
  if (Object.prototype.hasOwnProperty.call(canonicalDict, norm)) return norm as TranslationKey;

  const looseAlias = normalizedAliases.get(norm);
  if (looseAlias) return looseAlias;

  const loose = normalizedLegacyIndex.get(norm);
  if (loose) return loose[0] as TranslationKey;

  return null;
}

/** `true` quando a chave existe mas é legada (o ideal é usar a canônica). */
export function isLegacyKey(key: string): boolean {
  return !Object.prototype.hasOwnProperty.call(canonicalDict, key) && resolveKey(key) !== null;
}

/** Todas as ids canônicas que uma chave legada poderia significar. */
export function candidatesFor(key: string): TranslationKey[] {
  return (
    legacyIndex.get(key) ??
    normalizedLegacyIndex.get(normalizeKey(key)) ??
    (LEGACY_ALIASES[key] ? [LEGACY_ALIASES[key]] : [])
  );
}

function warnMissing(key: string): void {
  if (!isDev || warned.has(key)) return;
  warned.add(key);
  const hint =
    ambiguousLegacyKeys.has(key) || normalizedLegacyIndex.has(normalizeKey(key))
      ? 'Chave legada — prefira migrar para a chave canônica (veja .tmp-audit/I18N_KEYS.md).'
      : 'Chave inexistente no dicionário.';
  console.warn(
    `[i18n] t('${key}') não encontrada no dicionário. ${hint}\n` +
      '       A chave está sendo devolvida literalmente. Adicione-a em src/i18n/<grupo>.ts.',
  );
}

function warnAmbiguous(key: string, ids: TranslationKey[]): void {
  if (!isDev || ids.length < 2) return;
  const tag = `[i18n:ambiguous] ${key}`;
  if (warned.has(tag)) return;
  warned.add(tag);
  console.warn(
    `[i18n] A chave legada "${key}" existe em ${ids.length} grupos: ${ids.join(', ')}.\n` +
      `       Usando "${ids[0]}". Migre a chamada para a chave canônica.`,
  );
}

/**
 * Traduz uma chave. Aceita tanto a chave canônica quanto a chave legada
 * (o texto em português). Devolve a própria chave quando nada é encontrado,
 * preservando o comportamento antigo.
 */
export function translate(
  key: string,
  locale: Locale,
  overrides?: Record<string, string> | undefined,
): string {
  if (!key) return key;

  // Override do painel do CMS: aceita a chave pedida e o id canônico resolvido.
  const resolved = resolveKey(key);
  if (overrides) {
    const direct = overrides[key];
    if (typeof direct === 'string' && direct.length > 0) return direct;
    if (resolved) {
      const viaCanonical = overrides[resolved];
      if (typeof viaCanonical === 'string' && viaCanonical.length > 0) return viaCanonical;
    }
  }

  if (resolved) {
    if (isLegacyKey(key)) warnAmbiguous(key, candidatesFor(key));
    return canonicalDict[resolved]![locale] ?? canonicalDict[resolved]!.pt;
  }

  warnMissing(key);
  return key;
}