import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { locales, type Locale } from '@/i18n/config';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://maeumglobal.com';

const STATIC_ROUTES: { path: string; changeFrequency?: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number }[] = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/destinos', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/pacotes', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/experiencias', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/coreia-do-sul/experiencias', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/intercambios', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/coreia-do-sul/intercambio', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/jornadas', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/coreia-do-sul/jornadas', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/coreia-do-sul/k-beauty', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/sobre', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/sobre-nos', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/journal', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/contato', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/termos-de-uso', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/politica-de-privacidade', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/reembolso', changeFrequency: 'yearly', priority: 0.3 },
];

const DYNAMIC_ROUTES = {
  '/destinos': 'destinations',
  '/pacotes': 'packages',
  '/coreia-do-sul/experiencias': 'experiences',
  '/coreia-do-sul/jornadas': 'journeys',
} as const;

function localUrl(path: string, locale: Locale): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  const localized = locale === 'pt' ? clean : `/${locale}${clean}`;
  return `${SITE_URL}${localized}`;
}

function alternatesFor(path: string): MetadataRoute.Sitemap[number]['alternates'] {
  const languages: Record<string, string> = {};
  for (const l of locales) languages[l] = localUrl(path, l);
  return { languages };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const route of STATIC_ROUTES) {
    entries.push({
      url: localUrl(route.path, 'pt'),
      lastModified: new Date(),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: alternatesFor(route.path),
    });
  }

  for (const [base, table] of Object.entries(DYNAMIC_ROUTES)) {
    const rows = (db.get(table as never) || []) as { slug?: string }[];
    for (const row of rows) {
      if (!row.slug) continue;
      const path = `${base}/${row.slug}`;
      entries.push({
        url: localUrl(path, 'pt'),
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
        alternates: alternatesFor(path),
      });
    }
  }

  return entries;
}
