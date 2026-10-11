import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Map,
  Camera,
  Leaf,
  Utensils,
  ShoppingBag,
  Star,
  Heart,
  Compass,
  ShieldCheck,
  Headphones,
  Calendar,
  Award,
  Waves,
  TreePine,
  Coffee,
  Landmark,
  Moon,
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
import { buildMetadata, localizedUrl, siteUrl, truncateMeta } from '@/lib/seo';

/* ────────────────────────────────────────────────────────────────────────────
 * SEO
 * ────────────────────────────────────────────────────────────────────────── */

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getServerI18n();
  return buildMetadata({
    title: truncateMeta(t('destinos.seo.title'), 60),
    description: t('destinos.seo.description'),
    path: '/destinos',
    locale,
    image: '/images/agencia-viagens-coreia-do-sul-maeum-global-destinos.webp',
    imageAlt: t('destinos.heroImage.desktop'),
  });
}

/* ────────────────────────────────────────────────────────────────────────────
 * Perfis de cidade
 *
 * O mapa e os cards da página são desenhados em torno de quatro cidades
 * clássicas (Seul, Daegu, Busan, Jeju). Cada perfil guarda apenas a CHAVE
 * canônica do i18n e a posição no mapa — nenhum texto editorial hardcoded.
 * Quando o `Destination` existe no banco, nome/descrição/imagem vêm dele; o
 * perfil só completa o que o schema não tem (ícones de destaque e âncora do
 * mapa). Destinos sem perfil continuam aparecendo na lista, só não ganham um
 * ponto no esquema.
 * ────────────────────────────────────────────────────────────────────────── */

interface CityProfile {
  id: string;
  nameKey: string;
  descriptionKey: string;
  slot: string;
  pinKeys: [string, string];
  point: { top: string; left: string };
  features: { Icon: LucideIcon; labelKey: string }[];
}

const CITY_PROFILES: readonly CityProfile[] = [
  {
    id: 'seoul',
    nameKey: 'destinos.city.seoul',
    descriptionKey: 'destinos.cards.seoul',
    slot: 'destinos_card_seoul',
    pinKeys: ['destinos.intro.pillars.1title', 'destinos.intro.pillars.1suffix'],
    point: { top: '20%', left: '40%' },
    features: [
      { Icon: Landmark, labelKey: 'destinos.cultura' },
      { Icon: ShoppingBag, labelKey: 'destinos.compras' },
      { Icon: Utensils, labelKey: 'destinos.gastronomia' },
      { Icon: Moon, labelKey: 'destinos.vida-noturna' },
    ],
  },
  {
    id: 'busan',
    nameKey: 'destinos.city.busan',
    descriptionKey: 'destinos.cards.busan',
    slot: 'destinos_card_busan',
    pinKeys: ['destinos.intro.pillars.3title', 'destinos.intro.pillars.3suffix'],
    point: { top: '65%', left: '60%' },
    features: [
      { Icon: Waves, labelKey: 'destinos.praias' },
      { Icon: Landmark, labelKey: 'destinos.templos' },
      { Icon: ShoppingBag, labelKey: 'destinos.mercados' },
      { Icon: Utensils, labelKey: 'destinos.gastronomia' },
    ],
  },
  {
    id: 'daegu',
    nameKey: 'destinos.city.daegu',
    descriptionKey: 'destinos.cards.daegu',
    slot: 'destinos_card_daegu',
    pinKeys: ['destinos.intro.pillars.2title', 'destinos.intro.pillars.2suffix'],
    point: { top: '50%', left: '55%' },
    features: [
      { Icon: Users, labelKey: 'destinos.intro.pillars.2title-x' },
      { Icon: Coffee, labelKey: 'destinos.filters.cafes' },
      { Icon: Landmark, labelKey: 'destinos.historia' },
      { Icon: Leaf, labelKey: 'destinos.natureza' },
    ],
  },
  {
    id: 'jeju',
    nameKey: 'destinos.city.jeju',
    descriptionKey: 'destinos.cards.jeju',
    slot: 'destinos_card_jeju',
    pinKeys: ['destinos.intro.pillars.4title', 'destinos.intro.pillars.4suffix'],
    point: { top: '85%', left: '30%' },
    features: [
      { Icon: TreePine, labelKey: 'destinos.natureza' },
      { Icon: Map, labelKey: 'destinos.trilhas' },
      { Icon: Waves, labelKey: 'destinos.cachoeiras' },
      { Icon: Coffee, labelKey: 'destinos.relaxamento' },
    ],
  },
];

const normalize = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');

const matchProfile = (name: string, slug: string): CityProfile | null => {
  const haystack = `${normalize(name)} ${normalize(slug)}`;
  return (
    CITY_PROFILES.find((profile) => haystack.includes(profile.id)) ??
    // variation comum em português: "seul" / "seoul"
    CITY_PROFILES.find((profile) => haystack.includes(`${profile.id}e`)) ??
    null
  );
};

/* ────────────────────────────────────────────────────────────────────────────
 * Página
 * ────────────────────────────────────────────────────────────────────────── */

interface DestinationRow {
  id: string;
  slug: string;
  name: string;
  country: string;
  subtitle: string | null;
  description: string | null;
  mainImage: string | null;
  profile: CityProfile | null;
  fromDb: boolean;
}

export default async function DestinosPage() {
  const { t, locale, lp, fill, localizedField } = await getServerI18n();

  const [destinations, media] = await Promise.all([
    prisma.destination.findMany({
      where: { isFeatured: true },
      orderBy: { sortOrder: 'asc' },
      take: 24,
      select: {
        id: true,
        slug: true,
        name: true,
        country: true,
        subtitle: true,
        description: true,
        descriptionEn: true,
        descriptionEs: true,
        mainImage: true,
      },
    }),
    getMediaMap().catch(() => ({}) as Record<string, string>),
  ]);

  /**
   * Degradação: sem `Destination` no banco, a página continua mostrando os
   * quatro destinos do catálogo (nome/descrição via i18n, imagem do slot de
   * mídia). Nunca fica vazia nem quebra.
   */
  const rows: DestinationRow[] =
    destinations.length > 0
      ? destinations.map((destination) => ({
          id: destination.id,
          slug: destination.slug,
          name: destination.name,
          country: destination.country,
          subtitle: destination.subtitle,
          description:
            localizedField({
              pt: destination.description,
              en: destination.descriptionEn,
              es: destination.descriptionEs,
            }) ?? destination.subtitle,
          mainImage: destination.mainImage,
          profile: matchProfile(destination.name, destination.slug),
          fromDb: true,
        }))
      : CITY_PROFILES.map((profile) => ({
          id: profile.id,
          slug: profile.id,
          name: t(profile.nameKey),
          country: t('destinos.hero.line2'),
          subtitle: null,
          description: t(profile.descriptionKey),
          mainImage: null,
          profile,
          fromDb: false,
        }));

  /**
   * O mapa é geografia, não conteúdo: se o banco não trouxe nenhuma das
   * cidades clássicas, mostramos as quatro âncoras para o desenho não quebrar.
   */
  const pinnedProfiles = CITY_PROFILES.filter((profile) =>
    rows.some((row) => row.profile?.id === profile.id),
  );
  const mapProfiles = (pinnedProfiles.length > 0 ? pinnedProfiles : [...CITY_PROFILES]).slice(0, 6);

  const heroDesktop = media.destinos_hero_desktop ?? '';
  const heroMobile = media.destinos_hero_mobile ?? '';
  const ctaBanner = media.destinos_cta_banner ?? '';

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t('destinos.cards.kicker'),
    numberOfItems: rows.length,
    itemListElement: rows.map((row, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'TouristDestination',
        name: row.name,
        description: row.description ?? undefined,
        url: localizedUrl(
          row.fromDb ? `/destinos/${row.slug}` : `/coreia-do-sul/experiencias?cidade=${row.slug}`,
          locale,
        ),
        ...(row.mainImage ? { image: siteUrl(row.mainImage) } : {}),
      },
    })),
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0F0A08] text-[#EFEBE4] font-sans selection:bg-[#C8A27C] selection:text-[#0F0A08]">
      <JsonLd id="destinos-itemlist-jsonld" data={itemListJsonLd} />

      <Header />

      {/* 1. Hero Section (LCP) */}
      <section
        aria-labelledby="destinos-hero-title"
        className="relative min-h-[100dvh] flex flex-col justify-center overflow-hidden border-b border-[#3D2620]"
      >
        <div className="absolute inset-0 z-0">
          <SmartImage
            src={heroDesktop}
            alt={t('destinos.heroImage.desktop')}
            fill
            className="object-cover object-center hidden md:block"
            sizes="100vw"
            priority
            quality={90}
            fallbackSrc={heroMobile}
            placeholderLabel={t('destinos.heroImage.desktop')}
          />
          <SmartImage
            src={heroMobile}
            alt={t('destinos.heroImage.mobile')}
            fill
            className="object-cover object-center block md:hidden"
            sizes="100vw"
            priority
            quality={90}
            fallbackSrc={heroDesktop}
            placeholderLabel={t('destinos.heroImage.mobile')}
          />
        </div>

        <div className="relative z-10 px-6 sm:px-12 max-w-[1400px] mx-auto w-full flex flex-col items-start gap-6 pt-20">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold">
            {t('destinos.hero.kicker')}
          </span>
          <h1
            id="destinos-hero-title"
            className="font-heading text-5xl sm:text-7xl font-light tracking-wide leading-tight text-white"
          >
            {t('destinos.hero.line1')} <br />
            {t('destinos.hero.line2')}
          </h1>
          <p className="text-[13px] text-gray-300 max-w-[400px] font-light leading-relaxed mt-2 opacity-90">
            {t('destinos.hero.description')}
          </p>
          <Link
            href={lp('/jornadas')}
            className="flex items-center justify-center gap-3 bg-transparent border border-[#3D2620] hover:border-[#C8A27C] text-[#C8A27C] font-bold text-[10px] py-4 px-8 mt-4 rounded-none transition-all group uppercase tracking-widest"
          >
            {t('destinos.cta.planJourney')}
            <ArrowRight aria-hidden className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Trilha visível + BreadcrumbList JSON-LD (evita o 404 do crawler) */}
      <div className="px-6 sm:px-12 max-w-[1400px] mx-auto w-full pt-8">
        <Breadcrumbs
          locale={locale}
          items={[{ name: t('destinos.detail.breadcrumb'), path: '/destinos' }]}
          className="text-gray-500"
        />
      </div>

      {/* 2. Mapa + lista de destinos */}
      <section aria-labelledby="destinos-list-title" className="py-20 px-6 sm:px-12 max-w-[1400px] mx-auto w-full">
        <div className="flex flex-col lg:flex-row gap-16">
          <div className="lg:w-1/3 flex flex-col relative">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-bold mb-6">
              {t('destinos.intro.kicker')}
            </span>
            <p className="text-[12px] text-gray-400 font-light leading-relaxed max-w-[280px] mb-12">
              {t('destinos.intro.description')}
            </p>

            <div className="relative w-full h-[500px] opacity-80">
              <div
                aria-hidden
                className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/e4/South_Korea_location_map.svg')] bg-contain bg-no-repeat bg-left-top opacity-10 filter invert sepia hue-rotate-[340deg] saturate-[300%]"
              />

              <ul aria-label={t('destinos.intro.kicker')}>
                {mapProfiles.map((profile, index) => {
                  const isPrimary = index === 0;
                  return (
                    <li
                      key={profile.id}
                      className="absolute flex items-center gap-3"
                      style={{ top: profile.point.top, left: profile.point.left }}
                    >
                      <span className="relative">
                        <span className="w-3 h-3 rounded-full border border-[#C8A27C] flex items-center justify-center">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${isPrimary ? 'bg-[#C8A27C]' : 'bg-[#C8A27C]/50'}`}
                          />
                        </span>
                        {isPrimary ? (
                          <span className="absolute -inset-2 rounded-full border border-[#C8A27C]/20 animate-ping" />
                        ) : null}
                      </span>
                      <span className="flex flex-col">
                        <span className="text-[10px] font-bold text-[#C8A27C] tracking-widest">
                          {t(profile.nameKey)}
                        </span>
                        <span className="text-[9px] text-gray-500">
                          {t(profile.pinKeys[0])}
                          <br />
                          {t(profile.pinKeys[1])}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>

              <svg aria-hidden className="absolute inset-0 w-full h-full" style={{ zIndex: -1 }}>
                <path
                  d="M 120 100 L 165 250 L 180 325"
                  fill="none"
                  stroke="#3D2620"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              </svg>

              <div className="absolute bottom-0 left-0">
                <Compass aria-hidden className="w-16 h-16 text-[#3D2620]" strokeWidth={1} />
                <span className="absolute top-[-10px] left-1/2 -translate-x-1/2 text-[8px] text-gray-600">
                  {t('destinos.compass.north')}
                </span>
                <span className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 text-[8px] text-gray-600">
                  {t('destinos.compass.south')}
                </span>
                <span className="absolute right-[-10px] top-1/2 -translate-y-1/2 text-[8px] text-gray-600">
                  {t('destinos.compass.east')}
                </span>
                <span className="absolute left-[-10px] top-1/2 -translate-y-1/2 text-[8px] text-gray-600">
                  {t('destinos.compass.west')}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:w-2/3 flex flex-col gap-6">
            <h2
              id="destinos-list-title"
              className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-bold mb-2"
            >
              {t('destinos.cards.kicker')}
            </h2>

            {rows.length === 0 ? (
              <p className="text-[12px] text-gray-400 font-light">{t('destinos.cards.empty')}</p>
            ) : (
              <ul className="flex flex-col gap-6">
                {rows.map((row) => {
                  const imageAlt = fill(t('destinos.card.imageAlt'), { city: row.name });
                  const href = row.fromDb
                    ? lp(`/destinos/${row.slug}`)
                    : lp(`/coreia-do-sul/experiencias?cidade=${row.slug}`);
                  return (
                    <li key={row.id}>
                      <Link
                        href={href}
                        className="group bg-[#150E0C] border border-[#3D2620] rounded-sm overflow-hidden flex flex-col md:flex-row hover:border-[#C8A27C]/50 transition-colors min-h-[220px]"
                      >
                        <div className="relative md:w-[40%] h-[200px] md:h-auto overflow-hidden">
                          <SmartImage
                            src={row.mainImage}
                            alt={imageAlt}
                            fill
                            sizes="(min-width: 768px) 27vw, 100vw"
                            quality={75}
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                            fallbackSrc={row.profile ? media[row.profile.slot] : media.destinos_card_fallback}
                            placeholderLabel={row.name}
                          />
                        </div>
                        <div className="p-8 md:w-[60%] flex flex-col relative">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-heading text-2xl text-white font-light uppercase tracking-wide group-hover:text-[#C8A27C] transition-colors">
                              {row.name}
                            </h3>
                            <span
                              aria-hidden
                              className="w-8 h-8 rounded-full border border-[#3D2620] group-hover:border-[#C8A27C] flex items-center justify-center transition-colors"
                            >
                              <ArrowRight className="w-3 h-3 text-gray-500 group-hover:text-[#C8A27C]" />
                            </span>
                          </div>
                          {row.subtitle ? (
                            <p className="text-[11px] text-[#C8A27C] font-medium mb-3">{row.subtitle}</p>
                          ) : null}
                          <p className="text-[12px] text-gray-400 font-light leading-relaxed mb-6 flex-1">
                            {row.description}
                          </p>
                          {row.profile && row.profile.features.length > 0 ? (
                            <ul className="grid grid-cols-4 gap-2 pt-4 border-t border-[#3D2620]">
                              {row.profile.features.map((feature) => (
                                <li key={feature.labelKey} className="flex flex-col items-center gap-2">
                                  <feature.Icon aria-hidden className="w-5 h-5 text-[#C8A27C]" strokeWidth={1.5} />
                                  <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest text-center">
                                    {t(feature.labelKey)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="inline-flex items-center gap-2 pt-4 border-t border-[#3D2620] text-[9px] font-bold uppercase tracking-widest text-[#C8A27C]">
                              {row.fromDb ? t('destinos.card.cta') : t('destinos.card.fallbackCta')}
                              <ArrowRight aria-hidden className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </span>
                          )}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* 3. Por que a Coreia do Sul */}
      <section
        aria-labelledby="destinos-why-title"
        className="py-16 px-6 sm:px-12 max-w-[1400px] mx-auto w-full border-t border-[#3D2620]"
      >
        <div className="text-center mb-12">
          <span
            id="destinos-why-title"
            className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-bold"
          >
            {t('destinos.why.kicker')}
          </span>
        </div>

        <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 text-center">
          {[
            {
              Icon: Heart,
              title: t('destinos.why.items.1title'),
              lines: [t('destinos.why.items.1line1'), t('destinos.why.items.1line2'), t('destinos.why.items.1line3')],
            },
            {
              Icon: Camera,
              title: t('destinos.why.items.2title'),
              lines: [t('destinos.why.items.2line1'), t('destinos.why.items.2line2'), t('destinos.why.items.2line3')],
            },
            {
              Icon: Leaf,
              title: t('destinos.why.items.3title'),
              lines: [t('destinos.why.items.3line1'), t('destinos.why.items.3line2'), t('destinos.why.items.3line3')],
            },
            {
              Icon: Utensils,
              title: t('destinos.why.items.4title'),
              lines: [t('destinos.why.items.4line1'), t('destinos.why.items.4line2'), t('destinos.why.items.4line3')],
            },
            {
              Icon: ShoppingBag,
              title: t('destinos.why.items.5title'),
              lines: [t('destinos.why.items.5line1'), t('destinos.why.items.5line2'), t('destinos.why.items.5line3')],
            },
            {
              Icon: Star,
              title: t('destinos.why.items.6title'),
              lines: [t('destinos.why.items.6line1'), t('destinos.why.items.6line2'), t('destinos.why.items.6line3')],
            },
          ].map((item) => (
            <li key={item.title} className="flex flex-col items-center gap-4">
              <item.Icon aria-hidden className="w-8 h-8 text-[#C8A27C]" strokeWidth={1} />
              <span className="flex flex-col">
                <span className="text-[11px] text-white font-bold mb-2">{item.title}</span>
                <span className="text-[10px] text-gray-400 font-light leading-relaxed">
                  {item.lines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* 4. CTA final */}
      <section aria-labelledby="destinos-cta-title" className="py-12 px-6 sm:px-12 max-w-[1400px] mx-auto w-full">
        <div className="relative w-full border border-[#3D2620] overflow-hidden rounded-sm flex flex-col md:flex-row bg-[#150E0C]">
          <div className="absolute inset-0 z-0">
            <SmartImage
              src={ctaBanner}
              alt={t('destinos.why.items.6example')}
              fill
              sizes="100vw"
              quality={75}
              className="object-cover object-center"
              placeholderLabel={t('destinos.why.items.6example')}
            />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-[#0F0A08] via-[#0F0A08]/90 to-transparent w-full md:w-2/3" />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0F0A08]/20 to-[#0F0A08]/80" />
          </div>

          <div className="w-full md:w-[60%] flex flex-col items-start justify-center text-left p-10 md:p-16 gap-6 relative z-10">
            <h2 id="destinos-cta-title" className="font-heading text-4xl sm:text-5xl font-light text-white leading-[1.1]">
              {t('destinos.cta.line1')} <br />
              <span className="italic text-[#C8A27C]">{t('destinos.cta.line2')}</span>
            </h2>
            <p className="text-[13px] text-gray-300 font-light max-w-md leading-relaxed">
              {t('destinos.cta.description')}
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-6 mt-4 w-full sm:w-auto">
              <Link
                href={lp('/contato')}
                className="flex items-center justify-center gap-3 bg-[#C8A27C] hover:bg-[#B8906C] text-[#0F0A08] font-bold text-[10px] py-4 px-8 rounded-none transition-all group uppercase tracking-widest w-full sm:w-auto"
              >
                {t('destinos.cta.requestPlanning')}
                <ArrowRight aria-hidden className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href={lp('/jornadas')}
                className="flex items-center justify-center bg-transparent border border-[#3D2620] hover:border-[#C8A27C] text-[#C8A27C] font-bold text-[10px] py-4 px-8 rounded-none transition-all uppercase tracking-widest w-full sm:w-auto"
              >
                {t('destinos.cta.discoverJourneys')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Information strip */}
      <section
        aria-label={t('destinos.features.support.title')}
        className="bg-[#150E0C] border-t border-b border-[#3D2620] py-8 px-6"
      >
        <ul className="max-w-[1400px] mx-auto grid grid-cols-2 md:grid-cols-5 gap-6 opacity-80">
          {[
            {
              Icon: ShieldCheck,
              title: t('destinos.seguranca'),
              lines: [t('destinos.features.support.line1'), t('destinos.features.support.line2')],
            },
            {
              Icon: Headphones,
              title: `${t('destinos.features.consulting.title')} ${t('destinos.features.consulting.subtitle')}`,
              lines: [t('destinos.features.consulting.line1'), t('destinos.features.consulting.line2')],
            },
            {
              Icon: Calendar,
              title: `${t('destinos.features.itineraries.title')} ${t('destinos.features.itineraries.subtitle')}`,
              lines: [t('destinos.features.itineraries.line1'), t('destinos.features.itineraries.line2')],
            },
            {
              Icon: Heart,
              title: `${t('destinos.features.partners.title')} ${t('destinos.features.partners.subtitle')}`,
              lines: [t('destinos.features.partners.line1'), t('destinos.features.partners.line2')],
            },
            {
              Icon: Award,
              title: `${t('destinos.features.cta.title')} ${t('destinos.why.items.1line3-x')}`,
              lines: [t('destinos.features.cta.line1'), t('destinos.features.cta.line2')],
            },
          ].map((item) => (
            <li key={item.title} className="flex items-start gap-4">
              <item.Icon aria-hidden className="w-6 h-6 text-[#C8A27C] shrink-0" strokeWidth={1.5} />
              <span className="flex flex-col">
                <span className="text-[10px] text-white font-bold mb-1">{item.title}</span>
                <span className="text-[9px] text-gray-400">
                  {item.lines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <Footer />
    </div>
  );
}