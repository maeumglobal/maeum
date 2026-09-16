'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  MessageSquare, CalendarCheck, MessageCircle, Clock, ShieldCheck, 
  Users, Heart, Phone, Mail, Camera, MapPin, Search, PhoneCall, 
  Video, MoreVertical, Paperclip, Send, ArrowRight, CheckCheck, 
  Briefcase, Gift, Award
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ClientChatWidget from '@/components/chat/ClientChatWidget';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMedia } from '@/contexts/SiteContentContext';

export default function ContatoPage() {
  const { t, locale } = useLanguage();
  const heroDesktop = useMedia('contato_hero_desktop');
  const heroMobile = useMedia('contato_hero_mobile');
  const lp = (path: string) => (locale === 'pt' || path === '/' ? path : `/${locale}${path}`);
  return (
    <div className="flex flex-col min-h-screen bg-[#0F0A08] text-[#EFEBE4] font-sans selection:bg-[#C8A27C] selection:text-[#0F0A08]">
      <Header />

      {/* 1. Hero Section */}
      <section className="relative min-h-[100dvh] flex flex-col justify-center overflow-hidden border-b border-[#3D2620]">
        <div className="absolute inset-0 z-0">
          <Image 
            src={heroDesktop} 
            alt={t('Consultoras Maeum Global Desktop')} 
            fill 
            className="object-cover object-center brightness-[0.80] hidden md:block" 
            priority
          />
          <Image 
            src={heroMobile} 
            alt={t('Consultoras Maeum Global Mobile')} 
            fill 
            className="object-cover object-center brightness-[0.80] block md:hidden" 
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F0A08] via-[#0F0A08]/80 to-transparent w-full sm:w-2/3" />
        </div>

        <div className="relative z-10 px-6 sm:px-12 max-w-7xl mx-auto w-full flex flex-col items-start gap-6 pt-24">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold">
            {t('ESTAMOS AQUI PARA VOCÊ')}
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl md:text-[60px] font-light tracking-wide leading-[1.1] text-white">
            {t('Converse com')} <br />
            {t('nossa equipe.')}<br />
            <span className="italic text-[#C8A27C]">{t('Seu sonho, nosso propósito.')}</span>
          </h1>
          <p className="text-[12px] sm:text-[13px] text-gray-300 font-light text-left leading-relaxed opacity-90 mt-2 max-w-xl">
            {t('Tire dúvidas, conheça melhor nossos pacotes, solicite seu planejamento ou apenas venha conversar. Nossa equipe está sempre pronta para te acolher e transformar sua viagem para a Coreia em realidade.')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
            <a href="https://wa.me/821024836078?text=Ol%C3%A1,%20gostaria%20de%20conversar%20sobre%20uma%20viagem%20para%20a%20Coreia%20do%20Sul." target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 bg-[#C8A27C] hover:bg-[#B8906C] text-[#0F0A08] font-bold text-[10px] py-4 px-8 rounded-none transition-all uppercase tracking-widest">
              {t('INICIAR CONVERSA AGORA')}
              <MessageCircle className="w-4 h-4" />
            </a>
            <a href="mailto:atendimento@maeumglobal.com.br" className="flex items-center justify-center gap-3 bg-transparent border border-[#C8A27C] text-[#C8A27C] hover:bg-[#C8A27C]/10 font-bold text-[10px] py-4 px-8 rounded-none transition-all uppercase tracking-widest">
              {t('SOLICITAR PLANEJAMENTO')}
              <CalendarCheck className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* 2. Top Banner Icons */}
      <section className="border-y border-[#3D2620] bg-[#120B0A] relative z-20 -mt-8 sm:mt-0">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12 py-10 grid grid-cols-2 md:grid-cols-5 gap-6 divide-x divide-[#3D2620]/50">
           <div className="flex flex-col gap-3 sm:px-4">
             <MessageSquare className="w-6 h-6 text-[#C8A27C] stroke-1" />
             <h4 className="text-[9px] font-bold text-white tracking-widest uppercase">{t('ATENDIMENTO')}<br/>{t('EM PORTUGUÊS')}</h4>
             <p className="text-[9px] text-gray-500 font-light leading-tight">{t('Equipe brasileira na Coreia e no Brasil.')}</p>
           </div>
           <div className="flex flex-col gap-3 px-4">
             <Clock className="w-6 h-6 text-[#C8A27C] stroke-1" />
             <h4 className="text-[9px] font-bold text-white tracking-widest uppercase">{t('RESPOSTA')}<br/>{t('RÁPIDA')}</h4>
             <p className="text-[9px] text-gray-500 font-light leading-tight">{t('Agilidade para tornar seus planos realidade.')}</p>
           </div>
           <div className="flex flex-col gap-3 px-4">
             <ShieldCheck className="w-6 h-6 text-[#C8A27C] stroke-1" />
             <h4 className="text-[9px] font-bold text-white tracking-widest uppercase">{t('SEGURANÇA')}</h4>
             <p className="text-[9px] text-gray-500 font-light leading-tight">{t('Suporte completo antes, durante e após sua viagem.')}</p>
           </div>
           <div className="flex flex-col gap-3 px-4">
             <Users className="w-6 h-6 text-[#C8A27C] stroke-1" />
             <h4 className="text-[9px] font-bold text-white tracking-widest uppercase">{t('CONSULTORAS')}<br/>{t('ESPECIALIZADAS')}</h4>
             <p className="text-[9px] text-gray-500 font-light leading-tight">{t('Consultoras apaixonadas pela Coreia.')}</p>
           </div>
           <div className="flex flex-col gap-3 px-4">
             <Heart className="w-6 h-6 text-[#C8A27C] stroke-1" />
             <h4 className="text-[9px] font-bold text-white tracking-widest uppercase">{t('ATENDIMENTO')}<br/>{t('HUMANO')}</h4>
             <p className="text-[9px] text-gray-500 font-light leading-tight">{t('Conversas reais para decisões seguras.')}</p>
           </div>
        </div>
      </section>

      {/* 3. MAIN CHAT LAYOUT */}
      <section className="py-20 px-6 sm:px-12 max-w-[1400px] mx-auto w-full">
        
        <div className="text-center mb-10">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold flex items-center justify-center gap-3">
            <span className="w-16 h-[1px] bg-[#C8A27C]/30"></span>
            {t('ESCOLHA COMO VOCÊ PREFERE FALAR COM A GENTE')}
            <span className="w-16 h-[1px] bg-[#C8A27C]/30"></span>
          </span>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* LEFT SIDEBAR: Outros Canais */}
          <div className="lg:w-[30%] flex flex-col gap-3">
             <div className="bg-[#120B0A] border border-[#3D2620] p-6 rounded-sm mb-2">
               <h3 className="font-heading text-lg text-white mb-2">{t('OUTROS CANAIS')}</h3>
               <p className="text-[10px] text-gray-400 font-light">{t('Conecte-se com a Maeum Global pelo canal que você preferir.')}</p>
             </div>

             {/* Cards de Canais — agora com links reais */}
             <a
               href="https://wa.me/821024836078?text=Ol%C3%A1%2C%20gostaria%20de%20conversar%20sobre%20uma%20viagem%20para%20a%20Coreia%20do%20Sul."
               target="_blank"
               rel="noopener noreferrer"
               className="bg-[#18110F] border border-[#3D2620] p-5 rounded-sm flex items-center justify-between group hover:border-[#C8A27C]/50 transition-colors"
             >
                <div className="flex items-center gap-4">
                   <Phone className="w-5 h-5 text-[#C8A27C]" strokeWidth={1.5} />
                   <div>
                     <h4 className="text-[12px] font-semibold text-white">{t('WhatsApp')}</h4>
                     <p className="text-[9px] text-gray-500 font-light">{t('Fale conosco de forma rápida e prática.')}</p>
                   </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#C8A27C] opacity-0 group-hover:opacity-100 transition-opacity" />
             </a>

             <a
               href="mailto:atendimento@maeumglobal.com.br"
               className="bg-[#18110F] border border-[#3D2620] p-5 rounded-sm flex items-center justify-between group hover:border-[#C8A27C]/50 transition-colors"
             >
                <div className="flex items-center gap-4">
                   <Mail className="w-5 h-5 text-[#C8A27C]" strokeWidth={1.5} />
                   <div>
                     <h4 className="text-[12px] font-semibold text-white">{t('E-mail')}</h4>
                     <p className="text-[9px] text-gray-500 font-light">atendimento@maeumglobal.com.br</p>
                   </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#C8A27C] opacity-0 group-hover:opacity-100 transition-opacity" />
             </a>

             <a
               href="https://instagram.com/maeumglobal"
               target="_blank"
               rel="noopener noreferrer"
               className="bg-[#18110F] border border-[#3D2620] p-5 rounded-sm flex items-center justify-between group hover:border-[#C8A27C]/50 transition-colors"
             >
                <div className="flex items-center gap-4">
                   <Camera className="w-5 h-5 text-[#C8A27C]" strokeWidth={1.5} />
                   <div>
                     <h4 className="text-[12px] font-semibold text-white">{t('Instagram')}</h4>
                     <p className="text-[9px] text-gray-500 font-light">@maeumglobal<br/>{t('Acompanhe e converse pelas redes.')}</p>
                   </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#C8A27C] opacity-0 group-hover:opacity-100 transition-opacity" />
             </a>

             <a
               href="tel:+821024836078"
               className="bg-[#18110F] border border-[#3D2620] p-5 rounded-sm flex items-center justify-between group hover:border-[#C8A27C]/50 transition-colors"
             >
                <div className="flex items-center gap-4">
                   <PhoneCall className="w-5 h-5 text-[#C8A27C]" strokeWidth={1.5} />
                   <div>
                     <h4 className="text-[12px] font-semibold text-white">{t('Telefone')}</h4>
                      <p className="text-[9px] text-gray-500 font-light">+82 10-2483-6078<br/>{t('Segunda a Sexta • 09h às 18h')}</p>
                   </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#C8A27C] opacity-0 group-hover:opacity-100 transition-opacity" />
             </a>

             <a
               href="https://maps.google.com/?q=Seoul,+South+Korea"
               target="_blank"
               rel="noopener noreferrer"
               className="bg-[#18110F] border border-[#3D2620] p-5 rounded-sm flex items-center justify-between group hover:border-[#C8A27C]/50 transition-colors"
             >
                <div className="flex items-center gap-4">
                   <MapPin className="w-5 h-5 text-[#C8A27C]" strokeWidth={1.5} />
                   <div>
                     <h4 className="text-[12px] font-semibold text-white">{t('Localização')}</h4>
                     <p className="text-[9px] text-gray-500 font-light">{t('Seoul, Coreia do Sul')}<br/>{t('Atendimento online para todo o Brasil.')}</p>
                   </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#C8A27C] opacity-0 group-hover:opacity-100 transition-opacity" />
             </a>
          </div>

          {/* RIGHT MAIN SECTION: Chat Widget */}
          <ClientChatWidget />
        </div>
      </section>

      {/* 4. ANTES DE VIAJAR BOTTOM */}
      <section className="py-12 px-6 sm:px-12 max-w-[1400px] mx-auto w-full border-t border-[#3D2620]">
         <div className="text-center mb-10">
          <span className="text-[9px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold flex items-center justify-center gap-3">
            <span className="w-12 h-[1px] bg-[#C8A27C]/30"></span>
            {t('ANTES DE VIAJAR, VOCÊ TEM NOSSA EQUIPE')}
            <span className="w-12 h-[1px] bg-[#C8A27C]/30"></span>
          </span>
         </div>
         
         <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-4">
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-3">
              <Briefcase className="w-6 h-6 text-[#C8A27C]" strokeWidth={1} />
              <div>
                <h4 className="text-[10px] font-bold text-white tracking-widest uppercase mb-1">{t('REUNIÃO PRÉ-EMBARQUE')}</h4>
                <p className="text-[10px] text-gray-400 font-light">{t('Orientações completas antes da sua viagem.')}</p>
              </div>
            </div>
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-3">
              <ShieldCheck className="w-6 h-6 text-[#C8A27C]" strokeWidth={1} />
              <div>
                <h4 className="text-[10px] font-bold text-white tracking-widest uppercase mb-1">{t('SUPORTE DURANTE A VIAGEM')}</h4>
                <p className="text-[10px] text-gray-400 font-light">{t('Estaremos com você em todas as etapas.')}</p>
              </div>
            </div>
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-3">
              <Users className="w-6 h-6 text-[#C8A27C]" strokeWidth={1} />
              <div>
                <h4 className="text-[10px] font-bold text-white tracking-widest uppercase mb-1">{t('GRUPO EXCLUSIVO')}</h4>
                <p className="text-[10px] text-gray-400 font-light">{t('Conecte-se com outros viajantes Maeum.')}</p>
              </div>
            </div>
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-3">
              <Award className="w-6 h-6 text-[#C8A27C]" strokeWidth={1} />
              <div>
                <h4 className="text-[10px] font-bold text-white tracking-widest uppercase mb-1">{t('MEMÓRIAS PARA SEMPRE')}</h4>
                <p className="text-[10px] text-gray-400 font-light">{t('Viva experiências que ficam para a vida toda.')}</p>
              </div>
            </div>
         </div>
      </section>

      {/* 5. CTA Bottom */}
      <section className="pb-20 px-6 sm:px-12 max-w-[1400px] mx-auto w-full">
         <div className="bg-[#1A1110] border border-[#3D2620] rounded-sm p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
               <Gift className="w-10 h-10 text-[#C8A27C]" strokeWidth={1} />
               <div>
                 <h3 className="font-heading text-xl text-white mb-1">{t('AQUILO QUE VOCÊ PROCURA NÃO ESTÁ AQUI?')}</h3>
                 <p className="text-[11px] text-gray-400 font-light">{t('Fale com nossa equipe e criaremos um roteiro personalizado para você.')}</p>
               </div>
            </div>
            <a href="mailto:atendimento@maeumglobal.com.br" className="w-full md:w-auto bg-[#C8A27C] hover:bg-[#B8906C] text-[#0F0A08] font-bold text-[9px] py-4 px-8 rounded-sm transition-all uppercase tracking-widest flex items-center justify-center gap-3">
              {t('SOLICITAR PLANEJAMENTO PERSONALIZADO')}
              <ArrowRight className="w-4 h-4" />
            </a>
         </div>
      </section>

      <Footer />
    </div>
  );
}