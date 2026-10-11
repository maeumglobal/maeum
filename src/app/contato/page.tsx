import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Award,
  Briefcase,
  Camera,
  Clock,
  Gift,
  Heart,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Phone,
  PhoneCall,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SmartImage from '@/components/SmartImage';
import JsonLd from '@/components/seo/JsonLd';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import ClientChatWidget from '@/components/chat/ClientChatWidget';
import { getPublicSiteConfig } from '@/actions/siteConfigActions';
import { getMediaMap } from '@/lib/cmsData';
import { getServerI18n } from '@/lib/serverI18n';
import { safeUrl } from '@/lib/validate';
import {
  CONTACT,
  SITE_URL,
  SITE_NAME,
  buildMetadata,
  localizedUrl,
  truncateMeta,
} from '@/lib/seo';
import ContactPlannerForm from './_components/ContactPlannerForm';

/* ────────────────────────────────────────────────────────────────────────────
 * SEO
 * ────────────────────────────────────────────────────────────────────────── */

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getServerI18n();
  return buildMetadata({
    title: truncateMeta(t('contato.seo.title'), 60),
    description: t('contato.seo.description'),
    path: '/contato',
    locale,
    image: '/images/agencia-viagens-coreia-do-sul-maeum-global-contato.webp',
    imageAlt: t('contato.heroImage.desktop'),
  });
}

/* ────────────────────────────────────────────────────────────────────────────
 * Helpers
 * ────────────────────────────────────────────────────────────────────────── */

/** Só dígitos (com `+` opcional) para `wa.me` / `tel:`. */
const telHref = (value: string): string => {
  const digits = value.replace(/[^\d+]/g, '');
  return `tel:${digits.startsWith('+') ? digits : `+${digits.replace(/^\+/, '')}`}`;
};

const waDigits = (value: string, fallback: string): string => value.replace(/[^\d]/g, '') || fallback;

/** Link do Google Maps a partir do endereço configurado no painel. */
const mapSearchUrl = (address: string, query: string): string =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || query)}`;

const PILLARS: readonly {
  id: string;
  titleKeys: [string, string?];
  descriptionKey: string;
  Icon: LucideIcon;
}[] = [
  {
    id: 'support',
    titleKeys: ['contato.cards.support.title', 'contato.cards.support.subtitle'],
    descriptionKey: 'contato.cards.support.description',
    Icon: MessageSquare,
  },
  {
    id: 'speed',
    titleKeys: ['contato.cards.speed.title', 'contato.cards.speed.subtitle'],
    descriptionKey: 'contato.cards.speed.description',
    Icon: Clock,
  },
  {
    id: 'safety',
    titleKeys: ['contato.cards.safety.title'],
    descriptionKey: 'contato.cards.safety.description',
    Icon: ShieldCheck,
  },
  {
    id: 'consultants',
    titleKeys: ['contato.cards.consultants.title1', 'contato.cards.consultants.title2'],
    descriptionKey: 'contato.cards.consultants.description',
    Icon: Users,
  },
  {
    id: 'human',
    titleKeys: ['contato.cards.support.title', 'contato.cards.human.title'],
    descriptionKey: 'contato.cards.human.description',
    Icon: Heart,
  },
];

const TIMELINE: readonly { titleKey: string; descriptionKey: string; Icon: LucideIcon }[] = [
  {
    titleKey: 'contato.timeline.item1Title',
    descriptionKey: 'contato.timeline.item1Description',
    Icon: Briefcase,
  },
  {
    titleKey: 'contato.timeline.item2Title',
    descriptionKey: 'contato.timeline.item2Description',
    Icon: ShieldCheck,
  },
  {
    titleKey: 'contato.timeline.item3Title',
    descriptionKey: 'contato.timeline.item3Description',
    Icon: Users,
  },
  {
    titleKey: 'contato.timeline.item4Title',
    descriptionKey: 'contato.timeline.item4Description',
    Icon: Award,
  },
];

/* ────────────────────────────────────────────────────────────────────────────
 * Página
 * ────────────────────────────────────────────────────────────────────────── */

export default async function ContatoPage() {
  const { t, locale, lp } = await getServerI18n();

  const [siteConfig, media] = await Promise.all([
    getPublicSiteConfig().catch(() => null),
    getMediaMap().catch(() => ({}) as Record<string, string>),
  ]);

  /* ── Canais: SEMPRE do SiteConfig, com o fallback do `seo.ts` ──────────── */

  const email = siteConfig?.contact.email || siteConfig?.contact.salesEmail || CONTACT.email;
  const phone = siteConfig?.contact.phone || CONTACT.phone;
  const whatsappDigits = waDigits(siteConfig?.contact.whatsapp ?? '', CONTACT.whatsapp);
  const address = siteConfig?.contact.address || `${CONTACT.city} — ${CONTACT.region}, ${CONTACT.countryName}`;
  const instagram = safeUrl(siteConfig?.social.instagram) ?? 'https://instagram.com/maeumglobal';
  const mapUrl = mapSearchUrl(siteConfig?.contact.address ?? '', t('contato.channels.location'));

  const whatsappGreeting = t('contato.channels.whatsappGreeting');
  const whatsappUrl = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(whatsappGreeting)}`;

  /* ── JSON-LD: ContactPage + Organization + LocalBusiness ──────────────── */

  const contactJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ContactPage',
        '@id': `${SITE_URL}/#contactpage`,
        name: t('contato.hero.title'),
        description: t('contato.seo.description'),
        url: localizedUrl('/contato', locale),
        inLanguage: locale,
        mainEntity: { '@id': `${SITE_URL}/#localbusiness` },
      },
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#contact-organization`,
        name: siteConfig?.legal.companyName || siteConfig?.brand.name || SITE_NAME,
        url: `${SITE_URL}/`,
        logo: siteConfig?.brand.logoUrl || `${SITE_URL}/images/logo.png`,
        contactPoint: [
          {
            '@type': 'ContactPoint',
            contactType: 'customer service',
            telephone: phone,
            email,
            areaServed: ['BR', 'KR'],
            availableLanguage: ['Portuguese', 'English', 'Spanish'],
            url: localizedUrl('/contato', locale),
          },
        ],
        ...(siteConfig?.legal.cnpj ? { taxID: siteConfig.legal.cnpj } : {}),
        sameAs: [instagram].filter(Boolean),
      },
      {
        '@type': 'LocalBusiness',
        '@id': `${SITE_URL}/#localbusiness`,
        name: siteConfig?.brand.name || SITE_NAME,
        url: `${SITE_URL}/`,
        image: `${SITE_URL}/images/agencia-viagens-coreia-do-sul-maeum-global-oficial.webp`,
        telephone: phone,
        email,
        priceRange: '$$$',
        address: {
          '@type': 'PostalAddress',
          streetAddress: address,
          addressLocality: CONTACT.city,
          addressRegion: CONTACT.region,
          addressCountry: CONTACT.country,
        },
        geo: { '@type': 'GeoCoordinates', latitude: -25.4284, longitude: -49.2733 },
        openingHoursSpecification: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            opens: '09:00',
            closes: '18:00',
          },
        ],
        areaServed: [{ '@type': 'Country', name: 'Brazil' }],
        sameAs: [instagram].filter(Boolean),
      },
    ],
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0F0A08] text-[#EFEBE4] font-sans selection:bg-[#C8A27C] selection:text-[#0F0A08]">
      <JsonLd id="contato-jsonld" data={contactJsonLd} />

      <Header />

      {/* ── 1. Hero (LCP) ─────────────────────────────────────────────────── */}
      <section
        aria-labelledby="contato-hero-title"
        className="relative min-h-[100dvh] flex flex-col justify-center overflow-hidden border-b border-[#3D2620]"
      >
        <div className="absolute inset-0 z-0">
          <SmartImage
            src={media.contato_hero_desktop}
            alt={t('contato.heroImage.desktop')}
            fill
            className="object-cover object-center brightness-[0.80] hidden md:block"
            sizes="100vw"
            priority
            quality={90}
            fallbackSrc={media.contato_hero_mobile}
            placeholderLabel={t('contato.heroImage.desktop')}
          />
          <SmartImage
            src={media.contato_hero_mobile}
            alt={t('contato.heroImage.mobile')}
            fill
            className="object-cover object-center brightness-[0.80] block md:hidden"
            sizes="100vw"
            priority
            quality={90}
            fallbackSrc={media.contato_hero_desktop}
            placeholderLabel={t('contato.heroImage.mobile')}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F0A08] via-[#0F0A08]/80 to-transparent w-full sm:w-2/3" />
        </div>

        <div className="relative z-10 px-6 sm:px-12 max-w-7xl mx-auto w-full flex flex-col items-start gap-6 pt-24">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold">
            {t('contato.hero.kicker')}
          </span>
          <h1
            id="contato-hero-title"
            className="font-heading text-4xl sm:text-5xl md:text-[60px] font-light tracking-wide leading-[1.1] text-white"
          >
            {t('contato.hero.line1')}
            <br />
            {t('contato.hero.line2')}
            <br />
            <span className="italic text-[#C8A27C]">{t('contato.hero.title')}</span>
          </h1>
          <p className="text-[12px] sm:text-[13px] text-gray-300 font-light text-left leading-relaxed opacity-90 mt-2 max-w-xl">
            {t('contato.hero.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 bg-[#C8A27C] hover:bg-[#B8906C] text-[#0F0A08] font-bold text-[10px] py-4 px-8 transition-all uppercase tracking-widest"
            >
              {t('contato.cta.startChat')}
              <MessageCircle aria-hidden className="w-4 h-4" />
            </a>
            <Link
              href={`${lp('/contato')}#planejamento`}
              className="flex items-center justify-center gap-3 bg-transparent border border-[#C8A27C] text-[#C8A27C] hover:bg-[#C8A27C]/10 font-bold text-[10px] py-4 px-8 transition-all uppercase tracking-widest"
            >
              {t('contato.cta.requestPlan')}
            </Link>
          </div>
        </div>
      </section>

      {/* ── 2. Faixa de diferenciais ───────────────────────────────────────── */}
      <section
        aria-label={t('contato.channels.kicker')}
        className="border-y border-[#3D2620] bg-[#120B0A] relative z-20 -mt-8 sm:mt-0"
      >
        <ul className="max-w-[1400px] mx-auto px-6 sm:px-12 py-10 grid grid-cols-2 md:grid-cols-5 gap-6 divide-x divide-[#3D2620]/50">
          {PILLARS.map(({ id, titleKeys, descriptionKey, Icon }) => (
            <li key={id} className="flex flex-col gap-3 sm:px-4">
              <Icon aria-hidden className="w-6 h-6 text-[#C8A27C] stroke-1" />
              <h2 className="text-[9px] font-bold text-white tracking-widest uppercase">
                {titleKeys[0]}
                {titleKeys[1] ? <br /> : null}
                {titleKeys[1] ? t(titleKeys[1]) : null}
              </h2>
              <p className="text-[9px] text-gray-500 font-light leading-tight">{t(descriptionKey)}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="px-6 sm:px-12 max-w-[1400px] mx-auto w-full pt-8">
        <Breadcrumbs
          locale={locale}
          items={[{ name: t('contato.list.breadcrumb'), path: '/contato' }]}
          className="text-gray-500"
        />
      </div>

      {/* ── 3. Canais + chat ──────────────────────────────────────────────── */}
      <section className="py-20 px-6 sm:px-12 max-w-[1400px] mx-auto w-full">
        <div className="text-center mb-10">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold flex items-center justify-center gap-3">
            <span aria-hidden className="w-16 h-[1px] bg-[#C8A27C]/30" />
            {t('contato.channels.kicker')}
            <span aria-hidden className="w-16 h-[1px] bg-[#C8A27C]/30" />
          </span>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-[30%] flex flex-col gap-3">
            <div className="bg-[#120B0A] border border-[#3D2620] p-6 rounded-sm mb-2">
              <h2 className="font-heading text-lg text-white mb-2">{t('contato.channels.title')}</h2>
              <p className="text-[10px] text-gray-400 font-light">{t('contato.channels.description')}</p>
            </div>

            {/* WhatsApp */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#18110F] border border-[#3D2620] p-5 rounded-sm flex items-center justify-between group hover:border-[#C8A27C]/50 transition-colors"
            >
              <span className="flex items-center gap-4">
                <Phone aria-hidden className="w-5 h-5 text-[#C8A27C]" strokeWidth={1.5} />
                <span>
                  <span className="block text-[12px] font-semibold text-white">{t('contato.whatsapp')}</span>
                  <span className="block text-[9px] text-gray-500 font-light">
                    {t('contato.channels.whatsappDescription')}
                  </span>
                </span>
              </span>
              <ArrowRight
                aria-hidden
                className="w-4 h-4 text-[#C8A27C] opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </a>

            {/* E-mail */}
            <a
              href={`mailto:${email}`}
              className="bg-[#18110F] border border-[#3D2620] p-5 rounded-sm flex items-center justify-between group hover:border-[#C8A27C]/50 transition-colors"
            >
              <span className="flex items-center gap-4">
                <Mail aria-hidden className="w-5 h-5 text-[#C8A27C]" strokeWidth={1.5} />
                <span>
                  <span className="block text-[12px] font-semibold text-white">
                    {t('contato.channels.emailLabel')}
                  </span>
                  <span className="block text-[9px] text-gray-500 font-light break-all">{email}</span>
                </span>
              </span>
              <ArrowRight
                aria-hidden
                className="w-4 h-4 text-[#C8A27C] opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </a>

            {/* Instagram */}
            <a
              href={instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#18110F] border border-[#3D2620] p-5 rounded-sm flex items-center justify-between group hover:border-[#C8A27C]/50 transition-colors"
            >
              <span className="flex items-center gap-4">
                <Camera aria-hidden className="w-5 h-5 text-[#C8A27C]" strokeWidth={1.5} />
                <span>
                  <span className="block text-[12px] font-semibold text-white">
                    {t('contato.channels.instagram')}
                  </span>
                  <span className="block text-[9px] text-gray-500 font-light">
                    {t('contato.channels.instagramHandle')}
                    <br />
                    {t('contato.channels.instagramDescription')}
                  </span>
                </span>
              </span>
              <ArrowRight
                aria-hidden
                className="w-4 h-4 text-[#C8A27C] opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </a>

            {/* Telefone */}
            <a
              href={telHref(phone)}
              className="bg-[#18110F] border border-[#3D2620] p-5 rounded-sm flex items-center justify-between group hover:border-[#C8A27C]/50 transition-colors"
            >
              <span className="flex items-center gap-4">
                <PhoneCall aria-hidden className="w-5 h-5 text-[#C8A27C]" strokeWidth={1.5} />
                <span>
                  <span className="block text-[12px] font-semibold text-white">
                    {t('contato.channels.phoneLabel')}
                  </span>
                  <span className="block text-[9px] text-gray-500 font-light">
                    {phone}
                    <br />
                    {t('contato.channels.hours')}
                  </span>
                </span>
              </span>
              <ArrowRight
                aria-hidden
                className="w-4 h-4 text-[#C8A27C] opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </a>

            {/* Localização */}
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#18110F] border border-[#3D2620] p-5 rounded-sm flex items-center justify-between group hover:border-[#C8A27C]/50 transition-colors"
            >
              <span className="flex items-center gap-4">
                <MapPin aria-hidden className="w-5 h-5 text-[#C8A27C]" strokeWidth={1.5} />
                <span>
                  <span className="block text-[12px] font-semibold text-white">
                    {t('contato.localizacao')}
                  </span>
                  <span className="block text-[9px] text-gray-500 font-light">
                    {address}
                    <br />
                    {t('contato.channels.locationNote')}
                  </span>
                </span>
              </span>
              <ArrowRight
                aria-hidden
                className="w-4 h-4 text-[#C8A27C] opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </a>
          </div>

          {/* Chat embutido (instância única garantida pelo próprio widget). */}
          <div className="flex-1 min-w-0">
            <ClientChatWidget mode="inline" />
          </div>
        </div>
      </section>

      {/* ── 4. Formulário de planejamento ──────────────────────────────────── */}
      <section
        id="planejamento"
        aria-labelledby="contato-form-title"
        className="py-20 px-6 sm:px-12 max-w-[1400px] mx-auto w-full border-t border-[#3D2620] scroll-mt-24"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="flex flex-col gap-4">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold">
              {t('contato.form.kicker')}
            </span>
            <h2 id="contato-form-title" className="font-heading text-4xl font-light text-white leading-tight">
              {t('contato.form.title')}
            </h2>
            <p className="text-[13px] text-gray-400 font-light leading-relaxed max-w-lg">
              {t('contato.form.description')}
            </p>
          </div>
          <div className="bg-[#150E0C] border border-[#3D2620] rounded-sm p-6 sm:p-8">
            <ContactPlannerForm />
          </div>
        </div>
      </section>

      {/* ── 5. Antes de viajar ─────────────────────────────────────────────── */}
      <section className="py-12 px-6 sm:px-12 max-w-[1400px] mx-auto w-full border-t border-[#3D2620]">
        <div className="text-center mb-10">
          <span className="text-[9px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold flex items-center justify-center gap-3">
            <span aria-hidden className="w-12 h-[1px] bg-[#C8A27C]/30" />
            {t('contato.timeline.kicker')}
            <span aria-hidden className="w-12 h-[1px] bg-[#C8A27C]/30" />
          </span>
        </div>

        <ul className="grid grid-cols-2 md:grid-cols-4 gap-6 px-4">
          {TIMELINE.map(({ titleKey, descriptionKey, Icon }) => (
            <li key={titleKey} className="flex flex-col items-center sm:items-start text-center sm:text-left gap-3">
              <Icon aria-hidden className="w-6 h-6 text-[#C8A27C]" strokeWidth={1} />
              <div>
                <h3 className="text-[10px] font-bold text-white tracking-widest uppercase mb-1">
                  {t(titleKey)}
                </h3>
                <p className="text-[10px] text-gray-400 font-light">{t(descriptionKey)}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ── 6. CTA final ──────────────────────────────────────────────────── */}
      <section className="pb-20 px-6 sm:px-12 max-w-[1400px] mx-auto w-full">
        <div className="bg-[#1A1110] border border-[#3D2620] rounded-sm p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Gift aria-hidden className="w-10 h-10 text-[#C8A27C]" strokeWidth={1} />
            <div>
              <h2 className="font-heading text-xl text-white mb-1">
                {t('contato.cta.notFoundTitle')}
              </h2>
              <p className="text-[11px] text-gray-400 font-light">{t('contato.cta.notFoundDescription')}</p>
            </div>
          </div>
          <a
            href={`mailto:${email}?subject=${encodeURIComponent(t('contato.cta.requestPersonalizedPlan'))}`}
            className="w-full md:w-auto bg-[#C8A27C] hover:bg-[#B8906C] text-[#0F0A08] font-bold text-[9px] py-4 px-8 rounded-sm transition-all uppercase tracking-widest flex items-center justify-center gap-3"
          >
            {t('contato.cta.requestPersonalizedPlan')}
            <ArrowRight aria-hidden className="w-4 h-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
