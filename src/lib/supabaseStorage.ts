import { supabase } from '@/lib/supabaseAuth';

export const MEDIA_BUCKET = 'maeum-images';

/** URLs de mídia que foram enviadas ao Supabase Storage (e portanto podem ser apagadas). */
export function isStoredImage(url: string): boolean {
  return !!url && !url.startsWith('data:') && url.indexOf(MEDIA_BUCKET) !== -1;
}

export async function uploadImage(file: File, folder: string = 'general'): Promise<string | null> {
  if (!supabase) return null;
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const { data, error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(fileName, file, { cacheControl: '3600', upsert: false, contentType: file.type });
  if (error) {
    console.error('uploadImage error:', error);
    return null;
  }
  const { data: urlData } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(data.path);
  return urlData?.publicUrl || null;
}

export async function deleteImage(url: string): Promise<boolean> {
  if (!supabase || !isStoredImage(url)) return false;
  const path = url.split(`${MEDIA_BUCKET}/`)[1];
  if (!path) return false;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).remove([path]);
  if (error) console.error('deleteImage error:', error);
  return !error;
}

/** Extrai o caminho (path) de um objeto a partir da sua URL pública. */
export function extractStoragePath(url: string): string | null {
  if (!isStoredImage(url)) return null;
  return url.split(`${MEDIA_BUCKET}/`)[1] || null;
}
