'use client';

import React from 'react';
import Image from 'next/image';
import {
  Search, Bell, MessageCircle, FileText, CheckCircle2, Target, Wallet,
  ArrowUpRight, MessageSquare, Calendar, Phone, Video, Send, Check, AlertCircle,
  Briefcase, DollarSign, Globe, Lock, HelpCircle, ArrowRight, Map
} from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
      
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
         <div>
           <h1 className="text-2xl font-heading text-white flex items-center gap-2">
             Olá, Ana! 👋
           </h1>
           <p className="text-[11px] text-gray-400 font-light mt-1">Bem-vinda ao seu painel de consultora.</p>
         </div>
         
         <div className="flex items-center gap-6">
            <div className="relative">
               <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
               <input type="text" placeholder="Buscar cliente ou reserva..." className="bg-[#1A1110] border border-[#3D2620] rounded-full py-2 pl-9 pr-4 text-[10px] text-white focus:outline-none focus:border-[#C8A27C] w-64" />
            </div>
            
            <div className="relative cursor-pointer">
               <Bell className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
               <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-white text-[7px] font-bold flex items-center justify-center border border-[#120B0A]">5</span>
            </div>

            <div className="flex items-center gap-3 border-l border-[#3D2620] pl-6">
               <Image src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150" alt="Ana Silva" width={36} height={36} className="rounded-full object-cover border border-[#3D2620]" />
               <div className="hidden sm:block">
                 <h4 className="text-[11px] font-semibold text-white">Ana Silva</h4>
                 <p className="text-[9px] text-gray-400">Consultora de Viagens</p>
               </div>
            </div>
         </div>
      </header>

      {/* Metrics Row */}
      <section className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
         <div className="bg-[#18110F] border border-[#3D2620] rounded-md p-4 flex flex-col justify-between h-28">
            <div className="flex justify-between items-start">
               <span className="text-[11px] text-gray-300 font-medium flex items-center gap-2">
                 <MessageCircle className="w-4 h-4 text-[#C8A27C]" /> Consultas Ativas
               </span>
            </div>
            <div className="flex items-end justify-between">
               <span className="text-3xl font-heading text-white">18</span>
               <span className="text-[9px] text-green-400 font-semibold flex items-center gap-1">
                 <ArrowUpRight className="w-3 h-3" /> 20% este mês
               </span>
            </div>
         </div>
         <div className="bg-[#18110F] border border-[#3D2620] rounded-md p-4 flex flex-col justify-between h-28">
            <div className="flex justify-between items-start">
               <span className="text-[11px] text-gray-300 font-medium flex items-center gap-2">
                 <FileText className="w-4 h-4 text-[#C8A27C]" /> Propostas Enviadas
               </span>
            </div>
            <div className="flex items-end justify-between">
               <span className="text-3xl font-heading text-white">12</span>
               <span className="text-[9px] text-green-400 font-semibold flex items-center gap-1">
                 <ArrowUpRight className="w-3 h-3" /> 15% este mês
               </span>
            </div>
         </div>
         <div className="bg-[#18110F] border border-[#3D2620] rounded-md p-4 flex flex-col justify-between h-28">
            <div className="flex justify-between items-start">
               <span className="text-[11px] text-gray-300 font-medium flex items-center gap-2">
                 <CheckCircle2 className="w-4 h-4 text-[#C8A27C]" /> Reservas Confirmadas
               </span>
            </div>
            <div className="flex items-end justify-between">
               <span className="text-3xl font-heading text-white">7</span>
               <span className="text-[9px] text-green-400 font-semibold flex items-center gap-1">
                 <ArrowUpRight className="w-3 h-3" /> 40% este mês
               </span>
            </div>
         </div>
         <div className="bg-[#18110F] border border-[#3D2620] rounded-md p-4 flex flex-col justify-between h-28">
            <div className="flex justify-between items-start">
               <span className="text-[11px] text-gray-300 font-medium flex items-center gap-2">
                 <Target className="w-4 h-4 text-[#C8A27C]" /> Meta Mensal
               </span>
            </div>
            <div>
               <div className="flex justify-between items-baseline mb-1">
                 <span className="text-xl font-heading text-white">R$ 28.450</span>
                 <span className="text-[9px] text-gray-400">76% da meta atingida</span>
               </div>
               <div className="w-full bg-[#3D2620] h-1.5 rounded-full overflow-hidden">
                 <div className="bg-[#C8A27C] w-[76%] h-full rounded-full"></div>
               </div>
            </div>
         </div>
         <div className="bg-[#18110F] border border-[#3D2620] rounded-md p-4 flex flex-col justify-between h-28 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-[#C8A27C]/10 rounded-full blur-xl"></div>
            <div className="flex justify-between items-start relative z-10">
               <span className="text-[11px] text-[#C8A27C] font-medium flex items-center gap-2">
                 <Wallet className="w-4 h-4" /> Comissão Estimada
               </span>
            </div>
            <div className="flex items-end justify-between relative z-10">
               <span className="text-2xl font-heading text-white">R$ 4.860,00</span>
               <span className="text-[9px] text-gray-400">Este mês</span>
            </div>
         </div>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* LEFT COLUMN (2/3) */}
         <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Minhas Consultas */}
            <div className="bg-[#18110F] border border-[#3D2620] rounded-md flex flex-col">
               <div className="p-5 border-b border-[#3D2620] flex items-center justify-between">
                  <h3 className="text-[13px] font-semibold text-white">Minhas Consultas</h3>
                  <button className="text-[10px] text-[#C8A27C] hover:text-white transition-colors flex items-center gap-1">
                    Ver todas <ArrowRight className="w-3 h-3" />
                  </button>
               </div>
               <div className="px-5 border-b border-[#3D2620] flex gap-6 overflow-x-auto custom-scrollbar">
                 <button className="py-3 text-[10px] text-[#C8A27C] font-semibold border-b-2 border-[#C8A27C] whitespace-nowrap">Todas <span className="ml-1 text-gray-500">18</span></button>
                 <button className="py-3 text-[10px] text-gray-400 font-medium hover:text-white transition-colors whitespace-nowrap">Novas <span className="ml-1 text-gray-600">6</span></button>
                 <button className="py-3 text-[10px] text-gray-400 font-medium hover:text-white transition-colors whitespace-nowrap">Em Atendimento <span className="ml-1 text-gray-600">7</span></button>
                 <button className="py-3 text-[10px] text-gray-400 font-medium hover:text-white transition-colors whitespace-nowrap">Proposta Enviada <span className="ml-1 text-gray-600">3</span></button>
                 <button className="py-3 text-[10px] text-gray-400 font-medium hover:text-white transition-colors whitespace-nowrap">Aguardando <span className="ml-1 text-gray-600">2</span></button>
                 <button className="py-3 text-[10px] text-gray-400 font-medium hover:text-white transition-colors whitespace-nowrap">Fechadas <span className="ml-1 text-gray-600">5</span></button>
               </div>
               <div className="overflow-x-auto p-2">
                 <table className="w-full min-w-[600px] text-left">
                   <thead>
                     <tr>
                       <th className="py-3 px-3 text-[9px] font-medium text-gray-500 uppercase tracking-widest">Cliente</th>
                       <th className="py-3 px-3 text-[9px] font-medium text-gray-500 uppercase tracking-widest">Destino / Pacote</th>
                       <th className="py-3 px-3 text-[9px] font-medium text-gray-500 uppercase tracking-widest">Status</th>
                       <th className="py-3 px-3 text-[9px] font-medium text-gray-500 uppercase tracking-widest">Última atividade</th>
                       <th className="py-3 px-3"></th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-[#3D2620]/50">
                     <tr className="hover:bg-[#2A1112] transition-colors cursor-pointer group">
                       <td className="py-3 px-3">
                         <div className="flex items-center gap-3">
                           <Image src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150" alt="Avatar" width={32} height={32} className="rounded-full" />
                           <div>
                             <h5 className="text-[11px] font-semibold text-white">Juliana Martins</h5>
                             <span className="text-[9px] text-gray-500">Instagram</span>
                           </div>
                         </div>
                       </td>
                       <td className="py-3 px-3">
                         <h5 className="text-[11px] font-medium text-gray-300">Always Destination</h5>
                         <span className="text-[9px] text-gray-500">Seoul + Busan + Daegu</span>
                       </td>
                       <td className="py-3 px-3">
                         <span className="px-2 py-0.5 rounded-sm bg-purple-500/20 text-purple-400 text-[9px] font-medium">Em atendimento</span>
                       </td>
                       <td className="py-3 px-3">
                         <span className="text-[10px] text-gray-400">Hoje às 10:30</span>
                       </td>
                       <td className="py-3 px-3 text-right">
                         <button className="text-gray-500 hover:text-[#C8A27C] p-1"><MessageSquare className="w-4 h-4" /></button>
                       </td>
                     </tr>
                     <tr className="hover:bg-[#2A1112] transition-colors cursor-pointer group">
                       <td className="py-3 px-3">
                         <div className="flex items-center gap-3">
                           <Image src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150" alt="Avatar" width={32} height={32} className="rounded-full" />
                           <div>
                             <h5 className="text-[11px] font-semibold text-white">Carolina Souza</h5>
                             <span className="text-[9px] text-gray-500">Site</span>
                           </div>
                         </div>
                       </td>
                       <td className="py-3 px-3">
                         <h5 className="text-[11px] font-medium text-gray-300">Bom Sarang (Primavera)</h5>
                         <span className="text-[9px] text-gray-500">Seoul + Busan</span>
                       </td>
                       <td className="py-3 px-3">
                         <span className="px-2 py-0.5 rounded-sm bg-blue-500/20 text-blue-400 text-[9px] font-medium">Proposta enviada</span>
                       </td>
                       <td className="py-3 px-3">
                         <span className="text-[10px] text-gray-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Hoje às 09:15</span>
                       </td>
                       <td className="py-3 px-3 text-right">
                         <button className="text-gray-500 hover:text-[#C8A27C] p-1"><MessageSquare className="w-4 h-4" /></button>
                       </td>
                     </tr>
                     <tr className="hover:bg-[#2A1112] transition-colors cursor-pointer group">
                       <td className="py-3 px-3">
                         <div className="flex items-center gap-3">
                           <Image src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150" alt="Avatar" width={32} height={32} className="rounded-full" />
                           <div>
                             <h5 className="text-[11px] font-semibold text-white">Beatriz Lima</h5>
                             <span className="text-[9px] text-gray-500">WhatsApp</span>
                           </div>
                         </div>
                       </td>
                       <td className="py-3 px-3">
                         <h5 className="text-[11px] font-medium text-gray-300">Founding ARMY Edition</h5>
                         <span className="text-[9px] text-gray-500">Seoul + Busan</span>
                       </td>
                       <td className="py-3 px-3">
                         <span className="px-2 py-0.5 rounded-sm bg-orange-500/20 text-orange-400 text-[9px] font-medium">Aguardando retorno</span>
                       </td>
                       <td className="py-3 px-3">
                         <span className="text-[10px] text-gray-400">Ontem às 16:45</span>
                       </td>
                       <td className="py-3 px-3 text-right">
                         <button className="text-gray-500 hover:text-[#C8A27C] p-1"><MessageSquare className="w-4 h-4" /></button>
                       </td>
                     </tr>
                     <tr className="hover:bg-[#2A1112] transition-colors cursor-pointer group">
                       <td className="py-3 px-3">
                         <div className="flex items-center gap-3">
                           <Image src="https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150" alt="Avatar" width={32} height={32} className="rounded-full" />
                           <div>
                             <h5 className="text-[11px] font-semibold text-white">Larissa Mendes</h5>
                             <span className="text-[9px] text-gray-500">Indicação</span>
                           </div>
                         </div>
                       </td>
                       <td className="py-3 px-3">
                         <h5 className="text-[11px] font-medium text-gray-300">Caravana de Verão</h5>
                         <span className="text-[9px] text-gray-500">Seoul + Busan</span>
                       </td>
                       <td className="py-3 px-3">
                         <span className="px-2 py-0.5 rounded-sm bg-green-500/20 text-green-400 text-[9px] font-medium">Nova consulta</span>
                       </td>
                       <td className="py-3 px-3">
                         <span className="text-[10px] text-gray-400">Ontem às 14:20</span>
                       </td>
                       <td className="py-3 px-3 text-right">
                         <button className="text-gray-500 hover:text-[#C8A27C] p-1"><MessageSquare className="w-4 h-4" /></button>
                       </td>
                     </tr>
                     <tr className="hover:bg-[#2A1112] transition-colors cursor-pointer group">
                       <td className="py-3 px-3">
                         <div className="flex items-center gap-3">
                           <Image src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=150" alt="Avatar" width={32} height={32} className="rounded-full" />
                           <div>
                             <h5 className="text-[11px] font-semibold text-white">Amanda Rodrigues</h5>
                             <span className="text-[9px] text-gray-500">Instagram</span>
                           </div>
                         </div>
                       </td>
                       <td className="py-3 px-3">
                         <h5 className="text-[11px] font-medium text-gray-300">Horizon of Seven (Jeju)</h5>
                         <span className="text-[9px] text-gray-500">Seoul + Busan + Jeju</span>
                       </td>
                       <td className="py-3 px-3">
                         <span className="px-2 py-0.5 rounded-sm bg-blue-500/20 text-blue-400 text-[9px] font-medium">Proposta enviada</span>
                       </td>
                       <td className="py-3 px-3">
                         <span className="text-[10px] text-gray-400">17/05 11:30</span>
                       </td>
                       <td className="py-3 px-3 text-right">
                         <button className="text-gray-500 hover:text-[#C8A27C] p-1"><MessageSquare className="w-4 h-4" /></button>
                       </td>
                     </tr>
                   </tbody>
                 </table>
               </div>
            </div>

            {/* Split Bottom Left */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               
               {/* Próximas Atividades */}
               <div className="bg-[#18110F] border border-[#3D2620] rounded-md flex flex-col">
                  <div className="p-5 border-b border-[#3D2620] flex items-center justify-between">
                     <h3 className="text-[13px] font-semibold text-white">Próximas Atividades</h3>
                     <button className="text-[10px] text-[#C8A27C] hover:text-white transition-colors flex items-center gap-1">
                       Ver agenda <ArrowRight className="w-3 h-3" />
                     </button>
                  </div>
                  <div className="p-4 flex flex-col gap-3">
                     
                     <div className="flex items-start gap-4 p-3 rounded-md bg-[#120B0A] border border-[#3D2620]/50 hover:border-[#C8A27C]/50 transition-colors">
                        <Calendar className="w-5 h-5 text-[#C8A27C] shrink-0 mt-0.5" />
                        <div className="flex-1">
                           <h5 className="text-[11px] font-semibold text-white">Reunião online com Juliana</h5>
                           <p className="text-[9px] text-gray-400 mt-0.5">Hoje às 15:00</p>
                        </div>
                        <Video className="w-4 h-4 text-green-500" />
                     </div>

                     <div className="flex items-start gap-4 p-3 rounded-md bg-[#120B0A] border border-[#3D2620]/50 hover:border-[#C8A27C]/50 transition-colors">
                        <MessageCircle className="w-5 h-5 text-[#C8A27C] shrink-0 mt-0.5" />
                        <div className="flex-1">
                           <h5 className="text-[11px] font-semibold text-white">Follow up - Carolina Souza</h5>
                           <p className="text-[9px] text-gray-400 mt-0.5">Amanhã às 10:00</p>
                        </div>
                        <Image src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/1200px-WhatsApp.svg.png" alt="wa" width={16} height={16} />
                     </div>

                     <div className="flex items-start gap-4 p-3 rounded-md bg-[#120B0A] border border-[#3D2620]/50 hover:border-[#C8A27C]/50 transition-colors">
                        <FileText className="w-5 h-5 text-[#C8A27C] shrink-0 mt-0.5" />
                        <div className="flex-1">
                           <h5 className="text-[11px] font-semibold text-white">Enviar proposta - Beatriz Lima</h5>
                           <p className="text-[9px] text-gray-400 mt-0.5">Amanhã às 14:00</p>
                        </div>
                        <Send className="w-4 h-4 text-gray-500" />
                     </div>

                     <div className="flex items-start gap-4 p-3 rounded-md bg-[#120B0A] border border-[#3D2620]/50 hover:border-[#C8A27C]/50 transition-colors">
                        <Calendar className="w-5 h-5 text-[#C8A27C] shrink-0 mt-0.5" />
                        <div className="flex-1">
                           <h5 className="text-[11px] font-semibold text-white">Reunião grupo Always Destination</h5>
                           <p className="text-[9px] text-gray-400 mt-0.5">20/05 às 16:00</p>
                        </div>
                        <Video className="w-4 h-4 text-green-500" />
                     </div>

                  </div>
               </div>

               {/* Reservas Recentes */}
               <div className="bg-[#18110F] border border-[#3D2620] rounded-md flex flex-col">
                  <div className="p-5 border-b border-[#3D2620] flex items-center justify-between">
                     <h3 className="text-[13px] font-semibold text-white">Reservas Recentes</h3>
                     <button className="text-[10px] text-[#C8A27C] hover:text-white transition-colors flex items-center gap-1">
                       Ver todas <ArrowRight className="w-3 h-3" />
                     </button>
                  </div>
                  <div className="p-4 flex flex-col gap-3">
                     
                     <div className="flex items-center justify-between p-3 rounded-md bg-[#120B0A] border border-[#3D2620]/50 hover:border-[#C8A27C]/50 transition-colors">
                        <div className="flex items-center gap-3">
                           <Image src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=150" alt="Reserva" width={40} height={40} className="rounded-sm object-cover" />
                           <div>
                             <h5 className="text-[10px] font-semibold text-white">Always Destination</h5>
                             <p className="text-[8px] text-gray-400">Seoul + Busan + Daegu</p>
                           </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                           <span className="text-[8px] text-gray-500">16/05/2024</span>
                           <span className="px-1.5 py-0.5 rounded-[2px] bg-green-500/20 text-green-400 text-[7px] font-bold uppercase tracking-wider border border-green-500/30">Confirmada</span>
                        </div>
                     </div>

                     <div className="flex items-center justify-between p-3 rounded-md bg-[#120B0A] border border-[#3D2620]/50 hover:border-[#C8A27C]/50 transition-colors">
                        <div className="flex items-center gap-3">
                           <Image src="https://images.unsplash.com/photo-1570168007204-dfb528c6958f?q=80&w=150" alt="Reserva" width={40} height={40} className="rounded-sm object-cover" />
                           <div>
                             <h5 className="text-[10px] font-semibold text-white">Bom Sarang (Primavera)</h5>
                             <p className="text-[8px] text-gray-400">Seoul + Busan</p>
                           </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                           <span className="text-[8px] text-gray-500">15/05/2024</span>
                           <span className="px-1.5 py-0.5 rounded-[2px] bg-green-500/20 text-green-400 text-[7px] font-bold uppercase tracking-wider border border-green-500/30">Confirmada</span>
                        </div>
                     </div>

                     <div className="flex items-center justify-between p-3 rounded-md bg-[#120B0A] border border-[#3D2620]/50 hover:border-[#C8A27C]/50 transition-colors">
                        <div className="flex items-center gap-3">
                           <Image src="https://images.unsplash.com/photo-1593508512255-86ab42a8e620?q=80&w=150" alt="Reserva" width={40} height={40} className="rounded-sm object-cover" />
                           <div>
                             <h5 className="text-[10px] font-semibold text-white">Founding ARMY Edition</h5>
                             <p className="text-[8px] text-gray-400">Seoul + Busan</p>
                           </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                           <span className="text-[8px] text-gray-500">14/05/2024</span>
                           <span className="px-1.5 py-0.5 rounded-[2px] bg-green-500/20 text-green-400 text-[7px] font-bold uppercase tracking-wider border border-green-500/30">Confirmada</span>
                        </div>
                     </div>

                     <div className="flex items-center justify-between p-3 rounded-md bg-[#120B0A] border border-[#3D2620]/50 hover:border-[#C8A27C]/50 transition-colors">
                        <div className="flex items-center gap-3">
                           <Image src="https://images.unsplash.com/photo-1534270804883-8b1b5e7f2e2b?q=80&w=150" alt="Reserva" width={40} height={40} className="rounded-sm object-cover" />
                           <div>
                             <h5 className="text-[10px] font-semibold text-white">Caravana de Verão</h5>
                             <p className="text-[8px] text-gray-400">Seoul + Busan</p>
                           </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                           <span className="text-[8px] text-gray-500">13/05/2024</span>
                           <span className="px-1.5 py-0.5 rounded-[2px] bg-orange-500/20 text-orange-400 text-[7px] font-bold uppercase tracking-wider border border-orange-500/30">Pendente</span>
                        </div>
                     </div>

                  </div>
               </div>

            </div>

         </div>

         {/* RIGHT COLUMN (1/3) */}
         <div className="flex flex-col gap-6">
            
            {/* Conversas */}
            <div className="bg-[#18110F] border border-[#3D2620] rounded-md flex flex-col">
               <div className="p-5 border-b border-[#3D2620] flex items-center justify-between">
                  <h3 className="text-[13px] font-semibold text-white">Conversas</h3>
                  <button className="text-[10px] text-[#C8A27C] hover:text-white transition-colors flex items-center gap-2">
                    Ver todas <span className="w-4 h-4 rounded-full bg-[#8A3324] text-white flex items-center justify-center font-bold text-[8px]">8</span>
                  </button>
               </div>
               <div className="flex flex-col">
                  <div className="p-4 border-b border-[#3D2620]/30 hover:bg-[#120B0A] transition-colors cursor-pointer flex justify-between">
                     <div className="flex items-center gap-3">
                       <Image src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150" alt="Av" width={32} height={32} className="rounded-full" />
                       <div>
                         <h5 className="text-[11px] font-semibold text-white">Juliana Martins</h5>
                         <p className="text-[9px] text-gray-400 truncate w-36">Oi Ana! Pode me enviar mais detal...</p>
                       </div>
                     </div>
                     <div className="flex flex-col justify-between items-end">
                       <span className="text-[8px] text-gray-500">10:42</span>
                       <span className="w-4 h-4 rounded-full bg-[#8A3324] text-white flex items-center justify-center font-bold text-[8px]">2</span>
                     </div>
                  </div>
                  <div className="p-4 border-b border-[#3D2620]/30 hover:bg-[#120B0A] transition-colors cursor-pointer flex justify-between">
                     <div className="flex items-center gap-3">
                       <Image src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150" alt="Av" width={32} height={32} className="rounded-full" />
                       <div>
                         <h5 className="text-[11px] font-semibold text-white">Carolina Souza</h5>
                         <p className="text-[9px] text-gray-400 truncate w-36">Perfeito, obrigada! 🙏</p>
                       </div>
                     </div>
                     <div className="flex flex-col justify-between items-end">
                       <span className="text-[8px] text-gray-500">09:15</span>
                       <span className="w-4 h-4 rounded-full bg-[#8A3324] text-white flex items-center justify-center font-bold text-[8px]">1</span>
                     </div>
                  </div>
                  <div className="p-4 border-b border-[#3D2620]/30 hover:bg-[#120B0A] transition-colors cursor-pointer flex justify-between">
                     <div className="flex items-center gap-3">
                       <Image src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150" alt="Av" width={32} height={32} className="rounded-full" />
                       <div>
                         <h5 className="text-[11px] font-semibold text-white">Beatriz Lima</h5>
                         <p className="text-[9px] text-gray-400 truncate w-36">Você: Vou sim! Já te envio por aqui.</p>
                       </div>
                     </div>
                     <div className="flex flex-col justify-between items-end">
                       <span className="text-[8px] text-gray-500">Ontem <Check className="w-2.5 h-2.5 inline" /></span>
                     </div>
                  </div>
                  <div className="p-4 hover:bg-[#120B0A] transition-colors cursor-pointer flex justify-between">
                     <div className="flex items-center gap-3">
                       <Image src="https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150" alt="Av" width={32} height={32} className="rounded-full" />
                       <div>
                         <h5 className="text-[11px] font-semibold text-white">Larissa Mendes</h5>
                         <p className="text-[9px] text-gray-400 truncate w-36">Qual a previsão das próximas saídas?</p>
                       </div>
                     </div>
                     <div className="flex flex-col justify-between items-end">
                       <span className="text-[8px] text-gray-500">Ontem</span>
                     </div>
                  </div>
               </div>
               <div className="p-4 border-t border-[#3D2620]">
                 <button className="w-full bg-[#8A3324] hover:bg-[#6B271A] text-white py-3 text-[10px] font-bold rounded-sm transition-colors uppercase tracking-wider">
                   Abrir central de mensagens
                 </button>
               </div>
            </div>

            {/* Materiais Rápidos */}
            <div className="bg-[#18110F] border border-[#3D2620] rounded-md flex flex-col">
               <div className="p-5 border-b border-[#3D2620]">
                  <h3 className="text-[13px] font-semibold text-white">Materiais Rápidos</h3>
               </div>
               <div className="p-5 grid grid-cols-3 gap-3">
                  <div className="bg-[#120B0A] border border-[#3D2620] rounded-md p-3 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#C8A27C] transition-colors text-center h-20">
                     <Briefcase className="w-5 h-5 text-[#C8A27C]" strokeWidth={1.5} />
                     <span className="text-[8px] text-gray-300 font-medium">Catálogo<br/>de Pacotes</span>
                  </div>
                  <div className="bg-[#120B0A] border border-[#3D2620] rounded-md p-3 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#C8A27C] transition-colors text-center h-20">
                     <FileText className="w-5 h-5 text-[#C8A27C]" strokeWidth={1.5} />
                     <span className="text-[8px] text-gray-300 font-medium">Apresentação<br/>Maeum</span>
                  </div>
                  <div className="bg-[#120B0A] border border-[#3D2620] rounded-md p-3 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#C8A27C] transition-colors text-center h-20">
                     <DollarSign className="w-5 h-5 text-[#C8A27C]" strokeWidth={1.5} />
                     <span className="text-[8px] text-gray-300 font-medium">Tabela<br/>de Preços</span>
                  </div>
                  <div className="bg-[#120B0A] border border-[#3D2620] rounded-md p-3 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#C8A27C] transition-colors text-center h-20">
                     <Map className="w-5 h-5 text-[#C8A27C]" strokeWidth={1.5} />
                     <span className="text-[8px] text-gray-300 font-medium">Experiências<br/>Exclusivas</span>
                  </div>
                  <div className="bg-[#120B0A] border border-[#3D2620] rounded-md p-3 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#C8A27C] transition-colors text-center h-20">
                     <AlertCircle className="w-5 h-5 text-[#C8A27C]" strokeWidth={1.5} />
                     <span className="text-[8px] text-gray-300 font-medium">Políticas<br/>e Regras</span>
                  </div>
                  <div className="bg-[#120B0A] border border-[#3D2620] rounded-md p-3 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#C8A27C] transition-colors text-center h-20">
                     <Lock className="w-5 h-5 text-[#C8A27C]" strokeWidth={1.5} />
                     <span className="text-[8px] text-gray-300 font-medium">Contratos</span>
                  </div>
               </div>
            </div>

            {/* Links Úteis */}
            <div className="bg-[#18110F] border border-[#3D2620] rounded-md flex flex-col">
               <div className="p-5 border-b border-[#3D2620]">
                  <h3 className="text-[13px] font-semibold text-white">Links Úteis</h3>
               </div>
               <div className="flex flex-col">
                  <div className="p-4 border-b border-[#3D2620]/50 hover:bg-[#120B0A] transition-colors cursor-pointer flex justify-between items-center group">
                     <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <span className="text-[11px] text-gray-300 group-hover:text-white transition-colors">Site Maeum Global</span>
                     </div>
                     <span className="text-[9px] text-[#C8A27C] flex items-center gap-1">Abrir <ArrowUpRight className="w-3 h-3" /></span>
                  </div>
                  <div className="p-4 border-b border-[#3D2620]/50 hover:bg-[#120B0A] transition-colors cursor-pointer flex justify-between items-center group">
                     <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-[11px] text-gray-300 group-hover:text-white transition-colors">Calendário de Saídas</span>
                     </div>
                     <span className="text-[9px] text-[#C8A27C] flex items-center gap-1">Abrir <ArrowUpRight className="w-3 h-3" /></span>
                  </div>
                  <div className="p-4 hover:bg-[#120B0A] transition-colors cursor-pointer flex justify-between items-center group">
                     <div className="flex items-center gap-3">
                        <HelpCircle className="w-4 h-4 text-gray-400" />
                        <span className="text-[11px] text-gray-300 group-hover:text-white transition-colors">Central de Ajuda</span>
                     </div>
                     <span className="text-[9px] text-[#C8A27C] flex items-center gap-1">Abrir <ArrowUpRight className="w-3 h-3" /></span>
                  </div>
               </div>
            </div>

         </div>

      </div>
    </div>
  );
}
