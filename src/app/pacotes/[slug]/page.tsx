import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SmartImage from '@/components/SmartImage';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import { prisma } from '@/lib/prisma';
import { getPublicSiteConfig } from '@/actions/siteConfigActions';
import { getMediaMap } from '@/lib/cmsData';
import { getServerI18n } from '@/lib/serverI18n';
import { parseStringArray } from '@/lib/validate';
import {
  CONTACT,
  DEFAULT_OG_IMAGE,
  buildMetadata,
  productJsonLd,
  touristTripJsonLd,
  truncateMeta,
} from '@/lib/seo';
import PackageRequestForm from './_components/PackageRequestForm';

/* ────────────────────────────────────────────────────────────────────────────
 * Helpers de dados
 * ────────────────────────────────────────────────────────────────────────── */

const PACKAGE_SELECT = {
  id: true,
  slug: true,
  title: true,
  destination: true,
  price: true,
  category: true,
  status: true,
  description: true,
  gallery: true,
  itinerary: true,
  included: true,
  notIncluded: true,
  updatedAt: true,
} as const;

/**
 * O roteiro é um JSON de OBJETOS (`{day, title, description}`) ou, em registros
 * antigos, uma lista de strings. `parseStringArray` só serve para listas de
 * texto, então o roteiro tem o seu próprio leitor — tolerante aos dois formatos.
 */
interface ItineraryDay {
  day: string;
  title: string;
  description: string;
}

const readJsonArray = (raw: unknown): unknown[] => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== 'string' || !raw.trim()) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const parseItinerary = (raw: unknown): ItineraryDay[] =>
  readJsonArray(raw)
    .slice(0, 90)
    .map((entry, index) => {
      if (entry && typeof entry === 'object') {
        const record = entry as Record<string, unknown>;
        const day =
          record.day === undefined || record.day === null || record.day === ''
            ? String(index + 1)
            : String(record.day);
        return {
          day,
          title: String(record.title ?? record.name ?? '').trim(),
          description: String(record.description ?? record.detail ?? '').trim(),
        };
      }
      return { day: String(index + 1), title: String(entry ?? '').trim(), description: '' };
    })
    .filter((entry) => entry.title.length > 0);

/** `Package.category` → chave canônica do rótulo (fallback: `standard`). */
const PACKAGE_CATEGORY_KEYS: Record<string, string> = {
  drip: 'pacotes.detail.category.drip',
  standard: 'pacotes.detail.category.standard',
  luxury: 'pacotes.detail.category.luxury',
  experience: 'pacotes.detail.category.experience',
};

/** Só dígitos para montar o link `wa.me`. */
const toWhatsappDigits = (value: string | null | undefined, fallback: string): string =>
  (value ?? '').replace(/[^\d]/g, '') || fallback;

/* ────────────────────────────────────────────────────────────────────────────
 * Rotas estáticas
 * ────────────────────────────────────────────────────────────────────────── */

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  try {
    const packages = await prisma.package.findMany({
      where: { status: 'active' },
      orderBy: { id: 'asc' },
      take: 100,
      select: { slug: true },
    });
    return packages.map((pack) => ({ slug: pack.slug }));
  } catch {
    // Sem banco a rota ainda é renderizada sob demanda (sem 500 no build).
    return [];
  }
}

/* ────────────────────────────────────────────────────────────────────────────
 * SEO
 * ────────────────────────────────────────────────────────────────────────── */

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { t, locale, fill } = await getServerI18n();

  let pack: { title: string; description: string | null; gallery: string } | null = null;
  try {
    pack = await prisma.package.findUnique({
      where: { slug },
      select: { title: true, description: true, gallery: true },
    });
  } catch {
    pack = null;
  }

  if (!pack) {
    return buildMetadata({
      title: truncateMeta(t('pacotes.pacote-nao-encontrado'), 60),
      description: t('pacotes.detail.notFoundDescription'),
      path: `/pacotes/${slug}`,
      locale,
      noindex: true,
    });
  }

  const gallery = parseStringArray(pack.gallery, 24);
  return buildMetadata({
    title: truncateMeta(fill(t('pacotes.detail.seoTitle'), { title: pack.title }), 60),
    description: truncateMeta(
      fill(t('pacotes.detail.seoDescriptionTemplate'), { title: pack.title }),
      160,
    ),
    path: `/pacotes/${slug}`,
    locale,
    image: gallery[0] ?? DEFAULT_OG_IMAGE,
    imageAlt: fill(t('pacotes.detail.galleryAlt'), { title: pack.title }),
  });
}

/* ────────────────────────────────────────────────────────────────────────────
 * Página
 * ────────────────────────────────────────────────────────────────────────── */

export default async function PackageDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const { t, locale, lp, fill, formatCurrency, formatNumber } = await getServerI18n();

  const [pack, media, siteConfig] = await Promise.all([
    prisma.package.findUnique({ where: { slug }, select: PACKAGE_SELECT }),
    getMediaMap().catch(() => ({}) as Record<string, string>),
    getPublicSiteConfig().catch(() => null),
  ]);

  if (!pack || pack.status !== 'active') notFound();

  const gallery = parseStringArray(pack.gallery, 24);
  const itinerary = parseItinerary(pack.itinerary);
  const included = parseStringArray(pack.included, 40);
  const notIncluded = parseStringArray(pack.notIncluded, 40);

  const durationDays = itinerary.length;
  const categoryKey = PACKAGE_CATEGORY_KEYS[pack.category] ?? PACKAGE_CATEGORY_KEYS.standard!;
  const cover = gallery[0] ?? media.pacotes_jornada_army ?? DEFAULT_OG_IMAGE;
  const priceLabel = formatCurrency(pack.price, 'BRL', { maximumFractionDigits: 0 });

  const whatsappDigits = toWhatsappDigits(siteConfig?.contact.whatsapp, CONTACT.whatsapp);
  const whatsappUrl = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
    t('pacotes.detail.whatsappMessagePrefix'),
  )}${encodeURIComponent(pack.title)}`;

  const productLd = productJsonLd({
    name: pack.title,
    description: pack.description ?? pack.title,
    path: `/pacotes/${pack.slug}`,
    locale,
    image: gallery.length ? gallery : cover,
    price: pack.price,
    priceCurrency: 'BRL',
    category: t(categoryKey),
  });

  const tripLd = touristTripJsonLd({
    name: pack.title,
    description: pack.description ?? pack.title,
    path: `/pacotes/${pack.slug}`,
    locale,
    image: gallery.length ? gallery : cover,
    durationDays: durationDays > 0 ? durationDays : null,
    price: pack.price,
    priceCurrency: 'BRL',
    itinerary: itinerary.slice(0, 20).map((day) => ({
      name: `${t('pacotes.dia')} ${day.day} — ${day.title}`,
    })),
  });

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <JsonLd id="pacote-product-jsonld" data={productLd} />
      <JsonLd id="pacote-trip-jsonld" data={tripLd} />

      <Header />

      <main className="flex-1 w-full py-12 px-4 md:px-8 max-w-7xl mx-auto">
        <Breadcrumbs
          locale={locale}
          items={[
            { name: t('pacotes.list.breadcrumb'), path: '/pacotes' },
            { name: truncateMeta(pack.title, 60), path: `/pacotes/${pack.slug}` },
          ]}
          className="mb-8"
        />

        <Link
          href={lp('/pacotes')}
          className="text-xs uppercase font-bold text-muted-foreground hover:text-primary tracking-wider flex items-center gap-1.5 mb-8 w-fit"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" /> {t('pacotes.detail.backToAllPackages')}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* ── Conteúdo principal ─────────────────────────────────────────── */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                {pack.destination ?? t('pacotes.viagem-exclusiva')}
              </span>
              <h1 className="font-heading text-3xl sm:text-5xl font-light text-secondary mt-2 leading-tight">
                {pack.title}
              </h1>
              {pack.description ? (
                <p className="text-sm text-muted-foreground font-light mt-4 leading-relaxed">
                  {pack.description}
                </p>
              ) : null}
            </div>

            <div className="relative aspect-[16/9] w-full rounded-3xl overflow-hidden border border-border">
              <SmartImage
                src={cover}
                alt={fill(t('pacotes.detail.galleryAlt'), { title: pack.title })}
                fill
                priority
                quality={90}
                sizes="(min-width: 1024px) 66vw, 100vw"
                className="object-cover"
                placeholderLabel={pack.title}
              />
            </div>

            {gallery.length > 1 ? (
              <ul className="grid grid-cols-3 gap-3">
                {gallery.slice(1, 7).map((src) => (
                  <li key={src} className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-border">
                    <SmartImage
                      src={src}
                      alt={fill(t('pacotes.detail.galleryAlt'), { title: pack.title })}
                      fill
                      sizes="(min-width: 1024px) 21vw, 33vw"
                      quality={75}
                      className="object-cover"
                      placeholderLabel={pack.title}
                    />
                  </li>
                ))}
              </ul>
            ) : null}

            {/* Roteiro */}
            {itinerary.length > 0 ? (
              <section aria-labelledby="pacote-itinerary-title" className="mt-4">
                <h2
                  id="pacote-itinerary-title"
                  className="font-heading text-2xl font-light text-secondary uppercase tracking-wider border-b border-border pb-4 mb-6"
                >
                  {t('pacotes.roteiro-dia-a-dia')}
                </h2>
                <ol className="flex flex-col gap-6 pl-4 border-l border-primary/20 relative">
                  {itinerary.map((day) => (
                    <li key={`${day.day}-${day.title}`} className="relative flex flex-col gap-1 pb-4">
                      <span
                        aria-hidden
                        className="absolute -left-[21px] top-0 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background"
                      />
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                        {fill(t('pacotes.detail.itineraryDayLabel'), { n: day.day })}
                      </span>
                      <h3 className="font-heading text-lg font-bold text-secondary leading-tight mt-0.5">
                        {day.title}
                      </h3>
                      {day.description ? (
                        <p className="text-xs text-muted-foreground font-light leading-relaxed mt-1">
                          {day.description}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            {/*Incluso / não incluso */}
            {included.length > 0 || notIncluded.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-border pt-8 mt-4">
                {included.length > 0 ? (
                  <section aria-labelledby="pacote-included-title">
                    <h2
                      id="pacote-included-title"
                      className="text-xs font-bold text-secondary uppercase tracking-widest flex items-center gap-1.5"
                    >
                      <CheckCircle2 aria-hidden className="h-4.5 w-4.5 text-green-600" />
                      {t('pacotes.detail.alt-x')}
                    </h2>
                    <ul className="flex flex-col gap-2 text-xs text-muted-foreground mt-3">
                      {included.map((item) => (
                        <li key={item} className="flex items-start gap-1.5 font-light">
                          <span aria-hidden className="text-green-500 font-bold mr-1">
                            ✓
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {notIncluded.length > 0 ? (
                  <section aria-labelledby="pacote-notincluded-title">
                    <h2
                      id="pacote-notincluded-title"
                      className="text-xs font-bold text-secondary uppercase tracking-widest flex items-center gap-1.5"
                    >
                      <XCircle aria-hidden className="h-4.5 w-4.5 text-red-500" />
                      {t('pacotes.o-que-nao-esta-incluso')}
                    </h2>
                    <ul className="flex flex-col gap-2 text-xs text-muted-foreground mt-3">
                      {notIncluded.map((item) => (
                        <li key={item} className="flex items-start gap-1.5 font-light">
                          <span aria-hidden className="text-red-500 font-bold mr-1">
                            ✗
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* ── Sidebar de investimento + formulário ──────────────────────── */}
          <aside className="flex flex-col gap-6">
            <div className="border border-border rounded-3xl p-8 bg-card shadow-sm flex flex-col gap-6 h-fit lg:sticky lg:top-28">
              <div>
                <span className="text-[10px] uppercase font-bold text-primary tracking-widest">
                  {t('pacotes.detail.investment')}
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-heading text-3xl font-bold text-primary">{priceLabel}</span>
                  <span className="text-xs text-muted-foreground">{t('pacotes.por-pessoa')}</span>
                </div>
              </div>

              <div className="h-px bg-border" aria-hidden />

              <dl className="flex flex-col gap-2.5 text-xs text-muted-foreground">
                <div className="flex justify-between gap-3">
                  <dt>{t('pacotes.duracao')}</dt>
                  <dd className="font-bold text-secondary text-right">
                    {durationDays > 0
                      ? fill(t('pacotes.detail.daysTemplate'), { n: formatNumber(durationDays) })
                      : t('pacotes.detail.daysUnknown')}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>{t('pacotes.detail.categoryLabel')}</dt>
                  <dd className="font-bold text-secondary text-right">{t(categoryKey)}</dd>
                </div>
              </dl>

              <div className="mt-2">
                <h2 className="text-[10px] uppercase font-bold text-secondary tracking-widest mb-3">
                  {t('pacotes.detail.requestQuote')}
                </h2>
                <PackageRequestForm
                  packTitle={pack.title}
                  packSlug={pack.slug}
                  price={pack.price}
                  currency="BRL"
                  priceLabel={priceLabel}
                  whatsappUrl={whatsappUrl}
                />
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-2 border-t border-border pt-4">
                {t('pacotes.detail.orChatNowVia')}
              </div>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-[#25d366] hover:bg-[#20ba5a] text-white text-xs font-bold py-3.5 rounded-xl uppercase tracking-wider shadow-sm"
              >
                {t('pacotes.detail.directWhatsApp')}
              </a>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
