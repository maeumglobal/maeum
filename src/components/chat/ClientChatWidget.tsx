'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Users, Search, Paperclip, Send, CheckCheck, MessageCircle, ArrowRight, Phone, Video, MoreVertical, User } from 'lucide-react';
import { initClientChat, sendMessage, getChatMessages } from '@/actions/chatActions';
import { getUsers } from '@/actions/usersActions';

export default function ClientChatWidget() {
  const [consultants, setConsultants] = useState<any[]>([]);
  const [activeConsultant, setActiveConsultant] = useState<any | null>(null);
  
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [chatData, setChatData] = useState<any>(null); // Dados da sessão de chat ativa
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Carregar consultoras no início
  useEffect(() => {
    const fetchConsultants = async () => {
      const res = await getUsers({ role: 'consultora' }); // Busca consultoras reais do banco
      if (res.success && res.data) {
        // Pega as ativas
        const activeOnly = (res.data as any[]).filter(c => c.isActive);
        setConsultants(activeOnly);
        if (activeOnly.length > 0) {
          setActiveConsultant(activeOnly[0]); // Seleciona a primeira por padrão
        }
      }
    };
    fetchConsultants();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (chatData?.chatId) {
      const interval = setInterval(() => loadMessages(chatData.chatId), 3000);
      return () => clearInterval(interval);
    }
  }, [chatData]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async (chatId: string) => {
    const res = await getChatMessages(chatId);
    if (res.success && res.messages) {
      setMessages(res.messages);
    }
  };

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !activeConsultant) return;
    
    setIsStarting(true);
    const initialMessage = `Olá, meu nome é ${formData.name}. Gostaria de iniciar um atendimento!`;
    
    const res = await initClientChat({
      name: formData.name,
      email: formData.email,
      message: initialMessage,
      consultantId: activeConsultant.id // Inicia com a consultora selecionada
    });

    if (res.success) {
      setChatData(res);
      setMessages([{
        id: 'initial',
        senderId: res.customerId,
        content: initialMessage,
        createdAt: new Date().toISOString()
      }]);
    } else {
      alert(res.error || 'Erro ao iniciar chat.');
    }
    setIsStarting(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !chatData) return;

    const tempMsg = {
      id: Date.now().toString(),
      chatId: chatData.chatId,
      senderId: chatData.customerId,
      content: inputText,
      createdAt: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, tempMsg]);
    setInputText('');

    await sendMessage({
      chatId: chatData.chatId,
      senderId: chatData.customerId,
      content: tempMsg.content
    });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="lg:w-[70%] border border-[#3D2620] rounded-sm bg-[#120B0A] flex flex-col overflow-hidden shadow-2xl h-[600px] sm:h-[650px]">
      
      {/* Top Bar Chat */}
      <div className="h-16 border-b border-[#3D2620] bg-[#18110F] flex items-center justify-between px-4 sm:px-6 shrink-0">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-[#3D2620] flex items-center justify-center bg-[#2A1616] shrink-0">
               <Users className="w-4 h-4 text-[#C8A27C]" />
            </div>
            <div>
              <h3 className="text-[10px] sm:text-[11px] font-bold text-white tracking-widest uppercase">CHAT COM NOSSAS CONSULTORAS</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                <span className="text-[8px] sm:text-[9px] text-gray-400">Online agora</span>
              </div>
            </div>
         </div>
         
         <div className="hidden sm:flex items-center gap-[-8px]">
            {consultants.slice(0, 3).map((c, idx) => (
              c.avatarUrl ? (
                <Image key={c.id} src={c.avatarUrl} alt={c.name} width={28} height={28} className={`rounded-full border-2 border-[#18110F] object-cover ${idx > 0 ? '-ml-2' : ''} z-${30 - idx*10}`} />
              ) : (
                <div key={c.id} className={`w-7 h-7 rounded-full bg-[#2A1616] flex items-center justify-center border-2 border-[#18110F] ${idx > 0 ? '-ml-2' : ''} z-${30 - idx*10}`}>
                  <span className="text-[8px] text-[#C8A27C] font-bold">{c.name.charAt(0)}</span>
                </div>
              )
            ))}
            {consultants.length > 3 && (
              <div className="w-7 h-7 rounded-full bg-[#2A1616] border-2 border-[#18110F] -ml-2 z-0 flex items-center justify-center">
                <span className="text-[8px] text-[#C8A27C] font-bold">+{consultants.length - 3}</span>
              </div>
            )}
         </div>
      </div>

      <div className="flex flex-1 min-h-0 relative">
         <div className="absolute inset-0 opacity-5 pointer-events-none z-0" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}></div>
         
         {/* LEFT SIDEBAR: Lista de Consultoras (Exatamente como o Mockup pediu) */}
         <div className={`w-[35%] border-r border-[#3D2620] bg-[#150D0B] flex-col hidden sm:flex z-10`}>
            <div className="p-4 border-b border-[#3D2620]">
              <span className="text-[9px] text-[#C8A27C] uppercase tracking-widest font-bold mb-3 block">CONSULTORAS</span>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder="Buscar consultora..." className="w-full bg-[#0F0A08] border border-[#3D2620] rounded-sm py-2 pl-9 pr-3 text-[10px] text-gray-300 focus:outline-none focus:border-[#C8A27C]" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {consultants.map((c) => (
                <div 
                  key={c.id} 
                  onClick={() => !chatData && setActiveConsultant(c)} // Só pode mudar se o chat não iniciou
                  className={`p-4 transition-colors flex justify-between cursor-pointer border-b border-[#3D2620]/30 ${activeConsultant?.id === c.id ? 'bg-[#2A1616]/50 border-l-2 border-l-[#C8A27C]' : 'hover:bg-[#1A1110]'} ${chatData && chatData.consultant?.id !== c.id ? 'opacity-50 pointer-events-none' : ''}`}
                >
                   <div className="flex items-center gap-3">
                     {c.avatarUrl ? (
                       <Image src={c.avatarUrl} alt={c.name} width={36} height={36} className="rounded-full object-cover shrink-0" />
                     ) : (
                       <div className="w-9 h-9 rounded-full bg-[#2A1112] border border-[#3D2620] flex items-center justify-center shrink-0">
                         <User className="w-4 h-4 text-[#C8A27C]" />
                       </div>
                     )}
                     <div>
                       <h4 className={`text-[11px] font-semibold ${activeConsultant?.id === c.id ? 'text-white' : 'text-gray-300'}`}>{c.name}</h4>
                       <p className="text-[9px] text-gray-400 truncate w-24">Consultora Especialista</p>
                     </div>
                   </div>
                   <div className="flex flex-col items-end justify-between">
                     <span className="text-[8px] text-green-500">Online</span>
                   </div>
                </div>
              ))}
            </div>
         </div>

         {/* RIGHT SIDE: Janela do Chat ou Formulário */}
         <div className="w-full sm:w-[65%] flex flex-col z-10 bg-[#1A1211]/90">
           
           {/* Cabeçalho da Consultora Ativa */}
           {activeConsultant && (
             <div className="h-16 border-b border-[#3D2620] bg-[#150D0B] flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-3">
                   {activeConsultant.avatarUrl ? (
                     <Image src={activeConsultant.avatarUrl} alt={activeConsultant.name} width={32} height={32} className="rounded-full object-cover shrink-0" />
                   ) : (
                     <div className="w-8 h-8 rounded-full bg-[#2A1112] border border-[#3D2620] flex items-center justify-center shrink-0">
                       <User className="w-4 h-4 text-[#C8A27C]" />
                     </div>
                   )}
                   <div>
                     <h4 className="text-[11px] font-semibold text-white">{activeConsultant.name}</h4>
                     <span className="text-[9px] text-gray-500">Consultora de Viagens</span>
                   </div>
                </div>
             </div>
           )}

           {!chatData ? (
             // FORMULÁRIO INICIAL (Se passando por uma mensagem do sistema)
             <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8">
               <div className="bg-[#150D0B] border border-[#3D2620] rounded-xl p-6 max-w-sm w-full text-center shadow-lg relative">
                 <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-[#2A1616] rounded-full border border-[#3D2620] flex items-center justify-center">
                   <MessageCircle className="w-5 h-5 text-[#C8A27C]" />
                 </div>
                 
                 <h3 className="text-sm font-heading text-white mt-4 mb-2">Olá! Sou a {activeConsultant?.name?.split(' ')[0] || 'Consultora'}.</h3>
                 <p className="text-[10px] text-gray-400 mb-6">Para iniciarmos nosso atendimento, por favor, me diga seu nome e e-mail.</p>
                 
                 <form onSubmit={handleStartChat} className="flex flex-col gap-3 text-left">
                   <div>
                     <label className="block text-[9px] text-gray-400 uppercase tracking-widest mb-1 pl-1">Seu Nome</label>
                     <input 
                       required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                       className="w-full bg-[#0F0A08] border border-[#3D2620] rounded-md p-2.5 text-[11px] text-white focus:border-[#C8A27C] outline-none"
                     />
                   </div>
                   <div>
                     <label className="block text-[9px] text-gray-400 uppercase tracking-widest mb-1 pl-1">E-mail</label>
                     <input 
                       required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                       className="w-full bg-[#0F0A08] border border-[#3D2620] rounded-md p-2.5 text-[11px] text-white focus:border-[#C8A27C] outline-none"
                     />
                   </div>
                   <button 
                     type="submit" disabled={isStarting}
                     className="w-full bg-[#C8A27C] hover:bg-[#B8906C] disabled:opacity-50 text-[#0F0A08] font-bold text-[10px] py-3 rounded-md transition-all uppercase tracking-widest mt-2"
                   >
                     {isStarting ? 'Conectando...' : 'Começar a Conversar'}
                   </button>
                 </form>
               </div>
             </div>
           ) : (
             // CHAT ATIVO
             <>
               <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4 custom-scrollbar">
                 {messages.map(msg => {
                   const isClient = msg.senderId === chatData.customerId;
                   
                   return (
                     <div key={msg.id} className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
                        <div className={`${isClient ? 'bg-[#592224] text-white rounded-tr-none' : 'bg-white text-[#0F0A08] rounded-tl-none'} px-4 py-3 rounded-2xl max-w-[85%] sm:max-w-[80%] shadow-md relative`}>
                          <p className={`text-[11px] ${isClient ? 'font-light' : 'font-medium'} leading-relaxed ${isClient ? 'mb-2' : ''}`}>
                            {msg.content}
                          </p>
                          
                          {isClient ? (
                            <div className="flex items-center justify-end gap-1">
                               <span className="text-[7px] text-white/70">{formatTime(msg.createdAt)}</span>
                               <CheckCheck className="w-3 h-3 text-blue-300" />
                            </div>
                          ) : (
                            <span className="text-[7px] text-gray-400 absolute bottom-1.5 right-3">{formatTime(msg.createdAt)}</span>
                          )}
                        </div>
                     </div>
                   )
                 })}
                 <div ref={messagesEndRef} />
               </div>

               {/* Input Box */}
               <form onSubmit={handleSendMessage} className="h-16 bg-[#150D0B] border-t border-[#3D2620] px-4 flex items-center gap-3 shrink-0">
                  <Paperclip className="w-4 h-4 text-gray-400 hover:text-[#C8A27C] cursor-pointer transition-colors" />
                  <div className="flex-1 bg-[#0F0A08] border border-[#3D2620] rounded-full px-4 py-2.5 flex items-center">
                     <input 
                       type="text" 
                       placeholder="Digite sua mensagem..." 
                       value={inputText}
                       onChange={e => setInputText(e.target.value)}
                       className="w-full bg-transparent text-[11px] text-white focus:outline-none" 
                     />
                  </div>
                  <button type="submit" disabled={!inputText.trim()} className="w-10 h-10 rounded-full bg-[#C8A27C] hover:bg-[#B8906C] disabled:opacity-50 flex items-center justify-center cursor-pointer transition-colors shrink-0">
                     <Send className="w-4 h-4 text-[#0F0A08] -ml-0.5" />
                  </button>
               </form>
             </>
           )}
         </div>
      </div>
    </div>
  );
}
