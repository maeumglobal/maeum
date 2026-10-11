import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Calendar,
  Users,
  Heart,
  Award,
  ShieldCheck,
  Headphones,
  Compass,
  Star,
  MapPin,
  Quote,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TripPlanner from '@/components/TripPlanner';
import SmartImage from '@/components/SmartImage';
import JsonLd from '@/components/seo/JsonLd';
import { prisma } from '@/lib/prisma';
import { getMediaMap } from '@/lib/cmsData';
import { getServerI18n } from '@/lib/serverI18n';
import { parseStringArray } from '@/lib/validate';
import {
  HOME_SEO,
  buildMetadata,
  faqJsonLd,
  truncateMeta,
  type Locale,
} from '@/lib/seo';

/* ────────────────────────────────────────────────────────────────────────────
 * SEO
 * ────────────────────────────────────────────────────────────────────────── */

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getServerI18n();
  const home = HOME_SEO[locale as Locale];
  return buildMetadata({
    title: truncateMeta(t('home.seo.title'), 60) || home.title,
    description: t('home.seo.description') || home.description,
    path: '/',
    locale,
    image: '/images/agencia-viagens-coreia-do-sul-maeum-global-oficial.webp',
  });
}

/* ────────────────────────────────────────────────────────────────────────────
 * Consultas — tudo vem do Prisma; nenhum conteúdo editorial hardcoded.
 * ────────────────────────────────────────────────────────────────────────── */

const JOURNEY_SELECT = {
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
  destinations: true,
  durationDays: true,
  pricePerPerson: true,
  priceCurrency: true,
  mainImage: true,
  category: true,
  isFeatured: true,
} as const;

const EXPERIENCE_SELECT = {
  id: true,
  slug: true,
  title: true,
  titleEn: true,
  titleEs: true,
  subtitle: true,
  subtitleEn: true,
  subtitleEs: true,
  highlights: true,
  highlightsEn: true,
  highlightsEs: true,
  durationHours: true,
  pricePerPerson: true,
  priceCurrency: true,
  city: true,
  mainImage: true,
} as const;

export default async function HomePage() {
  const { t, lp, formatCurrency, formatNumber, fill, localizedField } = await getServerI18n();

  /**
   * Uma única ida ao banco para a página inteira, em paralelo. Cada `findMany`
   * tem `take` + `select`: a home nunca carrega o catálogo completo.
   */
  const [journeys, experiences, destinations, testimonials, faqs, media] = await Promise.all([
    prisma.journey.findMany({
      where: { status: 'active' },
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
      take: 3,
      select: JOURNEY_SELECT,
    }),
    prisma.experience.findMany({
      where: { status: 'active' },
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
      take: 8,
      select: EXPERIENCE_SELECT,
    }),
    prisma.destination.findMany({
      where: { isFeatured: true },
      orderBy: { sortOrder: 'asc' },
      take: 4,
      select: {
        id: true,
        slug: true,
        name: true,
        country: true,
        subtitle: true,
        mainImage: true,
      },
    }),
    prisma.testimonial.findMany({
      where: { status: 'approved' },
      orderBy: { sortOrder: 'asc' },
      take: 6,
      select: { id: true, name: true, destination: true, text: true, rating: true, avatarUrl: true },
    }),
    prisma.faqItem.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      take: 8,
      select: { id: true, question: true, answer: true, category: true },
    }),
    // Degradação: se o CMS cair, `getMediaMap` devolve os fallbacks estáticos.
    getMediaMap().catch(() => ({}) as Record<string, string>),
  ]);

  const heroDesktop = media.home_hero_desktop ?? '';
  const heroMobile = media.home_hero_mobile ?? '';
  const partnershipImage = media.home_partnership_image ?? '';
  const journeyFallbacks = [
    media.home_card_1_army,
    media.home_card_2_horizon,
    media.home_card_3_cheotnun,
  ];

  /* ── JSON-LD ───────────────────────────────────────────────────────────── */

  const journeysJsonLd =
    journeys.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: t('home.journeys.kicker'),
          itemListElement: journeys.map((journey, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'TouristTrip',
              name: localizedField({ pt: journey.title, en: journey.titleEn, es: journey.titleEs }) ?? journey.title,
              description: truncateMeta(
                localizedField({
                  pt: journey.concept,
                  en: journey.conceptEn,
                  es: journey.conceptEs,
                }) ?? journey.subtitle ?? '',
                300,
              ),
              url: lp(`/coreia-do-sul/jornadas/${journey.slug}`),
              ...(journey.durationDays > 0 ? { duration: `P${journey.durationDays}D` } : {}),
            },
          })),
        }
      : null;

  const faqJsonLdBlock = faqs.length > 0 ? faqJsonLd(faqs.map((faq) => ({ question: faq.question, answer: faq.answer }))) : null;

  /* ── Render ────────────────────────────────────────────────────────────── */

  return (
    <div className="flex flex-col min-h-screen bg-[#0F0A08] text-[#EFEBE4] font-sans selection:bg-[#C8A27C] selection:text-[#0F0A08]">
      {journeysJsonLd ? <JsonLd id="home-journeys-jsonld" data={journeysJsonLd} /> : null}
      {faqJsonLdBlock ? <JsonLd id="home-faq-jsonld" data={faqJsonLdBlock} /> : null}

      <Header />

      {/* 1. Hero Section (LCP) */}
      <section
        aria-labelledby="home-hero-title"
        className="relative min-h-[100dvh] flex flex-col justify-center overflow-hidden border-b border-[#3D2620]"
      >
        <div className="absolute inset-0 z-0">
          <SmartImage
            src={heroDesktop}
            alt={t('home.imageAlt.journeyDefault')}
            fill
            className="object-cover object-center hidden md:block"
            sizes="100vw"
            priority
            quality={90}
            fallbackSrc={heroMobile}
            placeholderLabel={t('home.imageAlt.journeyDefault')}
          />
          <SmartImage
            src={heroMobile}
            alt={t('home.imageAlt.journeyDefault')}
            fill
            className="object-cover object-center block md:hidden"
            sizes="100vw"
            priority
            quality={90}
            fallbackSrc={heroDesktop}
            placeholderLabel={t('home.imageAlt.journeyDefault')}
          />
        </div>

        <div className="relative z-10 px-6 sm:px-12 max-w-[1400px] mx-auto w-full flex flex-col items-start gap-5 pt-32 sm:pt-36 md:pt-40 pb-36 sm:pb-44 md:pb-52">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold">
            {t('home.hero.kicker')}
          </span>
          <h1
            id="home-hero-title"
            className="font-heading text-5xl sm:text-6xl md:text-[80px] font-light tracking-wide leading-[1.1] text-white"
          >
            {t('home.hero.slogan1')} <br />
            {t('home.hero.slogan2')}<br />
            <span className="italic text-[#C8A27C]">{t('home.hero.slogan3')}</span>
          </h1>
          <p className="text-[13px] text-gray-300 max-w-[500px] font-light text-left leading-relaxed opacity-90 mt-4">
            {t('home.hero.description')} <br />
            {t('home.hero.line1')}<br />
            {t('home.hero.line2')}
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-6 mt-6">
            <Link
              href={lp('/experiencias')}
              className="flex items-center justify-center gap-3 bg-[#C8A27C] hover:bg-[#B8906C] text-[#0F0A08] font-bold text-[10px] py-4 px-8 rounded-none transition-all group uppercase tracking-widest"
            >
              {t('home.hero.ctaExplore')}
              <ArrowRight aria-hidden className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href={lp('/sobre')}
              className="text-[10px] text-white hover:text-[#C8A27C] font-bold uppercase tracking-widest border-b border-white/30 hover:border-[#C8A27C] pb-1 transition-colors"
            >
              {t('home.hero.ctaAbout')}
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Planning Box */}
      <section
        aria-labelledby="home-planner-title"
        className="relative z-20 px-6 sm:px-12 max-w-[1400px] mx-auto w-full -mt-20 sm:-mt-24 lg:-mt-28 mb-24"
      >
        <div className="bg-[#150E0C] border border-[#3D2620] rounded-sm p-8 sm:p-12 flex flex-col shadow-2xl">
          <div className="flex flex-col lg:flex-row gap-12 mb-10">
            <div className="lg:w-1/3 flex flex-col gap-4">
              <h2
                id="home-planner-title"
                className="font-heading text-3xl sm:text-4xl font-light text-white leading-tight"
              >
                {t('home.planner.title')}
              </h2>
              <p className="text-[12px] text-gray-400 font-light mt-4 leading-relaxed">
                {t('home.planner.subtitle')}
              </p>
            </div>

            <div className="lg:w-2/3">
              <TripPlanner />
            </div>
          </div>

          <ul className="border-t border-[#3D2620] pt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { Icon: Award, title: t('home.pillars.local.title'), description: t('home.pillars.local.description') },
              { Icon: ShieldCheck, title: t('home.pillars.itinerary.title'), description: t('home.pillars.itinerary.description') },
              { Icon: Headphones, title: t('home.pillars.support.title'), description: t('home.pillars.support.description') },
              { Icon: Heart, title: t('home.pillars.authentic.title'), description: t('home.pillars.authentic.description') },
            ].map((pillar) => (
              <li key={pillar.title} className="flex items-start gap-4">
                <pillar.Icon aria-hidden className="w-8 h-8 text-[#C8A27C] shrink-0 stroke-[1.5]" />
                <span className="flex flex-col">
                  <span className="text-[10px] text-white font-bold mb-1">{pillar.title}</span>
                  <span className="text-[10px] text-gray-400 leading-snug">{pillar.description}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 3. Jornadas em destaque — `Journey` */}
      <section aria-labelledby="home-journeys-title" className="py-16 px-6 sm:px-12 max-w-[1400px] mx-auto w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-12">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold">
              {t('home.journeys.kicker')}
            </span>
            <h2
              id="home-journeys-title"
              className="font-heading text-4xl sm:text-5xl font-light text-white leading-tight"
            >
              {t('home.journeys.line1')} <br />
              <span className="italic text-[#C8A27C]">{t('home.journeys.line2')}</span> {t('home.journeys.line3')}
            </h2>
          </div>
          <Link
            href={lp('/jornadas')}
            className="flex items-center justify-center gap-3 bg-transparent border border-[#3D2620] hover:border-[#C8A27C] text-[#C8A27C] font-bold text-[10px] py-3.5 px-6 rounded-none transition-all group uppercase tracking-widest shrink-0"
          >
            {t('home.journeys.cta')}
            <ArrowRight aria-hidden className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {journeys.length === 0 ? (
          <p className="text-[12px] text-gray-400 font-light border border-[#3D2620] bg-[#150E0C] rounded-sm p-8">
            {t('home.journeys.empty')}
          </p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {journeys.map((journey, index) => {
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
              const route = parseStringArray(journey.destinations).join(' • ');
              const badge = journey.isFeatured
                ? t('home.journeys.badge.mostChosen')
                : journey.category === 'army'
                  ? t('home.journeys.badge.exclusive')
                  : t('home.journeys.badge.new');
              const tag =
                journey.category === 'army'
                  ? t('home.journeys.tag.exclusiveGroups')
                  : journey.category === 'essence'
                    ? t('home.journeys.tag.intimateTrip')
                    : t('home.journeys.tag.immersiveExperience');
              const imageAlt =
                index === 0
                  ? t('home.imageAlt.journeyArmy')
                  : index === 1
                    ? t('home.imageAlt.journeyHorizon')
                    : index === 2
                      ? t('home.imageAlt.journeyCheotnun')
                      : t('home.imageAlt.journeyDefault');

              return (
                <li key={journey.id}>
                  <Link
                    href={lp(`/coreia-do-sul/jornadas/${journey.slug}`)}
                    className="group border border-[#3D2620] rounded-sm overflow-hidden flex flex-col h-full bg-[#150E0C] hover:border-[#C8A27C]/50 transition-colors"
                  >
                    <div className="relative h-[240px] w-full overflow-hidden">
                      <SmartImage
                        src={journey.mainImage}
                        alt={imageAlt}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                        quality={75}
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        fallbackSrc={journeyFallbacks[index] ?? media.home_journey_fallback}
                        placeholderLabel={title}
                      />
                      <span className="absolute top-4 left-4 bg-[#C8A27C] text-[#0F0A08] text-[9px] font-bold px-3 py-1.5 uppercase tracking-widest">
                        {badge}
                      </span>
                    </div>
                    <div className="p-8 flex flex-col flex-1">
                      <div className="flex items-center gap-2 text-[10px] text-[#C8A27C] font-bold uppercase tracking-widest mb-4">
                        <Users aria-hidden className="w-3 h-3" /> {tag}
                      </div>
                      <h3 className="font-heading text-2xl text-white font-light mb-4 group-hover:text-[#C8A27C] transition-colors">
                        {title}
                      </h3>
                      {subtitle ? (
                        <p className="text-[10px] uppercase tracking-widest text-[#C8A27C]/80 font-medium mb-4">
                          {subtitle}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-400 font-bold tracking-widest mb-6">
                        {journey.durationDays > 0 ? (
                          <>
                            <span className="flex items-center gap-1">
                              <Calendar aria-hidden className="w-3 h-3" />
                              {fill(t('home.journeys.days'), { n: journey.durationDays })}
                            </span>
                            {route ? <span className="text-[#3D2620]">|</span> : null}
                          </>
                        ) : null}
                        {route ? (
                          <span className="flex items-center gap-1">
                            <MapPin aria-hidden className="w-3 h-3" /> {route}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[12px] text-gray-400 font-light leading-relaxed mb-8 flex-1">
                        {truncateMeta(concept ?? subtitle ?? '', 220)}
                      </p>
                      <div className="flex items-center justify-between text-[#C8A27C] font-bold text-[10px] tracking-widest uppercase">
                        <span>
                          {t('home.journeys.priceFrom')}{' '}
                          {journey.pricePerPerson > 0
                            ? fill(t('home.journeys.pricePerPerson'), {
                                price: formatCurrency(journey.pricePerPerson, journey.priceCurrency),
                              })
                            : t('home.journeys.viewDetails')}
                        </span>
                        <ArrowRight aria-hidden className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* 4. Destinos — `Destination` */}
      {destinations.length > 0 ? (
        <section
          aria-labelledby="home-destinations-title"
          className="py-16 px-6 sm:px-12 max-w-[1400px] mx-auto w-full border-t border-[#3D2620]"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-12">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold">
                {t('home.destinations.kicker')}
              </span>
              <h2
                id="home-destinations-title"
                className="font-heading text-4xl sm:text-5xl font-light text-white leading-tight"
              >
                {t('home.destinations.title')}
              </h2>
            </div>
            <Link
              href={lp('/destinos')}
              className="flex items-center justify-center gap-3 bg-transparent border border-[#3D2620] hover:border-[#C8A27C] text-[#C8A27C] font-bold text-[10px] py-3.5 px-6 rounded-none transition-all group uppercase tracking-widest shrink-0"
            >
              {t('home.destinations.viewAll')}
              <ArrowRight aria-hidden className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {destinations.map((destination) => (
              <li key={destination.id}>
                <Link
                  href={lp(`/destinos/${destination.slug}`)}
                  className="group relative flex flex-col h-full min-h-[280px] overflow-hidden rounded-sm border border-[#3D2620] hover:border-[#C8A27C]/50 transition-colors"
                >
                  <SmartImage
                    src={destination.mainImage}
                    alt={fill(t('destinos.card.imageAlt'), { city: destination.name })}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    quality={75}
                    className="object-cover"
                    fallbackSrc={media[`destinos_card_${destination.slug}`] ?? media.destinos_card_fallback}
                    placeholderLabel={destination.name}
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-[#0F0A08] via-[#0F0A08]/60 to-transparent" aria-hidden />
                  <span className="relative z-10 mt-auto p-6 flex flex-col gap-1">
                    <span className="text-[9px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold">
                      {destination.country}
                    </span>
                    <span className="font-heading text-2xl uppercase tracking-wide text-white">
                      {destination.name}
                    </span>
                    {destination.subtitle ? (
                      <span className="text-[11px] text-gray-300 font-light">{destination.subtitle}</span>
                    ) : null}
                    <span className="mt-3 inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-[#C8A27C]">
                      {t('home.destinations.cardCta')}
                      <ArrowRight aria-hidden className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* 5. Experiências em destaque — `Experience` */}
      {experiences.length > 0 ? (
        <section
          aria-labelledby="home-experiences-title"
          className="py-16 px-6 sm:px-12 max-w-[1400px] mx-auto w-full border-t border-[#3D2620]"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 mb-12">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold">
                {t('home.experiences.kicker')}
              </span>
              <h2
                id="home-experiences-title"
                className="font-heading text-4xl sm:text-5xl font-light text-white leading-tight"
              >
                {t('home.experiences.title')}
              </h2>
              <p className="text-[12px] text-gray-400 font-light max-w-xl leading-relaxed">
                {t('home.experiences.description')}
              </p>
            </div>
            <Link
              href={lp('/experiencias')}
              className="flex items-center justify-center gap-3 bg-transparent border border-[#3D2620] hover:border-[#C8A27C] text-[#C8A27C] font-bold text-[10px] py-3.5 px-6 rounded-none transition-all group uppercase tracking-widest shrink-0"
            >
              {t('home.experiences.viewAll')}
              <ArrowRight aria-hidden className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {experiences.map((experience) => {
              const title =
                localizedField({ pt: experience.title, en: experience.titleEn, es: experience.titleEs }) ??
                experience.title;
              const highlights = parseStringArray(
                localizedField({
                  pt: experience.highlights,
                  en: experience.highlightsEn,
                  es: experience.highlightsEs,
                }),
              ).slice(0, 3);

              return (
                <li
                  key={experience.id}
                  className="bg-[#261514] border border-[#3D2620] flex flex-col overflow-hidden group hover:border-[#C8A27C]/40 transition-colors"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <SmartImage
                      src={experience.mainImage}
                      alt={title}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      quality={75}
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      fallbackSrc={media.home_experiences_fallback}
                      placeholderLabel={title}
                    />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-heading text-sm font-semibold text-white mb-1 uppercase tracking-wider">
                      {title}
                    </h3>
                    <p className="text-[9px] text-[#C8A27C] uppercase tracking-widest mb-4 font-medium flex items-center gap-1">
                      <MapPin aria-hidden className="w-3 h-3" /> {experience.city}
                    </p>
                    {highlights.length > 0 ? (
                      <ul className="text-[9px] text-gray-400 space-y-2 mb-6 flex-1 font-light">
                        {highlights.map((highlight) => (
                          <li key={highlight}>+ {highlight}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="flex-1" />
                    )}
                    <div className="mt-auto border-t border-[#3D2620] pt-4 flex items-center justify-between">
                      <span className="text-[9px] text-gray-400 font-medium">
                        {fill(t('home.experiences.hours'), { n: formatNumber(experience.durationHours) })}
                      </span>
                      <span className="text-right">
                        <span className="block text-[8px] text-gray-500 uppercase tracking-widest mb-0.5">
                          {t('experiencias.grid.priceFrom')}
                        </span>
                        <span className="font-heading text-sm text-white font-semibold">
                          {formatCurrency(experience.pricePerPerson, experience.priceCurrency)}
                        </span>
                      </span>
                    </div>
                    <Link
                      href={lp(`/coreia-do-sul/experiencias/${experience.slug}`)}
                      className="mt-4 w-full block bg-transparent border border-[#3D2620] hover:bg-[#3D2620] hover:text-white text-[#C8A27C] transition-colors py-2.5 text-[8px] font-bold uppercase tracking-widest rounded-sm text-center"
                    >
                      {t('home.experiences.book')}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <p className="px-6 sm:px-12 max-w-[1400px] mx-auto w-full pb-12 text-[12px] text-gray-400 font-light">
          {t('home.experiences.empty')}
        </p>
      )}

      {/* 6. Depoimentos — `Testimonial` */}
      <section
        aria-labelledby="home-testimonials-title"
        className="py-20 px-6 sm:px-12 max-w-[1400px] mx-auto w-full border-t border-[#3D2620]"
      >
        <div className="flex flex-col gap-2 mb-12">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold">
            {t('home.testimonials.kicker')}
          </span>
          <h2
            id="home-testimonials-title"
            className="font-heading text-4xl sm:text-5xl font-light text-white leading-tight"
          >
            {t('home.testimonials.title')}
          </h2>
        </div>

        {testimonials.length === 0 ? (
          <p className="text-[12px] text-gray-400 font-light">{t('home.testimonials.empty')}</p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testimonials.map((testimonial) => (
              <li
                key={testimonial.id}
                className="bg-[#150E0C] border border-[#3D2620] rounded-sm p-7 flex flex-col gap-4 h-full"
              >
                <Quote aria-hidden className="w-6 h-6 text-[#C8A27C] shrink-0" />
                <p className="text-[12px] text-gray-300 font-light leading-relaxed flex-1">
                  {testimonial.text}
                </p>
                <div className="flex items-center gap-4 pt-4 border-t border-[#3D2620]">
                  <span className="relative w-11 h-11 rounded-full overflow-hidden shrink-0 bg-[#261514]">
                    <SmartImage
                      src={testimonial.avatarUrl}
                      alt={fill(t('home.testimonials.avatarAlt'), { name: testimonial.name })}
                      fill
                      sizes="44px"
                      quality={75}
                      className="object-cover"
                      fallbackSrc={media.sobre_avatar_fallback}
                      placeholderLabel={testimonial.name}
                    />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-[11px] font-bold text-white">{testimonial.name}</span>
                    {testimonial.destination ? (
                      <span className="text-[9px] uppercase tracking-widest text-[#C8A27C]">
                        {testimonial.destination}
                      </span>
                    ) : null}
                  </span>
                  <span
                    className="ml-auto flex items-center gap-1 text-[10px] font-bold text-[#C8A27C]"
                    aria-label={fill(t('home.testimonials.ratingLabel'), {
                      n: formatNumber(testimonial.rating, { maximumFractionDigits: 0 }),
                    })}
                  >
                    <Star aria-hidden className="w-3 h-3" />
                    {formatNumber(testimonial.rating, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 7. Perguntas frequentes — `FaqItem` */}
      {faqs.length > 0 ? (
        <section
          aria-labelledby="home-faq-title"
          className="py-20 px-6 sm:px-12 max-w-[1400px] mx-auto w-full border-t border-[#3D2620]"
        >
          <div className="flex flex-col gap-2 mb-12">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold">
              {t('home.faq.kicker')}
            </span>
            <h2 id="home-faq-title" className="font-heading text-4xl sm:text-5xl font-light text-white leading-tight">
              {t('home.faq.title')}
            </h2>
          </div>

          <ul className="max-w-3xl flex flex-col gap-3">
            {faqs.map((faq) => (
              <li key={faq.id} className="bg-[#150E0C] border border-[#3D2620] rounded-sm">
                <details className="group">
                  <summary className="cursor-pointer list-none flex items-start gap-4 px-7 py-5 text-[12px] font-bold text-white hover:text-[#C8A27C] transition-colors">
                    <span className="flex-1">{faq.question}</span>
                    <span aria-hidden className="text-[#C8A27C] text-base leading-none mt-[-2px]">
                      +
                    </span>
                  </summary>
                  <p className="px-7 pb-6 -mt-1 text-[12px] text-gray-400 font-light leading-relaxed">
                    {faq.answer}
                  </p>
                </details>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* 8. Parceria Cheotnun (identidade editorial da home) */}
      <section aria-labelledby="home-partnership-title" className="py-24 px-6 sm:px-12 max-w-[1400px] mx-auto w-full">
        <div className="border border-[#3D2620] bg-[#150E0C] rounded-sm flex flex-col">
          <div className="flex flex-col lg:flex-row">
            <div className="p-10 sm:p-16 flex-1 flex flex-col justify-center">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-bold mb-4">
                {t('home.cheotnun.kicker')}
              </span>
              <h2 id="home-partnership-title" className="font-heading text-3xl sm:text-4xl font-light text-white mb-2">
                {t('home.cheotnun.title')}
              </h2>
              <p className="font-heading text-2xl font-light text-[#C8A27C] italic mb-6">
                {t('home.cheotnun.tagline')}
              </p>
              <p className="text-[12px] text-gray-400 font-light leading-relaxed max-w-lg mb-10">
                {t('home.cheotnun.description')}
              </p>
              <div className="flex items-center gap-8">
                <div className="flex flex-col items-center gap-2">
                  <SmartImage
                    src={media.site_logo}
                    alt={t('home.imageAlt.maeumLogo')}
                    width={90}
                    height={40}
                    sizes="90px"
                    quality={90}
                    className="h-10 w-auto object-contain"
                    fallbackSrc="/images/logo.png"
                  />
                  <span className="text-[9px] tracking-[0.2em] text-[#C8A27C] uppercase font-bold">
                    {t('home.footer.brand.maeum')}
                  </span>
                </div>
                <span aria-hidden className="text-[#3D2620] text-2xl font-light">
                  {t('home.partnership.separator')}
                </span>
                <div className="flex flex-col items-center gap-2">
                  <SmartImage
                    src="/images/cheotnun-k-beauty-logo-oficial.webp"
                    alt={t('home.imageAlt.cheotnunLogo')}
                    width={120}
                    height={40}
                    sizes="120px"
                    quality={90}
                    className="h-10 w-auto object-contain"
                  />
                  <span className="text-[9px] tracking-[0.2em] text-gray-500 uppercase">
                    {t('home.k-beauty-experience')}
                  </span>
                </div>
              </div>
            </div>
            <div className="lg:w-[45%] relative min-h-[400px] lg:min-h-auto border-l border-[#3D2620]">
              <SmartImage
                src={partnershipImage}
                alt={t('home.imageAlt.partnership')}
                fill
                sizes="(min-width: 1024px) 45vw, 100vw"
                quality={75}
                className="object-cover"
                placeholderLabel={t('home.imageAlt.partnership')}
              />
            </div>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-[#3D2620]">
            {[
              { Icon: Compass, title: t('home.cheotnun.item1Title'), description: t('home.cheotnun.item1Description') },
              { Icon: ShieldCheck, title: t('home.cheotnun.item2Title'), description: t('home.cheotnun.item2Description') },
              { Icon: Award, title: t('home.cheotnun.item3Title'), description: t('home.cheotnun.item3Description') },
              { Icon: Star, title: t('home.cheotnun.item4Title'), description: t('home.cheotnun.item4Description') },
            ].map((item) => (
              <li
                key={item.title}
                className="p-8 border-b sm:border-b-0 sm:border-r border-[#3D2620] flex flex-col items-center text-center gap-3"
              >
                <item.Icon aria-hidden className="w-6 h-6 text-[#C8A27C]" strokeWidth={1.5} />
                <span className="text-[9px] font-bold text-[#C8A27C] uppercase tracking-widest">{item.title}</span>
                <span className="text-[10px] text-gray-400 font-light leading-relaxed">{item.description}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Footer />
    </div>
  );
}