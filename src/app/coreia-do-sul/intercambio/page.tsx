import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { getMediaMap } from '@/lib/cmsData';
import { getServerI18n } from '@/lib/serverI18n';
import { buildMetadata, breadcrumbJsonLd, truncateMeta } from '@/lib/seo';
import JsonLd from '@/components/seo/JsonLd';
import IntercambioClient, {
  type InstitutionView,
  type ProgramView,
  type CampusView,
  type PricingTier,
} from './_components/IntercambioClient';

/* ────────────────────────────────────────────────────────────────────────────
 * SEO
 * ────────────────────────────────────────────────────────────────────────── */

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getServerI18n();
  return buildMetadata({
    title: truncateMeta(t('intercambios.seo.title'), 60),
    description: t('coreia.intercambio.seoDescription'),
    path: '/coreia-do-sul/intercambio',
    locale,
    image: '/images/agencia-viagens-coreia-do-sul-maeum-global-intercambio.webp',
    imageAlt: t('intercambios.hero.title'),
  });
}

/* ────────────────────────────────────────────────────────────────────────────
 * Helpers
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * `ExchangeProgram.pricingTiers` é JSON livre. Aceitamos `price_per_week` e
 * `pricePerWeek` e, na falta da moeda na linha, caímos para a moeda do
 * programa (padrão USD para schools de coreano, o que o painel costuma gravar).
 */
const parsePricingTiers = (value: string): PricingTier[] => {
  try {
    const parsed: unknown = JSON.parse(value || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item): PricingTier | null => {
        if (!item || typeof item !== 'object') return null;
        const row = item as Record<string, unknown>;
        const price = Number(row.price_per_week ?? row.pricePerWeek ?? row.price);
        if (!Number.isFinite(price) || price <= 0) return null;
        const currency =
          typeof row.currency === 'string' && row.currency.trim() ? row.currency.trim() : 'USD';
        const range =
          typeof row.range === 'string' && row.range.trim()
            ? row.range.trim()
            : typeof row.weeks === 'string' && row.weeks.trim()
              ? row.weeks.trim()
              : null;
        return range ? { range, currency, price } : null;
      })
      .filter((item): item is PricingTier => item !== null);
  } catch {
    return [];
  }
};

/* ────────────────────────────────────────────────────────────────────────────
 * Página
 * ────────────────────────────────────────────────────────────────────────── */

export default async function LexisKoreaIntercambioPage() {
  const { t, locale } = await getServerI18n();

  const [institutions, media] = await Promise.all([
    prisma.exchangeInstitution
      .findMany({
        where: { isActive: true },
        include: {
          campuses: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            include: {
              programs: {
                where: { isActive: true },
                orderBy: { sortOrder: 'asc' },
              },
            },
          },
        },
        orderBy: { sortOrder: 'asc' },
      })
      .catch((error: unknown) => {
        console.error('[intercambio] falha ao ler instituições:', error);
        return [];
      }),
    getMediaMap().catch(() => ({}) as Record<string, string>),
  ]);

  const heroDesktop = media.intercambio_hero_desktop ?? '';
  const heroMobile = media.intercambio_hero_mobile ?? '';
  const campusFallback = media.coreia_intercambio_campus_fallback ?? '';

  const views: InstitutionView[] = institutions.map((institution) => {
    const campuses: CampusView[] = institution.campuses.map((campus) => {
      const programs: ProgramView[] = campus.programs.map((program) => ({
        id: program.id,
        campusId: program.campusId,
        name: program.name,
        slug: program.slug,
        description: program.description,
        durationWeeksMin: program.durationWeeksMin,
        durationWeeksMax: program.durationWeeksMax,
        classesPerWeek: program.classesPerWeek,
        levelRequired: program.levelRequired,
        pricingTiers: parsePricingTiers(program.pricingTiers),
        includesEnrollment: program.includesEnrollment,
        enrollmentFee: program.enrollmentFee,
        includesMaterial: program.includesMaterial,
        materialFee: program.materialFee,
        culturalActivities: program.culturalActivities,
      }));
      return {
        id: campus.id,
        name: campus.name,
        city: campus.city,
        location: campus.location,
        description: campus.description,
        mainImage: campus.mainImage,
        programs,
      };
    });

    return {
      id: institution.id,
      name: institution.name,
      slug: institution.slug,
      description: institution.description,
      country: institution.country,
      website: institution.website,
      logoUrl: institution.logoUrl,
      campuses,
    };
  });

  const programs = views.flatMap((institution) =>
    institution.campuses.flatMap((campus) => campus.programs),
  );

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t('intercambios.hero.title'),
    numberOfItems: programs.length,
    itemListElement: programs.map((program, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Course',
        '@id': `/coreia-do-sul/intercambio#${program.slug}`,
        name: program.name,
        description: program.description ?? program.name,
        inLanguage: 'ko',
        ...(program.pricingTiers[0]
          ? {
              offers: {
                '@type': 'Offer',
                price: program.pricingTiers[0].price.toFixed(2),
                priceCurrency: program.pricingTiers[0].currency,
                availability: 'https://schema.org/InStock',
              },
            }
          : {}),
      },
    })),
  };

  const educationalOrganizationJsonLd = views.map((institution) => ({
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    '@id': `/coreia-do-sul/intercambio#${institution.slug}`,
    name: institution.name,
    description: institution.description ?? institution.name,
    ...(institution.logoUrl ? { logo: institution.logoUrl } : {}),
    ...(institution.website ? { url: institution.website, sameAs: [institution.website] } : {}),
    areaServed: { '@type': 'Country', name: 'South Korea' },
    department: institution.campuses.map((campus) => ({
      '@type': 'EducationalOrganization',
      name: campus.name,
      ...(campus.mainImage ? { image: campus.mainImage } : {}),
      address: {
        '@type': 'PostalAddress',
        addressLocality: campus.city,
        addressCountry: 'KR',
        ...(campus.location ? { streetAddress: campus.location } : {}),
      },
    })),
    makesOffer: institution.campuses
      .flatMap((campus) => campus.programs)
      .map((program) => ({
        '@type': 'Course',
        name: program.name,
        description: program.description ?? program.name,
      })),
  }));

  return (
    <>
      <JsonLd id="intercambio-itemlist-jsonld" data={itemListJsonLd} />
      {educationalOrganizationJsonLd.map((node, index) => (
        <JsonLd key={node['@id']} id={`intercambio-edu-${index}`} data={node} />
      ))}
      <JsonLd
        id="breadcrumb-jsonld"
        data={breadcrumbJsonLd(
          [
            { name: t('coreia.coreia-do-sul'), path: '/coreia-do-sul' },
            { name: t('detalhe.intercambio'), path: '/coreia-do-sul/intercambio' },
          ],
          locale,
        )}
      />
      <IntercambioClient
        institutions={views}
        heroDesktop={heroDesktop}
        heroMobile={heroMobile}
        campusFallback={campusFallback}
        loadError={institutions.length === 0 ? t('coreia.intercambio.loadError') : null}
      />
    </>
  );
}
