'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowRight, Search, MapPin, BookOpen, Utensils, 
  TreePine, ShoppingBag, Star, Users 
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const JORNADAS_RECENTES = [
  {
    tag: 'SEUL',
    date: '12 MAI, 2025',
    title: 'Primeiros passos em Seul',
    desc: 'Impressões, culturas e descobertas nos primeiros dias na capital coreana.',
    author: 'Juliana M.',
    role: 'Consultora de Viagens',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
    image: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?q=80&w=600&h=400&fit=crop'
  },
  {
    tag: 'BUKCHON HANOK',
    date: '08 MAI, 2025',
    title: 'Tradição que encanta',
    desc: 'Caminhando entre hanoks e vielas históricas no coração de Bukchon.',
    author: 'Larissa T.',
    role: 'Consultora de Viagens',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    image: 'https://images.unsplash.com/photo-1515091943-9d5c0ad20094?q=80&w=600&h=400&fit=crop'
  },
  {
    tag: 'BUSAN',
    date: '02 MAI, 2025',
    title: 'Brisa do mar e alma da cidade',
    desc: 'Do mar de Haeundae aos cafés de Gamcheon, Busan me surpreendeu.',
    author: 'Dayane R.',
    role: 'Consultora de Viagens',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    image: 'https://images.unsplash.com/photo-1588667590805-728b74f3ebda?q=80&w=600&h=400&fit=crop'
  },
  {
    tag: 'JEJU ISLAND',
    date: '28 ABR, 2025',
    title: 'Jeju: natureza que acolhe',
    desc: 'Paisagens vulcânicas, cachoeiras e o silêncio que renova a alma.',
    author: 'Caroline B.',
    role: 'Consultora de Viagens',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop',
    image: 'https://images.unsplash.com/photo-1522020297063-e5dcf4a54c9c?q=80&w=600&h=400&fit=crop'
  },
  {
    tag: 'GYEONGBOKGUNG',
    date: '24 ABR, 2025',
    title: 'Entre palácios e histórias',
    desc: 'Visitando Gyeongbokgung e revivendo séculos de história da Coreia.',
    author: 'Juliana M.',
    role: 'Consultora de Viagens',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
    image: 'https://images.unsplash.com/photo-1596706935706-95ff817d2bb9?q=80&w=600&h=400&fit=crop'
  },
  {
    tag: 'HONGDAE',
    date: '18 ABR, 2025',
    title: 'Arte, música e liberdade',
    desc: 'Hongdae é o lugar onde a juventude coreana pulsa com criatividade.',
    author: 'Larissa T.',
    role: 'Consultora de Viagens',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    image: 'https://images.unsplash.com/photo-1579738753235-51dc5d820468?q=80&w=600&h=400&fit=crop'
  },
  {
    tag: 'GANGNAM',
    date: '15 ABR, 2025',
    title: 'O lado moderno da Coreia',
    desc: 'Entre arranha-céus, tecnologia e cafés estilosos: bem-vindo a Gangnam.',
    author: 'Dayane R.',
    role: 'Consultora de Viagens',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    image: 'https://images.unsplash.com/photo-1521404176332-901b0669287c?q=80&w=600&h=400&fit=crop'
  },
  {
    tag: 'MERCADO GWANGJANG',
    date: '10 ABR, 2025',
    title: 'Sabores que contam histórias',
    desc: 'Explorando o mercado mais tradicional de Seul e seus sabores únicos.',
    author: 'Caroline B.',
    role: 'Consultora de Viagens',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop',
    image: 'https://images.unsplash.com/photo-1563242099-0e782be6c97a?q=80&w=600&h=400&fit=crop'
  },
];

const CATEGORIES = [
  { label: 'Seul', icon: MapPin },
  { label: 'Cultura', icon: BookOpen },
  { label: 'Gastronomia', icon: Utensils },
  { label: 'Natureza', icon: TreePine },
  { label: 'Compras', icon: ShoppingBag },
  { label: 'Experiências', icon: Star },
  { label: 'Vida Local', icon: Users },
];

export default function JornadasPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0F0A08] text-[#EFEBE4] font-sans selection:bg-[#C8A27C] selection:text-[#0F0A08]">
      <Header />

      {/* 1. Hero Section */}
      <section className="relative h-[85vh] min-h-[600px] flex flex-col justify-center overflow-hidden border-b border-[#3D2620]">
        <div className="absolute inset-0 z-0">
          <Image 
            src="https://images.unsplash.com/photo-1515091943-9d5c0ad20094?q=80&w=2000" 
            alt="Jornadas na Coreia" 
            fill 
            className="object-cover object-center brightness-75" 
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F0A08] via-[#0F0A08]/90 to-transparent w-full sm:w-2/3" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0F0A08]/20 to-[#0F0A08]" />
        </div>

        <div className="relative z-10 px-6 sm:px-12 max-w-7xl mx-auto w-full flex flex-col items-start gap-5 pt-20">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold">
            NOSSAS JORNADAS
          </span>
          <h1 className="font-heading text-5xl sm:text-6xl md:text-[70px] font-light tracking-wide leading-[1.1] text-white">
            Cada jornada <br />
            conta uma história.<br />
            <span className="italic text-[#C8A27C]">A nossa, é real.</span>
          </h1>
          <p className="text-[12px] sm:text-[13px] text-gray-300 max-w-[500px] font-light text-left leading-relaxed opacity-90 mt-2">
            Acompanhe relatos autênticos de quem vive a Coreia do Sul de verdade. Dicas, descobertas, cultura, sabores e momentos inesquecíveis registrados em cada passo das nossas experiências.
          </p>
          <div className="mt-4">
            <button className="flex items-center justify-center gap-3 bg-transparent border border-[#3D2620] hover:border-[#C8A27C] text-[#C8A27C] font-bold text-[10px] py-4 px-8 rounded-none transition-all group uppercase tracking-widest">
              COMPARTILHE SUA JORNADA
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* 2. Main Layout (Grid + Sidebar) */}
      <section className="py-16 px-6 sm:px-12 max-w-7xl mx-auto w-full">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Left Side - Grid */}
          <div className="flex-1 flex flex-col gap-8">
            <div className="flex items-center justify-center lg:justify-start">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-bold text-center lg:text-left w-full">
                JORNADAS RECENTES
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {JORNADAS_RECENTES.map((jornada, i) => (
                <div key={i} className="group bg-[#150E0C] border border-[#3D2620] rounded-sm overflow-hidden flex flex-col hover:border-[#C8A27C]/50 transition-colors cursor-pointer">
                  {/* Image Container */}
                  <div className="relative h-[220px] w-full overflow-hidden">
                    <Image 
                      src={jornada.image} 
                      alt={jornada.title} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform duration-700" 
                    />
                    <div className="absolute top-4 left-4 bg-[#0F0A08]/80 backdrop-blur text-white text-[9px] font-bold px-3 py-1.5 uppercase tracking-widest border border-[#3D2620]">
                      {jornada.tag}
                    </div>
                  </div>
                  
                  {/* Content Container */}
                  <div className="p-6 flex flex-col flex-1">
                    <span className="text-[10px] text-[#C8A27C] uppercase tracking-widest font-semibold mb-2">
                      {jornada.date}
                    </span>
                    <h3 className="text-xl font-heading text-white font-light leading-snug mb-3 group-hover:text-[#C8A27C] transition-colors">
                      {jornada.title}
                    </h3>
                    <p className="text-[12px] text-gray-400 font-light leading-relaxed mb-6 line-clamp-3">
                      {jornada.desc}
                    </p>
                    
                    {/* Footer Container */}
                    <div className="mt-auto pt-4 border-t border-[#3D2620] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#3D2620]">
                          <Image src={jornada.avatar} alt={jornada.author} fill className="object-cover" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] text-white font-semibold">{jornada.author}</span>
                          <span className="text-[9px] text-[#C8A27C]">{jornada.role}</span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-[#C8A27C] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-center mt-6">
              <button className="flex items-center justify-center gap-3 bg-transparent border border-[#3D2620] hover:border-[#C8A27C] text-[#C8A27C] font-bold text-[10px] py-4 px-8 rounded-none transition-all group uppercase tracking-widest">
                VER MAIS JORNADAS
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Right Side - Sidebar */}
          <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-10">
            
            {/* Search */}
            <div className="relative">
              <input 
                type="text" 
                placeholder="Buscar jornadas..." 
                className="w-full bg-[#150E0C] border border-[#3D2620] text-white text-[12px] px-5 py-4 placeholder:text-gray-500 focus:outline-none focus:border-[#C8A27C] transition-colors rounded-none"
              />
              <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            </div>

            {/* Categories */}
            <div className="flex flex-col gap-4">
              <h4 className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-bold">
                CATEGORIAS
              </h4>
              <ul className="flex flex-col gap-1">
                {CATEGORIES.map((cat, i) => {
                  const Icon = cat.icon;
                  return (
                    <li key={i}>
                      <Link href="#" className="flex items-center gap-3 py-2 text-[12px] text-gray-300 hover:text-[#C8A27C] transition-colors group">
                        <Icon className="w-4 h-4 text-[#3D2620] group-hover:text-[#C8A27C] transition-colors" />
                        {cat.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Newsletter */}
            <div className="flex flex-col gap-4 pt-4 border-t border-[#3D2620]">
              <h4 className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-bold">
                CONTEÚDOS EXCLUSIVOS
              </h4>
              <p className="text-[12px] text-gray-400 font-light">
                Receba novas jornadas, dicas e experiências direto no seu e-mail.
              </p>
              <form className="flex flex-col gap-3">
                <input 
                  type="email" 
                  placeholder="Seu melhor e-mail" 
                  className="w-full bg-[#150E0C] border border-[#3D2620] text-white text-[12px] px-4 py-3 placeholder:text-gray-500 focus:outline-none focus:border-[#C8A27C] transition-colors rounded-none"
                />
                <button 
                  type="button" 
                  className="w-full bg-[#C8A27C] hover:bg-[#B8906C] text-[#0F0A08] font-bold text-[10px] py-3.5 px-4 rounded-none transition-all uppercase tracking-widest"
                >
                  ASSINAR NEWSLETTER
                </button>
              </form>
              <p className="text-[9px] text-gray-500 mt-1">
                Respeitamos sua privacidade. Sem spam. Você pode sair quando quiser.
              </p>
            </div>

            {/* Featured Journey */}
            <div className="flex flex-col gap-4 pt-4 border-t border-[#3D2620]">
              <h4 className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-bold">
                JORNADA EM DESTAQUE
              </h4>
              <div className="group cursor-pointer">
                <div className="relative h-[160px] w-full overflow-hidden border border-[#3D2620] mb-4">
                  <Image 
                    src="https://images.unsplash.com/photo-1546874177-9e66487e671c?q=80&w=600&h=400&fit=crop" 
                    alt="Seul ao Entardecer" 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-700" 
                  />
                </div>
                <h5 className="text-white font-heading text-xl font-light mb-2 group-hover:text-[#C8A27C] transition-colors">
                  Seul ao Entardecer
                </h5>
                <p className="text-[12px] text-gray-400 font-light mb-3">
                  Um roteiro perfeito para encerrar o dia com beleza e paz.
                </p>
                <div className="flex items-center gap-2 text-[#C8A27C] text-[10px] font-bold uppercase tracking-widest">
                  LER JORNADA <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Bottom CTA Section */}
      <section className="relative py-24 px-6 sm:px-12 w-full border-t border-[#3D2620] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image 
            src="https://images.unsplash.com/photo-1601584989635-c337b51b3152?q=80&w=1600" 
            alt="Pessoas em Seul" 
            fill 
            className="object-cover object-center brightness-50" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0A08] to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-l from-[#0F0A08]/80 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-end gap-12">
          {/* Left space empty to show image focal point */}
          <div className="hidden lg:block lg:w-1/3"></div>

          {/* Right side content */}
          <div className="w-full lg:w-2/3 flex flex-col items-start lg:items-center text-left lg:text-center gap-6">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold">
              VIVA SUA PRÓPRIA JORNADA
            </span>
            <h2 className="font-heading text-4xl sm:text-5xl font-light text-white leading-[1.1]">
              Sua história na Coreia <br className="hidden md:block" />
              <span className="italic text-[#C8A27C]">também pode inspirar outros.</span>
            </h2>
            <p className="text-[13px] text-gray-300 font-light max-w-2xl leading-relaxed">
              Viaje com a Maeum Global e compartilhe sua jornada com o mundo. Vamos transformar sua experiência em memória, conexão e inspiração.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
              <button className="flex items-center justify-center bg-[#C8A27C] hover:bg-[#B8906C] text-[#0F0A08] font-bold text-[10px] py-4 px-8 rounded-none transition-all uppercase tracking-widest">
                QUERO VIVER ESSA EXPERIÊNCIA
              </button>
              <button className="flex items-center justify-center bg-transparent border border-[#3D2620] hover:border-[#C8A27C] text-[#C8A27C] font-bold text-[10px] py-4 px-8 rounded-none transition-all uppercase tracking-widest">
                FALE COM CONSULTORA
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Support Info Footer */}
      <section className="bg-[#150E0C] border-t border-b border-[#3D2620] py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-6 opacity-60">
          {[
            { label: 'EXPERIÊNCIAS AUTÊNTICAS', icon: Star },
            { label: 'ROTEIROS PERSONALIZADOS', icon: MapPin },
            { label: 'ATENDIMENTO HUMANO', icon: Users },
            { label: 'PARCEIROS NA COREIA', icon: TreePine },
            { label: 'SUPORTE COMPLETO', icon: Search },
            { label: 'SEGURANÇA E CONFIANÇA', icon: BookOpen }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-white">
              <item.icon className="h-5 w-5 text-[#C8A27C]" strokeWidth={1.5} />
              <span className="text-[9px] font-bold uppercase tracking-widest">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
