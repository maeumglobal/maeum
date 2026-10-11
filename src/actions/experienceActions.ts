'use server';

/**
 * Experiências, experiências K-Beauty e categorias.
 *
 * Autorização: leitura `requireStaff()`, escrita `requireAdmin()` (conteúdo).
 *
 * CORREÇÃO PRINCIPAL — `updateExperience`:
 * a versão anterior fazia `{ ...data }` e o payload do painel inclui
 * `categoryIds`, que NÃO existe no model `Experience`. Isso gerava
 * PrismaValidationError em toda edição: editar experiência era impossível.
 * Agora os escalares vão para `update` e as categorias são gravadas na tabela
 * pivot `ExperienceCategory`, dentro de uma transação.
 *
 * Também: slugs com `uniqueSlug` (nunca `Date.now()`) e preservados ao editar.
 */
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireStaff } from '@/lib/auth';
import { auditLog } from '@/lib/audit';
import {
  str,
  strOrNull,
  toInt,
  toNumber,
  safeUrl,
  uniqueSlug,
  slugify,
  parseStringArray,
  toJsonArray,
} from '@/lib/validate';
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

const EXPERIENCE_SELECT = {
  id: true,
  slug: true,
  title: true,
  titleEn: true,
  titleEs: true,
  subtitle: true,
  subtitleEn: true,
  subtitleEs: true,
  location: true,
  region: true,
  city: true,
  description: true,
  descriptionEn: true,
  descriptionEs: true,
  highlights: true,
  highlightsEn: true,
  highlightsEs: true,
  included: true,
  includedEn: true,
  includedEs: true,
  durationHours: true,
  pricePerPerson: true,
  priceCurrency: true,
  mainImage: true,
  gallery: true,
  videoUrl: true,
  videoEmbed: true,
  status: true,
  bookingType: true,
  isFeatured: true,
  sortOrder: true,
  availableFrom: true,
  partnerId: true,
  createdAt: true,
  updatedAt: true,
  categories: {
    select: { categoryId: true, category: { select: { id: true, slug: true, name: true } } },
  },
} as const;

const CATEGORY_SELECT = {
  id: true,
  slug: true,
  name: true,
  nameEn: true,
  nameEs: true,
  destination: true,
  isActive: true,
  sortOrder: true,
  createdAt: true,
} as const;

const KBEAUTY_SELECT = {
  id: true,
  slug: true,
  title: true,
  subtitle: true,
  location: true,
  description: true,
  highlights: true,
  included: true,
  durationHours: true,
  pricePerPerson: true,
  priceCurrency: true,
  mainImage: true,
  gallery: true,
  status: true,
  bookingType: true,
  isPartnerExperience: true,
  isIncludedInJourney: true,
  availableFrom: true,
  createdAt: true,
} as const;

function revalidateCatalog() {
  revalidatePath('/experiencias');
  revalidatePath('/coreia-do-sul/experiencias');
  revalidatePath('/coreia-do-sul/experiencias/[slug]', 'page');
  revalidatePath('/pacotes');
  revalidatePath('/');
  revalidatePath('/dashboard/admin');
}

/** Remove o sufixo numérico que o painel legado acrescentava ao slug. */
function stripLegacyTimestamp(value: string): string {
  return value.replace(/-\d{10,}$/, '');
}

// ─── EXPERIÊNCIAS ───────────────────────────────────────────

export async function getExperiences(input: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  bookingType?: string;
} = {}): Promise<ListResult<unknown>> {
  try {
    await requireStaff();
    const { page, pageSize, skip, take } = paginate(input.page, input.pageSize);
    const search = String(input.search ?? '').trim().slice(0, 120);

    const where: Record<string, unknown> = {};
    if (input.status) where.status = String(input.status).slice(0, 20);
    if (input.bookingType) where.bookingType = String(input.bookingType).slice(0, 20);
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.experience.findMany({ where, orderBy: { createdAt: 'desc' }, take, skip, select: EXPERIENCE_SELECT }),
      prisma.experience.count({ where }),
    ]);

    const meta = pageMeta(total, page, pageSize);
    return { success: true, data, items: data, ...meta, pages: meta.totalPages };
  } catch (error) {
    return {
      ...fail(error, 'Erro ao buscar experiências.'),
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 1,
      pages: 1,
    };
  }
}

export async function createExperience(input: ActionInput): Promise<ActionResult<unknown>> {
  try {
    const ctx = await requireAdmin();
    const f = pick(input);

    const title = str(f.title, 200);
    if (title.length < 3) return { success: false, error: 'Informe o título da experiência.' };

    const categoryIds = normalizeCategoryIds(f.categoryIds);
    const slugRequested = str(f.slug, 140);
    const slug = await uniqueSlug(
      slugSource(prisma.experience),
      slugRequested ? stripLegacyTimestamp(slugRequested) : title,
    );

    const experience = await prisma.experience.create({
      data: {
        slug,
        title,
        titleEn: strOrNull(f.titleEn, 200),
        titleEs: strOrNull(f.titleEs, 200),
        subtitle: strOrNull(f.subtitle, 240),
        subtitleEn: strOrNull(f.subtitleEn, 240),
        subtitleEs: strOrNull(f.subtitleEs, 240),
        location: str(f.location, 100) || 'Seul',
        region: str(f.region, 100) || 'Seul',
        city: str(f.city, 100) || str(f.location, 100) || 'Seul',
        description: strOrNull(f.description, 5000),
        descriptionEn: strOrNull(f.descriptionEn, 5000),
        descriptionEs: strOrNull(f.descriptionEs, 5000),
        highlights: toJsonArray(f.highlights, 40),
        highlightsEn: toJsonArray(f.highlightsEn, 40),
        highlightsEs: toJsonArray(f.highlightsEs, 40),
        included: toJsonArray(f.included, 40),
        includedEn: toJsonArray(f.includedEn, 40),
        includedEs: toJsonArray(f.includedEs, 40),
        durationHours: toNumber(f.durationHours, { min: 0.5, max: 720, fallback: 2 }),
        pricePerPerson: toNumber(f.pricePerPerson, { min: 0, max: 1_000_000, fallback: 0 }),
        priceCurrency: str(f.priceCurrency, 8) || 'BRL',
        mainImage: safeUrl(strOrNull(f.mainImage, 500)),
        gallery: toJsonArray(f.gallery, 40),
        videoUrl: safeUrl(strOrNull(f.videoUrl, 500)),
        videoEmbed: strOrNull(f.videoEmbed, 800),
        status: normalizeStatus(f.status),
        bookingType: normalizeBookingType(f.bookingType),
        isFeatured: toBoolSafe(f.isFeatured, false),
        sortOrder: toInt(f.sortOrder, { min: 0, max: 9999, fallback: 0 }),
        availableFrom: parseDateOrNull(strOrNull(f.availableFrom, 40)),
        partnerId: strOrNull(f.partnerId, 64),
        categories: categoryIds.length ? { create: categoryIds.map((categoryId) => ({ categoryId })) } : undefined,
      },
      select: EXPERIENCE_SELECT,
    });

    auditLog({
      userId: ctx.user.id,
      action: 'experience.create',
      entity: 'Experience',
      entityId: experience.id,
      details: slug,
    });
    revalidateCatalog();
    return ok(experience);
  } catch (error) {
    return fail(error, 'Erro ao criar experiência.');
  }
}

export async function updateExperience(id: string, input: ActionInput): Promise<ActionResult<unknown>> {
  try {
    const ctx = await requireAdmin();
    const f = pick(input);

    const current = await prisma.experience.findUnique({
      where: { id },
      select: { id: true, slug: true, categories: { select: { categoryId: true } } },
    });
    if (!current) return { success: false, error: 'Experiência não encontrada.' };

    // Escalares do model — `categoryIds` NUNCA entra aqui (bug histórico).
    const data: Record<string, unknown> = {};

    const title = str(f.title, 200);
    if (title.length >= 3) data.title = title;
    for (const key of ['titleEn', 'titleEs', 'subtitle', 'subtitleEn', 'subtitleEs'] as const) {
      if (f[key] !== undefined) data[key] = strOrNull(f[key], 240);
    }
    for (const key of ['description', 'descriptionEn', 'descriptionEs'] as const) {
      if (f[key] !== undefined) data[key] = strOrNull(f[key], 5000);
    }
    if (f.videoEmbed !== undefined) data.videoEmbed = strOrNull(f.videoEmbed, 800);
    for (const key of ['location', 'region', 'city'] as const) {
      if (f[key] !== undefined) data[key] = str(f[key], 100) || 'Seul';
    }
    for (const key of [
      'highlights',
      'highlightsEn',
      'highlightsEs',
      'included',
      'includedEn',
      'includedEs',
      'gallery',
    ] as const) {
      if (f[key] !== undefined) data[key] = toJsonArray(f[key], 40);
    }
    if (f.durationHours !== undefined) {
      data.durationHours = toNumber(f.durationHours, { min: 0.5, max: 720, fallback: 2 });
    }
    if (f.pricePerPerson !== undefined) {
      data.pricePerPerson = toNumber(f.pricePerPerson, { min: 0, max: 1_000_000, fallback: 0 });
    }
    if (f.priceCurrency !== undefined) data.priceCurrency = str(f.priceCurrency, 8) || 'BRL';
    if (f.mainImage !== undefined) data.mainImage = safeUrl(strOrNull(f.mainImage, 500));
    if (f.videoUrl !== undefined) data.videoUrl = safeUrl(strOrNull(f.videoUrl, 500));
    if (f.status !== undefined) data.status = normalizeStatus(f.status);
    if (f.bookingType !== undefined) data.bookingType = normalizeBookingType(f.bookingType);
    if (f.isFeatured !== undefined) data.isFeatured = toBoolSafe(f.isFeatured, false);
    if (f.sortOrder !== undefined) data.sortOrder = toInt(f.sortOrder, { min: 0, max: 9999, fallback: 0 });
    if (f.availableFrom !== undefined) data.availableFrom = parseDateOrNull(strOrNull(f.availableFrom, 40));
    if (f.partnerId !== undefined) data.partnerId = strOrNull(f.partnerId, 64);

    // Slug preservado; só muda se o admin enviar outro explicitamente.
    const slugRequested = str(f.slug, 140);
    if (slugRequested && slugify(stripLegacyTimestamp(slugRequested)) !== current.slug) {
      data.slug = await uniqueSlug(slugSource(prisma.experience), stripLegacyTimestamp(slugRequested), id);
    }

    // Categorias: gravadas na pivot, não no model Experience.
    const categoryIds = f.categoryIds !== undefined ? normalizeCategoryIds(f.categoryIds) : null;
    const syncCategories =
      categoryIds !== null &&
      (categoryIds.length !== current.categories.length ||
        !categoryIds.every((cid) => current.categories.some((c) => c.categoryId === cid)));

    if (Object.keys(data).length === 0 && !syncCategories) {
      return { success: false, error: 'Nada para atualizar.' };
    }

    const experience = await prisma.$transaction(async (tx) => {
      const updated = Object.keys(data).length
        ? await tx.experience.update({ where: { id }, data, select: EXPERIENCE_SELECT })
        : await tx.experience.findUnique({ where: { id }, select: EXPERIENCE_SELECT });

      if (syncCategories && categoryIds) {
        await tx.experienceCategory.deleteMany({ where: { experienceId: id } });
        if (categoryIds.length) {
          await tx.experienceCategory.createMany({
            data: categoryIds.map((categoryId) => ({ experienceId: id, categoryId })),
          });
        }
      }

      return updated;
    });

    auditLog({ userId: ctx.user.id, action: 'experience.update', entity: 'Experience', entityId: id });
    revalidateCatalog();
    return ok(experience);
  } catch (error) {
    return fail(error, 'Erro ao atualizar experiência.');
  }
}

export async function deleteExperience(id: string): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requireAdmin();
    await prisma.experience.delete({ where: { id } });
    auditLog({ userId: ctx.user.id, action: 'experience.delete', entity: 'Experience', entityId: id });
    revalidateCatalog();
    return { success: true };
  } catch (error) {
    return fail(error, 'Erro ao excluir experiência.');
  }
}

// ─── K-BEAUTY ───────────────────────────────────────────────

export async function getKbeautyExperiences(): Promise<ActionResult<unknown[]>> {
  try {
    await requireStaff();
    const data = await prisma.kbeautyExperience.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: KBEAUTY_SELECT,
    });
    return ok(data);
  } catch (error) {
    return fail(error, 'Erro ao buscar experiências K-Beauty.');
  }
}

export async function createKbeautyExperience(input: ActionInput): Promise<ActionResult<unknown>> {
  try {
    const ctx = await requireAdmin();
    const f = pick(input);

    const title = str(f.title, 200);
    if (title.length < 3) return { success: false, error: 'Informe o título da experiência.' };
    const slugRequested = str(f.slug, 140);
    const slug = await uniqueSlug(
      slugSource(prisma.kbeautyExperience),
      slugRequested ? stripLegacyTimestamp(slugRequested) : title,
    );

    const exp = await prisma.kbeautyExperience.create({
      data: {
        slug,
        title,
        subtitle: strOrNull(f.subtitle, 240),
        location: str(f.location, 100) || 'Seul',
        description: strOrNull(f.description, 5000),
        highlights: toJsonArray(f.highlights, 40),
        included: toJsonArray(f.included, 40),
        durationHours: toNumber(f.durationHours, { min: 0.5, max: 720, fallback: 2 }),
        pricePerPerson: toNumber(f.pricePerPerson, { min: 0, max: 1_000_000, fallback: 0 }),
        priceCurrency: str(f.priceCurrency, 8) || 'BRL',
        mainImage: safeUrl(strOrNull(f.mainImage, 500)),
        gallery: toJsonArray(f.gallery, 40),
        status: normalizeStatus(f.status),
        bookingType: normalizeBookingType(f.bookingType, 'request'),
        isPartnerExperience: toBoolSafe(f.isPartnerExperience, false),
        isIncludedInJourney: toBoolSafe(f.isIncludedInJourney, false),
        availableFrom: parseDateOrNull(strOrNull(f.availableFrom, 40)),
      },
      select: KBEAUTY_SELECT,
    });

    auditLog({
      userId: ctx.user.id,
      action: 'kbeauty.create',
      entity: 'KbeautyExperience',
      entityId: exp.id,
      details: slug,
    });
    revalidateCatalog();
    revalidatePath('/coreia-do-sul/k-beauty');
    return ok(exp);
  } catch (error) {
    return fail(error, 'Erro ao criar experiência K-Beauty.');
  }
}

export async function updateKbeautyExperience(
  id: string,
  input: ActionInput,
): Promise<ActionResult<unknown>> {
  try {
    const ctx = await requireAdmin();
    const f = pick(input);

    const current = await prisma.kbeautyExperience.findUnique({ where: { id }, select: { slug: true } });
    if (!current) return { success: false, error: 'Experiência não encontrada.' };

    const data: Record<string, unknown> = {};
    const title = str(f.title, 200);
    if (title.length >= 3) data.title = title;
    if (f.subtitle !== undefined) data.subtitle = strOrNull(f.subtitle, 240);
    if (f.location !== undefined) data.location = str(f.location, 100) || 'Seul';
    if (f.description !== undefined) data.description = strOrNull(f.description, 5000);
    if (f.highlights !== undefined) data.highlights = toJsonArray(f.highlights, 40);
    if (f.included !== undefined) data.included = toJsonArray(f.included, 40);
    if (f.durationHours !== undefined) {
      data.durationHours = toNumber(f.durationHours, { min: 0.5, max: 720, fallback: 2 });
    }
    if (f.pricePerPerson !== undefined) {
      data.pricePerPerson = toNumber(f.pricePerPerson, { min: 0, max: 1_000_000, fallback: 0 });
    }
    if (f.priceCurrency !== undefined) data.priceCurrency = str(f.priceCurrency, 8) || 'BRL';
    if (f.mainImage !== undefined) data.mainImage = safeUrl(strOrNull(f.mainImage, 500));
    if (f.gallery !== undefined) data.gallery = toJsonArray(f.gallery, 40);
    if (f.status !== undefined) data.status = normalizeStatus(f.status);
    if (f.bookingType !== undefined) data.bookingType = normalizeBookingType(f.bookingType, 'request');
    if (f.isPartnerExperience !== undefined) {
      data.isPartnerExperience = toBoolSafe(f.isPartnerExperience, false);
    }
    if (f.isIncludedInJourney !== undefined) {
      data.isIncludedInJourney = toBoolSafe(f.isIncludedInJourney, false);
    }
    //.availableFrom era gravado só no create; agora o update também persiste.
    if (f.availableFrom !== undefined) {
      data.availableFrom = parseDateOrNull(strOrNull(f.availableFrom, 40));
    }

    const slugRequested = str(f.slug, 140);
    if (slugRequested && slugify(stripLegacyTimestamp(slugRequested)) !== current.slug) {
      data.slug = await uniqueSlug(
        slugSource(prisma.kbeautyExperience),
        stripLegacyTimestamp(slugRequested),
        id,
      );
    }

    if (Object.keys(data).length === 0) return { success: false, error: 'Nada para atualizar.' };

    const exp = await prisma.kbeautyExperience.update({ where: { id }, data, select: KBEAUTY_SELECT });
    auditLog({ userId: ctx.user.id, action: 'kbeauty.update', entity: 'KbeautyExperience', entityId: id });
    revalidateCatalog();
    revalidatePath('/coreia-do-sul/k-beauty');
    return ok(exp);
  } catch (error) {
    return fail(error, 'Erro ao atualizar experiência K-Beauty.');
  }
}

export async function deleteKbeautyExperience(id: string): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requireAdmin();
    await prisma.kbeautyExperience.delete({ where: { id } });
    auditLog({ userId: ctx.user.id, action: 'kbeauty.delete', entity: 'KbeautyExperience', entityId: id });
    revalidateCatalog();
    revalidatePath('/coreia-do-sul/k-beauty');
    return { success: true };
  } catch (error) {
    return fail(error, 'Erro ao excluir experiência K-Beauty.');
  }
}

// ─── CATEGORIAS ─────────────────────────────────────────────

export async function getCategories(): Promise<ActionResult<unknown[]>> {
  try {
    await requireStaff();
    const data = await prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      take: 200,
      select: CATEGORY_SELECT,
    });
    return ok(data);
  } catch (error) {
    return fail(error, 'Erro ao buscar categorias.');
  }
}

export async function createCategory(input: ActionInput): Promise<ActionResult<unknown>> {
  try {
    const ctx = await requireAdmin();
    const f = pick(input);

    const name = str(f.name, 120);
    if (name.length < 2) return { success: false, error: 'Informe o nome da categoria.' };

    const slugRequested = str(f.slug, 120);
    const slug = await uniqueSlug(
      slugSource(prisma.category),
      slugRequested ? stripLegacyTimestamp(slugRequested) : name,
    );
    const count = await prisma.category.count();

    const category = await prisma.category.create({
      data: {
        slug,
        name,
        nameEn: strOrNull(f.nameEn, 120),
        nameEs: strOrNull(f.nameEs, 120),
        destination: str(f.destination, 120) || 'Coreia do Sul',
        isActive: toBoolSafe(f.isActive, true),
        sortOrder: toInt(f.sortOrder, { min: 0, max: 9999, fallback: count }),
      },
      select: CATEGORY_SELECT,
    });

    auditLog({
      userId: ctx.user.id,
      action: 'category.create',
      entity: 'Category',
      entityId: category.id,
      details: slug,
    });
    revalidateCatalog();
    return ok(category);
  } catch (error) {
    return fail(error, 'Erro ao criar categoria.');
  }
}

export async function updateCategory(id: string, input: ActionInput): Promise<ActionResult<unknown>> {
  try {
    const ctx = await requireAdmin();
    const f = pick(input);

    const data: Record<string, unknown> = {};
    const name = str(f.name, 120);
    if (name.length >= 2) data.name = name;
    if (f.nameEn !== undefined) data.nameEn = strOrNull(f.nameEn, 120);
    if (f.nameEs !== undefined) data.nameEs = strOrNull(f.nameEs, 120);
    if (f.destination !== undefined) data.destination = str(f.destination, 120) || 'Coreia do Sul';
    if (f.isActive !== undefined) data.isActive = toBoolSafe(f.isActive, true);
    if (f.sortOrder !== undefined) data.sortOrder = toInt(f.sortOrder, { min: 0, max: 9999, fallback: 0 });

    const slugRequested = str(f.slug, 120);
    if (slugRequested) {
      const current = await prisma.category.findUnique({ where: { id }, select: { slug: true } });
      const clean = slugify(stripLegacyTimestamp(slugRequested));
      if (current && clean && clean !== current.slug) {
        data.slug = await uniqueSlug(slugSource(prisma.category), stripLegacyTimestamp(slugRequested), id);
      }
    }

    if (Object.keys(data).length === 0) return { success: false, error: 'Nada para atualizar.' };

    const category = await prisma.category.update({ where: { id }, data, select: CATEGORY_SELECT });
    auditLog({ userId: ctx.user.id, action: 'category.update', entity: 'Category', entityId: id });
    revalidateCatalog();
    return ok(category);
  } catch (error) {
    return fail(error, 'Erro ao atualizar categoria.');
  }
}

export async function deleteCategory(id: string): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requireAdmin();
    await prisma.category.delete({ where: { id } });
    auditLog({ userId: ctx.user.id, action: 'category.delete', entity: 'Category', entityId: id });
    revalidateCatalog();
    return { success: true };
  } catch (error) {
    return fail(error, 'Erro ao excluir categoria.');
  }
}

// ─── INTERNOS ──────────────────────────────────────────────

function normalizeCategoryIds(raw: FormDataEntryValue | undefined): string[] {
  const list = parseStringArray(raw, 20)
    .map((v) => String(v).slice(0, 64).trim())
    .filter((v) => v.length > 0);
  return [...new Set(list)];
}

function normalizeStatus(raw: FormDataEntryValue | undefined): string {
  const status = str(raw, 20);
  return status === 'active' || status === 'inactive' || status === 'draft' ? status : 'active';
}

function normalizeBookingType(raw: FormDataEntryValue | undefined, fallback = 'direct'): string {
  const type = str(raw, 20);
  return type === 'direct' || type === 'request' ? type : fallback;
}

function parseDateOrNull(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toBoolSafe(value: FormDataEntryValue | undefined, fallback: boolean): boolean {
  if (value === undefined || value === null) return fallback;
  const v = String(value).toLowerCase();
  return v === 'true' || v === '1' || v === 'on' || v === 'yes';
}