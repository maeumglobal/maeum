import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2, Cookie, Mail, PhoneCall, Shield, User } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import JsonLd from '@/components/seo/JsonLd';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import { prisma } from '@/lib/prisma';
import { getPublicSiteConfig } from '@/actions/siteConfigActions';
import { getServerI18n } from '@/lib/serverI18n';
import { CONTACT, SITE_NAME, buildMetadata, localizedUrl, truncateMeta } from '@/lib/seo';

/* ────────────────────────────────────────────────────────────────────────────
 * SEO
 * ────────────────────────────────────────────────────────────────────────── */

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getServerI18n();
  return buildMetadata({
    title: truncateMeta(t('legal.privacy.seoTitle'), 60),
    description: t('legal.privacy.seoDescription'),
    path: '/politica-de-privacidade',
    locale,
    image: '/images/agencia-viagens-coreia-do-sul-maeum-global-oficial.webp',
    imageAlt: t('legal.privacidade-protecao-de-dados'),
  });
}

/* ────────────────────────────────────────────────────────────────────────────
 * Helpers
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * Os blocos longos do dicionário são template literals com indentação de
 * código-fonte (`\n      • item`). Para exibição, cada quebra de linha vira
 * uma quebra de verdade e a indentação some.
 */
const cleanBlock = (value: string): string =>
  value
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const SECTIONS: readonly { titleKey: string; contentKey: string }[] = [
  { titleKey: 'legal.privacy.section1', contentKey: 'legal.privacy.collectionIntro' },
  { titleKey: 'legal.privacy.section2', contentKey: 'legal.privacy.usageIntro' },
  { titleKey: 'legal.privacy.section3', contentKey: 'legal.privacy.sharingIntro' },
  { titleKey: 'legal.privacy.section4', contentKey: 'legal.privacy.cookiesIntro' },
  { titleKey: 'legal.privacy.section5', contentKey: 'legal.privacy.rightsIntro' },
  { titleKey: 'legal.privacy.section6', contentKey: 'legal.privacy.securityIntro' },
  { titleKey: 'legal.privacy.section7', contentKey: 'legal.privacy.retentionIntro' },
  { titleKey: 'legal.privacy.section8', contentKey: 'legal.privacy.transfersIntro' },
  { titleKey: 'legal.privacy.section9', contentKey: 'legal.privacy.minorsIntro' },
  { titleKey: 'legal.privacy.section10', contentKey: 'legal.privacy.updatesNotice' },
];

/* ────────────────────────────────────────────────────────────────────────────
 * Página
 * ────────────────────────────────────────────────────────────────────────── */

export default async function PoliticaPrivacidadePage() {
  const { t, locale, lp, formatDate } = await getServerI18n();

  const [siteConfig, lastTouched] = await Promise.all([
    getPublicSiteConfig().catch(() => null),
    // "Última atualização" = última edição real da config legal no painel
    // (determinístico; `new Date()` mudaria o HTML a cada request).
    prisma.siteConfig
      .findFirst({
        where: { section: { in: ['legal', 'contact', 'brand'] } },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      })
      .catch(() => null),
  ]);

  /* ── Identificação legal: SEMPRE do SiteConfig (editável no painel) ────── */

  const companyName = siteConfig?.legal.companyName || siteConfig?.brand.name || SITE_NAME;
  const cnpj = siteConfig?.legal.cnpj ?? '';
  // O e-mail do encarregado é o de atendimento configurado no painel; o
  // dedicaco de privacidade continua documentado no texto da seção 11.
  const dpoEmail = siteConfig?.contact.email || CONTACT.email;
  const dpoPhone = siteConfig?.contact.phone || CONTACT.phone;
  const dpoAddress =
    siteConfig?.contact.address || `${CONTACT.city} — ${CONTACT.region}, ${CONTACT.countryName}`;

  const webPageJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${localizedUrl('/politica-de-privacidade', locale)}#webpage`,
        name: t('legal.politica-de-privacidade'),
        description: t('legal.privacy.seoDescription'),
        url: localizedUrl('/politica-de-privacidade', locale),
        inLanguage: locale,
        isPartOf: { '@id': `${localizedUrl('/', locale)}#website` },
        about: { '@id': `${localizedUrl('/', locale)}#organization` },
      },
      {
        '@type': 'Organization',
        '@id': `${localizedUrl('/', locale)}#organization`,
        name: companyName,
        url: localizedUrl('/', locale),
        ...(cnpj ? { taxID: cnpj } : {}),
        contactPoint: [
          {
            '@type': 'ContactPoint',
            contactType: 'privacy',
            email: dpoEmail,
            telephone: dpoPhone,
            availableLanguage: ['Portuguese', 'English', 'Spanish'],
          },
        ],
      },
    ],
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <JsonLd id="privacy-webpage-jsonld" data={webPageJsonLd} />

      <Header />

      <main className="flex-1">
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section
          aria-labelledby="privacy-hero-title"
          className="relative py-20 px-4 bg-secondary overflow-hidden"
        >
          <div aria-hidden className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent" />
          </div>
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur border border-primary/45 rounded-full px-4 py-2 mb-6">
              <Shield aria-hidden className="h-4 w-4 text-accent" />
              <span className="text-xs uppercase tracking-widest text-primary font-bold">
                {t('legal.privacidade-protecao-de-dados')}
              </span>
            </div>
            <h1
              id="privacy-hero-title"
              className="font-heading text-4xl md:text-5xl font-light text-primary mb-4"
            >
              {t('legal.politica-de-privacidade')}
            </h1>
            <p className="text-sm text-gray-400 max-w-2xl mx-auto">
              {t('legal.privacy.transparencyNote')}
            </p>
          </div>
        </section>

        <div className="px-4 md:px-8 max-w-4xl mx-auto w-full pt-8">
          <Breadcrumbs
            locale={locale}
            items={[{ name: t('legal.legal.breadcrumb'), path: '/politica-de-privacidade' }]}
          />
        </div>

        {/* ── Conteúdo ─────────────────────────────────────────────────────── */}
        <section className="py-16 px-4 md:px-8 bg-background flex-1">
          <div className="max-w-4xl mx-auto">
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
              <li className="bg-card border border-border/60 rounded-xl p-5 flex flex-col items-center text-center">
                <span className="p-3 bg-primary/10 rounded-full mb-3">
                  <User aria-hidden className="h-5 w-5 text-accent" />
                </span>
                <h2 className="text-xs font-semibold text-secondary mb-1">{t('legal.seus-dados')}</h2>
                <p className="text-[10px] text-muted-foreground">
                  {t('legal.privacy.protectedNote')}
                </p>
              </li>
              <li className="bg-card border border-border/60 rounded-xl p-5 flex flex-col items-center text-center">
                <span className="p-3 bg-primary/10 rounded-full mb-3">
                  <Cookie aria-hidden className="h-5 w-5 text-accent" />
                </span>
                <h2 className="text-xs font-semibold text-secondary mb-1">{t('legal.cookies')}</h2>
                <p className="text-[10px] text-muted-foreground">{t('legal.privacy.fullControl')}</p>
              </li>
              <li className="bg-card border border-border/60 rounded-xl p-5 flex flex-col items-center text-center">
                <span className="p-3 bg-primary/10 rounded-full mb-3">
                  <Mail aria-hidden className="h-5 w-5 text-accent" />
                </span>
                <h2 className="text-xs font-semibold text-secondary mb-1">{t('legal.contato')}</h2>
                <a
                  href={`mailto:${dpoEmail}`}
                  className="text-[10px] text-primary hover:text-accent-hover transition-colors break-all"
                >
                  {dpoEmail}
                </a>
              </li>
            </ul>

            <div className="space-y-8">
              {SECTIONS.map((section) => (
                <article
                  key={section.titleKey}
                  className="bg-card border border-border/60 rounded-2xl p-6 md:p-8 shadow-sm"
                >
                  <h2 className="font-heading text-xl font-semibold text-secondary mb-4">
                    {t(section.titleKey)}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {cleanBlock(t(section.contentKey))}
                  </p>
                </article>
              ))}

              {/* Seção 11: identificação completa, montada do SiteConfig. */}
              <article className="bg-card border border-border/60 rounded-2xl p-6 md:p-8 shadow-sm">
                <h2 className="font-heading text-xl font-semibold text-secondary mb-4">
                  {t('legal.privacy.section11')}
                </h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex flex-col gap-1">
                    <dt className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-1.5">
                      <Building2 aria-hidden className="h-3 w-3" />
                      {t('legal.company.legalNameLabel')}
                    </dt>
                    <dd className="text-secondary">{companyName}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                      {t('legal.company.cnpjLabel')}
                    </dt>
                    <dd className="text-secondary">{cnpj || t('legal.dpo.notConfigured')}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-1.5">
                      <Mail aria-hidden className="h-3 w-3" />
                      {t('legal.dpo.emailLabel')}
                    </dt>
                    <dd>
                      <a
                        href={`mailto:${dpoEmail}`}
                        className="text-primary hover:text-accent-hover transition-colors break-all"
                      >
                        {dpoEmail}
                      </a>
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-1.5">
                      <PhoneCall aria-hidden className="h-3 w-3" />
                      {t('legal.dpo.phoneLabel')}
                    </dt>
                    <dd>
                      <a
                        href={`tel:${dpoPhone.replace(/[^\d+]/g, '')}`}
                        className="text-primary hover:text-accent-hover transition-colors"
                      >
                        {dpoPhone}
                      </a>
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <dt className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                      {t('legal.dpo.addressLabel')}
                    </dt>
                    <dd className="text-secondary">{dpoAddress}</dd>
                  </div>
                </dl>
                <p className="text-sm text-muted-foreground leading-relaxed mt-4">
                  {t('legal.dpo.responseTime')}
                </p>
              </article>
            </div>

            {/* Navegação */}
            <div className="mt-12 pt-8 border-t border-border/60 flex flex-wrap items-center justify-between gap-4">
              <Link
                href={lp('/')}
                className="text-xs font-medium text-primary hover:text-accent-hover transition-colors flex items-center gap-2"
              >
                ← {t('legal.voltar-ao-inicio')}
              </Link>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{t('legal.ultima-atualizacao')}</span>
                <span className="font-semibold text-secondary">
                  {formatDate(lastTouched?.updatedAt ?? null, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <Link href={lp('/termos-de-uso')} className="hover:text-primary transition-colors">
                {t('legal.termos-de-uso')}
              </Link>
              <span aria-hidden>•</span>
              <Link href={lp('/reembolso')} className="hover:text-primary transition-colors">
                {t('legal.politica-de-reembolso')}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
