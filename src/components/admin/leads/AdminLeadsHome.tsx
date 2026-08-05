'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Search, Users, Trash2, Mail, Phone, Calendar, UserCheck, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getLeads, updateLeadStatusAction, updateLeadConsultantAction, deleteLeadAction } from '@/actions/leadsActions';
import { getUsers } from '@/actions/usersActions';
import { useToast } from '@/contexts/ToastContext';

const STATUS_COLORS: Record<string, string> = {
  novo: 'bg-blue-900/30 text-blue-400 border-blue-800',
  atendimento: 'bg-yellow-900/30 text-yellow-400 border-yellow-800',
  proposta: 'bg-purple-900/30 text-purple-400 border-purple-800',
  fechado: 'bg-green-900/30 text-green-400 border-green-800',
  perdido: 'bg-red-900/30 text-red-400 border-red-800',
};

export default function AdminLeadsHome() {
  const [leads, setLeads] = useState<any[]>([]);
  const [consultants, setConsultants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 15;
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const [lRes, cRes] = await Promise.all([
      getLeads({ page, pageSize: PAGE_SIZE, search, status: statusFilter || undefined }),
      getUsers({ role: 'consultora' }),
    ]);
    if (lRes.success && lRes.data) { setLeads(lRes.data); setTotal(lRes.total || 0); }
    if (cRes.success && cRes.data) setConsultants(cRes.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [search, statusFilter, page]);

  const handleStatusChange = async (id: string, status: string) => {
    const res = await updateLeadStatusAction(id, status);
    if (res.success) { toast(`Status atualizado para "${status}"`); load(); }
  };

  const handleConsultantChange = async (id: string, consultantId: string) => {
    const res = await updateLeadConsultantAction(id, consultantId || null);
    if (res.success) { toast('Consultor(a) atribuído!'); load(); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir o lead "${name}" permanentemente?`)) return;
    const res = await deleteLeadAction(id);
    if (res.success) { toast('Lead excluído!'); load(); }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--admin-card)] border border-[var(--admin-border)] p-4 md:p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-[var(--admin-text-main)] mb-1 flex items-center gap-2">
            <Users className="w-5 h-5 text-[var(--admin-primary)]" /> CRM / Leads
          </h2>
          <p className="text-xs text-[var(--admin-text-muted)]">{total} leads captados</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={load} variant="outline" className="h-9 px-3 border-[var(--admin-border)] text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-muted)]" />
          <Input placeholder="Buscar lead..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-xs bg-[var(--admin-card)] border-[var(--admin-border)] focus:border-[var(--admin-primary)] text-[var(--admin-text-main)]" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 px-3 text-xs rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-muted)] focus:outline-none focus:border-[var(--admin-primary)]">
          <option value="">Todos os status</option>
          <option value="novo">Novo</option>
          <option value="atendimento">Em Atendimento</option>
          <option value="proposta">Proposta Enviada</option>
          <option value="fechado">Fechado (Ganho)</option>
          <option value="perdido">Perdido</option>
        </select>
      </div>

      <div className="bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--admin-border)] bg-black/5 text-[10px] uppercase tracking-wider text-[var(--admin-text-muted)]">
              <th className="p-4 font-semibold">Lead</th>
              <th className="p-4 font-semibold hidden sm:table-cell">Interesse</th>
              <th className="p-4 font-semibold hidden md:table-cell">Responsável</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center"><RefreshCw className="w-5 h-5 animate-spin mx-auto text-[var(--admin-text-muted)]" /></td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-xs text-[var(--admin-text-muted)]">Nenhum lead encontrado.</td></tr>
            ) : leads.map(lead => (
              <tr key={lead.id} className="border-b border-[var(--admin-border)] hover:bg-[var(--admin-border)]/20 group transition-colors">
                <td className="p-4">
                  <p className="text-sm font-bold text-[var(--admin-text-main)] truncate max-w-[200px]">{lead.name}</p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-[var(--admin-text-muted)]">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {lead.email}</span>
                    {lead.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {lead.phone}</span>}
                  </div>
                </td>
                <td className="p-4 hidden sm:table-cell">
                  <p className="text-[11px] font-semibold text-[var(--admin-text-main)] truncate max-w-[150px]">{lead.destination || 'Geral'}</p>
                  <p className="text-[10px] text-[var(--admin-text-muted)] truncate max-w-[150px]">Origem: {lead.origin || 'Desconhecida'}</p>
                </td>
                <td className="p-4 hidden md:table-cell">
                  <select value={lead.consultantId || ''} onChange={e => handleConsultantChange(lead.id, e.target.value)}
                    className="h-7 px-2 text-[10px] rounded border border-[var(--admin-border)] bg-transparent text-[var(--admin-text-main)] focus:outline-none focus:border-[var(--admin-primary)] max-w-[120px]">
                    <option value="">Sem atribuição</option>
                    {consultants.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </td>
                <td className="p-4">
                  <select value={lead.status} onChange={e => handleStatusChange(lead.id, e.target.value)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-full border appearance-none cursor-pointer outline-none ${STATUS_COLORS[lead.status] || ''}`}>
                    <option value="novo">Novo</option>
                    <option value="atendimento">Em Atend.</option>
                    <option value="proposta">Proposta</option>
                    <option value="fechado">Fechado</option>
                    <option value="perdido">Perdido</option>
                  </select>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleDelete(lead.id, lead.name)} className="p-1.5 rounded-md text-[var(--admin-text-muted)] hover:text-[var(--admin-accent-red)] hover:bg-[var(--admin-accent-red)]/10 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="h-8 px-3 text-xs border-[var(--admin-border)]">Anterior</Button>
          <span className="text-xs text-[var(--admin-text-muted)]">Página {page} de {totalPages}</span>
          <Button variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="h-8 px-3 text-xs border-[var(--admin-border)]">Próxima</Button>
        </div>
      )}
    </motion.div>
  );
}
