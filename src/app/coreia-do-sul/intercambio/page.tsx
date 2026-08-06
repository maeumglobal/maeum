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

export default function LexisKoreaIntercambioPage() {
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
          <div className="animate-pulse font-heading text-xl text-primary">Carregando...</div>
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
        <section className="relative h-[65vh] min-h-[480px] w-full overflow-hidden">
          <Image
            src="/images/agencia-viagens-coreia-do-sul-maeum-global-intercambio.webp"
            alt="Intercâmbio na Coreia do Sul Maeum Global Desktop"
            fill
            className="object-cover hidden md:block"
            priority
            unoptimized
          />
          <Image
            src="/images/mobile/agencia-viagens-coreia-do-sul-maeum-global-intercambio-mobile.webp"
            alt="Intercâmbio na Coreia do Sul Maeum Global Mobile"
            fill
            className="object-cover block md:hidden"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
          <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-16 max-w-7xl mx-auto w-full">
            <div className="max-w-3xl text-white">
              <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 backdrop-blur-sm inline-block mb-4">
                Intercâmbio Premium
              </span>
              <h1 className="font-heading text-4xl sm:text-6xl font-light mt-2 tracking-wide uppercase leading-tight">
                Intercâmbio na Coreia do Sul
              </h1>
              <p className="text-sm sm:text-base text-white/80 mt-4 max-w-xl leading-relaxed font-light">
                Estude coreano na Lexis Korea, escola parceira com unidades em Gangnam, Hongdae e Busan. 
                Uma experiência imersiva que combina aprendizado de alto nível com a descoberta da cultura coreana.
              </p>
            </div>
          </div>
        </section>

        {/* Institution Intro */}
        <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
            <div className="lg:col-span-3 flex flex-col gap-5">
              <span className="text-xs uppercase tracking-widest text-primary font-bold">Lexis Korea</span>
              <h2 className="font-heading text-3xl sm:text-4xl font-light text-secondary leading-tight">
                Sua jornada de aprendizado começa aqui
              </h2>
              <div className="w-12 h-px bg-primary" />
              <p className="text-sm text-muted-foreground leading-relaxed font-light">
                {institution?.description || 'Escola de idiomas premium na Coreia do Sul, com campi em Gangnam, Hongdae e Busan. Reconhecida pela excelência no ensino de coreano para estrangeiros.'}
              </p>
              <div className="flex flex-wrap gap-6 mt-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <GraduationCap className="h-4 w-4 text-accent" />
                  <span>20 aulas/semana (Intensivo) | 15 aulas/semana (Standard)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-4 w-4 text-accent" />
                  <span>3 campi: Seul (2) & Busan</span>
                </div>
              </div>
            </div>
            <div className="lg:col-span-2 grid grid-cols-2 gap-3">
              <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-1.5">
                <span className="text-2xl font-heading font-bold text-primary">3</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Campi</span>
              </div>
              <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-1.5">
                <span className="text-2xl font-heading font-bold text-primary">52</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Semanas máx.</span>
              </div>
              <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-1.5">
                <span className="text-2xl font-heading font-bold text-primary">2</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Programas</span>
              </div>
              <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-1.5">
                <span className="text-2xl font-heading font-bold text-primary">100%</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Suporte Maeum</span>
              </div>
            </div>
          </div>
        </section>

        {/* Campuses Section */}
        <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto w-full border-t border-border">
          <div className="mb-12">
            <span className="text-xs uppercase tracking-widest text-primary font-bold">Nossos Campi</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-light text-secondary mt-2">Escolha onde estudar</h2>
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
                        <span className="text-[10px] uppercase font-bold text-primary tracking-wider">Programas disponíveis</span>
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
            <span className="text-xs uppercase tracking-widest text-primary font-bold">Programas</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-light text-secondary mt-2">Escolha seu curso de coreano</h2>
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
                    <span>{program.classes_per_week} aulas/semana</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Building className="h-4 w-4 text-accent" />
                    <span>Duração: {program.duration_weeks_min} a {program.duration_weeks_max} semanas</span>
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
                      <span className="text-xs font-bold text-secondary">Atividades Culturais Inclusas</span>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        O programa inclui atividades culturais regulares como caligrafia coreana, culinária, K-Pop e visitas a pontos turísticos, proporcionando uma imersão completa na cultura coreana.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right - Pricing Table */}
              <div className="lg:col-span-2">
                <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                  <h4 className="font-heading text-lg font-light text-secondary mb-4">Tabela de Preços</h4>
                  <div className="overflow-hidden rounded-xl border border-border">
                    <div className="bg-muted/50 grid grid-cols-2 gap-px text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      <div className="p-3">Semanas</div>
                      <div className="p-3">Preço por semana</div>
                    </div>
                    {program.pricing_tiers?.map((tier: any, idx: number) => (
                      <div key={idx} className="grid grid-cols-2 gap-px text-xs border-t border-border">
                        <div className="p-3 font-medium text-secondary">
                          {tier.range === '30+' ? `${tier.range} semanas` : `${tier.range} semanas`}
                        </div>
                        <div className="p-3 text-primary font-bold font-heading">
                          {tier.currency} {tier.price_per_week.toLocaleString()}/semana
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-col gap-2 text-xs text-muted-foreground">
                    {program.includes_enrollment_fee && program.enrollment_fee > 0 && (
                      <div className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
                        <span>Taxa de Matrícula</span>
                        <span className="font-bold text-secondary">{program.enrollment_fee_currency} {program.enrollment_fee.toLocaleString()}</span>
                      </div>
                    )}
                    {program.includes_material && program.material_fee > 0 && (
                      <div className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
                        <span>Material Didático</span>
                        <span className="font-bold text-secondary">{program.material_fee_currency} {program.material_fee.toLocaleString()}</span>
                      </div>
                    )}
                    {program.cultural_activities && (
                      <div className="flex items-center gap-2 py-1.5 text-green-600">
                        <Check className="h-3.5 w-3.5" />
                        <span>Atividades culturais inclusas</span>
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
              <span className="text-xs uppercase tracking-widest text-primary font-bold">Planeje seu intercâmbio</span>
              <h2 className="font-heading text-3xl sm:text-4xl font-light text-secondary mt-2 leading-tight">
                  Solicitar Planejamento
              </h2>
              <p className="text-sm text-muted-foreground mt-4 leading-relaxed font-light">
                Preencha o formulário ao lado com suas preferências. Nossa equipe preparará um planejamento 
                personalizado com orçamento detalhado, sugestão de hospedagem e todo o suporte necessário 
                para sua jornada de estudos na Coreia do Sul.
              </p>
              <div className="flex flex-col gap-3 mt-8">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <Check className="h-4 w-4 text-accent shrink-0" />
                  <span>Orientação personalizada gratuita</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <Check className="h-4 w-4 text-accent shrink-0" />
                  <span>Suporte em português do início ao fim</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <Check className="h-4 w-4 text-accent shrink-0" />
                  <span>Auxílio com matrícula, visto e hospedagem</span>
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
                    <h3 className="font-heading text-2xl font-light text-secondary">Solicitação Enviada!</h3>
                    <p className="text-xs text-muted-foreground mt-2 max-w-sm leading-relaxed">
                      Recebemos seus dados e em breve nossa equipe entrará em contato com um planejamento 
                      personalizado para seu intercâmbio na Coreia do Sul.
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
                      Enviar Nova Solicitação
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-secondary">Nome Completo *</label>
                        <Input
                          required
                          value={form.nome}
                          onChange={(e) => handleFormChange('nome', e.target.value)}
                          placeholder="Seu nome completo"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-secondary">País de Residência</label>
                        <Input
                          value={form.pais}
                          onChange={(e) => handleFormChange('pais', e.target.value)}
                          placeholder="Brasil"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-secondary">Idioma de Atendimento</label>
                        <select
                          value={form.idioma}
                          onChange={(e) => handleFormChange('idioma', e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="Português">Português</option>
                          <option value="English">English</option>
                          <option value="Español">Español</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-secondary">Idade</label>
                        <Input
                          type="number"
                          value={form.idade}
                          onChange={(e) => handleFormChange('idade', e.target.value)}
                          placeholder="Sua idade"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-secondary">Nível Atual de Coreano</label>
                        <select
                          value={form.nivel}
                          onChange={(e) => handleFormChange('nivel', e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="Iniciante">Iniciante</option>
                          <option value="Básico">Básico</option>
                          <option value="Intermediário">Intermediário</option>
                          <option value="Avançado">Avançado</option>
                          <option value="Fluente">Fluente</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-secondary">Campus de Interesse</label>
                        <select
                          value={form.campus}
                          onChange={(e) => handleFormChange('campus', e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="">Selecione um campus</option>
                          {campuses.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.name} - {c.city}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-secondary">Curso de Interesse</label>
                        <select
                          value={form.curso}
                          onChange={(e) => handleFormChange('curso', e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="">Selecione um curso</option>
                          {programs.map((p: any) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-secondary">Quantidade de Semanas</label>
                        <Input
                          type="number"
                          min={1}
                          value={form.semanas}
                          onChange={(e) => handleFormChange('semanas', e.target.value)}
                          placeholder="Ex: 4"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-secondary">Período Pretendido</label>
                        <Input
                          value={form.periodo}
                          onChange={(e) => handleFormChange('periodo', e.target.value)}
                          placeholder="Ex: Janeiro 2027"
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
                        <span className="text-xs font-medium text-secondary">Interesse em hospedagem</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.seguro}
                          onChange={(e) => handleFormChange('seguro', e.target.checked)}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="text-xs font-medium text-secondary">Interesse em seguro viagem</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.transfer}
                          onChange={(e) => handleFormChange('transfer', e.target.checked)}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="text-xs font-medium text-secondary">Interesse em transfer</span>
                      </label>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">Observações</label>
                      <textarea
                        value={form.observacoes}
                        onChange={(e) => handleFormChange('observacoes', e.target.value)}
                        placeholder="Conte-nos mais sobre suas expectativas, necessidades especiais ou dúvidas..."
                        rows={3}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-accent-hover text-white py-3 rounded-xl font-bold mt-2"
                    >
                      <Send className="h-4 w-4" />
                      SOLICITAR PLANEJAMENTO
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
