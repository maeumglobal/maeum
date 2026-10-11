'use client';

import React, { useId, useMemo, useState } from 'react';
import { BookOpen, Building, Check, GraduationCap, Info, Loader2, MapPin, Send } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SmartImage from '@/components/SmartImage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { submitExchangeInquiryAction } from '@/actions/tripPlanActions';
import { useLanguage } from '@/contexts/LanguageContext';

export interface PricingTier {
  range: string;
  currency: string;
  price: number;
}

export interface ProgramView {
  id: string;
  campusId: string;
  name: string;
  slug: string;
  description: string | null;
  durationWeeksMin: number;
  durationWeeksMax: number;
  classesPerWeek: number;
  levelRequired: string;
  pricingTiers: PricingTier[];
  includesEnrollment: boolean;
  enrollmentFee: number;
  includesMaterial: boolean;
  materialFee: number;
  culturalActivities: boolean;
}

export interface CampusView {
  id: string;
  name: string;
  city: string;
  location: string | null;
  description: string | null;
  mainImage: string | null;
  programs: ProgramView[];
}

export interface InstitutionView {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  country: string;
  website: string | null;
  logoUrl: string | null;
  campuses: CampusView[];
}

interface Props {
  institutions: InstitutionView[];
  heroDesktop: string;
  heroMobile: string;
  campusFallback: string;
  /** Aviso honesto quando o banco de intercâmbio não respondeu. */
  loadError: string | null;
}

/** Máscara de telefone brasileiro: é um formato, não copy traduzível. */
const PHONE_PLACEHOLDER = '+55 (11) 99999-9999';

/** Moeda padrão das taxas da escola (o painel grava `pricingTiers` sem moeda). */
const SCHOOL_FEE_CURRENCY = 'USD';

const LEVEL_KEYS = [
  'intercambios.iniciante',
  'intercambios.basico',
  'intercambios.intermediario',
  'intercambios.avancado',
  'intercambios.fluente',
] as const;

const LEVEL_VALUES = ['Iniciante', 'Básico', 'Intermediário', 'Avançado', 'Fluente'] as const;

const emptyForm = {
  nome: '',
  email: '',
  phone: '',
  pais: '',
  idioma: 'Português',
  idade: '',
  campus: '',
  curso: '',
  nivel: 'Iniciante',
  semanas: '',
  periodo: '',
  hospedagem: false,
  seguro: false,
  transfer: false,
  observacoes: '',
};

/** Substitui `{chave}` em um template do dicionário por valores reais. */
const fill = (template: string, vars: Record<string, string>): string =>
  template.replace(/\{(\w+)\}/g, (whole, key: string) => vars[key] ?? whole);

export default function IntercambioClient({
  institutions,
  heroDesktop,
  heroMobile,
  campusFallback,
  loadError,
}: Props) {
  const { t, formatCurrency, formatNumber } = useLanguage();

  const institution = institutions[0] ?? null;
  const campuses = useMemo(() => institution?.campuses ?? [], [institution]);
  const programs = useMemo(() => campuses.flatMap((campus) => campus.programs), [campuses]);

  /**
   * Só guardamos o slug PEDIDO: a aba efetiva é derivada, então trocar a grade
   * de programas no painel nunca deixa a tela apontando para um item removido
   * (nenhum `setState` dentro de `useEffect`).
   */
  const [requestedSlug, setRequestedSlug] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const baseId = useId();

  const program = programs.find((item) => item.slug === requestedSlug) ?? programs[0] ?? null;
  const campus = campuses.find((item) => item.id === program?.campusId) ?? campuses[0] ?? null;

  const setField = <K extends keyof typeof emptyForm>(field: K, value: (typeof emptyForm)[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    setSubmitting(true);
    try {
      const selectedCampus = campuses.find((item) => item.id === form.campus) ?? campus;
      const selectedProgramRow = programs.find((item) => item.id === form.curso) ?? program;

      const result = await submitExchangeInquiryAction({
        nome: form.nome.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        pais: form.pais.trim() || undefined,
        idioma: form.idioma,
        idade: form.idade.trim() || undefined,
        campusName: selectedCampus ? `${selectedCampus.name} - ${selectedCampus.city}` : undefined,
        cursoName: selectedProgramRow?.name,
        nivel: form.nivel,
        semanas: form.semanas.trim() || undefined,
        periodo: form.periodo.trim() || undefined,
        hospedagem: form.hospedagem,
        seguro: form.seguro,
        transfer: form.transfer,
        observacoes: form.observacoes.trim() || undefined,
      });

      if (result.success) {
        setSubmitted(true);
        setForm(emptyForm);
      } else {
        setErrorMessage(result.error || t('intercambios.korea.form.error'));
      }
    } catch {
      setErrorMessage(t('intercambios.korea.form.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const institutionName = institution?.name ?? 'Lexis Korea';
  const maxWeeks = programs.reduce((max, item) => Math.max(max, item.durationWeeksMax), 0);

  const stats = [
    { value: formatNumber(campuses.length), label: t('intercambios.campi') },
    { value: formatNumber(maxWeeks), label: t('intercambios.semanas-max') },
    { value: formatNumber(programs.length), label: t('intercambios.programas') },
    { value: '100%', label: t('intercambios.suporte-maeum') },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero (LCP) */}
        <section
          aria-labelledby="intercambio-hero-title"
          className="relative min-h-[100dvh] w-full flex flex-col justify-center overflow-hidden border-b border-[#3D2620]"
        >
          <SmartImage
            src={heroDesktop}
            alt={t('intercambios.korea.heroImage.desktop')}
            fill
            className="object-cover hidden md:block"
            sizes="100vw"
            priority
            quality={75}
            fallbackSrc={heroMobile}
            placeholderLabel={t('intercambios.korea.heroImage.desktop')}
          />
          <SmartImage
            src={heroMobile}
            alt={t('intercambios.korea.heroImage.desktop-x')}
            fill
            className="object-cover block md:hidden"
            sizes="100vw"
            quality={75}
            fallbackSrc={heroDesktop}
            placeholderLabel={t('intercambios.korea.heroImage.desktop-x')}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0A08] via-[#0F0A08]/50 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-16 max-w-7xl mx-auto w-full pb-12 md:pb-20">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#C8A27C] bg-[#C8A27C]/10 border border-[#C8A27C]/30 px-4 py-1.5 backdrop-blur-sm inline-block">
                  {t('intercambios.korea.badge')}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-white bg-white/10 border border-white/20 px-4 py-1.5 backdrop-blur-sm inline-block">
                  {fill(t('coreia.intercambio.partnerBadge'), { partner: institutionName })}
                </span>
              </div>
              <h1
                id="intercambio-hero-title"
                className="font-heading text-4xl sm:text-6xl font-light mt-2 tracking-wide uppercase leading-tight text-white"
              >
                {t('intercambios.korea.heroImage.desktop-x')}
              </h1>
              <p className="text-sm sm:text-base text-white/80 mt-4 max-w-xl leading-relaxed font-light">
                {t('intercambios.korea.description')}
              </p>
            </div>
          </div>
        </section>

        {/* Instituição */}
        <section
          aria-labelledby="intercambio-institution-title"
          className="py-20 px-6 md:px-12 max-w-7xl mx-auto w-full"
        >
          {loadError && (
            <p
              role="status"
              className="mb-8 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3"
            >
              {loadError}
            </p>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
            <div className="lg:col-span-3 flex flex-col gap-5">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[10px] uppercase tracking-widest text-[#C8A27C] font-bold">
                  {institutionName}
                </span>
                <span className="text-[8px] uppercase tracking-widest text-[#0F0A08] bg-[#C8A27C] font-bold px-3 py-1">
                  {fill(t('coreia.intercambio.partnerBadge'), { partner: 'Maeum Global' })}
                </span>
              </div>
              <h2
                id="intercambio-institution-title"
                className="font-heading text-3xl sm:text-4xl font-light text-white leading-tight"
              >
                {t('intercambios.korea.subtitle')}
              </h2>
              <div aria-hidden className="w-12 h-px bg-[#C8A27C]" />
              <p className="text-sm text-gray-400 leading-relaxed font-light">
                {institution?.description ?? t('intercambios.korea.highlight.description')}
              </p>
              <div className="flex flex-wrap gap-6 mt-2">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <GraduationCap aria-hidden className="h-4 w-4 shrink-0 text-[#C8A27C]" />
                  <span>{t('intercambios.korea.highlight.classes')}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <MapPin aria-hidden className="h-4 w-4 shrink-0 text-[#C8A27C]" />
                  <span>{t('intercambios.korea.highlight.campuses')}</span>
                </div>
              </div>
            </div>
            <div className="lg:col-span-2 grid grid-cols-2 gap-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-[#261514] border border-[#3D2620] rounded-sm p-5 flex flex-col gap-1.5"
                >
                  <span className="text-2xl font-heading font-bold text-[#C8A27C]">{stat.value}</span>
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Campi */}
        <section
          aria-labelledby="intercambio-campuses-title"
          className="py-20 px-4 md:px-8 max-w-7xl mx-auto w-full border-t border-border"
        >
          <div className="mb-12">
            <span className="text-xs uppercase tracking-widest text-primary font-bold">
              {t('intercambios.campuses.title')}
            </span>
            <h2
              id="intercambio-campuses-title"
              className="font-heading text-3xl sm:text-4xl font-light text-secondary mt-2"
            >
              {t('intercambios.campuses.subtitle')}
            </h2>
          </div>

          {campuses.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border rounded-3xl">
              <Building aria-hidden className="h-6 w-6 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-heading text-xl font-light text-secondary">
                {t('coreia.intercambio.emptyCampusesTitle')}
              </h3>
              <p className="text-xs text-muted-foreground mt-2 max-w-lg mx-auto leading-relaxed">
                {t('coreia.intercambio.emptyCampusesDescription')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {campuses.map((item) => (
                <article
                  key={item.id}
                  className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden">
                    <SmartImage
                      src={item.mainImage ?? campusFallback}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(min-width: 768px) 33vw, 100vw"
                      quality={75}
                      placeholderLabel={item.name}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-white bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
                        {item.city}
                      </span>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-heading text-xl font-bold text-secondary group-hover:text-primary transition-colors">
                      {item.name}
                    </h3>
                    {item.location && (
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-1">
                        <MapPin aria-hidden className="h-3 w-3 shrink-0 text-accent" />
                        <span>{item.location}</span>
                      </div>
                    )}
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-3 leading-relaxed font-light flex-1">
                        {item.description}
                      </p>
                    )}
                    {item.programs.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <span className="text-[10px] uppercase font-bold text-primary tracking-wider">
                          {t('intercambios.programs.title')}
                        </span>
                        <ul className="flex flex-wrap gap-1.5 mt-2">
                          {item.programs.map((itemProgram) => (
                            <li
                              key={itemProgram.id}
                              className="text-[10px] bg-muted rounded-full px-2.5 py-1 text-muted-foreground font-medium"
                            >
                              {itemProgram.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Programas */}
        <section
          aria-labelledby="intercambio-programs-title"
          className="py-20 px-4 md:px-8 max-w-7xl mx-auto w-full border-t border-border"
        >
          <div className="mb-12">
            <span className="text-xs uppercase tracking-widest text-primary font-bold">
              {t('intercambios.programas')}
            </span>
            <h2
              id="intercambio-programs-title"
              className="font-heading text-3xl sm:text-4xl font-light text-secondary mt-2"
            >
              {t('intercambios.programs.subtitle')}
            </h2>
          </div>

          {programs.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border rounded-3xl">
              <BookOpen aria-hidden className="h-6 w-6 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-heading text-xl font-light text-secondary">
                {t('coreia.intercambio.emptyProgramsTitle')}
              </h3>
              <p className="text-xs text-muted-foreground mt-2 max-w-lg mx-auto leading-relaxed">
                {t('coreia.intercambio.emptyProgramsDescription')}
              </p>
            </div>
          ) : (
            <>
              <div
                role="tablist"
                aria-label={t('intercambios.programs.title')}
                className="flex flex-wrap gap-1 bg-muted/50 rounded-2xl p-1.5 w-fit mb-10 border border-border"
              >
                {programs.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    id={`${baseId}-tab-${item.slug}`}
                    aria-selected={program?.slug === item.slug}
                    aria-controls={`${baseId}-panel-${item.slug}`}
                    onClick={() => setRequestedSlug(item.slug)}
                    className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                      program?.slug === item.slug
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-muted-foreground hover:text-secondary hover:bg-muted'
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>

              {program && (
                <div
                  role="tabpanel"
                  id={`${baseId}-panel-${program.slug}`}
                  aria-labelledby={`${baseId}-tab-${program.slug}`}
                  className="grid grid-cols-1 lg:grid-cols-5 gap-12"
                >
                  <div className="lg:col-span-3 flex flex-col gap-6">
                    <div className="flex items-center gap-3">
                      <BookOpen aria-hidden className="h-5 w-5 shrink-0 text-accent" />
                      <h3 className="font-heading text-2xl font-light text-secondary">
                        {program.name}
                      </h3>
                    </div>
                    {program.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed font-light">
                        {program.description}
                      </p>
                    )}
                    <dl className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <dt className="sr-only">{t('intercambios.aulas-semana')}</dt>
                        <dd className="flex items-center gap-1.5">
                          <GraduationCap aria-hidden className="h-4 w-4 shrink-0 text-accent" />
                          {formatNumber(program.classesPerWeek)} {t('intercambios.aulas-semana')}
                        </dd>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <dt className="sr-only">{t('intercambios.duracao')}</dt>
                        <dd className="flex items-center gap-1.5">
                          <Building aria-hidden className="h-4 w-4 shrink-0 text-accent" />
                          {t('intercambios.duracao')}:{' '}
                          {fill(t('intercambios.programs.weeksRange'), {
                            min: formatNumber(program.durationWeeksMin),
                            max: formatNumber(program.durationWeeksMax),
                          })}
                        </dd>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <dt className="sr-only">{t('intercambios.programs.level')}</dt>
                        <dd className="flex items-center gap-1.5">
                          <Info aria-hidden className="h-4 w-4 shrink-0 text-accent" />
                          {program.levelRequired}
                        </dd>
                      </div>
                    </dl>

                    {program.culturalActivities && (
                      <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5 flex items-start gap-3">
                        <Info aria-hidden className="h-5 w-5 shrink-0 mt-0.5 text-accent" />
                        <div>
                          <span className="text-xs font-bold text-secondary">
                            {t('intercambios.atividades-culturais-inclusas')}
                          </span>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {t('intercambios.activities.description')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-2">
                    <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                      <h4 className="font-heading text-lg font-light text-secondary mb-4">
                        {t('intercambios.tabela-de-precos')}
                      </h4>
                      {program.pricingTiers.length === 0 ? (
                        <p className="text-xs text-muted-foreground border border-dashed border-border rounded-xl px-4 py-6 text-center">
                          {t('coreia.intercambio.emptyPricing')}
                        </p>
                      ) : (
                        <div className="overflow-hidden rounded-xl border border-border">
                          <div className="bg-muted/50 grid grid-cols-2 gap-px text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                            <div className="p-3">{t('intercambios.semanas')}</div>
                            <div className="p-3">{t('intercambios.preco-por-semana')}</div>
                          </div>
                          {program.pricingTiers.map((tier) => (
                            <div
                              key={`${tier.range}-${tier.price}-${tier.currency}`}
                              className="grid grid-cols-2 gap-px text-xs border-t border-border"
                            >
                              <div className="p-3 font-medium text-secondary">
                                {tier.range} {t('intercambios.semanas')}
                              </div>
                              <div className="p-3 text-primary font-bold font-heading">
                                {formatCurrency(tier.price, tier.currency)}/
                                {t('intercambios.semana')}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-5 flex flex-col gap-2 text-xs text-muted-foreground">
                        {program.includesEnrollment && program.enrollmentFee > 0 && (
                          <div className="flex justify-between items-center gap-3 py-1.5 border-b border-border last:border-0">
                            <span>{t('intercambios.taxa-de-matricula')}</span>
                            <span className="font-bold text-secondary shrink-0">
                              {formatCurrency(program.enrollmentFee, SCHOOL_FEE_CURRENCY)}
                            </span>
                          </div>
                        )}
                        {program.includesMaterial && program.materialFee > 0 && (
                          <div className="flex justify-between items-center gap-3 py-1.5 border-b border-border last:border-0">
                            <span>{t('intercambios.material-didatico')}</span>
                            <span className="font-bold text-secondary shrink-0">
                              {formatCurrency(program.materialFee, SCHOOL_FEE_CURRENCY)}
                            </span>
                          </div>
                        )}
                        {program.culturalActivities && (
                          <div className="flex items-center gap-2 py-1.5 text-green-600">
                            <Check aria-hidden className="h-3.5 w-3.5" />
                            <span>{t('intercambios.atividades-culturais-inclusas-x')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* Formulário de solicitação */}
        <section
          aria-labelledby="intercambio-form-title"
          className="py-20 px-4 md:px-8 max-w-7xl mx-auto w-full border-t border-border"
        >
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            <div className="lg:col-span-2">
              <span className="text-xs uppercase tracking-widest text-primary font-bold">
                {t('intercambios.form.kicker')}
              </span>
              <h2
                id="intercambio-form-title"
                className="font-heading text-3xl sm:text-4xl font-light text-secondary mt-2 leading-tight"
              >
                {t('intercambios.form.cta')}
              </h2>
              <p className="text-sm text-muted-foreground mt-4 leading-relaxed font-light">
                {t('intercambios.form.description')}
              </p>
              <ul className="flex flex-col gap-3 mt-8">
                {[
                  'intercambios.form.benefit1',
                  'intercambios.form.benefit2',
                  'intercambios.form.benefit3',
                ].map((key) => (
                  <li key={key} className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Check aria-hidden className="h-4 w-4 shrink-0 text-accent" />
                    <span>{t(key)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-3">
              <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                {submitted ? (
                  <div
                    className="flex flex-col items-center justify-center text-center py-10"
                    aria-live="polite"
                  >
                    <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                      <Check aria-hidden className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="font-heading text-2xl font-light text-secondary">
                      {t('intercambios.form.successTitle')}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-2 max-w-sm leading-relaxed">
                      {t('intercambios.form.successDescription')}
                    </p>
                    <Button
                      type="button"
                      onClick={() => setSubmitted(false)}
                      variant="outline"
                      className="mt-6"
                    >
                      {t('intercambios.enviar-nova-solicitacao')}
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                    {errorMessage && (
                      <div
                        role="alert"
                        className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg"
                      >
                        {errorMessage}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor={`${baseId}-nome`}
                          className="text-xs font-semibold text-secondary"
                        >
                          {t('intercambios.nome-completo')}
                        </label>
                        <Input
                          id={`${baseId}-nome`}
                          name="nome"
                          required
                          autoComplete="name"
                          maxLength={120}
                          value={form.nome}
                          onChange={(e) => setField('nome', e.target.value)}
                          placeholder={t('intercambios.seu-nome-completo')}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor={`${baseId}-email`}
                          className="text-xs font-semibold text-secondary"
                        >
                          {t('intercambios.korea.form.email')}
                        </label>
                        <Input
                          id={`${baseId}-email`}
                          name="email"
                          required
                          type="email"
                          autoComplete="email"
                          maxLength={180}
                          value={form.email}
                          onChange={(e) => setField('email', e.target.value)}
                          placeholder={t('intercambios.korea.form.emailPlaceholder')}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor={`${baseId}-phone`}
                          className="text-xs font-semibold text-secondary"
                        >
                          {t('intercambios.korea.form.phoneWhatsapp')}
                        </label>
                        <Input
                          id={`${baseId}-phone`}
                          name="phone"
                          required
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          maxLength={40}
                          value={form.phone}
                          onChange={(e) => setField('phone', e.target.value)}
                          placeholder={PHONE_PLACEHOLDER}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor={`${baseId}-pais`}
                          className="text-xs font-semibold text-secondary"
                        >
                          {t('intercambios.pais-de-residencia')}
                        </label>
                        <Input
                          id={`${baseId}-pais`}
                          name="pais"
                          maxLength={80}
                          value={form.pais}
                          onChange={(e) => setField('pais', e.target.value)}
                          placeholder={t('intercambios.brasil')}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor={`${baseId}-idioma`}
                          className="text-xs font-semibold text-secondary"
                        >
                          {t('intercambios.idioma-de-atendimento')}
                        </label>
                        <select
                          id={`${baseId}-idioma`}
                          name="idioma"
                          value={form.idioma}
                          onChange={(e) => setField('idioma', e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="Português">{t('intercambios.form.languagePt')}</option>
                          <option value="English">{t('intercambios.form.languageEn')}</option>
                          <option value="Español">{t('intercambios.form.languageEs')}</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor={`${baseId}-idade`}
                          className="text-xs font-semibold text-secondary"
                        >
                          {t('intercambios.idade')}
                        </label>
                        <Input
                          id={`${baseId}-idade`}
                          name="idade"
                          type="number"
                          min={14}
                          max={99}
                          value={form.idade}
                          onChange={(e) => setField('idade', e.target.value)}
                          placeholder={t('intercambios.sua-idade')}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor={`${baseId}-nivel`}
                          className="text-xs font-semibold text-secondary"
                        >
                          {t('intercambios.nivel-atual-de-coreano')}
                        </label>
                        <select
                          id={`${baseId}-nivel`}
                          name="nivel"
                          value={form.nivel}
                          onChange={(e) => setField('nivel', e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {LEVEL_KEYS.map((key, index) => (
                            <option key={key} value={LEVEL_VALUES[index]}>
                              {t(key)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor={`${baseId}-campus`}
                          className="text-xs font-semibold text-secondary"
                        >
                          {t('intercambios.campus-de-interesse')}
                        </label>
                        <select
                          id={`${baseId}-campus`}
                          name="campus"
                          value={form.campus}
                          onChange={(e) => setField('campus', e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="">{t('intercambios.selecione-um-campus')}</option>
                          {campuses.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} - {item.city}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor={`${baseId}-curso`}
                          className="text-xs font-semibold text-secondary"
                        >
                          {t('intercambios.curso-de-interesse')}
                        </label>
                        <select
                          id={`${baseId}-curso`}
                          name="curso"
                          value={form.curso}
                          onChange={(e) => setField('curso', e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="">{t('intercambios.selecione-um-curso')}</option>
                          {programs.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor={`${baseId}-semanas`}
                          className="text-xs font-semibold text-secondary"
                        >
                          {t('intercambios.quantidade-de-semanas')}
                        </label>
                        <Input
                          id={`${baseId}-semanas`}
                          name="semanas"
                          type="number"
                          min={1}
                          max={52}
                          value={form.semanas}
                          onChange={(e) => setField('semanas', e.target.value)}
                          placeholder={t('intercambios.ex-4')}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor={`${baseId}-periodo`}
                          className="text-xs font-semibold text-secondary"
                        >
                          {t('intercambios.periodo-pretendido')}
                        </label>
                        <Input
                          id={`${baseId}-periodo`}
                          name="periodo"
                          maxLength={80}
                          value={form.periodo}
                          onChange={(e) => setField('periodo', e.target.value)}
                          placeholder={t('intercambios.ex-janeiro-2027')}
                        />
                      </div>
                    </div>

                    <fieldset className="flex flex-wrap gap-6 py-2">
                      <legend className="sr-only">
                        {t('coreia.intercambio.additionalServices')}
                      </legend>
                      {(
                        [
                          ['hospedagem', 'intercambios.interesse-em-hospedagem'],
                          ['seguro', 'intercambios.interesse-em-seguro-viagem'],
                          ['transfer', 'intercambios.interesse-em-transfer'],
                        ] as const
                      ).map(([field, key]) => (
                        <label key={field} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            name={field}
                            checked={form[field]}
                            onChange={(e) => setField(field, e.target.checked)}
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                          />
                          <span className="text-xs font-medium text-secondary">{t(key)}</span>
                        </label>
                      ))}
                    </fieldset>

                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor={`${baseId}-observacoes`}
                        className="text-xs font-semibold text-secondary"
                      >
                        {t('intercambios.observacoes')}
                      </label>
                      <textarea
                        id={`${baseId}-observacoes`}
                        name="observacoes"
                        maxLength={2000}
                        value={form.observacoes}
                        onChange={(e) => setField('observacoes', e.target.value)}
                        placeholder={t('intercambios.form.notesPlaceholder')}
                        rows={3}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-primary hover:bg-accent-hover text-white py-3 rounded-xl font-bold mt-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                          {t('intercambios.korea.form.submitting')}
                        </>
                      ) : (
                        <>
                          <Send aria-hidden className="h-4 w-4" />
                          {t('intercambios.form.cta-x')}
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
