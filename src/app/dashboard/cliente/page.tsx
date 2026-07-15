'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Calendar, MapPin, MessageSquare, FileText, DollarSign, User,
  Send, Upload, Download, Check, AlertTriangle, Clock, RefreshCw
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  updateProposalStatusAction,
  submitChatMessageAction,
  uploadDocumentAction
} from '@/actions/crmActions';

// Import mock db engine client-side
import { db } from '@/lib/db';
import { authService } from '@/lib/supabaseAuth';

export default function ClienteDashboard() {
  const [activeTab, setActiveTab] = useState('viagem');
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Data State
  const [trip, setTrip] = useState<any>(null);
  const [proposal, setProposal] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  
  // Input states
  const [chatInput, setChatInput] = useState('');
  const [profileForm, setProfileForm] = useState({ name: 'Bruno Almeida', email: 'cliente@maeum.com', phone: '+55 41 97777-7777' });
  const [profileSaved, setProfileSaved] = useState(false);
  
  // Loading states
  const [loadingAction, setLoadingAction] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load initial data from local DB
  const loadData = () => {
    const user = authService.getCurrentUser();
    const userId = user ? user.id : 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';

    const trips = db.get('trips');
    const brunoTrip = trips.find((t: any) => t.client_id === userId);
    setTrip(brunoTrip || null);

    const proposals = db.get('proposals');
    const brunoProposal = proposals.find((p: any) => p.client_id === userId);
    setProposal(brunoProposal || null);

    const chats = db.get('chats');
    const brunoChat = chats.find((c: any) => c.client_id === userId);
    if (brunoChat) {
      const allMessages = db.get('chat_messages');
      const chatMsgs = allMessages.filter((m: any) => m.chat_id === brunoChat.id);
      setMessages(chatMsgs);
    }

    const docs = db.get('documents');
    const brunoDocs = docs.filter((d: any) => d.client_id === userId);
    setDocuments(brunoDocs);
  };

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    if (user) {
      setProfileForm({ name: user.name, email: user.email, phone: user.phone || '+55 41 97777-7777' });
    }
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Handle Chat Message Submit
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const user = authService.getCurrentUser();
    const userId = user ? user.id : 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';

    const chats = db.get('chats');
    const brunoChat = chats.find((c: any) => c.client_id === userId);
    if (!brunoChat) return;

    const tempMsg = chatInput;
    setChatInput('');

    const res = await submitChatMessageAction(brunoChat.id, userId, tempMsg);
    if (res.success) {
      // Reload chat messages
      const allMessages = db.get('chat_messages');
      setMessages(allMessages.filter((m: any) => m.chat_id === brunoChat.id));
      
      // Simular resposta da consultora Mariana após 2 segundos
      setTimeout(() => {
        const msgs = db.get('chat_messages');
        msgs.push({
          id: crypto.randomUUID(),
          chat_id: brunoChat.id,
          sender_id: 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', // Mariana
          content: 'Entendido, Bruno! Vou verificar essa informação sobre os passeios e te dou um retorno em instantes.',
          attachment_url: null,
          attachment_type: null,
          read_at: null,
          created_at: new Date().toISOString()
        });
        db.save('chat_messages', msgs);
        setMessages(msgs.filter((m: any) => m.chat_id === brunoChat.id));
      }, 2000);
    }
  };

  // Handle Proposal Accept/Reject
  const handleProposalStatus = async (status: 'approved' | 'changes_requested') => {
    if (!proposal) return;
    setLoadingAction(true);
    const res = await updateProposalStatusAction(proposal.id, status, status === 'approved' ? 'Aprovado pelo cliente no painel' : 'Solicitado alteração');
    setLoadingAction(false);
    if (res.success) {
      loadData();
    }
  };

  // Handle Doc Upload (Mock)
  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const res = await uploadDocumentAction('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', {
      file_name: file.name,
      file_url: `/uploads/docs/${file.name}`,
      file_size: file.size,
      category: 'passport'
    });

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
            <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-primary">
              <Image
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200"
                alt="Bruno Almeida"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Painel do Cliente</span>
              <h1 className="font-heading text-3xl font-light text-secondary">Olá, Bruno Almeida</h1>
            </div>
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-2 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-secondary">Próxima Viagem: Seul, Coreia do Sul</span>
          </div>
        </div>

        {/* Dashboard Tabs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Navigation Sidebar */}
          <div className="flex flex-col gap-1 border border-border/80 rounded-2xl p-4 bg-card shadow-sm h-fit">
            {[
              { id: 'viagem', label: 'Minha Viagem', icon: Calendar },
              { id: 'proposta', label: 'Propostas de Viagem', icon: FileText, badge: proposal && proposal.status === 'sent' ? '1' : null },
              { id: 'chat', label: 'Chat com Consultora', icon: MessageSquare },
              { id: 'documentos', label: 'Documentos', icon: Upload },
              { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
              { id: 'perfil', label: 'Meu Perfil', icon: User }
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
                  {tab.badge && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-bounce">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Main Workspace Area */}
          <div className="lg:col-span-3 min-h-[500px]">
            {/* TAB: VIAGEM */}
            {activeTab === 'viagem' && (
              <div className="flex flex-col gap-6">
                {trip ? (
                  <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
                    <h2 className="font-heading text-2xl font-light text-secondary mb-6 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      {trip.title}
                    </h2>
                    
                    {/* Visual Timeline */}
                    <div className="relative pl-6 border-l-2 border-primary/20 flex flex-col gap-8">
                      {trip.timeline.map((item: any, idx: number) => (
                        <div key={idx} className="relative">
                          <div className="absolute -left-[31px] top-1 bg-background border-2 border-primary h-4 w-4 rounded-full" />
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                            <span className="font-bold text-primary">{new Date(item.date).toLocaleDateString('pt-BR')} às {item.time}</span>
                            <span className="text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> Seul
                            </span>
                          </div>
                          <h4 className="font-heading text-lg font-medium text-secondary mt-1">{item.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-border rounded-3xl p-12 text-center bg-card flex flex-col items-center gap-3">
                    <AlertTriangle className="h-8 w-8 text-amber-500" />
                    <h3 className="text-base font-bold text-secondary">Sem Viagem Ativa</h3>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      Sua proposta de viagem ainda está sob análise ou aprovação. Assim que aprovar sua proposta, seu cronograma será gerado automaticamente.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB: PROPOSTA */}
            {activeTab === 'proposta' && (
              <div className="flex flex-col gap-6">
                {proposal ? (
                  <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border/60 pb-4 mb-6 gap-3">
                      <div>
                        <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded uppercase font-bold">
                          Versão {proposal.version}
                        </span>
                        <h2 className="font-heading text-2xl font-light text-secondary mt-1">{proposal.title}</h2>
                      </div>
                      <div className="flex items-center gap-2">
                        {proposal.status === 'sent' && (
                          <span className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs px-3 py-1 rounded-full font-semibold">
                            <Clock className="h-3.5 w-3.5" />
                            Aguardando Aprovação
                          </span>
                        )}
                        {proposal.status === 'approved' && (
                          <span className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 text-xs px-3 py-1 rounded-full font-semibold">
                            <Check className="h-3.5 w-3.5" />
                            Proposta Aprovada!
                          </span>
                        )}
                        {proposal.status === 'changes_requested' && (
                          <span className="flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 text-xs px-3 py-1 rounded-full font-semibold">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Alteração Solicitada
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Proposal Items List */}
                    <div className="flex flex-col gap-4 mb-6">
                      {proposal.items.map((item: any, idx: number) => (
                        <div key={idx} className="border border-border/60 rounded-xl p-4 bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div>
                            <span className="text-[9px] font-bold text-primary uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded">
                              {item.type}
                            </span>
                            <h4 className="text-sm font-bold text-secondary mt-1">{item.name}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">{item.details}</p>
                          </div>
                          <span className="text-sm font-bold text-primary shrink-0">US$ {item.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between border-t border-border/60 pt-4 mb-6">
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Valor Total</span>
                      <span className="font-heading text-2xl font-bold text-primary">US$ {proposal.total_amount.toLocaleString()}</span>
                    </div>

                    {/* Action buttons (only show if waiting/sent) */}
                    {proposal.status === 'sent' && (
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                          onClick={() => handleProposalStatus('approved')}
                          disabled={loadingAction}
                          className="flex-1 bg-primary hover:bg-accent-hover text-white font-bold py-3 rounded-xl"
                        >
                          APROVAR PROPOSTA & SEGUIR
                        </Button>
                        <Button
                          onClick={() => handleProposalStatus('changes_requested')}
                          disabled={loadingAction}
                          variant="outline"
                          className="flex-1 text-red-500 border-red-200 hover:bg-red-50 font-bold py-3 rounded-xl"
                        >
                          SOLICITAR ALTERAÇÕES
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border border-dashed border-border rounded-3xl p-12 text-center bg-card flex flex-col items-center gap-3">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <h3 className="text-base font-bold text-secondary">Nenhuma Proposta Registrada</h3>
                    <p className="text-xs text-muted-foreground">Você ainda não possui nenhuma proposta enviada.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB: CHAT */}
            {activeTab === 'chat' && (
              <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm flex flex-col h-[500px]">
                {/* Chat Header */}
                <div className="border-b border-border bg-muted/30 p-4 flex items-center gap-3">
                  <div className="relative h-10 w-10 rounded-full overflow-hidden border border-primary">
                    <Image
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200"
                      alt="Mariana Santos"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-secondary">Mariana Santos</h3>
                    <span className="text-[10px] text-green-500 font-semibold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 bg-green-500 rounded-full animate-ping" />
                      Consultora Online
                    </span>
                  </div>
                </div>

                {/* Message list area */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                  {messages.map((msg) => {
                    const isClient = msg.sender_id === 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[75%] ${isClient ? 'self-end items-end' : 'self-start items-start'}`}
                      >
                        <div
                          className={`rounded-2xl p-3.5 text-xs leading-relaxed ${
                            isClient ? 'bg-primary text-white rounded-tr-none' : 'bg-muted text-secondary rounded-tl-none border border-border/60'
                          }`}
                        >
                          {msg.content}
                        </div>
                        <span className="text-[9px] text-muted-foreground mt-1 px-1">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat input box */}
                <form onSubmit={handleSendMessage} className="border-t border-border p-3 flex gap-2">
                  <Input
                    required
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Digite sua mensagem para Mariana..."
                    className="flex-1 rounded-xl"
                  />
                  <Button type="submit" className="bg-primary hover:bg-accent-hover text-white rounded-xl">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            )}

            {/* TAB: DOCUMENTOS */}
            {activeTab === 'documentos' && (
              <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
                <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
                  <h2 className="font-heading text-2xl font-light text-secondary">Documentação da Viagem</h2>
                  <div className="relative">
                    <input
                      type="file"
                      id="upload-doc"
                      className="hidden"
                      onChange={handleDocUpload}
                      accept=".pdf,.png,.jpg,.jpeg"
                    />
                    <label htmlFor="upload-doc">
                      <Button size="sm" className="bg-primary hover:bg-accent-hover text-white rounded-xl cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        ENVIAR DOCUMENTO
                      </Button>
                    </label>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {documents.length > 0 ? (
                    documents.map((doc) => (
                      <div key={doc.id} className="border border-border/80 rounded-xl p-4 bg-muted/20 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <FileText className="h-8 w-8 text-primary" />
                          <div>
                            <h4 className="text-sm font-bold text-secondary">{doc.file_name}</h4>
                            <span className="text-[10px] text-muted-foreground uppercase">{doc.category} • {(doc.file_size / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                        </div>
                        <a href={doc.file_url} download className="text-primary hover:text-accent-hover transition-colors">
                          <Download className="h-5 w-5" />
                        </a>
                      </div>
                    ))
                  ) : (
                    <div className="border border-dashed border-border rounded-2xl p-8 text-center text-xs text-muted-foreground">
                      Nenhum passaporte ou visto enviado ainda.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: FINANCEIRO */}
            {activeTab === 'financeiro' && (
              <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
                <h2 className="font-heading text-2xl font-light text-secondary border-b border-border pb-4 mb-6">Controle Financeiro</h2>
                {trip && trip.payments ? (
                  <div className="flex flex-col gap-4">
                    {trip.payments.map((pay: any, idx: number) => (
                      <div key={idx} className="border border-border/85 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/10">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-full ${pay.status === 'paid' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                            <DollarSign className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-secondary">Parcela {idx + 1}</h4>
                            <span className="text-xs text-muted-foreground">Vencimento: {new Date(pay.due_date).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-base font-bold text-primary font-heading">US$ {pay.amount.toFixed(2)}</span>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                            pay.status === 'paid'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {pay.status === 'paid' ? 'Pago' : 'Pendente'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-border rounded-2xl p-8 text-center text-xs text-muted-foreground">
                    Sem registros financeiros.
                  </div>
                )}
              </div>
            )}

            {/* TAB: PERFIL */}
            {activeTab === 'perfil' && (
              <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
                <h2 className="font-heading text-2xl font-light text-secondary border-b border-border pb-4 mb-6">Dados Cadastrais</h2>
                {profileSaved && (
                  <div className="bg-green-50 border border-green-200 text-green-800 text-xs rounded-xl p-3.5 mb-6">
                    ✓ Dados atualizados com sucesso!
                  </div>
                )}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setProfileSaved(true);
                    setTimeout(() => setProfileSaved(false), 3000);
                  }}
                  className="flex flex-col gap-4 max-w-md"
                >
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-secondary">Nome Completo</label>
                    <Input
                      value={profileForm.name}
                      onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-secondary">E-mail</label>
                    <Input
                      type="email"
                      value={profileForm.email}
                      onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-secondary">WhatsApp</label>
                    <Input
                      value={profileForm.phone}
                      onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="bg-primary hover:bg-accent-hover text-white rounded-xl font-bold mt-2">
                    SALVAR ALTERAÇÕES
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
