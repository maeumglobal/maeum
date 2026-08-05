'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getAdminChats, getChatMessages, sendMessage } from '@/actions/chatActions';
import { Search, Send, Paperclip, CheckCheck, User, Clock, ArrowRight, MessageSquare } from 'lucide-react';
import Image from 'next/image';

export default function ConversasClient() {
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChats();
    // Polling para os chats na sidebar
    const interval = setInterval(loadChats, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat.id);
      const interval = setInterval(() => loadMessages(activeChat.id), 3000);
      return () => clearInterval(interval);
    }
  }, [activeChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChats = async () => {
    // Para simplificar, sem passar consultantId por enquanto, busca todos.
    const res = await getAdminChats();
    if (res.success && res.chats) {
      setChats(res.chats);
      setLoadingChats(false);
    }
  };

  const loadMessages = async (chatId: string) => {
    const res = await getChatMessages(chatId);
    if (res.success && res.messages) {
      setMessages(res.messages);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat) return;

    const tempMsg = {
      id: Date.now().toString(),
      chatId: activeChat.id,
      senderId: 'admin_id', // Será o id do admin real futuramente (da auth)
      content: inputText,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);
    setInputText('');

    await sendMessage({
      chatId: activeChat.id,
      senderId: 'admin_id', // Na prática, pegaria do usuário logado
      content: tempMsg.content
    });
    
    // Atualiza a lista pra jogar esse chat pro topo
    loadChats();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-full w-full bg-[#120B0A] overflow-hidden rounded-md border border-[#3D2620]">
      {/* Sidebar de Chats */}
      <div className={`${activeChat ? 'hidden sm:flex' : 'flex'} w-full sm:w-[35%] border-r border-[#3D2620] bg-[#150D0B] flex-col`}>
        <div className="p-4 border-b border-[#3D2620]">
          <span className="text-[9px] text-[#C8A27C] uppercase tracking-widest font-bold mb-3 block">CONVERSAS ATIVAS</span>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Buscar conversas..." className="w-full bg-[#0F0A08] border border-[#3D2620] rounded-sm py-2 pl-9 pr-3 text-[10px] text-gray-300 focus:outline-none focus:border-[#C8A27C]" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loadingChats ? (
            <div className="p-4 text-gray-500 text-[10px] text-center">Carregando...</div>
          ) : chats.length === 0 ? (
            <div className="p-4 text-gray-500 text-[10px] text-center">Nenhuma conversa encontrada.</div>
          ) : (
            chats.map(chat => (
              <div 
                key={chat.id} 
                onClick={() => setActiveChat(chat)}
                className={`p-4 transition-colors flex justify-between cursor-pointer border-b border-[#3D2620]/30 ${activeChat?.id === chat.id ? 'bg-[#2A1616]/50 border-l-2 border-l-[#C8A27C]' : 'hover:bg-[#1A1110]'}`}
              >
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-[#2A1112] border border-[#3D2620] flex items-center justify-center shrink-0">
                     <User className="w-4 h-4 text-[#C8A27C]" />
                   </div>
                   <div>
                     <h4 className={`text-[11px] font-semibold ${activeChat?.id === chat.id ? 'text-white' : 'text-gray-300'}`}>
                       {chat.customer?.name || 'Cliente'}
                     </h4>
                     <p className="text-[9px] text-gray-500 truncate w-32">
                       {chat.messages?.[0]?.content || 'Nova conversa...'}
                     </p>
                   </div>
                 </div>
                 <div className="flex flex-col items-end justify-between">
                   <span className="text-[8px] text-gray-500">{formatTime(chat.updatedAt)}</span>
                 </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Área Principal de Chat */}
      {activeChat ? (
        <div className={`${activeChat ? 'flex' : 'hidden sm:flex'} w-full sm:w-[65%] flex-col bg-[#1A1211] relative`}>
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}></div>
          
          {/* Active Chat Header */}
          <div className="h-16 border-b border-[#3D2620] bg-[#150D0B] flex items-center justify-between px-4 sm:px-6 z-10">
             <div className="flex items-center gap-3">
                <button 
                  onClick={() => setActiveChat(null)}
                  className="sm:hidden text-[#C8A27C] p-2 -ml-2"
                >
                  <ArrowRight className="w-5 h-5 rotate-180" />
                </button>
                <div className="w-8 h-8 rounded-full bg-[#2A1112] border border-[#3D2620] flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-[#C8A27C]" />
                </div>
                <div>
                  <h4 className="text-[11px] font-semibold text-white">{activeChat.customer?.name}</h4>
                  <span className="text-[9px] text-gray-500 hidden sm:block">{activeChat.customer?.email}</span>
                </div>
             </div>
             <div className="flex items-center gap-2">
                <span className="text-[9px] text-[#C8A27C] font-semibold px-2 py-1 bg-[#2A1616] rounded-sm hidden sm:block">Finalizar</span>
             </div>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 z-10 custom-scrollbar">
            {messages.map(msg => {
              const isAdmin = msg.senderId === 'admin_id' || msg.senderId === activeChat.consultantId;
              
              return (
                <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                   <div className={`${isAdmin ? 'bg-[#592224] text-white rounded-tr-none' : 'bg-white text-[#0F0A08] rounded-tl-none'} px-4 py-3 rounded-2xl max-w-[80%] shadow-md relative`}>
                     <p className={`text-[11px] ${isAdmin ? 'font-light' : 'font-medium'} leading-relaxed`}>{msg.content}</p>
                     
                     {isAdmin ? (
                       <div className="flex items-center justify-end gap-1 mt-1">
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
          <form onSubmit={handleSendMessage} className="h-16 bg-[#150D0B] border-t border-[#3D2620] px-4 flex items-center gap-3 z-10">
             <Paperclip className="w-4 h-4 text-gray-400 hover:text-[#C8A27C] cursor-pointer transition-colors" />
             <div className="flex-1 bg-[#0F0A08] border border-[#3D2620] rounded-full px-4 py-2.5 flex items-center">
                <input 
                  type="text" 
                  placeholder="Escreva sua resposta..." 
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  className="w-full bg-transparent text-[11px] text-white focus:outline-none" 
                />
             </div>
             <button type="submit" disabled={!inputText.trim()} className="w-10 h-10 rounded-full bg-[#C8A27C] hover:bg-[#B8906C] disabled:opacity-50 flex items-center justify-center cursor-pointer transition-colors shrink-0">
                <Send className="w-4 h-4 text-[#0F0A08] -ml-0.5" />
             </button>
          </form>
        </div>
      ) : (
        <div className="w-full sm:w-[65%] flex flex-col items-center justify-center bg-[#1A1211] z-10">
           <MessageSquare className="w-12 h-12 text-[#3D2620] mb-4" />
           <p className="text-[12px] text-gray-500">Selecione uma conversa ao lado para iniciar.</p>
        </div>
      )}
    </div>
  );
}
