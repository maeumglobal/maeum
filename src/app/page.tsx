'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowRight, Calendar, Users, Heart, 
  Award, ShieldCheck, Headphones, Compass, Star, MapPin 
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TripPlanner from '@/components/TripPlanner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMedia } from '@/contexts/SiteContentContext';

export default function HomePage() {
  const { t, locale } = useLanguage();
  const lp = (path: string) => (locale === 'pt' || path === '/' ? path : `/${locale}${path}`);
  const homeHeroDesktop = useMedia('home_hero_desktop');
  const homeHeroMobile = useMedia('home_hero_mobile');
  const homeCardArmy = useMedia('home_card_1_army');
  const homeCardHorizon = useMedia('home_card_2_horizon');
  const homeCardCheotnun = useMedia('home_card_3_cheotnun');
  const homePartnershipImage = useMedia('home_partnership_image');
  return (
    <div className="flex flex-col min-h-screen bg-[#0F0A08] text-[#EFEBE4] font-sans selection:bg-[#C8A27C] selection:text-[#0F0A08]">
      <Header />

      {/* 1. Hero Section */}
      <section className="relative min-h-[100dvh] flex flex-col justify-center overflow-hidden border-b border-[#3D2620]">
        <div className="absolute inset-0 z-0">
          <Image 
            src={homeHeroDesktop} 
            alt={t('Coreia com Profundidade Desktop')} 
            fill 
            className="object-cover object-center hidden md:block" 
            priority
            quality={100}
            unoptimized
          />
          <Image 
            src={homeHeroMobile} 
            alt={t('Coreia com Profundidade Mobile')} 
            fill 
            className="object-cover object-center block md:hidden" 
            priority
            quality={100}
            unoptimized
          />
        </div>

        <div className="relative z-10 px-6 sm:px-12 max-w-[1400px] mx-auto w-full flex flex-col items-start gap-5 pt-32 sm:pt-36 md:pt-40 pb-36 sm:pb-44 md:pb-52">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold">
            {t('COREIA COM PROFUNDIDADE')}
          </span>
          <h1 className="font-heading text-5xl sm:text-6xl md:text-[80px] font-light tracking-wide leading-[1.1] text-white">
            {t('Mais vivência.')} <br />
            {t('Menos roteiro.')}<br />
            <span className="italic text-[#C8A27C]">{t('Só o que importa.')}</span>
          </h1>
          <p className="text-[13px] text-gray-300 max-w-[500px] font-light text-left leading-relaxed opacity-90 mt-4">
            {t('Experiências autorais criadas com quem vive a Coreia.')} <br/>
            {t('Você não vem apenas como turista.')}<br/>
            {t('Você vive como parte da história.')}
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-6 mt-6">
            <Link href={lp('/experiencias')} className="flex items-center justify-center gap-3 bg-[#C8A27C] hover:bg-[#B8906C] text-[#0F0A08] font-bold text-[10px] py-4 px-8 rounded-none transition-all group uppercase tracking-widest">
              {t('EXPLORAR EXPERIÊNCIAS')}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href={lp('/sobre')} className="text-[10px] text-white hover:text-[#C8A27C] font-bold uppercase tracking-widest border-b border-white/30 hover:border-[#C8A27C] pb-1 transition-colors">
              {t('CONHEÇA A MAEUM')}
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Planning Box */}
      <section className="relative z-20 px-6 sm:px-12 max-w-[1400px] mx-auto w-full -mt-20 sm:-mt-24 lg:-mt-28 mb-24">
        <div className="bg-[#150E0C] border border-[#3D2620] rounded-sm p-8 sm:p-12 flex flex-col shadow-2xl">
          
          <div className="flex flex-col lg:flex-row gap-12 mb-10">
            {/* Left Col */}
            <div className="lg:w-1/3 flex flex-col gap-4">
              <h2 className="font-heading text-3xl sm:text-4xl font-light text-white leading-tight">
                {t('Planeje sua viagem do seu jeito.')}
              </h2>
              <p className="text-[12px] text-gray-400 font-light mt-4 leading-relaxed">
                {t('Nos conte o que você imagina. Nós cuidamos de cada detalhe.')}
              </p>
            </div>

            {/* Right Col - Form */}
            <div className="lg:w-2/3">
              <TripPlanner />
            </div>
          </div>

          <div className="border-t border-[#3D2620] pt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-4">
              <Award className="w-8 h-8 text-[#C8A27C] shrink-0 stroke-[1.5]" />
              <div className="flex flex-col">
                <span className="text-[10px] text-white font-bold mb-1">{t('Especialistas locais')}</span>
                <span className="text-[10px] text-gray-400 leading-snug">{t('Quem vive, conhece e seleciona.')}</span>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <ShieldCheck className="w-8 h-8 text-[#C8A27C] shrink-0 stroke-[1.5]" />
              <div className="flex flex-col">
                <span className="text-[10px] text-white font-bold mb-1">{t('Roteiros 100% personalizados')}</span>
                <span className="text-[10px] text-gray-400 leading-snug">{t('Nada engessado, tudo com intenção.')}</span>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Headphones className="w-8 h-8 text-[#C8A27C] shrink-0 stroke-[1.5]" />
              <div className="flex flex-col">
                <span className="text-[10px] text-white font-bold mb-1">{t('Acompanhamento 24/7')}</span>
                <span className="text-[10px] text-gray-400 leading-snug">{t('Antes, durante e depois da viagem.')}</span>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Heart className="w-8 h-8 text-[#C8A27C] shrink-0 stroke-[1.5]" />
              <div className="flex flex-col">
                <span className="text-[10px] text-white font-bold mb-1">{t('Experiências autênticas')}</span>
                <span className="text-[10px] text-gray-400 leading-snug">{t('Cultura, pessoas e lugares além do óbvio.')}</span>
              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* 3. Jornadas Que Marcam */}
      <section className="py-16 px-6 sm:px-12 max-w-[1400px] mx-auto w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-12">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold">
              {t('JORNADAS QUE MARCAM')}
            </span>
            <h2 className="font-heading text-4xl sm:text-5xl font-light text-white leading-tight">
              {t('Viagens que viram')} <br/>
              <span className="italic text-[#C8A27C]">{t('histórias')}</span> {t('pra sempre.')}
            </h2>
          </div>
          <Link href={lp('/jornadas')} className="flex items-center justify-center gap-3 bg-transparent border border-[#3D2620] hover:border-[#C8A27C] text-[#C8A27C] font-bold text-[10px] py-3.5 px-6 rounded-none transition-all group uppercase tracking-widest shrink-0">
            {t('VER TODAS AS JORNADAS')}
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div className="group border border-[#3D2620] rounded-sm overflow-hidden flex flex-col bg-[#150E0C] hover:border-[#C8A27C]/50 transition-colors cursor-pointer">
            <div className="relative h-[240px] w-full overflow-hidden">
              <Image src={homeCardArmy} alt="Projeto ARMY 2027" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute top-4 left-4 bg-[#C8A27C] text-[#0F0A08] text-[9px] font-bold px-3 py-1.5 uppercase tracking-widest">
                {t('MAIS ESCOLHIDA')}
              </div>
            </div>
            <div className="p-8 flex flex-col flex-1">
              <div className="flex items-center gap-2 text-[10px] text-[#C8A27C] font-bold uppercase tracking-widest mb-4">
                <Users className="w-3 h-3" /> {t('GRUPOS EXCLUSIVOS')}
              </div>
              <h3 className="font-heading text-2xl text-white font-light mb-4 group-hover:text-[#C8A27C] transition-colors">
                {t('Projeto ARMY 2027 Always Destination')}
              </h3>
              <div className="flex items-center gap-3 text-[10px] text-gray-400 font-bold tracking-widest mb-6">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {t('15 DIAS')}</span>
                <span className="text-[#3D2620]">|</span>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {t('SEUL • BUSAN • JEJU')}</span>
              </div>
              <p className="text-[12px] text-gray-400 font-light leading-relaxed mb-8 flex-1">
                {t('Uma jornada feita para ARMYs que sonham em viver a Coreia de forma inesquecível.')}
              </p>
              <div className="flex items-center justify-between text-[#C8A27C] font-bold text-[10px] tracking-widest uppercase">
                <span>{t('A PARTIR DE')} R$ 39.000/{t('PESSOA')}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="group border border-[#3D2620] rounded-sm overflow-hidden flex flex-col bg-[#150E0C] hover:border-[#C8A27C]/50 transition-colors cursor-pointer">
            <div className="relative h-[240px] w-full overflow-hidden">
              <Image src={homeCardHorizon} alt="The Horizon of Seven" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute top-4 left-4 bg-[#8A3324] text-white text-[9px] font-bold px-3 py-1.5 uppercase tracking-widest">
                {t('NOVIDADE')}
              </div>
            </div>
            <div className="p-8 flex flex-col flex-1">
              <div className="flex items-center gap-2 text-[10px] text-[#C8A27C] font-bold uppercase tracking-widest mb-4">
                <Star className="w-3 h-3" /> {t('EXPERIÊNCIA IMERSIVA')}
              </div>
              <h3 className="font-heading text-2xl text-white font-light mb-4 group-hover:text-[#C8A27C] transition-colors">
                {t('The Horizon of Seven')}<br/>{t('Jeju Edition')}
              </h3>
              <div className="flex items-center gap-3 text-[10px] text-gray-400 font-bold tracking-widest mb-6">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {t('16 DIAS')}</span>
                <span className="text-[#3D2620]">|</span>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {t('SEUL • BUSAN • JEJU')}</span>
              </div>
              <p className="text-[12px] text-gray-400 font-light leading-relaxed mb-8 flex-1">
                {t('Natureza, cultura e momentos únicos na ilha mais encantadora da Coreia do Sul.')}
              </p>
              <div className="flex items-center justify-between text-[#C8A27C] font-bold text-[10px] tracking-widest uppercase">
                <span>{t('A PARTIR DE')} R$ 42.000/{t('PESSOA')}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="group border border-[#3D2620] rounded-sm overflow-hidden flex flex-col bg-[#150E0C] hover:border-[#C8A27C]/50 transition-colors cursor-pointer">
            <div className="relative h-[240px] w-full overflow-hidden">
              <Image src={homeCardCheotnun} alt="Cheotnun" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute top-4 left-4 bg-[#C8A27C] text-[#0F0A08] text-[9px] font-bold px-3 py-1.5 uppercase tracking-widest">
                {t('EXCLUSIVO')}
              </div>
            </div>
            <div className="p-8 flex flex-col flex-1">
              <div className="flex items-center gap-2 text-[10px] text-[#C8A27C] font-bold uppercase tracking-widest mb-4">
                <Heart className="w-3 h-3" /> {t('VIAGEM ÍNTIMA')}
              </div>
              <h3 className="font-heading text-2xl text-white font-light mb-4 group-hover:text-[#C8A27C] transition-colors">
                {t('Cheotnun — A Magia')}<br/>{t('da Primeira Neve')}
              </h3>
              <div className="flex items-center gap-3 text-[10px] text-gray-400 font-bold tracking-widest mb-6">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {t('10 DIAS')}</span>
                <span className="text-[#3D2620]">|</span>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {t('SEUL')}</span>
              </div>
              <p className="text-[12px] text-gray-400 font-light leading-relaxed mb-8 flex-1">
                {t('Um roteiro exclusivo para viver o inverno coreano de forma mágica e acolhedora.')}
              </p>
              <div className="flex items-center justify-between text-[#C8A27C] font-bold text-[10px] tracking-widest uppercase">
                <span>{t('A PARTIR DE')} R$ 32.000/{t('PESSOA')}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. Partnership */}
      <section className="py-24 px-6 sm:px-12 max-w-[1400px] mx-auto w-full">
        <div className="border border-[#3D2620] bg-[#150E0C] rounded-sm flex flex-col">
          
          <div className="flex flex-col lg:flex-row">
            <div className="p-10 sm:p-16 flex-1 flex flex-col justify-center">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-bold mb-4">
                {t('PARCERIA OFICIAL')}
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl font-light text-white mb-2">
                {t('Maeum Global × Cheotnun')}
              </h2>
              <h3 className="font-heading text-2xl font-light text-[#C8A27C] italic mb-6">
                {t('A beleza da Coreia faz parte da sua jornada.')}
              </h3>
              <p className="text-[12px] text-gray-400 font-light leading-relaxed max-w-lg mb-10">
                {t('Em parceria com a Cheotnun, referência em experiências K-Beauty, oferecemos acesso a clínicas selecionadas, análises de pele, workshops e tratamentos exclusivos para cuidar de você por dentro e por fora — do seu jeito, no seu tempo.')}
              </p>
              <div className="flex items-center gap-8">
                <div className="flex flex-col items-center gap-2">
                  <Image
                    src="/images/logo.png"
                    alt="Maeum Global"
                    width={90}
                    height={40}
                    className="h-10 w-auto object-contain"
                  />
                  <span className="text-[9px] tracking-[0.2em] text-[#C8A27C] uppercase font-bold">{t('MAEUM')}</span>
                </div>
                <span className="text-[#3D2620] text-2xl font-light">×</span>
                <div className="flex flex-col items-center gap-2">
                  <Image
                    src="/images/cheotnun-k-beauty-logo-oficial.webp"
                    alt="Cheotnun K-Beauty"
                    width={120}
                    height={40}
                    className="h-10 w-auto object-contain"
                  />
                  <span className="text-[9px] tracking-[0.2em] text-gray-500 uppercase">{t('K-BEAUTY EXPERIENCE')}</span>
                </div>
              </div>
            </div>
            <div className="lg:w-[45%] relative min-h-[400px] lg:min-h-auto border-l border-[#3D2620]">
              <Image src={homePartnershipImage} alt="K-Beauty Experience" fill className="object-cover" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-[#3D2620]">
            <div className="p-8 border-b sm:border-b-0 sm:border-r border-[#3D2620] flex flex-col items-center text-center gap-3">
              <Compass className="w-6 h-6 text-[#C8A27C]" strokeWidth={1.5} />
              <span className="text-[9px] font-bold text-[#C8A27C] uppercase tracking-widest">{t('EXPERIÊNCIAS K-BEAUTY')}</span>
              <span className="text-[10px] text-gray-400 font-light leading-relaxed">{t('Tratamentos, workshops e vivências cuidadosamente selecionadas.')}</span>
            </div>
            <div className="p-8 border-b lg:border-b-0 lg:border-r border-[#3D2620] flex flex-col items-center text-center gap-3">
              <ShieldCheck className="w-6 h-6 text-[#C8A27C]" strokeWidth={1.5} />
              <span className="text-[9px] font-bold text-[#C8A27C] uppercase tracking-widest">{t('ACESSO EXCLUSIVO')}</span>
              <span className="text-[10px] text-gray-400 font-light leading-relaxed">{t('Clínicas e profissionais de excelência com acesso privilegiado.')}</span>
            </div>
            <div className="p-8 border-b sm:border-b-0 sm:border-r border-[#3D2620] flex flex-col items-center text-center gap-3">
              <Award className="w-6 h-6 text-[#C8A27C]" strokeWidth={1.5} />
              <span className="text-[9px] font-bold text-[#C8A27C] uppercase tracking-widest">{t('CURADORIA PREMIUM')}</span>
              <span className="text-[10px] text-gray-400 font-light leading-relaxed">{t('Cada experiência é escolhida para representar o melhor da beleza coreana.')}</span>
            </div>
            <div className="p-8 flex flex-col items-center text-center gap-3">
              <Star className="w-6 h-6 text-[#C8A27C]" strokeWidth={1.5} />
              <span className="text-[9px] font-bold text-[#C8A27C] uppercase tracking-widest">{t('BELEZA & CULTURA')}</span>
              <span className="text-[10px] text-gray-400 font-light leading-relaxed">{t('Bem-estar que conecta corpo, mente e tradição coreana.')}</span>
            </div>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}
