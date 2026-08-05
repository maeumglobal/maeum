'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight, Check, MapPin, Users, Calendar, Award, MessageSquare, Headphones, FileText, CalendarCheck, Crown, Clock, MessageCircle, HeartHandshake, Plane
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';

const JORNADAS = [
  {
    tag: 'GRUPO FUNDADOR',
    tagColor: 'bg-[#8A3324]',
    title: 'Founding ARMY Edition',
    days: '14 dias',
    route: 'Seoul + Busan',
    exclusive: 'Grupo Exclusivo',
    desc: 'Uma jornada criada para fãs de K-Pop que desejam viver a Coreia através da música, da cultura e das conexões que marcaram a história do BTS.',
    price: 'R$ 26.500',
    pricePrefix: 'A partir de',
    image: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?q=80&w=400'
  },
  {
    tag: 'PRIMAVERA',
    tagColor: 'bg-[#B85D29]',
    title: 'Bom Sarang',
    days: '15 dias',
    route: 'Seoul + Busan',
    desc: 'Uma viagem inspirada na delicadeza da primavera coreana. Palácios históricos, cerimônias do chá, jardins floridos, gastronomia e momentos para desacelerar e viver cada detalhe.',
    price: 'R$ 29.700',
    pricePrefix: 'A partir de',
    image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?q=80&w=400'
  },
  {
    tag: 'VERÃO',
    tagColor: 'bg-[#B85D29]',
    title: 'Caravana de Verão',
    days: '10 dias',
    route: 'Seoul + Busan',
    desc: 'Dias ensolarados, praias de Busan, piqueniques no Rio Han, cafés escondidos e uma Coreia vibrante durante a estação mais animada do ano.',
    price: '',
    pricePrefix: '',
    dualPrice: true,
    priceLiberty: 'R$ 29.000',
    pricePrestige: 'R$ 34.000',
    image: 'https://images.unsplash.com/photo-1534270804883-8b1b5e7f2e2b?q=80&w=400'
  },
  {
    tag: 'COMPLETO',
    tagColor: 'bg-[#6B2727]',
    title: 'Always Destination',
    days: '15 dias',
    route: 'Seoul + Busan + Daegu',
    desc: 'Nosso roteiro mais completo. Perfeito para quem deseja conhecer diferentes regiões da Coreia através de experiências cuidadosamente selecionadas.',
    price: 'R$ 39.000',
    pricePrefix: 'A partir de',
    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=400'
  },
  {
    tag: 'JEJU PREMIUM',
    tagColor: 'bg-[#4A1A1A]',
    title: 'The Horizon of Seven',
    days: '15 dias',
    route: 'Seoul + Busan + Jeju',
    desc: 'Paisagens vulcânicas, praias, campos de chá, hospedagens exclusivas e experiências únicas. Uma viagem desenhada para quem busca o extraordinário.',
    price: 'R$ 42.000',
    pricePrefix: 'A partir de',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=400'
  }
];

const EXPERIENCES = [
  { title: 'Aula de culinária coreana', image: 'https://images.unsplash.com/photo-1580651315530-69c8e0026377?q=80&w=300' },
  { title: 'Oficina de Cerâmica', image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=300' },
  { title: 'Hanbok Premium', image: 'https://images.unsplash.com/photo-1566837945700-30057527ade0?q=80&w=300' },
  { title: 'Aula de dança K-Pop', image: 'https://images.unsplash.com/photo-1547153760-18fc86324498?q=80&w=300' },
  { title: 'Ensaio Fotográfico', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=300' },
  { title: 'Trem Bala KTX', image: 'https://images.unsplash.com/photo-1516246471374-9cbfb9c66e2c?q=80&w=300' },
  { title: 'Cruzeiro no Rio Han', image: 'https://images.unsplash.com/photo-1578489758854-f134a358f08b?q=80&w=300' },
  { title: 'Spa Coreano', image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=300' },
  { title: 'Cerimônia do Chá', image: 'https://images.unsplash.com/photo-1514361892635-6b07e31e75f9?q=80&w=300' },
  { title: 'Banho em Floresta', image: 'https://images.unsplash.com/photo-1425913397330-cf8af2ff40a1?q=80&w=300' },
  { title: 'Experiência K-Beauty\n(parceria Cheotnun)', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=300' },
  { title: 'Welcome Gift', image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=300' }
];

const INCLUDED = [
  'Passagem aérea internacional *',
  'Seguro viagem',
  'Hospedagem selecionada',
  'Trem Bala KTX',
  'Coordenador Maeum Global',
  'Guia em português',
  'Reunião Pré-Embarque',
  'Planejamento personalizado',
  'Chip de internet',
  'Welcome Kit exclusivo',
  'Suporte durante toda a viagem',
  'Atendimento em português',
  'Grupo exclusivo e limitado'
];

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col min-h-screen bg-[#0F0A08] text-[#EFEBE4] font-sans selection:bg-[#C8A27C] selection:text-[#0F0A08]">
      <Header />

      {/* 1. Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden border-b border-[#3A232E]/30">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/atendimento-especializado-viagem-coreia-do-sul-maeum-global-v2.webp"
            alt="Coreia do Sul Maeum"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F0A08] via-[#0F0A08]/70 to-transparent w-full sm:w-2/3" />
        </div>

        <div className="relative z-10 px-6 sm:px-12 max-w-7xl mx-auto w-full flex flex-col items-start gap-5 pt-24">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold">
            MAEUM GLOBAL
          </span>
          
          <h1 className="font-heading text-5xl sm:text-6xl md:text-[80px] font-light tracking-wide leading-[1.1] text-white max-w-3xl">
            Descubra uma <br />
            Coreia que <span className="italic text-[#C8A27C]">poucos</span><br/>
            brasileiros conhecem.
          </h1>
          
          <p className="text-[13px] sm:text-sm text-gray-300 max-w-xl font-light text-left leading-relaxed mt-2 opacity-90">
            Cada roteiro da Maeum Global é desenvolvido para quem busca experiências autênticas, grupos exclusivos e uma imersão completa na cultura coreana.
          </p>
          
          <div className="flex flex-col gap-1 mt-2 mb-2">
            <span className="font-semibold text-white text-[13px] sm:text-sm">Não vendemos excursões.</span>
            <span className="font-semibold text-white text-[13px] sm:text-sm">Criamos jornadas.</span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <button className="flex items-center justify-center gap-3 bg-[#C8A27C] hover:bg-[#B8906C] text-[#0F0A08] font-bold text-[11px] py-4 px-8 rounded-none transition-all group uppercase tracking-widest">
              CONHECER JORNADAS
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="flex items-center justify-center gap-3 bg-transparent border border-[#C8A27C] text-[#C8A27C] hover:bg-[#C8A27C]/10 font-bold text-[11px] py-4 px-8 rounded-none transition-all uppercase tracking-widest">
              <CalendarCheck className="w-4 h-4" />
              SOLICITAR PLANEJAMENTO
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-10 mt-16 pt-8 border-t border-white/10 w-full max-w-2xl opacity-70">
            <div className="flex flex-col items-center gap-3">
              <MapPin className="h-5 w-5 text-[#C8A27C]" strokeWidth={1} />
              <span className="text-[9px] text-gray-300 font-medium tracking-widest uppercase text-center">Destino<br/>Exclusivo</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Users className="h-5 w-5 text-[#C8A27C]" strokeWidth={1} />
              <span className="text-[9px] text-gray-300 font-medium tracking-widest uppercase text-center">Grupos Limitados<br/>(Até 12 viajantes)</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Calendar className="h-5 w-5 text-[#C8A27C]" strokeWidth={1} />
              <span className="text-[9px] text-gray-300 font-medium tracking-widest uppercase text-center">Saídas<br/>Programadas</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Award className="h-5 w-5 text-[#C8A27C]" strokeWidth={1} />
              <span className="text-[9px] text-gray-300 font-medium tracking-widest uppercase text-center">Curadoria<br/>Premium</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. NOSSAS JORNADAS */}
      <section className="py-24 px-6 sm:px-12 max-w-[1400px] mx-auto w-full">
        <div className="text-center mb-16">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold block mb-3">
            NOSSAS JORNADAS
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-light text-white">
            Cada grupo possui uma personalidade.
          </h2>
          <p className="text-sm text-gray-400 mt-3 font-light">
            Escolha aquela que combina com a história que você deseja viver.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {JORNADAS.map((j) => (
            <div key={j.title} className="bg-[#261514] border border-[#3D2620] flex flex-col overflow-hidden group hover:border-[#C8A27C]/40 transition-colors">
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <Image src={j.image} alt={j.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className={`absolute top-3 left-3 ${j.tagColor} text-white text-[8px] font-bold tracking-widest px-2.5 py-1 rounded-sm uppercase shadow-sm`}>
                  {j.tag}
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="font-heading text-xl font-medium text-white mb-3 leading-tight">{j.title}</h3>
                <div className="flex flex-col gap-1.5 mb-4">
                  <div className="flex items-center gap-3 text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                    <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-[#C8A27C]" /> {j.days}</span>
                    <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-[#C8A27C]" /> {j.route}</span>
                  </div>
                  {j.exclusive && (
                    <span className="flex items-center gap-1.5 text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-1">
                      <Crown className="w-3 h-3 text-[#C8A27C]" /> {j.exclusive}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed font-light mb-8 flex-1">
                  {j.desc}
                </p>
                <div className="mt-auto">
                  {j.dualPrice ? (
                    <div className="flex justify-between items-end mb-4 gap-2">
                      <div>
                        <span className="block text-[9px] text-gray-500 uppercase tracking-widest mb-0.5">Liberty</span>
                        <span className="font-heading text-lg text-white font-medium">{j.priceLiberty}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[9px] text-gray-500 uppercase tracking-widest mb-0.5">Prestige</span>
                        <span className="font-heading text-lg text-white font-medium">{j.pricePrestige}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <span className="block text-[9px] text-gray-500 uppercase tracking-widest mb-0.5">{j.pricePrefix}</span>
                      <span className="font-heading text-2xl text-white font-medium">{j.price}</span>
                    </div>
                  )}
                  <button className="w-full bg-[#C8A27C] hover:bg-[#B8906C] text-[#0F0A08] transition-colors py-3 text-[9px] font-bold uppercase tracking-widest rounded-sm">
                    CONHECER JORNADA
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. EXPERIÊNCIAS EXCLUSIVAS */}
      <section className="py-20 px-6 sm:px-12 max-w-[1400px] mx-auto w-full">
        <div className="text-center mb-12">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold block mb-3">
            EXPERIÊNCIAS EXCLUSIVAS
          </span>
          <h2 className="font-heading text-3xl font-light text-white">
            Muito além dos pontos turísticos.
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {EXPERIENCES.map((exp, idx) => (
            <div key={idx} className="relative aspect-square border border-[#3D2620] rounded-sm overflow-hidden group cursor-pointer">
              <Image src={exp.image} alt={exp.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F0A08] via-[#0F0A08]/40 to-transparent" />
              <div className="absolute inset-0 p-4 flex items-end justify-center text-center">
                <span className="text-[10px] sm:text-[11px] font-semibold text-white tracking-wide uppercase leading-tight whitespace-pre-line group-hover:text-[#C8A27C] transition-colors duration-300">
                  {exp.title}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. DESTINOS */}
      <section className="py-20 px-6 sm:px-12 max-w-[1400px] mx-auto w-full border-t border-[#3D2620]">
        <div className="text-center mb-12">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold block mb-3">
            DESTINOS
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Seoul */}
          <div className="relative h-[380px] border border-[#3D2620] rounded-sm overflow-hidden group">
            <Image src="https://images.unsplash.com/photo-1538669715515-5e3819766a9e?q=80&w=600" alt="Seoul" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-[#0F0A08]/60 group-hover:bg-[#0F0A08]/40 transition-colors" />
            <div className="absolute inset-0 p-8 flex flex-col justify-start gap-4">
              <h3 className="font-heading text-2xl text-white tracking-wider">SEOUL</h3>
              <ul className="text-[10px] text-gray-300 space-y-1.5 font-light tracking-wide uppercase">
                <li>• Palácios Históricos</li>
                <li>• Gangnam</li>
                <li>• Hongdae</li>
                <li>• Bukchon Hanok Village</li>
                <li>• Myeongdong</li>
                <li>• Rio Han</li>
                <li>• Mercados</li>
                <li>• K-Beauty</li>
              </ul>
            </div>
          </div>
          
          {/* Busan */}
          <div className="relative h-[380px] border border-[#3D2620] rounded-sm overflow-hidden group">
            <Image src="https://images.unsplash.com/photo-1578489758854-f134a358f08b?q=80&w=600" alt="Busan" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-[#0F0A08]/60 group-hover:bg-[#0F0A08]/40 transition-colors" />
            <div className="absolute inset-0 p-8 flex flex-col justify-start gap-4">
              <h3 className="font-heading text-2xl text-white tracking-wider">BUSAN</h3>
              <ul className="text-[10px] text-gray-300 space-y-1.5 font-light tracking-wide uppercase">
                <li>• Praias icônicas</li>
                <li>• Sky Capsule</li>
                <li>• Gamcheon Village</li>
                <li>• Mercados</li>
                <li>• Templos</li>
                <li>• Vida costeira</li>
              </ul>
            </div>
          </div>

          {/* Daegu */}
          <div className="relative h-[380px] border border-[#3D2620] rounded-sm overflow-hidden group">
            <Image src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=600" alt="Daegu" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-[#0F0A08]/60 group-hover:bg-[#0F0A08]/40 transition-colors" />
            <div className="absolute inset-0 p-8 flex flex-col justify-start gap-3">
              <h3 className="font-heading text-2xl text-white tracking-wider">DAEGU</h3>
              <span className="text-[8px] bg-[#6B1F1F] text-white uppercase tracking-widest px-2 py-0.5 rounded-sm self-start font-bold">Exclusivo Always Destination</span>
              <p className="text-[11px] text-gray-300 font-light leading-relaxed mt-2">
                Cidade de tradição, cafés especiais e uma atmosfera tranquila que surpreende.
              </p>
            </div>
          </div>

          {/* Jeju */}
          <div className="relative h-[380px] border border-[#3D2620] rounded-sm overflow-hidden group">
            <Image src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600" alt="Jeju" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-[#0F0A08]/60 group-hover:bg-[#0F0A08]/40 transition-colors" />
            <div className="absolute inset-0 p-8 flex flex-col justify-start gap-3">
              <h3 className="font-heading text-2xl text-white tracking-wider">JEJU</h3>
              <span className="text-[8px] bg-[#6B1F1F] text-white uppercase tracking-widest px-2 py-0.5 rounded-sm self-start font-bold">Exclusivo Horizon of Seven</span>
              <ul className="text-[10px] text-gray-300 space-y-1.5 font-light tracking-wide uppercase mt-2">
                <li>• Paisagens vulcânicas</li>
                <li>• Patrimônio Natural da UNESCO</li>
                <li>• Campos de chá</li>
                <li>• Praias cristalinas</li>
                <li>• Cavalgadas</li>
                <li>• Pôr do sol inesquecível</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5. O QUE ESTÁ INCLUSO & COMPARAÇÃO */}
      <section className="py-20 px-6 sm:px-12 max-w-[1400px] mx-auto w-full">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Incluso Box */}
          <div className="lg:w-[35%] relative border border-[#3D2620] rounded-sm overflow-hidden">
            <Image src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=800" alt="Incluso" fill className="object-cover" />
            <div className="absolute inset-0 bg-[#120D0A]/95" />
            <div className="relative z-10 p-8 sm:p-10 h-full flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold block mb-3">
                O QUE ESTÁ INCLUSO
              </span>
              <h2 className="font-heading text-2xl font-light text-white mb-8 leading-tight">
                Pensamos em todos os detalhes para você viver o melhor da Coreia.
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 mt-auto">
                {INCLUDED.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="bg-[#C8A27C] rounded-full p-0.5 mt-0.5 shrink-0 flex items-center justify-center">
                      <Check className="h-2 w-2 text-[#0F0A08]" strokeWidth={4} />
                    </div>
                    <span className="text-[10px] text-gray-300 font-light leading-snug">{item}</span>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-gray-500 mt-6 italic">* Conforme a categoria escolhida</p>
            </div>
          </div>

          {/* Tabela de Comparação */}
          <div className="lg:w-[65%] border border-[#3D2620] bg-[#1A1211] rounded-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[#3D2620] bg-[#2A1616]">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold block text-center">
                COMPARAÇÃO DOS PACOTES
              </span>
            </div>
            <div className="overflow-x-auto p-4 sm:p-6">
              <table className="w-full min-w-[600px] text-left">
                <thead>
                  <tr className="border-b border-[#3D2620]">
                    <th className="py-4 px-4 text-[9px] font-semibold text-[#C8A27C] uppercase tracking-widest w-[25%]">Pacote</th>
                    <th className="py-4 px-4 text-[9px] font-semibold text-[#C8A27C] uppercase tracking-widest text-center">Dias</th>
                    <th className="py-4 px-4 text-[9px] font-semibold text-[#C8A27C] uppercase tracking-widest text-center">Destinos</th>
                    <th className="py-4 px-4 text-[9px] font-semibold text-[#C8A27C] uppercase tracking-widest w-[30%]">Perfil</th>
                    <th className="py-4 px-4 text-[9px] font-semibold text-[#C8A27C] uppercase tracking-widest text-right">Valor Inicial</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3D2620]/50">
                  <tr className="bg-[#120D0A] hover:bg-[#2A1616] transition-colors">
                    <td className="py-4 px-4 text-[11px] text-white font-medium">Founding ARMY Edition</td>
                    <td className="py-4 px-4 text-[10px] text-gray-400 text-center">14</td>
                    <td className="py-4 px-4 text-[10px] text-gray-400 text-center">Seoul + Busan</td>
                    <td className="py-4 px-4 text-[10px] text-gray-400">K-Pop / Fãs</td>
                    <td className="py-4 px-4 text-[11px] text-white text-right font-medium">R$ 26.500</td>
                  </tr>
                  <tr className="bg-[#1A1211] hover:bg-[#2A1616] transition-colors">
                    <td className="py-4 px-4 text-[11px] text-white font-medium">Bom Sarang</td>
                    <td className="py-4 px-4 text-[10px] text-gray-400 text-center">15</td>
                    <td className="py-4 px-4 text-[10px] text-gray-400 text-center">Seoul + Busan</td>
                    <td className="py-4 px-4 text-[10px] text-gray-400">Primavera / Flores de Cerejeira</td>
                    <td className="py-4 px-4 text-[11px] text-white text-right font-medium">R$ 29.700</td>
                  </tr>
                  <tr className="bg-[#120D0A] hover:bg-[#2A1616] transition-colors">
                    <td className="py-4 px-4 text-[11px] text-white font-medium">Caravana de Verão Liberty</td>
                    <td className="py-4 px-4 text-[10px] text-gray-400 text-center">10</td>
                    <td className="py-4 px-4 text-[10px] text-gray-400 text-center">Seoul + Busan</td>
                    <td className="py-4 px-4 text-[10px] text-gray-400">Verão / Leve e Econômico</td>
                    <td className="py-4 px-4 text-[11px] text-white text-right font-medium">R$ 29.000</td>
                  </tr>
                  <tr className="bg-[#1A1211] hover:bg-[#2A1616] transition-colors">
                    <td className="py-4 px-4 text-[11px] text-white font-medium">Caravana de Verão Prestige</td>
                    <td className="py-4 px-4 text-[10px] text-gray-400 text-center">10</td>
                    <td className="py-4 px-4 text-[10px] text-gray-400 text-center">Seoul + Busan</td>
                    <td className="py-4 px-4 text-[10px] text-gray-400">Verão / Premium</td>
                    <td className="py-4 px-4 text-[11px] text-white text-right font-medium">R$ 34.000</td>
                  </tr>
                  <tr className="bg-[#120D0A] hover:bg-[#2A1616] transition-colors">
                    <td className="py-4 px-4 text-[11px] text-white font-medium">Always Destination</td>
                    <td className="py-4 px-4 text-[10px] text-gray-400 text-center">15</td>
                    <td className="py-4 px-4 text-[10px] text-gray-400 text-center">Seoul + Busan + Daegu</td>
                    <td className="py-4 px-4 text-[10px] text-gray-400">Imersão Completa</td>
                    <td className="py-4 px-4 text-[11px] text-white text-right font-medium">R$ 39.000</td>
                  </tr>
                  <tr className="bg-[#1A1211] hover:bg-[#2A1616] transition-colors border-b-0">
                    <td className="py-4 px-4 text-[11px] text-white font-medium">The Horizon of Seven</td>
                    <td className="py-4 px-4 text-[10px] text-gray-400 text-center">15</td>
                    <td className="py-4 px-4 text-[10px] text-gray-400 text-center">Seoul + Busan + Jeju</td>
                    <td className="py-4 px-4 text-[10px] text-gray-400">Luxo / Experiência Premium</td>
                    <td className="py-4 px-4 text-[11px] text-white text-right font-medium">R$ 42.000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 6. COMO FUNCIONA E CTA */}
      <section className="py-24 px-6 sm:px-12 max-w-[1400px] mx-auto w-full border-t border-[#3D2620]">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          
          {/* Como Funciona Timeline */}
          <div className="lg:w-1/2 w-full">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold block mb-12 text-center lg:text-left">
              COMO FUNCIONA
            </span>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 sm:gap-2">
              {/* Passo 01 */}
              <div className="flex flex-col items-center text-center gap-3 relative w-full sm:w-[15%]">
                <FileText className="w-6 h-6 text-[#C8A27C] stroke-1" />
                <span className="text-[10px] font-bold text-[#C8A27C]">01</span>
                <p className="text-[9px] text-gray-400 font-light leading-tight">Solicite seu<br/>planejamento</p>
                <div className="hidden sm:block absolute top-[40%] -right-[50%] w-[100%]">
                  <ArrowRight className="w-4 h-4 text-[#C8A27C]/50 mx-auto" />
                </div>
              </div>
              {/* Passo 02 */}
              <div className="flex flex-col items-center text-center gap-3 relative w-full sm:w-[15%]">
                <MessageCircle className="w-6 h-6 text-[#C8A27C] stroke-1" />
                <span className="text-[10px] font-bold text-[#C8A27C]">02</span>
                <p className="text-[9px] text-gray-400 font-light leading-tight">Conversamos<br/>sobre seu perfil</p>
                <div className="hidden sm:block absolute top-[40%] -right-[50%] w-[100%]">
                  <ArrowRight className="w-4 h-4 text-[#C8A27C]/50 mx-auto" />
                </div>
              </div>
              {/* Passo 03 */}
              <div className="flex flex-col items-center text-center gap-3 relative w-full sm:w-[15%]">
                <MapPin className="w-6 h-6 text-[#C8A27C] stroke-1" />
                <span className="text-[10px] font-bold text-[#C8A27C]">03</span>
                <p className="text-[9px] text-gray-400 font-light leading-tight">Escolhemos o<br/>roteiro ideal</p>
                <div className="hidden sm:block absolute top-[40%] -right-[50%] w-[100%]">
                  <ArrowRight className="w-4 h-4 text-[#C8A27C]/50 mx-auto" />
                </div>
              </div>
              {/* Passo 04 */}
              <div className="flex flex-col items-center text-center gap-3 relative w-full sm:w-[15%]">
                <Calendar className="w-6 h-6 text-[#C8A27C] stroke-1" />
                <span className="text-[10px] font-bold text-[#C8A27C]">04</span>
                <p className="text-[9px] text-gray-400 font-light leading-tight">Organizamos<br/>toda a viagem</p>
                <div className="hidden sm:block absolute top-[40%] -right-[50%] w-[100%]">
                  <ArrowRight className="w-4 h-4 text-[#C8A27C]/50 mx-auto" />
                </div>
              </div>
              {/* Passo 05 */}
              <div className="flex flex-col items-center text-center gap-3 relative w-full sm:w-[15%]">
                <Users className="w-6 h-6 text-[#C8A27C] stroke-1" />
                <span className="text-[10px] font-bold text-[#C8A27C]">05</span>
                <p className="text-[9px] text-gray-400 font-light leading-tight">Reunião<br/>pré-embarque</p>
                <div className="hidden sm:block absolute top-[40%] -right-[50%] w-[100%]">
                  <ArrowRight className="w-4 h-4 text-[#C8A27C]/50 mx-auto" />
                </div>
              </div>
              {/* Passo 06 */}
              <div className="flex flex-col items-center text-center gap-3 w-full sm:w-[15%]">
                <Plane className="w-6 h-6 text-[#C8A27C] stroke-1" />
                <span className="text-[10px] font-bold text-[#C8A27C]">06</span>
                <p className="text-[9px] text-gray-400 font-light leading-tight">Embarque<br/>acompanhado<br/>pela Maeum</p>
              </div>
            </div>
          </div>

          {/* CTA Box */}
          <div className="lg:w-1/2 w-full relative bg-[#2A1112] border border-[#3D2620] rounded-sm overflow-hidden p-10 sm:p-14">
            <div className="absolute right-0 bottom-0 opacity-30 w-1/2 h-full">
              <Image src="https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?q=80&w=600" alt="Tradition" fill className="object-cover object-right" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#2A1112] to-transparent" />
            </div>
            
            <div className="relative z-10 max-w-sm">
              <h2 className="font-heading text-3xl font-light text-[#C8A27C] leading-tight mb-4">
                SUA PRÓXIMA GRANDE HISTÓRIA COMEÇA NA COREIA.
              </h2>
              <p className="text-[11px] text-gray-400 font-light mb-8">
                Solicite um planejamento personalizado e descubra qual experiência Maeum Global foi criada para você.
              </p>
              <button className="w-full sm:w-auto bg-[#C8A27C] hover:bg-[#B8906C] text-[#0F0A08] font-bold text-[10px] py-4 px-8 rounded-none transition-all uppercase tracking-widest mb-4">
                SOLICITAR PLANEJAMENTO
              </button>
              <button className="flex items-center gap-2 text-[10px] text-[#C8A27C] hover:text-[#B8906C] uppercase tracking-widest transition-colors font-semibold">
                <MessageCircle className="w-3.5 h-3.5" />
                FALAR COM UM ESPECIALISTA
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 7. BOTTOM BAR ICONS */}
      <section className="py-10 px-6 border-t border-[#3D2620] bg-[#0A0705]">
        <div className="max-w-[1400px] mx-auto flex flex-wrap justify-center sm:justify-between items-center gap-6 opacity-70">
          <div className="flex items-center gap-3">
            <Headphones className="w-4 h-4 text-[#C8A27C]" strokeWidth={1.5} />
            <span className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">Atendimento em português</span>
          </div>
          <div className="flex items-center gap-3">
            <HeartHandshake className="w-4 h-4 text-[#C8A27C]" strokeWidth={1.5} />
            <span className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">Suporte antes e durante a viagem</span>
          </div>
          <div className="flex items-center gap-3">
            <Users className="w-4 h-4 text-[#C8A27C]" strokeWidth={1.5} />
            <span className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">Grupos exclusivos e limitados</span>
          </div>
          <div className="flex items-center gap-3">
            <Award className="w-4 h-4 text-[#C8A27C]" strokeWidth={1.5} />
            <span className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">Curadoria Maeum Global</span>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
