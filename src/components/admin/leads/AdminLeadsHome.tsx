'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit3, Trash2, Search, Filter, RefreshCw, User, Phone, Mail, MapPin, DollarSign, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getLeads, deleteLead, updateLeadStatus, createLead } from '@/actions/leadActions';
import { useToast } from '@/contexts/ToastContext';
import { AnimatePresence } from 'framer-motion';

export default function AdminLeadsHome() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    destination: '',
    budget: '',
    notes: ''
  });
  const { toast } = useToast();

  const loadLeads = async () => {
    setLoading(true);
    const res = await getLeads();
    if (res.success && res.data) {
      setLeads(res.data);
    } else {
      toast('Erro ao carregar leads');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente permanentemente?')) {
      const res = await deleteLead(id);
      if (res.success) {
        toast('Lead excluído com sucesso');
        loadLeads();
      } else {
        toast('Erro ao excluir lead');
      }
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const res = await updateLeadStatus(id, newStatus);
    if (res.success) {
      toast(`Status alterado para ${newStatus}`);
      loadLeads();
    } else {
      toast('Erro ao mudar status');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return toast('O nome é obrigatório!');
    
    setIsSubmitting(true);
    const res = await createLead({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      destination: formData.destination,
      budget: formData.budget ? Number(formData.budget) : undefined,
      notes: formData.notes
    });

    if (res.success) {
      toast('Cliente cadastrado com sucesso!');
      setIsModalOpen(false);
      setFormData({ name: '', email: '', phone: '', destination: '', budget: '', notes: '' });
      loadLeads();
    } else {
      toast('Erro ao cadastrar cliente.');
    }
    setIsSubmitting(false);
  };

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase()) || 
    l.email?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'novo') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (s === 'atendimento') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (s === 'proposta') return 'bg-purple-50 text-purple-700 border-purple-200';
    if (s === 'fechado') return 'bg-green-50 text-green-700 border-green-200';
    if (s === 'perdido') return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6 w-full min-w-0 flex-1"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--admin-card)] border border-[var(--admin-border)] p-4 md:p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-[var(--admin-text-main)] mb-1">Consultas & Leads</h2>
          <p className="text-xs text-[var(--admin-text-muted)]">Gerencie seus clientes e o funil de vendas</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={loadLeads} variant="outline" className="h-9 px-3 border-[var(--admin-border)] text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="h-9 px-4 bg-[var(--admin-primary)] hover:bg-[var(--admin-primary-hover)] text-white">
            <Plus className="w-4 h-4 mr-2" /> Novo Cliente
          </Button>
        </div>
      </div>

      <div className="bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-2xl overflow-hidden flex flex-col min-h-0 flex-1">
        <div className="p-4 border-b border-[var(--admin-border)] flex flex-col sm:flex-row sm:items-center gap-4 justify-between bg-black/5">
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-muted)]" />
            <Input 
              placeholder="Buscar cliente por nome ou email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs bg-[var(--admin-bg)] border-[var(--admin-border)] focus:border-[var(--admin-primary)] text-[var(--admin-text-main)]"
            />
          </div>
          <Button variant="outline" className="h-9 px-3 text-xs border-[var(--admin-border)] text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 mr-2" /> Filtrar
          </Button>
        </div>

        <div className="flex-1 overflow-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--admin-border)] bg-black/5 text-[10px] uppercase tracking-wider text-[var(--admin-text-muted)] font-semibold">
                <th className="p-4 font-semibold whitespace-nowrap">Cliente</th>
                <th className="p-4 font-semibold whitespace-nowrap hidden sm:table-cell">Contato</th>
                <th className="p-4 font-semibold whitespace-nowrap hidden md:table-cell">Interesse</th>
                <th className="p-4 font-semibold whitespace-nowrap hidden lg:table-cell">Orçamento</th>
                <th className="p-4 font-semibold whitespace-nowrap">Status</th>
                <th className="p-4 font-semibold text-right whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-[var(--admin-text-muted)]">
                    Carregando leads...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-[var(--admin-text-muted)]">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="border-b border-[var(--admin-border)] hover:bg-[var(--admin-border)]/20 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[var(--admin-border)] flex items-center justify-center shrink-0 overflow-hidden border border-[var(--admin-border)]">
                          {lead.avatar_url ? (
                            <img src={lead.avatar_url} alt={lead.name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-4 h-4 text-[var(--admin-text-muted)]" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-[var(--admin-text-main)] truncate">{lead.name}</span>
                          <span className="text-[10px] text-[var(--admin-text-muted)] truncate block sm:hidden">{lead.email || lead.phone || 'Sem contato'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <div className="flex flex-col gap-1 text-[11px] text-[var(--admin-text-muted)]">
                        {lead.email && <span className="flex items-center gap-1.5 truncate"><Mail className="w-3 h-3 shrink-0" /> {lead.email}</span>}
                        {lead.phone && <span className="flex items-center gap-1.5 truncate"><Phone className="w-3 h-3 shrink-0" /> {lead.phone}</span>}
                        {!lead.email && !lead.phone && <span>-</span>}
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell text-[11px] text-[var(--admin-text-main)]">
                      {lead.destination ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-[var(--admin-border)]/50 rounded-md border border-[var(--admin-border)] whitespace-nowrap">
                          <MapPin className="w-3 h-3 text-[var(--admin-primary)]" /> {lead.destination}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="p-4 hidden lg:table-cell text-[11px] font-medium text-[var(--admin-text-main)] whitespace-nowrap">
                      {lead.budget ? (
                        <span className="inline-flex items-center gap-1 text-[var(--admin-accent-green)]">
                          <DollarSign className="w-3 h-3" />
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.budget)}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="p-4">
                      <select 
                        value={lead.status || 'novo'}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        className={`text-[10px] font-bold px-2 py-1 rounded border appearance-none cursor-pointer outline-none ${getStatusBadge(lead.status || 'novo')}`}
                      >
                        <option value="novo">Novo</option>
                        <option value="atendimento">Em Atendimento</option>
                        <option value="proposta">Proposta Enviada</option>
                        <option value="fechado">Fechado (Ganho)</option>
                        <option value="perdido">Perdido</option>
                      </select>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-[var(--admin-text-muted)] hover:text-[var(--admin-primary)] hover:bg-[var(--admin-border)] rounded-md transition-colors">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(lead.id)} className="p-1.5 text-[var(--admin-text-muted)] hover:text-[var(--admin-accent-red)] hover:bg-[var(--admin-accent-red)]/10 rounded-md transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Criação de Lead */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[var(--admin-bg)] border border-[var(--admin-border)] shadow-2xl rounded-2xl z-[101] overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-[var(--admin-border)] bg-[var(--admin-card)]">
                <h3 className="text-lg font-bold text-[var(--admin-text-main)]">Novo Cliente / Lead</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto no-scrollbar flex-1">
                <form id="createLeadForm" onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[var(--admin-text-main)]">Nome Completo *</label>
                    <Input 
                      required 
                      value={formData.name} 
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-[var(--admin-card)] border-[var(--admin-border)] focus:border-[var(--admin-primary)] text-sm" 
                      placeholder="Ex: Carlos Eduardo" 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[var(--admin-text-main)]">E-mail</label>
                      <Input 
                        type="email"
                        value={formData.email} 
                        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="bg-[var(--admin-card)] border-[var(--admin-border)] focus:border-[var(--admin-primary)] text-sm" 
                        placeholder="email@exemplo.com" 
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[var(--admin-text-main)]">Telefone / WhatsApp</label>
                      <Input 
                        value={formData.phone} 
                        onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="bg-[var(--admin-card)] border-[var(--admin-border)] focus:border-[var(--admin-primary)] text-sm" 
                        placeholder="(11) 99999-9999" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[var(--admin-text-main)]">Destino de Interesse</label>
                      <Input 
                        value={formData.destination} 
                        onChange={e => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                        className="bg-[var(--admin-card)] border-[var(--admin-border)] focus:border-[var(--admin-primary)] text-sm" 
                        placeholder="Ex: Coreia do Sul" 
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[var(--admin-text-main)]">Orçamento Previsto (R$)</label>
                      <Input 
                        type="number"
                        value={formData.budget} 
                        onChange={e => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                        className="bg-[var(--admin-card)] border-[var(--admin-border)] focus:border-[var(--admin-primary)] text-sm" 
                        placeholder="Ex: 15000" 
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[var(--admin-text-main)]">Observações Iniciais</label>
                    <textarea 
                      value={formData.notes} 
                      onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      className="flex min-h-[80px] w-full rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm text-[var(--admin-text-main)] focus-visible:outline-none focus-visible:border-[var(--admin-primary)] resize-none"
                      placeholder="Detalhes sobre a viagem, expectativas, etc..."
                    />
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-[var(--admin-border)] bg-[var(--admin-card)] flex justify-end gap-3">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)}
                  className="border-[var(--admin-border)] text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50"
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button 
                  form="createLeadForm"
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[var(--admin-primary)] hover:bg-[var(--admin-primary-hover)] text-white font-medium"
                >
                  {isSubmitting ? 'Salvando...' : 'Cadastrar Cliente'}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
