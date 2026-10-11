import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Calendar,
  CalendarCheck,
  Check,
  Clock,
  Crown,
  FileText,
  Headphones,
  HeartHandshake,
  MapPin,
  MessageCircle,
  Plane,
  Award,
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
import { buildMetadata, localizedUrl, siteUrl, truncateMeta } from '@/lib/seo';

/* ────────────────────────────────────────────────────────────────────────────
 * SEO
 * ────────────────────────────────────────────────────────────────────────── */

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getServerI18n();
  return buildMetadata({
    title: truncateMeta(t('pacotes.seo.title'), 60),
    description: t('pacotes.seo.description'),
    path: '/pacotes',
    locale,
    image: '/images/agencia-viagens-coreia-do-sul-maeum-global-oficial.webp',
    imageAlt: t('pacotes.heroImage.alt'),
  });
}

/* ────────────────────────────────────────────────────────────────────────────
 * Perfis de fallback
 *
 * A página é 100% Prisma. Estes perfis existem só para a degradação elegante
 * de antes do `aplicar.sql`: se `Journey`, `Experience` ou `Destination`
 * estiverem vazios, a seção continua com o desenho original — sempre com
 * CHAVE canônica do i18n, nunca com texto hardcoded, e sempre com a imagem do
 * slot de mídia correspondente.
 * ────────────────────────────────────────────────────────────────────────── */

interface JourneyProfile {
  id: string;
  tagKey: string;
  titleKey: string;
  descriptionKey: string;
  routeKey: string;
  days: number;
  price: number;
  slot: string;
  badgeClass: string;
  exclusiveKey: string | null;
  dualPrice: { liberty: number; prestige: number } | null;
}

const JOURNEY_PROFILES: readonly JourneyProfile[] = [
  {
    id: 'army',
    tagKey: 'pacotes.journeys.foundingGroup',
    titleKey: 'pacotes.journeys.armyTitle',
    descriptionKey: 'pacotes.journeys.armyDescription',
    routeKey: 'pacotes.route.seoulBusan',
    days: 14,
    price: 26500,
    slot: 'pacotes_jornada_army',
    badgeClass: 'bg-[#8A3324]',
    exclusiveKey: 'pacotes.journeys.exclusiveGroup',
    dualPrice: null,
  },
  {
    id: 'bom-sarang',
    tagKey: 'pacotes.journeys.spring',
    titleKey: 'pacotes.journeys.springTitle',
    descriptionKey: 'pacotes.journeys.springDescription',
    routeKey: 'pacotes.route.seoulBusan',
    days: 15,
    price: 29700,
    slot: 'pacotes_jornada_bom_sarang',
    badgeClass: 'bg-[#B85D29]',
    exclusiveKey: null,
    dualPrice: null,
  },
  {
    id: 'caravana-de-verao',
    tagKey: 'pacotes.journeys.summer',
    titleKey: 'pacotes.journeys.summerTitle',
    descriptionKey: 'pacotes.journeys.summerDescription',
    routeKey: 'pacotes.route.seoulBusan',
    days: 10,
    price: 29000,
    slot: 'pacotes_jornada_caravana',
    badgeClass: 'bg-[#B85D29]',
    exclusiveKey: null,
    dualPrice: { liberty: 29000, prestige: 34000 },
  },
  {
    id: 'always-destination',
    tagKey: 'pacotes.journeys.complete',
    titleKey: 'pacotes.journeys.completeTitle',
    descriptionKey: 'pacotes.journeys.completeDescription',
    routeKey: 'pacotes.route.seoulBusanDaegu',
    days: 15,
    price: 39000,
    slot: 'pacotes_jornada_always',
    badgeClass: 'bg-[#6B2727]',
    exclusiveKey: null,
    dualPrice: null,
  },
  {
    id: 'horizon-of-seven',
    tagKey: 'pacotes.journeys.jejuPremium',
    titleKey: 'pacotes.journeys.horizonTitle',
    descriptionKey: 'pacotes.journeys.horizonDescription',
    routeKey: 'pacotes.route.seoulBusanJeju',
    days: 15,
    price: 42000,
    slot: 'pacotes_jornada_horizon',
    badgeClass: 'bg-[#4A1A1A]',
    exclusiveKey: null,
    dualPrice: null,
  },
];

interface ExperienceProfile {
  id: string;
  titleKey: string;
  slot: string;
}

const EXPERIENCE_PROFILES: readonly ExperienceProfile[] = [
  { id: 'culinaria', titleKey: 'pacotes.aula-de-culinaria-coreana', slot: 'pacotes_experiencia_1' },
  { id: 'ceramica', titleKey: 'pacotes.oficina-de-ceramica', slot: 'pacotes_experiencia_2' },
  { id: 'hanbok', titleKey: 'pacotes.hanbok-premium', slot: 'pacotes_experiencia_3' },
  { id: 'danca-k-pop', titleKey: 'pacotes.aula-de-danca-k-pop', slot: 'pacotes_experiencia_4' },
  { id: 'ensaio', titleKey: 'pacotes.ensaio-fotografico', slot: 'pacotes_experiencia_5' },
  { id: 'ktx', titleKey: 'pacotes.trem-bala-ktx', slot: 'pacotes_experiencia_6' },
  { id: 'rio-han', titleKey: 'pacotes.cruzeiro-no-rio-han', slot: 'pacotes_experiencia_7' },
  { id: 'spa', titleKey: 'pacotes.spa-coreano', slot: 'pacotes_experiencia_8' },
  { id: 'cha', titleKey: 'pacotes.cerimonia-do-cha', slot: 'pacotes_experiencia_9' },
  { id: 'floresta', titleKey: 'pacotes.banho-em-floresta', slot: 'pacotes_experiencia_10' },
  { id: 'k-beauty', titleKey: 'pacotes.experiencia-k-beauty', slot: 'pacotes_experiencia_11' },
  { id: 'welcome-gift', titleKey: 'pacotes.experiences.welcomeGift', slot: 'pacotes_experiencia_12' },
];

interface DestinationProfile {
  id: string;
  nameKey: string;
  slot: string;
  badgeKey: string | null;
  descriptionKey: string | null;
  itemKeys: readonly string[];
}

const DESTINATION_PROFILES: readonly DestinationProfile[] = [
  {
    id: 'seoul',
    nameKey: 'pacotes.destinations.seoul',
    slot: 'pacotes_destino_seoul',
    badgeKey: null,
    descriptionKey: null,
    itemKeys: [
      'pacotes.palacios-historicos',
      'pacotes.destinations.gangnam',
      'pacotes.destinations.hongdae',
      'pacotes.destinations.bukchonHanokVillage',
      'pacotes.destinations.myeongdong',
      'pacotes.rio-han',
      'pacotes.destinations.kbeauty',
    ],
  },
  {
    id: 'busan',
    nameKey: 'pacotes.destinations.busan',
    slot: 'pacotes_destino_busan',
    badgeKey: null,
    descriptionKey: null,
    itemKeys: [
      'pacotes.praias-iconicas',
      'pacotes.destinations.skyCapsule',
      'pacotes.destinations.gamcheonVillage',
      'pacotes.mercados',
      'pacotes.templos',
      'pacotes.vida-costeira',
    ],
  },
  {
    id: 'daegu',
    nameKey: 'pacotes.destinations.daegu',
    slot: 'pacotes_destino_daegu',
    badgeKey: 'pacotes.exclusivo-always-destination',
    descriptionKey: 'pacotes.destinations.daeguDescription',
    itemKeys: [],
  },
  {
    id: 'jeju',
    nameKey: 'pacotes.destinations.jeju',
    slot: 'pacotes_destino_jeju',
    badgeKey: 'pacotes.exclusivo-horizon-of-seven',
    descriptionKey: null,
    itemKeys: [
      'pacotes.paisagens-vulcanicas',
      'pacotes.patrimonio-natural-da-unesco',
      'pacotes.campos-de-cha',
      'pacotes.praias-cristalinas',
      'pacotes.por-do-sol-inesquecivel',
    ],
  },
];

/** `Package.category` → chave canônica do rótulo. */
const PACKAGE_CATEGORY_KEYS: Record<string, string> = {
  drip: 'pacotes.detail.category.drip',
  standard: 'pacotes.detail.category.standard',
  luxury: 'pacotes.detail.category.luxury',
  experience: 'pacotes.detail.category.experience',
};

/** `Journey.category` → chave canônica do rótulo neutro da categoria. */
const JOURNEY_CATEGORY_KEYS: Record<string, string> = {
  army: 'pacotes.journeys.category.army',
  premium: 'pacotes.journeys.category.premium',
  essence: 'pacotes.journeys.category.essence',
  luxury: 'pacotes.journeys.category.luxury',
};

/** Inclusões comuns a todas as jornadas (13 itens, chaves canônicas). */
const INCLUDED_KEYS: readonly string[] = [
  'pacotes.passagem-aerea-internacional',
  'pacotes.seguro-viagem',
  'pacotes.hospedagem-selecionada',
  'pacotes.trem-bala-ktx-x',
  'pacotes.coordenador-maeum-global',
  'pacotes.guia-em-portugues',
  'pacotes.reuniao-pre-embarque',
  'pacotes.planejamento-personalizado',
  'pacotes.chip-de-internet',
  'pacotes.welcome-kit-exclusivo',
  'pacotes.suporte-durante-toda-a-viagem',
  'pacotes.atendimento-em-portugues',
  'pacotes.grupo-exclusivo-e-limitado',
];

interface HowStep {
  id: string;
  Icon: LucideIcon;
  line1Key: string;
  line2Key: string;
}

const HOW_STEPS: readonly HowStep[] = [
  { id: '01', Icon: FileText, line1Key: 'pacotes.how.step1Line1', line2Key: 'pacotes.how.step1Line2' },
  { id: '02', Icon: MessageCircle, line1Key: 'pacotes.how.step2Line1', line2Key: 'pacotes.how.step2Line2' },
  { id: '03', Icon: MapPin, line1Key: 'pacotes.how.step3Line1', line2Key: 'pacotes.how.step3Line2' },
  { id: '04', Icon: Calendar, line1Key: 'pacotes.how.step4Line1', line2Key: 'pacotes.how.step4Line2' },
  { id: '05', Icon: Users, line1Key: 'pacotes.how.step5Line1', line2Key: 'pacotes.how.step5Line2' },
  { id: '06', Icon: Plane, line1Key: 'pacotes.how.step6Line1', line2Key: 'pacotes.how.step6Line2' },
];

const normalize = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');

/** Casa um registro do banco com um perfil de fallback pelo slug/nome. */
const matchProfile = <T extends { id: string }>(profiles: readonly T[], ...values: (string | null | undefined)[]) => {
  const haystack = values
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .map(normalize)
    .join(' ');
  if (!haystack) return null;
  return (
    profiles.find((profile) => haystack.includes(profile.id)) ??
    profiles.find((profile) => haystack.includes(normalize(profile.id))) ??
    null
  );
};

/* ────────────────────────────────────────────────────────────────────────────
 * Página
 * ────────────────────────────────────────────────────────────────────────── */

export default async function PacotesPage() {
  const { t, locale, lp, fill, formatCurrency, formatDate, formatNumber, localizedField } = await getServerI18n();

  const [packages, journeys, experiences, destinations, media] = await Promise.all([
    prisma.package.findMany({
      where: { status: 'active' },
      orderBy: { id: 'asc' },
      take: 24,
      select: {
        id: true,
        slug: true,
        title: true,
        destination: true,
        price: true,
        category: true,
        description: true,
        gallery: true,
        itinerary: true,
        included: true,
        notIncluded: true,
        updatedAt: true,
      },
    }),
    prisma.journey.findMany({
      where: { status: 'active' },
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
      take: 6,
      select: {
        id: true,
        slug: true,
        title: true,
        titleEn: true,
        titleEs: true,
        subtitle: true,
        subtitleEn: true,
        subtitleEs: true,
        category: true,
        destinations: true,
        durationDays: true,
        pricePerPerson: true,
        priceCurrency: true,
        mainImage: true,
        isFeatured: true,
        departures: {
          take: 1,
          orderBy: { startDate: 'asc' },
          select: { id: true, startDate: true, availableSpots: true, status: true },
        },
      },
    }),
    prisma.experience.findMany({
      where: { status: 'active' },
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
      take: 12,
      select: {
        id: true,
        slug: true,
        title: true,
        titleEn: true,
        titleEs: true,
        subtitle: true,
        subtitleEn: true,
        subtitleEs: true,
        mainImage: true,
        durationHours: true,
      },
    }),
    prisma.destination.findMany({
      where: { isFeatured: true },
      orderBy: { sortOrder: 'asc' },
      take: 8,
      select: {
        id: true,
        slug: true,
        name: true,
        subtitle: true,
        description: true,
        descriptionEn: true,
        descriptionEs: true,
        mainImage: true,
      },
    }),
    getMediaMap().catch(() => ({}) as Record<string, string>),
  ]);

  /* ── Pacotes: fonte da tabela comparativa e do JSON-LD de ofertas ───────── */

  const packageRows = packages.map((pack) => ({
    id: pack.id,
    slug: pack.slug,
    title: pack.title,
    destination: pack.destination,
    price: pack.price,
    // `Package` não tem `priceCurrency`: o schema documenta o preço em BRL.
    categoryKey: PACKAGE_CATEGORY_KEYS[pack.category] ?? PACKAGE_CATEGORY_KEYS.standard!,
    // O roteiro é um JSON de dias; o comprimento é a duração declarada.
    days: parseStringArray(pack.itinerary, 90).length,
    gallery: parseStringArray(pack.gallery, 24),
    description: pack.description,
    url: lp(`/pacotes/${pack.slug}`),
  }));

  /* ── Jardins: journeys do banco, senão os 5 perfis editoriais ───────────── */

  const journeyRows =
    journeys.length > 0
      ? journeys.map((journey) => {
          const profile = matchProfile(JOURNEY_PROFILES, journey.slug, journey.title);
          return {
            id: journey.id,
            title:
              localizedField({ pt: journey.title, en: journey.titleEn, es: journey.titleEs }) ?? journey.title,
            description:
              localizedField({ pt: journey.subtitle, en: journey.subtitleEn, es: journey.subtitleEs }) ??
              (profile ? t(profile.descriptionKey) : ''),
            tagKey: JOURNEY_CATEGORY_KEYS[journey.category] ?? null,
            route: parseStringArray(journey.destinations, 12).join(' + '),
            days: journey.durationDays,
            price: journey.pricePerPerson,
            currency: journey.priceCurrency,
            image: journey.mainImage,
            slot: profile?.slot ?? '',
            badgeClass: profile?.badgeClass ?? 'bg-[#4A1A1A]',
            exclusiveKey: profile?.exclusiveKey ?? null,
            isFeatured: journey.isFeatured,
            departure: journey.departures[0] ?? null,
            url: lp(`/coreia-do-sul/jornadas/${journey.slug}`),
          };
        })
      : JOURNEY_PROFILES.map((profile, index) => ({
          id: profile.id,
          title: t(profile.titleKey),
          description: t(profile.descriptionKey),
          tagKey: profile.tagKey,
          route: t(profile.routeKey),
          days: profile.days,
          price: profile.price,
          currency: 'BRL',
          image: null,
          slot: media[profile.slot] ?? '',
          badgeClass: profile.badgeClass,
          exclusiveKey: profile.exclusiveKey,
          isFeatured: index === 0,
          departure: null,
          url: lp('/jornadas'),
        }));

  /* ── Experiências: banco, senão os 12 slots editoriais ─────────────────── */

  const experienceRows =
    experiences.length > 0
      ? experiences.map((experience, index) => ({
          id: experience.id,
          title:
            localizedField({ pt: experience.title, en: experience.titleEn, es: experience.titleEs }) ??
            experience.title,
          image: experience.mainImage,
          // Sem `mainImage` no registro, recicla os slots editoriais na ordem.
          slot:
            media[EXPERIENCE_PROFILES[index % EXPERIENCE_PROFILES.length]!.slot] ?? '',
          url: lp(`/coreia-do-sul/experiencias/${experience.slug}`),
        }))
      : EXPERIENCE_PROFILES.map((profile) => ({
          id: profile.id,
          title: t(profile.titleKey),
          image: null,
          slot: media[profile.slot] ?? '',
          url: lp('/coreia-do-sul/experiencias'),
        }));

  /* ── Destinos: banco, senão os 4 perfis (imagem do slot de mídia) ───────── */

  const destinationRows =
    destinations.length > 0
      ? destinations.map((destination) => {
          const profile = matchProfile(DESTINATION_PROFILES, destination.slug, destination.name);
          return {
            id: destination.id,
            name: destination.name,
            description:
              localizedField({
                pt: destination.description,
                en: destination.descriptionEn,
                es: destination.descriptionEs,
              }) ?? destination.subtitle ?? '',
            image: destination.mainImage,
            slot: profile ? (media[profile.slot] ?? '') : '',
            badgeKey: profile?.badgeKey ?? null,
            itemKeys: profile?.itemKeys ?? [],
          };
        })
      : DESTINATION_PROFILES.map((profile) => ({
          id: profile.id,
          name: t(profile.nameKey),
          description: profile.descriptionKey ? t(profile.descriptionKey) : '',
          image: null,
          slot: media[profile.slot] ?? '',
          badgeKey: profile.badgeKey,
          itemKeys: profile.itemKeys,
        }));

  /* ── JSON-LD: ItemList de pacotes (Product + Offer) ────────────────────── */

  const packagesJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t('pacotes.journeys.kicker'),
    numberOfItems: packageRows.length,
    itemListElement: packageRows.map((pack, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: pack.title,
        description: truncateMeta(pack.description ?? pack.title, 300),
        url: localizedUrl(`/pacotes/${pack.slug}`, locale),
        ...(pack.gallery.length ? { image: pack.gallery.map((src) => siteUrl(src)) } : {}),
        brand: { '@type': 'Brand', name: 'Maeum Global' },
        ...(pack.price > 0
          ? {
              offers: {
                '@type': 'Offer',
                url: localizedUrl(`/pacotes/${pack.slug}`, locale),
                price: pack.price.toFixed(2),
                priceCurrency: 'BRL',
                availability: 'https://schema.org/InStock',
              },
            }
          : {}),
      },
    })),
  };

  const journeysJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t('pacotes.journeys.title'),
    numberOfItems: journeyRows.length,
    itemListElement: journeyRows.map((journey, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'TouristTrip',
        name: journey.title,
        description: truncateMeta(journey.description, 300),
        ...(journey.image ? { image: siteUrl(journey.image) } : {}),
        touristType: 'Leisure travelers',
        ...(journey.days > 0 ? { duration: `P${journey.days}D` } : {}),
        ...(journey.departure
          ? { departureTime: new Date(journey.departure.startDate).toISOString().slice(0, 10) }
          : {}),
        ...(journey.price > 0
          ? {
              offers: {
                '@type': 'Offer',
                price: journey.price.toFixed(2),
                priceCurrency: journey.currency || 'BRL',
                availability: 'https://schema.org/InStock',
              },
            }
          : {}),
      },
    })),
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0F0A08] text-[#EFEBE4] font-sans selection:bg-[#C8A27C] selection:text-[#0F0A08]">
      <JsonLd id="pacotes-itemlist-jsonld" data={packagesJsonLd} />
      <JsonLd id="pacotes-journeys-jsonld" data={journeysJsonLd} />

      <Header />

      {/* ── HERO (LCP) ─────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="pacotes-hero-title"
        className="relative min-h-[100dvh] flex flex-col justify-center overflow-hidden border-b border-[#3A232E]/30"
      >
        <div className="absolute inset-0 z-0">
          <SmartImage
            src={media.pacotes_hero_desktop}
            alt={t('pacotes.heroImage.alt')}
            fill
            className="object-cover object-center hidden md:block"
            sizes="100vw"
            priority
            quality={90}
            fallbackSrc={media.pacotes_hero_mobile}
            placeholderLabel={t('pacotes.heroImage.alt')}
          />
          <SmartImage
            src={media.pacotes_hero_mobile}
            alt={t('pacotes.heroImage.alt')}
            fill
            className="object-cover object-center block md:hidden"
            sizes="100vw"
            priority
            quality={90}
            fallbackSrc={media.pacotes_hero_desktop}
            placeholderLabel={t('pacotes.heroImage.alt')}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F0A08] via-[#0F0A08]/70 to-transparent w-full sm:w-2/3" />
        </div>
        <div className="relative z-10 px-6 sm:px-12 max-w-7xl mx-auto w-full flex flex-col items-start gap-5 pt-28 md:pt-40 pb-20">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold">
            {t('pacotes.maeum-global')}
          </span>
          <h1
            id="pacotes-hero-title"
            className="font-heading text-5xl sm:text-6xl md:text-[80px] font-light tracking-wide leading-[1.1] text-white max-w-3xl"
          >
            {t('pacotes.hero.line1')} <br />
            {t('pacotes.hero.line2')} <span className="italic text-[#C8A27C]">{t('pacotes.hero.line3')}</span>
            <br />
            {t('pacotes.hero.line4')}
          </h1>
          <p className="text-[13px] sm:text-sm text-gray-300 max-w-xl font-light leading-relaxed mt-2 opacity-90">
            {t('pacotes.hero.description')}
          </p>
          <div className="flex flex-col gap-1 mt-2 mb-2">
            <span className="font-semibold text-white text-[13px] sm:text-sm">{t('pacotes.hero.tagline1')}</span>
            <span className="font-semibold text-white text-[13px] sm:text-sm">{t('pacotes.hero.tagline2')}</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <Link
              href={lp('/jornadas')}
              className="flex items-center justify-center gap-3 bg-[#C8A27C] hover:bg-[#B8906C] text-[#0F0A08] font-bold text-[11px] py-4 px-8 transition-all group uppercase tracking-widest"
            >
              {t('pacotes.cta.discoverJourneys')}
              <ArrowRight aria-hidden className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href={lp('/contato')}
              className="flex items-center justify-center gap-3 bg-transparent border border-[#C8A27C] text-[#C8A27C] hover:bg-[#C8A27C]/10 font-bold text-[11px] py-4 px-8 transition-all uppercase tracking-widest"
            >
              <CalendarCheck aria-hidden className="w-4 h-4" /> {t('pacotes.cta.requestPlanning')}
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-10 mt-16 pt-8 border-t border-white/10 w-full max-w-2xl opacity-70">
            <div className="flex flex-col items-center gap-3">
              <MapPin aria-hidden className="h-5 w-5 text-[#C8A27C]" strokeWidth={1} />
              <span className="text-[9px] text-gray-300 font-medium tracking-widest uppercase text-center">
                {t('pacotes.destino-exclusivo')}
              </span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Users aria-hidden className="h-5 w-5 text-[#C8A27C]" strokeWidth={1} />
              <span className="text-[9px] text-gray-300 font-medium tracking-widest uppercase text-center">
                {t('pacotes.grupos-limitados')}
                <br />
                {t('pacotes.hero.stat4')}
              </span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Calendar aria-hidden className="h-5 w-5 text-[#C8A27C]" strokeWidth={1} />
              <span className="text-[9px] text-gray-300 font-medium tracking-widest uppercase text-center">
                {t('pacotes.saidas-programadas')}
              </span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Award aria-hidden className="h-5 w-5 text-[#C8A27C]" strokeWidth={1} />
              <span className="text-[9px] text-gray-300 font-medium tracking-widest uppercase text-center">
                {t('pacotes.curadoria-premium')}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="px-6 sm:px-12 max-w-[1400px] mx-auto w-full pt-8">
        <Breadcrumbs
          locale={locale}
          items={[{ name: t('pacotes.list.breadcrumb'), path: '/pacotes' }]}
          className="text-gray-500"
        />
      </div>

      {/* ── NOSSAS JORNADAS ────────────────────────────────────────────────── */}
      <section
        aria-labelledby="pacotes-jornadas-title"
        className="py-24 px-6 sm:px-12 max-w-[1400px] mx-auto w-full"
      >
        <div className="text-center mb-16">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold block mb-3">
            {t('pacotes.journeys.kicker')}
          </span>
          <h2
            id="pacotes-jornadas-title"
            className="font-heading text-3xl sm:text-4xl font-light text-white"
          >
            {t('pacotes.journeys.title')}
          </h2>
          <p className="text-sm text-gray-400 mt-3 font-light">{t('pacotes.journeys.subtitle')}</p>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {journeyRows.map((journey) => (
            <li
              key={journey.id}
              className="bg-[#261514] border border-[#3D2620] flex flex-col overflow-hidden group hover:border-[#C8A27C]/40 transition-colors"
            >
              <Link href={journey.url} className="relative aspect-[16/9] w-full overflow-hidden block">
                <SmartImage
                  src={journey.image}
                  alt={fill(t('pacotes.card.imageAlt'), { title: journey.title })}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  quality={75}
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  fallbackSrc={journey.slot || undefined}
                  placeholderLabel={journey.title}
                />
                {journey.tagKey ? (
                  <span
                    className={`absolute top-3 left-3 ${journey.badgeClass} text-white text-[8px] font-bold tracking-widest px-2.5 py-1 rounded-sm uppercase shadow-sm`}
                  >
                    {t(journey.tagKey)}
                  </span>
                ) : null}
              </Link>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="font-heading text-xl font-medium text-white mb-3 leading-tight">
                  <Link href={journey.url} className="hover:text-[#C8A27C] transition-colors">
                    {journey.title}
                  </Link>
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-4">
                  {journey.days > 0 ? (
                    <span className="flex items-center gap-1.5">
                      <Clock aria-hidden className="w-3 h-3 text-[#C8A27C]" />
                      {fill(t('pacotes.detail.daysTemplate'), { n: journey.days })}
                    </span>
                  ) : null}
                  {journey.route ? (
                    <span className="flex items-center gap-1.5">
                      <MapPin aria-hidden className="w-3 h-3 text-[#C8A27C]" />
                      {journey.route}
                    </span>
                  ) : null}
                  {journey.exclusiveKey ? (
                    <span className="flex items-center gap-1.5">
                      <Crown aria-hidden className="w-3 h-3 text-[#C8A27C]" />
                      {t(journey.exclusiveKey)}
                    </span>
                  ) : null}
                </div>
                {journey.description ? (
                  <p className="text-[11px] text-gray-400 leading-relaxed font-light mb-6 flex-1">
                    {journey.description}
                  </p>
                ) : (
                  <div className="flex-1" />
                )}
                <div className="mt-auto">
                  {journey.price > 0 ? (
                    <div className="mb-4">
                      <span className="block text-[9px] text-gray-500 uppercase tracking-widest mb-0.5">
                        {t('pacotes.journeys.priceFrom')}
                      </span>
                      <span className="font-heading text-2xl text-white font-medium">
                        {formatCurrency(journey.price, journey.currency, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  ) : null}
                  {journey.departure ? (
                    <p className="text-[9px] text-gray-500 font-light mb-3">
                      {fill(t('pacotes.journeys.departureTemplate'), {
                        date: formatDate(journey.departure.startDate, { day: '2-digit', month: 'short', year: 'numeric' }),
                      })}
                    </p>
                  ) : null}
                  <Link
                    href={journey.url}
                    className="w-full bg-[#C8A27C] hover:bg-[#B8906C] text-[#0F0A08] transition-colors py-3.5 text-[9px] font-bold uppercase tracking-widest rounded-sm flex items-center justify-center gap-2 group"
                  >
                    {t('pacotes.journeys.cta')}
                    <ArrowRight aria-hidden className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {journeyRows.length === 0 ? (
          <p className="text-center text-xs text-gray-500 font-light">{t('pacotes.journeys.emptyDescription')}</p>
        ) : null}
      </section>

      {/* ── EXPERIÊNCIAS ───────────────────────────────────────────────────── */}
      <section
        aria-labelledby="pacotes-experiencias-title"
        className="py-20 px-6 sm:px-12 max-w-[1400px] mx-auto w-full"
      >
        <div className="text-center mb-12">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold block mb-3">
            {t('pacotes.experiences.kicker')}
          </span>
          <h2
            id="pacotes-experiencias-title"
            className="font-heading text-3xl font-light text-white"
          >
            {t('pacotes.experiences.title')}
          </h2>
        </div>
        {experienceRows.length === 0 ? (
          <p className="text-center text-xs text-gray-500 font-light">
            {t('pacotes.experiences.emptyDescription')}
          </p>
        ) : (
          <ul className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {experienceRows.map((experience) => (
              <li key={experience.id}>
                <Link
                  href={experience.url}
                  className="relative aspect-square border border-[#3D2620] rounded-sm overflow-hidden group block"
                >
                  <SmartImage
                    src={experience.image}
                    alt={experience.title}
                    fill
                    sizes="(min-width: 1024px) 16vw, (min-width: 768px) 25vw, 50vw"
                    quality={75}
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                    fallbackSrc={experience.slot || undefined}
                    placeholderLabel={experience.title}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F0A08] via-[#0F0A08]/40 to-transparent" />
                  <div className="absolute inset-0 p-4 flex items-end justify-center text-center">
                    <span className="text-[10px] sm:text-[11px] font-semibold text-white tracking-wide uppercase leading-tight whitespace-pre-line group-hover:text-[#C8A27C] transition-colors duration-300">
                      {experience.title}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── DESTINOS ───────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="pacotes-destinos-title"
        className="py-20 px-6 sm:px-12 max-w-[1400px] mx-auto w-full border-t border-[#3D2620]"
      >
        <div className="text-center mb-12">
          <h2 id="pacotes-destinos-title" className="sr-only">
            {t('pacotes.destinations.kicker')}
          </h2>
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold block">
            {t('pacotes.destinations.kicker')}
          </span>
        </div>
        {destinationRows.length === 0 ? (
          <p className="text-center text-xs text-gray-500 font-light">
            {t('pacotes.destinations.emptyDescription')}
          </p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {destinationRows.map((destination) => (
              <li
                key={destination.id}
                className="relative h-[380px] border border-[#3D2620] rounded-sm overflow-hidden group"
              >
                <SmartImage
                  src={destination.image}
                  alt={destination.name}
                  fill
                  sizes="(min-width: 768px) 25vw, 100vw"
                  quality={75}
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  fallbackSrc={destination.slot || undefined}
                  placeholderLabel={destination.name}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F0A08] via-[#0F0A08]/30 to-transparent" />
                <div className="absolute inset-0 p-8 flex flex-col justify-end gap-2">
                  <h3 className="font-heading text-2xl text-white tracking-wider">{destination.name}</h3>
                  {destination.badgeKey ? (
                    <span className="text-[8px] bg-[#6B1F1F] text-white uppercase tracking-widest px-2 py-0.5 rounded-sm self-start font-bold">
                      {t(destination.badgeKey)}
                    </span>
                  ) : null}
                  {destination.description ? (
                    <p className="text-[11px] text-gray-300 font-light leading-relaxed">{destination.description}</p>
                  ) : null}
                  {destination.itemKeys.length > 0 ? (
                    <ul className="text-[10px] text-gray-300 space-y-1 font-light tracking-wide uppercase">
                      {destination.itemKeys.map((itemKey) => (
                        <li key={itemKey}>• {t(itemKey)}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── INCLUSO + TABELA COMPARATIVA ───────────────────────────────────── */}
      <section
        aria-labelledby="pacotes-included-title"
        className="py-20 px-6 sm:px-12 max-w-[1400px] mx-auto w-full"
      >
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-[35%] relative border border-[#3D2620] rounded-sm overflow-hidden min-h-[400px]">
            <SmartImage
              src={media.pacotes_incluso_banner}
              alt={t('pacotes.included.bannerAlt')}
              fill
              sizes="(min-width: 1024px) 35vw, 100vw"
              quality={75}
              placeholderLabel={t('pacotes.included.bannerAlt')}
            />
            <div className="absolute inset-0 bg-[#120D0A]/95" />
            <div className="relative z-10 p-8 sm:p-10 h-full flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold block mb-3">
                {t('pacotes.included.bannerAlt')}
              </span>
              <h2
                id="pacotes-included-title"
                className="font-heading text-2xl font-light text-white mb-8 leading-tight"
              >
                {t('pacotes.included.title')}
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 mt-auto">
                {INCLUDED_KEYS.map((itemKey) => (
                  <li key={itemKey} className="flex items-start gap-2">
                    <span
                      aria-hidden
                      className="bg-[#C8A27C] rounded-full p-0.5 mt-0.5 shrink-0 flex items-center justify-center"
                    >
                      <Check className="h-2 w-2 text-[#0F0A08]" strokeWidth={4} />
                    </span>
                    <span className="text-[10px] text-gray-300 font-light leading-snug">{t(itemKey)}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[9px] text-gray-500 mt-6 italic">{t('pacotes.included.footnote')}</p>
            </div>
          </div>

          <div className="lg:w-[65%] border border-[#3D2620] bg-[#1A1211] rounded-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[#3D2620] bg-[#2A1616]">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold block text-center">
                {t('pacotes.comparison.kicker')}
              </span>
            </div>
            {packageRows.length === 0 ? (
              <p className="p-10 text-center text-xs text-gray-500 font-light">
                {t('pacotes.comparison.emptyDescription')}
              </p>
            ) : (
              <div className="overflow-x-auto p-4 sm:p-6">
                <table className="w-full min-w-[600px] text-left">
                  <caption className="sr-only">{t('pacotes.comparison.kicker')}</caption>
                  <thead>
                    <tr className="border-b border-[#3D2620]">
                      <th scope="col" className="py-4 px-4 text-[9px] font-semibold text-[#C8A27C] uppercase tracking-widest w-[25%]">
                        {t('pacotes.pacote')}
                      </th>
                      <th scope="col" className="py-4 px-4 text-[9px] font-semibold text-[#C8A27C] uppercase tracking-widest text-center">
                        {t('pacotes.dias')}
                      </th>
                      <th scope="col" className="py-4 px-4 text-[9px] font-semibold text-[#C8A27C] uppercase tracking-widest text-center">
                        {t('pacotes.destinations.kicker-x')}
                      </th>
                      <th scope="col" className="py-4 px-4 text-[9px] font-semibold text-[#C8A27C] uppercase tracking-widest w-[30%]">
                        {t('pacotes.perfil')}
                      </th>
                      <th scope="col" className="py-4 px-4 text-[9px] font-semibold text-[#C8A27C] uppercase tracking-widest text-right">
                        {t('pacotes.valor-inicial')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#3D2620]/50">
                    {packageRows.map((pack, index) => (
                      <tr
                        key={pack.id}
                        className={`${index % 2 === 0 ? 'bg-[#120D0A]' : 'bg-[#1A1211]'} hover:bg-[#2A1616] transition-colors`}
                      >
                        <th scope="row" className="py-4 px-4 text-[11px] font-medium text-white text-left">
                          <Link href={pack.url} className="hover:text-[#C8A27C] transition-colors">
                            {pack.title}
                          </Link>
                        </th>
                        <td className="py-4 px-4 text-[10px] text-gray-400 text-center">
                          {pack.days > 0 ? formatNumber(pack.days) : t('pacotes.detail.daysUnknown')}
                        </td>
                        <td className="py-4 px-4 text-[10px] text-gray-400 text-center">
                          {pack.destination ?? '—'}
                        </td>
                        <td className="py-4 px-4 text-[10px] text-gray-400">{t(pack.categoryKey)}</td>
                        <td className="py-4 px-4 text-[11px] text-white text-right font-medium whitespace-nowrap">
                          {formatCurrency(pack.price, 'BRL', { maximumFractionDigits: 0 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA + CTA ────────────────────────────────────────────── */}
      <section
        aria-labelledby="pacotes-how-title"
        className="py-24 px-6 sm:px-12 max-w-[1400px] mx-auto w-full border-t border-[#3D2620]"
      >
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <div className="lg:w-1/2 w-full">
            <h2 id="pacotes-how-title" className="sr-only">
              {t('pacotes.how.kicker')}
            </h2>
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold block mb-12 text-center lg:text-left">
              {t('pacotes.how.kicker')}
            </span>
            <ol className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 sm:gap-2">
              {HOW_STEPS.map(({ id, Icon, line1Key, line2Key }, index) => (
                <li key={id} className="flex flex-col items-center text-center gap-3 relative w-full sm:w-[15%]">
                  <Icon aria-hidden className="w-6 h-6 text-[#C8A27C] stroke-1" />
                  <span className="text-[10px] font-bold text-[#C8A27C]">{id}</span>
                  <p className="text-[9px] text-gray-400 font-light leading-tight">
                    {t(line1Key)}
                    <br />
                    {t(line2Key)}
                  </p>
                  {index < HOW_STEPS.length - 1 ? (
                    <ArrowRight
                      aria-hidden
                      className="hidden sm:block absolute top-[40%] -right-[50%] w-[100%] h-4 text-[#C8A27C]/50 mx-auto"
                    />
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
          <div className="lg:w-1/2 w-full relative bg-[#2A1112] border border-[#3D2620] rounded-sm overflow-hidden p-10 sm:p-14">
            <div className="absolute right-0 bottom-0 opacity-30 w-1/2 h-full">
              <SmartImage
                src={media.pacotes_cta_tradition}
                alt={t('pacotes.cta.imageAlt')}
                fill
                sizes="(min-width: 1024px) 25vw, 50vw"
                quality={75}
                placeholderLabel={t('pacotes.cta.imageAlt')}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#2A1112] to-transparent" />
            </div>
            <div className="relative z-10 max-w-sm">
              <h2 className="font-heading text-3xl font-light text-[#C8A27C] leading-tight mb-4">
                {t('pacotes.cta.title')}
              </h2>
              <p className="text-[11px] text-gray-400 font-light mb-8">{t('pacotes.cta.description')}</p>
              <Link
                href={lp('/contato')}
                className="w-full sm:w-auto bg-[#C8A27C] hover:bg-[#B8906C] text-[#0F0A08] font-bold text-[10px] py-4 px-8 transition-all uppercase tracking-widest flex items-center justify-center"
              >
                {t('pacotes.cta.requestPlanning')}
              </Link>
              <Link
                href={lp('/contato')}
                className="flex items-center gap-2 text-[10px] text-[#C8A27C] hover:text-[#B8906C] uppercase tracking-widest transition-colors font-semibold mt-4"
              >
                <MessageCircle aria-hidden className="w-3.5 h-3.5" />
                {t('pacotes.cta.talkToSpecialist')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── BOTTOM BAR ─────────────────────────────────────────────────────── */}
      <section
        aria-label={t('pacotes.bottomBar.support')}
        className="py-10 px-6 border-t border-[#3D2620] bg-[#0A0705]"
      >
        <ul className="max-w-[1400px] mx-auto flex flex-wrap justify-center sm:justify-between items-center gap-6 opacity-70">
          {[
            { Icon: Headphones, key: 'pacotes.atendimento-em-portugues' },
            { Icon: HeartHandshake, key: 'pacotes.bottomBar.support' },
            { Icon: Users, key: 'pacotes.bottomBar.groups' },
            { Icon: Award, key: 'pacotes.bottomBar.curation' },
          ].map(({ Icon, key }) => (
            <li key={key} className="flex items-center gap-3">
              <Icon aria-hidden className="w-4 h-4 text-[#C8A27C]" strokeWidth={1.5} />
              <span className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">{t(key)}</span>
            </li>
          ))}
        </ul>
      </section>

      <Footer />
    </div>
  );
}
