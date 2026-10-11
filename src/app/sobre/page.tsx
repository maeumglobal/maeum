import type { Metadata } from 'next';
import Link from 'next/link';
import { Heart, Diamond, Shield, Flower2, Star, ArrowRight, Quote, TrendingUp, Handshake, Globe } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SmartImage from '@/components/SmartImage';
import JsonLd from '@/components/seo/JsonLd';
import { prisma } from '@/lib/prisma';
import { getMediaMap } from '@/lib/cmsData';
import { getServerI18n } from '@/lib/serverI18n';
import { buildMetadata, siteUrl, truncateMeta } from '@/lib/seo';

/* ────────────────────────────────────────────────────────────────────────────
 * SEO
 * ────────────────────────────────────────────────────────────────────────── */

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getServerI18n();
  return buildMetadata({
    title: truncateMeta(t('sobre.seo.title'), 60),
    description: t('sobre.seo.description'),
    path: '/sobre',
    locale,
    image: '/images/agencia-viagens-coreia-do-sul-maeum-global-sobre-nos.webp',
    imageAlt: t('sobre.heroImage.desktop'),
  });
}

/* ────────────────────────────────────────────────────────────────────────────
 * Página
 * ────────────────────────────────────────────────────────────────────────── */

export default async function SobrePage() {
  const { t, locale, lp, formatNumber, fill } = await getServerI18n();

  /**
   * Uma ida ao banco: depoimentos aprovados, parceiros ativos e a contagem de
   * experiências (que vira o número "N experiências exclusivas" da faixa de
   * estatísticas — antes era texto fixo que envelhecia sozinho).
   */
  const [testimonials, partners, experienceCount, media] = await Promise.all([
    prisma.testimonial.findMany({
      where: { status: 'approved' },
      orderBy: { sortOrder: 'asc' },
      take: 12,
      select: { id: true, name: true, destination: true, text: true, rating: true, avatarUrl: true },
    }),
    prisma.partner.findMany({
      where: { status: 'active' },
      orderBy: { sortOrder: 'asc' },
      take: 24,
      select: { id: true, name: true, category: true, logoUrl: true, website: true },
    }),
    prisma.experience.count({ where: { status: 'active' } }).catch(() => 0),
    getMediaMap().catch(() => ({}) as Record<string, string>),
  ]);

  const ratingAverage =
    testimonials.length > 0
      ? testimonials.reduce((sum, item) => sum + (Number.isFinite(item.rating) ? item.rating : 0), 0) /
        testimonials.length
      : 0;

  const stats = [
    { value: t('sobre.stats.1value'), label: t('sobre.viajantes-realizados') },
    { value: t('sobre.stats.2value'), label: t('sobre.stats.2label') },
    {
      value: experienceCount > 0 ? `+${formatNumber(experienceCount)}` : t('sobre.stats.3value'),
      label: t('sobre.stats.3label'),
    },
    {
      value: ratingAverage > 0
        ? `${formatNumber(ratingAverage, { maximumFractionDigits: 1 })} ★`
        : t('sobre.stats.4value'),
      label: t('sobre.stats.4label'),
    },
  ];

  const valores = [
    { Icon: Heart, title: t('sobre.values.1title'), description: t('sobre.values.1description') },
    { Icon: Diamond, title: t('sobre.values.2title'), description: t('sobre.values.2description') },
    { Icon: Shield, title: t('sobre.values.3title'), description: t('sobre.values.3description') },
    { Icon: Flower2, title: t('sobre.values.5title'), description: t('sobre.values.5description') },
    { Icon: Star, title: t('sobre.values.4title'), description: t('sobre.values.4description') },
  ];

  const aboutJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: t('sobre.hero.kicker'),
    description: t('sobre.seo.description'),
    url: siteUrl('/sobre'),
    inLanguage: locale === 'pt' ? 'pt-BR' : locale === 'en' ? 'en-US' : 'es-ES',
    mainEntity: {
      '@type': 'Organization',
      name: 'Maeum Global',
      alternateName: 'MaeumGlobal',
      url: siteUrl('/'),
      logo: { '@type': 'ImageObject', url: siteUrl('/images/logo.png') },
      description: t('sobre.seo.description'),
      email: t('sobre.partnership.email'),
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Curitiba',
        addressRegion: 'PR',
        addressCountry: 'BR',
      },
      ...(partners.length > 0
        ? {
            member: partners.map((partner) => ({
              '@type': 'Organization',
              name: partner.name,
              ...(partner.website ? { url: partner.website } : {}),
            })),
          }
        : {}),
    },
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#1A0F14' }}>
      <JsonLd id="sobre-aboutpage-jsonld" data={aboutJsonLd} />

      <Header />

      {/* Hero (LCP) */}
      <section
        aria-labelledby="sobre-hero-title"
        className="relative min-h-[100dvh] flex flex-col justify-center overflow-hidden border-b border-[#3D2620]"
      >
        <div className="absolute inset-0 z-0">
          <SmartImage
            src={media.sobre_hero_desktop}
            alt={t('sobre.heroImage.desktop')}
            fill
            className="object-cover object-center hidden md:block"
            sizes="100vw"
            priority
            quality={90}
            fallbackSrc={media.sobre_hero_mobile}
            placeholderLabel={t('sobre.heroImage.desktop')}
          />
          <SmartImage
            src={media.sobre_hero_mobile}
            alt={t('sobre.heroImage.mobile')}
            fill
            className="object-cover object-center block md:hidden"
            sizes="100vw"
            priority
            quality={90}
            fallbackSrc={media.sobre_hero_desktop}
            placeholderLabel={t('sobre.heroImage.mobile')}
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-[#0F0A08] via-[#0F0A08]/80 to-transparent w-full sm:w-2/3" />
        </div>

        <div className="relative z-10 px-6 sm:px-12 max-w-7xl mx-auto w-full flex flex-col items-start gap-6 pt-24">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold">
            {t('sobre.hero.kicker')}
          </span>
          <h1
            id="sobre-hero-title"
            className="font-heading text-5xl sm:text-6xl md:text-[70px] font-light tracking-wide leading-[1.1] text-white"
          >
            {t('sobre.hero.line1')} <br />
            {t('sobre.hero.line2')} <br />
            <span className="italic text-[#C8A27C]">{t('sobre.hero.line3')}</span>
          </h1>
          <div aria-hidden className="w-12 h-[1px] bg-[#C8A27C] my-2" />
          <p className="text-[12px] sm:text-[13px] text-gray-300 max-w-xl font-light text-left leading-relaxed opacity-90">
            {t('sobre.about.description')}
            <br />
            <br />
            {t('sobre.about.description2')}
          </p>
          <div className="mt-4">
            <Link
              href={lp('/coreia-do-sul/jornadas')}
              className="flex items-center justify-center gap-3 bg-transparent border border-[#C8A27C] text-[#C8A27C] hover:bg-[#C8A27C] hover:text-[#0F0A08] font-bold text-[10px] py-4 px-8 rounded-none transition-all group uppercase tracking-widest"
            >
              {t('sobre.about.cta')}
              <ArrowRight aria-hidden className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section aria-labelledby="sobre-valores" className="py-20 px-4 md:px-8 border-t border-[#3A232E]" style={{ background: '#1A0F14' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span
              id="sobre-valores"
              className="text-xs uppercase tracking-widest text-[#C8A27C] font-bold"
            >
              {t('sobre.values.kicker')}
            </span>
          </div>

          <ul className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {valores.map((valor) => (
              <li key={valor.title} className="flex flex-col items-center text-center gap-3">
                <valor.Icon aria-hidden className="h-6 w-6 text-[#C8A27C]" strokeWidth={1.5} />
                <h3 className="text-xs font-bold text-[#C8A27C] uppercase tracking-wider">{valor.title}</h3>
                <p className="text-[10px] text-gray-400 leading-relaxed">{valor.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Estatísticas */}
      <section aria-label={t('sobre.stats.2label')} className="py-10 px-4 md:px-8 border-t border-[#3A232E]" style={{ background: '#2A161D' }}>
        <div className="max-w-7xl mx-auto">
          <ul className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <li key={stat.label} className="flex flex-col items-center text-center gap-1 py-4">
                <span className="font-heading text-4xl font-bold text-[#C8A27C]">{stat.value}</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                  {stat.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Depoimentos — `Testimonial` (approved) */}
      <section aria-labelledby="sobre-depoimentos" className="py-20 px-4 md:px-8 border-t border-[#3A232E]" style={{ background: '#1A0F14' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-4">
            <span className="text-xs uppercase tracking-widest text-[#C8A27C] font-bold">
              {t('sobre.testimonials.kicker')}
            </span>
            <h2
              id="sobre-depoimentos"
              className="font-heading text-3xl sm:text-4xl font-light text-[#F3E8DC] mt-3 leading-snug"
            >
              {t('sobre.testimonials.title')}
            </h2>
          </div>

          {testimonials.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-10">{t('sobre.testimonials.empty')}</p>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
              {testimonials.map((testimonial) => (
                <li
                  key={testimonial.id}
                  className="rounded-2xl border border-[#3A232E] p-6 flex flex-col gap-4 h-full"
                  style={{ background: '#2A161D' }}
                >
                  <Quote aria-hidden className="w-5 h-5 text-[#C8A27C] shrink-0" />
                  <p className="text-[12px] text-gray-300 font-light leading-relaxed flex-1">
                    {testimonial.text}
                  </p>
                  <div className="flex items-center gap-3 pt-4 border-t border-[#3A232E]">
                    <span className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
                      <SmartImage
                        src={testimonial.avatarUrl}
                        alt={fill(t('sobre.testimonials.avatarAlt'), { name: testimonial.name })}
                        fill
                        sizes="40px"
                        quality={75}
                        className="object-cover"
                        fallbackSrc={media.sobre_avatar_fallback}
                        placeholderLabel={testimonial.name}
                      />
                    </span>
                    <span className="flex flex-col">
                      <span className="text-[11px] font-bold text-[#F3E8DC]">{testimonial.name}</span>
                      {testimonial.destination ? (
                        <span className="text-[9px] uppercase tracking-wider text-[#C8A27C]">
                          {testimonial.destination}
                        </span>
                      ) : null}
                    </span>
                    <span
                      className="ml-auto flex items-center gap-1 text-[10px] font-bold text-[#C8A27C]"
                      aria-label={fill(t('sobre.testimonials.ratingLabel'), {
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
        </div>
      </section>

      {/* Parceiros — `Partner` (active) */}
      <section aria-labelledby="sobre-parceiros" className="py-20 px-4 md:px-8 border-t border-[#3A232E]" style={{ background: '#1A0F14' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-4">
            <span
              id="sobre-parceiros"
              className="text-xs uppercase tracking-widest text-[#C8A27C] font-bold"
            >
              {t('sobre.partners.kicker')}
            </span>
          </div>
          <p className="text-sm text-gray-400 text-center mb-12 max-w-3xl mx-auto">
            {t('sobre.partners.description')}
          </p>

          {partners.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-10">{t('sobre.partners.empty')}</p>
          ) : (
            <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {partners.map((partner) => (
                <li
                  key={partner.id}
                  className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border border-[#3A232E] hover:border-[#C8A27C]/40 transition-all text-center h-full"
                  style={{ background: '#2A161D' }}
                >
                  <SmartImage
                    src={partner.logoUrl}
                    alt={fill(t('sobre.partners.logoAlt'), { name: partner.name })}
                    width={120}
                    height={40}
                    sizes="120px"
                    quality={75}
                    className="h-8 w-auto object-contain opacity-90"
                    fallbackSrc={media.sobre_partner_logo_fallback}
                    placeholderLabel={partner.name}
                  />
                  <span className="text-sm font-bold text-[#F3E8DC] tracking-wide">{partner.name}</span>
                  <span className="text-[9px] text-gray-500 uppercase tracking-wider">
                    {partner.category ?? t('sobre.partners.subtitleFallback')}
                  </span>
                  {partner.website ? (
                    <a
                      href={partner.website.startsWith('http') ? partner.website : `https://${partner.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sr-only focus:not-sr-only focus:underline text-[10px] text-[#C8A27C]"
                    >
                      {partner.name}
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          <div className="text-center mt-8">
            <Link
              href={lp('/contato')}
              className="flex items-center justify-center gap-2 bg-transparent border border-[#3A232E] hover:border-[#C8A27C] text-[#C8A27C] font-bold text-xs py-3 px-8 rounded-xl transition-all uppercase tracking-wider mx-auto w-fit"
            >
              {t('sobre.partners.cta')}
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Parceria CTA */}
      <section aria-labelledby="sobre-parceria" className="py-0 border-t border-[#3A232E]" style={{ background: '#1A0F14' }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2">
          <div className="relative aspect-[4/3] md:aspect-auto">
            <SmartImage
              src={media.sobre_parceria_image}
              alt={t('sobre.partnership.imageAltFull')}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              quality={75}
              className="object-cover"
              placeholderLabel={t('sobre.partnership.imageAltFull')}
            />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-transparent to-[#1A0F14]/30" />
          </div>

          <div className="p-10 md:p-16 flex flex-col justify-center gap-5">
            <span className="text-xs uppercase tracking-widest text-[#C8A27C] font-bold">
              {t('sobre.partnership.kicker')}
            </span>
            <h2 id="sobre-parceria" className="font-heading text-3xl font-light text-[#F3E8DC] leading-snug">
              {t('sobre.partnership.description')}
            </h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              {t('sobre.partnership.descriptionFull')}
            </p>

            <div className="flex items-center gap-3 bg-[#2A161D] border border-[#3A232E] rounded-xl p-4">
              <span aria-hidden className="h-8 w-8 rounded-full bg-[#C8A27C]/20 flex items-center justify-center shrink-0 text-[#C8A27C] text-sm">
                &#9993;
              </span>
              <span>
                <span className="text-[10px] text-gray-500 block">
                  {t('sobre.partnership.sendProposalTo')}
                </span>
                <a
                  href={`mailto:${t('sobre.partnership.email')}`}
                  className="text-xs font-semibold text-[#F3E8DC] hover:text-[#C8A27C] transition-colors"
                >
                  {t('sobre.partnership.email')}
                </a>
              </span>
            </div>

            <ul className="grid grid-cols-3 gap-4 mt-2">
              {[
                { Icon: TrendingUp, label: t('sobre.partnership.benefits.1title'), description: t('sobre.partnership.benefits.1description') },
                { Icon: Handshake, label: t('sobre.partnership.benefits.2title'), description: t('sobre.partnership.benefits.2description') },
                { Icon: Globe, label: t('sobre.partnership.benefits.3title'), description: t('sobre.partnership.benefits.3description') },
              ].map((item) => (
                <li key={item.label} className="flex flex-col gap-1">
                  <item.Icon aria-hidden className="w-4 h-4 text-[#C8A27C]" />
                  <span className="text-[9px] font-bold text-[#C8A27C] uppercase tracking-wider">
                    {item.label}
                  </span>
                  <span className="text-[9px] text-gray-500 leading-snug">{item.description}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Assinatura */}
      <section className="py-6 px-4 md:px-8 border-t border-[#3A232E]" style={{ background: '#1A0F14' }}>
        <p className="max-w-7xl mx-auto text-center flex items-center justify-center gap-3">
          <span aria-hidden className="text-[#C8A27C] text-xs">
            &#10022;
          </span>
          <span className="text-[10px] text-gray-500 uppercase tracking-widest">
            {t('sobre.partnership.slogan')}
          </span>
          <span aria-hidden className="text-[#C8A27C] text-xs">
            &#10022;
          </span>
        </p>
      </section>

      <Footer />
    </div>
  );
}