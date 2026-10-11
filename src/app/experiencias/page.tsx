import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  CalendarCheck,
  Calendar,
  Users,
  Award,
  MessageSquare,
  Star,
  Clock,
  Check,
  HeartHandshake,
  ShieldCheck,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SmartImage from '@/components/SmartImage';
import JsonLd from '@/components/seo/JsonLd';
import { prisma } from '@/lib/prisma';
import { getMediaMap } from '@/lib/cmsData';
import { getServerI18n } from '@/lib/serverI18n';
import { parseStringArray } from '@/lib/validate';
import { buildMetadata, siteUrl, truncateMeta } from '@/lib/seo';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const WHATSAPP_NUMBER = '5541987094799';

const firstValue = (value: string | string[] | undefined): string =>
  (Array.isArray(value) ? value[0] : value)?.trim() ?? '';

/* ────────────────────────────────────────────────────────────────────────────
 * SEO
 * ────────────────────────────────────────────────────────────────────────── */

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getServerI18n();
  return buildMetadata({
    title: truncateMeta(t('experiencias.seo.title'), 60),
    description: t('experiencias.seo.description'),
    path: '/experiencias',
    locale,
    image: '/images/agencia-viagens-coreia-do-sul-maeum-global-experiencias.webp',
    imageAlt: t('experiencias.heroImage.desktop'),
  });
}

/* ────────────────────────────────────────────────────────────────────────────
 * Página
 * ────────────────────────────────────────────────────────────────────────── */

export default async function ExperienciasPage({ searchParams }: PageProps) {
  const { t, locale, lp, formatCurrency, formatNumber, fill, localizedField } = await getServerI18n();

  const query = await searchParams;
  const activeCategory = firstValue(query.categoria);
  const activeCity = firstValue(query.cidade);
  const search = firstValue(query.q).slice(0, 60);

  /**
   * `ExperienceCategory` só é populado pelo `aplicar.sql`. Quando o vínculo não
   * existe, o filtro de categoria simplesmente devolve 0 itens — por isso o
   * estado vazio tem link para "limpar filtros" e nunca lança.
   */
  const where = {
    status: 'active',
    ...(activeCategory
      ? { categories: { some: { category: { slug: activeCategory } } } }
      : {}),
    ...(activeCity ? { city: { equals: activeCity, mode: 'insensitive' as const } } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { titleEn: { contains: search, mode: 'insensitive' as const } },
            { titleEs: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [experiences, categories, cityRows, media] = await Promise.all([
    prisma.experience.findMany({
      where,
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
      take: 60,
      select: {
        id: true,
        slug: true,
        title: true,
        titleEn: true,
        titleEs: true,
        subtitle: true,
        subtitleEn: true,
        subtitleEs: true,
        description: true,
        descriptionEn: true,
        descriptionEs: true,
        highlights: true,
        highlightsEn: true,
        highlightsEs: true,
        durationHours: true,
        pricePerPerson: true,
        priceCurrency: true,
        city: true,
        mainImage: true,
        categories: { select: { category: { select: { id: true, slug: true, name: true } } } },
      },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      take: 24,
      select: { id: true, slug: true, name: true, nameEn: true, nameEs: true },
    }),
    prisma.experience
      .findMany({
        where: { status: 'active' },
        distinct: ['city'],
        orderBy: { city: 'asc' },
        take: 30,
        select: { city: true },
      })
      .catch(() => [] as { city: string }[]),
    getMediaMap().catch(() => ({}) as Record<string, string>),
  ]);

  const cities = cityRows.map((row) => row.city).filter((city) => city.length > 0);
  const hasFilters = Boolean(activeCategory || activeCity || search);

  /** Monta `/experiencias?…` preservando os filtros já ativos. */
  const filterHref = (patch: { categoria?: string; cidade?: string; q?: string }): string => {
    const params = new URLSearchParams();
    const next = {
      categoria: patch.categoria !== undefined ? patch.categoria : activeCategory,
      cidade: patch.cidade !== undefined ? patch.cidade : activeCity,
      q: patch.q !== undefined ? patch.q : search,
    };
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
    }
    const qs = params.toString();
    return lp(qs ? `/experiencias?${qs}` : '/experiencias');
  };

  const heroDesktop = media.experiencias_hero_desktop ?? '';
  const heroMobile = media.experiencias_hero_mobile ?? '';

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t('experiencias.grid.kicker'),
    numberOfItems: experiences.length,
    itemListElement: experiences.map((experience, index) => {
      const title =
        localizedField({
          pt: experience.title,
          en: experience.titleEn,
          es: experience.titleEs,
        }) ?? experience.title;
      return {
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Service',
          name: title,
          description: truncateMeta(
            localizedField({
              pt: experience.description,
              en: experience.descriptionEn,
              es: experience.descriptionEs,
            }) ?? '',
            300,
          ),
          url: `${siteUrl('/coreia-do-sul/experiencias')}/${experience.slug}`,
          ...(experience.mainImage ? { image: siteUrl(experience.mainImage) } : {}),
          provider: { '@type': 'TravelAgency', name: 'Maeum Global' },
          ...(experience.pricePerPerson > 0
            ? {
                offers: {
                  '@type': 'Offer',
                  price: experience.pricePerPerson.toFixed(2),
                  priceCurrency: experience.priceCurrency || 'BRL',
                  availability: 'https://schema.org/InStock',
                },
              }
            : {}),
        },
      };
    }),
  };

  const curationPillars = [
    { title: t('experiencias.pillars.local.title'), subtitle: t('experiencias.pillars.local.subtitle') },
    { title: t('experiencias.pillars.groups.title1'), subtitle: t('experiencias.pillars.groups.title2') },
    { title: t('experiencias.atendimento'), subtitle: t('experiencias.em-portugues') },
    { title: t('experiencias.pillars.signature.title'), subtitle: t('experiencias.pillars.signature.subtitle') },
    { title: t('experiencias.pillars.bookings.title'), subtitle: t('experiencias.pillars.bookings.subtitle') },
    { title: t('experiencias.pillars.moments.title'), subtitle: t('experiencias.pillars.moments.subtitle') },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#0F0A08] text-[#EFEBE4] font-sans selection:bg-[#C8A27C] selection:text-[#0F0A08]">
      <JsonLd id="experiencias-itemlist-jsonld" data={itemListJsonLd} />

      <Header />

      {/* 1. Hero Section (LCP) */}
      <section
        aria-labelledby="experiencias-hero-title"
        className="relative min-h-[100dvh] flex flex-col justify-center overflow-hidden border-b border-[#3D2620]"
      >
        <div className="absolute inset-0 z-0">
          <SmartImage
            src={heroDesktop}
            alt={t('experiencias.heroImage.desktop')}
            fill
            className="object-cover object-center brightness-[0.80] hidden md:block"
            sizes="100vw"
            priority
            quality={90}
            fallbackSrc={heroMobile}
            placeholderLabel={t('experiencias.heroImage.desktop')}
          />
          <SmartImage
            src={heroMobile}
            alt={t('experiencias.heroImage.desktop-x')}
            fill
            className="object-cover object-center brightness-[0.80] block md:hidden"
            sizes="100vw"
            priority
            quality={90}
            fallbackSrc={heroDesktop}
            placeholderLabel={t('experiencias.heroImage.desktop-x')}
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-[#0F0A08] via-[#0F0A08]/80 to-transparent w-full sm:w-2/3" />
        </div>

        <div className="relative z-10 px-6 sm:px-12 max-w-7xl mx-auto w-full flex flex-col items-start gap-6 pt-28 md:pt-40 pb-20">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold">
            {t('experiencias.hero.kicker')}
          </span>
          <h1
            id="experiencias-hero-title"
            className="font-heading text-5xl sm:text-6xl md:text-[70px] font-light tracking-wide leading-[1.1] text-white"
          >
            {t('experiencias.hero.line1')} <br />
            {t('experiencias.hero.line2')} <br />
            <span className="italic text-[#C8A27C]">{t('experiencias.hero.line3')}</span>
          </h1>
          <p className="text-[13px] sm:text-sm text-gray-300 max-w-xl font-light text-left leading-relaxed opacity-90 mt-2">
            {t('experiencias.hero.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
            <Link
              href={lp('/pacotes')}
              className="flex items-center justify-center gap-3 bg-[#C8A27C] hover:bg-[#B8906C] text-[#0F0A08] font-bold text-[11px] py-4 px-8 rounded-none transition-all group uppercase tracking-widest"
            >
              {t('experiencias.cta.viewPackages')}
              <ArrowRight aria-hidden className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href={lp('/contato')}
              className="flex items-center justify-center gap-3 bg-transparent border border-[#C8A27C] text-[#C8A27C] hover:bg-[#C8A27C]/10 font-bold text-[11px] py-4 px-8 rounded-none transition-all uppercase tracking-widest"
            >
              <CalendarCheck aria-hidden className="w-4 h-4" />
              {t('experiencias.cta.requestPlanning')}
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Curadoria */}
      <section aria-labelledby="experiencias-curation" className="py-12 px-6 sm:px-12 max-w-[1400px] mx-auto w-full border-b border-[#3D2620]">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          <div className="lg:w-1/3">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold block mb-2">
              {t('experiencias.curation.kicker')}
            </span>
            <h2
              id="experiencias-curation"
              className="font-heading text-2xl font-light text-white mb-2 leading-tight"
            >
              {t('experiencias.curation.line1')}
            </h2>
            <p className="text-[12px] text-gray-400 font-light leading-relaxed">
              {t('experiencias.curation.line2')}
            </p>
          </div>

          <ul className="lg:w-2/3 grid grid-cols-2 md:grid-cols-6 gap-6">
            {[
              Check,
              Users,
              MessageSquare,
              Star,
              CalendarCheck,
              Award,
            ].map((Icon, index) => {
              const pillar = curationPillars[index];
              return (
                <li key={pillar.title} className="flex flex-col items-center text-center gap-3">
                  <Icon aria-hidden className="w-6 h-6 text-[#C8A27C] stroke-1" />
                  <span className="text-[9px] text-gray-400 font-medium tracking-widest uppercase leading-tight">
                    {pillar.title}
                    <br />
                    {pillar.subtitle}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* 3. Filtros (server-rendered: funcionam sem JS e são indexáveis) */}
      <section
        aria-labelledby="experiencias-filters-title"
        className="px-6 sm:px-12 max-w-[1400px] mx-auto w-full pt-12"
      >
        <h2 id="experiencias-filters-title" className="sr-only">
          {t('experiencias.busca')}
        </h2>

        <div className="flex flex-col gap-4 border border-[#3D2620] bg-[#150E0C] rounded-sm p-6">
          <form action={lp('/experiencias')} method="get" className="flex flex-col sm:flex-row gap-3">
            <label className="sr-only" htmlFor="experiencias-q">
              {t('experiencias.busca')}
            </label>
            <input
              id="experiencias-q"
              name="q"
              type="search"
              defaultValue={search}
              placeholder={t('experiencias.catalog.searchPlaceholder')}
              className="flex-1 bg-transparent border border-[#3D2620] px-4 py-3 text-[11px] text-white placeholder:text-gray-500 focus:border-[#C8A27C] outline-none"
            />
            {activeCategory ? <input type="hidden" name="categoria" value={activeCategory} /> : null}
            {activeCity ? <input type="hidden" name="cidade" value={activeCity} /> : null}
            <button
              type="submit"
              className="bg-[#C8A27C] hover:bg-[#B8906C] text-[#0F0A08] font-bold text-[10px] px-8 py-3 uppercase tracking-widest transition-colors"
            >
              {t('experiencias.busca')}
            </button>
          </form>

          {cities.length > 1 ? (
            <nav aria-label={t('experiencias.cidade')}>
              <ul className="flex flex-wrap gap-2">
                <li>
                  <Link
                    href={filterHref({ cidade: '' })}
                    aria-current={activeCity ? undefined : 'true'}
                    className={`inline-block border px-3 py-1.5 text-[9px] uppercase tracking-widest font-bold transition-colors ${
                      !activeCity
                        ? 'border-[#C8A27C] bg-[#C8A27C] text-[#0F0A08]'
                        : 'border-[#3D2620] text-gray-400 hover:border-[#C8A27C] hover:text-[#C8A27C]'
                    }`}
                  >
                    {t('experiencias.todas-as-regioes')}
                  </Link>
                </li>
                {cities.map((city) => (
                  <li key={city}>
                    <Link
                      href={filterHref({ cidade: city })}
                      aria-current={activeCity.toLowerCase() === city.toLowerCase() ? 'true' : undefined}
                      className={`inline-block border px-3 py-1.5 text-[9px] uppercase tracking-widest font-bold transition-colors ${
                        activeCity.toLowerCase() === city.toLowerCase()
                          ? 'border-[#C8A27C] bg-[#C8A27C] text-[#0F0A08]'
                          : 'border-[#3D2620] text-gray-400 hover:border-[#C8A27C] hover:text-[#C8A27C]'
                      }`}
                    >
                      {city}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          {categories.length > 0 ? (
            <nav aria-label={t('detalhe.categoria')}>
              <ul className="flex flex-wrap gap-2">
                <li>
                  <Link
                    href={filterHref({ categoria: '' })}
                    aria-current={activeCategory ? undefined : 'true'}
                    className={`inline-block border px-3 py-1.5 text-[9px] uppercase tracking-widest font-bold transition-colors ${
                      !activeCategory
                        ? 'border-[#C8A27C] bg-[#C8A27C] text-[#0F0A08]'
                        : 'border-[#3D2620] text-gray-400 hover:border-[#C8A27C] hover:text-[#C8A27C]'
                    }`}
                  >
                    {t('experiencias.todas-as-regioes')}
                  </Link>
                </li>
                {categories.map((category) => {
                  const label =
                    (locale === 'en' ? category.nameEn : locale === 'es' ? category.nameEs : null) ??
                    category.name;
                  const isActive = activeCategory === category.slug;
                  return (
                    <li key={category.id}>
                      <Link
                        href={filterHref({ categoria: isActive ? '' : category.slug })}
                        aria-current={isActive ? 'true' : undefined}
                        className={`inline-block border px-3 py-1.5 text-[9px] uppercase tracking-widest font-bold transition-colors ${
                          isActive
                            ? 'border-[#C8A27C] bg-[#C8A27C] text-[#0F0A08]'
                            : 'border-[#3D2620] text-gray-400 hover:border-[#C8A27C] hover:text-[#C8A27C]'
                        }`}
                      >
                        {label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          ) : null}
        </div>
      </section>

      {/* 4. Grade de experiências — `Experience` */}
      <section aria-labelledby="experiencias-grid" className="py-16 px-6 sm:px-12 max-w-[1400px] mx-auto w-full">
        <div className="text-center mb-16 flex flex-col items-center">
          <h2
            id="experiencias-grid"
            className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold flex items-center gap-2"
          >
            <Star aria-hidden className="w-3 h-3" /> {t('experiencias.grid.kicker')}{' '}
            <Star aria-hidden className="w-3 h-3" />
          </h2>
          {hasFilters ? (
            <p className="mt-3 text-[10px] uppercase tracking-widest text-gray-500">
              {formatNumber(experiences.length)}{' '}
              {experiences.length === 1
                ? t('experiencias.catalog.result')
                : t('experiencias.catalog.results')}
            </p>
          ) : null}
        </div>

        {experiences.length === 0 ? (
          <div className="text-center border border-[#3D2620] bg-[#150E0C] rounded-sm py-16 px-6">
            <h3 className="font-heading text-2xl font-light text-white">
              {t('experiencias.catalog.emptyTitle')}
            </h3>
            <p className="text-[12px] text-gray-400 font-light mt-3">{t('experiencias.catalog.emptyDescription')}</p>
            {hasFilters ? (
              <Link
                href={lp('/experiencias')}
                className="inline-flex items-center gap-2 mt-8 bg-[#C8A27C] hover:bg-[#B8906C] text-[#0F0A08] font-bold text-[10px] py-3.5 px-8 uppercase tracking-widest transition-colors"
              >
                {t('experiencias.limpar-filtros')}
              </Link>
            ) : null}
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
              const highlights = parseStringArray(
                localizedField({
                  pt: experience.highlights,
                  en: experience.highlightsEn,
                  es: experience.highlightsEs,
                }),
              ).slice(0, 5);
              const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                `${t('detalhe.package.whatsappMessagePrefix')}${title}`,
              )}`;

              return (
                <li
                  key={experience.id}
                  className="bg-[#261514] border border-[#3D2620] flex flex-col overflow-hidden group hover:border-[#C8A27C]/40 transition-colors"
                >
                  <Link
                    href={lp(`/coreia-do-sul/experiencias/${experience.slug}`)}
                    className="relative aspect-[4/3] w-full overflow-hidden block"
                  >
                    <SmartImage
                      src={experience.mainImage}
                      alt={title}
                      fill
                      sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 100vw"
                      quality={75}
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      fallbackSrc={media.experiencias_card_fallback}
                      placeholderLabel={title}
                    />
                  </Link>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-heading text-sm font-semibold text-white mb-1 uppercase tracking-wider">
                      <Link href={lp(`/coreia-do-sul/experiencias/${experience.slug}`)} className="hover:text-[#C8A27C] transition-colors">
                        {title}
                      </Link>
                    </h3>
                    <p className="text-[9px] text-[#C8A27C] uppercase tracking-widest mb-2 font-medium">
                      {subtitle ?? experience.city}
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

                    <div className="mt-auto border-t border-[#3D2620] pt-4">
                      <div className="flex justify-between items-end mb-4">
                        <span className="flex items-center gap-1.5 text-[9px] text-gray-400 font-medium">
                          <Clock aria-hidden className="w-3 h-3 text-gray-500" />
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
                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full block bg-transparent border border-[#3D2620] hover:bg-[#3D2620] hover:text-white text-[#C8A27C] transition-colors py-2.5 text-[8px] font-bold uppercase tracking-widest rounded-sm text-center"
                      >
                        {t('experiencias.grid.book')}
                      </a>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* 5. Como funciona */}
      <section aria-labelledby="experiencias-how" className="py-24 px-6 sm:px-12 max-w-[1400px] mx-auto w-full border-t border-[#3D2620]">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <div className="lg:w-1/2 w-full">
            <span
              id="experiencias-how"
              className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold block mb-12 text-center lg:text-left"
            >
              {t('experiencias.how.kicker')}
            </span>

            <ol className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[
                {
                  Icon: Check,
                  title: t('experiencias.01-escolha'),
                  description: t('experiencias.how.step1Description'),
                },
                {
                  Icon: Calendar,
                  title: t('experiencias.02-planejamento'),
                  description: t('experiencias.how.step2Description'),
                },
                {
                  Icon: Users,
                  title: t('experiencias.03-aproveite'),
                  description: t('experiencias.how.step3Description'),
                },
                {
                  Icon: Star,
                  title: t('experiencias.04-memorias'),
                  description: t('experiencias.how.step4Description'),
                },
              ].map((step, index) => (
                <li key={step.title} className="flex flex-col items-center text-center gap-3 relative">
                  <step.Icon aria-hidden className="w-6 h-6 text-[#C8A27C] stroke-1" />
                  <span className="text-[10px] font-bold text-[#C8A27C]">{step.title}</span>
                  <p className="text-[9px] text-gray-400 font-light leading-relaxed">{step.description}</p>
                  {index < 3 ? (
                    <span aria-hidden className="hidden sm:block absolute top-[30%] -right-[50%] w-[100%]">
                      <ArrowRight className="w-4 h-4 text-[#C8A27C]/30 mx-auto" />
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>

          <div className="lg:w-1/2 relative h-[300px] w-full rounded-sm overflow-hidden border border-[#3D2620]">
            <SmartImage
              src={media.experiencias_memorias_image}
              alt={t('experiencias.how.step4Title')}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              quality={75}
              className="object-cover"
              placeholderLabel={t('experiencias.how.step4Title')}
            />
          </div>
        </div>
      </section>

      {/* 6. Por que escolhemos nossos parceiros */}
      <section aria-labelledby="experiencias-parceiros" className="py-20 px-6 sm:px-12 max-w-[1400px] mx-auto w-full border-t border-[#3D2620]">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          <div className="lg:w-1/3 relative h-[300px] w-full rounded-sm overflow-hidden border border-[#3D2620]">
            <SmartImage
              src={media.experiencias_hanok_image}
              alt={t('experiencias.how.step4Title')}
              fill
              sizes="(min-width: 1024px) 33vw, 100vw"
              quality={75}
              className="object-cover"
              placeholderLabel={t('experiencias.partners.kicker')}
            />
          </div>

          <div className="lg:w-2/3 flex flex-col md:flex-row gap-12">
            <div className="md:w-1/2 flex flex-col gap-4">
              <h2
                id="experiencias-parceiros"
                className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold"
              >
                {t('experiencias.partners.kicker')}
              </h2>
              <p className="text-[11px] text-gray-300 font-light leading-relaxed">
                {t('experiencias.partners.line1')}
                <br />
                <br />
                {t('experiencias.partners.line2')}
                <br />
                <br />
                {t('experiencias.partners.line3')}
              </p>
            </div>
            <ul className="md:w-1/2 flex flex-col justify-center gap-6">
              {[
                { Icon: Check, label: t('experiencias.qualidade-premium') },
                { Icon: HeartHandshake, label: t('experiencias.hospitalidade-local') },
                { Icon: Award, label: t('experiencias.autenticidade') },
                { Icon: ShieldCheck, label: t('experiencias.confianca-e-seguranca') },
              ].map((item) => (
                <li key={item.label} className="flex items-center gap-3">
                  <item.Icon aria-hidden className="w-4 h-4 text-[#C8A27C]" strokeWidth={2} />
                  <span className="text-[11px] text-gray-300 font-light">{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 7. CTA final */}
      <section aria-labelledby="experiencias-cta" className="py-20 px-6 sm:px-12 max-w-[1400px] mx-auto w-full">
        <div className="bg-[#2A1112] border border-[#3D2620] rounded-sm p-12 sm:p-16 flex flex-col lg:flex-row items-center justify-between gap-10 relative overflow-hidden">
          <div aria-hidden className="absolute right-0 top-0 opacity-10 w-1/3 h-full">
            <SmartImage
              src={media.experiencias_texture_banner}
              alt=""
              fill
              sizes="33vw"
              quality={75}
              className="object-cover"
            />
          </div>

          <div className="relative z-10 flex flex-col gap-4 lg:w-2/3">
            <h2 id="experiencias-cta" className="font-heading text-3xl sm:text-4xl font-light text-[#C8A27C]">
              {t('experiencias.custom.kicker')}
            </h2>
            <p className="text-[12px] text-gray-400 font-light">{t('experiencias.custom.description')}</p>
          </div>

          <div className="relative z-10 flex flex-col gap-4 lg:w-1/3 w-full">
            <Link
              href={lp('/contato')}
              className="w-full bg-[#C8A27C] hover:bg-[#B8906C] text-[#0F0A08] font-bold text-[10px] py-4 px-8 rounded-none transition-all uppercase tracking-widest flex items-center justify-center gap-3 group"
            >
              {t('experiencias.cta.personalize')}
              <ArrowRight aria-hidden className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href={lp('/contato')}
              className="text-[9px] text-[#C8A27C] hover:text-white uppercase tracking-widest font-semibold transition-colors flex justify-center mt-2"
            >
              {t('experiencias.cta.talkToConsultant')}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}