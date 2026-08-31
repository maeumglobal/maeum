import type { Locale } from '@/i18n/config';
import { raw as home } from '@/i18n/home';
import { raw as contato } from '@/i18n/contato';
import { raw as destinos } from '@/i18n/destinos';
import { raw as experiencias } from '@/i18n/experiencias';
import { raw as intercambios } from '@/i18n/intercambios';
import { raw as pacotes } from '@/i18n/pacotes';
import { raw as jornadas } from '@/i18n/jornadas';
import { raw as sobre } from '@/i18n/sobre';
import { raw as journal } from '@/i18n/journal';
import { raw as legal } from '@/i18n/legal';
import { raw as coreia } from '@/i18n/coreia';
import { raw as components } from '@/i18n/components';
import { raw as detalhe } from '@/i18n/detalhe';

export interface TextGroup {
  id: string;
  label: string;
  dict: Record<Locale, Record<string, string>>;
}

export const TEXT_GROUPS: TextGroup[] = [
  { id: 'home', label: 'Home', dict: home },
  { id: 'contato', label: 'Contato', dict: contato },
  { id: 'destinos', label: 'Destinos', dict: destinos },
  { id: 'experiencias', label: 'Experiências', dict: experiencias },
  { id: 'intercambios', label: 'Intercâmbios', dict: intercambios },
  { id: 'pacotes', label: 'Pacotes', dict: pacotes },
  { id: 'jornadas', label: 'Jornadas', dict: jornadas },
  { id: 'sobre', label: 'Sobre', dict: sobre },
  { id: 'journal', label: 'Journal', dict: journal },
  { id: 'legal', label: 'Páginas Legais', dict: legal },
  { id: 'coreia', label: 'Coreia do Sul', dict: coreia },
  { id: 'components', label: 'Componentes Globais', dict: components },
  { id: 'detalhe', label: 'Páginas de Detalhe', dict: detalhe },
];

/** Todas as chaves disponíveis no dicionário estático (referência para o editor). */
export function getAllTextKeys(): { key: string; group: string }[] {
  const out: { key: string; group: string }[] = [];
  for (const group of TEXT_GROUPS) {
    for (const key of Object.keys(group.dict.pt)) {
      if (!out.some((e) => e.key === key)) out.push({ key, group: group.label });
    }
  }
  return out;
}
