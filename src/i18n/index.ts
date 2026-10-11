/**
 * Índice do dicionário de traduções.
 *
 * ## Modelo de chaves
 *
 * - **Chave canônica**: `<grupo>.<id-local>` (ex.: `home.hero.kicker`,
 *   `pacotes.journeys.days14`, `detalhe.package.backToPackages`). É a forma
 *   recomendada para código novo e a única com type-safety.
 * - **Chave legada**: o próprio texto em português. Continua funcionando em
 *   `t()` por compatibilidade com as ~1300 chamadas já existentes no projeto.
 *   Quando a mesma frase existe em mais de um grupo, resolve-se para a
 *   primeira ocorrência (na ordem de merge abaixo).
 *
 * ## Ordem de merge
 *
 * A ordem dos grupos define qual ocorrência vence quando uma chave legada é
 * duplicada. Os valores duplicados foram harmonizados, de modo que a ordem só
 * importa para frases realmente idênticas.
 */
import type { Locale } from './config';
import { dictGroups, type DictGroup } from './group';
import { raw as home, canonical as canonicalHome } from './home';
import { raw as contato, canonical as canonicalContato } from './contato';
import { raw as destinos, canonical as canonicalDestinos } from './destinos';
import { raw as experiencias, canonical as canonicalExperiencias } from './experiencias';
import { raw as intercambios, canonical as canonicalIntercambios } from './intercambios';
import { raw as pacotes, canonical as canonicalPacotes } from './pacotes';
import { raw as jornadas, canonical as canonicalJornadas } from './jornadas';
import { raw as sobre, canonical as canonicalSobre } from './sobre';
import { raw as journal, canonical as canonicalJournal } from './journal';
import { raw as legal, canonical as canonicalLegal } from './legal';
import { raw as coreia, canonical as canonicalCoreia } from './coreia';
import { raw as components, canonical as canonicalComponents } from './components';
import { raw as detalhe, canonical as canonicalDetalhe } from './detalhe';
import { raw as admin, canonical as canonicalAdmin } from './admin';

/** Ordem canônica de merge dos grupos. */
export const groups: readonly DictGroup[] = dictGroups;

const groupSources: Record<
  DictGroup,
  { raw: Record<Locale, Record<string, string>>; canonical: Record<string, Record<Locale, string>> }
> = {
  home: { raw: home, canonical: canonicalHome },
  contato: { raw: contato, canonical: canonicalContato },
  destinos: { raw: destinos, canonical: canonicalDestinos },
  experiencias: { raw: experiencias, canonical: canonicalExperiencias },
  intercambios: { raw: intercambios, canonical: canonicalIntercambios },
  pacotes: { raw: pacotes, canonical: canonicalPacotes },
  jornadas: { raw: jornadas, canonical: canonicalJornadas },
  sobre: { raw: sobre, canonical: canonicalSobre },
  journal: { raw: journal, canonical: canonicalJournal },
  legal: { raw: legal, canonical: canonicalLegal },
  coreia: { raw: coreia, canonical: canonicalCoreia },
  components: { raw: components, canonical: canonicalComponents },
  detalhe: { raw: detalhe, canonical: canonicalDetalhe },
  admin: { raw: admin, canonical: canonicalAdmin },
};

/**
 * Normaliza uma chave para comparação tolerante.
 *
 * Resolve três problemas históricos do projeto:
 * 1. `src/i18n/*.ts` com LF e `src/app/**` com CRLF — as páginas legais
 *    não traduziam por causa de 1 caractere de diferença;
 * 2. chaves com espaço no início/fim (`' A Maeum Global está...'`);
 * 3. literais passados a `t()` sem acento (`'VERAO'`, `'Verao / Premium'`),
 *    herdados de arrays de dados declarados dentro das páginas.
 */
export function normalizeKey(key: string): string {
  return key
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/^\s+|\s+$/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[ \t]+/g, ' ');
}

/** Dicionário canônico: `home.hero.kicker` -> { pt, en, es }. */
export const canonicalDict: Record<string, Record<Locale, string>> = {};
for (const group of dictGroups) {
  for (const [id, entry] of Object.entries(groupSources[group].canonical)) {
    canonicalDict[id] = entry;
  }
}

/**
 * Mapa legado: texto exato em pt -> todos os ids canônicos que o definem,
 * na ordem de merge dos grupos. O primeiro é o vencedor.
 */
export const legacyIndex = new Map<string, string[]>();
/** Mesmo índice, mas normalizado (tolerante a acento, espaço e fim de linha). */
export const normalizedLegacyIndex = new Map<string, string[]>();

for (const group of dictGroups) {
  for (const [id, entry] of Object.entries(groupSources[group].canonical)) {
    const exact = legacyIndex.get(entry.pt);
    if (exact) exact.push(id);
    else legacyIndex.set(entry.pt, [id]);

    const norm = normalizeKey(entry.pt);
    const loose = normalizedLegacyIndex.get(norm);
    if (loose) loose.push(id);
    else normalizedLegacyIndex.set(norm, [id]);
  }
}

/** Chaves legadas ambíguas (presentes em mais de um grupo). */
export const ambiguousLegacyKeys: ReadonlyMap<string, string[]> = new Map(
  [...legacyIndex.entries()].filter(([, ids]) => ids.length > 1),
);

/**
 * Mapa plano legado por idioma. Mantido para compatibilidade com
 * `src/lib/textCatalog.ts` (editor do CMS), com as overrides do CMS e com
 * código que ainda consome `dict[key]`. Em conflito, a primeira ocorrência vence.
 */
export const raw: Record<Locale, Record<string, string>> = { pt: {}, en: {}, es: {} };
for (const group of dictGroups) {
  const source = groupSources[group].raw;
  for (const loc of ['pt', 'en', 'es'] as Locale[]) {
    for (const [k, v] of Object.entries(source[loc])) {
      if (!(k in raw[loc])) raw[loc][k] = v;
    }
  }
}

export type Dict = Record<string, string>;

/** Dicionário em português — fonte de verdade para a contagem de chaves. */
export const ptDictionary = canonicalDict;

/** Todas as chaves canônicas válidas. */
export type TranslationKey = keyof typeof canonicalDict;

/**
 * Mapa de traduções por idioma com chaves canônicas + legadas (exatas e
 * normalizadas). Português é a fonte de verdade: lacunas em en/es caem para pt.
 */
const dictionaries: Record<Locale, Dict> = (() => {
  const build = (locale: Locale): Dict => {
    const out: Dict = {};
    for (const id of Object.keys(canonicalDict)) out[id] = canonicalDict[id]![locale];
    for (const [k, v] of Object.entries(raw.pt)) out[k] = v;
    if (locale !== 'pt') {
      for (const [k, v] of Object.entries(raw[locale])) out[k] = v;
      for (const [norm, ids] of normalizedLegacyIndex) {
        out[norm] = canonicalDict[ids[0]!]![locale];
      }
    }
    return out;
  };
  return { pt: build('pt'), en: build('en'), es: build('es') };
})();

/** Mapa achatado (canônico + legado) de um idioma. */
export function getDictionary(locale: Locale): Dict {
  return dictionaries[locale] ?? dictionaries.pt;
}

// ---------------------------------------------------------------------------
// SEO metadata helpers (server-side / layout metadata)
// ---------------------------------------------------------------------------
export const siteName = 'MaeumGlobal';

export const seoDefaults: Record<Locale, { title: string; description: string }> = {
  pt: {
    title: 'MaeumGlobal | Turismo & Intercâmbio de Luxo na Ásia',
    description:
      'O MaeumGlobal é um aplicativo e plataforma de gestão de turismo de luxo e intercâmbio. Descubra a Ásia antes mesmo de embarcar. Roteiros personalizados, hotéis de luxo, experiências exclusivas e intercâmbio de alto padrão.',
  },
  en: {
    title: 'MaeumGlobal | Luxury Travel & Exchange in Asia',
    description:
      'MaeumGlobal is a luxury travel and exchange management platform. Discover Asia before you even board. Personalized itineraries, luxury hotels, exclusive experiences and high-end exchange programs.',
  },
  es: {
    title: 'MaeumGlobal | Turismo & Intercambio de Lujo en Asia',
    description:
      'MaeumGlobal es una plataforma de gestión de turismo e intercambio de lujo. Descubre Asia antes de embarcar. Itinerarios personalizados, hoteles de lujo, experiencias exclusivas y intercambios de alto nivel.',
  },
};