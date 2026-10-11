import { prisma } from '@/lib/prisma';
import type { Locale } from '@/i18n/config';
import { MEDIA_SLOTS } from '@/lib/mediaSlots';
import { safeUrl } from '@/lib/validate';

// Conteúdo editável do site, persistido em `SiteSetting` (tabela nova).
// A antiga `maeum_site_settings` foi removida do schema.
//
// cms_text  → overrides do dicionário de traduções por idioma:
//             { pt: { "chaveOrigem": "texto", ... }, en: {...}, es: {...} }
// cms_media → mapa slot → URL: { "home_hero_desktop": "/images/..." }

export const KEY_TEXT = 'cms_text';
export const KEY_MEDIA = 'cms_media';

export type TextOverrides = Record<Locale, Record<string, string>>;
export type MediaOverrides = Record<string, string>;

const LOCALES: readonly Locale[] = ['pt', 'en', 'es'];
const MAX_TEXT_ENTRIES = 4000;
const MAX_MEDIA_ENTRIES = 300;
const MAX_VALUE_LEN = 4000;

export const emptyTextOverrides = (): TextOverrides => ({ pt: {}, en: {}, es: {} });

function sanitizeTextBucket(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  let count = 0;
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (count >= MAX_TEXT_ENTRIES) break;
    if (typeof value !== 'string') continue;
    const cleanKey = key.replace(/\0/g, '').slice(0, 120);
    if (!cleanKey) continue;
    out[cleanKey] = value.replace(/\0/g, '').slice(0, MAX_VALUE_LEN);
    count += 1;
  }
  return out;
}

export function sanitizeTextOverrides(raw: unknown): TextOverrides {
  const source = (raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}) as Record<string, unknown>;
  const out = emptyTextOverrides();
  for (const locale of LOCALES) {
    out[locale] = sanitizeTextBucket(source[locale]);
  }
  return out;
}

export function sanitizeMediaOverrides(raw: unknown): MediaOverrides {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: MediaOverrides = {};
  let count = 0;
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (count >= MAX_MEDIA_ENTRIES) break;
    if (typeof value !== 'string') continue;
    const cleanKey = key.replace(/\0/g, '').slice(0, 120);
    const cleanValue = value.replace(/\0/g, '').slice(0, 2000);
    if (!cleanKey || !cleanValue) continue;
    out[cleanKey] = cleanValue;
    count += 1;
  }
  return out;
}

async function readSettings(key: string): Promise<unknown> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key }, select: { value: true } });
    if (!row || row.value == null) return undefined;
    if (typeof row.value === 'string') {
      try {
        return JSON.parse(row.value);
      } catch {
        return row.value;
      }
    }
    return row.value;
  } catch {
    return undefined;
  }
}

async function writeSettings(key: string, value: unknown): Promise<boolean> {
  try {
    await prisma.siteSetting.upsert({
      where: { key },
      update: { value: value as never },
      create: { key, value: value as never },
    });
    return true;
  } catch (error) {
    console.error(`[cmsData] falha ao gravar ${key}:`, error instanceof Error ? error.message : error);
    return false;
  }
}

export async function getTextOverrides(): Promise<TextOverrides> {
  return sanitizeTextOverrides(await readSettings(KEY_TEXT));
}

export async function getMediaOverrides(): Promise<MediaOverrides> {
  return sanitizeMediaOverrides(await readSettings(KEY_MEDIA));
}

/** Retorna todas as mídias já mescladas com os fallbacks (URL efetiva por slot). */
export async function getMediaMap(): Promise<Record<string, string>> {
  const overrides = await getMediaOverrides();
  const map: Record<string, string> = {};
  for (const slot of MEDIA_SLOTS) {
    map[slot.key] = overrides[slot.key] || slot.fallback;
  }
  return map;
}

export async function saveTextOverrides(text: TextOverrides): Promise<boolean> {
  return writeSettings(KEY_TEXT, sanitizeTextOverrides(text));
}

export async function saveMediaOverrides(media: MediaOverrides): Promise<boolean> {
  return writeSettings(KEY_MEDIA, sanitizeMediaOverrides(media));
}

// ─────────────────────────────────────────────────────────────────────────────
// Navegação do site (tabela `NavigationItem`), editável em Configurações > Navegação.
//
// É lida no SERVIDOR e entregue ao `SiteContentProvider` pelo layout raiz — o
// Header e o Footer são client components, mas assim o menu editado pelo painel
// chega no primeiro paint, sem uma ida extra ao banco pelo cliente.
// Qualquer falha devolve `{}`: o Header/Footer caem na lista estática embutida.
// ─────────────────────────────────────────────────────────────────────────────

export interface PublicNavItem {
  id: string;
  parentId: string | null;
  navigationType: string;
  label: string;
  labelEn: string | null;
  labelEs: string | null;
  url: string;
  icon: string | null;
  sortOrder: number;
}

export type NavigationMap = Record<string, PublicNavItem[]>;

export async function getNavigationMap(): Promise<NavigationMap> {
  try {
    const rows = await prisma.navigationItem.findMany({
      where: { isActive: true },
      orderBy: [{ navigationType: 'asc' }, { sortOrder: 'asc' }],
      take: 300,
      select: {
        id: true,
        parentId: true,
        navigationType: true,
        label: true,
        labelEn: true,
        labelEs: true,
        url: true,
        icon: true,
        sortOrder: true,
      },
    });

    const map: NavigationMap = {};
    for (const row of rows) {
      // `javascript:` / `data:` nunca chegam ao DOM.
      const url = safeUrl(row.url);
      if (!url || !row.label.trim()) continue;
      (map[row.navigationType] ||= []).push({ ...row, url });
    }
    return map;
  } catch (error) {
    console.warn('[cmsData] falha ao ler a navegação:', error instanceof Error ? error.message : error);
    return {};
  }
}

/** Itens de um tipo de navegação, sem os que têm pai (submenu). */
export function topLevelItems(items: PublicNavItem[] | undefined): PublicNavItem[] {
  return (items ?? []).filter((item) => !item.parentId);
}

/** Rótulo do item no idioma do visitante, com fallback para o pt do painel. */
export function navLabel(item: PublicNavItem, locale: Locale): string {
  const localized = locale === 'en' ? item.labelEn : locale === 'es' ? item.labelEs : item.label;
  return localized?.trim() || item.label;
}

/** Link externo (http/https) ou rota interna? */
export function isExternalNav(url: string): boolean {
  return /^https?:\/\//i.test(url);
}