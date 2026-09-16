'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Compass, Sparkles, GraduationCap, MapPin, 
  ArrowRight, Calendar, Users, HeartHandshake, CheckCircle2 
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TripPlanner from '@/components/TripPlanner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMedia } from '@/contexts/SiteContentContext';

export default function CoreiaDoSulPage() {
  const { t, locale } = useLanguage();
  const heroDesktop = useMedia('coreia_hero_desktop') || 'https://images.unsplash.com/photo-1538669715515-5e3819766a9e?q=80&w=1600';
  const lp = (path: string) => (locale === 'pt' || path === '/' ? path : `/${locale}${path}`);

  const PILARES = [
    {
      title: t('Experiências Autorais'),
      tag: t('CURADORIA EXCLUSIVA'),
      desc: t('Vivências imersivas criadas por quem conhece a fundo a cultura local: do hanbok sob medida às aulas de cerâmica e makgeolli artesanal.'),
      href: '/coreia-do-sul/experiencias',
      img: 'https://images.unsplash.com/photo-1537716414232-56d60fa8fc36?q=80&w=800',
      icon: Compass,
    },
    {
      title: t('K-Beauty & Bem-Estar'),
      tag: t('CUIDADO & ESTÉTICA'),
      desc: t('Imersão completa na filosofia do skincare coreano, clínicas de alta tecnologia em Gangnam e rituais tradicionais de bem-estar.'),
      href: '/coreia-do-sul/k-beauty',
      img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800',
      icon: Sparkles,
    },
    {
      title: t('Intercâmbio de Idiomas'),
      tag: t('ESTUDO & IMERSÃO'),
      desc: t('Aprenda coreano com metodologia de excelência na Lexis Korea com campi em Gangnam e Busan, com suporte e acolhimento total.'),
      href: '/coreia-do-sul/intercambio',
      img: 'https://images.unsplash.com/photo-1578489758854-f134a358f08b?q=80&w=800',
      icon: GraduationCap,
    },
    {
      title: t('Jornadas em Grupo'),
      tag: t('ROTEIROS COMPLETOS'),
      desc: t('Roteiros com saídas especiais desenhados para grupos seletos, acompanhamento em português e experiências transformadoras.'),
      href: '/coreia-do-sul/jornadas',
      img: 'https://images.unsplash.com/photo-1534270804883-8b1b5e7f2e2b?q=80&w=800',
      icon: Users,
    },
  ];

  const REGIOES = [
    {
      name: 'Seul (Seoul)',
      tag: t('A CAPITAL'),
      desc: t('Palácios históricos da dinastia Joseon dividem espaço com a alta tecnologia, cafés de vanguarda e a energia vibrante de Hongdae e Gangnam.'),
      highlights: [t('Palácio Gyeongbokgung'), t('Bukchon Hanok Village'), t('Rio Han'), t('Myeongdong & K-Beauty')],
    },
    {
      name: 'Busan',
      tag: t('O LITORAL'),
      desc: t('A cidade costeira mais fascinante da Ásia. Templos à beira-mar, a vila colorida de Gamcheon, praias de Haeundae e frutos do mar frescos.'),
      highlights: [t('Gamcheon Culture Village'), t('Templo Haedong Yonggungsa'), t('Praia Haeundae'), t('Sky Capsule')],
    },
    {
      name: 'Gyeongju & Daegu',
      tag: t('A HISTÓRIA VIVA'),
      desc: t('A antiga capital do reino de Silla, conhecida como o museu a céu aberto da Coreia, com tumbas reais milenares e templos sagrados.'),
      highlights: [t('Templo Bulguksa'), t('Parque Daereungwon'), t('Ponte Woljeonggyo'), t('Cultura Tradicional')],
    },
    {
      name: 'Ilha de Jeju',
      tag: t('NATUREZA DA UNESCO'),
      desc: t('Paisagens vulcânicas, campos de chá verde, cachoeiras cristalinas e o famoso Monte Hallasan em uma ilha de beleza cinematográfica.'),
      highlights: [t('Seongsan Ilchulbong'), t('Campos de Chá Osulloc'), t('Cachoeira Cheonjiyeon'), t('Túneis de Lava Manjanggul')],
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#0F0A08] text-[#EFEBE4] font-sans selection:bg-[#C8A27C] selection:text-[#0F0A08]">
      <Header />

      {/* 1. HERO SECTION */}
      <section className="relative min-h-[90vh] flex flex-col justify-center overflow-hidden border-b border-[#3D2620]">
        <div className="absolute inset-0 z-0">
          <Image
            src={heroDesktop}
            alt={t('Coreia do Sul com a Maeum Global')}
            fill
            className="object-cover object-center brightness-[0.75]"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0A08] via-[#0F0A08]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F0A08] via-[#0F0A08]/80 to-transparent w-full lg:w-2/3" />
        </div>

        <div className="relative z-10 px-6 sm:px-12 max-w-[1400px] mx-auto w-full flex flex-col items-start gap-6 pt-28 md:pt-40 pb-20">
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#C8A27C] font-semibold flex items-center gap-2">
            <span className="w-8 h-px bg-[#C8A27C]" />
            {t('DESTINO PRINCIPAL MAEUM GLOBAL')}
          </span>
          <h1 className="font-heading text-5xl sm:text-6xl md:text-[76px] font-light tracking-wide leading-[1.1] text-white max-w-4xl">
            {t('Coreia do Sul')} <br />
            <span className="italic text-[#C8A27C]">{t('da tradição milenar')}</span> <br />
            {t('ao futuro extraordinário.')}
          </h1>
          <p className="text-[13px] sm:text-sm text-gray-300 max-w-2xl font-light leading-relaxed opacity-90">
            {t('Conhecer a Coreia com a Maeum Global é ir além do turismo comum. Nossa curadoria autoral conecta você à essência do país através de pequenos grupos, atendimento integral em português e parcerias com quem vive e ama a Coreia.')}
          </p>

          <div className="flex flex-wrap gap-4 mt-4">
            <Link
              href={lp('/coreia-do-sul/jornadas')}
              className="flex items-center justify-center gap-3 bg-[#C8A27C] hover:bg-[#B8906C] text-[#0F0A08] font-bold text-[10px] py-4 px-8 rounded-none transition-all uppercase tracking-widest group"
            >
              {t('VER JORNADAS DISPONÍVEIS')}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href={lp('/coreia-do-sul/experiencias')}
              className="flex items-center justify-center gap-3 bg-transparent border border-[#C8A27C] text-[#C8A27C] hover:bg-[#C8A27C]/10 font-bold text-[10px] py-4 px-8 rounded-none transition-all uppercase tracking-widest"
            >
              <Compass className="w-4 h-4" />
              {t('EXPERIÊNCIAS AUTORAIS')}
            </Link>
          </div>
        </div>
      </section>

      {/* 2. OS 4 PILARES DA MAEUM */}
      <section className="py-24 px-6 sm:px-12 max-w-[1400px] mx-auto w-full">
        <div className="text-center mb-16 flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#C8A27C] font-semibold block mb-3">
            {t('COMO VOCÊ DESEJA VIVER A COREIA')}
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-light text-white leading-tight">
            {t('Quatro maneiras exclusivas de viver o país')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PILARES.map((pilar) => {
            const Icon = pilar.icon;
            return (
              <Link
                key={pilar.title}
                href={lp(pilar.href)}
                className="group bg-[#150E0C] border border-[#3D2620] hover:border-[#C8A27C]/60 flex flex-col rounded-sm overflow-hidden transition-all duration-300"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  <Image
                    src={pilar.img}
                    alt={pilar.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-3 left-3 bg-[#0F0A08]/80 backdrop-blur-sm text-[#C8A27C] text-[8px] font-bold tracking-widest px-2.5 py-1 rounded-sm uppercase border border-[#C8A27C]/30">
                    {pilar.tag}
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 text-[#C8A27C] mb-2">
                    <Icon className="w-4 h-4" />
                    <span className="font-heading text-lg text-white font-medium group-hover:text-[#C8A27C] transition-colors">
                      {pilar.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-light leading-relaxed mb-6 flex-1">
                    {pilar.desc}
                  </p>
                  <div className="pt-4 border-t border-[#3D2620] flex items-center justify-between text-[9px] font-bold text-[#C8A27C] uppercase tracking-widest group-hover:text-white transition-colors">
                    <span>{t('Explorar')}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. AS REGIÕES DA COREIA */}
      <section className="py-20 px-6 sm:px-12 max-w-[1400px] mx-auto w-full border-t border-[#3D2620]">
        <div className="text-center mb-16 flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#C8A27C] font-semibold block mb-3">
            {t('EXPLORE CADA REGIÃO')}
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-light text-white leading-tight">
            {t('Contrastes que encantam em cada cidade')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {REGIOES.map((reg) => (
            <div key={reg.name} className="bg-[#18110F] border border-[#3D2620] p-6 rounded-sm flex flex-col">
              <span className="text-[9px] text-[#C8A27C] font-bold uppercase tracking-widest mb-1">{reg.tag}</span>
              <h3 className="font-heading text-xl text-white font-medium mb-3">{reg.name}</h3>
              <p className="text-[11px] text-gray-400 font-light leading-relaxed mb-6 flex-1">{reg.desc}</p>
              <div className="border-t border-[#3D2620] pt-4">
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block mb-2">{t('Destaques:')}</span>
                <ul className="space-y-1 text-[10px] text-gray-300 font-light">
                  {reg.highlights.map((h, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-[#C8A27C]" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. PLANEJE SUA VIAGEM PERSONALIZADA */}
      <section className="py-24 px-6 sm:px-12 max-w-[1400px] mx-auto w-full border-t border-[#3D2620]">
        <div className="bg-[#150E0C] border border-[#3D2620] rounded-sm p-8 sm:p-12 flex flex-col shadow-2xl">
          <div className="flex flex-col lg:flex-row gap-12 mb-8">
            <div className="lg:w-1/3 flex flex-col gap-4">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-bold">
                {t('PLANEJAMENTO AUTORAL')}
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl font-light text-white leading-tight">
                {t('Pronto para viver a sua Coreia?')}
              </h2>
              <p className="text-[12px] text-gray-400 font-light leading-relaxed mt-2">
                {t('Preencha os detalhes da sua viagem e nossa equipe de consultoras entrará em contato para desenhar o seu roteiro sob medida.')}
              </p>
            </div>
            <div className="lg:w-2/3">
              <TripPlanner />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
