'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight, Heart, Diamond, ShieldCheck, Sun, Star, 
  Mail, BarChart, Handshake, Users
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMedia } from '@/contexts/SiteContentContext';

export default function SobreNosPage() {
  const { t, locale } = useLanguage();
  const heroDesktop = useMedia('sobre_nos_hero_desktop');
  const heroMobile = useMedia('sobre_nos_hero_mobile');
  const parceriaImage = useMedia('sobre_nos_parceria_image');
  const lp = (path: string) => (locale === 'pt' || path === '/' ? path : `/${locale}${path}`);
  return (
    <div className="flex flex-col min-h-screen bg-[#0F0A08] text-[#EFEBE4] font-sans selection:bg-[#C8A27C] selection:text-[#0F0A08]">
      <Header />

      {/* 1. Hero Section */}
      <section className="relative min-h-[100dvh] flex flex-col justify-center overflow-hidden border-b border-[#3D2620]">
        <div className="absolute inset-0 z-0">
          <Image 
            src={heroDesktop} 
            alt={t('Agência Maeum Desktop')} 
            fill 
            className="object-cover object-center hidden md:block" 
            priority
          />
          <Image 
            src={heroMobile} 
            alt={t('Agência Maeum Mobile')} 
            fill 
            className="object-cover object-center block md:hidden" 
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F0A08] via-[#0F0A08]/80 to-transparent w-full sm:w-2/3" />
        </div>

        <div className="relative z-10 px-6 sm:px-12 max-w-7xl mx-auto w-full flex flex-col items-start gap-6 pt-24">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold">
            {t('SOBRE A MAEUM GLOBAL')}
          </span>
          <h1 className="font-heading text-5xl sm:text-6xl md:text-[70px] font-light tracking-wide leading-[1.1] text-white">
            {t('Muito mais que')} <br />
            {t('viagens. Criamos')} <br />
            <span className="italic text-[#C8A27C]">{t('conexões que transformam.')}</span>
          </h1>
          <div className="w-12 h-[1px] bg-[#C8A27C] my-2"></div>
          <p className="text-[12px] sm:text-[13px] text-gray-300 max-w-xl font-light text-left leading-relaxed opacity-90">
            {t('A Maeum Global nasceu do desejo de proporcionar experiências autênticas, profundas e transformadoras na Coreia do Sul.')}
            <br/><br/>
            {t('Acreditamos que cada viagem é única e deve refletir a essência de quem viaja. Por isso, cada roteiro é cuidadosamente planejado, com curadoria premium e atenção a cada detalhe.')}
          </p>
          <div className="mt-4">
            <Link href={lp('/jornadas')} className="flex items-center justify-center gap-3 bg-transparent border border-[#C8A27C] text-[#C8A27C] hover:bg-[#C8A27C] hover:text-[#0F0A08] font-bold text-[10px] py-4 px-8 rounded-none transition-all group uppercase tracking-widest w-fit mt-4">
              {t('CONHEÇA NOSSAS JORNADAS')}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* 2. NOSSOS VALORES */}
      <section className="py-24 px-6 sm:px-12 max-w-[1400px] mx-auto w-full">
        <div className="text-center mb-16">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold flex items-center justify-center gap-3">
            <span className="w-12 h-[1px] bg-[#C8A27C]/30"></span>
            {t('NOSSOS VALORES')}
            <span className="w-12 h-[1px] bg-[#C8A27C]/30"></span>
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="flex flex-col items-center text-center gap-4">
            <Heart className="w-8 h-8 text-[#C8A27C] stroke-1" />
            <h4 className="text-[10px] font-bold text-[#C8A27C] tracking-widest uppercase">{t('PROPÓSITO')}</h4>
            <p className="text-[10px] text-gray-400 font-light leading-relaxed px-2">{t('Criar experiências que conectam pessoas, culturas e histórias.')}</p>
          </div>
          <div className="flex flex-col items-center text-center gap-4">
            <Diamond className="w-8 h-8 text-[#C8A27C] stroke-1" />
            <h4 className="text-[10px] font-bold text-[#C8A27C] tracking-widest uppercase">{t('EXCLUSIVIDADE')}</h4>
            <p className="text-[10px] text-gray-400 font-light leading-relaxed px-2">{t('Grupos pequenos, roteiros autorais e acesso a experiências únicas.')}</p>
          </div>
          <div className="flex flex-col items-center text-center gap-4">
            <ShieldCheck className="w-8 h-8 text-[#C8A27C] stroke-1" />
            <h4 className="text-[10px] font-bold text-[#C8A27C] tracking-widest uppercase">{t('CONFIANÇA')}</h4>
            <p className="text-[10px] text-gray-400 font-light leading-relaxed px-2">{t('Acompanhamento desde o Brasil e suporte completo durante toda a jornada.')}</p>
          </div>
          <div className="flex flex-col items-center text-center gap-4">
            <Sun className="w-8 h-8 text-[#C8A27C] stroke-1" />
            <h4 className="text-[10px] font-bold text-[#C8A27C] tracking-widest uppercase">{t('AUTENTICIDADE')}</h4>
            <p className="text-[10px] text-gray-400 font-light leading-relaxed px-2">{t('Parcerias locais selecionadas e vivências além dos roteiros tradicionais.')}</p>
          </div>
          <div className="flex flex-col items-center text-center gap-4">
            <Star className="w-8 h-8 text-[#C8A27C] stroke-1" />
            <h4 className="text-[10px] font-bold text-[#C8A27C] tracking-widest uppercase">{t('EXCELÊNCIA')}</h4>
            <p className="text-[10px] text-gray-400 font-light leading-relaxed px-2">{t('Padrão premium em cada detalhe da sua viagem.')}</p>
          </div>
        </div>

        {/* Metricas */}
        <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-6 border border-[#3D2620] p-10 bg-[#150D0B] rounded-sm divide-x divide-[#3D2620]/50">
          <div className="flex flex-col items-center text-center">
            <span className="font-heading text-4xl text-[#C8A27C] mb-2">+800</span>
            <span className="text-[9px] text-gray-400 tracking-widest uppercase font-medium">{t('VIAJANTES REALIZADOS')}</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="font-heading text-4xl text-[#C8A27C] mb-2">98%</span>
            <span className="text-[9px] text-gray-400 tracking-widest uppercase font-medium">{t('SATISFAÇÃO')}</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="font-heading text-4xl text-[#C8A27C] mb-2">+30</span>
            <span className="text-[9px] text-gray-400 tracking-widest uppercase font-medium">{t('EXPERIÊNCIAS EXCLUSIVAS')}</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="font-heading text-4xl text-[#C8A27C] mb-2 flex items-center gap-2">
              5 <Star className="w-6 h-6 fill-[#C8A27C] text-[#C8A27C]" />
            </span>
            <span className="text-[9px] text-gray-400 tracking-widest uppercase font-medium">{t('AVALIAÇÃO MÉDIA')}</span>
          </div>
        </div>
      </section>

      {/* 3. NOSSOS PARCEIROS */}
      <section className="py-20 px-6 sm:px-12 max-w-[1400px] mx-auto w-full">
        <div className="text-center mb-12">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold flex items-center justify-center gap-3 mb-4">
            <span className="w-12 h-[1px] bg-[#C8A27C]/30"></span>
            {t('NOSSOS PARCEIROS')}
            <span className="w-12 h-[1px] bg-[#C8A27C]/30"></span>
          </span>
          <p className="text-[11px] text-gray-400 font-light max-w-2xl mx-auto">
            {t('Trabalhamos com marcas e profissionais que compartilham dos nossos valores e garantem experiências autênticas, seguras e memoráveis.')}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="border border-[#3D2620] h-28 bg-[#18110F] flex flex-col items-center justify-center gap-1 rounded-sm opacity-80 hover:opacity-100 transition-opacity">
            <span className="font-heading text-xl text-white">Cheotnun</span>
            <span className="text-[7px] text-gray-500 uppercase tracking-widest">{t('K-BEAUTY EXPERIENCE')}</span>
          </div>
          <div className="border border-[#3D2620] h-28 bg-[#18110F] flex flex-col items-center justify-center gap-1 rounded-sm opacity-80 hover:opacity-100 transition-opacity">
            <span className="font-heading text-xl text-white tracking-widest uppercase">TRIPPER</span>
            <span className="text-[7px] text-gray-500 uppercase tracking-widest">{t('PERFUMARIA COREANA')}</span>
          </div>
          <div className="border border-[#3D2620] h-28 bg-[#18110F] flex flex-col items-center justify-center gap-1 rounded-sm opacity-80 hover:opacity-100 transition-opacity">
            <div className="w-6 h-6 border border-white/20 rotate-45 mb-1"></div>
            <span className="text-[9px] text-white tracking-wider">HANBOK BY DESIGNER</span>
          </div>
          <div className="border border-[#3D2620] h-28 bg-[#18110F] flex flex-col items-center justify-center gap-1 rounded-sm opacity-80 hover:opacity-100 transition-opacity">
            <span className="font-heading text-lg text-white">INFINITY SEGUROS</span>
          </div>
          <div className="border border-[#3D2620] h-28 bg-[#18110F] flex flex-col items-center justify-center gap-1 rounded-sm opacity-80 hover:opacity-100 transition-opacity">
            <span className="font-heading text-xl text-white">Lexis Korea</span>
            <span className="text-[7px] text-gray-500 uppercase tracking-widest">{t('ESCOLA DE IDIOMAS')}</span>
          </div>
          <div className="border border-[#3D2620] h-28 bg-[#18110F] flex flex-col items-center justify-center gap-1 rounded-sm opacity-80 hover:opacity-100 transition-opacity">
            <span className="font-heading text-xl text-white font-bold italic">KORAIL</span>
            <span className="text-[7px] text-gray-500 uppercase tracking-widest">{t('KTX TRENS')}</span>
          </div>
        </div>

        <div className="flex justify-center mt-12">
          <Link href={lp('/contato')} className="flex items-center justify-center gap-2 text-[#C8A27C] hover:text-white transition-colors text-[9px] font-bold uppercase tracking-widest group w-fit mx-auto mt-12">
            {t('CONHEÇA NOSSOS PARCEIROS')}
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* 4. CTA PARCERIA */}
      <section className="py-20 px-6 sm:px-12 max-w-[1400px] mx-auto w-full">
        <div className="bg-[#1A1110] border border-[#3D2620] flex flex-col lg:flex-row overflow-hidden rounded-sm">
          <div className="lg:w-1/2 relative min-h-[400px]">
             <Image src={parceriaImage} alt={t('Handshake')} fill className="object-cover" />
             <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#1A1110]" />
          </div>
          <div className="lg:w-1/2 p-12 lg:p-16 flex flex-col justify-center relative">
            <span className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold mb-4">
              {t('VAMOS CRIAR ALGO EXTRAORDINÁRIO JUNTOS?')}
            </span>
            <h2 className="font-heading text-3xl font-light text-white leading-tight mb-6">
              {t('Se você representa uma marca, negócio ou oferece experiências na Coreia, vamos conversar.')}
            </h2>
            <p className="text-[11px] text-gray-400 font-light mb-8 leading-relaxed">
              {t('A Maeum Global está sempre aberta a novas parcerias que acrescentem valor às nossas jornadas.')}
              {t(' Se você deseja promover sua marca, produto ou serviço para um público seleto e altamente engajado, entre em contato conosco.')}
            </p>
            
            <div className="border border-[#3D2620] p-6 rounded-sm bg-[#120B0A] flex items-center gap-4 mb-8">
               <Mail className="w-6 h-6 text-[#C8A27C]" strokeWidth={1.5} />
               <div>
                  <span className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">{t('Envie sua proposta para:')}</span>
                  <a href="mailto:comercial@maeumglobal.com" className="text-sm font-semibold text-[#C8A27C] hover:text-white transition-colors">
                    comercial@maeumglobal.com
                  </a>
               </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 border-t border-[#3D2620]/50 pt-6">
               <div className="flex items-start gap-3 flex-1">
                 <BarChart className="w-4 h-4 text-[#C8A27C] shrink-0 mt-0.5" strokeWidth={1.5} />
                 <div>
                   <span className="block text-[9px] text-white font-semibold uppercase tracking-widest mb-1">{t('VISIBILIDADE')}</span>
                   <p className="text-[9px] text-gray-500 font-light leading-tight">{t('Exposição para um público seleto e qualificado.')}</p>
                 </div>
               </div>
               <div className="flex items-start gap-3 flex-1">
                 <Star className="w-4 h-4 text-[#C8A27C] shrink-0 mt-0.5" strokeWidth={1.5} />
                 <div>
                   <span className="block text-[9px] text-white font-semibold uppercase tracking-widest mb-1">{t('PARCERIAS REAIS')}</span>
                   <p className="text-[9px] text-gray-500 font-light leading-tight">{t('Trabalhamos juntos para criar experiências únicas.')}</p>
                 </div>
               </div>
               <div className="flex items-start gap-3 flex-1">
                 <Handshake className="w-4 h-4 text-[#C8A27C] shrink-0 mt-0.5" strokeWidth={1.5} />
                 <div>
                   <span className="block text-[9px] text-white font-semibold uppercase tracking-widest mb-1">{t('CONEXÕES')}</span>
                   <p className="text-[9px] text-gray-500 font-light leading-tight">{t('Fortalecemos culturas, negócios e pessoas.')}</p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer minimal signature */}
      <div className="text-center pb-8 opacity-50 flex items-center justify-center gap-4 border-t border-[#3D2620] mt-12 pt-8 w-full max-w-[1400px] mx-auto">
         <Sun className="w-3 h-3 text-[#C8A27C]" />
         <span className="text-[9px] text-[#C8A27C] tracking-[0.3em] uppercase">{t('MAEUM GLOBAL — SUA HISTÓRIA NA COREIA, DO SEU JEITO, COM EXCELÊNCIA.')}</span>
      </div>
    </div>
  );
}
