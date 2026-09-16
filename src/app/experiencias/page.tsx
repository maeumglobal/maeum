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
import { useLanguage } from '@/contexts/LanguageContext';
import { useMedia } from '@/contexts/SiteContentContext';

const EXPERIENCES = [
  {
    title: 'K-BEAUTY EXPERIENCE',
    subtitle: 'Em parceria com a Cheotnun',
    features: ['Análise da pele', 'Consultoria personalizada', 'Skincare & Makeup Class', 'Kit exclusivo Cheotnun'],
    duration: '3 horas',
    price: 'R$ 1.050',
  },
  {
    title: 'HANBOK DESIGN EXPERIENCE',
    subtitle: 'Estúdio Exclusivo',
    features: ['Consultoria individual', 'Escolha personalizada', 'Acessórios tradicionais', 'Sessão fotográfica'],
    duration: '3 horas',
    price: 'R$ 950',
  },
  {
    title: 'PERFUME EXPERIENCE',
    subtitle: 'Ateliê em Bukchon',
    features: ['História da perfumaria coreana', 'Criação da sua fragrância', 'Frasco personalizado', 'Certificado da experiência'],
    duration: '2 horas',
    price: 'R$ 850',
  },
  {
    title: 'MAKGEOLLI MASTER CLASS',
    subtitle: 'Com Mestre Cervejeiro',
    features: ['História e ingredientes', 'Fermentação artesanal', 'Produção do makgeolli', 'Degustação'],
    duration: '2 horas',
    price: 'R$ 750',
  },
  {
    title: 'CERÂMICA TRADICIONAL',
    subtitle: 'Oficina Icheon',
    features: ['Introdução à arte coreana', 'Modelagem', 'Pintura', 'Queima e peça para levar'],
    duration: '2h30',
    price: 'R$ 680',
  },
  {
    title: 'BIBIMBAP EXPERIENCE',
    subtitle: 'Aula de Gastronomia',
    features: ['Visita ao mercado local', 'Aula com chef coreano', 'Preparo do bibimbap', 'Degustação completa'],
    duration: '2h30',
    price: 'R$ 650',
  },
  {
    title: 'BOJAGI ART',
    subtitle: 'Embalagens Tradicionais',
    features: ['História do bojagi', 'Técnicas tradicionais', 'Criação de sua peça', 'Peça para levar'],
    duration: '2 horas',
    price: 'R$ 550',
  },
  {
    title: 'HAN RIVER SUNSET BIKE TOUR',
    subtitle: 'Guia Especializado',
    features: ['Passeio de bicicleta', 'Guia especializado', 'Piquenique coreano', 'Registro fotográfico'],
    duration: '3 horas',
    price: 'R$ 750',
  },
  {
    title: 'FOOT SPA & HERBAL TEA',
    subtitle: 'Clínica Tradicional',
    features: ['Escalda-pés com ervas', 'Massagem relaxante', 'Chá tradicional coreano', 'Momento de relaxamento'],
    duration: '1h30',
    price: 'R$ 420',
  },
  {
    title: 'PHOTO EXPERIENCE',
    subtitle: 'Fotógrafo Profissional',
    features: ['Sessão fotográfica', 'Locações icônicas', 'Fotos profissionais', 'Link com fotos editadas'],
    duration: '2 horas',
    price: 'R$ 900',
  },
  {
    title: 'TEA CEREMONY',
    subtitle: 'Com Mestre Tradicional',
    features: ['História do chá verde', 'Preparo cerimonial', 'Meditação guiada', 'Degustação'],
    duration: '1h30',
    price: 'R$ 420',
  },
  {
    title: 'CALLIGRAPHY CLASS',
    subtitle: 'Arte da Escrita Coreana',
    features: ['História do Hangul', 'Prática com pincel', 'Criação de quadro', 'Arte para levar'],
    duration: '1h30',
    price: 'R$ 390',
  },
  {
    title: 'TEMPLE STAY DAY',
    subtitle: 'Imersão Budista',
    features: ['Tour pelo templo', 'Cerimônia budista', 'Refeição monástica', 'Meditação'],
    duration: '4 horas',
    price: 'R$ 650',
  },
  {
    title: 'K-POP DANCE CLASS',
    subtitle: 'Aula Particular',
    features: ['Estúdio profissional', 'Coreógrafo de K-Pop', 'Gravação de vídeo', 'Certificado'],
    duration: '2 horas',
    price: 'R$ 650',
  },
  {
    title: 'PRIVATE HANOK DINNER',
    subtitle: 'Jantar em Hanok',
    features: ['Hanok exclusivo', 'Menu degustação real', 'Chef particular', 'Bebidas inclusas'],
    duration: '3 horas',
    price: 'R$ 980',
  }
];

export default function ExperienciasPage() {
  const { t, locale } = useLanguage();
  const heroDesktop = useMedia('experiencias_hero_desktop');
  const heroMobile = useMedia('experiencias_hero_mobile');
  const memoriasImage = useMedia('experiencias_memorias_image');
  const hanokImage = useMedia('experiencias_hanok_image');
  const expImages = [
    useMedia('experiencias_card_kbeauty'),
    useMedia('experiencias_card_hanbok'),
    useMedia('experiencias_card_perfume'),
    useMedia('experiencias_card_makgeolli'),
    useMedia('experiencias_card_ceramica'),
    useMedia('experiencias_card_bibimbap'),
    useMedia('experiencias_card_bojagi'),
    useMedia('experiencias_card_han_bike'),
    useMedia('experiencias_card_foot_spa'),
    useMedia('experiencias_card_photo'),
    useMedia('experiencias_card_tea'),
    useMedia('experiencias_card_calligraphy'),
    useMedia('experiencias_card_temple_stay'),
    useMedia('experiencias_card_kpop_dance'),
    useMedia('experiencias_card_hanok_dinner'),
  ];
  const lp = (path: string) => (locale === 'pt' || path === '/' ? path : `/${locale}${path}`);
  return (
    <div className="flex flex-col min-h-screen bg-[#0F0A08] text-[#EFEBE4] font-sans selection:bg-[#C8A27C] selection:text-[#0F0A08]">
      <Header />

      {/* 1. Hero Section */}
      <section className="relative min-h-[100dvh] flex flex-col justify-center overflow-hidden border-b border-[#3D2620]">
        <div className="absolute inset-0 z-0">
          <Image 
            src={heroDesktop} 
            alt={t('Experiências na Coreia do Sul Maeum Global Desktop')} 
            fill 
            className="object-cover object-center brightness-[0.80] hidden md:block" 
            priority
          />
          <Image 
            src={heroMobile} 
            alt={t('Experiências na Coreia do Sul Maeum Global Mobile')} 
            fill 
            className="object-cover object-center brightness-[0.80] block md:hidden" 
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F0A08] via-[#0F0A08]/80 to-transparent w-full sm:w-2/3" />
        </div>

        <div className="relative z-10 px-6 sm:px-12 max-w-7xl mx-auto w-full flex flex-col items-start gap-6 pt-28 md:pt-40 pb-20">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold">
            {t('MAEUM EXPERIENCES')}
          </span>
          <h1 className="font-heading text-5xl sm:text-6xl md:text-[70px] font-light tracking-wide leading-[1.1] text-white">
            {t('Viva a Coreia')} <br />
            {t('além dos')} <br />
            <span className="italic text-[#C8A27C]">{t('pontos turísticos.')}</span>
          </h1>
          <p className="text-[13px] sm:text-sm text-gray-300 max-w-xl font-light text-left leading-relaxed opacity-90 mt-2">
            {t('Acreditamos que conhecer um país significa criar conexões com as pessoas, a cultura e as tradições locais. Cada experiência da Maeum Global foi escolhida para proporcionar momentos autênticos, em pequenos grupos e com parceiros cuidadosamente selecionados.')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
            <Link href={lp('/pacotes')} className="flex items-center justify-center gap-3 bg-[#C8A27C] hover:bg-[#B8906C] text-[#0F0A08] font-bold text-[11px] py-4 px-8 rounded-none transition-all group uppercase tracking-widest">
              {t('VER PACOTES COMPLETOS')}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href={lp('/contato')} className="flex items-center justify-center gap-3 bg-transparent border border-[#C8A27C] text-[#C8A27C] hover:bg-[#C8A27C]/10 font-bold text-[11px] py-4 px-8 rounded-none transition-all uppercase tracking-widest">
              <CalendarCheck className="w-4 h-4" />
              {t('SOLICITAR PLANEJAMENTO')}
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Curadoria Features */}
      <section className="py-12 px-6 sm:px-12 max-w-[1400px] mx-auto w-full border-b border-[#3D2620]">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          <div className="lg:w-1/3">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold block mb-2">{t('CURADORIA MAEUM')}</span>
            <h3 className="font-heading text-2xl font-light text-white mb-2 leading-tight">
              {t('Não vendemos passeios.')}
            </h3>
            <p className="text-[12px] text-gray-400 font-light leading-relaxed">
              {t('Criamos experiências que normalmente não estão disponíveis em roteiros convencionais.')}
            </p>
          </div>
          
          <div className="lg:w-2/3 grid grid-cols-2 md:grid-cols-6 gap-6">
            <div className="flex flex-col items-center text-center gap-3">
              <Check className="w-6 h-6 text-[#C8A27C] stroke-1" />
              <span className="text-[9px] text-gray-400 font-medium tracking-widest uppercase leading-tight">{t('Parceiros locais')}<br/>{t('selecionados')}</span>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <Users className="w-6 h-6 text-[#C8A27C] stroke-1" />
              <span className="text-[9px] text-gray-400 font-medium tracking-widest uppercase leading-tight">{t('Pequenos')}<br/>{t('grupos')}</span>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <MessageSquare className="w-6 h-6 text-[#C8A27C] stroke-1" />
              <span className="text-[9px] text-gray-400 font-medium tracking-widest uppercase leading-tight">{t('Atendimento')}<br/>{t('em português')}</span>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <Star className="w-6 h-6 text-[#C8A27C] stroke-1" />
              <span className="text-[9px] text-gray-400 font-medium tracking-widest uppercase leading-tight">{t('Experiências')}<br/>{t('autorais')}</span>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <CalendarCheck className="w-6 h-6 text-[#C8A27C] stroke-1" />
              <span className="text-[9px] text-gray-400 font-medium tracking-widest uppercase leading-tight">{t('Reservas')}<br/>{t('antecipadas')}</span>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <Award className="w-6 h-6 text-[#C8A27C] stroke-1" />
              <span className="text-[9px] text-gray-400 font-medium tracking-widest uppercase leading-tight">{t('Momentos')}<br/>{t('exclusivos')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. EXPERIÊNCIAS EXCLUSIVAS (GRID) */}
      <section className="py-24 px-6 sm:px-12 max-w-[1400px] mx-auto w-full">
        <div className="text-center mb-16 flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold block mb-2 flex items-center gap-2">
            <Star className="w-3 h-3" /> {t('EXPERIÊNCIAS EXCLUSIVAS')} <Star className="w-3 h-3" />
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {EXPERIENCES.map((exp, idx) => (
            <div key={idx} className="bg-[#261514] border border-[#3D2620] flex flex-col overflow-hidden group hover:border-[#C8A27C]/40 transition-colors">
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <Image src={expImages[idx]} alt={exp.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-heading text-sm font-semibold text-white mb-1 uppercase tracking-wider">{t(exp.title)}</h3>
                <p className="text-[9px] text-[#C8A27C] uppercase tracking-widest mb-4 font-medium">{t(exp.subtitle)}</p>
                
                <ul className="text-[9px] text-gray-400 space-y-2 mb-6 flex-1 font-light">
                  {exp.features.map((feat, fidx) => (
                    <li key={fidx}>+ {t(feat)}</li>
                  ))}
                </ul>
                
                <div className="mt-auto border-t border-[#3D2620] pt-4">
                  <div className="flex justify-between items-end mb-4">
                    <div className="flex items-center gap-1.5 text-[9px] text-gray-400 font-medium">
                      <Clock className="w-3 h-3 text-gray-500" /> {t(exp.duration)}
                    </div>
                    <div className="text-right">
                      <span className="block text-[8px] text-gray-500 uppercase tracking-widest mb-0.5">{t('A partir de')}</span>
                      <span className="font-heading text-sm text-white font-semibold">{exp.price}</span>
                    </div>
                  </div>
                  <a
                    href={`https://wa.me/5541987094799?text=${encodeURIComponent(`Olá! Gostaria de saber mais e reservar a experiência: ${exp.title}.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full block bg-transparent border border-[#3D2620] hover:bg-[#3D2620] hover:text-white text-[#C8A27C] transition-colors py-2.5 text-[8px] font-bold uppercase tracking-widest rounded-sm text-center"
                  >
                    {t('RESERVAR EXPERIÊNCIA')}
                  </a>
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
              {t('COMO FUNCIONA')}
            </span>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div className="flex flex-col items-center text-center gap-3 relative">
                <Check className="w-6 h-6 text-[#C8A27C] stroke-1" />
                <span className="text-[10px] font-bold text-[#C8A27C]">{t('01 ESCOLHA')}</span>
                <p className="text-[9px] text-gray-400 font-light leading-relaxed">{t('Selecione as experiências que mais combinam com o seu perfil.')}</p>
                <div className="hidden sm:block absolute top-[30%] -right-[50%] w-[100%]">
                  <ArrowRight className="w-4 h-4 text-[#C8A27C]/30 mx-auto" />
                </div>
              </div>
              <div className="flex flex-col items-center text-center gap-3 relative">
                <Calendar className="w-6 h-6 text-[#C8A27C] stroke-1" />
                <span className="text-[10px] font-bold text-[#C8A27C]">{t('02 PLANEJAMENTO')}</span>
                <p className="text-[9px] text-gray-400 font-light leading-relaxed">{t('Nossa equipe verifica disponibilidade e agenda tudo antes da sua chegada.')}</p>
                <div className="hidden sm:block absolute top-[30%] -right-[50%] w-[100%]">
                  <ArrowRight className="w-4 h-4 text-[#C8A27C]/30 mx-auto" />
                </div>
              </div>
              <div className="flex flex-col items-center text-center gap-3 relative">
                <Users className="w-6 h-6 text-[#C8A27C] stroke-1" />
                <span className="text-[10px] font-bold text-[#C8A27C]">{t('03 APROVEITE')}</span>
                <p className="text-[9px] text-gray-400 font-light leading-relaxed">{t('Você vive cada momento com tranquilidade e com parceiros selecionados.')}</p>
                <div className="hidden sm:block absolute top-[30%] -right-[50%] w-[100%]">
                  <ArrowRight className="w-4 h-4 text-[#C8A27C]/30 mx-auto" />
                </div>
              </div>
              <div className="flex flex-col items-center text-center gap-3">
                <Star className="w-6 h-6 text-[#C8A27C] stroke-1" />
                <span className="text-[10px] font-bold text-[#C8A27C]">{t('04 MEMÓRIAS')}</span>
                <p className="text-[9px] text-gray-400 font-light leading-relaxed">{t('Experiências que ficam para sempre na sua história e no seu coração.')}</p>
              </div>
            </div>
          </div>

          <div className="lg:w-1/2 relative h-[300px] w-full rounded-sm overflow-hidden border border-[#3D2620]">
            <Image src={memoriasImage} alt={t('Memórias')} fill className="object-cover" />
          </div>

        </div>
      </section>

      {/* 5. POR QUE ESCOLHEMOS NOSSOS PARCEIROS */}
      <section className="py-20 px-6 sm:px-12 max-w-[1400px] mx-auto w-full border-t border-[#3D2620]">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          
          <div className="lg:w-1/3 relative h-[300px] w-full rounded-sm overflow-hidden border border-[#3D2620]">
            <Image src={hanokImage} alt="Hanok Night" fill className="object-cover" />
          </div>

          <div className="lg:w-2/3 flex flex-col md:flex-row gap-12">
            <div className="md:w-1/2 flex flex-col gap-4">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold">
                {t('POR QUE ESCOLHEMOS NOSSOS PARCEIROS?')}
              </span>
              <p className="text-[11px] text-gray-300 font-light leading-relaxed">
                {t('Na Maeum Global acreditamos que as melhores experiências nascem das pessoas.')}
                <br/><br/>
                {t('Por isso, trabalhamos apenas com parceiros locais que compartilham dos nossos valores de qualidade, hospitalidade e autenticidade.')}
                <br/><br/>
                {t('Cada experiência é escolhida pessoalmente para oferecer algo que vá além do turismo tradicional.')}
              </p>
            </div>
            <div className="md:w-1/2 flex flex-col justify-center gap-6">
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-[#C8A27C]" strokeWidth={2} />
                <span className="text-[11px] text-gray-300 font-light">{t('Qualidade Premium')}</span>
              </div>
              <div className="flex items-center gap-3">
                <HeartHandshake className="w-4 h-4 text-[#C8A27C]" strokeWidth={2} />
                <span className="text-[11px] text-gray-300 font-light">{t('Hospitalidade Local')}</span>
              </div>
              <div className="flex items-center gap-3">
                <Award className="w-4 h-4 text-[#C8A27C]" strokeWidth={2} />
                <span className="text-[11px] text-gray-300 font-light">{t('Autenticidade')}</span>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-[#C8A27C]" strokeWidth={2} />
                <span className="text-[11px] text-gray-300 font-light">{t('Confiança e Segurança')}</span>
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
              {t('Sua viagem pode ser tão única quanto você.')}
            </h2>
            <p className="text-[12px] text-gray-400 font-light">
              {t('Monte uma jornada personalizada combinando cultura, gastronomia, bem-estar, K-Beauty e tradições coreanas em um único roteiro.')}
            </p>
          </div>
          
          <div className="relative z-10 flex flex-col gap-4 lg:w-1/3 w-full">
            <Link href={lp('/contato')} className="w-full bg-[#C8A27C] hover:bg-[#B8906C] text-[#0F0A08] font-bold text-[10px] py-4 px-8 rounded-none transition-all uppercase tracking-widest flex items-center justify-center gap-3 group">
              {t('PERSONALIZAR MINHA EXPERIÊNCIA')}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href={lp('/contato')} className="text-[9px] text-[#C8A27C] hover:text-white uppercase tracking-widest font-semibold transition-colors flex justify-center mt-2">
              {t('FALAR COM UMA CONSULTORA')}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
