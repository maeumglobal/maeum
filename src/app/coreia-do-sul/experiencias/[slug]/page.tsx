import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Check, ChevronLeft, Clock, MapPin, Star } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SmartImage from '@/components/SmartImage';
import JsonLd from '@/components/seo/JsonLd';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import { prisma } from '@/lib/prisma';
import { getMediaMap } from '@/lib/cmsData';
import { getServerI18n } from '@/lib/serverI18n';
import { buildMetadata, productJsonLd, truncateMeta } from '@/lib/seo';
import ExperienceBookingWidget from './_components/ExperienceBookingWidget';

/* ────────────────────────────────────────────────────────────────────────────
 * Helpers de conteúdo JSON
 * ────────────────────────────────────────────────────────────────────────── */

/** `highlights`/`included` guardam JSON; variantes vazias caem para o pt. */
const parseStringList = (value: string): string[] => {
  try {
    const parsed: unknown = JSON.parse(value || '[]');
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : [];
  } catch {
    return [];
  }
};

const localizedStringList = (
  variants: { pt: string | null; en: string | null; es: string | null },
  order: readonly ('pt' | 'en' | 'es')[],
): string[] => {
  for (const locale of order) {
    const list = parseStringList(variants[locale] ?? '');
    if (list.length > 0) return [...new Set(list)];
  }
  return [];
};

/* ────────────────────────────────────────────────────────────────────────────
 * Dados
 * ────────────────────────────────────────────────────────────────────────── */

type ExperienceDetail = Awaited<ReturnType<typeof loadExperience>>;

async function loadExperience(slug: string) {
  return prisma.experience.findUnique({
    where: { slug },
    include: {
      categories: { include: { category: true } },
      partner: { select: { id: true, name: true, logoUrl: true, website: true, description: true } },
    },
  });
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  try {
    const experiences = await prisma.experience.findMany({
      where: { status: 'active' },
      select: { slug: true },
      orderBy: { sortOrder: 'asc' },
    });
    return experiences.map((experience) => ({ slug: experience.slug }));
  } catch (error) {
    console.error('[experiencias/[slug]] generateStaticParams:', error);
    return [];
  }
}

/* ────────────────────────────────────────────────────────────────────────────
 * SEO
 * ────────────────────────────────────────────────────────────────────────── */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { locale, t, localizedField } = await getServerI18n();

  let experience: ExperienceDetail = null;
  try {
    experience = await loadExperience(slug);
  } catch (error) {
    console.error('[experiencias/[slug]] generateMetadata:', error);
  }

  if (!experience) {
    return buildMetadata({
      title: truncateMeta(t('detalhe.experiencia-nao-encontrada'), 60),
      description: t('coreia.experiencias.notFoundDescription'),
      path: `/coreia-do-sul/experiencias/${slug}`,
      locale,
      noindex: true,
    });
  }

  const title = localizedField({
    pt: experience.title,
    en: experience.titleEn,
    es: experience.titleEs,
  }) ?? experience.title;
  const description = localizedField({
    pt: experience.description ?? experience.subtitle,
    en: experience.descriptionEn ?? experience.subtitleEn,
    es: experience.descriptionEs ?? experience.subtitleEs,
  });

  return buildMetadata({
    title: truncateMeta(`${title} | Maeum Global`, 60),
    description: truncateMeta(description ?? t('coreia.experiencias.seoDescription'), 160),
    path: `/coreia-do-sul/experiencias/${experience.slug}`,
    locale,
    image: experience.mainImage ?? undefined,
    imageAlt: title,
  });
}

/* ────────────────────────────────────────────────────────────────────────────
 * Página
 * ────────────────────────────────────────────────────────────────────────── */

export default async function ExperienceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { t, locale, lp, fill, localizedField } = await getServerI18n();

  let experience: ExperienceDetail = null;
  let media: Record<string, string> = {};
  try {
    [experience, media] = await Promise.all([
      loadExperience(slug),
      getMediaMap().catch(() => ({}) as Record<string, string>),
    ]);
  } catch (error) {
    console.error('[experiencias/[slug]] falha ao carregar a experiência:', error);
  }

  if (!experience) notFound();

  const title = localizedField({
    pt: experience.title,
    en: experience.titleEn,
    es: experience.titleEs,
  }) ?? experience.title;
  const subtitle = localizedField({
    pt: experience.subtitle,
    en: experience.subtitleEn,
    es: experience.subtitleEs,
  });
  const description = localizedField({
    pt: experience.description,
    en: experience.descriptionEn,
    es: experience.descriptionEs,
  });

  const localeOrder = [locale, 'pt', 'en', 'es'].filter(
    (value, index, all): value is 'pt' | 'en' | 'es' =>
      all.indexOf(value) === index && (value === 'pt' || value === 'en' || value === 'es'),
  );
  const highlights = localizedStringList(
    { pt: experience.highlights, en: experience.highlightsEn, es: experience.highlightsEs },
    localeOrder,
  );
  const included = localizedStringList(
    { pt: experience.included, en: experience.includedEn, es: experience.includedEs },
    localeOrder,
  );

  const fallbackImage = media.experiencias_card_fallback ?? media.coreia_experiencias_fallback ?? '';
  const allImages = [
    experience.mainImage ?? '',
    ...parseStringList(experience.gallery),
  ]
    .map((image) => image.trim())
    .filter((image) => image.length > 0);
  const mainImage = allImages[0] ?? fallbackImage;
  const sideImages = allImages.slice(1, 3);
  const categories = experience.categories
    .map((link) => link.category)
    .filter((category) => category && category.isActive);

  const productJsonLdData = productJsonLd({
    name: title,
    description: description ?? subtitle ?? title,
    path: `/coreia-do-sul/experiencias/${experience.slug}`,
    locale,
    image: allImages.length ? allImages : undefined,
    price: experience.pricePerPerson,
    priceCurrency: experience.priceCurrency || 'BRL',
    ...(categories[0] ? { category: categories[0].name } : {}),
    ...(experience.partner ? { brand: experience.partner.name } : {}),
  });

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <JsonLd id="experiencia-product-jsonld" data={productJsonLdData} />

      <Header />

      <main className="flex-1 w-full pb-32 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 pb-2">
          <Breadcrumbs
            locale={locale}
            items={[
              { name: t('coreia.coreia-do-sul'), path: '/coreia-do-sul' },
              { name: t('detalhe.experiencias'), path: '/coreia-do-sul/experiencias' },
              { name: title, path: `/coreia-do-sul/experiencias/${experience.slug}` },
            ]}
          />
          <Link
            href={lp('/coreia-do-sul/experiencias')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors mt-4"
          >
            <ChevronLeft aria-hidden className="h-4 w-4" />
            <span>{t('detalhe.voltar-para-experiencias')}</span>
          </Link>
        </div>

        {/* GALERIA (LCP) */}
        <section aria-label={t('experiencias.grid.kicker')} className="max-w-7xl mx-auto px-4 md:px-8 mt-4 mb-10">
          {sideImages.length > 0 ? (
            <div className="hidden md:grid grid-cols-4 gap-2 rounded-3xl overflow-hidden h-[60vh] min-h-[420px]">
              <div className="col-span-2 row-span-2 relative">
                <SmartImage
                  src={mainImage}
                  alt={title}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                  sizes="(min-width: 768px) 50vw, 100vw"
                  priority
                  quality={75}
                  placeholderLabel={title}
                />
              </div>
              {sideImages.map((image) => (
                <div key={image} className="relative">
                  <SmartImage
                    src={image}
                    alt={fill(t('detalhe.booking.galleryImageAlt'), { item: title })}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-500"
                    sizes="(min-width: 768px) 25vw, 100vw"
                    quality={75}
                    placeholderLabel={title}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="relative aspect-[4/3] md:aspect-[21/9] rounded-3xl overflow-hidden">
              <SmartImage
                src={mainImage}
                alt={title}
                fill
                className="object-cover"
                sizes="(min-width: 1280px) 1216px, 100vw"
                priority
                quality={75}
                placeholderLabel={title}
              />
            </div>
          )}

          <div className="md:hidden relative aspect-[4/3] rounded-3xl overflow-hidden">
            <SmartImage
              src={mainImage}
              alt={title}
              fill
              className="object-cover"
              sizes="100vw"
              priority
              quality={75}
              placeholderLabel={title}
            />
          </div>
        </section>

        {/* CONTEÚDO + RESERVA */}
        <section className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-10">
            <div>
              <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-light text-secondary leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed max-w-2xl">
                  {subtitle}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4 mt-5 text-xs text-muted-foreground">
                {experience.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin aria-hidden className="h-4 w-4 shrink-0 text-accent" />
                    <span className="font-medium text-secondary">{experience.location}</span>
                  </div>
                )}
                {experience.durationHours > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Clock aria-hidden className="h-4 w-4 shrink-0 text-accent" />
                    <span className="font-medium text-secondary">
                      {experience.durationHours}h
                    </span>
                  </div>
                )}
              </div>
              {categories.length > 0 && (
                <ul className="flex flex-wrap gap-2 mt-4">
                  {categories.map((category) => (
                    <li
                      key={category.id}
                      className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/5 border border-primary/10 rounded-full px-3.5 py-1.5"
                    >
                      {localizedField({
                        pt: category.name,
                        en: category.nameEn,
                        es: category.nameEs,
                      }) ?? category.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div aria-hidden className="h-px bg-border" />

            {description && (
              <section aria-labelledby="experiencia-about-title">
                <h2
                  id="experiencia-about-title"
                  className="font-heading text-2xl font-light text-secondary mb-4"
                >
                  {t('detalhe.sobre-esta-experiencia')}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </section>
            )}

            {highlights.length > 0 && (
              <section aria-labelledby="experiencia-highlights-title">
                <h2
                  id="experiencia-highlights-title"
                  className="font-heading text-2xl font-light text-secondary mb-4"
                >
                  {t('detalhe.o-que-voce-vai-viver')}
                </h2>
                <ul className="space-y-3">
                  {highlights.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Star aria-hidden className="h-3 w-3 text-accent" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {included.length > 0 && (
              <section aria-labelledby="experiencia-included-title">
                <h2
                  id="experiencia-included-title"
                  className="font-heading text-2xl font-light text-secondary mb-4"
                >
                  {t('detalhe.o-que-esta-incluso')}
                </h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {included.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-50">
                        <Check aria-hidden className="h-3 w-3 text-green-600" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {experience.location && (
              <>
                <div aria-hidden className="h-px bg-border" />
                <section aria-labelledby="experiencia-location-title">
                  <h2
                    id="experiencia-location-title"
                    className="font-heading text-2xl font-light text-secondary mb-4"
                  >
                    {t('detalhe.localizacao')}
                  </h2>
                  <div className="flex items-start gap-3 text-sm text-muted-foreground">
                    <MapPin aria-hidden className="h-5 w-5 shrink-0 mt-0.5 text-accent" />
                    <p className="font-medium text-secondary">{experience.location}</p>
                  </div>
                </section>
              </>
            )}

            {experience.partner && (
              <section aria-labelledby="experiencia-partner-title">
                <h2
                  id="experiencia-partner-title"
                  className="font-heading text-2xl font-light text-secondary mb-4"
                >
                  {t('detalhe.experience.partner')}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {experience.partner.name}
                  {experience.partner.description ? ` — ${experience.partner.description}` : ''}
                </p>
              </section>
            )}

            <div aria-hidden className="h-px bg-border" />
            <section aria-labelledby="experiencia-booking-title">
              <h2
                id="experiencia-booking-title"
                className="font-heading text-2xl font-light text-secondary mb-6"
              >
                {t('detalhe.bookingInfo')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {experience.bookingType === 'direct'
                  ? t('detalhe.experience.directBooking')
                  : t('detalhe.experience.requiresRequest')}
              </p>
            </section>
          </div>

          {/* RIGHT: Booking Widget (client) */}
          <div className="lg:col-span-1">
            <ExperienceBookingWidget
              experienceTitle={title}
              experienceSlug={experience.slug}
              pricePerPerson={experience.pricePerPerson}
              priceCurrency={experience.priceCurrency || 'BRL'}
              bookingType={experience.bookingType ?? 'request'}
              availableFrom={experience.availableFrom?.toISOString() ?? null}
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
