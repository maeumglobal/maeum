import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, Check, ChevronLeft, Clock, MapPin, X } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SmartImage from '@/components/SmartImage';
import JsonLd from '@/components/seo/JsonLd';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import { prisma } from '@/lib/prisma';
import { getMediaMap } from '@/lib/cmsData';
import { getServerI18n } from '@/lib/serverI18n';
import { buildMetadata, touristTripJsonLd, truncateMeta } from '@/lib/seo';
import JornadaBookingWidget from './_components/JornadaBookingWidget';

/* ────────────────────────────────────────────────────────────────────────────
 * Conteúdo JSON serializado em colunas `String` do Prisma.
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

interface ItineraryDay {
  day: number;
  title: string;
  description: string;
}

const parseItinerary = (value: string): ItineraryDay[] => {
  try {
    const parsed: unknown = JSON.parse(value || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item): ItineraryDay | null => {
        if (!item || typeof item !== 'object') return null;
        const row = item as Record<string, unknown>;
        const day = Number(row.day);
        if (!Number.isFinite(day)) return null;
        return {
          day,
          title: typeof row.title === 'string' ? row.title : '',
          description: typeof row.description === 'string' ? row.description : '',
        };
      })
      .filter((item): item is ItineraryDay => item !== null && item.title.length > 0);
  } catch {
    return [];
  }
};

interface Highlight {
  title: string;
  description: string;
  image: string;
}

const parseHighlights = (value: string): Highlight[] => {
  try {
    const parsed: unknown = JSON.parse(value || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item): Highlight | null => {
        if (!item || typeof item !== 'object') return null;
        const row = item as Record<string, unknown>;
        const title = typeof row.title === 'string' ? row.title : '';
        if (!title) return null;
        return {
          title,
          description: typeof row.description === 'string' ? row.description : '',
          image: typeof row.image === 'string' ? row.image : '',
        };
      })
      .filter((item): item is Highlight => item !== null);
  } catch {
    return [];
  }
};

const uniqueStrings = (values: readonly string[]): string[] => [...new Set(values)];

/**
 * Listas JSON (`included`, `notIncluded`) existem em pt/en/es. Um `'[]'` numa
 * variante significa "não traduzido ainda", não "lista vazia": por isso
 * escolhemos a primeira variante que efetivamente tem itens.
 */
const localizedStringList = (
  variants: { pt: string | null; en: string | null; es: string | null },
  order: readonly ('pt' | 'en' | 'es')[],
): string[] => {
  for (const locale of order) {
    const list = parseStringList(variants[locale] ?? '');
    if (list.length > 0) return uniqueStrings(list);
  }
  return [];
};

/** Converte a URL do YouTube (formato `watch?v=`) num embed permitido pelo CSP. */
const toEmbedUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    const id = parsed.searchParams.get('v') ?? parsed.pathname.split('/').pop();
    if (!id) return null;
    if (parsed.hostname.includes('youtu.be')) return `https://www.youtube.com/embed/${id}`;
    if (parsed.hostname.includes('youtube.com')) return `https://www.youtube.com/embed/${id}`;
    if (parsed.hostname.includes('vimeo.com')) return `https://player.vimeo.com/video/${id}`;
    return null;
  } catch {
    return null;
  }
};

/* ────────────────────────────────────────────────────────────────────────────
 * Dados
 * ────────────────────────────────────────────────────────────────────────── */

type JourneyDetail = Awaited<
  ReturnType<typeof loadJourney>
>;

async function loadJourney(slug: string) {
  return prisma.journey.findUnique({
    where: { slug },
    include: {
      departures: { orderBy: { startDate: 'asc' } },
    },
  });
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  try {
    const journeys = await prisma.journey.findMany({
      where: { status: { in: ['active', 'soldout'] } },
      select: { slug: true },
      orderBy: { sortOrder: 'asc' },
    });
    return journeys.map((journey) => ({ slug: journey.slug }));
  } catch (error) {
    console.error('[jornadas/[slug]] generateStaticParams:', error);
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

  let journey: JourneyDetail = null;
  try {
    journey = await loadJourney(slug);
  } catch (error) {
    console.error('[jornadas/[slug]] generateMetadata:', error);
  }

  if (!journey) {
    return buildMetadata({
      title: truncateMeta(t('jornadas.jornada-nao-encontrada'), 60),
      description: t('coreia.jornadas.notFoundDescription'),
      path: `/coreia-do-sul/jornadas/${slug}`,
      locale,
      noindex: true,
    });
  }

  const title = localizedField({ pt: journey.title, en: journey.titleEn, es: journey.titleEs }) ?? journey.title;
  const description = localizedField({
    pt: journey.subtitle ?? journey.concept,
    en: journey.subtitleEn ?? journey.conceptEn,
    es: journey.subtitleEs ?? journey.conceptEs,
  });

  return buildMetadata({
    title: truncateMeta(`${title} | Maeum Global`, 60),
    description: truncateMeta(description ?? t('coreia.jornadas.seoDescription'), 160),
    path: `/coreia-do-sul/jornadas/${journey.slug}`,
    locale,
    image: journey.mainImage ?? undefined,
    imageAlt: title,
  });
}

/* ────────────────────────────────────────────────────────────────────────────
 * Página
 * ────────────────────────────────────────────────────────────────────────── */

export default async function JornadaDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t, locale, lp, fill, formatNumber, formatCurrency, formatDate, localizedField } =
    await getServerI18n();

  let journey: JourneyDetail = null;
  let media: Record<string, string> = {};
  try {
    [journey, media] = await Promise.all([
      loadJourney(slug),
      getMediaMap().catch(() => ({}) as Record<string, string>),
    ]);
  } catch (error) {
    console.error('[jornadas/[slug]] falha ao carregar a jornada:', error);
  }

  if (!journey) notFound();

  const title = localizedField({ pt: journey.title, en: journey.titleEn, es: journey.titleEs }) ?? journey.title;
  const subtitle = localizedField({
    pt: journey.subtitle,
    en: journey.subtitleEn,
    es: journey.subtitleEs,
  });
  const concept = localizedField({
    pt: journey.concept,
    en: journey.conceptEn,
    es: journey.conceptEs,
  });

  const destinations = parseStringList(journey.destinations);
  const localeOrder = [locale, 'pt', 'en', 'es'].filter(
    (value, index, all): value is 'pt' | 'en' | 'es' =>
      all.indexOf(value) === index && (value === 'pt' || value === 'en' || value === 'es'),
  );
  const included = localizedStringList(
    { pt: journey.included, en: journey.includedEn, es: journey.includedEs },
    localeOrder,
  );
  const notIncluded = localizedStringList(
    { pt: journey.notIncluded, en: journey.notIncludedEn, es: journey.notIncludedEs },
    localeOrder,
  );
  const itinerary = parseItinerary(journey.itinerary);
  const highlights = parseHighlights(journey.highlights);

  const heroFallback = media.coreia_jornadas_fallback ?? '';
  const allImages = uniqueStrings([journey.mainImage ?? '', ...parseStringList(journey.gallery)]).filter(
    (image) => image.length > 0,
  );
  const heroImage = allImages[0] ?? heroFallback;

  const departures = journey.departures.map((departure) => ({
    id: departure.id,
    startDate: departure.startDate.toISOString(),
    endDate: departure.endDate.toISOString(),
    totalSpots: departure.totalSpots,
    availableSpots: departure.availableSpots,
    status: departure.status,
    notes: departure.notes,
  }));
  const nextAvailableDeparture =
    departures.find((departure) => departure.status !== 'cancelled' && departure.availableSpots > 0) ??
    null;

  const videoEmbed = journey.videoUrl ? toEmbedUrl(journey.videoUrl) : null;
  const premiumLabel = t('jornadas.badge.premium');
  const categoryBadge =
    journey.category === 'premium' ? premiumLabel : journey.category.toUpperCase();

  const tripJsonLd = touristTripJsonLd({
    name: title,
    description: concept ?? subtitle ?? t('coreia.jornadas.seoDescription'),
    path: `/coreia-do-sul/jornadas/${journey.slug}`,
    locale,
    image: allImages.length ? allImages : undefined,
    durationDays: journey.durationDays,
    price: journey.pricePerPerson,
    priceCurrency: journey.priceCurrency,
    touristType: 'Leisure travelers',
    ...(nextAvailableDeparture ? { departureDate: nextAvailableDeparture.startDate } : {}),
    ...(destinations.length
      ? { itinerary: destinations.map((name) => ({ name, path: '/destinos' })) }
      : {}),
  });

  const dateFormat: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <JsonLd id="jornada-trip-jsonld" data={tripJsonLd} />

      <Header />

      <main className="flex-1 w-full pb-32 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 pb-2">
          <Breadcrumbs
            locale={locale}
            items={[
              { name: t('coreia.coreia-do-sul'), path: '/coreia-do-sul' },
              { name: t('jornadas.groups.subtitle'), path: '/coreia-do-sul/jornadas' },
              { name: title, path: `/coreia-do-sul/jornadas/${journey.slug}` },
            ]}
          />
          <Link
            href={lp('/coreia-do-sul/jornadas')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors mt-4"
          >
            <ChevronLeft aria-hidden className="h-4 w-4" />
            <span>{t('jornadas.voltar-para-jornadas')}</span>
          </Link>
        </div>

        {/* HERO IMAGE (LCP) */}
        <section
          aria-labelledby="jornada-hero-title"
          className="relative h-[60vh] min-h-[420px] w-full overflow-hidden mt-4 mx-auto max-w-7xl px-4 md:px-8"
        >
          <div className="relative w-full h-full rounded-3xl overflow-hidden">
            <SmartImage
              src={heroImage}
              alt={title}
              fill
              className="object-cover"
              sizes="(min-width: 1280px) 1216px, 100vw"
              priority
              quality={75}
              placeholderLabel={title}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
              <div className="max-w-3xl text-white">
                {journey.category && (
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border shadow-sm inline-block mb-4 ${
                      journey.category === 'army'
                        ? 'bg-purple-600/90 text-white border-purple-500/30'
                        : 'bg-primary/90 text-white border-primary/30'
                    }`}
                  >
                    {categoryBadge}
                  </span>
                )}
                <h1
                  id="jornada-hero-title"
                  className="font-heading text-4xl sm:text-5xl lg:text-6xl font-light tracking-wide leading-tight"
                >
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm sm:text-base text-white/80 mt-3 max-w-2xl font-light leading-relaxed">
                    {subtitle}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-4 mt-5 text-xs text-white/70">
                  {destinations.length > 0 && (
                    <span className="flex items-center gap-1.5">
                      <MapPin aria-hidden className="h-4 w-4 shrink-0 text-accent" />
                      {destinations.join(', ')}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Clock aria-hidden className="h-4 w-4 shrink-0 text-accent" />
                    {formatNumber(journey.durationDays)} {t('jornadas.detail.days-x')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CONTENT GRID */}
        <section className="max-w-7xl mx-auto px-4 md:px-8 mt-10 grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
          {/* LEFT CONTENT */}
          <div className="lg:col-span-2 space-y-12">
            {concept && (
              <section aria-labelledby="jornada-concept-title">
                <h2
                  id="jornada-concept-title"
                  className="font-heading text-2xl font-light text-secondary mb-4"
                >
                  {t('jornadas.detail.concept')}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{concept}</p>
              </section>
            )}

            {/* Datas e saídas — degrada com elegância quando `JourneyDeparture` está vazio */}
            <section aria-labelledby="jornada-departures-title">
              <h2
                id="jornada-departures-title"
                className="font-heading text-2xl font-light text-secondary mb-4"
              >
                {t('jornadas.detail.datesAndDepartures')}
              </h2>
              {departures.length === 0 ? (
                <div className="bg-muted/40 border border-dashed border-border rounded-2xl px-5 py-8 text-center">
                  <Calendar aria-hidden className="h-6 w-6 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-heading text-lg font-light text-secondary">
                    {t('coreia.jornadas.departuresEmptyTitle')}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-2 max-w-lg mx-auto leading-relaxed">
                    {t('coreia.jornadas.departuresEmptyDescription')}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <caption className="sr-only">
                      {t('jornadas.detail.datesAndDepartures')} — {title}
                    </caption>
                    <thead>
                      <tr className="border-b border-border">
                        <th scope="col" className="text-left font-bold text-secondary py-3 pr-4 uppercase tracking-wider">
                          {t('jornadas.data-inicial')}
                        </th>
                        <th scope="col" className="text-left font-bold text-secondary py-3 pr-4 uppercase tracking-wider">
                          {t('jornadas.data-final')}
                        </th>
                        <th scope="col" className="text-left font-bold text-secondary py-3 pr-4 uppercase tracking-wider">
                          {t('jornadas.detail.totalSpots')}
                        </th>
                        <th scope="col" className="text-left font-bold text-secondary py-3 pr-4 uppercase tracking-wider">
                          {t('coreia.jornadas.availableSpotsShort')}
                        </th>
                        <th scope="col" className="text-left font-bold text-secondary py-3 pr-4 uppercase tracking-wider">
                          {t('jornadas.status')}
                        </th>
                        <th scope="col" className="text-left font-bold text-secondary py-3 uppercase tracking-wider">
                          {t('coreia.jornadas.notesShort')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {departures.map((departure) => (
                        <tr key={departure.id} className="border-b border-border/50">
                          <td className="py-3 pr-4 text-muted-foreground">
                            {formatDate(departure.startDate, dateFormat)}
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground">
                            {formatDate(departure.endDate, dateFormat)}
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground">
                            {formatNumber(departure.totalSpots)}
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground">
                            {formatNumber(departure.availableSpots)}
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                                departure.status === 'sold_out'
                                  ? 'bg-red-50 text-red-700'
                                  : departure.status === 'cancelled'
                                    ? 'bg-muted text-muted-foreground'
                                    : 'bg-green-50 text-green-700'
                              }`}
                            >
                              {departure.status === 'sold_out'
                                ? t('jornadas.esgotada')
                                : departure.status === 'cancelled'
                                  ? t('jornadas.status')
                                  : t('jornadas.disponivel')}
                            </span>
                          </td>
                          <td className="py-3 text-muted-foreground">{departure.notes ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Destaques */}
            {highlights.length > 0 && (
              <section aria-labelledby="jornada-highlights-title">
                <h2
                  id="jornada-highlights-title"
                  className="font-heading text-2xl font-light text-secondary mb-6"
                >
                  {t('jornadas.detail.highlights')}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {highlights.map((highlight) => (
                    <article
                      key={highlight.title}
                      className="bg-card border border-border rounded-2xl overflow-hidden group"
                    >
                      {highlight.image && (
                        <div className="relative aspect-video w-full overflow-hidden">
                          <SmartImage
                            src={highlight.image}
                            alt={highlight.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(min-width: 640px) 40vw, 100vw"
                            quality={75}
                            placeholderLabel={highlight.title}
                          />
                        </div>
                      )}
                      <div className="p-5">
                        <h3 className="font-heading text-base font-bold text-secondary">
                          {highlight.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                          {highlight.description}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* Roteiro */}
            {itinerary.length > 0 && (
              <section aria-labelledby="jornada-itinerary-title">
                <h2
                  id="jornada-itinerary-title"
                  className="font-heading text-2xl font-light text-secondary mb-6"
                >
                  {t('jornadas.roteiro')}
                </h2>
                <div className="space-y-0">
                  {itinerary.map((day, index) => (
                    <div
                      key={`${day.day}-${day.title}`}
                      className="flex gap-5 pb-8 relative"
                    >
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-primary">
                            {String(day.day).padStart(2, '0')}
                          </span>
                        </div>
                        {index < itinerary.length - 1 && (
                          <div aria-hidden className="w-px flex-1 bg-border mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pt-1.5">
                        <h3 className="font-heading text-lg font-bold text-secondary">{day.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                          {day.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Inclusões */}
            {included.length > 0 && (
              <section aria-labelledby="jornada-included-title">
                <h2
                  id="jornada-included-title"
                  className="font-heading text-2xl font-light text-secondary mb-4"
                >
                  {t('jornadas.inclusoes')}
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

            {/* Não inclusões */}
            {notIncluded.length > 0 && (
              <section aria-labelledby="jornada-not-included-title">
                <h2
                  id="jornada-not-included-title"
                  className="font-heading text-2xl font-light text-secondary mb-4"
                >
                  {t('jornadas.nao-inclusoes')}
                </h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {notIncluded.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-50">
                        <X aria-hidden className="h-3 w-3 text-red-500" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Galeria */}
            {allImages.length > 1 && (
              <section aria-labelledby="jornada-gallery-title">
                <h2
                  id="jornada-gallery-title"
                  className="font-heading text-2xl font-light text-secondary mb-4"
                >
                  {t('jornadas.galeria')}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {allImages.slice(0, 6).map((image, index) => (
                    <div
                      key={image}
                      className={`relative overflow-hidden rounded-xl ${index === 0 ? 'col-span-2 row-span-2' : ''}`}
                    >
                      <div className={`relative ${index === 0 ? 'aspect-[4/3]' : 'aspect-square'}`}>
                        <SmartImage
                          src={image}
                          alt={fill(t('detalhe.booking.galleryImageAlt'), { item: title })}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-500"
                          sizes={index === 0 ? '(min-width: 768px) 66vw, 100vw' : '(min-width: 768px) 33vw, 50vw'}
                          quality={75}
                          placeholderLabel={title}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Vídeo */}
            <section aria-labelledby="jornada-video-title">
              <h2
                id="jornada-video-title"
                className="font-heading text-2xl font-light text-secondary mb-4"
              >
                {t('jornadas.video')}
              </h2>
              {videoEmbed ? (
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-black">
                  <iframe
                    src={videoEmbed}
                    title={t('jornadas.jornada-em-video')}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-muted flex flex-col items-center justify-center gap-4 border border-dashed border-border">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <svg aria-hidden className="h-7 w-7 text-primary ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">
                    {t('jornadas.detail.videoComingSoon')}
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* RIGHT SIDEBAR — Booking Widget (client) */}
          <div className="lg:col-span-1">
            <JornadaBookingWidget
              journeyTitle={title}
              journeySlug={journey.slug}
              pricePerPerson={journey.pricePerPerson}
              priceCurrency={journey.priceCurrency}
              nextAvailableDeparture={nextAvailableDeparture}
            />
          </div>
        </section>
      </main>

      <Footer />

      {/* Resumo em texto para leitores de tela / sem JS do bloco de reservas. */}
      <p className="sr-only">
        {formatCurrency(journey.pricePerPerson, journey.priceCurrency)}
        {t('coreia.landing.perPerson')} —{' '}
        {nextAvailableDeparture
          ? formatDate(nextAvailableDeparture.startDate, {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })
          : t('coreia.jornadas.departuresEmptyTitle')}
        {nextAvailableDeparture && (
          <>
            {' · '}
            {formatNumber(nextAvailableDeparture.availableSpots)}{' '}
            {t('jornadas.vagas-disponiveis')}
          </>
        )}
      </p>
    </div>
  );
}
