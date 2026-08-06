'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Users, MessageSquare, Plus, FileText, Send, Check,
  AlertCircle, ArrowRight, UserPlus, Info, Save, ChevronRight
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createProposalAction } from '@/actions/crmActions';
import { getAdminChats, getChatMessages, submitChatMessageAction } from '@/actions/chatActions';
import { authService } from '@/lib/supabaseAuth';

// Import db engine client-side (still used for CRM/Proposals temporarily)
import { db } from '@/lib/db';

const WORKFLOW_STAGES = [
  { id: 'lead', name: 'Lead' },
  { id: 'contact', name: 'Contato' },
  { id: 'proposal', name: 'Proposta' },
  { id: 'negotiation', name: 'Negociação' },
  { id: 'approval', name: 'Aprovado' },
  { id: 'payment', name: 'Pagamento' },
  { id: 'trip_preparation', name: 'Preparação' },
  { id: 'trip_completed', name: 'Concluído' }
];

export default function ConsultoraDashboard() {
  const [activeTab, setActiveTab] = useState('crm');
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Data States
  const [leads, setLeads] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  // Form states
  const [chatInput, setChatInput] = useState('');
  const [propTitle, setPropTitle] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33');
  const [propItems, setPropItems] = useState<{ name: string; type: string; price: number; details: string }[]>([]);
  const [propSuccess, setPropSuccess] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load database values
  const loadData = () => {
    // Load leads assigned to Mariana (id: c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22)
    const allLeads = db.get('crm_leads');
    const marianaLeads = allLeads.filter((l: any) => l.assigned_consultant_id === 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22');
    setLeads(marianaLeads);

    // Load active chats from Real Database
    if (currentUser?.id) {
      getAdminChats(currentUser.id).then(res => {
        if (res.success && res.chats) setChats(res.chats);
      });
    }

    // Load proposals
    const allProps = db.get('proposals');
    const marianaProps = allProps.filter((p: any) => p.consultant_id === 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22');
    setProposals(marianaProps);

    // Load clients
    const allUsers = db.get('users') || [];
    const customerUsers = allUsers.filter((u: any) => u.role === 'customer');
    setClients(customerUsers);

    // Load active chat messages from Real Database
    if (activeChat) {
      getChatMessages(activeChat.id).then(res => {
        if (res.success && res.messages) {
          setChatMessages(res.messages);
        }
      });
    }
  };

  // Re-fetch chats occasionally
  useEffect(() => {
    if (activeTab === 'chat') {
      const interval = setInterval(loadData, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, currentUser]);

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    loadData();
    // Auto scroll chat
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeChat, activeTab]);

  // Update lead status in CRM Kanban
  const updateLeadStatus = (leadId: string, newStatus: any) => {
    const allLeads = db.get('crm_leads');
    const idx = allLeads.findIndex((l: any) => l.id === leadId);
    if (idx !== -1) {
      allLeads[idx].status = newStatus;
      allLeads[idx].updated_at = new Date().toISOString();
      db.save('crm_leads', allLeads);
      loadData();
    }
  };

  // Add Item to Builder
  const addProposalItem = () => {
    setPropItems([...propItems, { name: '', type: 'extra', price: 0, details: '' }]);
  };

  // Submit Proposal
  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = propItems.reduce((acc, curr) => acc + Number(curr.price || 0), 0);
    const res = await createProposalAction(
      selectedClientId,
      'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', // Mariana Santos (consultant)
      propTitle || 'Proposta de Viagem Customizada',
      propItems,
      total
    );

    if (res.success) {
      setPropSuccess(true);
      setPropTitle('');
      setPropItems([{ name: 'Essência da Coreia do Sul', type: 'package', price: 3500.00, details: '10 dias de passeios exclusivos' }]);
      loadData();
      setTimeout(() => setPropSuccess(false), 3000);
    }
  };

  // Chat message submit
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChat || !currentUser) return;

    const tempMsg = chatInput;
    setChatInput('');

    // Adiciona otimisticamente na tela
    const tempMsgObj = {
      id: Date.now().toString(),
      chatId: activeChat.id,
      senderId: currentUser.id,
      content: tempMsg,
      createdAt: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, tempMsgObj]);

    const res = await submitChatMessageAction(activeChat.id, currentUser.id, tempMsg);
    if (res.success) {
      loadData();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full py-12 px-4 md:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-border/60 pb-6 mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-primary bg-muted flex items-center justify-center">
              {currentUser?.avatarUrl ? (
                <Image src={currentUser.avatarUrl} alt={currentUser.name} fill className="object-cover" />
              ) : (
                <span className="text-xl font-bold text-muted-foreground uppercase">{currentUser?.name?.[0] || 'C'}</span>
              )}
            </div>
            <div>
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Área da Consultora</span>
              <h1 className="font-heading text-3xl font-light text-secondary">Olá, {currentUser?.name || 'Consultora'}</h1>
            </div>
          </div>
        </div>

        {/* Dashboard Tabs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Navigation Sidebar */}
          <div className="flex flex-col gap-1 border border-border/80 rounded-2xl p-4 bg-card shadow-sm h-fit">
            {[
              { id: 'crm', label: 'CRM & Leads Kanban', icon: Users },
              { id: 'builder', label: 'Criar Proposta', icon: Plus },
              { id: 'chat', label: 'Chat com Clientes', icon: MessageSquare },
              { id: 'propostas', label: 'Histórico de Propostas', icon: FileText }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                    activeTab === tab.id
                      ? 'bg-primary text-white shadow-sm'
                      : 'hover:bg-muted text-secondary/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Main Area */}
          <div className="lg:col-span-3 min-h-[500px]">
            {/* TAB: CRM Kanban */}
            {activeTab === 'crm' && (
              <div className="flex flex-col gap-6">
                <h2 className="font-heading text-2xl font-light text-secondary">Quadro Kanban do CRM</h2>
                
                {/* Stages lists */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {['lead', 'proposal', 'negotiation', 'approval'].map((stageId) => {
                    const stage = WORKFLOW_STAGES.find(s => s.id === stageId);
                    const stageLeads = leads.filter(l => l.status === stageId);
                    
                    return (
                      <div key={stageId} className="bg-muted/40 border border-border/60 rounded-2xl p-4 flex flex-col gap-3 min-h-[250px]">
                        <div className="flex items-center justify-between border-b border-border/60 pb-2">
                          <span className="text-xs font-bold text-secondary uppercase tracking-wider">{stage?.name}</span>
                          <span className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">{stageLeads.length}</span>
                        </div>

                        <div className="flex flex-col gap-3 overflow-y-auto max-h-[400px]">
                          {stageLeads.map((lead) => (
                            <div key={lead.id} className="bg-card border border-border/80 rounded-xl p-4 shadow-sm hover:border-primary/50 transition-colors flex flex-col justify-between min-h-[120px]">
                              <div>
                                <h4 className="text-xs font-bold text-secondary">{lead.name}</h4>
                                <span className="text-[10px] text-muted-foreground block mt-0.5">{lead.email}</span>
                                <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded mt-2 inline-block font-semibold">{lead.interest_destination}</span>
                              </div>
                              <div className="flex items-center justify-between mt-4 pt-2 border-t border-border/50">
                                <span className="text-[9px] text-muted-foreground">Origem: {lead.origin.split(' ')[0]}</span>
                                <button
                                  onClick={() => {
                                    const nextIdx = WORKFLOW_STAGES.findIndex(s => s.id === stageId) + 1;
                                    if (nextIdx < WORKFLOW_STAGES.length) {
                                      updateLeadStatus(lead.id, WORKFLOW_STAGES[nextIdx].id);
                                    }
                                  }}
                                  className="text-accent hover:text-accent-hover"
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB: BUILDER */}
            {activeTab === 'builder' && (
              <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
                <h2 className="font-heading text-2xl font-light text-secondary border-b border-border pb-4 mb-6 flex items-center gap-2">
                  <Plus className="h-5 w-5 text-accent" />
                  Construtor de Proposta Dinâmica (Airbnb Style)
                </h2>

                {propSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-800 text-xs rounded-xl p-3.5 mb-6">
                    ✓ Proposta criada com sucesso! O cliente receberá a versão mais recente em seu dashboard.
                  </div>
                )}

                <form onSubmit={handleCreateProposal} className="flex flex-col gap-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">Cliente Destinatário</label>
                      <select
                        value={selectedClientId}
                        onChange={e => setSelectedClientId(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-secondary"
                      >
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-secondary">Título da Proposta</label>
                      <Input
                        required
                        value={propTitle}
                        onChange={e => setPropTitle(e.target.value)}
                        placeholder="Ex: Roteiro dos Sonhos: Coreia com Hotéis de Luxo"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <h3 className="text-sm font-bold text-secondary uppercase tracking-wider">Itens do Orçamento</h3>
                    
                    {propItems.map((item, idx) => (
                      <div key={idx} className="border border-border/80 rounded-xl p-4 bg-muted/10 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                        <div className="flex flex-col gap-1.5 col-span-2">
                          <label className="text-[10px] font-semibold text-muted-foreground uppercase">Nome do Serviço</label>
                          <Input
                            required
                            value={item.name}
                            onChange={e => {
                              const updated = [...propItems];
                              updated[idx].name = e.target.value;
                              setPropItems(updated);
                            }}
                            placeholder="Ex: Hospedagem Hyatt Seul"
                            className="h-9 text-xs"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-semibold text-muted-foreground uppercase">Preço (USD)</label>
                          <Input
                            required
                            type="number"
                            value={item.price}
                            onChange={e => {
                              const updated = [...propItems];
                              updated[idx].price = Number(e.target.value);
                              setPropItems(updated);
                            }}
                            placeholder="0.00"
                            className="h-9 text-xs"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            const updated = propItems.filter((_, i) => i !== idx);
                            setPropItems(updated);
                          }}
                          className="text-red-500 hover:text-red-700 h-9 text-xs"
                        >
                          Remover
                        </Button>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={addProposalItem}
                      className="w-fit border-primary text-primary hover:bg-primary/5 text-xs rounded-xl"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Adicionar Item
                    </Button>
                  </div>

                  <Button type="submit" className="bg-primary hover:bg-accent-hover text-white py-3 rounded-xl font-bold mt-4">
                    SALVAR E ENVIAR AO CLIENTE
                  </Button>
                </form>
              </div>
            )}

            {/* TAB: CHAT */}
            {activeTab === 'chat' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 border border-border rounded-3xl overflow-hidden shadow-sm h-[500px] bg-card">
                {/* Chat client list */}
                <div className="border-r border-border bg-muted/20 p-4 flex flex-col gap-3">
                  <h3 className="text-xs font-bold text-secondary uppercase tracking-wider border-b border-border/60 pb-2">Chats Ativos</h3>
                  {chats.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setActiveChat(c)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                        activeChat?.id === c.id
                          ? 'border-primary bg-primary/10 text-primary font-bold'
                          : 'border-border bg-card hover:bg-muted text-secondary/80'
                      }`}
                    >
                      <div className="relative h-8 w-8 rounded-full overflow-hidden">
                        <Image src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200" alt="Cliente" fill className="object-cover" />
                      </div>
                      <div className="truncate text-left w-full">
                        <h4 className="text-xs font-bold">{c.customer?.name || 'Cliente'}</h4>
                        <span className="text-[10px] text-muted-foreground">{c.customer?.email || 'Nenhum e-mail'}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Messages pane */}
                <div className="sm:col-span-2 flex flex-col h-full bg-card justify-between">
                  {activeChat ? (
                    <>
                      <div className="border-b border-border bg-muted/30 p-4 flex items-center gap-3">
                        <h3 className="text-xs font-bold text-secondary">Chat com {activeChat.customer?.name || 'Cliente'}</h3>
                      </div>

                      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                        {chatMessages.map((msg) => {
                          const isConsultant = msg.senderId === currentUser?.id;
                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col max-w-[75%] ${isConsultant ? 'self-end items-end' : 'self-start items-start'}`}
                            >
                              <div
                                className={`rounded-2xl p-3.5 text-xs leading-relaxed ${
                                  isConsultant ? 'bg-primary text-white rounded-tr-none' : 'bg-muted text-secondary rounded-tl-none border border-border/60'
                                }`}
                              >
                                {msg.content}
                              </div>
                              <span className="text-[9px] text-muted-foreground mt-1 px-1">
                                {new Date(msg.createdAt || msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>

                      <form onSubmit={handleChatSubmit} className="border-t border-border p-3 flex gap-2">
                        <Input
                          required
                          value={chatInput}
                          onChange={e => setChatInput(e.target.value)}
                          placeholder="Digite sua resposta..."
                          className="flex-1 rounded-xl"
                        />
                        <Button type="submit" className="bg-primary hover:bg-accent-hover text-white rounded-xl">
                          <Send className="h-4 w-4" />
                        </Button>
                      </form>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-xs text-muted-foreground">
                      Selecione um cliente ao lado para carregar a conversa.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: PROPOSTAS HISTORY */}
            {activeTab === 'propostas' && (
              <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
                <h2 className="font-heading text-2xl font-light text-secondary border-b border-border pb-4 mb-6">Histórico de Propostas Enviadas</h2>
                
                <div className="flex flex-col gap-4">
                  {proposals.map((prop) => (
                    <div key={prop.id} className="border border-border/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/10">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded font-bold uppercase">
                            v{prop.version}
                          </span>
                          <h4 className="text-sm font-bold text-secondary">{prop.title}</h4>
                        </div>
                        <span className="text-[10px] text-muted-foreground block mt-1">Atualizado em: {new Date(prop.updated_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-primary">US$ {prop.total_amount.toLocaleString()}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          prop.status === 'approved'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : prop.status === 'changes_requested'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {prop.status === 'approved' ? 'Aprovado' : prop.status === 'changes_requested' ? 'Revisão Solicitada' : 'Aguardando'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
