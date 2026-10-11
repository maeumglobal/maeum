import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { auditLog } from '@/lib/audit';
import { rateLimit, getClientIp, RATE_LIMIT_MESSAGE } from '@/lib/rateLimit';
import { fail } from '@/lib/actionKit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Upload de ARQUIVO DO CLIENTE (`/api/media/client`).
 *
 * ## Por que existe separada de `/api/media`
 *
 * `POST /api/media` é o fluxo do painel e exige `requireStaff()`: ele é quem
 * monta banners, cards e avatares da equipe. O portal do cliente precisa de dois
 * tipos de arquivo que aquela rota não aceita:
 *
 *  - **documentos** (passaporte, visto, RG) — PDF. `ALLOWED_MIME` do painel é
 *    só de imagens, porque ali não entra documento de cliente;
 *  - **avatar** — imagem, mas upada por um `customer`, que não é staff.
 *
 * O endpoint grava o binário em `MediaAsset` (mesmo caminho do painel) e
 * devolve `url = /api/media/<id>`. O `Document` correspondente é criado pela
 * action `uploadClientDocument` (src/actions/clientActions.ts), que já trava
 * `clientId`/`uploadedById` na sessão — aqui o endpoint só acha o arquivo.
 *
 * ⚠️ `GET /api/media/[id]` é público por design (as mídias do site são públicas),
 * então um documento enviado por esta rota fica acessível a quem tiver o UUID.
 * O UUID é gerado no upload e nunca reaproveitado, o mesmo modelo das imagens do
 * site. Se documentos do cliente precisarem de sigilo real, mover o binário para
 * um bucket privado é a mudança definitiva (fora do escopo deste arquivo).
 */
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
};

function cleanName(name: string): string {
  return (
    name
      .replace(/\.[a-z0-9]+$/i, '')
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60) || 'arquivo'
  );
}

export async function POST(request: Request) {
  try {
    const ctx = await requireUser();
    const ip = await getClientIp();
    const limit = rateLimit(`media:client:${ctx.user.id}:${ip}`, {
      limit: 20,
      windowMs: 10 * 60 * 1000,
    });
    if (!limit.ok) {
      return NextResponse.json({ success: false, error: RATE_LIMIT_MESSAGE }, { status: 429 });
    }

    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'Selecione um arquivo.' },
        { status: 400 },
      );
    }

    const mime = (file.type || '').toLowerCase();
    const ext = ALLOWED_MIME[mime];
    if (!ext) {
      return NextResponse.json(
        { success: false, error: 'Formato não suportado. Use JPG, PNG, WebP, GIF ou PDF.' },
        { status: 400 },
      );
    }
    if (file.size <= 0) {
      return NextResponse.json({ success: false, error: 'Arquivo vazio.' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { success: false, error: 'O arquivo deve ter no máximo 5 MB.' },
        { status: 413 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const id = crypto.randomUUID();

    const asset = await prisma.mediaAsset.create({
      data: {
        id,
        filename: `${cleanName(file.name)}.${ext}`,
        mimeType: mime,
        size: buffer.byteLength,
        folder: 'documentos',
        data: buffer,
        uploadedById: ctx.user.id,
      },
      select: { id: true, size: true },
    });

    auditLog({
      userId: ctx.user.id,
      action: 'media.upload.client',
      entity: 'MediaAsset',
      entityId: asset.id,
      details: `${mime} · ${buffer.byteLength} bytes`,
    });

    return NextResponse.json({
      success: true,
      id: asset.id,
      url: `/api/media/${asset.id}`,
      size: asset.size,
      mimeType: mime,
    });
  } catch (error) {
    const result = fail(error, 'Não foi possível enviar o arquivo.');
    const status = error instanceof Error && error.name === 'AuthError' ? 403 : 400;
    return NextResponse.json(result, { status });
  }
}