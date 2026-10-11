import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  MapPin,
  Calendar,
  Compass,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  GraduationCap,
  Map,
  Clock,
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
import { buildMetadata, touristTripJsonLd, truncateMeta } from '@/lib/seo';

interface PageProps {
  params: Promise<{ slug: string }>;
}

/* ────────────────────────────────────────────────────────────────────────────
 * SEO
 * ────────────────────────────────────────────────────────────────────────── */

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  try {
    const destinations = await prisma.destination.findMany({
      select: { slug: true },
      orderBy: { sortOrder: 'asc' },
      take: 200,
    });
    return destinations.map((destination) => ({ slug: destination.slug }));
  } catch {
    // Banco indisponível no build: a rota segue dinâmica (dynamicParams).
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { locale, t, fill, localizedField } = await getServerI18n();

  const destination = await prisma.destination
    .findUnique({
      where: { slug },
      select: {
        name: true,
        subtitle: true,
        description: true,
        descriptionEn: true,
        descriptionEs: true,
        mainImage: true,
        seoTitle: true,
        seoDescription: true,
      },
    })
    .catch(() => null);

  if (!destination) {
    return buildMetadata({
      title: truncateMeta(t('detalhe.destino-nao-encontrado'), 60),
      description: '',
      path: `/destinos/${slug}`,
      locale,
      noindex: true,
    });
  }

  const fallbackTitle = `${destination.name} | Maeum Global`;
  const fallbackDescription = fill(t('destinos.seo.detailDescription'), { city: destination.name });

  return buildMetadata({
    // `seoTitle`/`seoDescription` do painel têm prioridade; o título é sempre
    // truncado em 60 caracteres e a descrição em 160 (limite do snippet).
    title: truncateMeta(destination.seoTitle, 60) || truncateMeta(fallbackTitle, 60),
    description:
      truncateMeta(destination.seoDescription, 160) ||
      truncateMeta(
        localizedField({
          pt: destination.description,
          en: destination.descriptionEn,
          es: destination.descriptionEs,
        }) ?? destination.subtitle ?? fallbackDescription,
        160,
      ) ||
      fallbackDescription,
    path: `/destinos/${slug}`,
    locale,
    image: destination.mainImage ?? undefined,
    imageAlt: destination.name,
  });
}

/* ────────────────────────────────────────────────────────────────────────────
 * Página
 * ────────────────────────────────────────────────────────────────────────── */

const normalize = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ');

export default async function DestinationDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const { t, locale, lp, formatCurrency, formatDate, fill, localizedField } = await getServerI18n();

  const destination = await prisma.destination
    .findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        country: true,
        subtitle: true,
        description: true,
        descriptionEn: true,
        descriptionEs: true,
        mainImage: true,
        gallery: true,
        mapLat: true,
        mapLng: true,
        updatedAt: true,
      },
    })
    .catch(() => null);

  if (!destination) notFound();

  const name = normalize(destination.name);

  const [experiences, journeys, packages, media] = await Promise.all([
    // Mesmo nome de cidade em `city`, `region` ou `location`: as três colunas
    // são preenchidas livremente pelo painel, então procuramos nas três.
    prisma.experience
      .findMany({
        where: {
          status: 'active',
          OR: [
            { city: { equals: destination.name, mode: 'insensitive' } },
            { region: { equals: destination.name, mode: 'insensitive' } },
            { location: { equals: destination.name, mode: 'insensitive' } },
          ],
        },
        orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
        take: 6,
        select: {
          id: true,
          slug: true,
          title: true,
          titleEn: true,
          titleEs: true,
          subtitle: true,
          city: true,
          durationHours: true,
          pricePerPerson: true,
          priceCurrency: true,
          mainImage: true,
        },
      })
      .catch(() => []),
    prisma.journey
      .findMany({
        where: { status: { in: ['active', 'soldout'] } },
        orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
        take: 40,
        select: {
          id: true,
          slug: true,
          title: true,
          titleEn: true,
          titleEs: true,
          subtitle: true,
          durationDays: true,
          pricePerPerson: true,
          priceCurrency: true,
          mainImage: true,
          destinations: true,
        },
      })
      .catch(() => []),
    prisma.package
      .findMany({
        where: { status: 'active', destination: { contains: destination.name, mode: 'insensitive' } },
        orderBy: { updatedAt: 'desc' },
        take: 6,
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          price: true,
          gallery: true,
        },
      })
      .catch(() => []),
    getMediaMap().catch(() => ({}) as Record<string, string>),
  ]);

  // `Journey.destinations` é JSON serializado: o filtro por cidade é feito em JS.
  const relatedJourneys = journeys
    .filter((journey) =>
      parseStringArray(journey.destinations).some((stop) => name.includes(normalize(stop))),
    )
    .slice(0, 6);

  /**
   * Saídas reais (`JourneyDeparture`). A tabela é criada pelo `aplicar.sql`:
   * se estiver vazia (ou a consulta falhar) a página segue e simplesmente não
   * mostra a data — nunca quebra nem inventa saída.
   */
  const departures =
    relatedJourneys.length > 0
      ? await prisma.journeyDeparture
          .findMany({
            where: {
              journeyId: { in: relatedJourneys.map((journey) => journey.id) },
              status: { in: ['available', 'limited'] },
            },
            orderBy: { startDate: 'asc' },
            take: 4,
            select: {
              id: true,
              startDate: true,
              endDate: true,
              availableSpots: true,
            },
          })
          .catch(() => [])
      : [];

  const nextDeparture = departures[0] ?? null;

  const gallery = parseStringArray(destination.gallery);
  const description =
    localizedField({
      pt: destination.description,
      en: destination.descriptionEn,
      es: destination.descriptionEs,
    }) ?? destination.subtitle;

  const isHub = destination.slug === 'coreia-do-sul';

  const tripJsonLd = touristTripJsonLd({
    name: destination.name,
    description: description ?? destination.subtitle ?? destination.name,
    path: `/destinos/${destination.slug}`,
    locale,
    image: [destination.mainImage, ...gallery].filter((value): value is string => Boolean(value)),
    touristType: 'Leisure travelers',
    itinerary: relatedJourneys.map((journey) => ({
      name:
        localizedField({ pt: journey.title, en: journey.titleEn, es: journey.titleEs }) ?? journey.title,
      path: `/coreia-do-sul/jornadas/${journey.slug}`,
      ...(journey.mainImage ? { image: journey.mainImage } : {}),
    })),
  });

  const hubLinks = [
    {
      href: lp('/coreia-do-sul/experiencias'),
      Icon: Compass,
      title: t('detalhe.experiencias'),
      description: t('detalhe.explore-experiencias-individuais'),
    },
    {
      href: lp('/coreia-do-sul/k-beauty'),
      Icon: Sparkles,
      title: t('detalhe.k-beauty'),
      description: t('detalhe.beleza-e-cuidados-coreanos'),
    },
    {
      href: lp('/coreia-do-sul/intercambio'),
      Icon: GraduationCap,
      title: t('detalhe.intercambio'),
      description: t('detalhe.destination.lexisKorea'),
    },
    {
      href: lp('/coreia-do-sul/jornadas'),
      Icon: Map,
      title: t('detalhe.jornadas'),
      description: t('detalhe.viagens-em-grupo-exclusivas'),
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* JSON-LD: TouristTrip com o itinerary das jornadas que passam aqui */}
      <JsonLd id="destino-touristtrip-jsonld" data={tripJsonLd} />

      <Header />

      <main className="flex-1 w-full">
        {/* Banner principal (LCP) */}
        <section aria-labelledby="destino-title" className="relative min-h-[70dvh] w-full overflow-hidden">
          <SmartImage
            src={destination.mainImage}
            alt={destination.name}
            fill
            sizes="100vw"
            priority
            quality={90}
            className="object-cover"
            fallbackSrc={media[`destinos_card_${destination.slug}`] ?? media.destinos_detail_fallback}
            placeholderLabel={destination.name}
          />
          <div aria-hidden className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-16 max-w-7xl mx-auto w-full">
            <div className="max-w-2xl text-white">
              <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 backdrop-blur-sm inline-block">
                {t('detalhe.destino-premium')}
              </span>
              <h1
                id="destino-title"
                className="font-heading text-4xl sm:text-6xl font-light mt-4 tracking-wide uppercase leading-tight"
              >
                {destination.name}
              </h1>
              {destination.subtitle ? (
                <p className="text-sm text-white/80 font-light mt-3 max-w-xl leading-relaxed">
                  {destination.subtitle}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6">
          <Breadcrumbs
            locale={locale}
            items={[
              { name: t('destinos.detail.breadcrumb'), path: '/destinos' },
              { name: destination.name, path: `/destinos/${destination.slug}` },
            ]}
          />
        </div>

        {/* Informações detalhadas */}
        <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-16">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <h2 className="font-heading text-2xl font-light text-secondary uppercase tracking-wider">
              {t('detalhe.sobre-o-destino')}
            </h2>
            {description ? (
              <p className="text-sm text-muted-foreground leading-relaxed font-light">{description}</p>
            ) : null}

            {/* Galeria — alt descritivo e localizado por imagem */}
            {gallery.length > 0 ? (
              <div className="mt-8">
                <h3 className="font-heading text-lg font-light text-secondary uppercase tracking-wider mb-4">
                  {t('detalhe.galeria-de-experiencias')}
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {gallery.map((image, index) => (
                    <li
                      key={`${image}-${index}`}
                      className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-border"
                    >
                      <SmartImage
                        src={image}
                        alt={fill(t('destinos.detail.galleryAlt'), {
                          city: destination.name,
                          n: index + 1,
                        })}
                        fill
                        sizes="(min-width: 640px) 33vw, 100vw"
                        quality={75}
                        className="object-cover hover:scale-102 transition-transform duration-500"
                        fallbackSrc={media.destinos_gallery_fallback}
                        placeholderLabel={destination.name}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {isHub ? (
              <div className="mt-8 bg-muted/20 rounded-3xl p-8 border border-border">
                <h3 className="font-heading text-xl font-light text-secondary uppercase tracking-wider mb-6">
                  {t('detalhe.explorar-coreia-do-sul')}
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {hubLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="flex items-center gap-4 bg-card border border-border rounded-2xl p-5 hover:shadow-md hover:border-primary/30 transition-all group"
                      >
                        <span className="p-3 bg-primary/10 rounded-xl text-accent">
                          <link.Icon aria-hidden className="h-6 w-6" />
                        </span>
                        <span>
                          <span className="block font-bold text-sm text-secondary group-hover:text-primary transition-colors">
                            {link.title}
                          </span>
                          <span className="block text-[10px] text-muted-foreground">{link.description}</span>
                        </span>
                        <ArrowRight aria-hidden className="h-4 w-4 text-accent ml-auto shrink-0" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Experiências da mesma cidade */}
            {experiences.length > 0 ? (
              <section aria-labelledby="destino-experiencias" className="mt-8">
                <h3
                  id="destino-experiencias"
                  className="font-heading text-xl font-light text-secondary uppercase tracking-wider mb-6"
                >
                  {fill(t('destinos.detail.experiencesTitle'), { city: destination.name })}
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {experiences.map((experience) => {
                    const title =
                      localizedField({
                        pt: experience.title,
                        en: experience.titleEn,
                        es: experience.titleEs,
                      }) ?? experience.title;
                    return (
                      <li key={experience.id}>
                        <Link
                          href={lp(`/coreia-do-sul/experiencias/${experience.slug}`)}
                          className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors group"
                        >
                          <span className="relative aspect-[4/3] w-full overflow-hidden">
                            <SmartImage
                              src={experience.mainImage}
                              alt={title}
                              fill
                              sizes="(min-width: 640px) 33vw, 100vw"
                              quality={75}
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                              fallbackSrc={media.experiencias_card_fallback}
                              placeholderLabel={title}
                            />
                          </span>
                          <span className="p-5 flex flex-col gap-2 flex-1">
                            <span className="font-heading text-base font-bold text-secondary group-hover:text-primary transition-colors">
                              {title}
                            </span>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1.5">
                              <Clock aria-hidden className="h-3 w-3 text-accent" />
                              {t('detalhe.duracao')} {experience.durationHours}h
                            </span>
                            <span className="mt-auto text-sm font-bold text-primary">
                              {formatCurrency(experience.pricePerPerson, experience.priceCurrency)}
                              <span className="text-[10px] font-normal text-muted-foreground ml-1">
                                {t('experiencias.catalog.perPerson')}
                              </span>
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}

            {/* Jornadas que passam pela cidade */}
            {relatedJourneys.length > 0 ? (
              <section aria-labelledby="destino-jornadas" className="mt-8">
                <h3
                  id="destino-jornadas"
                  className="font-heading text-xl font-light text-secondary uppercase tracking-wider mb-6"
                >
                  {fill(t('destinos.detail.journeysTitle'), { city: destination.name })}
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {relatedJourneys.map((journey) => {
                    const title =
                      localizedField({ pt: journey.title, en: journey.titleEn, es: journey.titleEs }) ??
                      journey.title;
                    const stops = parseStringArray(journey.destinations);
                    return (
                      <li key={journey.id}>
                        <Link
                          href={lp(`/coreia-do-sul/jornadas/${journey.slug}`)}
                          className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors group"
                        >
                          <span className="relative aspect-[16/9] w-full overflow-hidden">
                            <SmartImage
                              src={journey.mainImage}
                              alt={title}
                              fill
                              sizes="(min-width: 640px) 33vw, 100vw"
                              quality={75}
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                              fallbackSrc={media.home_journey_fallback}
                              placeholderLabel={title}
                            />
                          </span>
                          <span className="p-5 flex flex-col gap-2 flex-1">
                            <span className="font-heading text-base font-bold text-secondary group-hover:text-primary transition-colors">
                              {title}
                            </span>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1.5">
                              <Calendar aria-hidden className="h-3 w-3 text-accent" />
                              {journey.durationDays} {t('detalhe.dias').toLowerCase()}
                            </span>
                            {stops.length > 0 ? (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                                <MapPin aria-hidden className="h-3 w-3 text-accent" />
                                {stops.join(' • ')}
                              </span>
                            ) : null}
                            <span className="mt-auto text-sm font-bold text-primary">
                              {formatCurrency(journey.pricePerPerson, journey.priceCurrency)}
                              <span className="text-[10px] font-normal text-muted-foreground ml-1">
                                {t('experiencias.catalog.perPerson')}
                              </span>
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}
          </div>

          {/* Sidebar */}
          <aside
            aria-label={t('detalhe.informacao-de-viagem')}
            className="border border-border rounded-3xl p-8 bg-card shadow-sm h-fit flex flex-col gap-6"
          >
            <div>
              <span className="text-[10px] uppercase font-bold text-primary tracking-widest">
                {t('detalhe.informacao-de-viagem')}
              </span>
              <h3 className="font-heading text-xl font-light text-secondary mt-1">
                {t('detalhe.pais')} {destination.country}
              </h3>
            </div>

            <div aria-hidden className="h-px bg-border" />

            <dl className="flex flex-col gap-2.5 text-xs text-muted-foreground">
              {destination.mapLat !== null && destination.mapLng !== null ? (
                <div className="flex justify-between gap-3">
                  <dt>{t('detalhe.coordenadas')}</dt>
                  <dd className="font-bold text-secondary text-right">
                    {destination.mapLat.toFixed(4)}°, {destination.mapLng.toFixed(4)}°
                  </dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-3">
                <dt>{t('detalhe.temporada-ideal')}</dt>
                <dd className="font-bold text-secondary">{t('detalhe.todo-o-ano')}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>{t('detalhe.idioma-local')}</dt>
                <dd className="font-bold text-secondary">{t('detalhe.nativo-ingles')}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>{t('detalhe.localizacao')}</dt>
                <dd className="font-bold text-secondary text-right">{destination.name}</dd>
              </div>
              {experiences.length > 0 ? (
                <div className="flex justify-between gap-3">
                  <dt>{t('experiencias.cidade')}</dt>
                  <dd className="font-bold text-secondary text-right">
                    {experiences.length} {t('experiencias.catalog.results')}
                  </dd>
                </div>
              ) : null}
              {relatedJourneys.length > 0 ? (
                <div className="flex justify-between gap-3">
                  <dt>{t('detalhe.jornadas')}</dt>
                  <dd className="font-bold text-secondary text-right">
                    {relatedJourneys.length} {t('experiencias.catalog.results')}
                  </dd>
                </div>
              ) : null}
              {nextDeparture ? (
                <div className="flex justify-between gap-3">
                  <dt>{t('detalhe.data-inicial')}</dt>
                  <dd className="font-bold text-secondary text-right">
                    {formatDate(nextDeparture.startDate, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </dd>
                </div>
              ) : null}
              {nextDeparture ? (
                <div className="flex justify-between gap-3">
                  <dt>{t('detalhe.vagas-disponiveis')}</dt>
                  <dd className="font-bold text-secondary text-right">
                    {fill(t('home.journeys.spotsLeft'), { n: nextDeparture.availableSpots })}
                  </dd>
                </div>
              ) : null}
            </dl>

            {isHub ? (
              <Link href={lp('/coreia-do-sul')} className="mt-2 block">
                <span className="w-full flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 text-white transition-all text-xs font-bold py-3.5 rounded-xl uppercase tracking-wider shadow-sm">
                  <Compass aria-hidden className="h-4 w-4" />
                  {t('detalhe.explorar-coreia-do-sul-x')}
                </span>
              </Link>
            ) : null}

            <Link
              href={lp('/destinos')}
              className="mt-2 flex items-center justify-center gap-2 border border-border rounded-xl text-xs font-bold py-3.5 uppercase tracking-wider text-secondary hover:border-primary/40 transition-colors"
            >
              <ArrowLeft aria-hidden className="h-4 w-4" />
              {t('detalhe.voltar-para-destinos')}
            </Link>
          </aside>
        </section>

        {/* Programas e pacotes do destino */}
        <section aria-labelledby="destino-programas" className="py-16 bg-muted/20 border-t border-border w-full">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <h2
              id="destino-programas"
              className="font-heading text-3xl font-light text-secondary uppercase tracking-wide mb-12 text-center"
            >
              {t('detalhe.programas-e-viagens-disponiveis')}
            </h2>

            {packages.length > 0 ? (
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {packages.map((pkg) => {
                  const image = parseStringArray(pkg.gallery)[0];
                  return (
                    <li
                      key={pkg.id}
                      className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden">
                        <SmartImage
                          src={image}
                          alt={pkg.title}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                          quality={75}
                          className="object-cover group-hover:scale-102 transition-transform duration-300"
                          fallbackSrc={media.destinos_card_fallback}
                          placeholderLabel={pkg.title}
                        />
                      </div>
                      <div className="p-6">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-heading text-lg font-bold text-secondary leading-tight group-hover:text-primary transition-colors">
                            {pkg.title}
                          </h3>
                          <span className="font-heading text-md font-bold text-primary shrink-0">
                            {formatCurrency(pkg.price)}
                          </span>
                        </div>
                        {pkg.description ? (
                          <p className="text-xs text-muted-foreground mt-3 line-clamp-3 font-light leading-relaxed">
                            {pkg.description}
                          </p>
                        ) : null}
                      </div>
                      <div className="p-6 pt-0">
                        <Link
                          href={lp(`/pacotes/${pkg.slug}`)}
                          className="w-full flex items-center justify-center gap-2 bg-muted hover:bg-primary hover:text-white transition-all text-xs font-bold py-3 rounded-xl border border-border text-secondary"
                        >
                          {t('detalhe.ver-roteiro-detalhado')}
                          <ArrowRight aria-hidden className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-center text-xs text-muted-foreground py-12">
                {t('detalhe.destination.comingSoon')}
              </p>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}