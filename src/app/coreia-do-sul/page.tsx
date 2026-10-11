import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Calendar,
  Compass,
  GraduationCap,
  MapPin,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TripPlanner from '@/components/TripPlanner';
import SmartImage from '@/components/SmartImage';
import JsonLd from '@/components/seo/JsonLd';
import { prisma } from '@/lib/prisma';
import { getMediaMap } from '@/lib/cmsData';
import { getServerI18n } from '@/lib/serverI18n';
import { buildMetadata, localizedUrl, siteUrl, truncateMeta } from '@/lib/seo';

/* ────────────────────────────────────────────────────────────────────────────
 * SEO
 * ────────────────────────────────────────────────────────────────────────── */

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getServerI18n();
  return buildMetadata({
    title: truncateMeta(t('coreia.landing.pageTitle'), 60),
    description: t('coreia.landing.seoDescription'),
    path: '/coreia-do-sul',
    locale,
    image: '/images/agencia-viagens-coreia-do-sul-maeum-global-oficial.webp',
    imageAlt: t('coreia.landing.heroAlt'),
  });
}

/* ────────────────────────────────────────────────────────────────────────────
 * Conteúdo curado do hub
 *
 * Nenhum texto editorial hardcoded: cada card guarda a CHAVE canônica do i18n.
 * As imagens vêm dos slots do CMS (`getMediaMap`), com o fallback declarado em
 * `src/lib/mediaSlots.ts`.
 * ────────────────────────────────────────────────────────────────────────── */

interface Pillar {
  id: string;
  titleKey: string;
  tagKey: string;
  descriptionKey: string;
  href: string;
  slot: string;
  Icon: LucideIcon;
}

const PILLARS: readonly Pillar[] = [
  {
    id: 'experiencias',
    titleKey: 'coreia.landing.pillar1Title',
    tagKey: 'coreia.landing.pillar1Tag',
    descriptionKey: 'coreia.landing.pillar1Description',
    href: '/coreia-do-sul/experiencias',
    slot: 'coreia_card_1',
    Icon: Compass,
  },
  {
    id: 'k-beauty',
    titleKey: 'coreia.landing.pillar2Title',
    tagKey: 'coreia.landing.pillar2Tag',
    descriptionKey: 'coreia.landing.pillar2Description',
    href: '/coreia-do-sul/k-beauty',
    slot: 'coreia_card_2',
    Icon: Sparkles,
  },
  {
    id: 'intercambio',
    titleKey: 'coreia.landing.pillar3Title',
    tagKey: 'coreia.landing.pillar3Tag',
    descriptionKey: 'coreia.landing.pillar3Description',
    href: '/coreia-do-sul/intercambio',
    slot: 'coreia_card_3',
    Icon: GraduationCap,
  },
  {
    id: 'jornadas',
    titleKey: 'coreia.landing.pillar4Title',
    tagKey: 'coreia.landing.pillar4Tag',
    descriptionKey: 'coreia.landing.pillar4Description',
    href: '/coreia-do-sul/jornadas',
    slot: 'coreia_card_4',
    Icon: Users,
  },
];

interface RegionProfile {
  id: string;
  nameKey: string;
  tagKey: string;
  descriptionKey: string;
  highlightKeys: readonly string[];
  imageSlot: string;
}

const REGION_PROFILES: readonly RegionProfile[] = [
  {
    id: 'seoul',
    nameKey: 'coreia.landing.regionSeoul',
    tagKey: 'coreia.landing.seoulTag',
    descriptionKey: 'coreia.landing.seoulDescription',
    highlightKeys: [
      'coreia.landing.seoulHighlight1',
      'coreia.landing.seoulHighlight2',
      'coreia.landing.seoulHighlight3',
      'coreia.landing.seoulHighlight4',
    ],
    imageSlot: 'coreia_card_1',
  },
  {
    id: 'busan',
    nameKey: 'coreia.landing.regionBusan',
    tagKey: 'coreia.landing.busanTag',
    descriptionKey: 'coreia.landing.busanDescription',
    highlightKeys: [
      'coreia.landing.busanHighlight1',
      'coreia.landing.busanHighlight2',
      'coreia.landing.busanHighlight3',
      'coreia.landing.busanHighlight4',
    ],
    imageSlot: 'coreia_card_4',
  },
  {
    id: 'gyeongju',
    nameKey: 'coreia.landing.regionGyeongjuDaegu',
    tagKey: 'coreia.landing.gyeongjuTag',
    descriptionKey: 'coreia.landing.gyeongjuDescription',
    highlightKeys: [
      'coreia.landing.gyeongjuHighlight1',
      'coreia.landing.gyeongjuHighlight2',
      'coreia.landing.gyeongjuHighlight3',
      'coreia.landing.gyeongjuHighlight4',
    ],
    imageSlot: 'coreia_card_3',
  },
  {
    id: 'jeju',
    nameKey: 'coreia.landing.regionJeju',
    tagKey: 'coreia.landing.jejuTag',
    descriptionKey: 'coreia.landing.jejuDescription',
    highlightKeys: [
      'coreia.landing.jejuHighlight1',
      'coreia.landing.jejuHighlight2',
      'coreia.landing.jejuHighlight3',
      'coreia.landing.jejuHighlight4',
    ],
    imageSlot: 'coreia_card_2',
  },
];

/** Casa um `Destination` do banco com um perfil curado ("Seul" ~ "seoul"). */
const normalize = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');

const matchProfile = (values: readonly (string | null)[]): RegionProfile | null => {
  const haystack = values
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .map(normalize)
    .join(' ');
  if (!haystack) return null;
  return (
    REGION_PROFILES.find((profile) => haystack.includes(profile.id)) ??
    REGION_PROFILES.find((profile) => haystack.includes(`${profile.id}e`)) ??
    null
  );
};

/* ────────────────────────────────────────────────────────────────────────────
 * Página
 * ────────────────────────────────────────────────────────────────────────── */

export default async function CoreiaDoSulPage() {
  const { t, locale, lp, formatNumber, formatCurrency, localizedField } = await getServerI18n();

  const [journeys, experiences, destinations, media] = await Promise.all([
    prisma.journey
      .findMany({
        where: { status: { in: ['active', 'soldout'] } },
        orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
        take: 3,
        select: {
          id: true,
          slug: true,
          title: true,
          titleEn: true,
          titleEs: true,
          subtitle: true,
          subtitleEn: true,
          subtitleEs: true,
          destinations: true,
          durationDays: true,
          pricePerPerson: true,
          priceCurrency: true,
          mainImage: true,
          departures: {
            where: { status: { in: ['available', 'limited'] } },
            orderBy: { startDate: 'asc' },
            take: 1,
            select: { id: true, startDate: true, availableSpots: true },
          },
        },
      })
      .catch((error: unknown) => {
        console.error('[coreia-do-sul] falha ao ler jornadas:', error);
        return [];
      }),
    prisma.experience
      .findMany({
        where: { status: 'active' },
        orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
        take: 4,
        select: {
          id: true,
          slug: true,
          title: true,
          titleEn: true,
          titleEs: true,
          subtitle: true,
          subtitleEn: true,
          subtitleEs: true,
          location: true,
          durationHours: true,
          pricePerPerson: true,
          priceCurrency: true,
          mainImage: true,
        },
      })
      .catch((error: unknown) => {
        console.error('[coreia-do-sul] falha ao ler experiências:', error);
        return [];
      }),
    prisma.destination
      .findMany({
        where: { isFeatured: true },
        orderBy: { sortOrder: 'asc' },
        take: 12,
        select: { id: true, slug: true, name: true, subtitle: true, mainImage: true },
      })
      .catch((error: unknown) => {
        console.error('[coreia-do-sul] falha ao ler destinos:', error);
        return [];
      }),
    getMediaMap().catch(() => ({}) as Record<string, string>),
  ]);

  const heroDesktop = media.coreia_hero_desktop ?? '';
  const heroMobile = media.coreia_hero_mobile ?? '';
  const journeyFallback = media.coreia_jornadas_fallback ?? '';
  const experienceFallback = media.coreia_experiencias_fallback ?? '';
  const destinationFallback = media.destinos_card_fallback ?? '';

  /**
   * Regiões: o nome vem do `Destination` do banco quando existe (dado real);
   * o texto editorial (tag, descrição e destaques) é o curado do i18n. Quando o
   * banco não tem nenhum destino, os quatro perfis curados aparecem sozinhos.
   */
  const regionRows = REGION_PROFILES.map((profile) => {
    const match = destinations.find(
      (destination) => matchProfile([destination.name, destination.slug])?.id === profile.id,
    );
    return {
      profile,
      name: match?.name ?? t(profile.nameKey),
      subtitle: match?.subtitle ?? null,
      image: match?.mainImage ?? media[profile.imageSlot] ?? destinationFallback,
    };
  });

  /* ── JSON-LD: TouristDestination + ItemList ────────────────────────────── */
  const destinationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TouristDestination',
    '@id': `${localizedUrl('/coreia-do-sul', locale)}#destination`,
    name: t('coreia.landing.heroLine2'),
    description: truncateMeta(t('coreia.landing.seoDescription'), 300),
    url: localizedUrl('/coreia-do-sul', locale),
    image: siteUrl(heroDesktop || heroMobile),
    ...(heroDesktop ? { thumbnailUrl: siteUrl(heroDesktop) } : {}),
    touristType: ['Leisure travelers', 'Families', 'Solo travellers', 'K-Pop and K-Beauty fans'],
    includesAttraction: [
      { '@type': 'TouristAttraction', name: t('coreia.landing.regionSeoul') },
      { '@type': 'TouristAttraction', name: t('coreia.landing.regionBusan') },
      { '@type': 'TouristAttraction', name: t('coreia.landing.regionGyeongjuDaegu') },
      { '@type': 'TouristAttraction', name: t('coreia.landing.regionJeju') },
    ],
  };

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t('coreia.landing.pageTitle'),
    numberOfItems: journeys.length + experiences.length,
    itemListElement: [
      ...journeys.map((journey, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'TouristTrip',
          name:
            localizedField({ pt: journey.title, en: journey.titleEn, es: journey.titleEs }) ??
            journey.title,
          url: localizedUrl(`/coreia-do-sul/jornadas/${journey.slug}`, locale),
          ...(journey.mainImage ? { image: siteUrl(journey.mainImage) } : {}),
        },
      })),
      ...experiences.map((experience, index) => ({
        '@type': 'ListItem',
        position: journeys.length + index + 1,
        item: {
          '@type': ['Product', 'Service'],
          name:
            localizedField({
              pt: experience.title,
              en: experience.titleEn,
              es: experience.titleEs,
            }) ?? experience.title,
          url: localizedUrl(`/coreia-do-sul/experiencias/${experience.slug}`, locale),
          ...(experience.mainImage ? { image: siteUrl(experience.mainImage) } : {}),
        },
      })),
    ],
  };

  const parseStringList = (value: string): string[] => {
    try {
      const parsed: unknown = JSON.parse(value || '[]');
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
    } catch {
      return [];
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0F0A08] text-[#EFEBE4] font-sans selection:bg-[#C8A27C] selection:text-[#0F0A08]">
      <JsonLd id="coreia-destination-jsonld" data={destinationJsonLd} />
      <JsonLd id="coreia-itemlist-jsonld" data={itemListJsonLd} />

      <Header />

      {/* 1. HERO SECTION (LCP) */}
      <section
        aria-labelledby="coreia-hero-title"
        className="relative min-h-[90vh] flex flex-col justify-center overflow-hidden border-b border-[#3D2620]"
      >
        <div className="absolute inset-0 z-0">
          <SmartImage
            src={heroDesktop}
            alt={t('coreia.landing.heroAlt')}
            fill
            className="object-cover object-center brightness-[0.75] hidden md:block"
            sizes="100vw"
            priority
            quality={75}
            fallbackSrc={heroMobile}
            placeholderLabel={t('coreia.landing.heroAlt')}
          />
          <SmartImage
            src={heroMobile}
            alt={t('coreia.landing.heroAlt')}
            fill
            className="object-cover object-center brightness-[0.75] block md:hidden"
            sizes="100vw"
            quality={75}
            fallbackSrc={heroDesktop}
            placeholderLabel={t('coreia.landing.heroAlt')}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0A08] via-[#0F0A08]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F0A08] via-[#0F0A08]/80 to-transparent w-full lg:w-2/3" />
        </div>

        <div className="relative z-10 px-6 sm:px-12 max-w-[1400px] mx-auto w-full flex flex-col items-start gap-6 pt-28 md:pt-40 pb-20">
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#C8A27C] font-semibold flex items-center gap-2">
            <span aria-hidden className="w-8 h-px bg-[#C8A27C]" />
            {t('coreia.landing.kicker')}
          </span>
          <h1
            id="coreia-hero-title"
            className="font-heading text-5xl sm:text-6xl md:text-[76px] font-light tracking-wide leading-[1.1] text-white max-w-4xl"
          >
            {t('coreia.coreia-do-sul')} <br />
            <span className="italic text-[#C8A27C]">{t('coreia.landing.heroLine2')}</span> <br />
            {t('coreia.landing.heroLine3')}
          </h1>
          <p className="text-[13px] sm:text-sm text-gray-300 max-w-2xl font-light leading-relaxed opacity-90">
            {t('coreia.landing.heroDescription')}
          </p>

          <div className="flex flex-wrap gap-4 mt-4">
            <Link
              href={lp('/coreia-do-sul/jornadas')}
              className="flex items-center justify-center gap-3 bg-[#C8A27C] hover:bg-[#B8906C] text-[#0F0A08] font-bold text-[10px] py-4 px-8 rounded-none transition-all uppercase tracking-widest group"
            >
              {t('coreia.landing.ctaJourneys')}
              <ArrowRight aria-hidden className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href={lp('/coreia-do-sul/experiencias')}
              className="flex items-center justify-center gap-3 bg-transparent border border-[#C8A27C] text-[#C8A27C] hover:bg-[#C8A27C]/10 font-bold text-[10px] py-4 px-8 rounded-none transition-all uppercase tracking-widest"
            >
              <Compass aria-hidden className="w-4 h-4" />
              {t('coreia.landing.ctaExperiences')}
            </Link>
          </div>
        </div>
      </section>

      {/* 2. OS 4 PILARES DA MAEUM */}
      <section
        aria-labelledby="coreia-pillars-title"
        className="py-24 px-6 sm:px-12 max-w-[1400px] mx-auto w-full"
      >
        <div className="text-center mb-16 flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#C8A27C] font-semibold block mb-3">
            {t('coreia.landing.pillarsKicker')}
          </span>
          <h2
            id="coreia-pillars-title"
            className="font-heading text-3xl sm:text-4xl font-light text-white leading-tight"
          >
            {t('coreia.landing.pillarsTitle')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PILLARS.map((pilar) => (
            <Link
              key={pilar.id}
              href={lp(pilar.href)}
              className="group bg-[#150E0C] border border-[#3D2620] hover:border-[#C8A27C]/60 flex flex-col rounded-sm overflow-hidden transition-all duration-300"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden">
                <SmartImage
                  src={media[pilar.slot] ?? ''}
                  alt={t(pilar.titleKey)}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
                  quality={75}
                  placeholderLabel={t(pilar.titleKey)}
                />
                <div className="absolute top-3 left-3 bg-[#0F0A08]/80 backdrop-blur-sm text-[#C8A27C] text-[8px] font-bold tracking-widest px-2.5 py-1 rounded-sm uppercase border border-[#C8A27C]/30">
                  {t(pilar.tagKey)}
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-2 text-[#C8A27C] mb-2">
                  <pilar.Icon aria-hidden className="w-4 h-4" />
                  <span className="font-heading text-lg text-white font-medium group-hover:text-[#C8A27C] transition-colors">
                    {t(pilar.titleKey)}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 font-light leading-relaxed mb-6 flex-1">
                  {t(pilar.descriptionKey)}
                </p>
                <div className="pt-4 border-t border-[#3D2620] flex items-center justify-between text-[9px] font-bold text-[#C8A27C] uppercase tracking-widest group-hover:text-white transition-colors">
                  <span>{t('coreia.landing.explore')}</span>
                  <ArrowRight aria-hidden className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. JORNADAS EM DESTAQUE (Prisma) */}
      <section
        aria-labelledby="coreia-journeys-title"
        className="py-20 px-6 sm:px-12 max-w-[1400px] mx-auto w-full border-t border-[#3D2620]"
      >
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#C8A27C] font-semibold block mb-3">
              {t('coreia.landing.featuredJourneysKicker')}
            </span>
            <h2
              id="coreia-journeys-title"
              className="font-heading text-3xl sm:text-4xl font-light text-white leading-tight"
            >
              {t('coreia.landing.featuredJourneysTitle')}
            </h2>
          </div>
          <Link
            href={lp('/coreia-do-sul/jornadas')}
            className="inline-flex items-center gap-2 text-[10px] font-bold text-[#C8A27C] uppercase tracking-widest hover:text-white transition-colors shrink-0"
          >
            {t('coreia.landing.featuredJourneysCta')}
            <ArrowRight aria-hidden className="w-3.5 h-3.5" />
          </Link>
        </div>

        {journeys.length === 0 ? (
          <div className="bg-[#150E0C] border border-[#3D2620] rounded-sm px-6 py-12 text-center">
            <Calendar aria-hidden className="w-6 h-6 text-[#C8A27C] mx-auto mb-4" />
            <h3 className="font-heading text-xl font-light text-white">
              {t('coreia.landing.emptyJourneysTitle')}
            </h3>
            <p className="text-xs text-gray-400 font-light leading-relaxed mt-2 max-w-lg mx-auto">
              {t('coreia.landing.emptyJourneysDescription')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {journeys.map((journey) => {
              const title =
                localizedField({ pt: journey.title, en: journey.titleEn, es: journey.titleEs }) ??
                journey.title;
              const subtitle = localizedField({
                pt: journey.subtitle,
                en: journey.subtitleEn,
                es: journey.subtitleEs,
              });
              const destinations = parseStringList(journey.destinations);
              const departure = journey.departures[0] ?? null;
              return (
                <Link
                  key={journey.id}
                  href={lp(`/coreia-do-sul/jornadas/${journey.slug}`)}
                  className="group bg-[#150E0C] border border-[#3D2620] hover:border-[#C8A27C]/60 rounded-sm overflow-hidden flex flex-col transition-all duration-300"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden">
                    <SmartImage
                      src={journey.mainImage ?? journeyFallback}
                      alt={title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      quality={75}
                      placeholderLabel={title}
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="font-heading text-lg text-white font-medium group-hover:text-[#C8A27C] transition-colors">
                      {title}
                    </h3>
                    {subtitle && (
                      <p className="text-[11px] text-gray-400 font-light leading-relaxed mt-2 line-clamp-2">
                        {subtitle}
                      </p>
                    )}
                    <dl className="mt-4 flex flex-col gap-1.5 text-[10px] text-gray-400 font-light">
                      {destinations.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <MapPin aria-hidden className="w-3 h-3 text-[#C8A27C] shrink-0" />
                          <dd className="truncate">{destinations.join(', ')}</dd>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Calendar aria-hidden className="w-3 h-3 text-[#C8A27C] shrink-0" />
                        <dd>
                          {formatNumber(journey.durationDays)} {t('coreia.journeys.days')}
                        </dd>
                      </div>
                    </dl>
                    <div className="pt-4 mt-auto border-t border-[#3D2620] flex items-center justify-between gap-3">
                      <span className="font-heading text-base font-bold text-[#C8A27C]">
                        {formatCurrency(journey.pricePerPerson, journey.priceCurrency)}
                        <span className="text-[9px] font-light text-gray-400 ml-1">
                          {t('coreia.landing.perPerson')}
                        </span>
                      </span>
                      {departure && (
                        <span className="text-[9px] uppercase tracking-wider text-gray-400 text-right">
                          {formatNumber(departure.availableSpots)}{' '}
                          {t('coreia.vagas-disponiveis')}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. EXPERIÊNCIAS EM DESTAQUE (Prisma) */}
      <section
        aria-labelledby="coreia-experiences-title"
        className="py-20 px-6 sm:px-12 max-w-[1400px] mx-auto w-full border-t border-[#3D2620]"
      >
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#C8A27C] font-semibold block mb-3">
              {t('coreia.landing.featuredExperiencesKicker')}
            </span>
            <h2
              id="coreia-experiences-title"
              className="font-heading text-3xl sm:text-4xl font-light text-white leading-tight"
            >
              {t('coreia.landing.featuredExperiencesTitle')}
            </h2>
          </div>
          <Link
            href={lp('/coreia-do-sul/experiencias')}
            className="inline-flex items-center gap-2 text-[10px] font-bold text-[#C8A27C] uppercase tracking-widest hover:text-white transition-colors shrink-0"
          >
            {t('coreia.landing.featuredExperiencesCta')}
            <ArrowRight aria-hidden className="w-3.5 h-3.5" />
          </Link>
        </div>

        {experiences.length === 0 ? (
          <div className="bg-[#150E0C] border border-[#3D2620] rounded-sm px-6 py-12 text-center">
            <Compass aria-hidden className="w-6 h-6 text-[#C8A27C] mx-auto mb-4" />
            <h3 className="font-heading text-xl font-light text-white">
              {t('coreia.landing.emptyExperiencesTitle')}
            </h3>
            <p className="text-xs text-gray-400 font-light leading-relaxed mt-2 max-w-lg mx-auto">
              {t('coreia.landing.emptyExperiencesDescription')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {experiences.map((experience) => {
              const title =
                localizedField({
                  pt: experience.title,
                  en: experience.titleEn,
                  es: experience.titleEs,
                }) ?? experience.title;
              const subtitle = localizedField({
                pt: experience.subtitle,
                en: experience.subtitleEn,
                es: experience.subtitleEs,
              });
              return (
                <Link
                  key={experience.id}
                  href={lp(`/coreia-do-sul/experiencias/${experience.slug}`)}
                  className="group bg-[#150E0C] border border-[#3D2620] hover:border-[#C8A27C]/60 rounded-sm overflow-hidden flex flex-col transition-all duration-300"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <SmartImage
                      src={experience.mainImage ?? experienceFallback}
                      alt={title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      quality={75}
                      placeholderLabel={title}
                    />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-heading text-base text-white font-medium group-hover:text-[#C8A27C] transition-colors line-clamp-2">
                      {title}
                    </h3>
                    {subtitle && (
                      <p className="text-[10px] text-gray-400 font-light leading-relaxed mt-1.5 line-clamp-2">
                        {subtitle}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-1.5 text-[10px] text-gray-400">
                      <MapPin aria-hidden className="w-3 h-3 text-[#C8A27C] shrink-0" />
                      <span className="truncate">{experience.location}</span>
                    </div>
                    <p className="pt-3 mt-auto border-t border-[#3D2620] font-heading text-sm font-bold text-[#C8A27C]">
                      {formatCurrency(experience.pricePerPerson, experience.priceCurrency)}
                      <span className="text-[9px] font-light text-gray-400 ml-1">
                        {t('coreia.landing.perPerson')}
                      </span>
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. AS REGIÕES DA COREIA */}
      <section
        aria-labelledby="coreia-regions-title"
        className="py-20 px-6 sm:px-12 max-w-[1400px] mx-auto w-full border-t border-[#3D2620]"
      >
        <div className="text-center mb-16 flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#C8A27C] font-semibold block mb-3">
            {t('coreia.landing.regionsKicker')}
          </span>
          <h2
            id="coreia-regions-title"
            className="font-heading text-3xl sm:text-4xl font-light text-white leading-tight"
          >
            {t('coreia.landing.regionsTitle')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {regionRows.map(({ profile, name, subtitle, image }) => {
            const highlights = profile.highlightKeys.map((key) => t(key));
            return (
              <article
                key={profile.id}
                className="bg-[#18110F] border border-[#3D2620] p-6 rounded-sm flex flex-col"
              >
                <div className="relative aspect-[16/10] w-full -mx-6 -mt-6 mb-5 overflow-hidden rounded-t-sm">
                  <SmartImage
                    src={image}
                    alt={name}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
                    quality={75}
                    placeholderLabel={name}
                  />
                </div>
                <span className="text-[9px] text-[#C8A27C] font-bold uppercase tracking-widest mb-1">
                  {subtitle ?? t(profile.tagKey)}
                </span>
                <h3 className="font-heading text-xl text-white font-medium mb-3">{name}</h3>
                <p className="text-[11px] text-gray-400 font-light leading-relaxed mb-6 flex-1">
                  {t(profile.descriptionKey)}
                </p>
                <div className="border-t border-[#3D2620] pt-4">
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block mb-2">
                    {t('coreia.landing.highlightsLabel')}
                  </span>
                  <ul className="space-y-1 text-[10px] text-gray-300 font-light">
                    {highlights.map((highlight) => (
                      <li key={highlight} className="flex items-center gap-2">
                        <span aria-hidden className="w-1 h-1 rounded-full bg-[#C8A27C] shrink-0" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>

        {/* Destinos cadastrados no banco (além dos quatro perfis curados) */}
        <div className="mt-12 bg-[#150E0C] border border-[#3D2620] rounded-sm p-8">
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#C8A27C] font-semibold block mb-2">
            {t('coreia.landing.destinationsKicker')}
          </span>
          <h3 className="font-heading text-2xl font-light text-white mb-6">
            {t('coreia.landing.destinationsTitle')}
          </h3>
          {destinations.length === 0 ? (
            <p className="text-[11px] text-gray-400 font-light">{t('coreia.landing.destinationsEmpty')}</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {destinations.map((destination) => (
                <li key={destination.id}>
                  <Link
                    href={lp(`/destinos/${destination.slug}`)}
                    className="inline-flex items-center gap-1.5 border border-[#3D2620] hover:border-[#C8A27C]/60 text-[10px] text-gray-300 px-3.5 py-1.5 rounded-full transition-colors"
                  >
                    <MapPin aria-hidden className="w-3 h-3 text-[#C8A27C]" />
                    {destination.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* 6. PLANEJE SUA VIAGEM PERSONALIZADA */}
      <section
        aria-labelledby="coreia-planner-title"
        className="py-24 px-6 sm:px-12 max-w-[1400px] mx-auto w-full border-t border-[#3D2620]"
      >
        <div className="bg-[#150E0C] border border-[#3D2620] rounded-sm p-8 sm:p-12 flex flex-col shadow-2xl">
          <div className="flex flex-col lg:flex-row gap-12 mb-8">
            <div className="lg:w-1/3 flex flex-col gap-4">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-bold">
                {t('coreia.landing.plannerKicker')}
              </span>
              <h2
                id="coreia-planner-title"
                className="font-heading text-3xl sm:text-4xl font-light text-white leading-tight"
              >
                {t('coreia.landing.plannerTitle')}
              </h2>
              <p className="text-[12px] text-gray-400 font-light leading-relaxed mt-2">
                {t('coreia.landing.plannerDescription')}
              </p>
            </div>
            <div className="lg:w-2/3">
              <TripPlanner />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
