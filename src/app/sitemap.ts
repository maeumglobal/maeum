import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { defaultLocale, locales } from '@/i18n/config';
import { SITE_URL, localizedUrl } from '@/lib/seo';

type SitemapEntry = MetadataRoute.Sitemap[number];
type ChangeFreq = SitemapEntry['changeFrequency'];

interface StaticRoute {
  /** Path canônico em pt (sem prefixo de locale). */
  path: string;
  changeFrequency: ChangeFreq;
  priority: number;
  /**
   * Data de referência da rota. `new Date()` NUNCA: o Google lê
   * `lastModified` como sinal de frescor e um valor volátil faz ele
   * recrawlare tudo sem motivo.
   */
  lastModified: string;
}

/**
 * Rotas estáticas — TODAS existem em `src/app/`.
 * `lastModified` é fixo (data de revisão editorial), não `new Date()`.
 */
const STATIC_ROUTES: StaticRoute[] = [
  { path: '/', changeFrequency: 'weekly', priority: 1.0, lastModified: '2026-06-15' },
  { path: '/coreia-do-sul', changeFrequency: 'monthly', priority: 0.9, lastModified: '2026-06-15' },
  { path: '/destinos', changeFrequency: 'weekly', priority: 0.9, lastModified: '2026-06-15' },
  { path: '/experiencias', changeFrequency: 'weekly', priority: 0.9, lastModified: '2026-06-15' },
  { path: '/coreia-do-sul/experiencias', changeFrequency: 'weekly', priority: 0.9, lastModified: '2026-06-15' },
  { path: '/jornadas', changeFrequency: 'weekly', priority: 0.9, lastModified: '2026-06-15' },
  { path: '/coreia-do-sul/jornadas', changeFrequency: 'weekly', priority: 0.9, lastModified: '2026-06-15' },
  { path: '/pacotes', changeFrequency: 'weekly', priority: 0.9, lastModified: '2026-06-15' },
  { path: '/intercambios', changeFrequency: 'weekly', priority: 0.9, lastModified: '2026-06-15' },
  { path: '/coreia-do-sul/intercambio', changeFrequency: 'weekly', priority: 0.9, lastModified: '2026-06-15' },
  { path: '/coreia-do-sul/k-beauty', changeFrequency: 'monthly', priority: 0.8, lastModified: '2026-06-15' },
  { path: '/journal', changeFrequency: 'weekly', priority: 0.7, lastModified: '2026-06-15' },
  { path: '/sobre', changeFrequency: 'monthly', priority: 0.6, lastModified: '2026-06-15' },
  { path: '/sobre-nos', changeFrequency: 'monthly', priority: 0.6, lastModified: '2026-06-15' },
  { path: '/contato', changeFrequency: 'monthly', priority: 0.6, lastModified: '2026-06-15' },
  { path: '/politica-de-privacidade', changeFrequency: 'yearly', priority: 0.3, lastModified: '2026-06-01' },
  { path: '/termos-de-uso', changeFrequency: 'yearly', priority: 0.3, lastModified: '2026-06-01' },
  { path: '/reembolso', changeFrequency: 'yearly', priority: 0.3, lastModified: '2026-06-01' },
];

/** Rotas que NUNCA entram no sitemap (privadas/inexistentes para o crawler). */
const PRIVATE_PREFIXES = ['/admin', '/dashboard', '/login', '/proposta', '/api'];

/**
 * `src/app/journal/[slug]` existe desde a publicação do catálogo (ver
 * `src/app/journal/[slug]/page.tsx`): os artigos publicados entram no sitemap
 * com `lastModified` = `publishedAt`/`updatedAt` reais.
 */
const JOURNAL_DETAIL_ROUTE_ENABLED = true;

/** `/faq` só entra no sitemap quando a rota existir em `src/app/faq/`. */
const FAQ_ROUTE_ENABLED = false;

const alternatesFor = (path: string): NonNullable<SitemapEntry['alternates']> => {
  const languages: Record<string, string> = {};
  for (const l of locales) languages[l] = localizedUrl(path, l);
  languages['x-default'] = localizedUrl(path, defaultLocale);
  return { languages };
};

const pushEntry = (
  out: SitemapEntry[],
  path: string,
  lastModified: Date | string,
  changeFrequency: ChangeFreq,
  priority: number,
): void => {
  out.push({
    url: localizedUrl(path, defaultLocale),
    lastModified,
    changeFrequency,
    priority,
    alternates: alternatesFor(path),
  });
};

const latest = (...dates: (Date | null | undefined)[]): Date | undefined => {
  const valid = dates.filter((d): d is Date => d instanceof Date && !Number.isNaN(d.getTime()));
  if (valid.length === 0) return undefined;
  return valid.reduce((max, d) => (d.getTime() > max.getTime() ? d : max));
};

/**
 * Rotas dinâmicas — fonte: Prisma (ver `prisma/schema.prisma`).
 * `lastModified` vem do `updatedAt`/`publishedAt` REAL do registro.
 *
 * Falha de banco não derruba o sitemap: as rotas estáticas continuam sendo
 * servidas e o erro é logado.
 */
async function dynamicEntries(): Promise<SitemapEntry[]> {
  const out: SitemapEntry[] = [];

  try {
    const [destinations, experiences, journeys, packages, posts] = await Promise.all([
      prisma.destination.findMany({
        select: { slug: true, updatedAt: true },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.experience.findMany({
        where: { status: 'active' },
        select: { slug: true, updatedAt: true },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.journey.findMany({
        where: { status: { in: ['active', 'soldout'] } },
        select: { slug: true, updatedAt: true },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.package.findMany({
        where: { status: 'active' },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.blogPost.findMany({
        where: { status: 'published' },
        select: { slug: true, updatedAt: true, publishedAt: true },
        orderBy: { publishedAt: 'desc' },
      }),
    ]);

    for (const d of destinations) {
      if (d.slug) pushEntry(out, `/destinos/${d.slug}`, d.updatedAt, 'monthly', 0.8);
    }
    for (const e of experiences) {
      if (e.slug) pushEntry(out, `/coreia-do-sul/experiencias/${e.slug}`, e.updatedAt, 'monthly', 0.8);
    }
    for (const j of journeys) {
      if (j.slug) pushEntry(out, `/coreia-do-sul/jornadas/${j.slug}`, j.updatedAt, 'weekly', 0.8);
    }
    for (const p of packages) {
      if (p.slug) pushEntry(out, `/pacotes/${p.slug}`, p.updatedAt, 'weekly', 0.8);
    }
    if (JOURNAL_DETAIL_ROUTE_ENABLED) {
      for (const post of posts) {
        if (!post.slug) continue;
        pushEntry(
          out,
          `/journal/${post.slug}`,
          latest(post.publishedAt, post.updatedAt) ?? post.updatedAt,
          'monthly',
          0.7,
        );
      }
    }
  } catch (error) {
    console.error('[sitemap] falha ao ler o catálogo público:', error);
  }

  return out;
}

/** `src/app/faq` ainda não existe — placeholder defensivo. */
async function faqEntries(): Promise<SitemapEntry[]> {
  if (!FAQ_ROUTE_ENABLED) return [];
  try {
    const faqs = await prisma.faqItem.findMany({
      where: { isActive: true },
      select: { updatedAt: true },
      orderBy: { sortOrder: 'asc' },
    });
    return faqs.map((f) => ({
      url: localizedUrl('/faq', defaultLocale),
      lastModified: f.updatedAt,
      changeFrequency: 'monthly' as ChangeFreq,
      priority: 0.5,
      alternates: alternatesFor('/faq'),
    }));
  } catch (error) {
    console.error('[sitemap] falha ao ler FAQ:', error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: SitemapEntry[] = [];

  for (const route of STATIC_ROUTES) {
    pushEntry(entries, route.path, route.lastModified, route.changeFrequency, route.priority);
  }

  const [dynamic, faq] = await Promise.all([dynamicEntries(), faqEntries()]);
  entries.push(...dynamic, ...faq);

  // Guarda de segurança: nunca publicar rota privada nem URL duplicada.
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const pathname = entry.url.startsWith(SITE_URL) ? entry.url.slice(SITE_URL.length) : entry.url;
    if (PRIVATE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return false;
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}
