'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit3, Trash2, Search, RefreshCw, Compass, MapPin, DollarSign, X, Clock, Tag, CheckCircle2, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getExperiences, createExperience, updateExperience, deleteExperience,
  getCategories
} from '@/actions/experienceActions';
import { useToast } from '@/contexts/ToastContext';

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-900/30 text-green-400 border-green-800',
  draft: 'bg-yellow-900/30 text-yellow-400 border-yellow-800',
  inactive: 'bg-gray-900/30 text-gray-400 border-gray-700',
};

const BOOKING_BADGE: Record<string, string> = {
  direct: 'bg-blue-900/30 text-blue-400 border-blue-800',
  request: 'bg-purple-900/30 text-purple-400 border-purple-800',
};

export default function AdminExperiencesHome() {
  const [experiences, setExperiences] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '', subtitle: '', slug: '', location: 'Seul', description: '',
    durationHours: '2', pricePerPerson: '', mainImage: '',
    bookingType: 'direct', status: 'active', categoryIds: [] as string[],
  });
  const { toast } = useToast();

  const loadData = async () => {
    setLoading(true);
    const [expRes, catRes] = await Promise.all([
      getExperiences({ search, status: statusFilter || undefined }),
      getCategories()
    ]);
    if (expRes.success && expRes.data) setExperiences(expRes.data);
    if (catRes.success && catRes.data) setCategories(catRes.data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [search, statusFilter]);

  const openModal = (item?: any) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title, subtitle: item.subtitle || '', slug: item.slug,
        location: item.location, description: item.description || '',
        durationHours: String(item.durationHours), pricePerPerson: String(item.pricePerPerson),
        mainImage: item.mainImage || '', bookingType: item.bookingType, status: item.status,
        categoryIds: item.categories?.map((c: any) => c.categoryId) || [],
      });
    } else {
      setEditingItem(null);
      setFormData({ title: '', subtitle: '', slug: '', location: 'Seul', description: '', durationHours: '2', pricePerPerson: '', mainImage: '', bookingType: 'direct', status: 'active', categoryIds: [] });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta experiência permanentemente?')) return;
    const res = await deleteExperience(id);
    if (res.success) { toast('Experiência excluída!'); loadData(); }
    else toast('Erro ao excluir.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.pricePerPerson) return toast('Preencha título e preço!');
    setIsSubmitting(true);
    const payload = {
      ...formData,
      slug: formData.slug || formData.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now(),
      durationHours: Number(formData.durationHours),
      pricePerPerson: Number(formData.pricePerPerson),
    };
    const res = editingItem ? await updateExperience(editingItem.id, payload) : await createExperience(payload);
    if (res.success) {
      toast(editingItem ? 'Experiência atualizada!' : 'Experiência criada!');
      setIsModalOpen(false);
      loadData();
    } else toast('Erro ao salvar experiência.');
    setIsSubmitting(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--admin-card)] border border-[var(--admin-border)] p-4 md:p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-[var(--admin-text-main)] mb-1 flex items-center gap-2">
            <Compass className="w-5 h-5 text-[var(--admin-primary)]" /> Experiências
          </h2>
          <p className="text-xs text-[var(--admin-text-muted)]">Gerencie experiências disponíveis para reserva</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--admin-text-muted)] px-2 py-1 rounded bg-[var(--admin-border)]/50">{experiences.length} total</span>
          <Button onClick={loadData} variant="outline" className="h-9 px-3 border-[var(--admin-border)] text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => openModal()} className="h-9 px-4 bg-[var(--admin-primary)] hover:bg-[var(--admin-primary-hover)] text-black font-semibold">
            <Plus className="w-4 h-4 mr-1" /> Nova Experiência
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-muted)]" />
          <Input
            placeholder="Buscar por título ou localização..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs bg-[var(--admin-card)] border-[var(--admin-border)] focus:border-[var(--admin-primary)] text-[var(--admin-text-main)]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-9 px-3 text-xs rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-muted)] focus:outline-none focus:border-[var(--admin-primary)]"
        >
          <option value="">Todos os status</option>
          <option value="active">Ativo</option>
          <option value="draft">Rascunho</option>
          <option value="inactive">Inativo</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-[var(--admin-text-muted)]">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Carregando...
        </div>
      ) : experiences.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-[var(--admin-text-muted)]">
          <Compass className="w-12 h-12 opacity-30" />
          <p className="text-sm">Nenhuma experiência encontrada.</p>
          <Button onClick={() => openModal()} className="mt-2 bg-[var(--admin-primary)] text-black font-semibold">
            <Plus className="w-4 h-4 mr-1" /> Criar primeira experiência
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {experiences.map(exp => (
            <motion.div key={exp.id} layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-2xl overflow-hidden group hover:border-[var(--admin-primary)]/50 transition-all"
            >
              {exp.mainImage ? (
                <div className="h-40 overflow-hidden">
                  <img src={exp.mainImage} alt={exp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              ) : (
                <div className="h-40 bg-[var(--admin-border)]/30 flex items-center justify-center">
                  <Compass className="w-10 h-10 text-[var(--admin-text-muted)] opacity-40" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[var(--admin-text-main)] text-sm truncate">{exp.title}</h3>
                    <p className="text-[10px] text-[var(--admin-text-muted)] flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {exp.location}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${STATUS_BADGE[exp.status] || STATUS_BADGE.inactive}`}>
                    {exp.status === 'active' ? 'Ativo' : exp.status === 'draft' ? 'Rascunho' : 'Inativo'}
                  </span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${BOOKING_BADGE[exp.bookingType] || BOOKING_BADGE.request}`}>
                    {exp.bookingType === 'direct' ? 'Reserva Direta' : 'Sob Consulta'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[11px] text-[var(--admin-text-muted)]">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {exp.durationHours}h</span>
                    <span className="flex items-center gap-1 text-[var(--admin-accent-green)] font-bold">
                      <DollarSign className="w-3 h-3" />
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(exp.pricePerPerson)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openModal(exp)} className="p-1.5 rounded-md text-[var(--admin-text-muted)] hover:text-[var(--admin-primary)] hover:bg-[var(--admin-border)] transition-colors">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(exp.id)} className="p-1.5 rounded-md text-[var(--admin-text-muted)] hover:text-[var(--admin-accent-red)] hover:bg-[var(--admin-accent-red)]/10 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-[var(--admin-bg)] border border-[var(--admin-border)] shadow-2xl rounded-2xl z-[101] flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-[var(--admin-border)] bg-[var(--admin-card)]">
                <h3 className="text-lg font-bold text-[var(--admin-text-main)]">
                  {editingItem ? 'Editar Experiência' : 'Nova Experiência'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto no-scrollbar flex-1">
                <form id="expForm" onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[var(--admin-text-main)]">Título *</label>
                    <Input required value={formData.title} onChange={e => {
                      const title = e.target.value;
                      const slug = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                      setFormData(p => ({ ...p, title, slug }));
                    }} className="bg-[var(--admin-card)] border-[var(--admin-border)] focus:border-[var(--admin-primary)] text-sm" placeholder="Ex: Tour Noturno em Seul" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[var(--admin-text-main)]">Localização</label>
                      <Input value={formData.location} onChange={e => setFormData(p => ({ ...p, location: e.target.value }))} className="bg-[var(--admin-card)] border-[var(--admin-border)] focus:border-[var(--admin-primary)] text-sm" placeholder="Seul" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[var(--admin-text-main)]">Duração (horas)</label>
                      <Input type="number" step="0.5" value={formData.durationHours} onChange={e => setFormData(p => ({ ...p, durationHours: e.target.value }))} className="bg-[var(--admin-card)] border-[var(--admin-border)] focus:border-[var(--admin-primary)] text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[var(--admin-text-main)]">Preço por Pessoa (R$) *</label>
                      <Input required type="number" value={formData.pricePerPerson} onChange={e => setFormData(p => ({ ...p, pricePerPerson: e.target.value }))} className="bg-[var(--admin-card)] border-[var(--admin-border)] focus:border-[var(--admin-primary)] text-sm" placeholder="690" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[var(--admin-text-main)]">Tipo de Reserva</label>
                      <select value={formData.bookingType} onChange={e => setFormData(p => ({ ...p, bookingType: e.target.value }))} className="h-10 px-3 text-sm rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-main)] focus:outline-none focus:border-[var(--admin-primary)]">
                        <option value="direct">Reserva Direta</option>
                        <option value="request">Sob Consulta</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[var(--admin-text-main)]">URL da Imagem Principal</label>
                    <Input value={formData.mainImage} onChange={e => setFormData(p => ({ ...p, mainImage: e.target.value }))} className="bg-[var(--admin-card)] border-[var(--admin-border)] focus:border-[var(--admin-primary)] text-sm" placeholder="https://..." />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[var(--admin-text-main)]">Descrição</label>
                    <textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} className="flex min-h-[80px] w-full rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm text-[var(--admin-text-main)] focus-visible:outline-none focus-visible:border-[var(--admin-primary)] resize-none" placeholder="Descrição completa da experiência..." />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[var(--admin-text-main)]">Status</label>
                    <select value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))} className="h-10 px-3 text-sm rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-main)] focus:outline-none focus:border-[var(--admin-primary)]">
                      <option value="active">Ativo</option>
                      <option value="draft">Rascunho</option>
                      <option value="inactive">Inativo</option>
                    </select>
                  </div>
                  {categories.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[var(--admin-text-main)]">Categorias</label>
                      <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                          <button key={cat.id} type="button"
                            onClick={() => setFormData(p => ({ ...p, categoryIds: p.categoryIds.includes(cat.id) ? p.categoryIds.filter(c => c !== cat.id) : [...p.categoryIds, cat.id] }))}
                            className={`text-[10px] px-2 py-1 rounded border transition-all ${formData.categoryIds.includes(cat.id) ? 'bg-[var(--admin-primary)] text-black border-[var(--admin-primary)] font-bold' : 'border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:border-[var(--admin-primary)]'}`}
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </form>
              </div>
              <div className="p-6 border-t border-[var(--admin-border)] bg-[var(--admin-card)] flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="border-[var(--admin-border)] text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50" disabled={isSubmitting}>Cancelar</Button>
                <Button form="expForm" type="submit" disabled={isSubmitting} className="bg-[var(--admin-primary)] hover:bg-[var(--admin-primary-hover)] text-black font-semibold">
                  {isSubmitting ? 'Salvando...' : editingItem ? 'Atualizar' : 'Criar Experiência'}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
