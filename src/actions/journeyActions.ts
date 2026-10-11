'use server';

/**
 * Jornadas e datas de saída (`JourneyDeparture`).
 *
 * Autorização: leitura `requireStaff()`, escrita `requireAdmin()`.
 *
 * CORREÇÃO PRINCIPAL — slug:
 * `AdminJourneysHome` montava `slug = titulo + '-' + Date.now()` a CADA edição
 * e o mandava para `updateJourney`. Como a action aceitava o slug, toda edição
 * quebrava a URL pública `/jornadas/<slug>`. Agora o servidor:
 *  - na criação, remove o sufixo numérico legado e gera `uniqueSlug`;
 *  - na edição, PRESERVA o slug salvo e só regenera se o painel mandar um
 *    slug explicitamente diferente.
 */
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireStaff } from '@/lib/auth';
import { auditLog } from '@/lib/audit';
import { str, strOrNull, toInt, toNumber, safeUrl, uniqueSlug, slugify, toJsonArray } from '@/lib/validate';
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

const JOURNEY_SELECT = {
  id: true,
  slug: true,
  title: true,
  titleEn: true,
  titleEs: true,
  subtitle: true,
  subtitleEn: true,
  subtitleEs: true,
  concept: true,
  conceptEn: true,
  conceptEs: true,
  destinations: true,
  durationDays: true,
  totalSpots: true,
  accommodation: true,
  pricePerPerson: true,
  priceCurrency: true,
  mainImage: true,
  gallery: true,
  videoUrl: true,
  videoEmbed: true,
  included: true,
  notIncluded: true,
  itinerary: true,
  highlights: true,
  paymentOptions: true,
  status: true,
  category: true,
  isFeatured: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
  departures: {
    orderBy: { startDate: 'asc' },
    take: 20,
    select: {
      id: true,
      startDate: true,
      endDate: true,
      totalSpots: true,
      availableSpots: true,
      status: true,
      notes: true,
      priceAdjustment: true,
    },
  },
} as const;

const DEPARTURE_SELECT = {
  id: true,
  journeyId: true,
  startDate: true,
  endDate: true,
  totalSpots: true,
  availableSpots: true,
  status: true,
  notes: true,
  priceAdjustment: true,
  createdAt: true,
} as const;

function revalidateJourneys() {
  revalidatePath('/jornadas');
  revalidatePath('/coreia-do-sul/jornadas');
  revalidatePath('/coreia-do-sul/jornadas/[slug]', 'page');
  revalidatePath('/pacotes');
  revalidatePath('/');
  revalidatePath('/dashboard/admin');
}

function stripLegacyTimestamp(value: string): string {
  return value.replace(/-\d{10,}$/, '');
}

// ─── JORNADAS ───────────────────────────────────────────────

export async function getJourneys(input: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  category?: string;
} = {}): Promise<ListResult<unknown>> {
  try {
    await requireStaff();
    const { page, pageSize, skip, take } = paginate(input.page, input.pageSize);
    const search = String(input.search ?? '').trim().slice(0, 120);

    const where: Record<string, unknown> = {};
    if (input.status) where.status = String(input.status).slice(0, 20);
    if (input.category) where.category = String(input.category).slice(0, 30);
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { subtitle: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.journey.findMany({ where, orderBy: { createdAt: 'desc' }, take, skip, select: JOURNEY_SELECT }),
      prisma.journey.count({ where }),
    ]);

    const meta = pageMeta(total, page, pageSize);
    return { success: true, data, items: data, ...meta, pages: meta.totalPages };
  } catch (error) {
    return {
      ...fail(error, 'Erro ao buscar jornadas.'),
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 1,
      pages: 1,
    };
  }
}

export async function createJourney(input: ActionInput): Promise<ActionResult<unknown>> {
  try {
    const ctx = await requireAdmin();
    const f = pick(input);

    const title = str(f.title, 200);
    if (title.length < 3) return { success: false, error: 'Informe o título da jornada.' };

    const slugRequested = str(f.slug, 140);
    const slug = await uniqueSlug(
      slugSource(prisma.journey),
      slugRequested ? stripLegacyTimestamp(slugRequested) : title,
    );

    const journey = await prisma.journey.create({
      data: {
        slug,
        title,
        titleEn: strOrNull(f.titleEn, 200),
        titleEs: strOrNull(f.titleEs, 200),
        subtitle: strOrNull(f.subtitle, 240),
        subtitleEn: strOrNull(f.subtitleEn, 240),
        subtitleEs: strOrNull(f.subtitleEs, 240),
        concept: strOrNull(f.concept, 8000),
        conceptEn: strOrNull(f.conceptEn, 8000),
        conceptEs: strOrNull(f.conceptEs, 8000),
        destinations: toJsonArray(f.destinations, 20) || JSON.stringify(['Seul']),
        durationDays: toInt(f.durationDays, { min: 1, max: 365, fallback: 10 }),
        totalSpots: toInt(f.totalSpots, { min: 1, max: 500, fallback: 15 }),
        accommodation: strOrNull(f.accommodation, 240),
        pricePerPerson: toNumber(f.pricePerPerson, { min: 0, max: 1_000_000, fallback: 0 }),
        priceCurrency: str(f.priceCurrency, 8) || 'BRL',
        mainImage: safeUrl(strOrNull(f.mainImage, 500)),
        gallery: toJsonArray(f.gallery, 40),
        videoUrl: safeUrl(strOrNull(f.videoUrl, 500)),
        videoEmbed: strOrNull(f.videoEmbed, 800),
        included: toJsonArray(f.included, 60),
        includedEn: toJsonArray(f.includedEn, 60),
        includedEs: toJsonArray(f.includedEs, 60),
        notIncluded: toJsonArray(f.notIncluded, 60),
        notIncludedEn: toJsonArray(f.notIncludedEn, 60),
        notIncludedEs: toJsonArray(f.notIncludedEs, 60),
        itinerary: toJsonArray(f.itinerary, 60),
        highlights: toJsonArray(f.highlights, 40),
        paymentOptions:
          str(f.paymentOptions, 2000) ||
          JSON.stringify({ pix: true, boleto_parcelas: 48, credit_card_parcelas: 24 }),
        status: normalizeJourneyStatus(f.status),
        category: normalizeJourneyCategory(f.category),
        isFeatured: toBoolSafe(f.isFeatured, false),
        sortOrder: toInt(f.sortOrder, { min: 0, max: 9999, fallback: 0 }),
      },
      select: JOURNEY_SELECT,
    });

    auditLog({
      userId: ctx.user.id,
      action: 'journey.create',
      entity: 'Journey',
      entityId: journey.id,
      details: slug,
    });
    revalidateJourneys();
    return ok(journey);
  } catch (error) {
    return fail(error, 'Erro ao criar jornada.');
  }
}

export async function updateJourney(id: string, input: ActionInput): Promise<ActionResult<unknown>> {
  try {
    const ctx = await requireAdmin();
    const f = pick(input);

    const current = await prisma.journey.findUnique({ where: { id }, select: { id: true, slug: true } });
    if (!current) return { success: false, error: 'Jornada não encontrada.' };

    const data: Record<string, unknown> = {};

    const title = str(f.title, 200);
    if (title.length >= 3) data.title = title;
    for (const key of ['titleEn', 'titleEs', 'subtitle', 'subtitleEn', 'subtitleEs', 'accommodation'] as const) {
      if (f[key] !== undefined) data[key] = strOrNull(f[key], 240);
    }
    for (const key of ['concept', 'conceptEn', 'conceptEs'] as const) {
      if (f[key] !== undefined) data[key] = strOrNull(f[key], 8000);
    }
    if (f.videoEmbed !== undefined) data.videoEmbed = strOrNull(f.videoEmbed, 800);
    for (const key of [
      'destinations',
      'gallery',
      'included',
      'includedEn',
      'includedEs',
      'notIncluded',
      'notIncludedEn',
      'notIncludedEs',
      'itinerary',
      'highlights',
    ] as const) {
      if (f[key] !== undefined) data[key] = toJsonArray(f[key], 60);
    }
    if (f.durationDays !== undefined) data.durationDays = toInt(f.durationDays, { min: 1, max: 365, fallback: 10 });
    if (f.totalSpots !== undefined) data.totalSpots = toInt(f.totalSpots, { min: 1, max: 500, fallback: 15 });
    if (f.pricePerPerson !== undefined) {
      data.pricePerPerson = toNumber(f.pricePerPerson, { min: 0, max: 1_000_000, fallback: 0 });
    }
    if (f.priceCurrency !== undefined) data.priceCurrency = str(f.priceCurrency, 8) || 'BRL';
    if (f.mainImage !== undefined) data.mainImage = safeUrl(strOrNull(f.mainImage, 500));
    if (f.videoUrl !== undefined) data.videoUrl = safeUrl(strOrNull(f.videoUrl, 500));
    if (f.paymentOptions !== undefined) data.paymentOptions = str(f.paymentOptions, 2000);
    if (f.status !== undefined) data.status = normalizeJourneyStatus(f.status);
    if (f.category !== undefined) data.category = normalizeJourneyCategory(f.category);
    if (f.isFeatured !== undefined) data.isFeatured = toBoolSafe(f.isFeatured, false);
    if (f.sortOrder !== undefined) data.sortOrder = toInt(f.sortOrder, { min: 0, max: 9999, fallback: 0 });

    // Slug: preserva o existente salvo se o painel mandar outro
    const slugRequested = str(f.slug, 140);
    if (slugRequested && slugify(stripLegacyTimestamp(slugRequested)) !== current.slug) {
      data.slug = await uniqueSlug(slugSource(prisma.journey), stripLegacyTimestamp(slugRequested), id);
    }

    if (Object.keys(data).length === 0) return { success: false, error: 'Nada para atualizar.' };

    const journey = await prisma.journey.update({ where: { id }, data, select: JOURNEY_SELECT });
    auditLog({ userId: ctx.user.id, action: 'journey.update', entity: 'Journey', entityId: id });
    revalidateJourneys();
    return ok(journey);
  } catch (error) {
    return fail(error, 'Erro ao atualizar jornada.');
  }
}

export async function deleteJourney(id: string): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requireAdmin();
    await prisma.journey.delete({ where: { id } });
    auditLog({ userId: ctx.user.id, action: 'journey.delete', entity: 'Journey', entityId: id });
    revalidateJourneys();
    return { success: true };
  } catch (error) {
    return fail(error, 'Erro ao excluir jornada.');
  }
}

// ─── DEPARTURES ─────────────────────────────────────────────

export async function getJourneyDepartures(journeyId: string): Promise<ActionResult<unknown[]>> {
  try {
    await requireStaff();
    const data = await prisma.journeyDeparture.findMany({
      where: { journeyId: str(journeyId, 64) },
      orderBy: { startDate: 'asc' },
      take: 60,
      select: DEPARTURE_SELECT,
    });
    return ok(data);
  } catch (error) {
    return fail(error, 'Erro ao buscar datas de saída.');
  }
}

export async function createJourneyDeparture(input: ActionInput): Promise<ActionResult<unknown>> {
  try {
    const ctx = await requireAdmin();
    const f = pick(input);

    const journeyId = str(f.journeyId, 64);
    if (!journeyId) return { success: false, error: 'Selecione a jornada.' };

    const startDate = parseDateOrNull(strOrNull(f.startDate, 40));
    const endDate = parseDateOrNull(strOrNull(f.endDate, 40));
    if (!startDate) return { success: false, error: 'Informe a data de início.' };
    if (!endDate) return { success: false, error: 'Informe a data de fim.' };
    if (endDate <= startDate) return { success: false, error: 'A data final deve ser posterior à inicial.' };

    const totalSpots = toInt(f.totalSpots ?? f.availableSpots, { min: 1, max: 500, fallback: 15 });
    const availableSpots = toInt(f.availableSpots, { min: 0, max: 500, fallback: totalSpots });

    const departure = await prisma.journeyDeparture.create({
      data: {
        journeyId,
        startDate,
        endDate,
        totalSpots,
        availableSpots: Math.min(availableSpots, totalSpots),
        status: 'available',
        notes: strOrNull(f.notes, 1000),
        priceAdjustment: toNumber(f.priceAdjustment, { min: -100000, max: 100000, fallback: 0 }),
      },
      select: DEPARTURE_SELECT,
    });

    auditLog({
      userId: ctx.user.id,
      action: 'journey.departure_create',
      entity: 'JourneyDeparture',
      entityId: departure.id,
      details: `journey=${journeyId}`,
    });
    revalidateJourneys();
    return ok(departure);
  } catch (error) {
    return fail(error, 'Erro ao criar data de saída.');
  }
}

export async function updateJourneyDeparture(
  id: string,
  input: ActionInput,
): Promise<ActionResult<unknown>> {
  try {
    const ctx = await requireAdmin();
    const f = pick(input);

    const data: Record<string, unknown> = {};
    if (f.status !== undefined) {
      const status = str(f.status, 20);
      if (!['available', 'limited', 'sold_out', 'cancelled'].includes(status)) {
        return { success: false, error: 'Status inválido.' };
      }
      data.status = status;
    }
    if (f.availableSpots !== undefined) {
      data.availableSpots = toInt(f.availableSpots, { min: 0, max: 500, fallback: 0 });
    }
    if (f.totalSpots !== undefined) data.totalSpots = toInt(f.totalSpots, { min: 1, max: 500, fallback: 15 });
    if (f.notes !== undefined) data.notes = strOrNull(f.notes, 1000);
    if (f.priceAdjustment !== undefined) {
      data.priceAdjustment = toNumber(f.priceAdjustment, { min: -100000, max: 100000, fallback: 0 });
    }
    const startDate = parseDateOrNull(strOrNull(f.startDate, 40));
    const endDate = parseDateOrNull(strOrNull(f.endDate, 40));
    if (startDate) data.startDate = startDate;
    if (endDate) data.endDate = endDate;

    if (Object.keys(data).length === 0) return { success: false, error: 'Nada para atualizar.' };

    const departure = await prisma.journeyDeparture.update({ where: { id }, data, select: DEPARTURE_SELECT });
    auditLog({
      userId: ctx.user.id,
      action: 'journey.departure_update',
      entity: 'JourneyDeparture',
      entityId: id,
    });
    revalidateJourneys();
    return ok(departure);
  } catch (error) {
    return fail(error, 'Erro ao atualizar data de saída.');
  }
}

export async function deleteJourneyDeparture(id: string): Promise<ActionResult<undefined>> {
  try {
    const ctx = await requireAdmin();
    await prisma.journeyDeparture.delete({ where: { id } });
    auditLog({
      userId: ctx.user.id,
      action: 'journey.departure_delete',
      entity: 'JourneyDeparture',
      entityId: id,
    });
    revalidateJourneys();
    return { success: true };
  } catch (error) {
    return fail(error, 'Erro ao excluir data de saída.');
  }
}

// ─── INTERNOS ──────────────────────────────────────────────

function normalizeJourneyStatus(raw: FormDataEntryValue | undefined): string {
  const status = str(raw, 20);
  return ['active', 'inactive', 'soldout', 'draft', 'archived'].includes(status) ? status : 'active';
}

function normalizeJourneyCategory(raw: FormDataEntryValue | undefined): string {
  const category = str(raw, 30);
  return ['army', 'premium', 'essence', 'luxury'].includes(category) ? category : 'premium';
}

function parseDateOrNull(value: string | null): Date | null {
  if (!value) return null;
  // `YYYY-MM-DD` precisa virar UTC explícito para não deslocar o dia.
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00.000Z` : value;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toBoolSafe(value: FormDataEntryValue | undefined, fallback: boolean): boolean {
  if (value === undefined || value === null) return fallback;
  const v = String(value).toLowerCase();
  return v === 'true' || v === '1' || v === 'on' || v === 'yes';
}