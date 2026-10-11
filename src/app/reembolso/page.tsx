import type { Metadata } from 'next';
import Link from 'next/link';
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle,
  DollarSign,
  FileText,
  Mail,
  Phone,
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
    title: truncateMeta(t('legal.refund.seoTitle'), 60),
    description: t('legal.refund.seoDescription'),
    path: '/reembolso',
    locale,
    image: '/images/agencia-viagens-coreia-do-sul-maeum-global-oficial.webp',
    imageAlt: t('legal.cancelamento-reembolso'),
  });
}

/* ────────────────────────────────────────────────────────────────────────────
 * Helpers
 * ────────────────────────────────────────────────────────────────────────── */

interface RefundTier {
  id: string;
  /** Percentual devolvido, em pontos percentuais. */
  percent: number;
  periodKey: string;
  descriptionKey: string;
  Icon: LucideIcon;
  colorClass: string;
}

const TIERS: readonly RefundTier[] = [
  {
    id: 'over60',
    percent: 95,
    periodKey: 'legal.refund.periodOver60',
    descriptionKey: 'legal.refund.fullMinusFee',
    Icon: CheckCircle,
    colorClass: 'text-green-500',
  },
  {
    id: '30to60',
    percent: 50,
    periodKey: 'legal.refund.period30to60',
    descriptionKey: 'legal.refund.fiftyPercent',
    Icon: AlertCircle,
    colorClass: 'text-yellow-500',
  },
  {
    id: '15to30',
    percent: 25,
    periodKey: 'legal.refund.period15to30',
    descriptionKey: 'legal.refund.twentyFivePercent',
    Icon: AlertCircle,
    colorClass: 'text-orange-500',
  },
  {
    id: 'under15',
    percent: 0,
    periodKey: 'legal.refund.periodUnder15',
    descriptionKey: 'legal.refund.noRefund',
    Icon: AlertCircle,
    colorClass: 'text-red-500',
  },
];

const STEPS: readonly { id: string; titleKey: string; descriptionKey: string }[] = [
  { id: '01', titleKey: 'legal.solicitacao', descriptionKey: 'legal.refund.sendCancellationRequest' },
  { id: '02', titleKey: 'legal.analise', descriptionKey: 'legal.refund.teamReviewsCase' },
  { id: '03', titleKey: 'legal.documentacao', descriptionKey: 'legal.refund.receiveForm' },
  { id: '04', titleKey: 'legal.processamento', descriptionKey: 'legal.refund.afterApproval' },
];

const TIMING_KEYS: readonly string[] = [
  'legal.refund.timingCard',
  'legal.refund.timingPix',
  'legal.refund.timingBankSlip',
];

const SPECIAL_CASES: readonly { labelKey: string; textKey: string }[] = [
  { labelKey: 'legal.doenca-ou-acidente', textKey: 'legal.refund.medicalCertificate' },
  { labelKey: 'legal.problemas-documentais', textKey: 'legal.refund.visasRefused' },
  { labelKey: 'legal.forca-maior', textKey: 'legal.refund.extraordinaryCases' },
];

const NON_REFUNDABLE_KEYS: readonly string[] = [
  'legal.refund.nonRefundable.1',
  'legal.refund.nonRefundable.2',
  'legal.refund.nonRefundable.3',
  'legal.refund.nonRefundable.4',
];

/* ────────────────────────────────────────────────────────────────────────────
 * Página
 * ────────────────────────────────────────────────────────────────────────── */

export default async function ReembolsoPage() {
  const { t, locale, lp, fill, formatDate, formatNumber } = await getServerI18n();

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

  /* ── Contato/identificação: SEMPRE do SiteConfig ──────────────────────── */

  const companyName = siteConfig?.legal.companyName || siteConfig?.brand.name || SITE_NAME;
  const cnpj = siteConfig?.legal.cnpj ?? '';
  const contactEmail = siteConfig?.contact.email || siteConfig?.contact.salesEmail || CONTACT.email;
  const contactPhone = siteConfig?.contact.phone || CONTACT.phone;
  const whatsappDigits = (siteConfig?.contact.whatsapp ?? '').replace(/[^\d]/g, '') || CONTACT.whatsapp;

  const webPageJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${localizedUrl('/reembolso', locale)}#webpage`,
        name: t('legal.politica-de-reembolso'),
        description: t('legal.refund.seoDescription'),
        url: localizedUrl('/reembolso', locale),
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
            contactType: 'billing support',
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
      <JsonLd id="refund-webpage-jsonld" data={webPageJsonLd} />

      <Header />

      <main className="flex-1">
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section
          aria-labelledby="refund-hero-title"
          className="relative py-20 px-4 bg-secondary overflow-hidden"
        >
          <div aria-hidden className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent" />
          </div>
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur border border-primary/45 rounded-full px-4 py-2 mb-6">
              <DollarSign aria-hidden className="h-4 w-4 text-accent" />
              <span className="text-xs uppercase tracking-widest text-primary font-bold">
                {t('legal.cancelamento-reembolso')}
              </span>
            </div>
            <h1
              id="refund-hero-title"
              className="font-heading text-4xl md:text-5xl font-light text-primary mb-4"
            >
              {t('legal.politica-de-reembolso')}
            </h1>
            <p className="text-sm text-gray-400 max-w-2xl mx-auto">
              {t('legal.refund.transparencyNote')}
            </p>
          </div>
        </section>

        <div className="px-4 md:px-8 max-w-4xl mx-auto w-full pt-8">
          <Breadcrumbs
            locale={locale}
            items={[{ name: t('legal.legal.breadcrumb'), path: '/reembolso' }]}
          />
        </div>

        {/* ── Tabela de percentuais ────────────────────────────────────────── */}
        <section
          aria-labelledby="refund-table-title"
          className="py-16 px-4 md:px-8 bg-background"
        >
          <div className="max-w-6xl mx-auto">
            <h2
              id="refund-table-title"
              className="font-heading text-3xl font-light text-secondary mb-3 text-center"
            >
              {t('legal.percentual-de-reembolso-por-periodo')}
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto text-center mb-12">
              {t('legal.refund.amountVaries')}
            </p>

            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {TIERS.map((tier) => {
                const { Icon } = tier;
                return (
                  <li
                    key={tier.id}
                    className="bg-card border border-border/60 rounded-2xl p-6 text-center hover:shadow-lg transition-all hover:-translate-y-1 group"
                  >
                    <span
                      className={`inline-flex p-3 rounded-full bg-muted/50 mb-4 group-hover:scale-110 transition-transform ${tier.colorClass}`}
                    >
                      <Icon aria-hidden className="h-6 w-6" />
                    </span>
                    <h3 className="font-heading text-lg font-semibold text-secondary mb-2">
                      {t(tier.periodKey)}
                    </h3>
                    <p className={`text-4xl font-bold mb-3 ${tier.colorClass}`}>
                      {fill(t('legal.refund.percentTemplate'), { n: formatNumber(tier.percent) })}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t(tier.descriptionKey)}
                    </p>
                  </li>
                );
              })}
            </ul>

            <p className="text-[11px] text-muted-foreground mt-6 text-center max-w-2xl mx-auto">
              {t('legal.refund.cancellationNote')}
            </p>
          </div>
        </section>

        {/* ── Como solicitar ────────────────────────────────────────────────── */}
        <section
          aria-labelledby="refund-steps-title"
          className="py-16 px-4 md:px-8 bg-muted/30"
        >
          <div className="max-w-6xl mx-auto">
            <h2
              id="refund-steps-title"
              className="font-heading text-3xl font-light text-secondary mb-3 text-center"
            >
              {t('legal.como-solicitar-reembolso')}
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto text-center mb-12">
              {t('legal.siga-os-passos-abaixo-para')}
            </p>
            <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {STEPS.map((step, index) => (
                <li key={step.id} className="relative">
                  {index < STEPS.length - 1 ? (
                    <span
                      aria-hidden
                      className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-primary/30 to-transparent -translate-x-4"
                    />
                  ) : null}
                  <div className="bg-card border border-border/60 rounded-2xl p-6 h-full">
                    <p className="text-5xl font-bold text-primary/20 mb-4">{step.id}</p>
                    <h3 className="font-heading text-lg font-semibold text-secondary mb-3">
                      {t(step.titleKey)}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t(step.descriptionKey)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Informações importantes ──────────────────────────────────────── */}
        <section
          aria-labelledby="refund-info-title"
          className="py-16 px-4 md:px-8 bg-background"
        >
          <div className="max-w-4xl mx-auto">
            <h2
              id="refund-info-title"
              className="font-heading text-3xl font-light text-secondary mb-8 text-center"
            >
              {t('legal.informacoes-importantes')}
            </h2>

            <div className="space-y-6">
              <article className="bg-card border border-border/60 rounded-2xl p-6 md:p-8">
                <h3 className="font-heading text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
                  <FileText aria-hidden className="h-5 w-5 text-accent" />
                  {t('legal.prazos-de-processamento')}
                </h3>
                <ul className="text-sm text-muted-foreground leading-relaxed space-y-3">
                  {TIMING_KEYS.map((key) => (
                    <li key={key}>
                      • <strong>{t(key)}</strong>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="bg-card border border-border/60 rounded-2xl p-6 md:p-8">
                <h3 className="font-heading text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
                  <Calendar aria-hidden className="h-5 w-5 text-accent" />
                  {t('legal.casos-especiais')}
                </h3>
                <ul className="text-sm text-muted-foreground leading-relaxed space-y-3">
                  {SPECIAL_CASES.map(({ labelKey, textKey }) => (
                    <li key={labelKey}>
                      <strong>{t(labelKey)}</strong> {t(textKey)}
                    </li>
                  ))}
                </ul>
              </article>

              <article className="bg-card border border-border/60 rounded-2xl p-6 md:p-8">
                <h3 className="font-heading text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
                  <AlertCircle aria-hidden className="h-5 w-5 text-accent" />
                  {t('legal.taxas-nao-reembolsaveis')}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('legal.refund.nonRefundableIntro')}
                </p>
                <ul className="text-sm text-muted-foreground leading-relaxed space-y-2 mt-3">
                  {NON_REFUNDABLE_KEYS.map((key) => (
                    <li key={key} className="ml-4">
                      • {t(key)}
                    </li>
                  ))}
                </ul>
              </article>

              {/* Identificação legal — editável no painel (SiteConfig › legal). */}
              <article className="bg-card border border-border/60 rounded-2xl p-6 md:p-8">
                <h3 className="font-heading text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
                  <Building2 aria-hidden className="h-5 w-5 text-accent" />
                  {t('legal.company.legalNameLabel')}
                </h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex flex-col gap-1">
                    <dt className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
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
                </dl>
              </article>
            </div>
          </div>
        </section>

        {/* ── Contato ──────────────────────────────────────────────────────── */}
        <section aria-labelledby="refund-contact-title" className="py-16 px-4 md:px-8 bg-muted/30">
          <div className="max-w-4xl mx-auto text-center">
            <h2 id="refund-contact-title" className="font-heading text-3xl font-light text-secondary mb-4">
              {t('legal.refund.questionsTitle')}
            </h2>
            <p className="text-sm text-muted-foreground mb-8 max-w-xl mx-auto">
              {t('legal.refund.financeTeamAvailable')}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href={`mailto:${contactEmail}`}
                className="bg-card border border-border/60 rounded-xl p-6 flex items-center justify-center gap-3 hover:shadow-md transition-all group"
              >
                <Mail aria-hidden className="h-5 w-5 text-accent group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-secondary break-all">{contactEmail}</span>
              </a>

              <a
                href={`https://wa.me/${whatsappDigits}`}
                target="_blank"
                rel="noreferrer"
                className="bg-card border border-border/60 rounded-xl p-6 flex items-center justify-center gap-3 hover:shadow-md transition-all group"
              >
                <Phone aria-hidden className="h-5 w-5 text-accent group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-secondary">{contactPhone}</span>
              </a>
            </div>
          </div>
        </section>

        {/* ── Navegação ────────────────────────────────────────────────────── */}
        <section className="py-12 px-4 md:px-8 bg-background border-t border-border/60">
          <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-4">
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
              <Link href={lp('/termos-de-uso')} className="hover:text-primary transition-colors">
                {t('legal.termos-de-uso')}
              </Link>
              <span aria-hidden>•</span>
              <span>
                {t('legal.refund.lastUpdated')}{' '}
                {formatDate(lastTouched?.updatedAt ?? null, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
