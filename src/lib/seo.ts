import type { Metadata } from 'next';
import { cache } from 'react';
import { headers } from 'next/headers';
import {
  LOCALE_HEADER,
  defaultLocale,
  htmlLang,
  isLocale,
  locales,
  type Locale,
} from '@/i18n/config';

/** Reexportado para que os agentes de página precisem de um único import. */
export type { Locale };

/* ────────────────────────────────────────────────────────────────────────────
 * Constantes de marca
 * ────────────────────────────────────────────────────────────────────────── */

export const SITE_NAME = 'Maeum Global';

/**
 * Domínio canônico, sempre SEM barra final.
 * `NEXT_PUBLIC_SITE_URL` é a fonte de verdade; o fallback é o domínio de produção.
 */
export const SITE_URL: string = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://maeumglobal.com.br'
).replace(/\/+$/, '');

export const LOGO_URL = siteUrl('/images/logo.png');

/** Imagem social padrão (hero da home). Repositório local — sempre absoluta. */
export const DEFAULT_OG_IMAGE = '/images/agencia-viagens-coreia-do-sul-maeum-global-oficial.webp';

/** Contato público usado nos JSON-LD de Organization/TravelAgency/LocalBusiness. */
export const CONTACT = {
  email: 'atendimento@maeumglobal.com.br',
  phone: '+55 (41) 98709-4799',
  phoneE164: '+5541987094799',
  whatsapp: '5541987094799',
  city: 'Curitiba',
  region: 'PR',
  country: 'BR',
  countryName: 'Brazil',
} as const;

export const SOCIAL_LINKS: readonly string[] = [
  'https://instagram.com/maeumglobal',
  'https://youtube.com/maeumglobal',
  'https://wa.me/821024836078',
] as const;

/* ────────────────────────────────────────────────────────────────────────────
 * Locale / request
 * ────────────────────────────────────────────────────────────────────────── */

/** `pt-BR` → `pt_BR` (formato exigido pelo Open Graph). */
export const ogLocale = (locale: Locale): string => htmlLang[locale].replace('-', '_');

/**
 * Lê o idioma da requisição a partir do header `x-maeum-locale`, injetado pelo
 * `src/proxy.ts` na REQUISIÇÃO (não na resposta). `cache()` garante que
 * `generateMetadata` e o layout leiam o header uma única vez por render.
 *
 * ⚠️ `headers()` é uma API dinâmica: este é o ÚNICO ponto do site que a usa,
 * então ele é a razão de a rota ser renderizada dinamicamente. Todo o resto da
 * camada de SEO é puro e cacheável.
 *
 * Fallback: 'pt' (locale default, sem prefixo na URL).
 */
export const resolveRequestLocale = cache(async (): Promise<Locale> => {
  try {
    const h = await headers();
    const raw = h.get(LOCALE_HEADER);
    if (isLocale(raw)) return raw;
    return defaultLocale;
  } catch {
    // fora de um escopo de request (ex.: script de validação) → default
    return defaultLocale;
  }
});

/* ────────────────────────────────────────────────────────────────────────────
 * URLs
 * ────────────────────────────────────────────────────────────────────────── */

/** Normaliza um path interno e devolve a URL absoluta (ou devolve a URL como está). */
export function siteUrl(path: string = '/'): string {
  if (!path) return `${SITE_URL}/`;
  if (/^https?:\/\//i.test(path)) return path;
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (clean === '/') return `${SITE_URL}/`;
  return `${SITE_URL}${clean}`;
}

/**
 * Path interno já com o prefixo de locale. `pt` não recebe prefixo.
 *
 * A raiz de um idioma não-default devolve `/{locale}/` (com barra final) porque
 * é exatamente para lá que `src/proxy.ts` redireciona `/en` → `/en/` (308):
 * emitir `/en` no canonical geraria um redirect extra em toda visita.
 */
export function localizedPathname(path: string, locale: Locale = defaultLocale): string {
  const clean = !path ? '/' : path.startsWith('/') ? path : `/${path}`;
  if (locale === defaultLocale) return clean;
  // A raiz do idioma fica `/en` (sem barra final): o Next normaliza
  // `/en/` para `/en`, então emitir `/en/` criaria um ping-pong de redirect
  // entre o proxy e a normalização de trailing slash.
  if (clean === '/') return `/${locale}`;
  return `/${locale}${clean}`;
}

/** URL absoluta já localizada: `localizedUrl('/destinos', 'en')` → `https://…/en/destinos`. */
export function localizedUrl(path: string, locale: Locale = defaultLocale): string {
  return siteUrl(localizedPathname(path, locale));
}

/**
 * Mapa hreflang completo para um MESMO path nas três línguas + x-default.
 * Usado tanto por `buildMetadata` quanto pelo sitemap.
 */
export function languageAlternates(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const l of locales) out[l] = localizedUrl(path, l);
  out['x-default'] = localizedUrl(path, defaultLocale);
  return out;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Texto / truncagem
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * Normaliza e corta um texto para caber em `max` caracteres SEM quebrar
 * palavras no meio e sem estourar o limite (o "…" entra na contagem).
 */
export function truncateMeta(text: string | null | undefined, max = 160): string {
  if (!text) return '';
  const flat = String(text).replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  const slice = flat.slice(0, Math.max(0, max - 1));
  const lastSpace = slice.lastIndexOf(' ');
  const base = lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${base.replace(/[\s,;:.\-–—]+$/, '')}…`;
}

/* ────────────────────────────────────────────────────────────────────────────
 * SEO padrão da home — OVERRIDE LOCAL (≤160 chars por idioma)
 *
 * `src/i18n/index.ts` pertence a outro agente e continua publicando textos de
 * 206–224 caracteres, acima do limite de snippet do Google. Até lá, este mapa
 * é a fonte de verdade para o layout raiz.
 * ────────────────────────────────────────────────────────────────────────── */

export const HOME_SEO: Record<Locale, { title: string; description: string; keywords: string[] }> = {
  pt: {
    title: 'Maeum Global | Turismo de Luxo e Intercâmbio na Coreia do Sul',
    description:
      'Agência de viagens de luxo na Coreia do Sul: roteiros sob medida, hotéis 5 estrelas, experiências exclusivas e intercâmbio de alto padrão.',
    keywords: [
      'turismo de luxo',
      'viagens para Coreia do Sul',
      'intercâmbio na Coreia do Sul',
      'Seul',
      'Busan',
      'Jeju',
      'K-beauty',
      'viagem K-Pop',
      'consultora de viagens',
    ],
  },
  en: {
    title: 'Maeum Global | Luxury Travel & Exchange in South Korea',
    description:
      'Luxury travel agency in South Korea: bespoke itineraries, 5-star hotels, exclusive experiences and high-end study exchange programs.',
    keywords: [
      'luxury travel',
      'South Korea travel',
      'study exchange in Korea',
      'Seoul',
      'Busan',
      'Jeju',
      'K-beauty tour',
      'K-Pop experience',
      'travel consultant',
    ],
  },
  es: {
    title: 'Maeum Global | Turismo de Lujo e Intercambio en Corea del Sur',
    description:
      'Agencia de viajes de lujo en Corea del Sur: itinerarios a medida, hoteles de 5 estrellas, experiencias exclusivas e intercambio de alto nivel.',
    keywords: [
      'turismo de lujo',
      'viajes a Corea del Sur',
      'intercambio en Corea del Sur',
      'Seúl',
      'Busan',
      'Jeju',
      'K-beauty',
      'experiencia K-Pop',
      'consultora de viajes',
    ],
  },
};

/* ────────────────────────────────────────────────────────────────────────────
 * buildMetadata
 * ────────────────────────────────────────────────────────────────────────── */

export type SeoImage = string | { url: string; alt?: string; width?: number; height?: number };

export interface BuildMetadataInput {
  title: string;
  description: string;
  /** Path interno canônico (pt, sem prefixo): '/destinos'. Use '/' para a home. */
  path?: string;
  /** Locale da página — define canonical e `lang`. Default: 'pt'. */
  locale?: Locale;
  /** Imagem social. Aceita path local ou URL absoluta. */
  image?: SeoImage;
  imageAlt?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
  publishedTime?: string | Date | null;
  modifiedTime?: string | Date | null;
  /** Sobrescreve as keywords localizadas padrão. */
  keywords?: string[];
}

const toIsoString = (value: string | Date | null | undefined): string | undefined => {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

const resolveImage = (
  image: SeoImage | undefined,
  alt: string | undefined,
): { url: string; alt: string; width: number; height: number } => {
  const width = 1200;
  const height = 630;
  if (typeof image === 'string' && image.trim()) {
    return { url: siteUrl(image.trim()), alt: alt ?? SITE_NAME, width, height };
  }
  if (image && typeof image === 'object' && typeof image.url === 'string' && image.url.trim()) {
    return {
      url: siteUrl(image.url.trim()),
      alt: image.alt ?? alt ?? SITE_NAME,
      width: image.width ?? width,
      height: image.height ?? height,
    };
  }
  return { url: siteUrl(DEFAULT_OG_IMAGE), alt: alt ?? SITE_NAME, width, height };
};

/**
 * Metadata canônica do Next.js: canonical auto-referenciado, hreflang completo,
 * Open Graph, Twitter card e robots. Usar em TODA página que queira ser
 * indexável — o layout raiz sozinho não basta.
 */
export function buildMetadata(input: BuildMetadataInput): Metadata {
  const locale: Locale = isLocale(input.locale) ? input.locale : defaultLocale;
  const path = input.path ?? '/';
  const canonical = localizedUrl(path, locale);
  const description = truncateMeta(input.description, 160);
  const image = resolveImage(input.image, input.imageAlt ?? input.title);
  const type = input.type ?? 'website';

  const keywords = input.keywords && input.keywords.length > 0 ? input.keywords : HOME_SEO[locale].keywords;

  const publishedTime = toIsoString(input.publishedTime);
  const modifiedTime = toIsoString(input.modifiedTime);

  // `Metadata['robots']` aceita `string | Robots`; queremos o objeto tipado.
  type RobotsConfig = Exclude<NonNullable<Metadata['robots']>, string>;

  const robots: RobotsConfig = input.noindex
    ? { index: false, follow: false, googleBot: { index: false, follow: false } }
    : {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      };

  return {
    metadataBase: new URL(SITE_URL),
    title: input.title,
    description,
    keywords,
    applicationName: SITE_NAME,
    creator: SITE_NAME,
    publisher: SITE_NAME,
    alternates: {
      canonical,
      languages: languageAlternates(path),
    },
    openGraph: {
      type,
      title: input.title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: ogLocale(locale),
      alternateLocale: locales.filter((l) => l !== locale).map(ogLocale),
      images: [image],
      ...(type === 'article' && publishedTime ? { publishedTime } : {}),
      ...(type === 'article' && modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: input.title,
      description,
      images: [image.url],
    },
    robots,
  };
}

/** Metadata de rota que NÃO deve ser indexada (login, dashboard, admin, proposta privada). */
export function buildNoIndexMetadata(title: string, path = '/'): Metadata {
  return buildMetadata({ title, description: '', path, noindex: true });
}

/* ────────────────────────────────────────────────────────────────────────────
 * JSON-LD
 * ────────────────────────────────────────────────────────────────────────── */

const ORG_ID = `${SITE_URL}/#organization`;
const AGENCY_ID = `${SITE_URL}/#travelagency`;
const LOCAL_BUSINESS_ID = `${SITE_URL}/#localbusiness`;
const WEBSITE_ID = `${SITE_URL}/#website`;

const postalAddress = () => ({
  '@type': 'PostalAddress',
  addressLocality: CONTACT.city,
  addressRegion: CONTACT.region,
  addressCountry: CONTACT.country,
});

/** Nó raiz reaproveitado por todos os grafos para manter as entidadesLigadas. */
const organizationNode = (locale: Locale) => ({
  '@type': 'Organization',
  '@id': ORG_ID,
  name: SITE_NAME,
  url: siteUrl('/'),
  logo: { '@type': 'ImageObject', url: LOGO_URL },
  image: { '@type': 'ImageObject', url: siteUrl(DEFAULT_OG_IMAGE) },
  description: truncateMeta(HOME_SEO[locale].description, 300),
  email: CONTACT.email,
  telephone: CONTACT.phone,
  address: postalAddress(),
  contactPoint: [
    {
      '@type': 'ContactPoint',
      telephone: CONTACT.phone,
      email: CONTACT.email,
      contactType: 'customer service',
      areaServed: ['BR', 'US', 'ES'],
      availableLanguage: ['Portuguese', 'English', 'Spanish'],
    },
  ],
  sameAs: [...SOCIAL_LINKS],
});

/**
 * Organization + TravelAgency + LocalBusiness num único @graph.
 * Usa no `<head>` do layout raiz (todas as páginas herdam).
 */
export function travelAgencyJsonLd(locale: Locale = defaultLocale) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      organizationNode(locale),
      {
        '@type': 'TravelAgency',
        '@id': AGENCY_ID,
        name: SITE_NAME,
        alternateName: 'MaeumGlobal',
        url: siteUrl('/'),
        description: truncateMeta(HOME_SEO[locale].description, 300),
        image: { '@type': 'ImageObject', url: siteUrl(DEFAULT_OG_IMAGE) },
        logo: { '@type': 'ImageObject', url: LOGO_URL },
        parentOrganization: { '@id': ORG_ID },
        priceRange: '$$$',
        currenciesAccepted: 'BRL, USD, EUR',
        paymentAccepted: 'Pix, Boleto, Cartão de crédito, Transferência',
        address: postalAddress(),
        telephone: CONTACT.phone,
        email: CONTACT.email,
        areaServed: [
          { '@type': 'Country', name: 'Brazil' },
          { '@type': 'Country', name: 'South Korea' },
        ],
        knowsAbout: [
          'Luxury travel',
          'Study exchange programs',
          'K-beauty',
          'K-Pop experiences',
          'Korean cuisine tours',
        ],
        sameAs: [...SOCIAL_LINKS],
      },
      {
        '@type': 'LocalBusiness',
        '@id': LOCAL_BUSINESS_ID,
        name: SITE_NAME,
        url: siteUrl('/'),
        description: truncateMeta(HOME_SEO[locale].description, 300),
        image: { '@type': 'ImageObject', url: siteUrl(DEFAULT_OG_IMAGE) },
        logo: { '@type': 'ImageObject', url: LOGO_URL },
        telephone: CONTACT.phone,
        email: CONTACT.email,
        priceRange: '$$$',
        address: postalAddress(),
        areaServed: [{ '@type': 'Country', name: 'Brazil' }],
        sameAs: [...SOCIAL_LINKS],
      },
    ],
  };
}

/** WebSite + SearchAction apontando para a busca de destinos (`/destinos?q=`). */
export function websiteJsonLd(locale: Locale = defaultLocale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: siteUrl('/'),
    name: SITE_NAME,
    alternateName: 'MaeumGlobal',
    description: truncateMeta(HOME_SEO[locale].description, 300),
    inLanguage: htmlLang[locale],
    publisher: { '@id': ORG_ID },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl('/destinos')}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/** BreadcrumbList. `items[0]` deve ser a home ("/"). */
export function breadcrumbJsonLd(
  items: { name: string; path: string }[],
  locale: Locale = defaultLocale,
) {
  const list = (items ?? []).filter((item) => item && item.name);
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: list.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: localizedUrl(item.path ?? '/', locale),
    })),
  };
}

export interface ProductJsonLdInput {
  name: string;
  description: string;
  /** Path interno canônico: '/coreia-do-sul/experiencias/bbq-seoul'. */
  path: string;
  locale?: Locale;
  image?: string | string[];
  price?: number | null;
  priceCurrency?: string;
  availability?: string;
  sku?: string;
  category?: string;
  brand?: string;
  ratingValue?: number | null;
  reviewCount?: number | null;
}

/** Product + Offer — usada por experiências, jornadas e pacotes. */
export function productJsonLd(input: ProductJsonLdInput) {
  const locale = isLocale(input.locale) ? input.locale : defaultLocale;
  const url = localizedUrl(input.path, locale);
  const images = (Array.isArray(input.image) ? input.image : [input.image ?? DEFAULT_OG_IMAGE])
    .filter((v): v is string => typeof v === 'string' && v.length > 0)
    .map((v) => siteUrl(v));

  const hasPrice = typeof input.price === 'number' && Number.isFinite(input.price) && input.price > 0;

  return {
    '@context': 'https://schema.org',
    '@type': ['Product', 'Service'],
    '@id': `${url}#product`,
    name: input.name,
    description: truncateMeta(input.description, 300),
    url,
    ...(images.length ? { image: images } : {}),
    ...(input.sku ? { sku: input.sku } : {}),
    ...(input.category ? { category: input.category } : {}),
    brand: { '@type': 'Brand', name: input.brand ?? SITE_NAME },
    ...(hasPrice
      ? {
          offers: {
            '@type': 'Offer',
            url,
            price: (input.price as number).toFixed(2),
            priceCurrency: input.priceCurrency ?? 'BRL',
            availability: input.availability ?? 'https://schema.org/InStock',
            seller: { '@id': AGENCY_ID },
          },
        }
      : {}),
    ...(typeof input.ratingValue === 'number' && typeof input.reviewCount === 'number' && input.reviewCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: input.ratingValue,
            reviewCount: input.reviewCount,
            bestRating: 5,
          },
        }
      : {}),
  };
}

export interface TouristTripJsonLdInput {
  name: string;
  description: string;
  path: string;
  locale?: Locale;
  image?: string | string[];
  /** Duração em dias. */
  durationDays?: number | null;
  price?: number | null;
  priceCurrency?: string;
  touristType?: string;
  /** Etapas do roteiro (nome + caminho canônico ou URL). */
  itinerary?: { name: string; path?: string; image?: string }[];
  departureDate?: string | Date | null;
  providerName?: string;
}

/** TouristTrip + itinerary (ItemList) — jornadas e pacotes com roteiro. */
export function touristTripJsonLd(input: TouristTripJsonLdInput) {
  const locale = isLocale(input.locale) ? input.locale : defaultLocale;
  const url = localizedUrl(input.path, locale);
  const images = (Array.isArray(input.image) ? input.image : [input.image ?? DEFAULT_OG_IMAGE])
    .filter((v): v is string => typeof v === 'string' && v.length > 0)
    .map((v) => siteUrl(v));

  const stops = (input.itinerary ?? []).filter((stop) => stop && stop.name);
  const departure = input.departureDate ? new Date(input.departureDate) : null;

  return {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    '@id': `${url}#trip`,
    name: input.name,
    description: truncateMeta(input.description, 300),
    url,
    ...(images.length ? { image: images } : {}),
    touristType: input.touristType ?? 'Leisure travelers',
    provider: {
      '@type': 'TravelAgency',
      name: input.providerName ?? SITE_NAME,
      url: siteUrl('/'),
      '@id': AGENCY_ID,
    },
    ...(typeof input.durationDays === 'number' && input.durationDays > 0
      ? { duration: `P${Math.round(input.durationDays)}D` }
      : {}),
    ...(departure && !Number.isNaN(departure.getTime())
      ? { departureTime: departure.toISOString().slice(0, 10) }
      : {}),
    ...(typeof input.price === 'number' && Number.isFinite(input.price) && input.price > 0
      ? {
          offers: {
            '@type': 'Offer',
            url,
            price: input.price.toFixed(2),
            priceCurrency: input.priceCurrency ?? 'BRL',
            availability: 'https://schema.org/InStock',
            seller: { '@id': AGENCY_ID },
          },
        }
      : {}),
    ...(stops.length
      ? {
          itinerary: {
            '@type': 'ItemList',
            numberOfItems: stops.length,
            itemListElement: stops.map((stop, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              item: {
                '@type': 'TouristAttraction',
                name: stop.name,
                ...(stop.path ? { url: localizedUrl(stop.path, locale) } : {}),
                ...(stop.image ? { image: siteUrl(stop.image) } : {}),
              },
            })),
          },
        }
      : {}),
  };
}

/** FAQPage — `items` deve vir de conteúdo real da página (nunca invente FAQ). */
export function faqJsonLd(items: { question: string; answer: string }[]) {
  const clean = (items ?? []).filter((item) => item && item.question && item.answer);
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: clean.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

export interface ArticleJsonLdInput {
  headline: string;
  description: string;
  path: string;
  locale?: Locale;
  image?: string | string[];
  authorName?: string;
  authorUrl?: string;
  publishedTime?: string | Date | null;
  modifiedTime?: string | Date | null;
  keywords?: string[];
  wordCount?: number | null;
  section?: string;
}

/** Article/BlogPosting — artigos do journal. */
export function articleJsonLd(input: ArticleJsonLdInput) {
  const locale = isLocale(input.locale) ? input.locale : defaultLocale;
  const url = localizedUrl(input.path, locale);
  const images = (Array.isArray(input.image) ? input.image : [input.image ?? DEFAULT_OG_IMAGE])
    .filter((v): v is string => typeof v === 'string' && v.length > 0)
    .map((v) => siteUrl(v));

  const published = input.publishedTime ? new Date(input.publishedTime) : null;
  const modified = input.modifiedTime ? new Date(input.modifiedTime) : null;

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    headline: truncateMeta(input.headline, 110),
    description: truncateMeta(input.description, 300),
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    inLanguage: htmlLang[locale],
    ...(images.length ? { image: images } : {}),
    author: {
      '@type': 'Person',
      name: input.authorName ?? SITE_NAME,
      ...(input.authorUrl ? { url: input.authorUrl } : {}),
    },
    publisher: { '@id': ORG_ID },
    ...(published && !Number.isNaN(published.getTime()) ? { datePublished: published.toISOString() } : {}),
    ...(modified && !Number.isNaN(modified.getTime()) ? { dateModified: modified.toISOString() } : {}),
    ...(input.keywords && input.keywords.length ? { keywords: input.keywords.join(', ') } : {}),
    ...(typeof input.wordCount === 'number' ? { wordCount: input.wordCount } : {}),
    ...(input.section ? { articleSection: input.section } : {}),
    isPartOf: { '@id': WEBSITE_ID },
  };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Serialização segura do JSON-LD
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * Serializa um payload JSON-LD para dentro de um `<script>`, neutralizando
 * o fechamento premature de tag (`</script>`), `<!--` e separadores U+2028/9.
 * Valida com `JSON.parse` antes de devolver; `null` em caso de falha.
 */
export function safeJsonLd(data: unknown): string | null {
  if (data === null || data === undefined) return null;
  try {
    const raw = JSON.stringify(data);
    if (!raw) return null;
    JSON.parse(raw); // valida antes de ir para o DOM
    return raw
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e')
      .replace(/&/g, '\\u0026')
      .replace(/\u2028/g, '\\u2028')
      .replace(/\u2029/g, '\\u2029');
  } catch (error) {
    console.warn('[seo] JSON-LD inválido, ignorando:', error);
    return null;
  }
}
