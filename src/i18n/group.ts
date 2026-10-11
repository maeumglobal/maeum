/**
 * Fábrica de grupos de dicionário.
 *
 * Cada grupo (`src/i18n/<grupo>.ts`) declara entradas com um id local curto;
 * o id canônico exposto ao `t()` é sempre `<grupo>.<id-local>`.
 *
 *   const g = makeGroup('home');
 *   g('nav.home', 'Home', 'Home', 'Inicio');
 *   // -> t('home.nav.home')
 *
 * A assinatura de `g` exige os quatro valores (pt, en, es): o TypeScript passa
 * a garantir que nenhuma chave fique sem tradução em en/es.
 */
import type { Locale } from './config';

export const dictGroups = [
  'home',
  'contato',
  'destinos',
  'experiencias',
  'intercambios',
  'pacotes',
  'jornadas',
  'sobre',
  'journal',
  'legal',
  'coreia',
  'components',
  'detalhe',
  'admin',
] as const;

export type DictGroup = (typeof dictGroups)[number];

/** Nomes amigáveis dos grupos (usados pelo editor do CMS e pelo relatório de chaves). */
export const dictGroupLabels: Record<DictGroup, string> = {
  home: 'Home',
  contato: 'Contato',
  destinos: 'Destinos',
  experiencias: 'Experiências',
  intercambios: 'Intercâmbios',
  pacotes: 'Pacotes',
  jornadas: 'Jornadas',
  sobre: 'Sobre',
  journal: 'Journal',
  legal: 'Páginas Legais',
  coreia: 'Coreia do Sul',
  components: 'Componentes Globais',
  detalhe: 'Páginas de Detalhe',
  admin: 'Painel Administrativo',
};

export type GroupBuilder = {
  /** Declara uma entrada do grupo. Todos os idiomas são obrigatórios. */
  (localId: string, pt: string, en: string, es: string): void;
  /** Prefixo canônico do grupo (ex.: `home`). */
  readonly prefix: string;
  /** Mapa canônico `home.<id>` -> traduções. */
  readonly canonical: Record<string, Record<Locale, string>>;
  /**
   * Mapa plano legado `texto-pt` -> traduções, por idioma. Mantido para
   * compatibilidade com `src/lib/textCatalog.ts` (editor do CMS) e para as
   * overrides salvas no painel, que ainda são indexadas pelo texto em pt.
   */
  readonly raw: Record<Locale, Record<string, string>>;
};

export function makeGroup(group: DictGroup): GroupBuilder {
  const canonical: Record<string, Record<Locale, string>> = {};
  const raw: Record<Locale, Record<string, string>> = { pt: {}, en: {}, es: {} };

  const add = ((localId: string, pt: string, en: string, es: string) => {
    const fullId = `${group}.${localId}`;
    canonical[fullId] = { pt, en, es };
    raw.pt[pt] = pt;
    raw.en[pt] = en;
    raw.es[pt] = es;
  }) as GroupBuilder;

  Object.defineProperties(add, {
    prefix: { value: group, enumerable: true },
    canonical: { value: canonical, enumerable: true },
    raw: { value: raw, enumerable: true },
  });

  return add;
}