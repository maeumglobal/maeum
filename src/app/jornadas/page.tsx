import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  MapPin,
  Star,
  TreePine,
  Users,
  type LucideIcon,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SmartImage from '@/components/SmartImage';
import JsonLd from '@/components/seo/JsonLd';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import { prisma } from '@/lib/prisma';
import { getMediaMap } from '@/lib/cmsData';
import { getServerI18n } from '@/lib/serverI18n';
import { parseStringArray } from '@/lib/validate';
import { buildMetadata, localizedUrl, truncateMeta } from '@/lib/seo';
import JourneyExplorer, { type JourneyCard } from './_components/JourneyExplorer';
import NewsletterForm from './_components/NewsletterForm';

/* ────────────────────────────────────────────────────────────────────────────
 * SEO
 * ────────────────────────────────────────────────────────────────────────── */

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getServerI18n();
  return buildMetadata({
    title: truncateMeta(t('jornadas.seo.title'), 60),
    description: t('jornadas.seo.description'),
    path: '/jornadas',
    locale,
    image: '/images/agencia-viagens-coreia-do-sul-maeum-global-oficial.webp',
    imageAlt: t('jornadas.heroImage.desktop'),
  });
}

/* ────────────────────────────────────────────────────────────────────────────
 * Helpers
 * ────────────────────────────────────────────────────────────────────────── */

/** `Journey.category` → chave canônica do rótulo. */
const JOURNEY_CATEGORY_KEYS: Record<string, string> = {
  army: 'jornadas.card.category.army',
  premium: 'jornadas.card.category.premium',
  essence: 'jornadas.card.category.essence',
  luxury: 'jornadas.card.category.luxury',
};

/** Slots de imagem da listagem, reciclados quando o registro não tem `mainImage`. */
const CARD_SLOTS = [
  'jornadas_recente_1',
  'jornadas_recente_2',
  'jornadas_recente_3',
  'jornadas_recente_4',
  'jornadas_recente_5',
  'jornadas_recente_6',
  'jornadas_recente_7',
  'jornadas_recente_8',
] as const;

const FEATURES: readonly { key: string; Icon: LucideIcon }[] = [
  { key: 'jornadas.features.1title', Icon: Star },
  { key: 'jornadas.features.2title', Icon: MapPin },
  { key: 'jornadas.features.3title', Icon: Users },
  { key: 'jornadas.features.4title', Icon: TreePine },
  { key: 'jornadas.features.5title', Icon: BookOpen },
  { key: 'jornadas.features.6title', Icon: Star },
];

const normalize = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

/* ────────────────────────────────────────────────────────────────────────────
 * Página
 * ────────────────────────────────────────────────────────────────────────── */

export default async function JornadasPage() {
  const { t, locale, lp, fill, formatCurrency, formatDate, formatNumber, localizedField } =
    await getServerI18n();

  const [journeys, media] = await Promise.all([
    prisma.journey.findMany({
      where: { status: 'active' },
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
      take: 24,
      select: {
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
        category: true,
        destinations: true,
        durationDays: true,
        totalSpots: true,
        pricePerPerson: true,
        priceCurrency: true,
        mainImage: true,
        isFeatured: true,
        updatedAt: true,
        departures: {
          take: 3,
          orderBy: { startDate: 'asc' },
          select: { id: true, startDate: true, endDate: true, availableSpots: true, status: true },
        },
      },
    }),
    getMediaMap().catch(() => ({}) as Record<string, string>),
  ]);

  const cards: JourneyCard[] = journeys.map((journey, index) => {
    const title =
      localizedField({ pt: journey.title, en: journey.titleEn, es: journey.titleEs }) ?? journey.title;
    const subtitle =
      localizedField({ pt: journey.subtitle, en: journey.subtitleEn, es: journey.subtitleEs }) ??
      localizedField({ pt: journey.concept, en: journey.conceptEn, es: journey.conceptEs }) ??
      '';
    const cities = parseStringArray(journey.destinations, 12);
    const next = journey.departures.find((departure) => departure.status !== 'cancelled') ?? null;

    return {
      id: journey.id,
      title,
      subtitle,
      tag: JOURNEY_CATEGORY_KEYS[journey.category] ? t(JOURNEY_CATEGORY_KEYS[journey.category]!) : '',
      isFeatured: journey.isFeatured,
      days: journey.durationDays,
      spots: next?.availableSpots ?? 0,
      totalSpots: journey.totalSpots,
      price: journey.pricePerPerson,
      priceLabel: formatCurrency(journey.pricePerPerson, journey.priceCurrency, {
        maximumFractionDigits: 0,
      }),
      departureLabel: next
        ? `${t('jornadas.card.departureLabel')}: ${formatDate(next.startDate, {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}`
        : null,
      image: journey.mainImage ?? '',
      fallbackImage: media[CARD_SLOTS[index % CARD_SLOTS.length]!] ?? '',
      url: lp(`/coreia-do-sul/jornadas/${journey.slug}`),
      cities,
      searchText: normalize([title, subtitle, ...cities, journey.category].join(' ')),
    };
  });

  const featured = cards.find((card) => card.isFeatured) ?? cards[0] ?? null;

  /* ── JSON-LD: ItemList de jornadas como TouristTrip ────────────────────── */

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t('jornadas.list.sectionTitle'),
    numberOfItems: cards.length,
    itemListElement: cards.map((card, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'TouristTrip',
        name: card.title,
        description: truncateMeta(card.subtitle || card.title, 300),
        url: localizedUrl(`/coreia-do-sul/jornadas/${journeys[index]?.slug ?? ''}`, locale),
        touristType: 'Leisure travelers',
        ...(card.days > 0 ? { duration: `P${card.days}D` } : {}),
        ...(card.price > 0
          ? {
              offers: {
                '@type': 'Offer',
                price: card.price.toFixed(2),
                priceCurrency: journeys[index]?.priceCurrency || 'BRL',
                availability: 'https://schema.org/InStock',
              },
            }
          : {}),
      },
    })),
  };

  const filters = [
    { id: 'all', label: t('jornadas.filter.all') },
    { id: 'seoul', label: t('jornadas.filter.seoul') },
    { id: 'busan', label: t('jornadas.filter.busan') },
    { id: 'daegu', label: t('jornadas.filter.daegu') },
    { id: 'jeju', label: t('jornadas.filter.jeju') },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#0F0A08] text-[#EFEBE4] font-sans selection:bg-[#C8A27C] selection:text-[#0F0A08]">
      <JsonLd id="jornadas-itemlist-jsonld" data={itemListJsonLd} />

      <Header />

      {/* ── 1. Hero (LCP) ─────────────────────────────────────────────────── */}
      <section
        aria-labelledby="jornadas-hero-title"
        className="relative min-h-[100dvh] flex flex-col justify-center overflow-hidden border-b border-[#3D2620]"
      >
        <div className="absolute inset-0 z-0">
          <SmartImage
            src={media.jornadas_hero_desktop}
            alt={t('jornadas.heroImage.desktop')}
            fill
            className="object-cover object-center brightness-75 hidden md:block"
            sizes="100vw"
            priority
            quality={90}
            fallbackSrc={media.jornadas_hero_mobile}
            placeholderLabel={t('jornadas.heroImage.desktop')}
          />
          <SmartImage
            src={media.jornadas_hero_mobile}
            alt={t('jornadas.heroImage.mobile')}
            fill
            className="object-cover object-center brightness-75 block md:hidden"
            sizes="100vw"
            priority
            quality={90}
            fallbackSrc={media.jornadas_hero_desktop}
            placeholderLabel={t('jornadas.heroImage.mobile')}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F0A08] via-[#0F0A08]/90 to-transparent w-full sm:w-2/3" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0F0A08]/20 to-[#0F0A08]" />
        </div>

        <div className="relative z-10 px-6 sm:px-12 max-w-7xl mx-auto w-full flex flex-col items-start gap-5 pt-20">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold">
            {t('jornadas.hero.kicker')}
          </span>
          <h1
            id="jornadas-hero-title"
            className="font-heading text-5xl sm:text-6xl md:text-[70px] font-light tracking-wide leading-[1.1] text-white"
          >
            {t('jornadas.hero.line1')}
            <br />
            {t('jornadas.hero.line2')}
            <br />
            <span className="italic text-[#C8A27C]">{t('jornadas.hero.line3')}</span>
          </h1>
          <p className="text-[12px] sm:text-[13px] text-gray-300 max-w-[500px] font-light text-left leading-relaxed opacity-90 mt-2">
            {t('jornadas.hero.description')}
          </p>
          <div className="mt-4">
            <Link
              href={lp('/contato')}
              className="flex items-center justify-center gap-3 bg-transparent border border-[#3D2620] hover:border-[#C8A27C] text-[#C8A27C] font-bold text-[10px] py-4 px-8 transition-all group uppercase tracking-widest w-fit"
            >
              {t('jornadas.cta.shareJourney')}
              <ArrowRight aria-hidden className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      <div className="px-6 sm:px-12 max-w-[1400px] mx-auto w-full pt-8">
        <Breadcrumbs
          locale={locale}
          items={[{ name: t('jornadas.list.breadcrumb'), path: '/jornadas' }]}
          className="text-gray-500"
        />
      </div>

      {/* ── 2. Listagem + sidebar ──────────────────────────────────────────── */}
      <section className="py-16 px-6 sm:px-12 max-w-[1400px] mx-auto w-full">
        <div className="flex flex-col xl:flex-row gap-10">
          <div className="flex-1 flex flex-col gap-8">
            <div className="text-center">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-bold block">
                {t('jornadas.list.sectionKicker')}
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl font-light text-white mt-2">
                {t('jornadas.list.sectionTitle')}
              </h2>
              <p className="text-[12px] text-gray-400 mt-3 font-light max-w-xl mx-auto">
                {t('jornadas.list.sectionDescription')}
              </p>
            </div>

            {cards.length === 0 ? (
              <div className="border border-[#3D2620] bg-[#150E0C] rounded-sm py-16 px-6 text-center">
                <MapPin aria-hidden className="w-10 h-10 mx-auto text-[#C8A27C] mb-4" />
                <h3 className="font-heading text-xl font-light text-white">
                  {t('jornadas.groups.emptyTitle')}
                </h3>
                <p className="text-xs text-gray-400 mt-2">{t('jornadas.groups.emptyDescription')}</p>
                <Link
                  href={lp('/contato')}
                  className="inline-flex items-center gap-2 mt-6 text-[10px] font-bold uppercase tracking-widest text-[#C8A27C] hover:underline"
                >
                  {t('jornadas.list.allJourneysLink')}
                  <ArrowRight aria-hidden className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <>
                <JourneyExplorer
                  journeys={cards}
                  filters={filters}
                  countTemplate={t('jornadas.filter.resultsTemplate')}
                  countLabelOne={t('jornadas.filter.resultsTemplateOne')}
                  emptyTitle={t('jornadas.filter.emptyTitle')}
                  emptyDescription={t('jornadas.filter.emptyDescription')}
                  searchLabel={t('jornadas.filter.label')}
                  searchPlaceholder={t('jornadas.list.searchPlaceholder')}
                  clearLabel={t('jornadas.filter.clear')}
                  ctaLabel={t('jornadas.card.ctaDetail')}
                  featuredBadge={t('jornadas.card.badgeFeatured')}
                  daysTemplate={t('jornadas.card.daysTemplate')}
                  spotsTemplate={t('jornadas.card.spotsTemplate')}
                  priceFromLabel={t('jornadas.card.priceFrom')}
                  priceOnRequestLabel={t('jornadas.card.priceOnRequest')}
                />

                <div className="flex justify-center mt-2">
                  <Link
                    href={lp('/coreia-do-sul/jornadas')}
                    className="flex items-center justify-center gap-3 bg-transparent border border-[#3D2620] hover:border-[#C8A27C] text-[#C8A27C] font-bold text-[10px] py-4 px-8 transition-all group uppercase tracking-widest"
                  >
                    {t('jornadas.list.seeMore')}
                    <ArrowRight aria-hidden className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Sidebar */}
          <aside className="w-full lg:w-[320px] shrink-0 flex flex-col gap-10">
            <div className="flex flex-col gap-4">
              <h2 className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-bold">
                {t('jornadas.newsletter.kicker')}
              </h2>
              <p className="text-[12px] text-gray-400 font-light">{t('jornadas.newsletter.description')}</p>
              <NewsletterForm />
              <p className="text-[9px] text-gray-500 mt-1">{t('jornadas.newsletter.privacyNote')}</p>
            </div>

            <div className="flex flex-col gap-4 pt-4 border-t border-[#3D2620]">
              <h2 className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-bold">
                {t('jornadas.featured.kicker')}
              </h2>
              {featured ? (
                <article className="group">
                  <div className="relative h-[160px] w-full overflow-hidden border border-[#3D2620] mb-4">
                    <SmartImage
                      src={featured.image}
                      alt={featured.title}
                      fill
                      sizes="320px"
                      quality={75}
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      fallbackSrc={featured.fallbackImage || undefined}
                      placeholderLabel={featured.title}
                    />
                  </div>
                  <h3 className="text-white font-heading text-xl font-light mb-2 group-hover:text-[#C8A27C] transition-colors">
                    <Link href={featured.url}>{featured.title}</Link>
                  </h3>
                  {featured.subtitle ? (
                    <p className="text-[12px] text-gray-400 font-light mb-3 line-clamp-3">
                      {featured.subtitle}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] text-gray-500 font-semibold uppercase tracking-widest mb-3">
                    {featured.days > 0 ? (
                      <span>{fill(t('jornadas.card.daysTemplate'), { n: formatNumber(featured.days) })}</span>
                    ) : null}
                    {featured.cities.length > 0 ? <span>{featured.cities.join(' + ')}</span> : null}
                  </div>
                  <Link
                    href={featured.url}
                    className="flex items-center gap-2 text-[#C8A27C] text-[10px] font-bold uppercase tracking-widest hover:underline"
                  >
                    {t('jornadas.featured.cta')}
                    <ArrowRight aria-hidden className="h-3 w-3" />
                  </Link>
                </article>
              ) : (
                <div className="border border-[#3D2620] bg-[#150E0C] rounded-sm p-6 text-center">
                  <Star aria-hidden className="w-8 h-8 mx-auto text-[#C8A27C] mb-3" />
                  <p className="font-heading text-base font-light text-white">
                    {t('jornadas.list.featuredFallbackTitle')}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-2">{t('jornadas.list.featuredFallbackDescription')}</p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>

      {/* ── 3. CTA final ───────────────────────────────────────────────────── */}
      <section className="py-12 px-6 sm:px-12 max-w-[1400px] mx-auto w-full">
        <div className="relative w-full border border-[#3D2620] overflow-hidden rounded-sm flex flex-col md:flex-row bg-[#150E0C]">
          <div className="relative w-full md:w-[45%] min-h-[300px] md:min-h-full">
            <SmartImage
              src={media.jornadas_cta_banner}
              alt={t('jornadas.pessoas-em-seul')}
              fill
              sizes="(min-width: 768px) 45vw, 100vw"
              quality={75}
              placeholderLabel={t('jornadas.pessoas-em-seul')}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#150E0C]" />
          </div>

          <div className="w-full md:w-[55%] flex flex-col items-start justify-center text-left p-10 md:p-16 gap-6 relative z-10">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-bold">
              {t('jornadas.share.kicker')}
            </span>
            <h2 className="font-heading text-4xl sm:text-5xl font-light text-white leading-[1.1]">
              {t('jornadas.share.line1')} <br className="hidden lg:block" />
              <span className="italic text-[#C8A27C]">{t('jornadas.share.line2')}</span>
            </h2>
            <p className="text-[13px] text-gray-400 font-light max-w-lg leading-relaxed">
              {t('jornadas.share.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-2 w-full sm:w-auto">
              <Link
                href={lp('/contato')}
                className="flex items-center justify-center bg-[#C8A27C] hover:bg-[#B8906C] text-[#0F0A08] font-bold text-[10px] py-4 px-8 transition-all uppercase tracking-widest w-full sm:w-auto"
              >
                {t('jornadas.share.cta')}
              </Link>
              <Link
                href={lp('/contato')}
                className="flex items-center justify-center bg-transparent border border-[#C8A27C]/30 hover:border-[#C8A27C] text-[#C8A27C] font-bold text-[10px] py-4 px-8 transition-all uppercase tracking-widest w-full sm:w-auto"
              >
                {t('jornadas.share.ctaSecondary')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Faixa de diferenciais ───────────────────────────────────────── */}
      <section
        aria-label={t('jornadas.list.sectionKicker')}
        className="bg-[#150E0C] border-t border-b border-[#3D2620] py-8 px-6"
      >
        <ul className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-6 opacity-60">
          {FEATURES.map(({ key, Icon }) => (
            <li key={key} className="flex items-center gap-3 text-white">
              <Icon aria-hidden className="h-5 w-5 text-[#C8A27C]" strokeWidth={1.5} />
              <span className="text-[9px] font-bold uppercase tracking-widest">{t(key)}</span>
            </li>
          ))}
        </ul>
      </section>

      <Footer />
    </div>
  );
}
