'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Diamond, Shield, Flower2, Star, ArrowRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const VALORES = [
  {
    icon: Heart,
    title: 'PROPÓSITO',
    desc: 'Criar experiências que conectam pessoas, culturas e histórias.',
  },
  {
    icon: Diamond,
    title: 'EXCLUSIVIDADE',
    desc: 'Grupos pequenos, roteiros autorais e acesso a experiências únicas.',
  },
  {
    icon: Shield,
    title: 'CONFIANÇA',
    desc: 'Acompanhamento desde o Brasil e suporte completo durante toda a jornada.',
  },
  {
    icon: Flower2,
    title: 'AUTENTICIDADE',
    desc: 'Parcerias locais selecionadas e vivências além dos roteiros tradicionais.',
  },
  {
    icon: Star,
    title: 'EXCELÊNCIA',
    desc: 'Padrão premium em cada detalhe da sua viagem.',
  },
];

const STATS = [
  { value: '+800', label: 'VIAJANTES REALIZADOS' },
  { value: '98%', label: 'SATISFAÇÃO' },
  { value: '+30', label: 'EXPERIÊNCIAS EXCLUSIVAS' },
  { value: '5 ★', label: 'AVALIAÇÃO MÉDIA' },
];

const PARCEIROS = [
  { name: 'Cheotnun', subtitle: 'K-Beauty Experience', logo: null },
  { name: 'TRIPPER', subtitle: 'Perfumaria Coreana', logo: null },
  { name: 'HANBOK BY DESIGNER', subtitle: 'Designer de Hanbok', logo: null },
  { name: 'INFINITY', subtitle: 'Seguros Viagem', logo: null },
  { name: 'Lexis Korea', subtitle: 'Escola de Idiomas', logo: null },
  { name: 'KORAIL', subtitle: 'KTX Trens', logo: null },
];

export default function SobrePage() {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#1A0F14' }}>
      <Header />

      {/* Hero Section */}
      <section className="relative h-[100dvh] flex flex-col justify-center overflow-hidden border-b border-[#3D2620]">
        <div className="absolute inset-0 z-0">
          <Image 
            src="/images/agencia-viagens-coreia-do-sul-maeum-global-sobre-nos.webp" 
            alt="Sobre a Maeum Global Desktop" 
            fill 
            className="object-cover object-center hidden md:block" 
            priority
          />
          <Image 
            src="/images/mobile/agencia-viagens-coreia-do-sul-maeum-global-sobre-nos-mobile.webp" 
            alt="Sobre a Maeum Global Mobile" 
            fill 
            className="object-cover object-center block md:hidden" 
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F0A08] via-[#0F0A08]/80 to-transparent w-full sm:w-2/3" />
        </div>

        <div className="relative z-10 px-6 sm:px-12 max-w-7xl mx-auto w-full flex flex-col items-start gap-6 pt-24">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold">
            SOBRE A MAEUM GLOBAL
          </span>
          <h1 className="font-heading text-5xl sm:text-6xl md:text-[70px] font-light tracking-wide leading-[1.1] text-white">
            Muito mais que <br />
            viagens. Criamos <br />
            <span className="italic text-[#C8A27C]">conexões que <br/>transformam.</span>
          </h1>
          <div className="w-12 h-[1px] bg-[#C8A27C] my-2"></div>
          <p className="text-[12px] sm:text-[13px] text-gray-300 max-w-xl font-light text-left leading-relaxed opacity-90">
            A Maeum Global nasceu do desejo de proporcionar experiências autênticas, profundas e transformadoras na Coreia do Sul. 
            <br/><br/>
            Acreditamos que cada viagem é única e deve refletir a essência de quem viaja. Por isso, cada roteiro é cuidadosamente planejado, com curadoria premium e atenção a cada detalhe.
          </p>
          <div className="mt-4">
            <Link href="/coreia-do-sul/jornadas" className="flex items-center justify-center gap-3 bg-transparent border border-[#C8A27C] text-[#C8A27C] hover:bg-[#C8A27C] hover:text-[#0F0A08] font-bold text-[10px] py-4 px-8 rounded-none transition-all group uppercase tracking-widest">
              CONHEÇA NOSSAS JORNADAS
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Nossos Valores */}
      <section className="py-20 px-4 md:px-8 border-t border-[#3A232E]" style={{ background: '#1A0F14' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs uppercase tracking-widest text-[#C8A27C] font-bold">NOSSOS VALORES</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {VALORES.map((v, i) => {
              const Icon = v.icon;
              return (
                <div key={i} className="flex flex-col items-center text-center gap-3">
                  <Icon className="h-6 w-6 text-[#C8A27C]" strokeWidth={1.5} />
                  <h3 className="text-xs font-bold text-[#C8A27C] uppercase tracking-wider">{v.title}</h3>
                  <p className="text-[10px] text-gray-400 leading-relaxed">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-10 px-4 md:px-8 border-t border-[#3A232E]" style={{ background: '#2A161D' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-1 py-4">
                <span className="font-heading text-4xl font-bold text-[#C8A27C]">{stat.value}</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nossos Parceiros */}
      <section className="py-20 px-4 md:px-8 border-t border-[#3A232E]" style={{ background: '#1A0F14' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-4">
            <span className="text-xs uppercase tracking-widest text-[#C8A27C] font-bold">NOSSOS PARCEIROS</span>
          </div>
          <p className="text-sm text-gray-400 text-center mb-12">Trabalhamos com marcas e profissionais que compartilham dos nossos valores e garantem experiências autênticas, seguras e memoráveis.</p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {PARCEIROS.map((p, i) => (
              <div key={i} className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border border-[#3A232E] hover:border-[#C8A27C]/40 transition-all text-center" style={{ background: '#2A161D' }}>
                <span className="text-sm font-bold text-[#F3E8DC] tracking-wide">{p.name}</span>
                <span className="text-[9px] text-gray-500 uppercase tracking-wider">{p.subtitle}</span>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/contato" className="flex items-center justify-center gap-2 bg-transparent border border-[#3A232E] hover:border-[#C8A27C] text-[#C8A27C] font-bold text-xs py-3 px-8 rounded-xl transition-all uppercase tracking-wider mx-auto w-fit">
              CONHEÇA NOSSOS PARCEIROS
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Parceria CTA */}
      <section className="py-0 border-t border-[#3A232E]" style={{ background: '#1A0F14' }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2">
          {/* Image */}
          <div className="relative aspect-[4/3] md:aspect-auto">
            <Image
              src="https://images.unsplash.com/photo-1554048612-b6a482bc67e5?q=80&w=800"
              alt="Parceria Maeum Global"
              fill
              unoptimized
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#1A0F14]/30" />
          </div>

          {/* Text */}
          <div className="p-10 md:p-16 flex flex-col justify-center gap-5">
            <span className="text-xs uppercase tracking-widest text-[#C8A27C] font-bold">VAMOS CRIAR ALGO EXTRAORDINÁRIO JUNTOS?</span>
            <h2 className="font-heading text-3xl font-light text-[#F3E8DC] leading-snug">
              Se você representa uma marca, negócio ou oferece experiências na Coreia, vamos conversar.
            </h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              A Maeum Global está sempre aberta a novas parcerias que acrescentem valor às nossas jornadas. Se você deseja promover sua marca, produto ou serviço para um público seleto e altamente engajado, entre em contato conosco.
            </p>

            <div className="flex items-center gap-3 bg-[#2A161D] border border-[#3A232E] rounded-xl p-4">
              <div className="h-8 w-8 rounded-full bg-[#C8A27C]/20 flex items-center justify-center shrink-0">
                <span className="text-[#C8A27C] text-sm">✉</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block">Envie sua proposta para:</span>
                <span className="text-xs font-semibold text-[#F3E8DC]">comercial@maeumglobal.com</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-2">
              {[
                { icon: '📈', label: 'VISIBILIDADE', desc: 'Exposição para um público seleto e qualificado.' },
                { icon: '🤝', label: 'PARCERIAS REAIS', desc: 'Trabalhamos juntos para criar experiências únicas.' },
                { icon: '🌐', label: 'CONEXÕES', desc: 'Fortalecemos culturas, negócios e pessoas.' },
              ].map((item, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <span className="text-base">{item.icon}</span>
                  <span className="text-[9px] font-bold text-[#C8A27C] uppercase tracking-wider">{item.label}</span>
                  <span className="text-[9px] text-gray-500 leading-snug">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer quote */}
      <section className="py-6 px-4 md:px-8 border-t border-[#3A232E]" style={{ background: '#1A0F14' }}>
        <div className="max-w-7xl mx-auto text-center flex items-center justify-center gap-3">
          <div className="text-[#C8A27C] text-xs">✦</div>
          <span className="text-[10px] text-gray-500 uppercase tracking-widest">MAEUM GLOBAL — SUA HISTÓRIA NA COREIA, DO SEU JEITO, COM EXCELÊNCIA.</span>
          <div className="text-[#C8A27C] text-xs">✦</div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
