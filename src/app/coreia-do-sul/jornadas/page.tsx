import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Calendar, Clock, Map, Users } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SmartImage from '@/components/SmartImage';
import JsonLd from '@/components/seo/JsonLd';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import { prisma } from '@/lib/prisma';
import { getMediaMap } from '@/lib/cmsData';
import { getServerI18n } from '@/lib/serverI18n';
import {
  buildMetadata,
  touristTripJsonLd,
  truncateMeta,
} from '@/lib/seo';

/* ────────────────────────────────────────────────────────────────────────────
 * SEO
 * ────────────────────────────────────────────────────────────────────────── */

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getServerI18n();
  return buildMetadata({
    title: truncateMeta(t('coreia.jornadas.pageTitle'), 60),
    description: t('coreia.jornadas.seoDescription'),
    path: '/coreia-do-sul/jornadas',
    locale,
    image: '/images/agencia-viagens-coreia-do-sul-maeum-global-jornadas.webp',
    imageAlt: t('jornadas.heroImage.desktop'),
  });
}

/* ────────────────────────────────────────────────────────────────────────────
 * Página
 * ────────────────────────────────────────────────────────────────────────── */

const parseStringList = (value: string): string[] => {
  try {
    const parsed: unknown = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

/**
 * `Journey.category` é dado do painel (`army` | `premium` | `essence` | `luxury`).
 * Só `premium` ganha rótulo traduzido do dicionário; as demais categorias são
 * exibidas a partir do próprio valor cadastrado, em maiúsculas.
 */
const categoryLabel = (category: string, premiumLabel: string): string =>
  category === 'premium' ? premiumLabel : category.toUpperCase();

export default async function JornadasPage() {
  const { t, locale, lp, formatNumber, formatDate, formatCurrency, localizedField } =
    await getServerI18n();

  const [journeys, media] = await Promise.all([
    prisma.journey
      .findMany({
        where: { status: { in: ['active', 'soldout'] } },
        orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
        include: {
          departures: {
            where: { status: { in: ['available', 'limited'] } },
            orderBy: { startDate: 'asc' },
            take: 1,
          },
        },
      })
      .catch((error: unknown) => {
        console.error('[jornadas] falha ao ler jornadas:', error);
        return [];
      }),
    getMediaMap().catch(() => ({}) as Record<string, string>),
  ]);

  const heroDesktop = media.jornadas_hero_desktop ?? '';
  const heroMobile = media.jornadas_hero_mobile ?? '';
  const cardFallback = media.coreia_jornadas_fallback ?? '';

  const rows = journeys.map((journey) => ({
    id: journey.id,
    slug: journey.slug,
    title:
      localizedField({ pt: journey.title, en: journey.titleEn, es: journey.titleEs }) ??
      journey.title,
    category: journey.category,
    destinations: parseStringList(journey.destinations),
    durationDays: journey.durationDays,
    pricePerPerson: journey.pricePerPerson,
    priceCurrency: journey.priceCurrency,
    mainImage: journey.mainImage,
    nextDeparture: journey.departures[0]
      ? {
          startDate: journey.departures[0].startDate.toISOString(),
          availableSpots: journey.departures[0].availableSpots,
        }
      : null,
  }));

  /* ── JSON-LD: ItemList + TouristTrip ────────────────────────────────────── */
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t('coreia.jornadas.pageTitle'),
    numberOfItems: rows.length,
    itemListElement: rows.map((row, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: touristTripJsonLd({
        name: row.title,
        description: t('jornadas.groups.description'),
        path: `/coreia-do-sul/jornadas/${row.slug}`,
        locale,
        image: row.mainImage ?? undefined,
        durationDays: row.durationDays,
        price: row.pricePerPerson,
        priceCurrency: row.priceCurrency,
        ...(row.nextDeparture ? { departureDate: row.nextDeparture.startDate } : {}),
        ...(row.destinations.length
          ? {
              itinerary: row.destinations.map((name) => ({ name, path: '/destinos' })),
            }
          : {}),
      }),
    })),
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <JsonLd id="jornadas-itemlist-jsonld" data={itemListJsonLd} />

      <Header />

      <main className="flex-1 w-full">
        {/* HERO (LCP) */}
        <section
          aria-labelledby="jornadas-hero-title"
          className="relative h-[80vh] min-h-[500px] w-full overflow-hidden"
        >
          <SmartImage
            src={heroDesktop}
            alt={t('jornadas.heroImage.desktop')}
            fill
            className="object-cover hidden md:block"
            sizes="100vw"
            priority
            quality={75}
            fallbackSrc={heroMobile}
            placeholderLabel={t('jornadas.heroImage.desktop')}
          />
          <SmartImage
            src={heroMobile}
            alt={t('jornadas.heroImage.mobile')}
            fill
            className="object-cover block md:hidden"
            sizes="100vw"
            quality={75}
            fallbackSrc={heroDesktop}
            placeholderLabel={t('jornadas.heroImage.mobile')}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-16 max-w-7xl mx-auto w-full">
            <div className="max-w-3xl text-white">
              <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 backdrop-blur-sm inline-block mb-4">
                {t('coreia.coreia-do-sul')}
              </span>
              <h1
                id="jornadas-hero-title"
                className="font-heading text-5xl sm:text-7xl font-light tracking-wide uppercase leading-tight"
              >
                {t('jornadas.groups.title')}
              </h1>
              <p className="text-sm sm:text-base text-white/80 mt-4 max-w-xl font-light leading-relaxed">
                {t('jornadas.groups.kicker')}
              </p>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6">
          <Breadcrumbs
            locale={locale}
            items={[
              { name: t('coreia.coreia-do-sul'), path: '/coreia-do-sul' },
              { name: t('jornadas.groups.subtitle'), path: '/coreia-do-sul/jornadas' },
            ]}
          />
        </div>

        {/* INTRO */}
        <section
          aria-labelledby="jornadas-intro-title"
          className="py-20 px-4 md:px-8 max-w-4xl mx-auto w-full text-center"
        >
          <span className="text-xs uppercase tracking-widest text-primary font-bold">
            {t('jornadas.groups.subtitle')}
          </span>
          <h2
            id="jornadas-intro-title"
            className="font-heading text-3xl sm:text-4xl font-light text-secondary mt-3 leading-tight"
          >
            {t('jornadas.groups.tagline')}
          </h2>
          <div className="mt-8 space-y-4 text-sm text-muted-foreground leading-relaxed max-w-3xl mx-auto font-light">
            <p>{t('jornadas.groups.description')}</p>
            <p>{t('jornadas.groups.description2')}</p>
          </div>
        </section>

        {/* GRID */}
        <section
          aria-labelledby="jornadas-grid-title"
          className="py-10 pb-24 px-4 md:px-8 max-w-7xl mx-auto w-full"
        >
          <h2 id="jornadas-grid-title" className="sr-only">
            {t('jornadas.groups.subtitle')}
          </h2>
          {rows.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Map aria-hidden className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-heading text-xl font-light text-secondary">
                {t('jornadas.groups.emptyTitle')}
              </h3>
              <p className="text-xs text-muted-foreground mt-2">
                {t('jornadas.groups.emptyDescription')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {rows.map((journey) => {
                const badge = categoryLabel(journey.category, t('jornadas.badge.premium'));
                return (
                  <article
                    key={journey.id}
                    className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm flex flex-col group"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                      <SmartImage
                        src={journey.mainImage ?? cardFallback}
                        alt={journey.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                        quality={75}
                        placeholderLabel={journey.title}
                      />
                      <div className="absolute top-3 left-3">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border shadow-sm backdrop-blur-sm ${
                            journey.category === 'army'
                              ? 'bg-purple-600/90 text-white border-purple-500/30'
                              : 'bg-primary/90 text-white border-primary/30'
                          }`}
                        >
                          {badge}
                        </span>
                      </div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-heading text-xl font-bold text-secondary leading-tight">
                          {journey.title}
                        </h3>
                        {journey.destinations.length > 0 && (
                          <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                            <Map aria-hidden className="h-3.5 w-3.5 shrink-0 text-accent" />
                            <span>{journey.destinations.join(', ')}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock aria-hidden className="h-3.5 w-3.5 shrink-0 text-accent" />
                            {formatNumber(journey.durationDays)} {t('jornadas.detail.days')}
                          </span>
                          {journey.nextDeparture && (
                            <span className="flex items-center gap-1">
                              <Calendar aria-hidden className="h-3.5 w-3.5 shrink-0 text-accent" />
                              {formatDate(journey.nextDeparture.startDate, {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </span>
                          )}
                        </div>
                        {journey.nextDeparture && (
                          <div className="flex items-center gap-1 mt-2 text-[11px] text-muted-foreground">
                            <Users aria-hidden className="h-3.5 w-3.5 shrink-0 text-accent" />
                            <span>
                              {formatNumber(journey.nextDeparture.availableSpots)}{' '}
                              {t('jornadas.vagas-disponiveis')}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-3 border-t border-border mt-5 pt-4">
                        <div>
                          <span className="font-heading text-lg font-bold text-secondary">
                            {formatCurrency(journey.pricePerPerson, journey.priceCurrency)}
                          </span>
                          <span className="text-[10px] text-muted-foreground ml-1">
                            {t('detalhe.pessoa-x')}
                          </span>
                        </div>
                        <Link
                          href={lp(`/coreia-do-sul/jornadas/${journey.slug}`)}
                          className="inline-flex items-center gap-1.5 bg-primary hover:bg-accent-hover text-white transition-all text-[10px] font-bold py-2.5 px-5 rounded-xl uppercase tracking-wider shadow-sm"
                        >
                          {t('jornadas.conhecer-jornada')}
                          <ArrowRight aria-hidden className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
