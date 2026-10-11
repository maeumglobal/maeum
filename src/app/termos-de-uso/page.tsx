import type { Metadata } from 'next';
import Link from 'next/link';
import {
  AlertCircle,
  Building2,
  Calendar,
  ChevronRight,
  CreditCard,
  FileText,
  Mail,
  Shield,
  type LucideIcon,
} from 'lucide-react';
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
    title: truncateMeta(t('legal.terms.seoTitle'), 60),
    description: t('legal.terms.seoDescription'),
    path: '/termos-de-uso',
    locale,
    image: '/images/agencia-viagens-coreia-do-sul-maeum-global-oficial.webp',
    imageAlt: t('legal.termos-e-condicoes'),
  });
}

/* ────────────────────────────────────────────────────────────────────────────
 * Helpers
 * ────────────────────────────────────────────────────────────────────────── */

/** Template literal do dicionário → texto com quebras de linha reais. */
const cleanBlock = (value: string): string =>
  value
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const SECTIONS: readonly { id: string; Icon: LucideIcon; titleKey: string; contentKey: string }[] = [
  { id: '1', Icon: FileText, titleKey: 'legal.terms.section1', contentKey: 'legal.terms.accessAndUse' },
  { id: '2', Icon: Shield, titleKey: 'legal.terms.section2', contentKey: 'legal.terms.servicesOffered' },
  { id: '3', Icon: CreditCard, titleKey: 'legal.terms.section3', contentKey: 'legal.terms.paymentsPolicy' },
  { id: '4', Icon: Calendar, titleKey: 'legal.terms.section4', contentKey: 'legal.terms.cancellationPolicy' },
  { id: '5', Icon: AlertCircle, titleKey: 'legal.terms.section5', contentKey: 'legal.terms.clientResponsibilities' },
  { id: '6', Icon: Shield, titleKey: 'legal.terms.section6', contentKey: 'legal.terms.intermediaryNotice' },
  { id: '7', Icon: FileText, titleKey: 'legal.terms.section7', contentKey: 'legal.terms.ipNotice' },
  { id: '8', Icon: AlertCircle, titleKey: 'legal.terms.section8', contentKey: 'legal.terms.userAgreement' },
  { id: '9', Icon: FileText, titleKey: 'legal.terms.section9', contentKey: 'legal.terms.exchangePolicy' },
  { id: '10', Icon: Shield, titleKey: 'legal.terms.section10', contentKey: 'legal.terms.governingLaw' },
];

/* ────────────────────────────────────────────────────────────────────────────
 * Página
 * ────────────────────────────────────────────────────────────────────────── */

export default async function TermosUsoPage() {
  const { t, locale, lp, formatDate } = await getServerI18n();

  const [siteConfig, lastTouched] = await Promise.all([
    getPublicSiteConfig().catch(() => null),
    prisma.siteConfig
      .findFirst({
        where: { section: { in: ['legal', 'contact', 'brand'] } },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      })
      .catch(() => null),
  ]);

  const companyName = siteConfig?.legal.companyName || siteConfig?.brand.name || SITE_NAME;
  const cnpj = siteConfig?.legal.cnpj ?? '';
  const contactEmail = siteConfig?.contact.email || siteConfig?.contact.salesEmail || CONTACT.email;
  const contactPhone = siteConfig?.contact.phone || CONTACT.phone;

  const webPageJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${localizedUrl('/termos-de-uso', locale)}#webpage`,
        name: t('legal.termos-de-uso'),
        description: t('legal.terms.seoDescription'),
        url: localizedUrl('/termos-de-uso', locale),
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
            contactType: 'legal',
            email: contactEmail,
            telephone: contactPhone,
            availableLanguage: ['Portuguese', 'English', 'Spanish'],
          },
        ],
      },
    ],
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <JsonLd id="terms-webpage-jsonld" data={webPageJsonLd} />

      <Header />

      <main className="flex-1">
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section aria-labelledby="terms-hero-title" className="relative py-20 px-4 bg-secondary overflow-hidden">
          <div aria-hidden className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent" />
          </div>
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur border border-primary/45 rounded-full px-4 py-2 mb-6">
              <FileText aria-hidden className="h-4 w-4 text-accent" />
              <span className="text-xs uppercase tracking-widest text-primary font-bold">
                {t('legal.termos-e-condicoes')}
              </span>
            </div>
            <h1
              id="terms-hero-title"
              className="font-heading text-4xl md:text-5xl font-light text-primary mb-4"
            >
              {t('legal.termos-de-uso')}
            </h1>
            <p className="text-sm text-gray-400 max-w-2xl mx-auto">{t('legal.terms.intro')}</p>
          </div>
        </section>

        <div className="px-4 md:px-8 max-w-4xl mx-auto w-full pt-8">
          <Breadcrumbs
            locale={locale}
            items={[{ name: t('legal.legal.breadcrumb'), path: '/termos-de-uso' }]}
          />
        </div>

        {/* ── Banner de aceite ─────────────────────────────────────────────── */}
        <section className="py-8 px-4 bg-background border-b border-border/60">
          <div className="max-w-4xl mx-auto">
            <div className="bg-muted/30 border border-border/60 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6">
              <span className="p-3 bg-primary/10 rounded-full shrink-0">
                <AlertCircle aria-hidden className="h-6 w-6 text-accent" />
              </span>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-sm font-semibold text-secondary mb-1">{t('legal.importante')}</h2>
                <p className="text-xs text-muted-foreground">{t('legal.terms.declaration')}</p>
              </div>
              <Link
                href={lp('/contato')}
                className="text-xs font-semibold text-primary hover:text-accent-hover transition-colors flex items-center gap-1.5 shrink-0"
              >
                {t('legal.fale-conosco')}
                <ChevronRight aria-hidden className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── Seções ───────────────────────────────────────────────────────── */}
        <section className="py-16 px-4 md:px-8 bg-background flex-1">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-6">
              {SECTIONS.map(({ id, Icon, titleKey, contentKey }) => (
                <article
                  key={id}
                  className="bg-card border border-border/60 rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <span className="p-2.5 bg-primary/10 rounded-xl shrink-0">
                      <Icon aria-hidden className="h-5 w-5 text-accent" />
                    </span>
                    <div className="flex-1">
                      <h2 className="font-heading text-xl font-semibold text-secondary mb-4">
                        {t(titleKey)}
                      </h2>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                        {cleanBlock(t(contentKey))}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Identificação legal — editável no painel (SiteConfig › legal). */}
            <section
              aria-labelledby="terms-identification-title"
              className="mt-8 bg-card border border-border/60 rounded-2xl p-6 md:p-8"
            >
              <h2 id="terms-identification-title" className="font-heading text-lg font-semibold text-secondary mb-4">
                {t('legal.dpo.title')}
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
                      href={`mailto:${contactEmail}`}
                      className="text-primary hover:text-accent-hover transition-colors break-all"
                    >
                      {contactEmail}
                    </a>
                  </dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                    {t('legal.company.courtLabel')}
                  </dt>
                  <dd className="text-secondary">{t('legal.company.courtValue')}</dd>
                </div>
              </dl>
            </section>

            {/* CTA */}
            <div className="mt-12 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-8 text-center">
              <h2 className="font-heading text-2xl font-light text-secondary mb-3">
                {t('legal.footer.cta')}
              </h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-xl mx-auto">
                {t('legal.refund.contactUs')}
              </p>
              <Link
                href={lp('/contato')}
                className="inline-flex items-center gap-2 bg-primary hover:bg-accent-hover text-white text-xs font-semibold px-6 py-3 rounded-full shadow-md transition-all hover:scale-105"
              >
                {t('legal.refund.requestQuote')}
                <ChevronRight aria-hidden className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Navegação */}
            <div className="mt-12 pt-8 border-t border-border/60 flex flex-wrap items-center justify-between gap-4">
              <Link
                href={lp('/')}
                className="text-xs font-medium text-primary hover:text-accent-hover transition-colors flex items-center gap-2"
              >
                ← {t('legal.voltar-ao-inicio')}
              </Link>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <Link href={lp('/politica-de-privacidade')} className="hover:text-primary transition-colors">
                  {t('legal.politica-de-privacidade')}
                </Link>
                <span aria-hidden>•</span>
                <Link href={lp('/reembolso')} className="hover:text-primary transition-colors">
                  {t('legal.politica-de-reembolso')}
                </Link>
                <span aria-hidden>•</span>
                <span>{formatDate(lastTouched?.updatedAt ?? null, { year: 'numeric', month: 'long' })}</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
