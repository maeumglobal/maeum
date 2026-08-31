'use server';

import { revalidatePath } from 'next/cache';
import {
  getTextOverrides,
  getMediaOverrides,
  saveTextOverrides,
  saveMediaOverrides,
  type TextOverrides,
  type MediaOverrides,
} from '@/lib/cmsData';
import { getMediaMap } from '@/lib/cmsData';
import { MEDIA_SLOTS } from '@/lib/mediaSlots';
import { MEDIA_BUCKET } from '@/lib/supabaseStorage';
import { prisma } from '@/lib/prisma';

// ─── LEITURA ───────────────────────────────────────────────

export async function getCmsText() {
  const data = await getTextOverrides();
  return { success: true, data };
}

export async function getCmsMedia() {
  const data = await getMediaOverrides();
  return { success: true, data };
}

/** Mapa completo slot → URL efetiva (override ou fallback) para o site público. */
export async function getCmsMediaMap() {
  const data = await getMediaMap();
  return { success: true, data };
}

export async function getCmsSlots() {
  return { success: true, data: MEDIA_SLOTS };
}

// ─── ESCRITA ───────────────────────────────────────────────

export async function saveCmsText(text: TextOverrides) {
  const ok = await saveTextOverrides(text);
  if (ok) revalidatePath('/', 'layout');
  return { success: ok };
}

export async function saveCmsMedia(media: MediaOverrides) {
  const ok = await saveMediaOverrides(media);
  if (ok) revalidatePath('/', 'layout');
  return { success: ok };
}

// ─── STORAGE ───────────────────────────────────────────────

/**
 * Garante que o bucket de imagens existe, é público e permite upload/delete
 * pelo cliente (anon). Criação idempotente via SQL direto no banco, já que a
 * service-role key do projeto não tem privilégios de Storage.
 */
export async function ensureMediaBucket() {
  try {
    await prisma.$executeRawUnsafe(`
      INSERT INTO storage.buckets (id, name, public, file_size_limit)
      VALUES ('${MEDIA_BUCKET}', '${MEDIA_BUCKET}', true, 10485760)
      ON CONFLICT (id) DO NOTHING;
    `);
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='maeum_public_upload') THEN
          CREATE POLICY "maeum_public_upload" ON storage.objects
            FOR INSERT TO anon WITH CHECK (bucket_id = '${MEDIA_BUCKET}');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='maeum_public_delete') THEN
          CREATE POLICY "maeum_public_delete" ON storage.objects
            FOR DELETE TO anon USING (bucket_id = '${MEDIA_BUCKET}');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='maeum_public_select') THEN
          CREATE POLICY "maeum_public_select" ON storage.objects
            FOR SELECT TO anon USING (bucket_id = '${MEDIA_BUCKET}');
        END IF;
      END $$;
    `);
    return { success: true, created: true };
  } catch (error) {
    console.error('ensureMediaBucket error:', error);
    return { success: false, error: 'Erro ao configurar o bucket de imagens no Supabase.' };
  }
}

/** Atualiza um único slot mantendo os demais. */
export async function updateCmsMediaSlot(slot: string, url: string) {
  const current = await getMediaOverrides();
  const next: MediaOverrides = { ...current };
  if (url) next[slot] = url;
  else delete next[slot];
  const ok = await saveMediaOverrides(next);
  if (ok) revalidatePath('/', 'layout');
  return { success: ok };
}
