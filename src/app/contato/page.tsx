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

export default function ContatoPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0F0A08] text-[#EFEBE4] font-sans selection:bg-[#C8A27C] selection:text-[#0F0A08]">
      <Header />

      {/* 1. Hero Section */}
      <section className="relative pt-32 pb-0 sm:pb-24 px-6 sm:px-12 max-w-[1400px] mx-auto w-full">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <div className="lg:w-[45%] flex flex-col items-start gap-6 relative z-10 pt-10">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold">
              ESTAMOS AQUI PARA VOCÊ
            </span>
            <h1 className="font-heading text-4xl sm:text-5xl md:text-[60px] font-light tracking-wide leading-[1.1] text-white">
              Converse com <br />
              nossa equipe.<br />
              <span className="italic text-[#C8A27C]">Seu sonho, nosso propósito.</span>
            </h1>
            <p className="text-[12px] sm:text-[13px] text-gray-400 font-light text-left leading-relaxed opacity-90 mt-2">
              Tire dúvidas, conheça melhor nossos pacotes, solicite seu planejamento ou apenas venha conversar. Nossa equipe está sempre pronta para te acolher e transformar sua viagem para a Coreia em realidade.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full mt-4">
              <button className="flex items-center justify-center gap-3 bg-[#C8A27C] hover:bg-[#B8906C] text-[#0F0A08] font-bold text-[10px] py-4 px-8 rounded-none transition-all uppercase tracking-widest flex-1">
                INICIAR CONVERSA AGORA
                <MessageCircle className="w-4 h-4" />
              </button>
              <button className="flex items-center justify-center gap-3 bg-transparent border border-[#C8A27C] text-[#C8A27C] hover:bg-[#C8A27C]/10 font-bold text-[10px] py-4 px-8 rounded-none transition-all uppercase tracking-widest flex-1">
                SOLICITAR PLANEJAMENTO
                <CalendarCheck className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="lg:w-[55%] relative h-[400px] sm:h-[500px] w-full mt-10 lg:mt-0">
             <div className="absolute inset-0 rounded-sm overflow-hidden border border-[#3D2620]">
                <Image src="https://images.unsplash.com/photo-1573164574572-cb89e39749b4?q=80&w=800" alt="Consultants" fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F0A08] via-transparent to-transparent" />
                <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-80">
                   <div className="w-12 h-12 border-2 border-[#C8A27C] mb-2 flex items-center justify-center">
                     <div className="w-6 h-6 border border-[#C8A27C]"></div>
                   </div>
                   <span className="font-heading text-2xl text-[#C8A27C] tracking-widest">MAEUM</span>
                   <span className="text-[8px] tracking-[0.4em] text-[#C8A27C] mt-1">GLOBAL</span>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* 2. Top Banner Icons */}
      <section className="border-y border-[#3D2620] bg-[#120B0A] relative z-20 -mt-8 sm:mt-0">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12 py-10 grid grid-cols-2 md:grid-cols-5 gap-6 divide-x divide-[#3D2620]/50">
           <div className="flex flex-col gap-3 sm:px-4">
             <MessageSquare className="w-6 h-6 text-[#C8A27C] stroke-1" />
             <h4 className="text-[9px] font-bold text-white tracking-widest uppercase">ATENDIMENTO<br/>EM PORTUGUÊS</h4>
             <p className="text-[9px] text-gray-500 font-light leading-tight">Equipe brasileira na Coreia e no Brasil.</p>
           </div>
           <div className="flex flex-col gap-3 px-4">
             <Clock className="w-6 h-6 text-[#C8A27C] stroke-1" />
             <h4 className="text-[9px] font-bold text-white tracking-widest uppercase">RESPOSTA<br/>RÁPIDA</h4>
             <p className="text-[9px] text-gray-500 font-light leading-tight">Agilidade para tornar seus planos realidade.</p>
           </div>
           <div className="flex flex-col gap-3 px-4">
             <ShieldCheck className="w-6 h-6 text-[#C8A27C] stroke-1" />
             <h4 className="text-[9px] font-bold text-white tracking-widest uppercase">SEGURANÇA</h4>
             <p className="text-[9px] text-gray-500 font-light leading-tight">Suporte completo antes, durante e após sua viagem.</p>
           </div>
           <div className="flex flex-col gap-3 px-4">
             <Users className="w-6 h-6 text-[#C8A27C] stroke-1" />
             <h4 className="text-[9px] font-bold text-white tracking-widest uppercase">CONSULTORAS<br/>ESPECIALIZADAS</h4>
             <p className="text-[9px] text-gray-500 font-light leading-tight">Consultoras apaixonadas pela Coreia.</p>
           </div>
           <div className="flex flex-col gap-3 px-4">
             <Heart className="w-6 h-6 text-[#C8A27C] stroke-1" />
             <h4 className="text-[9px] font-bold text-white tracking-widest uppercase">ATENDIMENTO<br/>HUMANO</h4>
             <p className="text-[9px] text-gray-500 font-light leading-tight">Conversas reais para decisões seguras.</p>
           </div>
        </div>
      </section>

      {/* 3. MAIN CHAT LAYOUT */}
      <section className="py-20 px-6 sm:px-12 max-w-[1400px] mx-auto w-full">
        
        <div className="text-center mb-10">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold flex items-center justify-center gap-3">
            <span className="w-16 h-[1px] bg-[#C8A27C]/30"></span>
            ESCOLHA COMO VOCÊ PREFERE FALAR COM A GENTE
            <span className="w-16 h-[1px] bg-[#C8A27C]/30"></span>
          </span>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* LEFT SIDEBAR: Outros Canais */}
          <div className="lg:w-[30%] flex flex-col gap-3">
             <div className="bg-[#120B0A] border border-[#3D2620] p-6 rounded-sm mb-2">
               <h3 className="font-heading text-lg text-white mb-2">OUTROS CANAIS</h3>
               <p className="text-[10px] text-gray-400 font-light">Conecte-se com a Maeum Global pelo canal que você preferir.</p>
             </div>

             {/* Cards de Canais */}
             <div className="bg-[#18110F] border border-[#3D2620] p-5 rounded-sm flex items-center justify-between group cursor-pointer hover:border-[#C8A27C]/50 transition-colors">
                <div className="flex items-center gap-4">
                   <Phone className="w-5 h-5 text-[#C8A27C]" strokeWidth={1.5} />
                   <div>
                     <h4 className="text-[12px] font-semibold text-white">WhatsApp</h4>
                     <p className="text-[9px] text-gray-500 font-light">Fale conosco de forma rápida e prática.</p>
                   </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#C8A27C] opacity-0 group-hover:opacity-100 transition-opacity" />
             </div>

             <div className="bg-[#18110F] border border-[#3D2620] p-5 rounded-sm flex items-center justify-between group cursor-pointer hover:border-[#C8A27C]/50 transition-colors">
                <div className="flex items-center gap-4">
                   <Mail className="w-5 h-5 text-[#C8A27C]" strokeWidth={1.5} />
                   <div>
                     <h4 className="text-[12px] font-semibold text-white">E-mail</h4>
                     <p className="text-[9px] text-gray-500 font-light">atendimento@maeumglobal.com.br</p>
                   </div>
                </div>
             </div>

             <div className="bg-[#18110F] border border-[#3D2620] p-5 rounded-sm flex items-center justify-between group cursor-pointer hover:border-[#C8A27C]/50 transition-colors">
                <div className="flex items-center gap-4">
                   <Camera className="w-5 h-5 text-[#C8A27C]" strokeWidth={1.5} />
                   <div>
                     <h4 className="text-[12px] font-semibold text-white">Instagram</h4>
                     <p className="text-[9px] text-gray-500 font-light">@maeumglobal<br/>Acompanhe e converse pelas redes.</p>
                   </div>
                </div>
             </div>

             <div className="bg-[#18110F] border border-[#3D2620] p-5 rounded-sm flex items-center justify-between group cursor-pointer hover:border-[#C8A27C]/50 transition-colors">
                <div className="flex items-center gap-4">
                   <PhoneCall className="w-5 h-5 text-[#C8A27C]" strokeWidth={1.5} />
                   <div>
                     <h4 className="text-[12px] font-semibold text-white">Telefone</h4>
                     <p className="text-[9px] text-gray-500 font-light">+55 (45) 99928-7468<br/>Segunda a Sexta • 09h às 18h</p>
                   </div>
                </div>
             </div>

             <div className="bg-[#18110F] border border-[#3D2620] p-5 rounded-sm flex items-center justify-between group cursor-pointer hover:border-[#C8A27C]/50 transition-colors">
                <div className="flex items-center gap-4">
                   <MapPin className="w-5 h-5 text-[#C8A27C]" strokeWidth={1.5} />
                   <div>
                     <h4 className="text-[12px] font-semibold text-white">Localização</h4>
                     <p className="text-[9px] text-gray-500 font-light">Seoul, Coreia do Sul<br/>Atendimento online para todo o Brasil.</p>
                   </div>
                </div>
             </div>
          </div>

          {/* RIGHT MAIN SECTION: Chat Simulation */}
          <div className="lg:w-[70%] border border-[#3D2620] rounded-sm bg-[#120B0A] flex flex-col overflow-hidden shadow-2xl">
            
            {/* Top Bar Chat */}
            <div className="h-16 border-b border-[#3D2620] bg-[#18110F] flex items-center justify-between px-6">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border border-[#3D2620] flex items-center justify-center bg-[#2A1616]">
                     <Users className="w-4 h-4 text-[#C8A27C]" />
                  </div>
                  <div>
                    <h3 className="text-[11px] font-bold text-white tracking-widest uppercase">CHAT COM NOSSAS CONSULTORAS</h3>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                      <span className="text-[9px] text-gray-400">Online agora</span>
                    </div>
                  </div>
               </div>
               <div className="flex items-center gap-[-8px]">
                  <Image src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150" alt="Consultant" width={28} height={28} className="rounded-full border-2 border-[#18110F] z-30" />
                  <Image src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150" alt="Consultant" width={28} height={28} className="rounded-full border-2 border-[#18110F] z-20 -ml-2" />
                  <Image src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150" alt="Consultant" width={28} height={28} className="rounded-full border-2 border-[#18110F] z-10 -ml-2" />
                  <div className="w-7 h-7 rounded-full bg-[#2A1616] border-2 border-[#18110F] -ml-2 z-0 flex items-center justify-center">
                    <span className="text-[8px] text-[#C8A27C] font-bold">+2</span>
                  </div>
               </div>
            </div>

            {/* Chat Body */}
            <div className="flex flex-1 min-h-[500px]">
               
               {/* Contact List */}
               <div className="w-[35%] border-r border-[#3D2620] bg-[#150D0B] flex flex-col hidden sm:flex">
                  <div className="p-4 border-b border-[#3D2620]">
                    <span className="text-[9px] text-[#C8A27C] uppercase tracking-widest font-bold mb-3 block">CONVERSAS</span>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input type="text" placeholder="Buscar conversas..." className="w-full bg-[#0F0A08] border border-[#3D2620] rounded-sm py-2 pl-9 pr-3 text-[10px] text-gray-300 focus:outline-none focus:border-[#C8A27C]" />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {/* Active Contact */}
                    <div className="p-4 bg-[#2A1616]/50 border-l-2 border-[#C8A27C] flex justify-between cursor-pointer">
                       <div className="flex items-center gap-3">
                         <Image src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150" alt="Juliana" width={36} height={36} className="rounded-full object-cover" />
                         <div>
                           <h4 className="text-[11px] font-semibold text-white">Juliana</h4>
                           <p className="text-[9px] text-gray-400 truncate w-32">Oi! Posso te ajudar com...</p>
                         </div>
                       </div>
                       <div className="flex flex-col items-end justify-between">
                         <span className="text-[8px] text-gray-500">10:42</span>
                         <span className="w-4 h-4 rounded-full bg-[#C8A27C] text-[#0F0A08] text-[8px] font-bold flex items-center justify-center">2</span>
                       </div>
                    </div>
                    {/* Inactive Contacts */}
                    <div className="p-4 hover:bg-[#1A1110] transition-colors flex justify-between cursor-pointer border-b border-[#3D2620]/30">
                       <div className="flex items-center gap-3">
                         <Image src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150" alt="Larissa" width={36} height={36} className="rounded-full object-cover" />
                         <div>
                           <h4 className="text-[11px] font-semibold text-gray-300">Larissa</h4>
                           <p className="text-[9px] text-gray-500 truncate w-32">Perfeito! Vou te enviar...</p>
                         </div>
                       </div>
                       <div className="flex flex-col items-end justify-between">
                         <span className="text-[8px] text-gray-500">09:15</span>
                         <span className="w-4 h-4 rounded-full bg-[#C8A27C] text-[#0F0A08] text-[8px] font-bold flex items-center justify-center">1</span>
                       </div>
                    </div>
                    <div className="p-4 hover:bg-[#1A1110] transition-colors flex justify-between cursor-pointer border-b border-[#3D2620]/30">
                       <div className="flex items-center gap-3">
                         <Image src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150" alt="Dayane" width={36} height={36} className="rounded-full object-cover" />
                         <div>
                           <h4 className="text-[11px] font-semibold text-gray-300">Dayane</h4>
                           <p className="text-[9px] text-gray-500 truncate w-32">Podemos ajustar as datas...</p>
                         </div>
                       </div>
                       <div className="flex flex-col items-end justify-between">
                         <span className="text-[8px] text-gray-500">Ontem</span>
                       </div>
                    </div>
                    <div className="p-4 hover:bg-[#1A1110] transition-colors flex justify-between cursor-pointer border-b border-[#3D2620]/30">
                       <div className="flex items-center gap-3">
                         <Image src="https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150" alt="Caroline" width={36} height={36} className="rounded-full object-cover" />
                         <div>
                           <h4 className="text-[11px] font-semibold text-gray-300">Caroline</h4>
                           <p className="text-[9px] text-gray-500 truncate w-32">Obrigada! Você foi incrível.</p>
                         </div>
                       </div>
                       <div className="flex flex-col items-end justify-between">
                         <span className="text-[8px] text-gray-500">Ontem</span>
                       </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border-t border-[#3D2620] text-center">
                     <button className="text-[9px] text-[#C8A27C] font-semibold uppercase tracking-widest hover:text-white transition-colors">
                       Ver todas as conversas &rarr;
                     </button>
                  </div>
               </div>

               {/* Active Chat Window */}
               <div className="w-full sm:w-[65%] flex flex-col bg-[#1A1211] relative">
                  <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}></div>
                  
                  {/* Active Chat Header */}
                  <div className="h-16 border-b border-[#3D2620] bg-[#150D0B] flex items-center justify-between px-6 z-10">
                     <div className="flex items-center gap-3">
                        <Image src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150" alt="Juliana" width={32} height={32} className="rounded-full object-cover" />
                        <div>
                          <h4 className="text-[11px] font-semibold text-white">Juliana</h4>
                          <span className="text-[9px] text-gray-500">Consultora de Viagens</span>
                        </div>
                     </div>
                     <div className="flex items-center gap-4 text-gray-400">
                        <Phone className="w-4 h-4 cursor-pointer hover:text-[#C8A27C] transition-colors" />
                        <Video className="w-4 h-4 cursor-pointer hover:text-[#C8A27C] transition-colors" />
                        <MoreVertical className="w-4 h-4 cursor-pointer hover:text-[#C8A27C] transition-colors" />
                     </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 z-10">
                     
                     <div className="flex justify-start">
                        <div className="bg-white text-[#0F0A08] px-4 py-3 rounded-2xl rounded-tl-none max-w-[80%] shadow-md relative">
                          <p className="text-[11px] font-medium leading-relaxed">Olá! Seja muito bem-vinda à Maeum Global! 💜<br/>Como posso te ajudar hoje?</p>
                          <span className="text-[7px] text-gray-400 absolute bottom-1.5 right-3">10:42</span>
                        </div>
                     </div>

                     <div className="flex justify-end mt-2">
                        <div className="bg-[#592224] text-white px-4 py-3 rounded-2xl rounded-tr-none max-w-[80%] shadow-md relative">
                          <p className="text-[11px] font-light leading-relaxed mb-2">Olá! Quero saber mais sobre o pacote Bom Sarang 2027.</p>
                          <div className="flex items-center justify-end gap-1">
                             <span className="text-[7px] text-white/70">10:43</span>
                             <CheckCheck className="w-3 h-3 text-blue-300" />
                          </div>
                        </div>
                     </div>

                     <div className="flex justify-start mt-2">
                        <div className="bg-white text-[#0F0A08] p-1.5 rounded-2xl rounded-tl-none max-w-[85%] shadow-md flex flex-col relative">
                          <div className="px-3 py-2">
                            <p className="text-[11px] font-medium leading-relaxed">Perfeito! Vou te enviar o roteiro completo, valores e as próximas saídas disponíveis 😍</p>
                          </div>
                          
                          <div className="bg-gray-100 rounded-xl p-2 mx-1 mb-4 flex gap-3 border border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors">
                             <div className="w-16 h-16 relative rounded-lg overflow-hidden shrink-0">
                               <Image src="https://images.unsplash.com/photo-1570168007204-dfb528c6958f?q=80&w=200" alt="Bom Sarang" fill className="object-cover" />
                             </div>
                             <div className="flex flex-col justify-center flex-1">
                               <h5 className="text-[10px] font-bold text-gray-800">Bom Sarang 2027</h5>
                               <p className="text-[9px] text-gray-500 mb-2">Primavera na Coreia do Sul</p>
                               <span className="text-[8px] font-bold text-[#8A3324] uppercase tracking-widest flex items-center gap-1">
                                 VER ROTEIRO COMPLETO <ArrowRight className="w-2 h-2" />
                               </span>
                             </div>
                          </div>
                          <span className="text-[7px] text-gray-400 absolute bottom-1.5 right-3">10:44</span>
                        </div>
                     </div>

                     <div className="flex justify-end mt-2">
                        <div className="bg-[#592224] text-white px-4 py-3 rounded-2xl rounded-tr-none max-w-[80%] shadow-md relative">
                          <p className="text-[11px] font-light leading-relaxed mb-2">Amei! Pode me passar as formas de pagamento?</p>
                          <div className="flex items-center justify-end gap-1">
                             <span className="text-[7px] text-white/70">10:45</span>
                             <CheckCheck className="w-3 h-3 text-blue-300" />
                          </div>
                        </div>
                     </div>

                     <div className="flex justify-start mt-2">
                        <div className="bg-white text-[#0F0A08] px-4 py-3 rounded-2xl rounded-tl-none max-w-[80%] shadow-md relative">
                          <p className="text-[11px] font-medium leading-relaxed mb-3">Claro! Temos parcelamento em até 48x no boleto ou em até 24x no cartão. Vou te enviar todos os detalhes por aqui.</p>
                          <span className="text-[7px] text-gray-400 absolute bottom-1.5 right-3">10:46</span>
                        </div>
                     </div>

                  </div>

                  {/* Input Box */}
                  <div className="h-16 bg-[#150D0B] border-t border-[#3D2620] px-4 flex items-center gap-3 z-10">
                     <Paperclip className="w-4 h-4 text-gray-400 hover:text-[#C8A27C] cursor-pointer transition-colors" />
                     <div className="flex-1 bg-[#0F0A08] border border-[#3D2620] rounded-full px-4 py-2.5 flex items-center">
                        <input type="text" placeholder="Digite sua mensagem..." className="w-full bg-transparent text-[11px] text-white focus:outline-none" />
                        <MessageCircle className="w-4 h-4 text-gray-500 cursor-pointer hover:text-[#C8A27C] transition-colors ml-2" />
                     </div>
                     <div className="w-10 h-10 rounded-full bg-[#C8A27C] hover:bg-[#B8906C] flex items-center justify-center cursor-pointer transition-colors shrink-0">
                        <Send className="w-4 h-4 text-[#0F0A08] -ml-0.5" />
                     </div>
                  </div>
               </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. ANTES DE VIAJAR BOTTOM */}
      <section className="py-12 px-6 sm:px-12 max-w-[1400px] mx-auto w-full border-t border-[#3D2620]">
         <div className="text-center mb-10">
          <span className="text-[9px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold flex items-center justify-center gap-3">
            <span className="w-12 h-[1px] bg-[#C8A27C]/30"></span>
            ANTES DE VIAJAR, VOCÊ TEM NOSSA EQUIPE
            <span className="w-12 h-[1px] bg-[#C8A27C]/30"></span>
          </span>
         </div>
         
         <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-4">
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-3">
              <Briefcase className="w-6 h-6 text-[#C8A27C]" strokeWidth={1} />
              <div>
                <h4 className="text-[10px] font-bold text-white tracking-widest uppercase mb-1">REUNIÃO PRÉ-EMBARQUE</h4>
                <p className="text-[10px] text-gray-400 font-light">Orientações completas antes da sua viagem.</p>
              </div>
            </div>
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-3">
              <ShieldCheck className="w-6 h-6 text-[#C8A27C]" strokeWidth={1} />
              <div>
                <h4 className="text-[10px] font-bold text-white tracking-widest uppercase mb-1">SUPORTE DURANTE A VIAGEM</h4>
                <p className="text-[10px] text-gray-400 font-light">Estaremos com você em todas as etapas.</p>
              </div>
            </div>
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-3">
              <Users className="w-6 h-6 text-[#C8A27C]" strokeWidth={1} />
              <div>
                <h4 className="text-[10px] font-bold text-white tracking-widest uppercase mb-1">GRUPO EXCLUSIVO</h4>
                <p className="text-[10px] text-gray-400 font-light">Conecte-se com outros viajantes Maeum.</p>
              </div>
            </div>
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-3">
              <Award className="w-6 h-6 text-[#C8A27C]" strokeWidth={1} />
              <div>
                <h4 className="text-[10px] font-bold text-white tracking-widest uppercase mb-1">MEMÓRIAS PARA SEMPRE</h4>
                <p className="text-[10px] text-gray-400 font-light">Viva experiências que ficam para a vida toda.</p>
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
                 <h3 className="font-heading text-xl text-white mb-1">AQUILO QUE VOCÊ PROCURA NÃO ESTÁ AQUI?</h3>
                 <p className="text-[11px] text-gray-400 font-light">Fale com nossa equipe e criaremos um roteiro personalizado para você.</p>
               </div>
            </div>
            <button className="w-full md:w-auto bg-[#C8A27C] hover:bg-[#B8906C] text-[#0F0A08] font-bold text-[9px] py-4 px-8 rounded-sm transition-all uppercase tracking-widest flex items-center justify-center gap-3">
              SOLICITAR PLANEJAMENTO PERSONALIZADO
              <ArrowRight className="w-4 h-4" />
            </button>
         </div>
      </section>

      <Footer />
    </div>
  );
}
