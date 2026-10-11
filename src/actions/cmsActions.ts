'use server';

/**
 * CMS (textos e mídias editáveis pelo painel).
 *
 * Autorização: leitura PÚBLICA (o `SiteContentProvider` do site inteiro chama
 * `getCmsText`/`getCmsMediaMap`), escrita `requireAdmin()`.
 *
 * Correções aplicadas:
 *  - `ensureMediaBucket()` REMOVIDO: criava bucket/policies de Storage via
 *    `$executeRawUnsafe` sem autenticação, abrindo INSERT/DELETE para o papel
 *    `anon`. Upload agora é server-side em `POST /api/media`.
 *  - `saveCmsMedia` valida cada URL com `safeUrl()` — `javascript:` e `data:`
 *    são rejeitados (antes iam direto para o banco e para o `src` das imagens).
 */
import { revalidatePath } from 'next/cache';
import {
  getTextOverrides,
  getMediaOverrides,
  getMediaMap,
  saveTextOverrides,
  saveMediaOverrides,
  sanitizeTextOverrides,
  sanitizeMediaOverrides,
  getNavigationMap,
  type TextOverrides,
  type MediaOverrides,
  type NavigationMap,
} from '@/lib/cmsData';
import { MEDIA_SLOTS, getMediaSlot } from '@/lib/mediaSlots';
import { requireAdmin } from '@/lib/auth';
import { auditLog } from '@/lib/audit';
import { safeUrl } from '@/lib/validate';
import { fail, failPublic, ok, type ActionInput, type ActionResult } from '@/lib/actionKit';

// ─── LEITURA ────────────────────────────────────────────────

export async function getCmsText(): Promise<ActionResult<TextOverrides>> {
  try {
    return ok(await getTextOverrides());
  } catch (error) {
    return fail(error, 'Erro ao carregar textos.');
  }
}

export async function getCmsMedia(): Promise<ActionResult<MediaOverrides>> {
  try {
    return ok(await getMediaOverrides());
  } catch (error) {
    return fail(error, 'Erro ao carregar imagens.');
  }
}

/** Mapa completo slot → URL efetiva (override ou fallback) para o site público. */
export async function getCmsMediaMap(): Promise<ActionResult<Record<string, string>>> {
  try {
    return ok(await getMediaMap());
  } catch (error) {
    return fail(error, 'Erro ao carregar imagens.');
  }
}

export async function getCmsSlots(): Promise<ActionResult<unknown>> {
  try {
    return ok(MEDIA_SLOTS);
  } catch (error) {
    return fail(error, 'Erro ao carregar os slots de mídia.');
  }
}

/**
 * Menu do site, para o `SiteContentContext`.
 *
 * PÚBLICA de propósito: o Header e o Footer são renderizados para visitantes
 * anônimos. Não devolve nada sensível — só `NavigationItem` ativo, com a URL já
 * validada por `safeUrl()` (nenhum `javascript:` chega ao DOM) e limited a 300
 * itens. Escrita continua sendo `requireAdmin()` em `siteConfigActions.ts`.
 */
export async function getCmsNavigation(): Promise<ActionResult<NavigationMap>> {
  try {
    return ok(await getNavigationMap());
  } catch {
    // `getNavigationMap` já trata a própria falha e devolve {} — o Header e o
    // Footer caem no menu estático, então não há o que reportar aqui.
    return failPublic('Erro ao carregar o menu.');
  }
}

// ─── ESCRITA ────────────────────────────────────────────────

export async function saveCmsText(input: ActionInput): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requireAdmin();

    const parsed = sanitizeTextOverrides(readBlob(input, 'text'));
    const saved = await saveTextOverrides(parsed);
    if (!saved) return { success: false, error: 'Erro ao salvar textos.' };

    auditLog({
      userId: ctx.user.id,
      action: 'cms.text_save',
      entity: 'SiteSetting',
      entityId: 'cms_text',
      details: `${Object.values(parsed).reduce((acc, bucket) => acc + Object.keys(bucket).length, 0)} chaves`,
    });
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    return fail(error, 'Erro ao salvar textos.');
  }
}

export async function saveCmsMedia(input: ActionInput): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requireAdmin();

    const raw = readBlob(input, 'media');
    const sanitized = sanitizeMediaOverrides(raw);
    const validated: MediaOverrides = {};

    for (const [slot, value] of Object.entries(sanitized)) {
      // Chave precisa ser um slot conhecido — evita injetar override arbitrário.
      if (!getMediaSlot(slot)) continue;
      const safe = safeUrl(value);
      if (!safe) {
        return { success: false, error: `URL inválida no slot "${slot}". Use um caminho interno (/) ou http(s).` };
      }
      validated[slot] = safe;
    }

    const saved = await saveMediaOverrides(validated);
    if (!saved) return { success: false, error: 'Erro ao salvar imagens.' };

    auditLog({
      userId: ctx.user.id,
      action: 'cms.media_save',
      entity: 'SiteSetting',
      entityId: 'cms_media',
      details: `${Object.keys(validated).length} slots`,
    });
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    return fail(error, 'Erro ao salvar imagens.');
  }
}

/** Atualiza um único slot mantendo os demais. */
export async function updateCmsMediaSlot(slot: string, url: string): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requireAdmin();
    if (!getMediaSlot(slot)) return { success: false, error: 'Slot de mídia desconhecido.' };

    const current = await getMediaOverrides();
    const next: MediaOverrides = { ...current };

    const safe = url ? safeUrl(url) : null;
    if (url && !safe) return { success: false, error: 'URL inválida. Use "/" ou http(s).' };
    if (safe) next[slot] = safe;
    else delete next[slot];

    const saved = await saveMediaOverrides(next);
    if (!saved) return { success: false, error: 'Erro ao salvar imagem.' };

    auditLog({
      userId: ctx.user.id,
      action: 'cms.media_slot_save',
      entity: 'SiteSetting',
      entityId: `cms_media:${slot}`,
      details: safe ?? '(removido)',
    });
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    return fail(error, 'Erro ao salvar imagem.');
  }
}

// ─── INTERNOS ──────────────────────────────────────────────

/**
 * Lê o "blob" do CMS. Aceita três formatos:
 *  1) FormData com o campo `key` contendo JSON serializado;
 *  2) objeto simples `{ text: {...} }` / `{ media: {...} }` (componente legado);
 *  3) o próprio objeto já no formato do CMS (`saveCmsText(overrides)`).
 */
function readBlob(input: ActionInput, key: string): unknown {
  if (input && typeof FormData !== 'undefined' && input instanceof FormData) {
    return parseJson(String(input.get(key) ?? ''));
  }
  if (input && typeof input === 'object') {
    const record = input as Record<string, unknown>;
    if (record[key] !== undefined) return parseJson(String(record[key] ?? ''));
    return record;
  }
  return {};
}

function parseJson(raw: string): unknown {
  const text = raw.trim();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}