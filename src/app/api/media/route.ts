import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStaff } from '@/lib/auth';
import { auditLog } from '@/lib/audit';
import { rateLimit, getClientIp, RATE_LIMIT_MESSAGE } from '@/lib/rateLimit';
import { fail } from '@/lib/actionKit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Upload de mídia do painel.
 *
 * Substitui o Supabase Storage: o binário vai para `MediaAsset.data` (Bytes no
 * Postgres) e é servido por `/api/media/[id]`. Motivo: a
 * `SUPABASE_SERVICE_ROLE_KEY` do projeto é na verdade a anon key (401 em tudo) e
 * as policies criadas por `ensureMediaBucket` davam escrita ao papel `anon`.
 */
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
};

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
};

function cleanName(name: string): string {
  return (
    name
      .replace(/\.[a-z0-9]+$/i, '')
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60) || 'imagem'
  );
}

/**
 * Lê largura/altura direto do cabeçalho do arquivo — sem dependência externa
 * (nada de sharp no caminho de request). Retorna null em formatos desconhecidos.
 */
function readDimensions(buf: Buffer, mime: string): { width: number; height: number } | null {
  try {
    // PNG
    if (mime === 'image/png' && buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
      return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    }
    // GIF
    if (mime === 'image/gif' && buf.length > 10) {
      const sig = buf.subarray(0, 3).toString('ascii');
      if (sig === 'GIF') return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
    }
    // JPEG
    if (mime === 'image/jpeg' || mime === 'image/jpg') {
      let offset = 2;
      while (offset + 9 < buf.length) {
        if (buf[offset] !== 0xff) {
          offset += 1;
          continue;
        }
        const marker = buf[offset + 1]!;
        const size = buf.readUInt16BE(offset + 2);
        const isSof =
          (marker >= 0xc0 && marker <= 0xc3) ||
          (marker >= 0xc5 && marker <= 0xc7) ||
          (marker >= 0xc9 && marker <= 0xcb) ||
          (marker >= 0xcd && marker <= 0xcf);
        if (isSof) {
          return { height: buf.readUInt16BE(offset + 5), width: buf.readUInt16BE(offset + 7) };
        }
        offset += 2 + size;
      }
      return null;
    }
    // WEBP
    if (mime === 'image/webp' && buf.length > 30 && buf.subarray(8, 12).toString('ascii') === 'WEBP') {
      const format = buf.subarray(12, 16).toString('ascii');
      if (format === 'VP8 ') {
        return {
          width: buf.readUInt16LE(26) & 0x3fff,
          height: buf.readUInt16LE(28) & 0x3fff,
        };
      }
      if (format === 'VP8L') {
        const bits = buf.readUInt32LE(21);
        return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
      }
      if (format === 'VP8X') {
        const width = 1 + buf[24]! + (buf[25]! << 8) + (buf[26]! << 16);
        const height = 1 + buf[27]! + (buf[28]! << 8) + (buf[29]! << 16);
        return { width, height };
      }
      return null;
    }
    // AVIF (ISO-BMFF): procura o box `ispe`
    if (mime === 'image/avif') {
      const marker = Buffer.from('ispe', 'ascii');
      const idx = buf.indexOf(marker);
      if (idx > 0 && idx + 12 <= buf.length) {
        return { width: buf.readUInt32BE(idx + 8), height: buf.readUInt32BE(idx + 12) };
      }
      return null;
    }
  } catch {
    return null;
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const ctx = await requireStaff();
    const ip = await getClientIp();
    const limit = rateLimit(`media:upload:${ctx.user.id}:${ip}`, { limit: 60, windowMs: 10 * 60 * 1000 });
    if (!limit.ok) {
      return NextResponse.json({ success: false, error: RATE_LIMIT_MESSAGE }, { status: 429 });
    }

    const form = await request.formData();
    const file = form.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'Selecione um arquivo de imagem.' }, { status: 400 });
    }

    const mime = (file.type || '').toLowerCase();
    if (!ALLOWED_MIME[mime]) {
      return NextResponse.json(
        { success: false, error: 'Formato não suportado. Use JPG, PNG, WebP, AVIF ou GIF.' },
        { status: 400 },
      );
    }
    if (file.size <= 0) {
      return NextResponse.json({ success: false, error: 'Arquivo vazio.' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { success: false, error: 'A imagem deve ter no máximo 5 MB.' },
        { status: 413 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const dims = readDimensions(buffer, mime);
    const id = crypto.randomUUID();
    const altRaw = form.get('alt');
    const folderRaw = form.get('folder');

    const asset = await prisma.mediaAsset.create({
      data: {
        id,
        filename: `${cleanName(file.name)}.${EXT_BY_MIME[mime] ?? 'bin'}`,
        mimeType: mime,
        size: buffer.byteLength,
        width: dims?.width ?? null,
        height: dims?.height ?? null,
        alt: typeof altRaw === 'string' && altRaw.trim() ? altRaw.trim().slice(0, 300) : null,
        folder:
          typeof folderRaw === 'string' && folderRaw.trim()
            ? folderRaw.trim().replace(/[^a-z0-9_-]/gi, '-').slice(0, 40)
            : 'geral',
        data: buffer,
        uploadedById: ctx.user.id,
      },
      select: { id: true, size: true, width: true, height: true },
    });

    auditLog({
      userId: ctx.user.id,
      action: 'media.upload',
      entity: 'MediaAsset',
      entityId: asset.id,
      details: `${mime} · ${buffer.byteLength} bytes`,
    });

    return NextResponse.json({
      success: true,
      id: asset.id,
      url: `/api/media/${asset.id}`,
      width: asset.width,
      height: asset.height,
      size: asset.size,
      mimeType: mime,
    });
  } catch (error) {
    const result = fail(error, 'Não foi possível enviar a imagem.');
    const status = error instanceof Error && error.name === 'AuthError' ? 403 : 400;
    return NextResponse.json(result, { status });
  }
}