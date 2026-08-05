'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight, CalendarCheck, Calendar, MapPin, Users, Award, 
  MessageSquare, Star, Clock, Check, HeartHandshake, ShieldCheck
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const EXPERIENCES = [
  {
    title: 'K-BEAUTY EXPERIENCE',
    subtitle: 'Em parceria com a Cheotnun',
    features: ['Análise da pele', 'Consultoria personalizada', 'Skincare & Makeup Class', 'Kit exclusivo Cheotnun'],
    duration: '3 horas',
    price: 'R$ 1.050',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=400'
  },
  {
    title: 'HANBOK DESIGN EXPERIENCE',
    subtitle: 'Estúdio Exclusivo',
    features: ['Consultoria individual', 'Escolha personalizada', 'Acessórios tradicionais', 'Sessão fotográfica'],
    duration: '3 horas',
    price: 'R$ 950',
    image: 'https://images.unsplash.com/photo-1566837945700-30057527ade0?q=80&w=400'
  },
  {
    title: 'PERFUME EXPERIENCE',
    subtitle: 'Ateliê em Bukchon',
    features: ['História da perfumaria coreana', 'Criação da sua fragrância', 'Frasco personalizado', 'Certificado da experiência'],
    duration: '2 horas',
    price: 'R$ 850',
    image: 'https://images.unsplash.com/photo-1595425970377-c9703bc48b2d?q=80&w=400'
  },
  {
    title: 'MAKGEOLLI MASTER CLASS',
    subtitle: 'Com Mestre Cervejeiro',
    features: ['História e ingredientes', 'Fermentação artesanal', 'Produção do makgeolli', 'Degustação'],
    duration: '2 horas',
    price: 'R$ 750',
    image: 'https://images.unsplash.com/photo-1582295525920-631620a8db08?q=80&w=400'
  },
  {
    title: 'CERÂMICA TRADICIONAL',
    subtitle: 'Oficina Icheon',
    features: ['Introdução à arte coreana', 'Modelagem', 'Pintura', 'Queima e peça para levar'],
    duration: '2h30',
    price: 'R$ 680',
    image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=400'
  },
  {
    title: 'BIBIMBAP EXPERIENCE',
    subtitle: 'Aula de Gastronomia',
    features: ['Visita ao mercado local', 'Aula com chef coreano', 'Preparo do bibimbap', 'Degustação completa'],
    duration: '2h30',
    price: 'R$ 650',
    image: 'https://images.unsplash.com/photo-1580651315530-69c8e0026377?q=80&w=400'
  },
  {
    title: 'BOJAGI ART',
    subtitle: 'Embalagens Tradicionais',
    features: ['História do bojagi', 'Técnicas tradicionais', 'Criação de sua peça', 'Peça para levar'],
    duration: '2 horas',
    price: 'R$ 550',
    image: 'https://images.unsplash.com/photo-1584556488924-f7a93ce5b106?q=80&w=400'
  },
  {
    title: 'HAN RIVER SUNSET BIKE TOUR',
    subtitle: 'Guia Especializado',
    features: ['Passeio de bicicleta', 'Guia especializado', 'Piquenique coreano', 'Registro fotográfico'],
    duration: '3 horas',
    price: 'R$ 750',
    image: 'https://images.unsplash.com/photo-1578489758854-f134a358f08b?q=80&w=400'
  },
  {
    title: 'FOOT SPA & HERBAL TEA',
    subtitle: 'Clínica Tradicional',
    features: ['Escalda-pés com ervas', 'Massagem relaxante', 'Chá tradicional coreano', 'Momento de relaxamento'],
    duration: '1h30',
    price: 'R$ 420',
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=400'
  },
  {
    title: 'PHOTO EXPERIENCE',
    subtitle: 'Fotógrafo Profissional',
    features: ['Sessão fotográfica', 'Locações icônicas', 'Fotos profissionais', 'Link com fotos editadas'],
    duration: '2 horas',
    price: 'R$ 900',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=400'
  },
  {
    title: 'TEA CEREMONY',
    subtitle: 'Com Mestre Tradicional',
    features: ['História do chá verde', 'Preparo cerimonial', 'Meditação guiada', 'Degustação'],
    duration: '1h30',
    price: 'R$ 420',
    image: 'https://images.unsplash.com/photo-1514361892635-6b07e31e75f9?q=80&w=400'
  },
  {
    title: 'CALLIGRAPHY CLASS',
    subtitle: 'Arte da Escrita Coreana',
    features: ['História do Hangul', 'Prática com pincel', 'Criação de quadro', 'Arte para levar'],
    duration: '1h30',
    price: 'R$ 390',
    image: 'https://images.unsplash.com/photo-1555581977-7e2a9b6eb505?q=80&w=400'
  },
  {
    title: 'TEMPLE STAY DAY',
    subtitle: 'Imersão Budista',
    features: ['Tour pelo templo', 'Cerimônia budista', 'Refeição monástica', 'Meditação'],
    duration: '4 horas',
    price: 'R$ 650',
    image: 'https://images.unsplash.com/photo-1542450379-379659fdffc5?q=80&w=400'
  },
  {
    title: 'K-POP DANCE CLASS',
    subtitle: 'Aula Particular',
    features: ['Estúdio profissional', 'Coreógrafo de K-Pop', 'Gravação de vídeo', 'Certificado'],
    duration: '2 horas',
    price: 'R$ 650',
    image: 'https://images.unsplash.com/photo-1547153760-18fc86324498?q=80&w=400'
  },
  {
    title: 'PRIVATE HANOK DINNER',
    subtitle: 'Jantar em Hanok',
    features: ['Hanok exclusivo', 'Menu degustação real', 'Chef particular', 'Bebidas inclusas'],
    duration: '3 horas',
    price: 'R$ 980',
    image: 'https://images.unsplash.com/photo-1553956327-0b171f11e9f2?q=80&w=400'
  }
];

export default function ExperienciasPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0F0A08] text-[#EFEBE4] font-sans selection:bg-[#C8A27C] selection:text-[#0F0A08]">
      <Header />

      {/* 1. Hero Section */}
      <section className="relative pt-32 pb-16 px-6 sm:px-12 max-w-[1400px] mx-auto w-full border-b border-[#3D2620]">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <div className="lg:w-1/2 flex flex-col items-start gap-6 relative z-10">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold">
              MAEUM EXPERIENCES
            </span>
            <h1 className="font-heading text-5xl sm:text-6xl md:text-[70px] font-light tracking-wide leading-[1.1] text-white">
              Viva a Coreia <br />
              além dos <br />
              <span className="italic text-[#C8A27C]">pontos turísticos.</span>
            </h1>
            <p className="text-[13px] sm:text-sm text-gray-400 max-w-xl font-light text-left leading-relaxed opacity-90 mt-2">
              Acreditamos que conhecer um país significa criar conexões com as pessoas, a cultura e as tradições locais. 
              Cada experiência da Maeum Global foi escolhida para proporcionar momentos autênticos, em pequenos grupos 
              e com parceiros cuidadosamente selecionados.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
              <button className="flex items-center justify-center gap-3 bg-[#C8A27C] hover:bg-[#B8906C] text-[#0F0A08] font-bold text-[11px] py-4 px-8 rounded-none transition-all group uppercase tracking-widest">
                EXPLORAR EXPERIÊNCIAS
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="flex items-center justify-center gap-3 bg-transparent border border-[#C8A27C] text-[#C8A27C] hover:bg-[#C8A27C]/10 font-bold text-[11px] py-4 px-8 rounded-none transition-all uppercase tracking-widest">
                <CalendarCheck className="w-4 h-4" />
                SOLICITAR PLANEJAMENTO
              </button>
            </div>
          </div>

          <div className="lg:w-1/2 relative h-[500px] w-full rounded-sm overflow-hidden border border-[#3D2620]">
            <Image 
              src="https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?q=80&w=800" 
              alt="Korean Experience" 
              fill 
              className="object-cover" 
            />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#0F0A08]/50" />
          </div>
        </div>
      </section>

      {/* 2. Curadoria Features */}
      <section className="py-12 px-6 sm:px-12 max-w-[1400px] mx-auto w-full border-b border-[#3D2620]">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          <div className="lg:w-1/3">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold block mb-2">CURADORIA MAEUM</span>
            <h3 className="font-heading text-2xl font-light text-white mb-2 leading-tight">
              Não vendemos passeios.
            </h3>
            <p className="text-[12px] text-gray-400 font-light leading-relaxed">
              Criamos experiências que normalmente não estão disponíveis em roteiros convencionais.
            </p>
          </div>
          
          <div className="lg:w-2/3 grid grid-cols-2 md:grid-cols-6 gap-6">
            <div className="flex flex-col items-center text-center gap-3">
              <Check className="w-6 h-6 text-[#C8A27C] stroke-1" />
              <span className="text-[9px] text-gray-400 font-medium tracking-widest uppercase leading-tight">Parceiros locais<br/>selecionados</span>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <Users className="w-6 h-6 text-[#C8A27C] stroke-1" />
              <span className="text-[9px] text-gray-400 font-medium tracking-widest uppercase leading-tight">Pequenos<br/>grupos</span>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <MessageSquare className="w-6 h-6 text-[#C8A27C] stroke-1" />
              <span className="text-[9px] text-gray-400 font-medium tracking-widest uppercase leading-tight">Atendimento<br/>em português</span>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <Star className="w-6 h-6 text-[#C8A27C] stroke-1" />
              <span className="text-[9px] text-gray-400 font-medium tracking-widest uppercase leading-tight">Experiências<br/>autorais</span>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <CalendarCheck className="w-6 h-6 text-[#C8A27C] stroke-1" />
              <span className="text-[9px] text-gray-400 font-medium tracking-widest uppercase leading-tight">Reservas<br/>antecipadas</span>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <Award className="w-6 h-6 text-[#C8A27C] stroke-1" />
              <span className="text-[9px] text-gray-400 font-medium tracking-widest uppercase leading-tight">Momentos<br/>exclusivos</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. EXPERIÊNCIAS EXCLUSIVAS (GRID) */}
      <section className="py-24 px-6 sm:px-12 max-w-[1400px] mx-auto w-full">
        <div className="text-center mb-16 flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold block mb-2 flex items-center gap-2">
            <Star className="w-3 h-3" /> EXPERIÊNCIAS EXCLUSIVAS <Star className="w-3 h-3" />
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {EXPERIENCES.map((exp, idx) => (
            <div key={idx} className="bg-[#261514] border border-[#3D2620] flex flex-col overflow-hidden group hover:border-[#C8A27C]/40 transition-colors">
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <Image src={exp.image} alt={exp.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-heading text-sm font-semibold text-white mb-1 uppercase tracking-wider">{exp.title}</h3>
                <p className="text-[9px] text-[#C8A27C] uppercase tracking-widest mb-4 font-medium">{exp.subtitle}</p>
                
                <ul className="text-[9px] text-gray-400 space-y-2 mb-6 flex-1 font-light">
                  {exp.features.map((feat, fidx) => (
                    <li key={fidx}>+ {feat}</li>
                  ))}
                </ul>
                
                <div className="mt-auto border-t border-[#3D2620] pt-4">
                  <div className="flex justify-between items-end mb-4">
                    <div className="flex items-center gap-1.5 text-[9px] text-gray-400 font-medium">
                      <Clock className="w-3 h-3 text-gray-500" /> {exp.duration}
                    </div>
                    <div className="text-right">
                      <span className="block text-[8px] text-gray-500 uppercase tracking-widest mb-0.5">A partir de</span>
                      <span className="font-heading text-sm text-white font-semibold">{exp.price}</span>
                    </div>
                  </div>
                  <button className="w-full bg-transparent border border-[#3D2620] hover:bg-[#3D2620] text-[#C8A27C] transition-colors py-2.5 text-[8px] font-bold uppercase tracking-widest rounded-sm text-center">
                    RESERVAR EXPERIÊNCIA
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. COMO FUNCIONA */}
      <section className="py-24 px-6 sm:px-12 max-w-[1400px] mx-auto w-full border-t border-[#3D2620]">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          
          <div className="lg:w-1/2 w-full">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold block mb-12 text-center lg:text-left">
              COMO FUNCIONA
            </span>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div className="flex flex-col items-center text-center gap-3 relative">
                <Check className="w-6 h-6 text-[#C8A27C] stroke-1" />
                <span className="text-[10px] font-bold text-[#C8A27C]">01 ESCOLHA</span>
                <p className="text-[9px] text-gray-400 font-light leading-relaxed">Selecione as experiências que mais combinam com o seu perfil.</p>
                <div className="hidden sm:block absolute top-[30%] -right-[50%] w-[100%]">
                  <ArrowRight className="w-4 h-4 text-[#C8A27C]/30 mx-auto" />
                </div>
              </div>
              <div className="flex flex-col items-center text-center gap-3 relative">
                <Calendar className="w-6 h-6 text-[#C8A27C] stroke-1" />
                <span className="text-[10px] font-bold text-[#C8A27C]">02 PLANEJAMENTO</span>
                <p className="text-[9px] text-gray-400 font-light leading-relaxed">Nossa equipe verifica disponibilidade e agenda tudo antes da sua chegada.</p>
                <div className="hidden sm:block absolute top-[30%] -right-[50%] w-[100%]">
                  <ArrowRight className="w-4 h-4 text-[#C8A27C]/30 mx-auto" />
                </div>
              </div>
              <div className="flex flex-col items-center text-center gap-3 relative">
                <Users className="w-6 h-6 text-[#C8A27C] stroke-1" />
                <span className="text-[10px] font-bold text-[#C8A27C]">03 APROVEITE</span>
                <p className="text-[9px] text-gray-400 font-light leading-relaxed">Você vive cada momento com tranquilidade e com parceiros selecionados.</p>
                <div className="hidden sm:block absolute top-[30%] -right-[50%] w-[100%]">
                  <ArrowRight className="w-4 h-4 text-[#C8A27C]/30 mx-auto" />
                </div>
              </div>
              <div className="flex flex-col items-center text-center gap-3">
                <Star className="w-6 h-6 text-[#C8A27C] stroke-1" />
                <span className="text-[10px] font-bold text-[#C8A27C]">04 MEMÓRIAS</span>
                <p className="text-[9px] text-gray-400 font-light leading-relaxed">Experiências que ficam para sempre na sua história e no seu coração.</p>
              </div>
            </div>
          </div>

          <div className="lg:w-1/2 relative h-[300px] w-full rounded-sm overflow-hidden border border-[#3D2620]">
            <Image src="https://images.unsplash.com/photo-1545657802-1845184bba02?q=80&w=800" alt="Memórias" fill className="object-cover" />
          </div>

        </div>
      </section>

      {/* 5. POR QUE ESCOLHEMOS NOSSOS PARCEIROS */}
      <section className="py-20 px-6 sm:px-12 max-w-[1400px] mx-auto w-full border-t border-[#3D2620]">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          
          <div className="lg:w-1/3 relative h-[300px] w-full rounded-sm overflow-hidden border border-[#3D2620]">
            <Image src="https://images.unsplash.com/photo-1588720164627-82ba694e82b7?q=80&w=600" alt="Hanok Night" fill className="object-cover" />
          </div>

          <div className="lg:w-2/3 flex flex-col md:flex-row gap-12">
            <div className="md:w-1/2 flex flex-col gap-4">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold">
                POR QUE ESCOLHEMOS NOSSOS PARCEIROS?
              </span>
              <p className="text-[11px] text-gray-300 font-light leading-relaxed">
                Na Maeum Global acreditamos que as melhores experiências nascem das pessoas.
                <br/><br/>
                Por isso, trabalhamos apenas com parceiros locais que compartilham dos nossos valores de qualidade, hospitalidade e autenticidade.
                <br/><br/>
                Cada experiência é escolhida pessoalmente para oferecer algo que vá além do turismo tradicional.
              </p>
            </div>
            <div className="md:w-1/2 flex flex-col justify-center gap-6">
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-[#C8A27C]" strokeWidth={2} />
                <span className="text-[11px] text-gray-300 font-light">Qualidade Premium</span>
              </div>
              <div className="flex items-center gap-3">
                <HeartHandshake className="w-4 h-4 text-[#C8A27C]" strokeWidth={2} />
                <span className="text-[11px] text-gray-300 font-light">Hospitalidade Local</span>
              </div>
              <div className="flex items-center gap-3">
                <Award className="w-4 h-4 text-[#C8A27C]" strokeWidth={2} />
                <span className="text-[11px] text-gray-300 font-light">Autenticidade</span>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-[#C8A27C]" strokeWidth={2} />
                <span className="text-[11px] text-gray-300 font-light">Confiança e Segurança</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 6. CTA FINAL */}
      <section className="py-20 px-6 sm:px-12 max-w-[1400px] mx-auto w-full">
        <div className="bg-[#2A1112] border border-[#3D2620] rounded-sm p-12 sm:p-16 flex flex-col lg:flex-row items-center justify-between gap-10 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 w-1/3 h-full">
             <Image src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=600" alt="Texture" fill className="object-cover" />
          </div>
          
          <div className="relative z-10 flex flex-col gap-4 lg:w-2/3">
            <h2 className="font-heading text-3xl sm:text-4xl font-light text-[#C8A27C]">
              Sua viagem pode ser tão única quanto você.
            </h2>
            <p className="text-[12px] text-gray-400 font-light">
              Monte uma jornada personalizada combinando cultura, gastronomia, bem-estar, K-Beauty e tradições coreanas em um único roteiro.
            </p>
          </div>
          
          <div className="relative z-10 flex flex-col gap-4 lg:w-1/3 w-full">
            <button className="w-full bg-[#C8A27C] hover:bg-[#B8906C] text-[#0F0A08] font-bold text-[10px] py-4 px-8 rounded-none transition-all uppercase tracking-widest flex items-center justify-center gap-3 group">
              PERSONALIZAR MINHA EXPERIÊNCIA
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="text-[9px] text-[#C8A27C] hover:text-white uppercase tracking-widest font-semibold transition-colors">
              FALAR COM UMA CONSULTORA
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
