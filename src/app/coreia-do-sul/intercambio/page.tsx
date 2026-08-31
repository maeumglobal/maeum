'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { GraduationCap, MapPin, Clock, BookOpen, Building, Send, ChevronLeft, Check, Info } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMedia } from '@/contexts/SiteContentContext';

export default function LexisKoreaIntercambioPage() {
  const { t, locale } = useLanguage();
  const heroDesktop = useMedia('intercambio_hero_desktop');
  const heroMobile = useMedia('intercambio_hero_mobile');
  const lp = (path: string) => (locale === 'pt' || path === '/' ? path : `/${locale}${path}`);
  const [institution, setInstitution] = useState<any>(null);
  const [campuses, setCampuses] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<string>('intensive-korean');
  const [form, setForm] = useState({
    nome: '',
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
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const insts = db.get('exchange_institutions') || [];
    const lexis = insts.find((i: any) => i.slug === 'lexis-korea');
    setInstitution(lexis || null);

    const allCampuses = db.get('exchange_campuses') || [];
    const allPrograms = db.get('exchange_programs') || [];

    if (lexis) {
      setCampuses(allCampuses.filter((c: any) => c.institution_id === lexis.id));
      setPrograms(allPrograms.filter((p: any) => p.institution_id === lexis.id));
    }

    setLoading(false);
  }, []);

  const program = programs.find((p: any) => p.slug === selectedProgram);

  const handleFormChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse font-heading text-xl text-primary">{t('Carregando...')}</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative min-h-[100dvh] w-full flex flex-col justify-center overflow-hidden border-b border-[#3D2620]">
          <Image
src={heroDesktop}
            alt={t('Intercâmbio na Coreia do Sul Maeum Global Desktop')}
            fill
            className="object-cover hidden md:block"
            priority
            unoptimized
          />
          <Image
            src={heroMobile}
            alt={t('Intercâmbio na Coreia do Sul Maeum Global Mobile')}
            fill
            className="object-cover block md:hidden"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0A08] via-[#0F0A08]/50 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-16 max-w-7xl mx-auto w-full pb-12 md:pb-20">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#C8A27C] bg-[#C8A27C]/10 border border-[#C8A27C]/30 px-4 py-1.5 backdrop-blur-sm inline-block">
                  {t('Intercâmbio Premium')}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-white bg-white/10 border border-white/20 px-4 py-1.5 backdrop-blur-sm inline-block">
                  {t('✓ Parceiro Oficial Lexis Korea')}
                </span>
              </div>
              <h1 className="font-heading text-4xl sm:text-6xl font-light mt-2 tracking-wide uppercase leading-tight text-white">
                {t('Intercâmbio na Coreia do Sul')}
              </h1>
              <p className="text-sm sm:text-base text-white/80 mt-4 max-w-xl leading-relaxed font-light">
                {t('Estude coreano na Lexis Korea, escola parceira com unidades em Gangnam, Hongdae e Busan. Uma experiência imersiva que combina aprendizado de alto nível com a descoberta da cultura coreana.')}
              </p>
            </div>
          </div>
        </section>

        {/* Institution Intro */}
        <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
            <div className="lg:col-span-3 flex flex-col gap-5">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[10px] uppercase tracking-widest text-[#C8A27C] font-bold">Lexis Korea</span>
                <span className="text-[8px] uppercase tracking-widest text-[#0F0A08] bg-[#C8A27C] font-bold px-3 py-1">✓ Parceiro Oficial Maeum Global</span>
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl font-light text-white leading-tight">
                {t('Sua jornada de aprendizado começa aqui')}
              </h2>
              <div className="w-12 h-px bg-[#C8A27C]" />
              <p className="text-sm text-gray-400 leading-relaxed font-light">
                {institution?.description || t('Escola de idiomas premium na Coreia do Sul, com campi em Gangnam, Hongdae e Busan. Reconhecida pela excelência no ensino de coreano para estrangeiros.')}
              </p>
              <div className="flex flex-wrap gap-6 mt-2">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <GraduationCap className="h-4 w-4 text-[#C8A27C]" />
                  <span>{t('20 aulas/semana (Intensivo) | 15 aulas/semana (Standard)')}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <MapPin className="h-4 w-4 text-[#C8A27C]" />
                  <span>{t('3 campi: Seul (2) & Busan')}</span>
                </div>
              </div>
            </div>
            <div className="lg:col-span-2 grid grid-cols-2 gap-3">
              <div className="bg-[#261514] border border-[#3D2620] rounded-sm p-5 flex flex-col gap-1.5">
                <span className="text-2xl font-heading font-bold text-[#C8A27C]">3</span>
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">{t('Campi')}</span>
              </div>
              <div className="bg-[#261514] border border-[#3D2620] rounded-sm p-5 flex flex-col gap-1.5">
                <span className="text-2xl font-heading font-bold text-[#C8A27C]">52</span>
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">{t('Semanas máx.')}</span>
              </div>
              <div className="bg-[#261514] border border-[#3D2620] rounded-sm p-5 flex flex-col gap-1.5">
                <span className="text-2xl font-heading font-bold text-[#C8A27C]">2</span>
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">{t('Programas')}</span>
              </div>
              <div className="bg-[#261514] border border-[#3D2620] rounded-sm p-5 flex flex-col gap-1.5">
                <span className="text-2xl font-heading font-bold text-[#C8A27C]">100%</span>
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">{t('Suporte Maeum')}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Campuses Section */}
        <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto w-full border-t border-border">
          <div className="mb-12">
            <span className="text-xs uppercase tracking-widest text-primary font-bold">{t('Nossos Campi')}</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-light text-secondary mt-2">{t('Escolha onde estudar')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {campuses.map((campus: any) => {
              const campusPrograms = programs.filter((p: any) => p.campus_id === campus.id);
              return (
                <div key={campus.id} className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group">
                  <div className="relative aspect-[16/10] w-full overflow-hidden">
                    <Image
                      src={campus.main_image || 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=600'}
                      alt={campus.name}
                      fill
                      unoptimized
                      className="object-cover group-hover:scale-102 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-white bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
                        {campus.city}
                      </span>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-heading text-xl font-bold text-secondary group-hover:text-primary transition-colors">{campus.name}</h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3 text-accent" />
                      <span>{campus.location}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 leading-relaxed font-light flex-1">
                      {campus.description}
                    </p>
                    {campusPrograms.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <span className="text-[10px] uppercase font-bold text-primary tracking-wider">{t('Programas disponíveis')}</span>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {campusPrograms.map((prog: any) => (
                            <span key={prog.id} className="text-[10px] bg-muted rounded-full px-2.5 py-1 text-muted-foreground font-medium">
                              {prog.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Programs Section */}
        <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto w-full border-t border-border">
          <div className="mb-12">
            <span className="text-xs uppercase tracking-widest text-primary font-bold">{t('Programas')}</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-light text-secondary mt-2">{t('Escolha seu curso de coreano')}</h2>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-muted/50 rounded-2xl p-1.5 w-fit mb-10 border border-border">
            {programs.map((prog: any) => (
              <button
                key={prog.id}
                onClick={() => setSelectedProgram(prog.slug)}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  selectedProgram === prog.slug
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted-foreground hover:text-secondary hover:bg-muted'
                }`}
              >
                {prog.name}
              </button>
            ))}
          </div>

          {program && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
              {/* Left - Description */}
              <div className="lg:col-span-3 flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-accent" />
                  <h3 className="font-heading text-2xl font-light text-secondary">{program.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed font-light">{program.description}</p>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-accent" />
                    <span>{program.classes_per_week} {t('aulas/semana')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Building className="h-4 w-4 text-accent" />
                    <span>{t('Duração')}: {program.duration_weeks_min} {t('a')} {program.duration_weeks_max} {t('semanas')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4 text-accent" />
                    <span>{program.level_required}</span>
                  </div>
                </div>

                {/* Cultural Activities */}
                {program.cultural_activities && (
                  <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5 flex items-start gap-3">
                    <Info className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-secondary">{t('Atividades Culturais Inclusas')}</span>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {t('O programa inclui atividades culturais regulares como caligrafia coreana, culinária, K-Pop e visitas a pontos turísticos, proporcionando uma imersão completa na cultura coreana.')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right - Pricing Table */}
              <div className="lg:col-span-2">
                <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                  <h4 className="font-heading text-lg font-light text-secondary mb-4">{t('Tabela de Preços')}</h4>
                  <div className="overflow-hidden rounded-xl border border-border">
                    <div className="bg-muted/50 grid grid-cols-2 gap-px text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      <div className="p-3">{t('Semanas')}</div>
                      <div className="p-3">{t('Preço por semana')}</div>
                    </div>
                    {program.pricing_tiers?.map((tier: any, idx: number) => (
                      <div key={idx} className="grid grid-cols-2 gap-px text-xs border-t border-border">
                        <div className="p-3 font-medium text-secondary">
                          {tier.range === '30+' ? `${tier.range} ${t('semanas')}` : `${tier.range} ${t('semanas')}`}
                        </div>
                        <div className="p-3 text-primary font-bold font-heading">
                          {tier.currency} {tier.price_per_week.toLocaleString()}/{t('semana')}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-col gap-2 text-xs text-muted-foreground">
                    {program.includes_enrollment_fee && program.enrollment_fee > 0 && (
                      <div className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
                        <span>{t('Taxa de Matrícula')}</span>
                        <span className="font-bold text-secondary">{program.enrollment_fee_currency} {program.enrollment_fee.toLocaleString()}</span>
                      </div>
                    )}
                    {program.includes_material && program.material_fee > 0 && (
                      <div className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
                        <span>{t('Material Didático')}</span>
                        <span className="font-bold text-secondary">{program.material_fee_currency} {program.material_fee.toLocaleString()}</span>
                      </div>
                    )}
                    {program.cultural_activities && (
                      <div className="flex items-center gap-2 py-1.5 text-green-600">
                        <Check className="h-3.5 w-3.5" />
                        <span>{t('Atividades culturais inclusas')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Inquiry Form */}
        <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto w-full border-t border-border">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            <div className="lg:col-span-2">
              <span className="text-xs uppercase tracking-widest text-primary font-bold">{t('Planeje seu intercâmbio')}</span>
              <h2 className="font-heading text-3xl sm:text-4xl font-light text-secondary mt-2 leading-tight">
                  {t('Solicitar Planejamento')}
              </h2>
              <p className="text-sm text-muted-foreground mt-4 leading-relaxed font-light">
                {t('Preencha o formulário ao lado com suas preferências. Nossa equipe preparará um planejamento personalizado com orçamento detalhado, sugestão de hospedagem e todo o suporte necessário para sua jornada de estudos na Coreia do Sul.')}
              </p>
              <div className="flex flex-col gap-3 mt-8">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <Check className="h-4 w-4 text-accent shrink-0" />
                  <span>{t('Orientação personalizada gratuita')}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <Check className="h-4 w-4 text-accent shrink-0" />
                  <span>{t('Suporte em português do início ao fim')}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <Check className="h-4 w-4 text-accent shrink-0" />
                  <span>{t('Auxílio com matrícula, visto e hospedagem')}</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                {submitted ? (
                  <div className="flex flex-col items-center justify-center text-center py-10">
                    <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                      <Check className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="font-heading text-2xl font-light text-secondary">{t('Solicitação Enviada!')}</h3>
                    <p className="text-xs text-muted-foreground mt-2 max-w-sm leading-relaxed">
                      {t('Recebemos seus dados e em breve nossa equipe entrará em contato com um planejamento personalizado para seu intercâmbio na Coreia do Sul.')}
                    </p>
                    <Button
                      onClick={() => {
                        setSubmitted(false);
                        setForm({
                          nome: '',
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
                        });
                      }}
                      variant="outline"
                      className="mt-6"
                    >
                      {t('Enviar Nova Solicitação')}
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-secondary">{t('Nome Completo *')}</label>
                        <Input
                          required
                          value={form.nome}
                          onChange={(e) => handleFormChange('nome', e.target.value)}
                          placeholder={t('Seu nome completo')}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-secondary">{t('País de Residência')}</label>
                        <Input
                          value={form.pais}
                          onChange={(e) => handleFormChange('pais', e.target.value)}
                          placeholder={t('Brasil')}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-secondary">{t('Idioma de Atendimento')}</label>
                        <select
                          value={form.idioma}
                          onChange={(e) => handleFormChange('idioma', e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="Português">{t('Português')}</option>
                          <option value="English">{t('English')}</option>
                          <option value="Español">{t('Español')}</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-secondary">{t('Idade')}</label>
                        <Input
                          type="number"
                          value={form.idade}
                          onChange={(e) => handleFormChange('idade', e.target.value)}
                          placeholder={t('Sua idade')}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-secondary">{t('Nível Atual de Coreano')}</label>
                        <select
                          value={form.nivel}
                          onChange={(e) => handleFormChange('nivel', e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="Iniciante">{t('Iniciante')}</option>
                          <option value="Básico">{t('Básico')}</option>
                          <option value="Intermediário">{t('Intermediário')}</option>
                          <option value="Avançado">{t('Avançado')}</option>
                          <option value="Fluente">{t('Fluente')}</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-secondary">{t('Campus de Interesse')}</label>
                        <select
                          value={form.campus}
                          onChange={(e) => handleFormChange('campus', e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="">{t('Selecione um campus')}</option>
                          {campuses.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.name} - {c.city}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-secondary">{t('Curso de Interesse')}</label>
                        <select
                          value={form.curso}
                          onChange={(e) => handleFormChange('curso', e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="">{t('Selecione um curso')}</option>
                          {programs.map((p: any) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-secondary">{t('Quantidade de Semanas')}</label>
                        <Input
                          type="number"
                          min={1}
                          value={form.semanas}
                          onChange={(e) => handleFormChange('semanas', e.target.value)}
                          placeholder={t('Ex: 4')}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-secondary">{t('Período Pretendido')}</label>
                        <Input
                          value={form.periodo}
                          onChange={(e) => handleFormChange('periodo', e.target.value)}
                          placeholder={t('Ex: Janeiro 2027')}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-6 py-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.hospedagem}
                          onChange={(e) => handleFormChange('hospedagem', e.target.checked)}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="text-xs font-medium text-secondary">{t('Interesse em hospedagem')}</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.seguro}
                          onChange={(e) => handleFormChange('seguro', e.target.checked)}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="text-xs font-medium text-secondary">{t('Interesse em seguro viagem')}</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.transfer}
                          onChange={(e) => handleFormChange('transfer', e.target.checked)}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="text-xs font-medium text-secondary">{t('Interesse em transfer')}</span>
                      </label>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">{t('Observações')}</label>
                      <textarea
                        value={form.observacoes}
                        onChange={(e) => handleFormChange('observacoes', e.target.value)}
                        placeholder={t('Conte-nos mais sobre suas expectativas, necessidades especiais ou dúvidas...')}
                        rows={3}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-accent-hover text-white py-3 rounded-xl font-bold mt-2"
                    >
                      <Send className="h-4 w-4" />
                      {t('SOLICITAR PLANEJAMENTO')}
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
