import { prisma } from '@/lib/prisma';
import type { Locale } from '@/i18n/config';
import { MEDIA_SLOTS } from '@/lib/mediaSlots';

// Conteúdo editável do site, persistido na tabela maeum_site_settings.
//
// cms_text  → overrides do dicionário de traduções por idioma:
//             { pt: { "chaveOrigem": "texto", ... }, en: {...}, es: {...} }
// cms_media → mapa slot → URL: { "home_hero_desktop": "/images/..." }

export const KEY_TEXT = 'cms_text';
export const KEY_MEDIA = 'cms_media';

export type TextOverrides = Record<Locale, Record<string, string>>;
export type MediaOverrides = Record<string, string>;

export const emptyTextOverrides = (): TextOverrides => ({ pt: {}, en: {}, es: {} });

async function readSettings(key: string): Promise<unknown> {
  try {
    const row = await prisma.maeum_site_settings.findUnique({ where: { key } });
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

export async function getTextOverrides(): Promise<TextOverrides> {
  const raw = await readSettings(KEY_TEXT);
  if (raw && typeof raw === 'object') {
    const obj = raw as Partial<Record<Locale, unknown>>;
    return {
      pt: (obj.pt && typeof obj.pt === 'object' ? obj.pt : {}) as Record<string, string>,
      en: (obj.en && typeof obj.en === 'object' ? obj.en : {}) as Record<string, string>,
      es: (obj.es && typeof obj.es === 'object' ? obj.es : {}) as Record<string, string>,
    };
  }
  return emptyTextOverrides();
}

export async function getMediaOverrides(): Promise<MediaOverrides> {
  const raw = await readSettings(KEY_MEDIA);
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as MediaOverrides;
  }
  return {};
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
  try {
    await prisma.maeum_site_settings.upsert({
      where: { key: KEY_TEXT },
      update: { value: text },
      create: { key: KEY_TEXT, value: text },
    });
    return true;
  } catch (error) {
    console.error('saveTextOverrides error:', error);
    return false;
  }
}

export async function saveMediaOverrides(media: MediaOverrides): Promise<boolean> {
  try {
    await prisma.maeum_site_settings.upsert({
      where: { key: KEY_MEDIA },
      update: { value: media },
      create: { key: KEY_MEDIA, value: media },
    });
    return true;
  } catch (error) {
    console.error('saveMediaOverrides error:', error);
    return false;
  }
}
