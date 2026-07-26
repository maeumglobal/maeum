'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Phone, Mail, MapPin, CheckCircle2, MessageSquare, Calendar,
  MessageCircle, Clock, ShieldCheck, Users, Heart, Camera,
  Send, ChevronRight, Gift
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { submitLeadAction } from '@/actions/crmActions';

const MOCK_CONVERSATIONS = [
  { name: 'Juliana', time: '10:42', preview: 'Olá! Posso te ajudar com seu planejamento?', unread: 1, avatar: 'https://i.pravatar.cc/150?u=juliana' },
  { name: 'Larissa', time: '09:15', preview: 'Perfeito! Vou te enviar todas as informações.', unread: 0, avatar: 'https://i.pravatar.cc/150?u=larissa' },
  { name: 'Dayane', time: 'Ontem', preview: 'Podemos ajudar as datas com problema!', unread: 0, avatar: 'https://i.pravatar.cc/150?u=dayane' },
  { name: 'Caroline', time: 'Ontem', preview: 'Obrigada! Você foi incrível!', unread: 0, avatar: 'https://i.pravatar.cc/150?u=caroline' },
];

const MOCK_MESSAGES = [
  { sender: 'consultant', text: 'Olá! Seja muito bem-vinda à Maeum Global! 💕 Como posso te ajudar hoje?', time: '10:42' },
  { sender: 'user', text: 'Olá! Quero saber mais sobre o pacote Bom Sarang 2027', time: '10:43' },
  { sender: 'consultant', text: 'Perfeito! Vou te enviar roteiro completo, valores e as próximas saídas disponíveis 😊', time: '10:44' },
  { sender: 'package', title: 'Bom Sarang 2027', subtitle: 'Primavera na Coreia do Sul', time: '10:44' },
  { sender: 'user', text: 'Amei! Pode me passar as formas de pagamento?', time: '10:45' },
  { sender: 'consultant', text: 'Claro! Temos parcelamento em até 48x no boleto ou em até 24x no cartão. Vou te enviar todos os detalhes por aqui.', time: '10:46' },
];

const CANAIS = [
  { icon: MessageCircle, name: 'WhatsApp', desc: 'Fale conosco de forma rápida e prática.', color: 'text-green-400', action: 'Abrir WhatsApp', href: 'https://wa.me/5541987094799' },
  { icon: Mail, name: 'E-mail', desc: 'atendimento@maeumglobal.com.br\nRespondemos em breve.', color: 'text-[#C8A27C]', action: 'Enviar E-mail', href: 'mailto:atendimento@maeumglobal.com.br' },
  { icon: Camera, name: 'Instagram', desc: '@maeumglobal\nAcompanhe e converse pelas redes.', color: 'text-pink-400', action: 'Ver Instagram', href: 'https://instagram.com/maeumglobal' },
  { icon: Phone, name: 'Telefone', desc: '+55 (41) 98709-4799\nSegunda a Sexta - 09h às 18h', color: 'text-[#C8A27C]', action: 'Ligar Agora', href: 'tel:+5541987094799' },
  { icon: MapPin, name: 'Localização', desc: 'Seul, Coreia do Sul\nAtendimento online para todo o Brasil.', color: 'text-[#C8A27C]', action: null, href: null },
];

const FEATURES_ANTES = [
  { icon: CheckCircle2, title: 'REUNIÃO PRÉ-EMBARQUE', desc: 'Orientações completas antes da sua viagem.' },
  { icon: Users, title: 'SUPORTE DURANTE A VIAGEM', desc: 'Estaremos com você em todas as etapas.' },
  { icon: MessageCircle, title: 'GRUPO EXCLUSIVO', desc: 'Conecte-se com outros viajantes Maeum.' },
  { icon: Heart, title: 'MEMÓRIAS PARA SEMPRE', desc: 'Viva experiências únicas que ficam para a vida toda.' },
];

export default function ContatoPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState(MOCK_MESSAGES);

  const handleChatSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages([...chatMessages, { sender: 'user', text: chatInput, time: 'Agora' }]);
    setChatInput('');
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        sender: 'consultant',
        text: 'Obrigada pela sua mensagem! Uma de nossas consultoras entrará em contato em breve. 😊',
        time: 'Agora'
      }]);
    }, 1000);
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#1A0F14' }}>
      <Header />

      {/* Hero */}
      <section className="relative w-full overflow-hidden" style={{ background: '#1A0F14' }}>
        <div className="absolute inset-0 z-0 h-[90%]">
          <Image
            src="/images/consultoras-maeum-global-contato-planejamento.webp"
            alt="Consultoras Maeum Global"
            fill
            className="object-cover object-center brightness-[0.65]"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A0F14] via-[#1A0F14]/90 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#1A0F14] to-transparent" />
        </div>

        <div className="relative z-10 px-8 max-w-7xl mx-auto w-full pt-32 pb-6">
          <span className="text-xs uppercase tracking-widest text-[#C8A27C] font-bold">ESTAMOS AQUI PARA VOCÊ</span>
          <h1 className="font-heading text-4xl sm:text-6xl font-light tracking-wide leading-tight text-white mt-4">
            Converse com <br className="hidden sm:inline" />
            nossa equipe.<br />
            <span className="italic text-[#C8A27C]">Seu sonho, nosso propósito.</span>
          </h1>
          <p className="text-sm text-gray-300 max-w-xl font-light leading-relaxed mt-6">
            Tire dúvidas, conheça melhor nossos pacotes, solicite seu planejamento ou apenas venha conversar. Nossa equipe está sempre pronta para te acolher e transformar sua viagem para a Coreia em realidade.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <a href="#chat" className="flex items-center justify-center gap-2.5 bg-[#C8A27C] hover:bg-[#B8906C] text-[#1A0F14] font-bold text-xs py-4 px-8 rounded-xl shadow-lg transition-all uppercase tracking-wider">
              INICIAR CONVERSA AGORA
              <MessageSquare className="h-4 w-4" />
            </a>
            <a href="https://wa.me/5541987094799" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2.5 bg-transparent border border-[#C8A27C] text-[#C8A27C] hover:bg-[#C8A27C]/10 font-bold text-xs py-4 px-8 rounded-xl transition-all uppercase tracking-wider">
              SOLICITAR PLANEJAMENTO
              <Calendar className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Features bar */}
        <div className="relative z-10 px-8 max-w-7xl mx-auto w-full mt-16 pb-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 border border-white/10 rounded-2xl p-7 bg-black/40 backdrop-blur-sm">
            {[
              { icon: MessageCircle, title: 'Atendimento\nem Português', desc: 'Equipe brasileira na Coreia e no Brasil.' },
              { icon: Clock, title: 'Resposta\nRápida', desc: 'Agilidade para tornar seus planos realidade.' },
              { icon: ShieldCheck, title: 'Segurança', desc: 'Suporte completo antes, durante e após sua viagem.' },
              { icon: Users, title: 'Consultoras\nEspecializadas', desc: 'Consultoras apaixonadas pela Coreia.' },
              { icon: Heart, title: 'Atendimento\nHumano', desc: 'Conversas reais para decisões seguras.' },
            ].map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div key={i} className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-[#C8A27C] shrink-0" strokeWidth={1.5} />
                    <h4 className="text-[10px] text-[#C8A27C] font-bold uppercase tracking-wider leading-snug" style={{ whiteSpace: 'pre-line' }}>{feat.title}</h4>
                  </div>
                  <p className="text-[10px] text-gray-400 pl-8">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Escolha como falar */}
      <section id="chat" className="py-16 px-4 md:px-8 border-t border-[#3A232E]" style={{ background: '#1A0F14' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-10">
            <div className="h-px flex-1 bg-[#3A232E]" />
            <span className="text-xs uppercase tracking-widest text-[#C8A27C] font-bold whitespace-nowrap">ESCOLHA COMO VOCÊ PREFERE FALAR COM A GENTE</span>
            <div className="h-px flex-1 bg-[#3A232E]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Outros Canais */}
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-[#3A232E] p-5" style={{ background: '#2A161D' }}>
                <h3 className="text-xs font-bold text-[#F3E8DC] uppercase tracking-wider mb-1">OUTROS CANAIS</h3>
                <p className="text-[10px] text-gray-400 mb-5">Conecte-se com a Maeum Global pelo canal que você preferir.</p>
                <div className="flex flex-col gap-4">
                  {CANAIS.map((canal, i) => {
                    const Icon = canal.icon;
                    return (
                      <div key={i} className="flex items-start gap-3 pb-4 border-b border-[#3A232E] last:border-0 last:pb-0">
                        <div className="p-2 rounded-lg bg-[#3A232E] shrink-0">
                          <Icon className={`h-4 w-4 ${canal.color}`} strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-[#F3E8DC]">{canal.name}</h4>
                          <p className="text-[9px] text-gray-400 mt-0.5 leading-relaxed whitespace-pre-line">{canal.desc}</p>
                        </div>
                        {canal.href && (
                          <a href={canal.href} target={canal.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="shrink-0">
                            <ChevronRight className="h-4 w-4 text-[#C8A27C]" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Chat Mockup */}
            <div className="md:col-span-2 flex flex-col rounded-2xl border border-[#3A232E] overflow-hidden" style={{ background: '#2A161D' }}>
              {/* Chat header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#3A232E]" style={{ background: '#1A0F14' }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#3A232E] flex items-center justify-center">
                    <Users className="h-4 w-4 text-[#C8A27C]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#F3E8DC]">CHAT COM NOSSAS CONSULTORAS</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                      <span className="text-[9px] text-green-400">Online agora</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {['https://i.pravatar.cc/150?u=juliana', 'https://i.pravatar.cc/150?u=larissa', 'https://i.pravatar.cc/150?u=dayane'].map((av, i) => (
                    <div key={i} className="relative w-7 h-7 rounded-full overflow-hidden border-2 border-[#2A161D] -ml-2 first:ml-0">
                      <Image src={av} alt="Consultora" fill unoptimized className="object-cover" />
                    </div>
                  ))}
                  <span className="ml-1 text-[9px] text-gray-400 font-bold">+2</span>
                </div>
              </div>

              <div className="flex flex-1" style={{ minHeight: '400px' }}>
                {/* Sidebar conversations */}
                <div className="w-40 border-r border-[#3A232E] flex flex-col" style={{ background: '#1A0F14' }}>
                  <div className="p-3 border-b border-[#3A232E]">
                    <span className="text-[9px] font-bold text-gray-500 uppercase">CONVERSAS</span>
                  </div>
                  <div className="p-2">
                    <input
                      className="w-full bg-[#2A161D] border border-[#3A232E] rounded-lg px-2 py-1.5 text-[9px] text-gray-400 placeholder-gray-600"
                      placeholder="Buscar conversas..."
                      readOnly
                    />
                  </div>
                  <div className="flex flex-col">
                    {MOCK_CONVERSATIONS.map((conv, i) => (
                      <button key={i} className={`flex items-start gap-2 p-3 hover:bg-[#2A161D] transition-colors text-left border-b border-[#3A232E]/50 ${i === 0 ? 'bg-[#2A161D]' : ''}`}>
                        <div className="relative w-7 h-7 rounded-full overflow-hidden shrink-0">
                          <Image src={conv.avatar} alt={conv.name} fill unoptimized className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-[#F3E8DC] truncate">{conv.name}</span>
                            <span className="text-[8px] text-gray-500 shrink-0">{conv.time}</span>
                          </div>
                          <p className="text-[8px] text-gray-500 truncate mt-0.5">{conv.preview}</p>
                        </div>
                        {conv.unread > 0 && (
                          <span className="w-4 h-4 rounded-full bg-[#C8A27C] text-[#1A0F14] text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">{conv.unread}</span>
                        )}
                      </button>
                    ))}
                    <button className="flex items-center justify-center gap-1.5 text-[9px] text-[#C8A27C] font-bold py-3 hover:bg-[#2A161D] transition-colors">
                      Ver todas as conversas →
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 flex flex-col">
                  {/* Consultant header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#3A232E]" style={{ background: '#1A0F14' }}>
                    <div className="flex items-center gap-2">
                      <div className="relative w-7 h-7 rounded-full overflow-hidden">
                        <Image src="https://i.pravatar.cc/150?u=juliana" alt="Juliana" fill unoptimized className="object-cover" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#F3E8DC] block">Juliana</span>
                        <span className="text-[8px] text-gray-400">Consultora de Viagens</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-3.5 w-3.5 text-gray-500" />
                      <MessageSquare className="h-3.5 w-3.5 text-gray-500" />
                      <span className="text-gray-500">⋮</span>
                    </div>
                  </div>

                  {/* Messages list */}
                  <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3" style={{ maxHeight: '280px' }}>
                    {chatMessages.map((msg, i) => {
                      if (msg.sender === 'package') {
                        return (
                          <div key={i} className="self-start max-w-[80%]">
                            <div className="rounded-2xl overflow-hidden border border-[#3A232E]" style={{ background: '#1A0F14' }}>
                              <div className="relative aspect-video w-full">
                                <Image src="https://images.unsplash.com/photo-1528360983277-13d401cdc186?q=80&w=400" alt="Bom Sarang" fill unoptimized className="object-cover" />
                              </div>
                              <div className="p-3">
                                <span className="text-[10px] font-bold text-[#F3E8DC] block">{msg.title}</span>
                                <span className="text-[9px] text-gray-400">{msg.subtitle}</span>
                                <button className="text-[8px] font-bold text-[#C8A27C] uppercase tracking-wider mt-2 flex items-center gap-1">
                                  VER ROTEIRO COMPLETO →
                                </button>
                              </div>
                            </div>
                            <span className="text-[8px] text-gray-500 mt-1 block">{msg.time}</span>
                          </div>
                        );
                      }
                      const isConsultant = msg.sender === 'consultant';
                      return (
                        <div key={i} className={`flex flex-col max-w-[75%] ${isConsultant ? 'self-start items-start' : 'self-end items-end'}`}>
                          <div className={`rounded-2xl p-3 text-[10px] leading-relaxed ${isConsultant ? 'bg-[#2A161D] text-[#F3E8DC] rounded-tl-none border border-[#3A232E]' : 'bg-[#C8A27C] text-[#1A0F14] rounded-tr-none'}`}>
                            {msg.text}
                          </div>
                          <span className="text-[8px] text-gray-500 mt-1 px-1">{msg.time}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Input */}
                  <form onSubmit={handleChatSend} className="border-t border-[#3A232E] p-3 flex items-center gap-2">
                    <input
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      className="flex-1 bg-transparent text-[10px] text-gray-300 placeholder-gray-600 outline-none"
                    />
                    <span className="text-gray-500 text-sm">😊</span>
                    <button type="submit" className="p-2 rounded-full bg-[#C8A27C] hover:bg-[#B8906C] transition-colors">
                      <Send className="h-3.5 w-3.5 text-[#1A0F14]" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Antes de viajar */}
      <section className="py-14 px-4 md:px-8 border-t border-[#3A232E]" style={{ background: '#1A0F14' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-10">
            <div className="h-px flex-1 bg-[#3A232E]" />
            <span className="text-xs uppercase tracking-widest text-[#C8A27C] font-bold whitespace-nowrap">ANTES DE VIAJAR, VOCÊ TEM NOSSA EQUIPE</span>
            <div className="h-px flex-1 bg-[#3A232E]" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {FEATURES_ANTES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div key={i} className="flex flex-col items-center text-center gap-3">
                  <div className="p-3 rounded-xl bg-[#C8A27C]/10 border border-[#C8A27C]/20">
                    <Icon className="h-5 w-5 text-[#C8A27C]" strokeWidth={1.5} />
                  </div>
                  <h4 className="text-[10px] font-bold text-[#C8A27C] uppercase tracking-wider">{feat.title}</h4>
                  <p className="text-[10px] text-gray-400 leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="py-12 px-4 md:px-8 border-t border-[#3A232E]" style={{ background: '#2A161D' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-[#C8A27C]/10 border border-[#C8A27C]/20 shrink-0">
              <Gift className="h-6 w-6 text-[#C8A27C]" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F3E8DC]">AQUILO QUE VOCÊ PROCURA NÃO ESTÁ AQUI?</h3>
              <p className="text-xs text-gray-400 mt-1">Fale com nossa equipe e criaremos um roteiro personalizado para você.</p>
            </div>
          </div>
          <a href="https://wa.me/5541987094799" target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-[#C8A27C] hover:bg-[#B8906C] text-[#1A0F14] font-bold text-xs py-3.5 px-8 rounded-xl transition-all uppercase tracking-wider whitespace-nowrap shrink-0">
            SOLICITAR PLANEJAMENTO PERSONALIZADO
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
