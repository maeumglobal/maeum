import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Home, FileText, Users, MessageSquare, CalendarCheck, FileEdit,
  CreditCard, Map, Briefcase, Calendar, DollarSign, BarChart2,
  ArrowRight
} from 'lucide-react';
import AdminGuard from '@/components/AdminGuard';

export const metadata = {
  title: 'Dashboard | Maeum Global',
  description: 'Painel do Consultor',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
    <div className="flex h-screen bg-[#0F0A08] text-[#EFEBE4] font-sans selection:bg-[#C8A27C] selection:text-[#0F0A08] overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#180C0F] border-r border-[#3D2620] flex flex-col shrink-0">
        
        {/* Logo */}
        <div className="h-24 flex items-center justify-center border-b border-[#3D2620] shrink-0">
          <Link href="/" className="flex flex-col items-center">
             <div className="w-8 h-8 border-2 border-[#C8A27C] mb-1 flex items-center justify-center">
               <div className="w-4 h-4 border border-[#C8A27C]"></div>
             </div>
             <span className="font-heading text-lg text-[#C8A27C] tracking-widest leading-none">MAEUM</span>
             <span className="text-[6px] tracking-[0.4em] text-[#C8A27C] mt-0.5">GLOBAL</span>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-1.5 custom-scrollbar">
           
           <Link href="/admin" className="flex items-center gap-3 bg-[#3A141A] text-white px-4 py-3 rounded-md font-semibold text-[11px] tracking-wide">
              <Home className="w-4 h-4 text-[#C8A27C]" /> Dashboard
           </Link>
           
           <Link href="#" className="flex items-center gap-3 hover:bg-[#2A1112] text-gray-400 hover:text-white px-4 py-3 rounded-md font-medium text-[11px] tracking-wide transition-colors">
              <FileText className="w-4 h-4" /> Minhas Consultas
           </Link>
           
           <Link href="/admin/equipe" className="flex items-center gap-3 hover:bg-[#2A1112] text-gray-400 hover:text-white px-4 py-3 rounded-md font-medium text-[11px] tracking-wide transition-colors">
              <Users className="w-4 h-4" /> Gerenciar Equipe
           </Link>
           
           <Link href="/admin/conversas" className="flex items-center justify-between hover:bg-[#2A1112] text-gray-400 hover:text-white px-4 py-3 rounded-md font-medium text-[11px] tracking-wide transition-colors">
              <div className="flex items-center gap-3">
                 <MessageSquare className="w-4 h-4" /> Conversas
              </div>
              <div className="w-4 h-4 rounded-full bg-[#8A3324] text-white text-[9px] flex items-center justify-center font-bold">!</div>
           </Link>

           <Link href="#" className="flex items-center gap-3 hover:bg-[#2A1112] text-gray-400 hover:text-white px-4 py-3 rounded-md font-medium text-[11px] tracking-wide transition-colors">
              <CalendarCheck className="w-4 h-4" /> Reservas
           </Link>
           
           <Link href="#" className="flex items-center gap-3 hover:bg-[#2A1112] text-gray-400 hover:text-white px-4 py-3 rounded-md font-medium text-[11px] tracking-wide transition-colors">
              <FileEdit className="w-4 h-4" /> Propostas
           </Link>
           
           <Link href="#" className="flex items-center gap-3 hover:bg-[#2A1112] text-gray-400 hover:text-white px-4 py-3 rounded-md font-medium text-[11px] tracking-wide transition-colors">
              <CreditCard className="w-4 h-4" /> Pagamentos
           </Link>
           
           <Link href="#" className="flex items-center gap-3 hover:bg-[#2A1112] text-gray-400 hover:text-white px-4 py-3 rounded-md font-medium text-[11px] tracking-wide transition-colors">
              <Map className="w-4 h-4" /> Pacotes & Experiências
           </Link>
           
           <Link href="#" className="flex items-center gap-3 hover:bg-[#2A1112] text-gray-400 hover:text-white px-4 py-3 rounded-md font-medium text-[11px] tracking-wide transition-colors">
              <Briefcase className="w-4 h-4" /> Materiais de Apoio
           </Link>
           
           <Link href="#" className="flex items-center gap-3 hover:bg-[#2A1112] text-gray-400 hover:text-white px-4 py-3 rounded-md font-medium text-[11px] tracking-wide transition-colors">
              <Calendar className="w-4 h-4" /> Agenda
           </Link>
           
           <Link href="#" className="flex items-center gap-3 hover:bg-[#2A1112] text-gray-400 hover:text-white px-4 py-3 rounded-md font-medium text-[11px] tracking-wide transition-colors">
              <DollarSign className="w-4 h-4" /> Comissões
           </Link>
           
           <Link href="#" className="flex items-center gap-3 hover:bg-[#2A1112] text-gray-400 hover:text-white px-4 py-3 rounded-md font-medium text-[11px] tracking-wide transition-colors">
              <BarChart2 className="w-4 h-4" /> Relatórios
           </Link>
        </div>

        {/* Bottom Banner */}
        <div className="p-4 shrink-0">
           <div className="relative rounded-md overflow-hidden border border-[#3D2620]">
              <div className="absolute inset-0">
                 <Image src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=400" alt="News" fill className="object-cover opacity-60" />
                 <div className="absolute inset-0 bg-gradient-to-t from-[#1F0B10] to-[#1F0B10]/40" />
              </div>
              <div className="relative z-10 p-4 pt-12 flex flex-col items-start">
                 <h5 className="text-[12px] font-semibold text-white mb-1">Sempre atualizada!</h5>
                 <p className="text-[9px] text-gray-300 font-light mb-3">Acesse novidades, comunicados e oportunidades.</p>
                 <button className="w-full bg-[#8A3324] hover:bg-[#6B271A] text-white py-2 text-[9px] uppercase tracking-widest font-semibold transition-colors flex items-center justify-between px-3 rounded-sm">
                   Ver novidades <ArrowRight className="w-3 h-3" />
                 </button>
              </div>
           </div>
        </div>

      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#120B0A]">
        {children}
      </main>
      
    </div>
    </AdminGuard>
  );
}
