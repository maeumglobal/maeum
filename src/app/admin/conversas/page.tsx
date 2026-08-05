import React from 'react';
import ConversasClient from './ConversasClient';

export const metadata = {
  title: 'Conversas | Maeum Global',
};

export default function AdminConversasPage() {
  return (
    <div className="flex flex-col h-full w-full p-4 sm:p-8">
       <div className="mb-6">
         <h1 className="text-2xl font-heading text-white">Mensagens</h1>
         <p className="text-[11px] text-gray-400 font-light mt-1">Atenda seus clientes em tempo real.</p>
       </div>
       <div className="flex-1 overflow-hidden">
         <ConversasClient />
       </div>
    </div>
  );
}
