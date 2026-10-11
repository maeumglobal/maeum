/**
 * Aliases legados: chaves antigas que NÃO são o texto em português e portanto
 * não entram no índice automático (ver `src/i18n/index.ts`).
 *
 * São as únicas situações em que uma chamada `t(...)` usa uma string diferente
 * do valor pt da entrada. Sempre que possível, migre a chamada para a chave
 * canônica.
 */
import type { TranslationKey } from './index';

export const LEGACY_ALIASES: Readonly<Record<string, TranslationKey>> = {
  // --- src/app/proposta/[unique_link]/page.tsx usava a chave em espanhol ----
  '¿Qué cambios o ajustes te gustaría solicitar?': 'components.proposal.changesQuestion',
  '¡Proposta Aprovada com sucesso!': 'components.proposal.approvedSuccess',

  // --- chaves com espaço no início (herdadas de src/i18n/sobre.ts) --------
  ' A Maeum Global está sempre aberta a novas parcerias que acrescentem valor às nossas jornadas.':
    'sobre.partnership.cardDescription',
  ' Se você deseja promover sua marca, produto ou serviço para um público seleto e altamente engajado, entre em contato conosco.':
    'sobre.partnership.promotionLine',
  'A Maeum Global está sempre aberta a novas parcerias que acrescentem valor às nossas jornadas. Se você deseja promover sua marca, produto ou serviço para um público seleto e altamente engajado, entre em contato conosco.':
    'sobre.partnership.descriptionFull',

  // --- src/i18n/pacotes.ts usava a chave em inglês ---------------------------
  Tradition: 'pacotes.cta.imageAlt',
};

/**
 * Índice normalizado (mesma normalização de `normalizeKey`) dos aliases, para
 * que `t()` encontre o alias mesmo com acento/espaço/fim de linha divergentes.
 */
export const normalizedAliases = new Map<string, TranslationKey>();
for (const [legacy, canonical] of Object.entries(LEGACY_ALIASES)) {
  normalizedAliases.set(
    legacy
      .replace(/\r\n?/g, '\n')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/^\s+|\s+$/g, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[ \t]+/g, ' '),
    canonical,
  );
}