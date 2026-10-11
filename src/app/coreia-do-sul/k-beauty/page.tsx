import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, Clock, MapPin, Sparkles, Star } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SmartImage from '@/components/SmartImage';
import JsonLd from '@/components/seo/JsonLd';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import { prisma } from '@/lib/prisma';
import { getMediaMap } from '@/lib/cmsData';
import { getServerI18n } from '@/lib/serverI18n';
import { buildMetadata, localizedUrl, productJsonLd, truncateMeta } from '@/lib/seo';

/* ────────────────────────────────────────────────────────────────────────────
 * SEO
 * ────────────────────────────────────────────────────────────────────────── */

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getServerI18n();
  return buildMetadata({
    title: truncateMeta(t('coreia.kbeauty.pageTitle'), 60),
    description: t('coreia.kbeauty.seoDescription'),
    path: '/coreia-do-sul/k-beauty',
    locale,
    imageAlt: t('coreia.k-beauty-experiences'),
  });
}

/* ────────────────────────────────────────────────────────────────────────────
 * Helpers
 * ────────────────────────────────────────────────────────────────────────── */

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

/* ────────────────────────────────────────────────────────────────────────────
 * Página
 * ────────────────────────────────────────────────────────────────────────── */

export default async function KBeautyPage() {
  const { t, locale, lp, formatNumber, formatCurrency } = await getServerI18n();

  const [rows, catalogSlugs, media] = await Promise.all([
    prisma.kbeautyExperience
      .findMany({
        where: { status: 'active' },
        orderBy: { createdAt: 'desc' },
        take: 24,
      })
      .catch((error: unknown) => {
        console.error('[k-beauty] falha ao ler experiências K-Beauty:', error);
        return [];
      }),
    /**
     * `KbeautyExperience` tem `slug` próprio, mas o CTA leva para a página de
     * detalhe de `/coreia-do-sul/experiencias`. Só oferecemos esse deep link
     * quando existe uma `Experience` publicada com o mesmo slug — caso
     * contrário caímos no catálogo, para não mandar o visitante a um 404.
     */
    prisma.experience
      .findMany({ where: { status: 'active' }, select: { slug: true } })
      .catch(() => [] as { slug: string }[]),
    getMediaMap().catch(() => ({}) as Record<string, string>),
  ]);

  const experienceSlugs = new Set(catalogSlugs.map((row) => row.slug));
  const hero = media.kbeauty_hero ?? '';
  const cardFallback = media.coreia_kbeauty_fallback ?? hero;

  const experiences = rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    location: row.location,
    description: row.description,
    durationHours: row.durationHours,
    pricePerPerson: row.pricePerPerson,
    priceCurrency: row.priceCurrency || 'BRL',
    mainImage: row.mainImage,
    included: [...new Set(parseStringList(row.included))],
    detailHref: experienceSlugs.has(row.slug)
      ? `/coreia-do-sul/experiencias/${row.slug}`
      : '/coreia-do-sul/experiencias',
  }));

  const featured = experiences[0] ?? null;

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t('coreia.kbeauty.pageTitle'),
    numberOfItems: experiences.length,
    itemListElement: experiences.map((experience, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: productJsonLd({
        name: experience.title,
        description: experience.description ?? experience.subtitle ?? experience.title,
        path: experience.detailHref,
        locale,
        image: experience.mainImage ?? undefined,
        price: experience.pricePerPerson,
        priceCurrency: experience.priceCurrency,
        category: t('detalhe.k-beauty'),
      }),
    })),
  };

  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${localizedUrl('/coreia-do-sul/k-beauty', locale)}#service`,
    name: t('coreia.kbeauty.pageTitle'),
    serviceType: t('coreia.k-beauty-experiences'),
    description: t('coreia.kbeauty.seoDescription'),
    url: localizedUrl('/coreia-do-sul/k-beauty', locale),
    areaServed: [
      { '@type': 'Country', name: 'South Korea' },
      { '@type': 'Country', name: 'Brazil' },
    ],
    provider: { '@id': `${localizedUrl('/', locale)}#travelagency` },
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <JsonLd id="kbeauty-itemlist-jsonld" data={itemListJsonLd} />
      <JsonLd id="kbeauty-service-jsonld" data={serviceJsonLd} />

      <Header />

      <main className="flex-1 w-full">
        {/* Hero (LCP) */}
        <section
          aria-labelledby="kbeauty-hero-title"
          className="relative min-h-[100dvh] w-full overflow-hidden"
        >
          <SmartImage
            src={hero}
            alt={t('coreia.k-beauty-experiences')}
            fill
            className="object-cover"
            sizes="100vw"
            priority
            quality={75}
            placeholderLabel={t('coreia.k-beauty-experiences')}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-16 max-w-7xl mx-auto w-full">
            <div className="max-w-3xl text-white">
              <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 backdrop-blur-sm inline-block mb-4">
                {t('coreia.coreia-do-sul')}
              </span>
              <h1
                id="kbeauty-hero-title"
                className="font-heading text-5xl sm:text-7xl font-light tracking-wide uppercase leading-tight"
              >
                {t('coreia.k-beauty-experiences')}
              </h1>
              <p className="text-sm sm:text-base text-white/80 mt-4 max-w-xl font-light leading-relaxed">
                {t('coreia.hero.description')}
              </p>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6">
          <Breadcrumbs
            locale={locale}
            items={[
              { name: t('coreia.coreia-do-sul'), path: '/coreia-do-sul' },
              { name: t('coreia.k-beauty-experiences'), path: '/coreia-do-sul/k-beauty' },
            ]}
          />
        </div>

        {/* Introdução */}
        <section
          aria-labelledby="kbeauty-intro-title"
          className="py-20 px-4 md:px-8 max-w-4xl mx-auto w-full text-center"
        >
          <span className="text-xs uppercase tracking-widest text-primary font-bold">
            {t('coreia.essay.title')}
          </span>
          <h2
            id="kbeauty-intro-title"
            className="font-heading text-3xl sm:text-4xl font-light text-secondary mt-3 leading-tight"
          >
            {t('coreia.essay.line1')}
          </h2>
          <div className="mt-8 space-y-4 text-sm text-muted-foreground leading-relaxed max-w-3xl mx-auto font-light">
            <p>{t('coreia.essay.line2')}</p>
            <p>{t('coreia.essay.line3')}</p>
          </div>
        </section>

        {/* Experiência em destaque */}
        {featured && (
          <section
            aria-labelledby="kbeauty-featured-title"
            className="py-16 px-4 md:px-8 max-w-7xl mx-auto w-full"
          >
            <div className="text-center mb-12">
              <span className="text-xs uppercase tracking-widest text-primary font-bold">
                {t('coreia.experiencia-em-destaque')}
              </span>
              <h2
                id="kbeauty-featured-title"
                className="font-heading text-3xl font-light text-secondary mt-2"
              >
                {t('coreia.k-beauty-signature')}
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
              <div className="relative aspect-[4/3] lg:aspect-auto lg:h-full min-h-[400px] w-full">
                <SmartImage
                  src={featured.mainImage ?? cardFallback}
                  alt={featured.title}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  quality={75}
                  placeholderLabel={featured.title}
                />
              </div>

              <div className="p-8 md:p-12 flex flex-col gap-6">
                <h3 className="font-heading text-2xl md:text-3xl font-bold text-secondary leading-tight">
                  {featured.title}
                </h3>

                {featured.subtitle && (
                  <p className="text-sm text-muted-foreground font-light leading-relaxed">
                    {featured.subtitle}
                  </p>
                )}

                <dl className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {featured.location && (
                    <div className="flex items-center gap-1.5">
                      <dt className="sr-only">{t('detalhe.localizacao')}</dt>
                      <dd className="flex items-center gap-1.5">
                        <MapPin aria-hidden className="h-4 w-4 shrink-0 text-accent" />
                        {featured.location}
                      </dd>
                    </div>
                  )}
                  {featured.durationHours > 0 && (
                    <div className="flex items-center gap-1.5">
                      <dt className="sr-only">{t('experiencias.catalog.filterDuration')}</dt>
                      <dd className="flex items-center gap-1.5">
                        <Clock aria-hidden className="h-4 w-4 shrink-0 text-accent" />
                        {formatNumber(featured.durationHours, { maximumFractionDigits: 1 })}h
                      </dd>
                    </div>
                  )}
                  {featured.pricePerPerson > 0 && (
                    <div className="flex items-center gap-1.5">
                      <dt className="sr-only">{t('detalhe.pessoa-x')}</dt>
                      <dd className="flex items-center gap-1.5">
                        <Sparkles aria-hidden className="h-4 w-4 shrink-0 text-accent" />
                        {formatCurrency(featured.pricePerPerson, featured.priceCurrency)}{' '}
                        {t('detalhe.pessoa-x')}
                      </dd>
                    </div>
                  )}
                </dl>

                {featured.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed font-light">
                    {featured.description}
                  </p>
                )}

                {featured.included.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] uppercase font-bold text-primary tracking-widest">
                      {t('coreia.incluso')}
                    </span>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {featured.included.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                          <Check aria-hidden className="h-3.5 w-3.5 shrink-0 mt-0.5 text-accent" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Link
                  href={lp(featured.detailHref)}
                  className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-accent-hover text-white transition-all text-xs font-bold py-3.5 px-8 rounded-xl uppercase tracking-wider shadow-sm w-fit mt-2"
                >
                  {t('coreia.solicitar-reserva')}
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Catálogo K-Beauty (Prisma) */}
        <section
          aria-labelledby="kbeauty-catalog-title"
          className="py-20 px-4 md:px-8 max-w-7xl mx-auto w-full border-t border-border"
        >
          <div className="text-center mb-12">
            <span className="text-xs uppercase tracking-widest text-primary font-bold">
              {t('experiencias.grid.kicker')}
            </span>
            <h2
              id="kbeauty-catalog-title"
              className="font-heading text-3xl font-light text-secondary mt-2"
            >
              {t('coreia.experiencia-em-destaque')}
            </h2>
          </div>

          {experiences.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border rounded-3xl">
              <Sparkles aria-hidden className="h-6 w-6 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-heading text-xl font-light text-secondary">
                {t('coreia.kbeauty.emptyTitle')}
              </h3>
              <p className="text-xs text-muted-foreground mt-2 max-w-lg mx-auto leading-relaxed">
                {t('coreia.kbeauty.emptyDescription')}
              </p>
              <Link
                href={lp('/coreia-do-sul/experiencias')}
                className="mt-6 inline-flex items-center justify-center gap-2 bg-primary hover:bg-accent-hover text-white text-xs font-bold py-3 px-6 rounded-xl uppercase tracking-wider"
              >
                {t('experiencias.grid.book')}
              </Link>
            </div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {experiences.map((experience) => (
                <li key={experience.id}>
                  <Link
                    href={lp(experience.detailHref)}
                    className="group flex h-full flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                      <SmartImage
                        src={experience.mainImage ?? cardFallback}
                        alt={experience.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        quality={75}
                        placeholderLabel={experience.title}
                      />
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-heading text-lg font-semibold text-secondary leading-tight line-clamp-2">
                        {experience.title}
                      </h3>
                      {experience.subtitle && (
                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                          {experience.subtitle}
                        </p>
                      )}
                      <div className="mt-auto pt-4 flex items-center justify-between gap-3 border-t border-border">
                        <span className="text-[10px] text-muted-foreground truncate">
                          {experience.location}
                        </span>
                        {experience.pricePerPerson > 0 && (
                          <span className="font-heading text-sm font-bold text-primary shrink-0">
                            {formatCurrency(experience.pricePerPerson, experience.priceCurrency)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Parceiros */}
        <section
          aria-labelledby="kbeauty-partners-title"
          className="py-20 px-4 md:px-8 max-w-7xl mx-auto w-full border-t border-border"
        >
          <div className="text-center mb-12">
            <span className="text-xs uppercase tracking-widest text-primary font-bold">
              {t('coreia.parceiros')}
            </span>
            <h2
              id="kbeauty-partners-title"
              className="font-heading text-3xl font-light text-secondary mt-2"
            >
              {t('coreia.empresas-parceiras')}
            </h2>
          </div>

          <div className="bg-card border border-border rounded-3xl p-8 md:p-12 text-center">
            <Star aria-hidden className="h-8 w-8 mx-auto mb-4 text-accent/40" />
            <p className="text-sm text-muted-foreground font-light leading-relaxed max-w-2xl mx-auto">
              {t('coreia.partners.comingSoon')}
            </p>
          </div>
        </section>

        {/* K-Beauty nas jornadas */}
        <section
          aria-labelledby="kbeauty-journeys-title"
          className="py-20 bg-muted/20 border-t border-border w-full"
        >
          <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
            <span className="text-xs uppercase tracking-widest text-primary font-bold">
              {t('coreia.journeys.subtitle')}
            </span>
            <h2
              id="kbeauty-journeys-title"
              className="font-heading text-3xl font-light text-secondary mt-2 leading-tight"
            >
              {t('coreia.k-beauty-nas-jornadas-cheotnun')}
            </h2>
            <p className="text-sm text-muted-foreground font-light leading-relaxed max-w-3xl mx-auto mt-6">
              {t('coreia.journeys.description')}
            </p>
            <Link
              href={lp('/coreia-do-sul/jornadas')}
              className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-accent-hover text-white transition-all text-xs font-bold py-3.5 px-8 rounded-xl uppercase tracking-wider shadow-sm mt-8"
            >
              {t('coreia.conhecer-jornadas')}
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
