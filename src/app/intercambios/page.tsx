import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Award,
  BookOpen,
  Building2,
  Clock,
  Compass,
  GraduationCap,
  MapPin,
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
import { parseStringArray, safeUrl } from '@/lib/validate';
import { buildMetadata, localizedUrl, truncateMeta } from '@/lib/seo';
import ExchangeInquiryForm, { type ExchangeOption } from './_components/ExchangeInquiryForm';

/* ────────────────────────────────────────────────────────────────────────────
 * SEO
 * ────────────────────────────────────────────────────────────────────────── */

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getServerI18n();
  return buildMetadata({
    title: truncateMeta(t('intercambios.seo.title'), 60),
    description: t('intercambios.seo.description'),
    path: '/intercambios',
    locale,
    image: '/images/agencia-viagens-coreia-do-sul-maeum-global-oficial.webp',
    imageAlt: t('intercambios.korea.heroImage.desktop'),
  });
}

/* ────────────────────────────────────────────────────────────────────────────
 * Página
 * ────────────────────────────────────────────────────────────────────────── */

interface ProgramRow {
  id: string;
  name: string;
  description: string;
  durationLabel: string;
  classesLabel: string;
  level: string;
  /** Sinalizadores traduzidos no servidor (nada de booleano cru no JSX). */
  flags: { label: string; Icon: LucideIcon }[];
  price: number;
}

interface CampusRow {
  id: string;
  name: string;
  city: string;
  location: string;
  description: string;
  image: string;
  programs: ProgramRow[];
}

interface InstitutionRow {
  id: string;
  name: string;
  country: string;
  description: string;
  website: string;
  logo: string;
  image: string;
  campuses: CampusRow[];
}

export default async function IntercambiosPage() {
  const { t, locale, lp, fill, formatCurrency, formatNumber } = await getServerI18n();

  const [institutions, media] = await Promise.all([
    prisma.exchangeInstitution.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }],
      take: 12,
      select: {
        id: true,
        name: true,
        country: true,
        description: true,
        website: true,
        logoUrl: true,
        sortOrder: true,
        campuses: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          take: 20,
          select: {
            id: true,
            name: true,
            city: true,
            location: true,
            description: true,
            mainImage: true,
            sortOrder: true,
            programs: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
              take: 20,
              select: {
                id: true,
                name: true,
                description: true,
                durationWeeksMin: true,
                durationWeeksMax: true,
                classesPerWeek: true,
                levelRequired: true,
                enrollmentFee: true,
                includesEnrollment: true,
                includesMaterial: true,
                culturalActivities: true,
                pricingTiers: true,
              },
            },
          },
        },
      },
    }),
    getMediaMap().catch(() => ({}) as Record<string, string>),
  ]);

  const rows: InstitutionRow[] = institutions.map((institution) => ({
    id: institution.id,
    name: institution.name,
    country: institution.country,
    description: institution.description ?? '',
    website: safeUrl(institution.website) ?? '',
    logo: institution.logoUrl ?? '',
    image: media.intercambios_card_seul ?? '',
    campuses: institution.campuses.map((campus) => ({
      id: campus.id,
      name: campus.name,
      city: campus.city,
      location: campus.location ?? '',
      description: campus.description ?? '',
      image: campus.mainImage ?? '',
      programs: campus.programs.map((program): ProgramRow => {
        // `pricingTiers` é um JSON livre; pegamos o primeiro preço numérico
        // como valor de referência e ignoramos o resto (sem inventar tabela).
        const tiers = parseStringArray(program.pricingTiers, 12);
        const tierPrice = tiers.reduce<number>((best, tier) => {
          const digits = tier.replace(/[^\d.,]/g, '');
          const value = Number.parseFloat(digits.replace(/\./g, '').replace(',', '.'));
          return Number.isFinite(value) && value > 0 ? Math.min(best, value) : best;
        }, Number.POSITIVE_INFINITY);
        const reference =
          Number.isFinite(tierPrice) && tierPrice > 0
            ? tierPrice
            : program.enrollmentFee > 0
              ? program.enrollmentFee
              : 0;

        const flags: { label: string; Icon: LucideIcon }[] = [];
        if (program.includesEnrollment) {
          flags.push({ label: t('intercambios.programs.enrollmentIncluded'), Icon: Award });
        }
        if (program.includesMaterial) {
          flags.push({ label: t('intercambios.programs.materialIncluded'), Icon: BookOpen });
        }
        if (program.culturalActivities) {
          flags.push({ label: t('intercambios.programs.culturalIncluded'), Icon: Compass });
        }

        return {
          id: program.id,
          name: program.name,
          description: program.description ?? '',
          durationLabel:
            program.durationWeeksMin === program.durationWeeksMax
              ? fill(t('intercambios.programs.weeksExact'), {
                  n: formatNumber(program.durationWeeksMin),
                })
              : fill(t('intercambios.programs.weeksRange'), {
                  min: formatNumber(program.durationWeeksMin),
                  max: formatNumber(program.durationWeeksMax),
                }),
          classesLabel: fill(t('intercambios.programs.classesPerWeek'), {
            n: formatNumber(program.classesPerWeek),
          }),
          level: program.levelRequired,
          flags,
          price: reference,
        };
      }),
    })),
  }));

  const campusOptions: ExchangeOption[] = rows.flatMap((institution) =>
    institution.campuses.map((campus) => ({
      value: campus.id,
      label: `${institution.name} — ${campus.name} (${campus.city})`,
    })),
  );
  const programOptions: ExchangeOption[] = rows.flatMap((institution) =>
    institution.campuses.flatMap((campus) =>
      campus.programs.map((program) => ({
        value: `${campus.id}::${program.id}`,
        label: `${program.name} — ${campus.city}`,
      })),
    ),
  );

  const totalCampuses = rows.reduce((sum, institution) => sum + institution.campuses.length, 0);
  const totalPrograms = rows.reduce(
    (sum, institution) => sum + institution.campuses.reduce((n, campus) => n + campus.programs.length, 0),
    0,
  );

  /* ── JSON-LD: ItemList de programas (Course) ─────────────────────────── */

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t('intercambios.list.sectionTitle'),
    url: localizedUrl('/intercambios', locale),
    inLanguage: locale,
    numberOfItems: programOptions.length,
    itemListElement: programOptions.map((option, index) => {
      const programId = option.value.split('::')[1] ?? '';
      const program = rows
        .flatMap((institution) => institution.campuses)
        .flatMap((campus) => campus.programs)
        .find((item) => item.id === programId);
      return {
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Course',
          name: option.label,
          description: truncateMeta(program?.description ?? program?.name ?? option.label, 300),
          url: localizedUrl('/intercambios', locale),
          inLanguage: ['pt', 'en', 'es'],
          provider: {
            '@type': 'EducationalOrganization',
            name: option.label.split(' — ')[0] || 'Maeum Global',
          },
        },
      };
    }),
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <JsonLd id="intercambios-itemlist-jsonld" data={itemListJsonLd} />

      <Header />

      <main className="flex-1">
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section
          aria-labelledby="intercambios-hero-title"
          className="relative overflow-hidden border-b border-border"
        >
          <div className="absolute inset-0 z-0">
            <SmartImage
              src={media.intercambios_card_seul}
              alt={t('intercambios.korea.heroImage.desktop')}
              fill
              sizes="100vw"
              priority
              quality={90}
              fallbackSrc={media.intercambios_card_toquio}
              placeholderLabel={t('intercambios.korea.heroImage.desktop')}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/40" />
          </div>
          <div className="relative z-10 px-4 md:px-8 max-w-6xl mx-auto w-full py-24 flex flex-col items-start gap-4">
            <span className="text-xs uppercase tracking-widest text-primary font-bold">
              {t('intercambios.hero.kicker')}
            </span>
            <h1
              id="intercambios-hero-title"
              className="font-heading text-4xl sm:text-5xl font-light text-secondary"
            >
              {t('intercambios.hero.title')}
            </h1>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-2xl">
              {t('intercambios.hero.description')}
            </p>
            <ul className="flex flex-wrap gap-x-8 gap-y-3 mt-6 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              <li className="flex items-center gap-2">
                <Building2 aria-hidden className="h-4 w-4 text-primary" />
                {formatNumber(rows.length)} {t('intercambios.campi')}
              </li>
              <li className="flex items-center gap-2">
                <MapPin aria-hidden className="h-4 w-4 text-primary" />
                {formatNumber(totalCampuses)} {t('intercambios.campuses.title')}
              </li>
              <li className="flex items-center gap-2">
                <GraduationCap aria-hidden className="h-4 w-4 text-primary" />
                {formatNumber(totalPrograms)} {t('intercambios.programas')}
              </li>
            </ul>
          </div>
        </section>

        <div className="px-4 md:px-8 max-w-6xl mx-auto w-full pt-8">
          <Breadcrumbs
            locale={locale}
            items={[{ name: t('intercambios.list.breadcrumb'), path: '/intercambios' }]}
          />
        </div>

        {/* ── Instituições ─────────────────────────────────────────────────── */}
        <section
          aria-labelledby="intercambios-list-title"
          className="py-16 px-4 md:px-8 max-w-6xl mx-auto w-full"
        >
          <div className="max-w-2xl mb-12">
            <span className="text-xs uppercase tracking-widest text-primary font-bold block mb-2">
              {t('intercambios.list.sectionKicker')}
            </span>
            <h2
              id="intercambios-list-title"
              className="font-heading text-3xl font-light text-secondary"
            >
              {t('intercambios.list.sectionTitle')}
            </h2>
          </div>

          {rows.length === 0 ? (
            <div className="text-center border border-border/80 rounded-3xl bg-card py-20 px-6">
              <GraduationCap aria-hidden className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-heading text-2xl font-light text-secondary">
                {t('intercambios.institutions.emptyTitle')}
              </h3>
              <p className="text-xs text-muted-foreground mt-3 max-w-lg mx-auto leading-relaxed">
                {t('intercambios.institutions.emptyDescription')}
              </p>
              <Link
                href={lp('/contato')}
                className="inline-flex items-center gap-2 mt-6 bg-primary hover:bg-accent-hover text-white text-xs font-semibold px-6 py-3 rounded-full shadow-md transition-all"
              >
                {t('intercambios.form.cta')}
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-10">
              {rows.map((institution) => (
                <article
                  key={institution.id}
                  className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm"
                >
                  <header className="flex flex-col sm:flex-row sm:items-center gap-4 p-6 border-b border-border">
                    {institution.logo ? (
                      <SmartImage
                        src={institution.logo}
                        alt={institution.name}
                        width={72}
                        height={72}
                        quality={75}
                        className="h-16 w-16 rounded-xl object-contain bg-background shrink-0"
                      />
                    ) : (
                      <span
                        aria-hidden
                        className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"
                      >
                        <GraduationCap className="h-7 w-7 text-primary" />
                      </span>
                    )}
                    <div className="flex-1">
                      <h3 className="font-heading text-xl font-bold text-secondary leading-tight">
                        {institution.name}
                      </h3>
                      <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1.5">
                        <MapPin aria-hidden className="h-3 w-3" />
                        {institution.country}
                      </p>
                      {institution.description ? (
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed max-w-2xl">
                          {institution.description}
                        </p>
                      ) : null}
                    </div>
                    {institution.website ? (
                      <a
                        href={institution.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-accent-hover transition-colors shrink-0"
                      >
                        {t('intercambios.institutions.website')}
                      </a>
                    ) : null}
                  </header>

                  {institution.campuses.length === 0 ? (
                    <p className="p-8 text-center text-xs text-muted-foreground">
                      {t('intercambios.campuses.empty')}
                    </p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {institution.campuses.map((campus) => (
                        <li key={campus.id} className="p-6 flex flex-col gap-4">
                          <div className="flex flex-col sm:flex-row gap-4">
                            {campus.image || institution.image ? (
                              <SmartImage
                                src={campus.image || institution.image}
                                alt={fill(t('intercambios.form.imageAlt'), { name: campus.name })}
                                width={320}
                                height={200}
                                quality={75}
                                sizes="(min-width: 640px) 320px, 100vw"
                                className="w-full sm:w-80 h-48 rounded-2xl object-cover shrink-0"
                                fallbackSrc={media.intercambios_card_toquio}
                                placeholderLabel={campus.name}
                              />
                            ) : null}
                            <div className="flex-1 flex flex-col gap-2">
                              <h4 className="font-heading text-lg font-semibold text-secondary">{campus.name}</h4>
                              <p className="text-[10px] text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span className="flex items-center gap-1">
                                  <MapPin aria-hidden className="h-3 w-3" />
                                  {campus.city}
                                </span>
                                {campus.location ? (
                                  <span className="flex items-center gap-1">
                                    <Users aria-hidden className="h-3 w-3" />
                                    {campus.location}
                                  </span>
                                ) : null}
                              </p>
                              {campus.description ? (
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  {campus.description}
                                </p>
                              ) : null}
                            </div>
                          </div>

                          {campus.programs.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                              {t('intercambios.programs.empty')}
                            </p>
                          ) : (
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {campus.programs.map((program) => (
                                <li
                                  key={program.id}
                                  className="border border-border rounded-2xl p-5 flex flex-col gap-3"
                                >
                                  <h5 className="font-heading text-base font-bold text-secondary leading-tight">
                                    {program.name}
                                  </h5>
                                  {program.description ? (
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                      {program.description}
                                    </p>
                                  ) : null}
                                  <dl className="flex flex-wrap gap-x-5 gap-y-1 text-[10px] text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                      <dt className="sr-only">{t('intercambios.duracao')}</dt>
                                      <Clock aria-hidden className="h-3 w-3 text-accent" />
                                      <dd>{program.durationLabel}</dd>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <dt className="sr-only">{t('intercambios.aulas-semana')}</dt>
                                      <BookOpen aria-hidden className="h-3 w-3 text-accent" />
                                      <dd>{program.classesLabel}</dd>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <dt className="sr-only">{t('intercambios.programs.level')}</dt>
                                      <Award aria-hidden className="h-3 w-3 text-accent" />
                                      <dd>{program.level}</dd>
                                    </div>
                                  </dl>
                                  {program.flags.length > 0 ? (
                                    <ul className="flex flex-wrap gap-2">
                                      {program.flags.map(({ label, Icon }) => (
                                        <li
                                          key={label}
                                          className="inline-flex items-center gap-1 text-[9px] uppercase tracking-widest border border-border rounded-full px-2.5 py-1 text-muted-foreground"
                                        >
                                          <Icon aria-hidden className="h-2.5 w-2.5" />
                                          {label}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : null}
                                  {program.price > 0 ? (
                                    <p className="text-xs font-bold text-primary font-heading">
                                      {t('jornadas.card.priceFrom')}{' '}
                                      {formatCurrency(program.price, 'BRL', { maximumFractionDigits: 0 })}
                                    </p>
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ── Formulário de solicitação ────────────────────────────────────── */}
        <section
          aria-labelledby="intercambios-form-title"
          className="py-16 px-4 md:px-8 max-w-6xl mx-auto w-full border-t border-border"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="flex flex-col gap-4">
              <span className="text-xs uppercase tracking-widest text-primary font-bold">
                {t('intercambios.form.kicker')}
              </span>
              <h2
                id="intercambios-form-title"
                className="font-heading text-3xl font-light text-secondary"
              >
                {t('intercambios.programs.formTitle')}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('intercambios.form.description')}
              </p>
              <ul className="flex flex-col gap-2 mt-2">
                {[
                  'intercambios.form.benefit1',
                  'intercambios.form.benefit2',
                  'intercambios.form.benefit3',
                ].map((key) => (
                  <li key={key} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Award aria-hidden className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                    {t(key)}
                  </li>
                ))}
              </ul>
              <Link
                href={lp('/contato')}
                className="text-xs font-semibold text-primary hover:text-accent-hover transition-colors w-fit mt-4"
              >
                {t('contato.cta.requestPersonalizedPlan')}
              </Link>
            </div>

            <div className="border border-border rounded-3xl bg-card p-6 md:p-8">
              <ExchangeInquiryForm campuses={campusOptions} programs={programOptions} />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
