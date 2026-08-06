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

export default function SobreNosPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0F0A08] text-[#EFEBE4] font-sans selection:bg-[#C8A27C] selection:text-[#0F0A08]">
      <Header />

      {/* 1. Hero Section */}
      <section className="relative pt-32 pb-24 px-6 sm:px-12 max-w-[1400px] mx-auto w-full border-b border-[#3D2620]">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <div className="lg:w-1/2 flex flex-col items-start gap-6 relative z-10">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold">
              SOBRE A MAEUM GLOBAL
            </span>
            <h1 className="font-heading text-5xl sm:text-6xl md:text-[70px] font-light tracking-wide leading-[1.1] text-white">
              Muito mais que <br />
              viagens. Criamos <br />
              <span className="italic text-[#C8A27C]">conexões que <br/>transformam.</span>
            </h1>
            <div className="w-12 h-[1px] bg-[#C8A27C] my-2"></div>
            <p className="text-[12px] sm:text-[13px] text-gray-400 max-w-xl font-light text-left leading-relaxed opacity-90">
              A Maeum Global nasceu do desejo de proporcionar experiências autênticas, profundas e transformadoras na Coreia do Sul. 
              <br/><br/>
              Acreditamos que cada viagem é única e deve refletir a essência de quem viaja. Por isso, cada roteiro é cuidadosamente planejado, com curadoria premium e atenção a cada detalhe.
            </p>
            <div className="mt-4">
              <button className="flex items-center justify-center gap-3 bg-transparent border border-[#C8A27C] text-[#C8A27C] hover:bg-[#C8A27C]/10 font-bold text-[10px] py-4 px-8 rounded-none transition-all group uppercase tracking-widest">
                CONHEÇA NOSSAS JORNADAS
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          <div className="lg:w-1/2 relative h-[600px] w-full overflow-hidden flex items-center justify-center">
            {/* Simulation of the office image with logo on the wall */}
            <div className="absolute inset-0">
               <Image src="/images/agencia-viagens-coreia-do-sul-maeum-global-sobre-nos.webp" alt="Agência Maeum Desktop" fill className="object-cover opacity-60 hidden md:block" />
               <Image src="/images/mobile/agencia-viagens-coreia-do-sul-maeum-global-sobre-nos-mobile.webp" alt="Agência Maeum Mobile" fill className="object-cover opacity-60 block md:hidden" />
               <div className="absolute inset-0 bg-gradient-to-r from-[#0F0A08] to-[#0F0A08]/40" />
            </div>
            <div className="relative z-10 flex flex-col items-center">
               {/* Abstract Logo */}
               <div className="w-16 h-16 border-2 border-[#C8A27C] flex items-center justify-center mb-4 opacity-80">
                  <div className="w-10 h-10 border border-[#C8A27C]"></div>
               </div>
               <h2 className="font-heading text-4xl text-[#C8A27C] tracking-widest uppercase opacity-90">MAEUM</h2>
               <span className="text-[10px] tracking-[0.4em] text-[#C8A27C] opacity-80 mt-1">GLOBAL</span>
               <div className="flex items-center gap-2 mt-4 text-[#C8A27C] text-[8px] uppercase tracking-widest opacity-60">
                 <span>COREIA</span> • <span>EXPERIÊNCIAS</span> • <span>MEMÓRIAS</span>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. NOSSOS VALORES */}
      <section className="py-24 px-6 sm:px-12 max-w-[1400px] mx-auto w-full">
        <div className="text-center mb-16">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold flex items-center justify-center gap-3">
            <span className="w-12 h-[1px] bg-[#C8A27C]/30"></span>
            NOSSOS VALORES
            <span className="w-12 h-[1px] bg-[#C8A27C]/30"></span>
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="flex flex-col items-center text-center gap-4">
            <Heart className="w-8 h-8 text-[#C8A27C] stroke-1" />
            <h4 className="text-[10px] font-bold text-[#C8A27C] tracking-widest uppercase">PROPÓSITO</h4>
            <p className="text-[10px] text-gray-400 font-light leading-relaxed px-2">Criar experiências que conectam pessoas, culturas e histórias.</p>
          </div>
          <div className="flex flex-col items-center text-center gap-4">
            <Diamond className="w-8 h-8 text-[#C8A27C] stroke-1" />
            <h4 className="text-[10px] font-bold text-[#C8A27C] tracking-widest uppercase">EXCLUSIVIDADE</h4>
            <p className="text-[10px] text-gray-400 font-light leading-relaxed px-2">Grupos pequenos, roteiros autorais e acesso a experiências únicas.</p>
          </div>
          <div className="flex flex-col items-center text-center gap-4">
            <ShieldCheck className="w-8 h-8 text-[#C8A27C] stroke-1" />
            <h4 className="text-[10px] font-bold text-[#C8A27C] tracking-widest uppercase">CONFIANÇA</h4>
            <p className="text-[10px] text-gray-400 font-light leading-relaxed px-2">Acompanhamento desde o Brasil e suporte completo durante toda a jornada.</p>
          </div>
          <div className="flex flex-col items-center text-center gap-4">
            <Sun className="w-8 h-8 text-[#C8A27C] stroke-1" />
            <h4 className="text-[10px] font-bold text-[#C8A27C] tracking-widest uppercase">AUTENTICIDADE</h4>
            <p className="text-[10px] text-gray-400 font-light leading-relaxed px-2">Parcerias locais selecionadas e vivências além dos roteiros tradicionais.</p>
          </div>
          <div className="flex flex-col items-center text-center gap-4">
            <Star className="w-8 h-8 text-[#C8A27C] stroke-1" />
            <h4 className="text-[10px] font-bold text-[#C8A27C] tracking-widest uppercase">EXCELÊNCIA</h4>
            <p className="text-[10px] text-gray-400 font-light leading-relaxed px-2">Padrão premium em cada detalhe da sua viagem.</p>
          </div>
        </div>

        {/* Metricas */}
        <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-6 border border-[#3D2620] p-10 bg-[#150D0B] rounded-sm divide-x divide-[#3D2620]/50">
          <div className="flex flex-col items-center text-center">
            <span className="font-heading text-4xl text-[#C8A27C] mb-2">+800</span>
            <span className="text-[9px] text-gray-400 tracking-widest uppercase font-medium">VIAJANTES REALIZADOS</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="font-heading text-4xl text-[#C8A27C] mb-2">98%</span>
            <span className="text-[9px] text-gray-400 tracking-widest uppercase font-medium">SATISFAÇÃO</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="font-heading text-4xl text-[#C8A27C] mb-2">+30</span>
            <span className="text-[9px] text-gray-400 tracking-widest uppercase font-medium">EXPERIÊNCIAS EXCLUSIVAS</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="font-heading text-4xl text-[#C8A27C] mb-2 flex items-center gap-2">
              5 <Star className="w-6 h-6 fill-[#C8A27C] text-[#C8A27C]" />
            </span>
            <span className="text-[9px] text-gray-400 tracking-widest uppercase font-medium">AVALIAÇÃO MÉDIA</span>
          </div>
        </div>
      </section>

      {/* 3. NOSSOS PARCEIROS */}
      <section className="py-20 px-6 sm:px-12 max-w-[1400px] mx-auto w-full">
        <div className="text-center mb-12">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold flex items-center justify-center gap-3 mb-4">
            <span className="w-12 h-[1px] bg-[#C8A27C]/30"></span>
            NOSSOS PARCEIROS
            <span className="w-12 h-[1px] bg-[#C8A27C]/30"></span>
          </span>
          <p className="text-[11px] text-gray-400 font-light max-w-2xl mx-auto">
            Trabalhamos com marcas e profissionais que compartilham dos nossos valores e garantem experiências autênticas, seguras e memoráveis.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="border border-[#3D2620] h-28 bg-[#18110F] flex flex-col items-center justify-center gap-1 rounded-sm opacity-80 hover:opacity-100 transition-opacity">
            <span className="font-heading text-xl text-white">Cheotnun</span>
            <span className="text-[7px] text-gray-500 uppercase tracking-widest">K-BEAUTY EXPERIENCE</span>
          </div>
          <div className="border border-[#3D2620] h-28 bg-[#18110F] flex flex-col items-center justify-center gap-1 rounded-sm opacity-80 hover:opacity-100 transition-opacity">
            <span className="font-heading text-xl text-white tracking-widest uppercase">TRIPPER</span>
            <span className="text-[7px] text-gray-500 uppercase tracking-widest">PERFUMARIA COREANA</span>
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
            <span className="text-[7px] text-gray-500 uppercase tracking-widest">ESCOLA DE IDIOMAS</span>
          </div>
          <div className="border border-[#3D2620] h-28 bg-[#18110F] flex flex-col items-center justify-center gap-1 rounded-sm opacity-80 hover:opacity-100 transition-opacity">
            <span className="font-heading text-xl text-white font-bold italic">KORAIL</span>
            <span className="text-[7px] text-gray-500 uppercase tracking-widest">KTX TRENS</span>
          </div>
        </div>

        <div className="flex justify-center mt-12">
          <button className="flex items-center justify-center gap-2 text-[#C8A27C] hover:text-white transition-colors text-[9px] font-bold uppercase tracking-widest group">
            CONHEÇA TODOS OS PARCEIROS
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* 4. CTA PARCERIA */}
      <section className="py-20 px-6 sm:px-12 max-w-[1400px] mx-auto w-full">
        <div className="bg-[#1A1110] border border-[#3D2620] flex flex-col lg:flex-row overflow-hidden rounded-sm">
          <div className="lg:w-1/2 relative min-h-[400px]">
             <Image src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800" alt="Handshake" fill className="object-cover" />
             <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#1A1110]" />
          </div>
          <div className="lg:w-1/2 p-12 lg:p-16 flex flex-col justify-center relative">
            <span className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold mb-4">
              VAMOS CRIAR ALGO EXTRAORDINÁRIO JUNTOS?
            </span>
            <h2 className="font-heading text-3xl font-light text-white leading-tight mb-6">
              Se você representa uma marca, negócio ou oferece experiências na Coreia, vamos conversar.
            </h2>
            <p className="text-[11px] text-gray-400 font-light mb-8 leading-relaxed">
              A Maeum Global está sempre aberta a novas parcerias que acrescentem valor às nossas jornadas. 
              Se você deseja promover sua marca, produto ou serviço para um público seleto e altamente engajado, entre em contato conosco.
            </p>
            
            <div className="border border-[#3D2620] p-6 rounded-sm bg-[#120B0A] flex items-center gap-4 mb-8">
               <Mail className="w-6 h-6 text-[#C8A27C]" strokeWidth={1.5} />
               <div>
                  <span className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">Envie sua proposta para:</span>
                  <a href="mailto:comercial@maeumglobal.com" className="text-sm font-semibold text-[#C8A27C] hover:text-white transition-colors">
                    comercial@maeumglobal.com
                  </a>
               </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 border-t border-[#3D2620]/50 pt-6">
               <div className="flex items-start gap-3 flex-1">
                 <BarChart className="w-4 h-4 text-[#C8A27C] shrink-0 mt-0.5" strokeWidth={1.5} />
                 <div>
                   <span className="block text-[9px] text-white font-semibold uppercase tracking-widest mb-1">VISIBILIDADE</span>
                   <p className="text-[9px] text-gray-500 font-light leading-tight">Exposição para um público seleto e qualificado.</p>
                 </div>
               </div>
               <div className="flex items-start gap-3 flex-1">
                 <Star className="w-4 h-4 text-[#C8A27C] shrink-0 mt-0.5" strokeWidth={1.5} />
                 <div>
                   <span className="block text-[9px] text-white font-semibold uppercase tracking-widest mb-1">PARCERIAS REAIS</span>
                   <p className="text-[9px] text-gray-500 font-light leading-tight">Trabalhamos juntos para criar experiências únicas.</p>
                 </div>
               </div>
               <div className="flex items-start gap-3 flex-1">
                 <Handshake className="w-4 h-4 text-[#C8A27C] shrink-0 mt-0.5" strokeWidth={1.5} />
                 <div>
                   <span className="block text-[9px] text-white font-semibold uppercase tracking-widest mb-1">CONEXÕES</span>
                   <p className="text-[9px] text-gray-500 font-light leading-tight">Fortalecemos culturas, negócios e pessoas.</p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer minimal signature */}
      <div className="text-center pb-8 opacity-50 flex items-center justify-center gap-4 border-t border-[#3D2620] mt-12 pt-8 w-full max-w-[1400px] mx-auto">
         <Sun className="w-3 h-3 text-[#C8A27C]" />
         <span className="text-[9px] text-[#C8A27C] tracking-[0.3em] uppercase">MAEUM GLOBAL — SUA HISTÓRIA NA COREIA, DO SEU JEITO, COM EXCELÊNCIA.</span>
      </div>
    </div>
  );
}
