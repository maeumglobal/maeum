'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit3, Trash2, Search, RefreshCw, Globe2, CalendarDays, DollarSign, X, ArrowUp, ArrowDown, Users, Sparkles, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getJourneys, createJourney, updateJourney, deleteJourney, createJourneyDeparture, deleteJourneyDeparture } from '@/actions/journeyActions';
import { useToast } from '@/contexts/ToastContext';

export default function AdminJourneysHome() {
  const [journeys, setJourneys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDepartureModalOpen, setIsDepartureModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedJourney, setSelectedJourney] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '', subtitle: '', concept: '', durationDays: '10', totalSpots: '15',
    pricePerPerson: '', mainImage: '', status: 'active', category: 'premium',
  });
  const [departureForm, setDepartureForm] = useState({ startDate: '', endDate: '', availableSpots: '15', notes: '' });
  const { toast } = useToast();

  const loadJourneys = async () => {
    setLoading(true);
    const res = await getJourneys({ search, category: categoryFilter || undefined });
    if (res.success && res.data) setJourneys(res.data);
    setLoading(false);
  };

  useEffect(() => { loadJourneys(); }, [search, categoryFilter]);

  const openModal = (item?: any) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title, subtitle: item.subtitle || '', concept: item.concept || '',
        durationDays: String(item.durationDays), totalSpots: String(item.totalSpots),
        pricePerPerson: String(item.pricePerPerson), mainImage: item.mainImage || '',
        status: item.status, category: item.category,
      });
    } else {
      setEditingItem(null);
      setFormData({ title: '', subtitle: '', concept: '', durationDays: '10', totalSpots: '15', pricePerPerson: '', mainImage: '', status: 'active', category: 'premium' });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta jornada permanentemente?')) return;
    const res = await deleteJourney(id);
    if (res.success) { toast('Jornada excluída!'); loadJourneys(); }
    else toast('Erro ao excluir.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.pricePerPerson) return toast('Preencha título e preço!');
    setIsSubmitting(true);
    const payload = {
      ...formData,
      slug: formData.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now(),
      durationDays: Number(formData.durationDays),
      totalSpots: Number(formData.totalSpots),
      pricePerPerson: Number(formData.pricePerPerson),
    };
    const res = editingItem ? await updateJourney(editingItem.id, payload) : await createJourney(payload);
    if (res.success) {
      toast(editingItem ? 'Jornada atualizada!' : 'Jornada criada!');
      setIsModalOpen(false);
      loadJourneys();
    } else toast('Erro ao salvar.');
    setIsSubmitting(false);
  };

  const handleAddDeparture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!departureForm.startDate || !departureForm.endDate || !selectedJourney) return;
    const res = await createJourneyDeparture({
      journeyId: selectedJourney.id,
      startDate: departureForm.startDate,
      endDate: departureForm.endDate,
      availableSpots: Number(departureForm.availableSpots),
      totalSpots: Number(departureForm.availableSpots),
      notes: departureForm.notes,
    });
    if (res.success) {
      toast('Data de saída adicionada!');
      setDepartureForm({ startDate: '', endDate: '', availableSpots: '15', notes: '' });
      loadJourneys();
    } else toast('Erro ao adicionar data.');
  };

  const handleDeleteDeparture = async (depId: string) => {
    const res = await deleteJourneyDeparture(depId);
    if (res.success) { toast('Data removida!'); loadJourneys(); }
  };

  const CATEGORY_BADGE: Record<string, string> = {
    premium: 'bg-[var(--admin-primary)]/20 text-[var(--admin-primary)] border-[var(--admin-primary)]/30',
    army: 'bg-purple-900/30 text-purple-400 border-purple-800',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--admin-card)] border border-[var(--admin-border)] p-4 md:p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-[var(--admin-text-main)] mb-1 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--admin-primary)]" /> Jornadas
          </h2>
          <p className="text-xs text-[var(--admin-text-muted)]">Gerencie jornadas em grupo e suas datas de saída</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={loadJourneys} variant="outline" className="h-9 px-3 border-[var(--admin-border)] text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => openModal()} className="h-9 px-4 bg-[var(--admin-primary)] hover:bg-[var(--admin-primary-hover)] text-black font-semibold">
            <Plus className="w-4 h-4 mr-1" /> Nova Jornada
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-muted)]" />
          <Input placeholder="Buscar jornada..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs bg-[var(--admin-card)] border-[var(--admin-border)] focus:border-[var(--admin-primary)] text-[var(--admin-text-main)]" />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          className="h-9 px-3 text-xs rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-muted)] focus:outline-none focus:border-[var(--admin-primary)]">
          <option value="">Todas as categorias</option>
          <option value="premium">Premium</option>
          <option value="army">ARMY</option>
        </select>
      </div>

      <div className="bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--admin-border)] bg-black/5 text-[10px] uppercase tracking-wider text-[var(--admin-text-muted)]">
              <th className="p-4 font-semibold">Jornada</th>
              <th className="p-4 font-semibold hidden md:table-cell">Categoria</th>
              <th className="p-4 font-semibold hidden lg:table-cell">Datas</th>
              <th className="p-4 font-semibold hidden sm:table-cell">Preço</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-xs text-[var(--admin-text-muted)]"><RefreshCw className="w-5 h-5 animate-spin mx-auto" /></td></tr>
            ) : journeys.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-xs text-[var(--admin-text-muted)]">Nenhuma jornada encontrada.</td></tr>
            ) : journeys.map(j => (
              <tr key={j.id} className="border-b border-[var(--admin-border)] hover:bg-[var(--admin-border)]/20 transition-colors group">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {j.mainImage ? (
                      <img src={j.mainImage} alt={j.title} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[var(--admin-border)] flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-[var(--admin-text-muted)]" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--admin-text-main)] truncate max-w-[200px]">{j.title}</p>
                      <p className="text-[10px] text-[var(--admin-text-muted)]">{j.durationDays} dias • {j.totalSpots} vagas</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 hidden md:table-cell">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${CATEGORY_BADGE[j.category] || ''}`}>
                    {j.category === 'army' ? 'ARMY' : 'Premium'}
                  </span>
                </td>
                <td className="p-4 hidden lg:table-cell">
                  <div className="flex items-center gap-1 text-[11px] text-[var(--admin-text-muted)]">
                    <CalendarDays className="w-3 h-3" />
                    {j.departures?.length || 0} data(s)
                  </div>
                </td>
                <td className="p-4 hidden sm:table-cell text-[11px] font-bold text-[var(--admin-accent-green)]">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(j.pricePerPerson)}
                </td>
                <td className="p-4">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${j.status === 'active' ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-yellow-900/30 text-yellow-400 border-yellow-800'}`}>
                    {j.status === 'active' ? 'Ativa' : 'Rascunho'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setSelectedJourney(j); setIsDepartureModalOpen(true); }} title="Datas de saída"
                      className="p-1.5 rounded-md text-[var(--admin-text-muted)] hover:text-[var(--admin-primary)] hover:bg-[var(--admin-border)] transition-colors">
                      <CalendarDays className="w-4 h-4" />
                    </button>
                    <button onClick={() => openModal(j)} className="p-1.5 rounded-md text-[var(--admin-text-muted)] hover:text-[var(--admin-primary)] hover:bg-[var(--admin-border)] transition-colors">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(j.id)} className="p-1.5 rounded-md text-[var(--admin-text-muted)] hover:text-[var(--admin-accent-red)] hover:bg-[var(--admin-accent-red)]/10 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-[var(--admin-bg)] border border-[var(--admin-border)] shadow-2xl rounded-2xl z-[101] flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between p-6 border-b border-[var(--admin-border)] bg-[var(--admin-card)]">
                <h3 className="text-lg font-bold text-[var(--admin-text-main)]">{editingItem ? 'Editar Jornada' : 'Nova Jornada'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)]"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 overflow-y-auto no-scrollbar flex-1">
                <form id="journeyForm" onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[var(--admin-text-main)]">Título *</label>
                    <Input required value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} className="bg-[var(--admin-card)] border-[var(--admin-border)] focus:border-[var(--admin-primary)] text-sm" placeholder="Ex: Cheotnun — A Magia da Primeira Neve" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[var(--admin-text-main)]">Subtítulo</label>
                    <Input value={formData.subtitle} onChange={e => setFormData(p => ({ ...p, subtitle: e.target.value }))} className="bg-[var(--admin-card)] border-[var(--admin-border)] focus:border-[var(--admin-primary)] text-sm" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[var(--admin-text-main)]">Duração (dias)</label>
                      <Input type="number" value={formData.durationDays} onChange={e => setFormData(p => ({ ...p, durationDays: e.target.value }))} className="bg-[var(--admin-card)] border-[var(--admin-border)] focus:border-[var(--admin-primary)] text-sm" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[var(--admin-text-main)]">Vagas</label>
                      <Input type="number" value={formData.totalSpots} onChange={e => setFormData(p => ({ ...p, totalSpots: e.target.value }))} className="bg-[var(--admin-card)] border-[var(--admin-border)] focus:border-[var(--admin-primary)] text-sm" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[var(--admin-text-main)]">Preço (R$) *</label>
                      <Input required type="number" value={formData.pricePerPerson} onChange={e => setFormData(p => ({ ...p, pricePerPerson: e.target.value }))} className="bg-[var(--admin-card)] border-[var(--admin-border)] focus:border-[var(--admin-primary)] text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[var(--admin-text-main)]">Categoria</label>
                      <select value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))} className="h-10 px-3 text-sm rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-main)] focus:outline-none focus:border-[var(--admin-primary)]">
                        <option value="premium">Premium</option>
                        <option value="army">Projeto ARMY</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[var(--admin-text-main)]">Status</label>
                      <select value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))} className="h-10 px-3 text-sm rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-main)] focus:outline-none focus:border-[var(--admin-primary)]">
                        <option value="active">Ativo</option>
                        <option value="draft">Rascunho</option>
                        <option value="archived">Arquivado</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[var(--admin-text-main)]">URL da Imagem Principal</label>
                    <Input value={formData.mainImage} onChange={e => setFormData(p => ({ ...p, mainImage: e.target.value }))} className="bg-[var(--admin-card)] border-[var(--admin-border)] focus:border-[var(--admin-primary)] text-sm" placeholder="https://..." />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[var(--admin-text-main)]">Conceito / Descrição</label>
                    <textarea value={formData.concept} onChange={e => setFormData(p => ({ ...p, concept: e.target.value }))} className="flex min-h-[80px] w-full rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm text-[var(--admin-text-main)] focus-visible:outline-none focus-visible:border-[var(--admin-primary)] resize-none" />
                  </div>
                </form>
              </div>
              <div className="p-6 border-t border-[var(--admin-border)] bg-[var(--admin-card)] flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="border-[var(--admin-border)] text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50" disabled={isSubmitting}>Cancelar</Button>
                <Button form="journeyForm" type="submit" disabled={isSubmitting} className="bg-[var(--admin-primary)] hover:bg-[var(--admin-primary-hover)] text-black font-semibold">
                  {isSubmitting ? 'Salvando...' : editingItem ? 'Atualizar' : 'Criar Jornada'}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Departures Modal */}
      <AnimatePresence>
        {isDepartureModalOpen && selectedJourney && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDepartureModalOpen(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[var(--admin-bg)] border border-[var(--admin-border)] shadow-2xl rounded-2xl z-[101] flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between p-6 border-b border-[var(--admin-border)] bg-[var(--admin-card)]">
                <div>
                  <h3 className="text-base font-bold text-[var(--admin-text-main)]">Datas de Saída</h3>
                  <p className="text-[11px] text-[var(--admin-text-muted)] truncate max-w-xs">{selectedJourney.title}</p>
                </div>
                <button onClick={() => setIsDepartureModalOpen(false)} className="text-[var(--admin-text-muted)]"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 overflow-y-auto no-scrollbar flex-1 flex flex-col gap-4">
                {/* Existing departures */}
                {selectedJourney.departures?.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {selectedJourney.departures.map((dep: any) => (
                      <div key={dep.id} className="flex items-center justify-between p-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)]">
                        <div>
                          <p className="text-xs font-semibold text-[var(--admin-text-main)]">
                            {new Date(dep.startDate).toLocaleDateString('pt-BR')} → {new Date(dep.endDate).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-[10px] text-[var(--admin-text-muted)]">{dep.availableSpots} vagas disponíveis</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${dep.status === 'available' ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-red-900/30 text-red-400 border-red-800'}`}>
                            {dep.status === 'available' ? 'Disponível' : 'Esgotado'}
                          </span>
                          <button onClick={() => { handleDeleteDeparture(dep.id); setSelectedJourney((j: any) => ({ ...j, departures: j.departures.filter((d: any) => d.id !== dep.id) })); }}
                            className="p-1 text-[var(--admin-text-muted)] hover:text-[var(--admin-accent-red)] transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Add new departure */}
                <div className="border border-[var(--admin-border)]/50 rounded-xl p-4 bg-[var(--admin-card)]">
                  <p className="text-xs font-semibold text-[var(--admin-text-main)] mb-3">Adicionar nova data</p>
                  <form onSubmit={handleAddDeparture} className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-[var(--admin-text-muted)]">Data início</label>
                        <Input type="date" required value={departureForm.startDate} onChange={e => setDepartureForm(p => ({ ...p, startDate: e.target.value }))} className="bg-[var(--admin-bg)] border-[var(--admin-border)] text-sm h-9" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-[var(--admin-text-muted)]">Data fim</label>
                        <Input type="date" required value={departureForm.endDate} onChange={e => setDepartureForm(p => ({ ...p, endDate: e.target.value }))} className="bg-[var(--admin-bg)] border-[var(--admin-border)] text-sm h-9" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-[var(--admin-text-muted)]">Vagas disponíveis</label>
                      <Input type="number" value={departureForm.availableSpots} onChange={e => setDepartureForm(p => ({ ...p, availableSpots: e.target.value }))} className="bg-[var(--admin-bg)] border-[var(--admin-border)] text-sm h-9" />
                    </div>
                    <Button type="submit" className="h-9 bg-[var(--admin-primary)] hover:bg-[var(--admin-primary-hover)] text-black font-semibold">
                      <Plus className="w-4 h-4 mr-1" /> Adicionar Data
                    </Button>
                  </form>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
