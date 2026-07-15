'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Play, Download, ArrowRight, Video, FileText, CheckCircle2, ChevronRight,
  MessageSquare, Globe, Compass, GraduationCap, Sparkles, Utensils, BookOpen,
  Calendar, MapPin, Tv
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/contexts/ThemeContext';
import { submitLeadAction } from '@/actions/crmActions';

// Mock Videos and Guides Data matching the reference image exactly
const VIDEOS_DATA = [
  {
    id: 'vid-1',
    category: 'COREIA',
    title: 'Quanto custa morar em Seul em 2027?',
    desc: 'Dicas reais de gastos com moradia, transporte, alimentação e lazer.',
    time: '15:42',
    date: '2 dias atrás',
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=600'
  },
  {
    id: 'vid-2',
    category: 'INTERCÂMBIO',
    title: 'Um dia estudando na Lexis Korea',
    desc: 'Como são as aulas, método de ensino, atividades e rotina do estudante.',
    time: '12:18',
    date: '5 dias atrás',
    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=600'
  },
  {
    id: 'vid-3',
    category: 'COREIA',
    title: 'Vale a pena visitar Busan?',
    desc: 'Tudo sobre a cidade: atrações, gastronomia, transporte e mais.',
    time: '10:35',
    date: '1 semana atrás',
    image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?q=80&w=600'
  },
  {
    id: 'vid-4',
    category: 'K-BEAUTY',
    title: 'Beauty Experience na Coreia',
    desc: 'Fizemos uma experiência completa de skincare e maquiagem.',
    time: '11:07',
    date: '1 semana atrás',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600'
  },
  {
    id: 'vid-5',
    category: 'COREIA',
    title: 'Como funciona o metrô de Seul?',
    desc: 'T-money, linhas, tarifas e dicas para se locomover como um local.',
    time: '08:21',
    date: '2 semanas atrás',
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=600'
  },
  {
    id: 'vid-6',
    category: 'GASTRONOMIA',
    title: 'Comidas de rua na Coreia que você precisa experimentar',
    desc: 'Tour pelo mercado de Gwangjang e outras ruas famosas.',
    time: '09:16',
    date: '2 semanas atrás',
    image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?q=80&w=600'
  },
  {
    id: 'vid-7',
    category: 'VLOGS',
    title: 'Seul na primavera: roteiro completo',
    desc: 'Lugares imperdíveis, cafés, parques e festivais de flores.',
    time: '13:20',
    date: '3 semanas atrás',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=600'
  },
  {
    id: 'vid-8',
    category: 'VIETNÃ',
    title: 'Hanói: tradição e modernidade',
    desc: 'Descubra a capital do Vietnã e seus encantos únicos.',
    time: '10:11',
    date: '3 semanas atrás',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600'
  },
  {
    id: 'vid-9',
    category: 'JAPÃO',
    title: 'Kyoto: guia para sua primeira viagem',
    desc: 'Templos, bairros, documentação e experiências inesquecíveis.',
    time: '12:49',
    date: '1 mês atrás',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600'
  },
  {
    id: 'vid-10',
    category: 'INTERCÂMBIO',
    title: 'Quanto custa fazer intercâmbio na Coreia?',
    desc: 'Valores atualizados, documentação e dicas para economizar.',
    time: '07:36',
    date: '1 mês atrás',
    image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=600'
  }
];

const BASTIDORES_DATA = [
  { id: 'b-1', title: 'Planejamento de roteiros na Coreia', date: '3 dias atrás', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=400' },
  { id: 'b-2', title: 'Visitando hotéis e acomodações', date: '1 semana atrás', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=400' },
  { id: 'b-3', title: 'Conhecendo escolas parceiras', date: '2 semanas atrás', image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=400' },
  { id: 'b-4', title: 'Reunião com parceiros na Coreia', date: '2 semanas atrás', image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=400' },
  { id: 'b-5', title: 'Escolhendo restaurantes para os grupos', date: '3 semanas atrás', image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?q=80&w=400' },
  { id: 'b-6', title: 'Testando experiências exclusivas', date: '1 mês atrás', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=400' }
];

const GUIDES_DATA = [
  { id: 'g-1', category: 'GUIA COMPLETO', title: 'Guia completo para viajar à Coreia do Sul' },
  { id: 'g-2', category: 'CHECKLIST', title: 'Checklist do intercâmbio na Coreia' },
  { id: 'g-3', category: 'ROTEIRO', title: 'Roteiro de 7 dias em Seul: o que fazer e onde ir' },
  { id: 'g-4', category: 'GUIA', title: 'Guia de bairros de Seul: onde ficar e explorar' },
  { id: 'g-5', category: 'PLANEJAMENTO', title: 'Quanto levar para a Coreia: custos e dicas' },
  { id: 'g-6', category: 'TRANSPORTE', title: 'Como usar o T-money e se locomover' }
];

const YOUTUBE_DATA = [
  { id: 'yt-1', title: 'Palácio Gyeongbokgung: história e curiosidades', views: '1.2 mil visualizações', date: 'há 3 dias', time: '14:22', image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=400' },
  { id: 'yt-2', title: 'Vlog: um dia inteiro em Hongdae', views: '2.1 mil visualizações', date: 'há 1 semana', time: '11:08', image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=400' },
  { id: 'yt-3', title: 'Meus produtos de skincare favoritos na Coreia', views: '1.8 mil visualizações', date: 'há 2 semanas', time: '09:24', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=400' },
  { id: 'yt-4', title: 'Jeju: um paraíso na Coreia do Sul', views: '2.5 mil visualizações', date: 'há 3 semanas', time: '13:15', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=400' },
  { id: 'yt-5', title: 'Compras na Coreia: o que vale a pena?', views: '1.6 mil visualizações', date: 'há 1 mês', time: '10:07', image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?q=80&w=400' }
];

const CATEGORIES_WITH_ICONS = [
  { name: 'TODOS', icon: Globe },
  { name: 'COREIA', icon: MapPin },
  { name: 'JAPÃO', icon: Compass },
  { name: 'VIETNÃ', icon: Compass },
  { name: 'INTERCÂMBIO', icon: GraduationCap },
  { name: 'K-BEAUTY', icon: Sparkles },
  { name: 'GASTRONOMIA', icon: Utensils },
  { name: 'HISTÓRIA', icon: BookOpen },
  { name: 'VLOGS', icon: Tv },
  { name: 'PLANEJAMENTO', icon: Calendar },
  { name: 'CULTURA', icon: Globe }
];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState('TODOS');
  
  // Lead Form state
  const [leadForm, setLeadForm] = useState({ name: '', phone: '', email: '', interest: 'Coreia do Sul' });
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

  const filteredVideos = activeCategory === 'TODOS'
    ? VIDEOS_DATA
    : VIDEOS_DATA.filter(v => v.category === activeCategory);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await submitLeadAction({
      name: leadForm.name,
      phone: leadForm.phone,
      email: leadForm.email,
      interest: leadForm.interest,
      origin: 'Formulário da Landing Page'
    });
    setLoading(false);
    if (res.success) {
      setLeadSubmitted(true);
      setLeadForm({ name: '', phone: '', email: '', interest: 'Coreia do Sul' });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-zinc-950">
        {/* Background Image with overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/banner.png"
            alt="MAEUM Banner"
            fill
            className="object-cover object-center scale-105 filter brightness-[0.4]"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/45 to-black/75" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto text-white flex flex-col items-center gap-6">
          <span className="text-xs uppercase tracking-widest text-primary font-bold bg-primary/20 backdrop-blur border border-primary/45 rounded-full px-4 py-1.5 animate-pulse">
            JOURNAL MAEUM
          </span>
          <h1 className="font-heading text-4xl sm:text-6xl font-light tracking-wide leading-tight uppercase">
            Descubra a Ásia <br className="hidden sm:inline" />
            antes mesmo de embarcar.
          </h1>
          <p className="text-sm sm:text-base text-gray-200 max-w-xl font-light">
            Histórias, dicas e experiências reais para transformar sua viagem.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <button className="flex items-center justify-center gap-2.5 bg-primary hover:bg-accent-hover text-white font-semibold text-xs py-3 px-8 rounded-full shadow-lg transition-all group uppercase tracking-wider">
              <Play className="h-4 w-4 fill-white group-hover:scale-110 transition-transform" />
              ASSISTIR AO VÍDEO INSTITUCIONAL
            </button>
          </div>
        </div>
      </section>

      {/* Category Filter Bar with Icons matching reference */}
      <section className="bg-background border-b border-border py-6 px-4 sticky top-[60px] z-40 overflow-x-auto scrollbar-none shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-start md:justify-center gap-6 min-w-max">
          {CATEGORIES_WITH_ICONS.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={`flex flex-col items-center gap-2 text-[10px] font-bold tracking-wider uppercase transition-all pb-1 border-b-2 ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-secondary'
                }`}
              >
                <span className={`p-2 rounded-xl transition-all ${isActive ? 'bg-primary/10 text-primary' : 'bg-muted/30 text-muted-foreground'}`}>
                  <Icon className="h-4.5 w-4.5" />
                </span>
                {cat.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* Vídeos em Destaque */}
      <section className="py-16 px-4 md:px-8 bg-background max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-heading text-3xl font-light text-secondary">Vídeos em destaque</h2>
          </div>
          <button className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-accent-hover transition-colors uppercase tracking-wider">
            VER TODOS OS VÍDEOS →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredVideos.map((vid, idx) => (
              <motion.div
                key={vid.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="bg-card border border-border rounded-2xl overflow-hidden group shadow-sm hover:shadow-md transition-all flex flex-col"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                  <Image
                    src={vid.image}
                    alt={vid.title}
                    fill
                    unoptimized
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/20" />
                  <span className="absolute left-3 top-3 bg-primary text-white text-[8px] font-bold tracking-widest px-2 py-0.5 rounded uppercase">
                    {vid.category}
                  </span>
                  <span className="absolute right-3 bottom-3 bg-black/75 text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
                    {vid.time}
                  </span>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                    <span className="bg-primary hover:bg-accent-hover text-white p-2.5 rounded-full shadow-lg transition-transform scale-90 group-hover:scale-100 duration-200">
                      <Play className="h-4.5 w-4.5 fill-white ml-0.5" />
                    </span>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] text-muted-foreground font-semibold">{vid.date}</span>
                    <h3 className="font-heading text-xs font-semibold text-secondary mt-1 group-hover:text-primary transition-colors leading-snug line-clamp-2">
                      {vid.title}
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed line-clamp-2">
                      {vid.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* Bastidores da Maeum */}
      <section className="py-16 px-4 md:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-heading text-3xl font-light text-secondary">Bastidores da Maeum</h2>
              <p className="text-sm text-muted-foreground mt-1">Acompanhe de perto como preparamos cada detalhe para você viver experiências inesquecíveis.</p>
            </div>
            <button className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-accent-hover transition-colors uppercase tracking-wider">
              VER TODOS OS BASTIDORES →
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-6">
            {BASTIDORES_DATA.map((item) => (
              <div key={item.id} className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm group hover:shadow transition-all">
                <div className="relative aspect-square w-full">
                  <Image src={item.image} alt={item.title} fill unoptimized className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Video className="h-6 w-6 text-white animate-bounce" />
                  </div>
                </div>
                <div className="p-3">
                  <span className="text-[9px] text-muted-foreground font-semibold">{item.date}</span>
                  <h4 className="text-[10px] font-semibold text-secondary mt-1 line-clamp-2 leading-snug">{item.title}</h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guias Completos para Download */}
      <section className="py-16 px-4 md:px-8 bg-background max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="font-heading text-3xl font-light text-secondary">Guias completos</h2>
            <p className="text-sm text-muted-foreground mt-1">Artigos e guias práticos em PDF para você planejar cada etapa da sua viagem dos sonhos.</p>
          </div>
          <button className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-accent-hover transition-colors uppercase tracking-wider">
            VER TODOS OS GUIAS →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          {GUIDES_DATA.map((guide) => (
            <div key={guide.id} className="border border-border/80 rounded-2xl p-5 bg-card flex flex-col justify-between hover:border-primary/50 transition-all shadow-sm">
              <div>
                <span className="text-[8px] font-bold tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded uppercase">
                  {guide.category}
                </span>
                <h3 className="font-heading text-xs font-semibold text-secondary mt-3 leading-snug">
                  {guide.title}
                </h3>
              </div>
              <button className="flex items-center gap-1.5 mt-6 text-[10px] font-bold text-primary hover:text-accent-hover transition-colors uppercase tracking-wider">
                <Download className="h-3.5 w-3.5" />
                BAIXAR PDF
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* YouTube Videos Section matching reference exactly */}
      <section className="py-16 px-4 md:px-8 bg-muted/10 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-red-600 rounded-full text-white">
                <Play className="h-4 w-4 fill-white ml-0.5" />
              </span>
              <h2 className="font-heading text-3xl font-light text-secondary">Últimos vídeos no YouTube</h2>
            </div>
            <button className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-accent-hover transition-colors uppercase tracking-wider">
              IR PARA O YOUTUBE →
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-6">
            {YOUTUBE_DATA.map((vid) => (
              <div key={vid.id} className="bg-card border border-border rounded-2xl overflow-hidden group shadow-sm hover:shadow transition-all flex flex-col justify-between">
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                  <Image src={vid.image} alt={vid.title} fill unoptimized className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/10" />
                  <span className="absolute right-2 bottom-2 bg-black/80 text-white text-[9px] px-1 rounded">
                    {vid.time}
                  </span>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/35">
                    <span className="bg-red-600 text-white p-2 rounded-full">
                      <Play className="h-4 w-4 fill-white ml-0.5" />
                    </span>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-[10px] font-semibold text-secondary leading-snug line-clamp-2">{vid.title}</h4>
                    <p className="text-[9px] text-muted-foreground mt-2">{vid.views} • {vid.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Floating Card Newsletter matching reference exactly */}
      <section className="py-16 px-4 md:px-8 bg-background max-w-7xl mx-auto w-full">
        <div className="relative bg-secondary rounded-3xl p-8 md:p-12 shadow-2xl overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Background Travel Image */}
          <div className="absolute inset-0 z-0 opacity-15">
            <Image
              src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1920"
              alt="Travel background"
              fill
              unoptimized
              className="object-cover object-center"
            />
          </div>

          <div className="relative z-10 max-w-md text-white">
            <h2 className="font-heading text-3xl font-light text-primary uppercase tracking-wide">Receba conteúdos exclusivos da Ásia</h2>
            <p className="text-xs text-gray-400 mt-2">
              Dicas, roteiros, novidades e muito mais direto no seu e-mail de forma 100% gratuita.
            </p>
          </div>

          <div className="relative z-10 w-full max-w-md">
            {newsletterSubmitted ? (
              <div className="text-primary font-bold text-xs bg-primary/10 border border-primary/30 p-4 rounded-xl text-center">
                ✓ ¡Te has suscrito con éxito! Recibirás los eventos en tu correo.
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await submitLeadAction({
                    name: 'Assinante Newsletter',
                    phone: '',
                    email: newsletterEmail,
                    interest: 'Geral',
                    origin: 'Newsletter'
                  });
                  setNewsletterSubmitted(true);
                }}
                className="flex gap-3"
              >
                <Input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={e => setNewsletterEmail(e.target.value)}
                  placeholder="Seu melhor e-mail"
                  className="bg-black/50 border-gray-800 rounded-xl text-white placeholder-gray-500 text-xs h-11"
                />
                <Button type="submit" className="bg-primary hover:bg-accent-hover text-white rounded-xl font-bold px-6 h-11 text-xs shrink-0">
                  QUERO RECEBER
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
