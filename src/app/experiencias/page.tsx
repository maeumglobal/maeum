'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Sparkles, Clock, ArrowRight, CheckCircle2, Star, Users
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const EXPERIENCIAS = [
  {
    id: 'e-1',
    title: 'K-BEAUTY EXPERIENCE',
    subtitle: 'Parceria com Cheotnun',
    items: ['Análise da pele', 'Consulta personalizada', 'Skincare & Makeup Glow', 'Produtos de alta linha'],
    duration: '2 horas',
    price: 1050,
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600',
  },
  {
    id: 'e-2',
    title: 'HANBOK DESIGN EXPERIENCE',
    subtitle: null,
    items: ['Consultora individual', 'Escolha personalizada', 'Acessórios tradicionais', 'Sessão fotográfica'],
    duration: '2 horas',
    price: 950,
    image: 'https://images.unsplash.com/photo-1569040280523-c6c87ab8f131?q=80&w=600',
  },
  {
    id: 'e-3',
    title: 'PERFUME EXPERIENCE',
    subtitle: null,
    items: ['História da perfumaria coreana', 'Criação da sua fragrância', 'Produção manual', 'Embalagem personalizada'],
    duration: '2 horas',
    price: 850,
    image: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?q=80&w=600',
  },
  {
    id: 'e-4',
    title: 'MAEGOLLI MASTER CLASS',
    subtitle: null,
    items: ['Medição de ingredientes', 'Fermentação artesanal', 'Produção de maegolli', 'Degustação'],
    duration: '2 horas',
    price: 750,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=600',
  },
  {
    id: 'e-5',
    title: 'CERÂMICA TRADICIONAL',
    subtitle: null,
    items: ['Introdução à cerâmica', 'Modelagem', 'Pintura', 'Produção de cerâmica para levar'],
    duration: '2h30',
    price: 680,
    image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?q=80&w=600',
  },
  {
    id: 'e-6',
    title: 'BIBIMBAP EXPERIENCE',
    subtitle: null,
    items: ['Visita ao mercado local', 'Aula com chef coreano', 'Aprenda do bibimbap', 'Degustação completa'],
    duration: '2h30',
    price: 850,
    image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?q=80&w=600',
  },
  {
    id: 'e-7',
    title: 'BOJAGI ART',
    subtitle: null,
    items: ['História do bojagi', 'Técnicas tradicionais', 'Produção de lua e arco', 'Peça para levar'],
    duration: '2 horas',
    price: 550,
    image: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=600',
  },
  {
    id: 'e-8',
    title: 'HAN RIVER SUNSET BIKE TOUR',
    subtitle: null,
    items: ['Passeio de bicicleta', 'Guia especializado', 'Locais secretos', 'Registro fotográfico'],
    duration: '2 horas',
    price: 750,
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=600',
  },
  {
    id: 'e-9',
    title: 'FOOT SPA & RELAXAMENTO',
    subtitle: null,
    items: ['Imersão pés com ervas', 'Massagem reflexante', 'Chá coreano artesanal', 'Momento de relaxamento'],
    duration: '1h30',
    price: 420,
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=600',
  },
  {
    id: 'e-10',
    title: 'PHOTO EXPERIENCE',
    subtitle: null,
    items: ['Sessão fotográfica', 'Locações icônicas', 'Fotógrafo profissional', 'Link para download'],
    duration: '2 horas',
    price: 900,
    image: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?q=80&w=600',
  },
  {
    id: 'e-11',
    title: 'TEA CEREMONY',
    subtitle: null,
    items: ['Cerimônia em ambiente tradicional'],
    duration: '1h30',
    price: 420,
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=600',
  },
  {
    id: 'e-12',
    title: 'CALLIGRAPHY CLASS',
    subtitle: null,
    items: ['Arte da escrita coreana'],
    duration: '1h30',
    price: 390,
    image: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=600',
  },
  {
    id: 'e-13',
    title: 'TEMPLE STAY DAY',
    subtitle: null,
    items: ['Imersão budista'],
    duration: '4 horas',
    price: 650,
    image: 'https://images.unsplash.com/photo-1576487503259-aa5b6c27bc65?q=80&w=600',
  },
  {
    id: 'e-14',
    title: 'K-POP DANCE CLASS',
    subtitle: null,
    items: ['Aula de particular'],
    duration: '1 hora',
    price: 850,
    image: 'https://images.unsplash.com/photo-1547394765-185e1e68f34e?q=80&w=600',
  },
  {
    id: 'e-15',
    title: 'PRIVATE HANOK DINNER',
    subtitle: null,
    items: ['Jantar em hanok'],
    duration: '2 horas',
    price: 980,
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?q=80&w=600',
  },
];

const COMO_FUNCIONA = [
  { num: '01', title: 'ESCOLHA', desc: 'Selecione as experiências que mais combinam com o seu perfil.' },
  { num: '02', title: 'PLANEJAMENTO', desc: 'Nossa equipe verifica disponibilidade e agenda tudo ao seu redor.' },
  { num: '03', title: 'APROVEITE', desc: 'Você viva cada momento com parceiros locais e selecionados.' },
  { num: '04', title: 'MEMÓRIAS', desc: 'Experiências que ficam para sempre na sua história e no seu coração.' },
];

export default function ExperienciasPage() {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#1A0F14' }}>
      <Header />

      {/* Hero */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1576487503259-aa5b6c27bc65?q=80&w=1920"
            alt="Experiências exclusivas na Coreia do Sul"
            fill
            unoptimized
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A0F14] via-[#1A0F14]/85 to-[#1A0F14]/30" />
        </div>

        <div className="relative z-10 px-8 max-w-7xl mx-auto w-full flex flex-col gap-5 mt-16">
          <span className="text-xs uppercase tracking-widest text-[#C8A27C] font-bold">MAEUM EXPERIENCES</span>
          <h1 className="font-heading text-4xl sm:text-6xl font-light text-white leading-tight max-w-xl">
            Viva a Coreia <br />
            <span className="italic text-[#C8A27C]">além dos <br />pontos turísticos.</span>
          </h1>
          <p className="text-sm text-gray-300 max-w-lg leading-relaxed font-light">
            Acreditamos que conhecer um país significa criar conexões com as pessoas, a cultura e as tradições locais. Cada experiência da Maeum Global foi escolhida para proporcionar momentos autênticos, em pequenos grupos e com parceiros cuidadosamente selecionados.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <a href="#experiencias" className="flex items-center justify-center gap-2 bg-[#C8A27C] hover:bg-[#B8906C] text-[#1A0F14] font-bold text-xs py-3.5 px-8 rounded-xl transition-all uppercase tracking-wider">
              EXPLORAR EXPERIÊNCIAS
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link href="/contato" className="flex items-center justify-center gap-2 bg-transparent border border-[#C8A27C] text-[#C8A27C] hover:bg-[#C8A27C]/10 font-bold text-xs py-3.5 px-8 rounded-xl transition-all uppercase tracking-wider">
              SOLICITAR PLANEJAMENTO
            </Link>
          </div>
        </div>
      </section>

      {/* Curadoria Maeum */}
      <section className="py-12 px-4 md:px-8 border-t border-[#3A232E]" style={{ background: '#1A0F14' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="md:w-1/3">
              <span className="text-xs uppercase tracking-widest text-[#C8A27C] font-bold">CURADORIA MAEUM</span>
              <h2 className="font-heading text-2xl font-light text-[#F3E8DC] mt-2 leading-tight">
                Não vendemos passeios. Criamos momentos que normalmente não estão disponíveis em roteiros convencionais.
              </h2>
            </div>
            <div className="md:w-2/3 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: 'Parceiros locais selecionados' },
                { label: 'Pequenos grupos' },
                { label: 'Atendimento em português' },
                { label: 'Experiências autorais' },
                { label: 'Reservas antecipadas' },
                { label: 'Momentos exclusivos' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                  <CheckCircle2 className="h-4 w-4 text-[#C8A27C] shrink-0" />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Grid de Experiências */}
      <section id="experiencias" className="py-16 px-4 md:px-8 border-t border-[#3A232E]" style={{ background: '#1A0F14' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-3">
            <span className="text-xs uppercase tracking-widest text-[#C8A27C] font-bold">EXPERIÊNCIAS EXCLUSIVAS</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-8">
            {EXPERIENCIAS.map((exp) => (
              <div
                key={exp.id}
                className="group flex flex-col rounded-2xl overflow-hidden border border-[#3A232E] hover:border-[#C8A27C]/50 transition-all"
                style={{ background: '#2A161D' }}
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <Image src={exp.image} alt={exp.title} fill unoptimized className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
                <div className="p-4 flex flex-col flex-1 gap-2">
                  <h3 className="text-[10px] font-bold text-[#C8A27C] uppercase tracking-wider leading-tight">{exp.title}</h3>
                  {exp.subtitle && (
                    <span className="text-[9px] text-gray-400">{exp.subtitle}</span>
                  )}
                  {exp.items.length > 0 && (
                    <ul className="flex flex-col gap-1 flex-1">
                      {exp.items.map((item, i) => (
                        <li key={i} className="text-[9px] text-gray-400 flex items-start gap-1">
                          <span className="text-[#C8A27C] mt-0.5">✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex items-center gap-1 text-[9px] text-gray-500 mt-1">
                    <Clock className="h-3 w-3 text-[#C8A27C]" />
                    {exp.duration}
                  </div>
                  <div className="pt-2 border-t border-[#3A232E] flex items-center justify-between">
                    <span className="text-xs font-bold text-[#C8A27C]">R$ {exp.price.toLocaleString('pt-BR')}</span>
                    <Link href="/contato" className="text-[8px] font-bold text-[#1A0F14] bg-[#C8A27C] hover:bg-[#B8906C] py-1.5 px-3 rounded-lg transition-all uppercase">
                      RESERVAR
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="py-16 px-4 md:px-8 border-t border-[#3A232E]" style={{ background: '#1A0F14' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-3">
            <span className="text-xs uppercase tracking-widest text-[#C8A27C] font-bold">COMO FUNCIONA</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10 items-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {COMO_FUNCIONA.map((step, i) => (
                <div key={i} className="flex flex-col gap-2 p-5 rounded-xl border border-[#3A232E]" style={{ background: '#2A161D' }}>
                  <span className="text-xs font-bold text-[#C8A27C] font-heading">{step.num}</span>
                  <h4 className="text-sm font-bold text-[#F3E8DC] uppercase tracking-wider">{step.title}</h4>
                  <p className="text-[10px] text-gray-400 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=800"
                alt="Experiências na Coreia"
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Por que escolhemos nossos parceiros */}
      <section className="py-16 px-4 md:px-8 border-t border-[#3A232E]" style={{ background: '#2A161D' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-10">
            <div className="md:w-1/2">
              <span className="text-xs uppercase tracking-widest text-[#C8A27C] font-bold">POR QUE ESCOLHEMOS NOSSOS PARCEIROS?</span>
              <p className="text-sm text-gray-300 mt-4 leading-relaxed">
                Na Maeum Global acreditamos que parceiros fazem toda a diferença na sua jornada. Por isso trabalhamos apenas com parceiros locais que compartilham dos nossos valores de qualidade, hospitalidade e autenticidade.
              </p>
              <p className="text-sm text-gray-300 mt-3 leading-relaxed">
                Cada experiência é escolhida pessoalmente para oferecer algo que vai além do turismo tradicional.
              </p>
            </div>
            <div className="md:w-1/2 grid grid-cols-2 gap-4">
              {[
                { label: 'Qualidade Premium', icon: Star },
                { label: 'Hospitalidade Local', icon: Users },
                { label: 'Autenticidade', icon: CheckCircle2 },
                { label: 'Confiança e Segurança', icon: CheckCircle2 },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-[#3A232E]" style={{ background: '#1A0F14' }}>
                    <Icon className="h-4 w-4 text-[#C8A27C] shrink-0" />
                    <span className="text-xs text-gray-300">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="py-14 px-4 md:px-8 border-t border-[#3A232E]" style={{ background: '#1A0F14' }}>
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-gray-400 mb-2">Sua viagem pode ser tão única quanto você.</p>
          <h2 className="font-heading text-2xl sm:text-3xl font-light text-[#F3E8DC] mb-6">
            Monte uma jornada personalizada combinando cultura, gastronomia,<br className="hidden sm:inline" /> beleza, K-Beauty e as experiências do seu coração.
          </h2>
          <Link href="/contato" className="inline-flex items-center gap-2 bg-[#C8A27C] hover:bg-[#B8906C] text-[#1A0F14] font-bold text-xs py-4 px-10 rounded-xl transition-all uppercase tracking-wider">
            PERSONALIZAR MINHA EXPERIÊNCIA
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="mt-8 flex items-center justify-center gap-2 text-[10px] text-gray-500">
            <span>FALAR COM UMA CONSULTORA →</span>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
