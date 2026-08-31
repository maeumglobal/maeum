import type { Locale } from './config';
import { raw as home } from './home';
import { raw as contato } from './contato';
import { raw as destinos } from './destinos';
import { raw as experiencias } from './experiencias';
import { raw as intercambios } from './intercambios';
import { raw as pacotes } from './pacotes';
import { raw as jornadas } from './jornadas';
import { raw as sobre } from './sobre';
import { raw as journal } from './journal';
import { raw as legal } from './legal';
import { raw as coreia } from './coreia';
import { raw as components } from './components';
import { raw as detalhe } from './detalhe';

function merge(...chunks: Record<Locale, Record<string, string>>[]): Record<Locale, Record<string, string>> {
  const out: Record<Locale, Record<string, string>> = { pt: {}, en: {}, es: {} };
  for (const chunk of chunks) {
    for (const loc of (['pt', 'en', 'es'] as Locale[])) {
      Object.assign(out[loc], chunk[loc]);
    }
  }
  return out;
}

export const raw: Record<Locale, Record<string, string>> = merge(
  home, contato, destinos, experiencias, intercambios, pacotes, jornadas, sobre, journal, legal, coreia, components, detalhe
);

/**
 * Returns the flat, merged translation map for a given locale. Portuguese is
 * the source of truth; any missing key in en/es falls back to Portuguese.
 * Keys are the Portuguese source strings used by `t('...')`.
 */
export function getDictionary(locale: Locale): Record<string, string> {
  const base = raw.pt;
  const source = raw[locale] ?? raw.pt;
  const merged: Record<string, string> = { ...base };
  if (locale !== 'pt') {
    for (const k of Object.keys(source)) merged[k] = source[k];
  }
  return merged;
}

export type Dict = Record<string, string>;

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
      'MaeumGlobal es una plataforma de gestión de turismo e intercambio de lujo. Descubre Asia antes de embarcar. Itinerarios personalizados, hoteles de lujo, experiencias exclusivas e intercambios de alto nivel.',
  },
};