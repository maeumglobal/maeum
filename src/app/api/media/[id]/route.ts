import { prisma } from '@/lib/prisma';
import { sha256 } from '@/lib/password';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Serve os bytes de `MediaAsset`.
 *
 * Público por design (as imagens do site são públicas), com cache imutável de
 * 1 ano: o id é um UUID gerado no upload e nunca é reaproveitado.
 */
function headersFor(asset: { id: string; mimeType: string; size: number; etag: string }): Headers {
  const headers = new Headers();
  headers.set('Content-Type', asset.mimeType);
  headers.set('Content-Length', String(asset.size));
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('ETag', asset.etag);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Content-Disposition', 'inline');
  return headers;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const asset = await prisma.mediaAsset.findUnique({
    where: { id },
    select: { id: true, mimeType: true, size: true, data: true },
  });

  if (!asset) {
    return new Response('Not found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }

  const etag = `"${sha256(`${asset.id}:${asset.size}`).slice(0, 32)}"`;
  const headers = headersFor({ ...asset, etag });

  const ifNoneMatch = _request.headers.get('if-none-match');
  if (ifNoneMatch && ifNoneMatch === etag) {
    return new Response(null, { status: 304, headers });
  }

  const bytes = asset.data instanceof Uint8Array ? asset.data : new Uint8Array(asset.data);
  return new Response(new Uint8Array(bytes), { status: 200, headers });
}

export async function HEAD(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const asset = await prisma.mediaAsset.findUnique({
    where: { id },
    select: { id: true, mimeType: true, size: true },
  });

  if (!asset) {
    return new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }

  const etag = `"${sha256(`${asset.id}:${asset.size}`).slice(0, 32)}"`;
  return new Response(null, { status: 200, headers: headersFor({ ...asset, etag }) });
}