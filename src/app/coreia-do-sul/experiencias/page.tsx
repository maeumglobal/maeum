import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { getMediaMap } from '@/lib/cmsData';
import { getServerI18n } from '@/lib/serverI18n';
import { buildMetadata, breadcrumbJsonLd, localizedUrl, productJsonLd, truncateMeta } from '@/lib/seo';
import JsonLd from '@/components/seo/JsonLd';
import ExperienciasClientPage from './_components/ExperienciasClientPage';

/* ────────────────────────────────────────────────────────────────────────────
 * SEO
 * ────────────────────────────────────────────────────────────────────────── */

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getServerI18n();
  return buildMetadata({
    title: truncateMeta(t('coreia.experiencias.pageTitle'), 60),
    description: t('coreia.experiencias.seoDescription'),
    path: '/coreia-do-sul/experiencias',
    locale,
    image: '/images/agencia-viagens-coreia-do-sul-maeum-global-experiencias.webp',
    imageAlt: t('experiencias.heroImage.desktop'),
  });
}

/* ────────────────────────────────────────────────────────────────────────────
 * Página
 * ────────────────────────────────────────────────────────────────────────── */

export default async function CoreaExperienciasPage() {
  const { t, locale, localizedField } = await getServerI18n();

  const [experiencesResult, categoriesResult, media] = await Promise.all([
    prisma.experience
      .findMany({
        where: { status: 'active' },
        include: {
          categories: { include: { category: true } },
          partner: { select: { id: true, name: true, logoUrl: true } },
        },
        orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
        take: 120,
      })
      .catch((error: unknown) => {
        console.error('[experiencias] falha ao ler experiências:', error);
        return [];
      }),
    prisma.category
      .findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, slug: true, name: true, nameEn: true, nameEs: true, isActive: true, sortOrder: true },
      })
      .catch((error: unknown) => {
        console.error('[experiencias] falha ao ler categorias:', error);
        return [];
      }),
    getMediaMap().catch(() => ({}) as Record<string, string>),
  ]);

  const cardFallback = media.coreia_experiencias_fallback ?? '';

  /* Normaliza para o formato que o componente cliente consome. */
  const experiences = experiencesResult.map((experience) => ({
    id: experience.id,
    slug: experience.slug,
    title: localizedField({
      pt: experience.title,
      en: experience.titleEn,
      es: experience.titleEs,
    }) ?? experience.title,
    subtitle:
      localizedField({
        pt: experience.subtitle,
        en: experience.subtitleEn,
        es: experience.subtitleEs,
      }) ?? '',
    description:
      localizedField({
        pt: experience.description,
        en: experience.descriptionEn,
        es: experience.descriptionEs,
      }) ?? '',
    location: experience.location ?? experience.city ?? experience.region,
    duration_hours: experience.durationHours,
    price_per_person: experience.pricePerPerson,
    price_currency: experience.priceCurrency || 'BRL',
    main_image: experience.mainImage,
    booking_type: experience.bookingType ?? 'request',
    category_slugs: experience.categories
      .map((link) => link.category.slug)
      .filter((slug): slug is string => typeof slug === 'string' && slug.length > 0),
    partner_name: experience.partner?.name ?? null,
  }));

  const categories = categoriesResult
    .map((category) => ({
      id: category.id,
      slug: category.slug,
      name:
        localizedField({ pt: category.name, en: category.nameEn, es: category.nameEs }) ??
        category.name,
      active: category.isActive,
      sort_order: category.sortOrder,
    }))
    .filter((category) => category.active);

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t('coreia.experiencias.pageTitle'),
    numberOfItems: experiences.length,
    itemListElement: experiences.map((experience, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: productJsonLd({
        name: experience.title,
        description: experience.description || experience.subtitle || experience.title,
        path: `/coreia-do-sul/experiencias/${experience.slug}`,
        locale,
        price: experience.price_per_person,
        priceCurrency: experience.price_currency,
        ...(experience.partner_name ? { brand: experience.partner_name } : {}),
      }),
    })),
  };

  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${localizedUrl('/coreia-do-sul/experiencias', locale)}#service`,
    name: t('coreia.experiencias.pageTitle'),
    serviceType: t('experiencias.grid.kicker'),
    description: t('coreia.experiencias.seoDescription'),
    url: localizedUrl('/coreia-do-sul/experiencias', locale),
    areaServed: [
      { '@type': 'Country', name: 'South Korea' },
      { '@type': 'Country', name: 'Brazil' },
    ],
    provider: { '@id': `${localizedUrl('/', locale)}#travelagency` },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: t('coreia.experiencias.pageTitle'),
      itemListElement: experiences.slice(0, 24).map((experience) => ({
        '@type': 'Offer',
        url: localizedUrl(`/coreia-do-sul/experiencias/${experience.slug}`, locale),
        price: experience.price_per_person.toFixed(2),
        priceCurrency: experience.price_currency,
      })),
    },
  };

  return (
    <>
      <JsonLd id="experiencias-itemlist-jsonld" data={itemListJsonLd} />
      <JsonLd id="experiencias-service-jsonld" data={serviceJsonLd} />
      <JsonLd
        id="breadcrumb-jsonld"
        data={breadcrumbJsonLd(
          [
            { name: t('coreia.coreia-do-sul'), path: '/coreia-do-sul' },
            { name: t('detalhe.experiencias'), path: '/coreia-do-sul/experiencias' },
          ],
          locale,
        )}
      />
      <ExperienciasClientPage
        experiences={experiences}
        categories={categories}
        cardFallback={cardFallback}
        dataError={experiencesResult.length === 0 ? t('coreia.experiencias.dataError') : null}
      />
    </>
  );
}
