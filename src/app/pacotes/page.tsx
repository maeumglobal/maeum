'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Calendar, MapPin, Users, ArrowRight, CheckCircle2, Star,
  Utensils, Camera, Music, Train, Flower2, ChevronRight, Clock
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const JORNADAS = [
  {
    id: 'j-1',
    badge: 'GRUPO FUNDADORAS',
    badgeColor: 'bg-[#6B2D8B]',
    season: null,
    title: 'Founding ARMY Edition',
    slug: 'founding-army-edition',
    duration: '14 dias',
    destinations: 'Seul + Busan',
    desc: 'Uma viagem criada para fãs do K-Pop que desejam conhecer a Coreia de forma autêntica. Palacioss históricos, cerimônias do chá, pontos favoritos dos idols e uma conexão coreana para aficionados do BTS.',
    price_libre: null,
    price_prestige: null,
    price_from: 26500,
    label_price: 'A partir de',
    image: 'https://images.unsplash.com/photo-1537944434965-cf4679d1a598?q=80&w=800',
  },
  {
    id: 'j-2',
    badge: 'PRIMAVERA',
    badgeColor: 'bg-[#E91E8C]',
    season: 'PRIMAVERA',
    title: 'Bom Sarang',
    slug: 'bom-sarang',
    duration: '15 dias',
    destinations: 'Seul + Busan',
    desc: 'Uma viagem inspirada na delicadeza da primavera coreana. Palácios iluminados pelas flores de cerejeira, cerimônias do chá, pontos florais favoritos e uma Coreia que floresces para quem a visita.',
    price_libre: 29700,
    price_prestige: null,
    price_from: null,
    label_price: 'Libero',
    image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?q=80&w=800',
  },
  {
    id: 'j-3',
    badge: 'VERÃO',
    badgeColor: 'bg-[#F97316]',
    season: 'VERÃO',
    title: 'Caravana de Verão',
    slug: 'caravana-de-verao',
    duration: '10 dias',
    destinations: 'Seul + Busan',
    desc: 'Dias ensolarados, praias de Busan, mergulho no Rio Han, cafés modernos e uma Coreia vibrante e cheia de vida. A jornada perfeita para quem busca energia, diversão e experiências únicas no ano.',
    price_libre: 29000,
    price_prestige: null,
    price_from: null,
    label_price: 'Libero',
    image: 'https://images.unsplash.com/photo-1498503182468-3b51cbb6cb24?q=80&w=800',
  },
  {
    id: 'j-4',
    badge: 'COMPLETO',
    badgeColor: 'bg-[#4A1F2D]',
    season: null,
    title: 'Always Destination',
    slug: 'always-destination',
    duration: '15 dias',
    destinations: 'Seul + Busan + Daegu',
    desc: 'Nosso roteiro mais completo. Perfeito para quem deseja conhecer diferentes regiões da Coreia com atitude de experiências cuidadosamente selecionadas.',
    price_libre: null,
    price_prestige: null,
    price_from: 39000,
    label_price: 'A partir de',
    image: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?q=80&w=800',
  },
  {
    id: 'j-5',
    badge: 'JEJU PREMIUM',
    badgeColor: 'bg-[#1B5E20]',
    season: null,
    title: 'The Horizon of Seven',
    slug: 'the-horizon-of-seven',
    duration: '15 dias',
    destinations: 'Seul + Busan + Jeju',
    desc: 'Paisagens deslumbrantes, praias, hotéis boutique exclusivos e experiências únicas. Uma viagem desenhada para quem busca o extraordinário.',
    price_libre: null,
    price_prestige: null,
    price_from: 42000,
    label_price: 'A partir de',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800',
  }
];

const EXPERIENCIAS = [
  { icon: Utensils, label: 'Aula de culinária coreana' },
  { icon: Star, label: 'Oficina de Cerâmica' },
  { icon: Star, label: 'Hanbok Premium' },
  { icon: Music, label: 'Aula de dança K-Pop' },
  { icon: Camera, label: 'Ensaio Fotográfico' },
  { icon: Train, label: 'Trem Bala KTX' },
  { icon: Star, label: 'Cruzeiro no Rio Han' },
  { icon: Flower2, label: 'Spa Coreano' },
  { icon: Star, label: 'Cerimônia do Chá' },
  { icon: Star, label: 'Banho em Floresta' },
  { icon: Star, label: 'Experiência K-Beauty (parceria Cheotnun)' },
  { icon: Star, label: 'Welcome Gift' },
];

const DESTINOS = [
  {
    city: 'SEOUL',
    items: ['Palácio Gyeongbokgung', 'Gangnam', 'Hongdae', 'Bukchon Hanok Village', 'Myeongdong', 'Insadong', 'N Seoul Tower', 'Mercados', 'K-Beauty'],
    image: 'https://images.unsplash.com/photo-1538669715515-5e3819766a9e?q=80&w=400',
    featured: false,
  },
  {
    city: 'BUSAN',
    items: ['Praia de Haeundae', 'Bar Gapcheon', 'Gamcheon Village', 'Templos', 'Mercados', 'Vida noturna'],
    image: 'https://images.unsplash.com/photo-1597604958669-a0893de30f36?q=80&w=400',
    featured: false,
  },
  {
    city: 'DAEGU',
    subtitle: 'Exclusivo Always Destination',
    items: ['Cidade de tradição', 'Uma experiência única e especial que surpreende'],
    image: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?q=80&w=400',
    featured: true,
  },
  {
    city: 'JEJU',
    items: ['Exclusivo Maeum of Seven', 'Paisagens naturais', 'Ilundo', 'Campos de chá', 'Praias cristalinas', 'Pôr do sol inesquecível'],
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=400',
    featured: false,
  },
];

const INCLUSO = [
  'Passagem aérea internacional',
  'Hospedagem selecionada',
  'Café da manhã',
  'Transfers privados',
  'Guia Maeum Global',
  'Seguro viagem',
  'Aplicativo Maeum',
  'Chip de internet',
  'Suporte durante a viagem',
  'T-money card',
  'Reunião Pré-Embarque',
  'Boas-vindas exclusivas',
];

const NAO_INCLUSO = [
  'Refeições adicionais não listadas',
  'Gastos pessoais e compras',
  'Passeios opcionais não listados',
  'Despesas extras durante viagem',
];

const COMPARATIVO = [
  { jornada: 'Founding ARMY Edition', dias: 14, destinos: 'Seul + Busan', perfil: 'K-Pop / Fãs', valor: 26500 },
  { jornada: 'Bom Sarang (Primavera)', dias: 15, destinos: 'Seul + Busan', perfil: 'Natureza / Leisure & Econômico', valor: 29700 },
  { jornada: 'Caravana de Verão Liberty', dias: 10, destinos: 'Seul + Busan', perfil: 'Verão / Prestige', valor: 34000 },
  { jornada: 'Always Destination', dias: 15, destinos: 'Seul + Busan + Daegu', perfil: 'Imersão Completa', valor: 39000 },
  { jornada: 'The Horizon of Seven', dias: 15, destinos: 'Seul + Busan + Jeju', perfil: 'Luxo / Experiência Premium', valor: 42000 },
];

const COMO_FUNCIONA = [
  { num: '01', label: 'Solicite seu planejamento' },
  { num: '02', label: 'Conversamos sobre o seu perfil' },
  { num: '03', label: 'Escolhemos o roteiro ideal' },
  { num: '04', label: 'Organizamos tudo da viagem' },
  { num: '05', label: 'Rounds pré-embarque pela Maeum' },
  { num: '06', label: 'Embarque acompanhado pela Maeum' },
];

export default function PacotesPage() {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#1A0F14' }}>
      <Header />

      {/* Hero */}
      <section className="relative min-h-[88vh] flex flex-col justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/atendimento-especializado-viagem-coreia-do-sul-maeum-global-v2.webp"
            alt="Jornadas Maeum Global na Coreia do Sul"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A0F14] via-[#1A0F14]/80 to-transparent" />
        </div>

        <div className="relative z-10 px-8 max-w-7xl mx-auto text-white flex flex-col items-start gap-5 w-full mt-20">
          <span className="text-xs uppercase tracking-widest text-[#C8A27C] font-bold">MAEUM GLOBAL</span>

          <h1 className="font-heading text-4xl sm:text-6xl font-light tracking-wide leading-tight text-white max-w-2xl">
            Descubra uma <br />
            Coreia que <span className="italic text-[#C8A27C]">poucos <br className="hidden sm:inline" />brasileiros conhecem.</span>
          </h1>

          <p className="text-sm sm:text-base text-gray-300 max-w-xl font-light leading-relaxed">
            Cada roteiro da Maeum Global é desenvolvido para quem busca experiências autênticas, grupos exclusivos e uma imersão completa na cultura coreana.
          </p>

          <div className="flex flex-col gap-1 mt-1">
            <span className="font-bold text-white text-sm">Não vendemos excursões.</span>
            <span className="font-bold text-white text-sm">Criamos jornadas.</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <a href="#jornadas" className="flex items-center justify-center gap-2.5 bg-[#C8A27C] hover:bg-[#B8906C] text-[#1A0F14] font-bold text-xs py-3.5 px-8 rounded-xl shadow-lg transition-all uppercase tracking-wider">
              CONHECER JORNADAS
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link href="/contato" className="flex items-center justify-center gap-2.5 bg-transparent border border-[#C8A27C] text-[#C8A27C] hover:bg-[#C8A27C]/10 font-bold text-xs py-3.5 px-8 rounded-xl transition-all uppercase tracking-wider">
              SOLICITAR PLANEJAMENTO
            </Link>
          </div>

          {/* Features bar */}
          <div className="flex flex-wrap items-center gap-10 mt-10 pt-8 border-t border-white/10 w-full max-w-2xl">
            <div className="flex flex-col items-center gap-2">
              <MapPin className="h-5 w-5 text-[#C8A27C]" strokeWidth={1.5} />
              <span className="text-[10px] text-gray-400 font-semibold tracking-wide text-center">Destino Exclusivo</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Users className="h-5 w-5 text-[#C8A27C]" strokeWidth={1.5} />
              <span className="text-[10px] text-gray-400 font-semibold tracking-wide text-center">Grupos Limitados<br />(Até 12 viajantes)</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Calendar className="h-5 w-5 text-[#C8A27C]" strokeWidth={1.5} />
              <span className="text-[10px] text-gray-400 font-semibold tracking-wide text-center">Saídas Programadas</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Star className="h-5 w-5 text-[#C8A27C]" strokeWidth={1.5} />
              <span className="text-[10px] text-gray-400 font-semibold tracking-wide text-center">Curadoria Premium</span>
            </div>
          </div>
        </div>
      </section>

      {/* Nossas Jornadas */}
      <section id="jornadas" className="py-20 px-4 md:px-8" style={{ background: '#1A0F14' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-3">
            <span className="text-xs uppercase tracking-widest text-[#C8A27C] font-bold">NOSSAS JORNADAS</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-light text-center text-[#F3E8DC] mb-2">
            Cada grupo possui uma personalidade.
          </h2>
          <p className="text-sm text-gray-400 text-center mb-12">Escolha aquela que combina com a história que você deseja viver.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            {JORNADAS.map((j) => (
              <div key={j.id} className="flex flex-col rounded-2xl overflow-hidden border border-[#3A232E] hover:border-[#C8A27C]/40 transition-all group" style={{ background: '#2A161D' }}>
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <Image src={j.image} alt={j.title} fill unoptimized className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className={`${j.badgeColor} text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full`}>
                      {j.badge}
                    </span>
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-1 gap-2">
                  <h3 className="font-heading text-base font-semibold text-[#F3E8DC] leading-tight">{j.title}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400">
                    <Clock className="h-3 w-3 text-[#C8A27C]" />
                    <span>{j.duration}</span>
                    <span className="text-gray-600">•</span>
                    <MapPin className="h-3 w-3 text-[#C8A27C]" />
                    <span>{j.destinations}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-relaxed flex-1">{j.desc}</p>

                  <div className="mt-2 pt-3 border-t border-[#3A232E]">
                    {j.price_from && (
                      <div className="mb-2">
                        <span className="text-[9px] text-gray-500 block">{j.label_price}</span>
                        <span className="text-sm font-bold text-[#C8A27C] font-heading">R$ {j.price_from.toLocaleString('pt-BR')}</span>
                      </div>
                    )}
                    {j.price_libre && (
                      <div className="mb-2">
                        <span className="text-[9px] text-gray-500 block">Libero</span>
                        <span className="text-sm font-bold text-[#C8A27C] font-heading">R$ {j.price_libre.toLocaleString('pt-BR')}</span>
                      </div>
                    )}
                    <Link href={`/coreia-do-sul/jornadas/${j.slug}`} className="w-full flex items-center justify-center gap-1.5 bg-[#C8A27C] hover:bg-[#B8906C] text-[#1A0F14] text-[9px] font-bold py-2.5 px-4 rounded-lg transition-all uppercase tracking-wider">
                      CONHECER JORNADA
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Experiências Exclusivas */}
      <section className="py-16 px-4 md:px-8 border-t border-[#3A232E]" style={{ background: '#1A0F14' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-2">
            <span className="text-xs uppercase tracking-widest text-[#C8A27C] font-bold">EXPERIÊNCIAS EXCLUSIVAS</span>
          </div>
          <h2 className="font-heading text-3xl font-light text-[#F3E8DC] text-center mb-1">Muito além dos pontos turísticos.</h2>
          <p className="text-sm text-gray-400 text-center mb-10"></p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {EXPERIENCIAS.map((exp, i) => {
              const Icon = exp.icon;
              return (
                <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[#3A232E] hover:border-[#C8A27C]/50 transition-all text-center group" style={{ background: '#2A161D' }}>
                  <div className="p-2 rounded-lg bg-[#C8A27C]/10 group-hover:bg-[#C8A27C]/20 transition-colors">
                    <Icon className="h-5 w-5 text-[#C8A27C]" strokeWidth={1.5} />
                  </div>
                  <span className="text-[10px] text-gray-300 font-medium leading-tight text-center">{exp.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Destinos */}
      <section className="py-16 px-4 md:px-8 border-t border-[#3A232E]" style={{ background: '#1A0F14' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-2">
            <span className="text-xs uppercase tracking-widest text-[#C8A27C] font-bold">DESTINOS</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {DESTINOS.map((dest) => (
              <div key={dest.city} className="flex flex-col gap-3">
                <div className="relative aspect-[3/2] rounded-xl overflow-hidden">
                  <Image src={dest.image} alt={dest.city} fill unoptimized className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  {dest.featured && (
                    <div className="absolute top-2 left-2">
                      <span className="text-[8px] bg-[#C8A27C] text-[#1A0F14] font-bold px-2 py-0.5 rounded uppercase">Exclusivo Always Destination</span>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#F3E8DC] tracking-wider">{dest.city}</h3>
                  {dest.subtitle && <p className="text-[10px] text-[#C8A27C] mt-0.5">{dest.subtitle}</p>}
                  <ul className="mt-2 flex flex-col gap-1">
                    {dest.items.map((item, i) => (
                      <li key={i} className="text-[10px] text-gray-400 flex items-start gap-1.5">
                        <span className="text-[#C8A27C] mt-0.5">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* O que está incluso + Comparação */}
      <section className="py-16 px-4 md:px-8 border-t border-[#3A232E]" style={{ background: '#1A0F14' }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Incluso */}
          <div className="rounded-2xl border border-[#3A232E] p-6" style={{ background: '#2A161D' }}>
            <h3 className="text-sm font-bold text-[#F3E8DC] uppercase tracking-wider mb-5">O QUE ESTÁ INCLUSO</h3>
            <p className="text-xs text-gray-400 mb-4">Todos os itens incluídos em todos os detalhes das nossas jornadas:</p>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
              {INCLUSO.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#C8A27C] mt-0.5 shrink-0" />
                  <span className="text-[10px] text-gray-300">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-[#3A232E]">
              <span className="text-[10px] text-gray-500">*Sujeito a confirmação das saídas</span>
            </div>
            <div className="mt-3">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2">Suporte durante a viagem:</h4>
              <div className="flex flex-col gap-1">
                {NAO_INCLUSO.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-[#C8A27C] text-xs mt-0">→</span>
                    <span className="text-[10px] text-gray-400">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Comparação */}
          <div className="rounded-2xl border border-[#3A232E] p-6" style={{ background: '#2A161D' }}>
            <h3 className="text-sm font-bold text-[#F3E8DC] uppercase tracking-wider mb-5">COMPARAÇÃO DOS PACOTES</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-[#3A232E]">
                    <th className="text-left text-gray-500 font-semibold py-2 pr-3 uppercase">PACOTES</th>
                    <th className="text-center text-gray-500 font-semibold py-2 pr-3 uppercase">DIAS</th>
                    <th className="text-left text-gray-500 font-semibold py-2 pr-3 uppercase">DESTINOS</th>
                    <th className="text-left text-gray-500 font-semibold py-2 pr-3 uppercase">PERFIL</th>
                    <th className="text-right text-gray-500 font-semibold py-2 uppercase">VALOR INICIAL</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARATIVO.map((row, i) => (
                    <tr key={i} className="border-b border-[#3A232E]/50 hover:bg-[#3A232E]/30 transition-colors">
                      <td className="py-2.5 pr-3 text-[#F3E8DC] font-medium">{row.jornada}</td>
                      <td className="py-2.5 pr-3 text-center text-gray-400">{row.dias}</td>
                      <td className="py-2.5 pr-3 text-gray-400">{row.destinos}</td>
                      <td className="py-2.5 pr-3 text-gray-400">{row.perfil}</td>
                      <td className="py-2.5 text-right text-[#C8A27C] font-bold">R$ {row.valor.toLocaleString('pt-BR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="py-16 px-4 md:px-8 border-t border-[#3A232E]" style={{ background: '#1A0F14' }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#C8A27C] font-bold">COMO FUNCIONA</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mt-8">
              {COMO_FUNCIONA.map((step, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-[#C8A27C] font-heading">{step.num}</span>
                  <span className="text-xs text-gray-300 leading-relaxed">{step.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#3A232E] p-8" style={{ background: '#2A161D' }}>
            <span className="text-xs uppercase tracking-widest text-[#C8A27C] font-bold">SUA PRÓXIMA GRANDE HISTÓRIA<br />COMEÇA NA COREIA.</span>
            <p className="text-xs text-gray-400 mt-3 leading-relaxed">
              Solicite um planejamento personalizado e deixe nossa equipe Maeum Global preparar o roteiro criado especialmente para você.
            </p>
            <div className="flex flex-col gap-3 mt-6">
              <Link href="/contato" className="flex items-center justify-center gap-2 bg-[#C8A27C] hover:bg-[#B8906C] text-[#1A0F14] font-bold text-xs py-3.5 px-6 rounded-xl transition-all uppercase tracking-wider">
                SOLICITAR PLANEJAMENTO
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/contato" className="flex items-center justify-center gap-2 bg-transparent border border-[#3A232E] text-gray-300 hover:border-[#C8A27C] font-bold text-xs py-3.5 px-6 rounded-xl transition-all uppercase tracking-wider">
                FALAR COM UM ESPECIALISTA
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom features bar */}
      <section className="border-t border-[#3A232E] py-5 px-8" style={{ background: '#2A161D' }}>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-[10px] text-gray-400">
          <div className="flex items-center gap-2">
            <span className="text-[#C8A27C]">●</span>
            Atendimento em português
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#C8A27C]">●</span>
            Suporte antes e durante a viagem
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#C8A27C]">●</span>
            Grupos exclusivos e limitados
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#C8A27C]">●</span>
            Curadoria Maeum Global
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
