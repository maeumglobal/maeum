'use server';

/**
 * Pacotes.
 *
 * Autorização: `getPackageBySlug` é PÚBLICA (página /pacotes/[slug]);
 * listagem é `requireStaff()` e escrita é `requireAdmin()`.
 *
 * Correção: o slug vinha cru do formulário e o erro de duplicata era tratado
 * caso a caso; agora usa `uniqueSlug` e o P2002 é traduzido pelo helper `fail`.
 */
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireStaff } from '@/lib/auth';
import { auditLog } from '@/lib/audit';
import { str, toNumber, uniqueSlug, slugify, toJsonArray } from '@/lib/validate';
import {
  pick,
  paginate,
  pageMeta,
  fail,
  ok,
  slugSource,
  type ActionInput,
  type ActionResult,
  type ListResult,
} from '@/lib/actionKit';

export interface PackageView {
  id: string;
  title: string;
  slug: string;
  destination: string | null;
  price: number;
  category: string;
  description: string | null;
  gallery: string;
  itinerary: string;
  included: string;
  notIncluded: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const PACKAGE_SELECT = {
  id: true,
  title: true,
  slug: true,
  destination: true,
  price: true,
  category: true,
  description: true,
  gallery: true,
  itinerary: true,
  included: true,
  notIncluded: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

const CATEGORIES = ['drip', 'standard', 'luxury', 'experience'];
const STATUSES = ['active', 'inactive'];

function revalidatePackages() {
  revalidatePath('/pacotes');
  revalidatePath('/pacotes/[slug]', 'page');
  revalidatePath('/');
  revalidatePath('/dashboard/admin');
}

function stripLegacyTimestamp(value: string): string {
  return value.replace(/-\d{10,}$/, '');
}

export async function getPackages(input: {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
  destination?: string;
  category?: string;
} = {}): Promise<ListResult<unknown>> {
  try {
    await requireStaff();
    const { page, pageSize, skip, take } = paginate(input.page, input.pageSize);

    const where: Record<string, unknown> = {};
    if (input.status) where.status = String(input.status).slice(0, 20);
    if (input.destination) where.destination = String(input.destination).slice(0, 120);
    if (input.category) where.category = String(input.category).slice(0, 40);

    const search = str(input.search, 120);
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { destination: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.package.findMany({ where, orderBy: { createdAt: 'desc' }, take, skip, select: PACKAGE_SELECT }),
      prisma.package.count({ where }),
    ]);

    const meta = pageMeta(total, page, pageSize);
    return { success: true, data, items: data, ...meta, pages: meta.totalPages };
  } catch (error) {
    return {
      ...fail(error, 'Erro ao buscar pacotes.'),
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 1,
      pages: 1,
    };
  }
}

/** Leitura pública da página de detalhe. */
export async function getPackageBySlug(slug: string): Promise<ActionResult<PackageView>> {
  try {
    const clean = str(slug, 160);
    if (!clean) return { success: false, error: 'Pacote não encontrado.' };

    const pkg = await prisma.package.findUnique({ where: { slug: clean }, select: PACKAGE_SELECT });
    if (!pkg) return { success: false, error: 'Pacote não encontrado.' };
    return ok(pkg);
  } catch (error) {
    return fail(error, 'Erro ao buscar pacote.');
  }
}

export async function createPackage(input: ActionInput): Promise<ActionResult<PackageView>> {
  try {
    const ctx = await requireAdmin();
    const f = pick(input);

    const title = str(f.title, 200);
    if (title.length < 3) return { success: false, error: 'Informe o título do pacote.' };

    const slugRequested = str(f.slug, 160);
    const slug = await uniqueSlug(
      slugSource(prisma.package),
      slugRequested ? stripLegacyTimestamp(slugRequested) : title,
    );

    const categoryRaw = str(f.category, 20);
    const statusRaw = str(f.status, 20);

    const newPackage = await prisma.package.create({
      data: {
        title,
        slug,
        destination: str(f.destination, 160),
        price: toNumber(f.price, { min: 0, max: 10_000_000, fallback: 0 }),
        category: CATEGORIES.includes(categoryRaw) ? categoryRaw : 'standard',
        description: str(f.description, 8000),
        status: STATUSES.includes(statusRaw) ? statusRaw : 'active',
        gallery: toJsonArray(f.gallery, 40),
        itinerary: toJsonArray(f.itinerary, 60),
        included: toJsonArray(f.included, 60),
        notIncluded: toJsonArray(f.notIncluded, 60),
      },
      select: PACKAGE_SELECT,
    });

    auditLog({
      userId: ctx.user.id,
      action: 'package.create',
      entity: 'Package',
      entityId: newPackage.id,
      details: slug,
    });
    revalidatePackages();
    return ok(newPackage);
  } catch (error) {
    return fail(error, 'Erro ao criar pacote.');
  }
}

export async function updatePackage(id: string, input: ActionInput): Promise<ActionResult<PackageView>> {
  try {
    const ctx = await requireAdmin();
    const f = pick(input);

    const current = await prisma.package.findUnique({ where: { id }, select: { slug: true } });
    if (!current) return { success: false, error: 'Pacote não encontrado.' };

    const data: Record<string, unknown> = {};
    const title = str(f.title, 200);
    if (title.length >= 3) data.title = title;
    if (f.destination !== undefined) data.destination = str(f.destination, 160);
    if (f.price !== undefined) data.price = toNumber(f.price, { min: 0, max: 10_000_000, fallback: 0 });
    if (f.category !== undefined && CATEGORIES.includes(str(f.category, 20))) {
      data.category = str(f.category, 20);
    }
    if (f.status !== undefined && STATUSES.includes(str(f.status, 20))) data.status = str(f.status, 20);
    if (f.description !== undefined) data.description = str(f.description, 8000);
    for (const key of ['gallery', 'itinerary', 'included', 'notIncluded'] as const) {
      if (f[key] !== undefined) data[key] = toJsonArray(f[key], 60);
    }

    const slugRequested = str(f.slug, 160);
    if (slugRequested && slugify(stripLegacyTimestamp(slugRequested)) !== current.slug) {
      data.slug = await uniqueSlug(slugSource(prisma.package), stripLegacyTimestamp(slugRequested), id);
    }

    if (Object.keys(data).length === 0) return { success: false, error: 'Nada para atualizar.' };

    const updated = await prisma.package.update({ where: { id }, data, select: PACKAGE_SELECT });
    auditLog({ userId: ctx.user.id, action: 'package.update', entity: 'Package', entityId: id });
    revalidatePackages();
    return ok(updated);
  } catch (error) {
    return fail(error, 'Erro ao atualizar pacote.');
  }
}

export async function updatePackageStatus(
  id: string,
  status: string,
): Promise<ActionResult<{ id: string; title: string; slug: string; status: string }>> {
  try {
    const ctx = await requireAdmin();
    if (!STATUSES.includes(status)) return { success: false, error: 'Status inválido.' };

    const updated = await prisma.package.update({
      where: { id },
      data: { status },
      select: { id: true, title: true, slug: true, status: true },
    });
    auditLog({
      userId: ctx.user.id,
      action: 'package.status_change',
      entity: 'Package',
      entityId: id,
      details: status,
    });
    revalidatePackages();
    return ok(updated);
  } catch (error) {
    return fail(error, 'Erro ao atualizar status.');
  }
}

export async function deletePackage(id: string): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requireAdmin();
    await prisma.package.delete({ where: { id } });
    auditLog({ userId: ctx.user.id, action: 'package.delete', entity: 'Package', entityId: id });
    revalidatePackages();
    return { success: true };
  } catch (error) {
    return fail(error, 'Erro ao excluir pacote.');
  }
}