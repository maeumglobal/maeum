'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Search, Bell, Users, MessageSquare, Calendar, FileText, 
  Briefcase, CreditCard, Box, BookOpen, Clock, Activity, 
  BarChart, ArrowRight, Video, MessageCircle, Send, Check 
} from 'lucide-react';
import { authService } from '@/lib/supabaseAuth';
import { getAdminChats } from '@/actions/chatActions';
import { getLeads } from '@/actions/leadsActions';
import { getProposals, getBookings } from '@/actions/businessActions';

export default function ConsultoraDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Real Data States
  const [chats, setChats] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  
  // UI States
  const [activeTab, setActiveTab] = useState('todas');

  const loadRealData = async (user: any) => {
    try {
      // 1. Fetch Chats
      const chatsRes = await getAdminChats(user.id);
      if (chatsRes.success && chatsRes.chats) setChats(chatsRes.chats);

      // 2. Fetch Leads (Consultas)
      const leadsRes = await getLeads({ consultantId: user.id, pageSize: 50 });
      if (leadsRes.success && leadsRes.data) setLeads(leadsRes.data);

      // 3. Fetch Proposals
      const propsRes = await getProposals({ pageSize: 50 });
      if (propsRes.success && propsRes.data) {
        // Filter manually if backend doesn't filter by consultant (businessActions.ts getProposals doesn't take consultantId yet)
        const myProps = propsRes.data.filter((p: any) => p.consultantId === user.id);
        setProposals(myProps);
      }

      // 4. Fetch Bookings (Reservas)
      const bookRes = await getBookings({ pageSize: 10 });
      if (bookRes.success && bookRes.data) {
        setBookings(bookRes.data);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  };

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);
    loadRealData(user);
  }, [router]);

  // Derived Metrics
  const totalConsultas = leads.length;
  const novasConsultas = leads.filter(l => l.status === 'novo').length;
  const emAtendimento = leads.filter(l => l.status === 'atendimento' || l.status === 'contact').length;
  const propostasEnviadas = proposals.length;
  const reservasConfirmadas = bookings.filter(b => b.status === 'confirmed').length;
  
  // Calculate fake monetary metrics based on real proposals (for the design)
  const metaMensal = 37000;
  const totalVendido = bookings.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0) || 28450;
  const percentMeta = Math.min(Math.round((totalVendido / metaMensal) * 100), 100);
  const comissaoEstimada = totalVendido * 0.15; // 15% commission mock

  return (
    <div className="flex h-screen bg-[#110A09] text-white font-sans overflow-hidden">
      
      {/* ─── SIDEBAR ────────────────────────────────────────── */}
      <aside className="w-64 border-r border-[#3D2620] bg-[#150D0C] flex flex-col justify-between shrink-0 h-full overflow-y-auto custom-scrollbar">
        <div>
          {/* Logo */}
          <div className="p-8 flex flex-col items-center justify-center border-b border-[#3D2620]/50 mb-4">
             {/* Logo text for Maeum Global */}
             <div className="text-center">
               <div className="text-[#C8A27C] text-3xl font-light tracking-widest leading-none mb-1">M A E U M</div>
               <div className="text-[8px] text-[#C8A27C] tracking-[0.4em] uppercase">Global</div>
             </div>
          </div>

          {/* Nav Links */}
          <nav className="flex flex-col gap-1 px-4">
            <NavItem icon={Activity} label="Dashboard" active />
            <NavItem icon={Briefcase} label="Minhas Consultas" />
            <NavItem icon={Users} label="Leads & Clientes" />
            <NavItem icon={MessageSquare} label="Conversas" badge={chats.length} />
            <NavItem icon={Calendar} label="Reservas" />
            <NavItem icon={FileText} label="Propostas" />
            <NavItem icon={CreditCard} label="Pagamentos" hasSub />
            <NavItem icon={Box} label="Pacotes & Experiências" />
            <NavItem icon={BookOpen} label="Materiais de Apoio" />
            <NavItem icon={Clock} label="Agenda" />
            <NavItem icon={BarChart} label="Comissões" />
            <NavItem icon={FileText} label="Relatórios" />
          </nav>
        </div>

        {/* Ad Banner */}
        <div className="p-4 mt-6">
          <div className="rounded-2xl overflow-hidden relative border border-[#3D2620]">
             <div className="absolute inset-0 bg-gradient-to-t from-[#150D0C] via-[#150D0C]/80 to-transparent z-10" />
             <Image src="https://images.unsplash.com/photo-1517154421773-0529f29ea451?q=80&w=400" alt="Banner" width={300} height={400} className="w-full h-48 object-cover" />
             <div className="absolute bottom-0 left-0 w-full p-4 z-20">
               <h4 className="text-xs font-bold text-white mb-1">Sempre atualizada!</h4>
               <p className="text-[9px] text-gray-400 mb-3">Acesse novidades, comunicados e oportunidades.</p>
               <button className="w-full bg-[#592224] hover:bg-[#6b2a2c] text-white text-[10px] font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors">
                 Ver novidades <ArrowRight className="w-3 h-3" />
               </button>
             </div>
          </div>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ────────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-gradient-to-br from-[#1A1211] to-[#0F0A08]">
        
        {/* HEADER */}
        <header className="h-20 border-b border-[#3D2620]/50 flex items-center justify-between px-8 shrink-0">
          <div>
            <h1 className="text-2xl font-light text-white font-heading">Olá, {currentUser?.name?.split(' ')[0] || 'Consultora'}! 👋</h1>
            <p className="text-[11px] text-gray-400">Bem-vinda ao seu painel de consultora.</p>
          </div>

          <div className="flex items-center gap-6">
            {/* Search */}
            <div className="relative hidden md:block">
              <input 
                type="text" 
                placeholder="Buscar cliente ou reserva..." 
                className="bg-[#150D0C] border border-[#3D2620] rounded-full py-2 pl-4 pr-10 text-[11px] text-white focus:outline-none focus:border-[#C8A27C] w-64"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />
            </div>
            
            {/* Notification */}
            <div className="relative cursor-pointer">
              <Bell className="w-5 h-5 text-gray-300 hover:text-white transition-colors" />
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center text-[7px] font-bold border-2 border-[#1A1211]">5</div>
            </div>

            {/* Profile */}
            <div className="flex items-center gap-3 pl-4 border-l border-[#3D2620]/50">
              <div className="w-10 h-10 rounded-full border border-[#C8A27C] overflow-hidden bg-[#2A1616] flex items-center justify-center shrink-0">
                {currentUser?.avatarUrl ? (
                  <Image src={currentUser.avatarUrl} alt="Avatar" width={40} height={40} className="object-cover" />
                ) : (
                  <span className="text-[#C8A27C] text-sm font-bold">{currentUser?.name?.[0] || 'C'}</span>
                )}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-white leading-tight">{currentUser?.name || 'Consultora'}</p>
                <p className="text-[9px] text-[#C8A27C]">Consultora de Viagens</p>
              </div>
            </div>
          </div>
        </header>

        {/* SCROLLABLE DASHBOARD CONTENT */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8">
          
          {/* METRICS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <MetricCard icon={MessageCircle} label="Consultas Ativas" value={totalConsultas} trend="+20% este mês" trendUp />
            <MetricCard icon={FileText} label="Propostas Enviadas" value={propostasEnviadas} trend="+15% este mês" trendUp />
            <MetricCard icon={Check} label="Reservas Confirmadas" value={reservasConfirmadas} trend="+40% este mês" trendUp />
            
            <div className="bg-[#150D0C] border border-[#3D2620] rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full border border-[#C8A27C]/30 bg-[#1A1211] flex items-center justify-center">
                  <Activity className="w-4 h-4 text-[#C8A27C]" />
                </div>
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Meta Mensal</span>
              </div>
              <div>
                <div className="text-xl font-light text-white mb-1">R$ {totalVendido.toLocaleString('pt-BR')}</div>
                <div className="flex items-center justify-between text-[9px] text-gray-400 mb-1.5">
                  <span>{percentMeta}% da meta atingida</span>
                </div>
                <div className="h-1 bg-[#2A1616] rounded-full overflow-hidden">
                  <div className="h-full bg-[#C8A27C] rounded-full" style={{ width: `${percentMeta}%` }} />
                </div>
              </div>
            </div>

            <MetricCard icon={CreditCard} label="Comissão Estimada" value={`R$ ${comissaoEstimada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} trend="Este mês" />
          </div>

          {/* MAIN GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT COLUMN (2/3) */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* Minhas Consultas Tabela */}
              <div className="bg-[#150D0C] border border-[#3D2620] rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-heading font-light text-[#C8A27C]">Minhas Consultas</h3>
                  <button className="text-[10px] text-gray-400 hover:text-[#C8A27C] flex items-center gap-1 transition-colors">
                    Ver todas <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-6 border-b border-[#3D2620]/50 pb-2 mb-4 overflow-x-auto custom-scrollbar">
                   <TabButton label="Todas" count={totalConsultas} active={activeTab === 'todas'} onClick={() => setActiveTab('todas')} />
                   <TabButton label="Novas" count={novasConsultas} active={activeTab === 'novas'} onClick={() => setActiveTab('novas')} />
                   <TabButton label="Em Atendimento" count={emAtendimento} active={activeTab === 'atendimento'} onClick={() => setActiveTab('atendimento')} />
                   <TabButton label="Proposta Enviada" count={propostasEnviadas} active={activeTab === 'proposta'} onClick={() => setActiveTab('proposta')} />
                   <TabButton label="Fechadas" count={reservasConfirmadas} active={activeTab === 'fechadas'} onClick={() => setActiveTab('fechadas')} />
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#3D2620]/30 text-[10px] text-gray-500 uppercase tracking-wider">
                        <th className="pb-3 font-semibold">Cliente</th>
                        <th className="pb-3 font-semibold">Destino / Pacote</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 font-semibold">Última atividade</th>
                        <th className="pb-3 font-semibold text-right"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.slice(0, 5).map((lead, idx) => (
                        <tr key={lead.id} className="border-b border-[#3D2620]/20 hover:bg-[#1A1211] transition-colors group">
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#2A1616] border border-[#3D2620] flex items-center justify-center shrink-0">
                                <span className="text-[#C8A27C] text-[10px] font-bold">{lead.name.charAt(0)}</span>
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gray-200">{lead.name}</p>
                                <p className="text-[9px] text-gray-500">{lead.origin || 'Site'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            <p className="text-[11px] text-gray-300">{lead.destination || 'Coreia do Sul'}</p>
                            <p className="text-[9px] text-gray-500">Sob medida</p>
                          </td>
                          <td className="py-3">
                            <StatusBadge status={lead.status} />
                          </td>
                          <td className="py-3 text-[10px] text-gray-400">
                            {new Date(lead.updatedAt).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="py-3 text-right">
                            <button className="w-8 h-8 rounded-full bg-[#2A1616] text-gray-400 hover:text-[#C8A27C] hover:border-[#C8A27C] border border-transparent flex items-center justify-center transition-all ml-auto">
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {leads.length === 0 && (
                        <tr><td colSpan={5} className="py-8 text-center text-xs text-gray-500">Nenhuma consulta encontrada.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Row inside Left Column */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Próximas Atividades */}
                <div className="bg-[#150D0C] border border-[#3D2620] rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-heading font-light text-white">Próximas Atividades</h3>
                    <button className="text-[10px] text-[#C8A27C] hover:text-white flex items-center gap-1 transition-colors">
                      Ver agenda <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    <ActivityItem title="Reunião online com Cliente Novo" time="Hoje às 15:00" icon={Video} color="green" />
                    <ActivityItem title="Follow up - Proposta Enviada" time="Amanhã às 10:00" icon={MessageCircle} color="green" />
                    <ActivityItem title="Enviar contrato para aprovação" time="Amanhã às 14:00" icon={Send} color="gray" />
                    <ActivityItem title="Treinamento K-Beauty" time="20/08 às 16:00" icon={Video} color="green" />
                  </div>
                </div>

                {/* Reservas Recentes */}
                <div className="bg-[#150D0C] border border-[#3D2620] rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-heading font-light text-white">Reservas Recentes</h3>
                    <button className="text-[10px] text-[#C8A27C] hover:text-white flex items-center gap-1 transition-colors">
                      Ver todas <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-4">
                    {bookings.slice(0, 4).map((book, idx) => (
                      <div key={idx} className="flex items-center justify-between group cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-[#3D2620] shrink-0">
                            <Image src="https://images.unsplash.com/photo-1538669715515-5e3819766a9e?q=80&w=100" alt="Reserva" width={40} height={40} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-gray-200 group-hover:text-[#C8A27C] transition-colors">{book.package?.title || 'Pacote Sob Medida'}</p>
                            <p className="text-[9px] text-gray-500">{book.package?.destination || 'Coreia do Sul'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-400 mb-1">{new Date(book.createdAt).toLocaleDateString('pt-BR')}</p>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${book.status === 'confirmed' ? 'bg-green-900/40 text-green-400 border border-green-800' : 'bg-orange-900/40 text-orange-400 border border-orange-800'}`}>
                            {book.status === 'confirmed' ? 'Confirmada' : 'Pendente'}
                          </span>
                        </div>
                      </div>
                    ))}
                    {bookings.length === 0 && (
                      <p className="text-xs text-gray-500 text-center py-4">Nenhuma reserva recente.</p>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* RIGHT COLUMN (1/3) */}
            <div className="flex flex-col gap-6">
              
              {/* Conversas */}
              <div className="bg-[#150D0C] border border-[#3D2620] rounded-2xl p-5 shadow-lg flex-1 min-h-[300px] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-heading font-light text-white">Conversas</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#C8A27C]">Ver todas</span>
                    <span className="w-4 h-4 bg-[#592224] rounded-full text-[9px] font-bold text-white flex items-center justify-center">{chats.length}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 flex-1 overflow-y-auto custom-scrollbar pr-1">
                  {chats.slice(0, 5).map(chat => {
                    const lastMsg = chat.messages?.[0];
                    return (
                      <div key={chat.id} className="p-2.5 rounded-xl hover:bg-[#1A1211] border border-transparent hover:border-[#3D2620] cursor-pointer transition-all flex items-center justify-between group">
                        <div className="flex items-center gap-3 w-full">
                          <div className="relative w-8 h-8 rounded-full bg-[#2A1616] border border-[#3D2620] flex items-center justify-center shrink-0">
                            <span className="text-[#C8A27C] text-[10px] font-bold">{chat.customer?.name?.charAt(0) || 'C'}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <p className="text-[11px] font-bold text-gray-200 truncate">{chat.customer?.name || 'Cliente'}</p>
                              <span className="text-[8px] text-gray-500">{new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-[9px] text-gray-400 truncate group-hover:text-gray-300 transition-colors">
                              {lastMsg ? lastMsg.content : 'Iniciar atendimento...'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {chats.length === 0 && (
                    <div className="flex-1 flex items-center justify-center text-xs text-gray-500">Sem conversas ativas.</div>
                  )}
                </div>

                <button className="w-full mt-4 bg-[#592224] hover:bg-[#6b2a2c] text-white text-[11px] font-bold py-3 rounded-xl transition-colors">
                  Abrir central de mensagens
                </button>
              </div>

              {/* Materiais Rápidos */}
              <div className="bg-[#150D0C] border border-[#3D2620] rounded-2xl p-5 shadow-lg">
                <h3 className="text-sm font-heading font-light text-white mb-4">Materiais Rápidos</h3>
                <div className="grid grid-cols-3 gap-2">
                   <MaterialBtn icon={Box} label="Catálogo de Pacotes" />
                   <MaterialBtn icon={Video} label="Apresentação Maeum" />
                   <MaterialBtn icon={FileText} label="Tabela de Preços" />
                   <MaterialBtn icon={Activity} label="Experiências Exclusivas" />
                   <MaterialBtn icon={BookOpen} label="Políticas e Regras" />
                   <MaterialBtn icon={Briefcase} label="Contratos" />
                </div>
              </div>

              {/* Links Úteis */}
              <div className="bg-[#150D0C] border border-[#3D2620] rounded-2xl p-5 shadow-lg">
                <h3 className="text-sm font-heading font-light text-white mb-3">Links Úteis</h3>
                <div className="flex flex-col gap-2">
                   <LinkBtn label="Site Maeum Global" />
                   <LinkBtn label="Calendário de Saídas" icon={Calendar} />
                   <LinkBtn label="Central de Ajuda" icon={MessageCircle} />
                </div>
              </div>

            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

// ─── HELPER COMPONENTS ──────────────────────────────────────────

function NavItem({ icon: Icon, label, active, badge, hasSub }: any) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all ${active ? 'bg-[#2A1616] border border-[#592224]' : 'hover:bg-[#1A1211] border border-transparent'}`}>
      <div className="flex items-center gap-3">
        <Icon className={`w-4 h-4 ${active ? 'text-[#C8A27C]' : 'text-gray-400'}`} />
        <span className={`text-xs font-semibold ${active ? 'text-white' : 'text-gray-400'}`}>{label}</span>
      </div>
      {badge && <span className="w-4 h-4 bg-[#592224] rounded-full flex items-center justify-center text-[9px] font-bold text-white">{badge}</span>}
      {hasSub && <ArrowRight className="w-3 h-3 text-gray-500" />}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, trend, trendUp }: any) {
  return (
    <div className="bg-[#150D0C] border border-[#3D2620] rounded-xl p-4 flex flex-col justify-between hover:border-[#C8A27C]/50 transition-colors">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-full border border-[#C8A27C]/30 bg-[#1A1211] flex items-center justify-center">
          <Icon className="w-4 h-4 text-[#C8A27C]" />
        </div>
        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div>
        <div className="text-2xl font-light text-white mb-1">{value}</div>
        <div className={`text-[9px] font-bold ${trendUp ? 'text-green-500' : 'text-gray-500'}`}>
          {trend}
        </div>
      </div>
    </div>
  );
}

function TabButton({ label, count, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 pb-2 border-b-2 transition-all whitespace-nowrap ${active ? 'border-[#C8A27C] text-[#C8A27C]' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
      <span className="text-[11px] font-semibold">{label}</span>
      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-[#2A1616] text-[#C8A27C]' : 'bg-[#1A1211] text-gray-500'}`}>{count}</span>
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const getBadgeStyle = () => {
    switch (status.toLowerCase()) {
      case 'novo': return 'bg-green-900/40 text-green-400 border border-green-800';
      case 'atendimento':
      case 'contact': return 'bg-purple-900/40 text-purple-400 border border-purple-800';
      case 'proposal': return 'bg-blue-900/40 text-blue-400 border border-blue-800';
      default: return 'bg-orange-900/40 text-orange-400 border border-orange-800';
    }
  };
  const getBadgeText = () => {
    switch (status.toLowerCase()) {
      case 'novo': return 'Nova consulta';
      case 'atendimento':
      case 'contact': return 'Em atendimento';
      case 'proposal': return 'Proposta enviada';
      default: return 'Aguardando retorno';
    }
  };
  
  return (
    <span className={`text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${getBadgeStyle()}`}>
      {getBadgeText()}
    </span>
  );
}

function ActivityItem({ title, time, icon: Icon, color }: any) {
  const isGreen = color === 'green';
  return (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${isGreen ? 'border-green-900/50 bg-green-900/20 text-green-500' : 'border-gray-800 bg-[#1A1211] text-gray-400'}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div>
        <p className="text-[11px] font-bold text-gray-200">{title}</p>
        <p className="text-[9px] text-gray-500">{time}</p>
      </div>
    </div>
  );
}

function MaterialBtn({ icon: Icon, label }: any) {
  return (
    <button className="bg-[#1A1211] border border-[#3D2620] hover:border-[#C8A27C]/50 rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all group">
      <Icon className="w-4 h-4 text-gray-400 group-hover:text-[#C8A27C] transition-colors" />
      <span className="text-[8px] text-center text-gray-400 group-hover:text-gray-200 leading-tight">{label}</span>
    </button>
  );
}

function LinkBtn({ label, icon: Icon }: any) {
  return (
    <button className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-[#1A1211] transition-colors group">
      <div className="flex items-center gap-2">
        {Icon ? <Icon className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#C8A27C]" /> : <span className="w-3.5 h-3.5" />}
        <span className="text-[10px] text-gray-300 group-hover:text-white transition-colors">{label}</span>
      </div>
      <span className="text-[9px] text-gray-600 flex items-center gap-1 group-hover:text-[#C8A27C]">Abrir <ArrowRight className="w-2.5 h-2.5" /></span>
    </button>
  );
}
