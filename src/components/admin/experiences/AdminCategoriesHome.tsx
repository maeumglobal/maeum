'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit3, Trash2, RefreshCw, X, FolderTree, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/actions/experienceActions';
import { useToast } from '@/contexts/ToastContext';

export default function AdminCategoriesHome() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '', destination: 'Coreia do Sul' });
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const res = await getCategories();
    if (res.success && res.data) setCategories(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openModal = (item?: any) => {
    setEditingItem(item || null);
    setFormData(item ? { name: item.name, slug: item.slug, destination: item.destination || 'Coreia do Sul' } : { name: '', slug: '', destination: 'Coreia do Sul' });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir categoria "${name}"?`)) return;
    const res = await deleteCategory(id);
    if (res.success) { toast('Categoria excluída!'); load(); }
  };

  const handleToggleActive = async (cat: any) => {
    const res = await updateCategory(cat.id, { isActive: !cat.isActive });
    if (res.success) { toast(cat.isActive ? 'Desativada' : 'Ativada'); load(); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    setIsSubmitting(true);
    const payload = {
      ...formData,
      slug: formData.slug || formData.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    };
    const res = editingItem ? await updateCategory(editingItem.id, payload) : await createCategory(payload);
    if (res.success) { toast(editingItem ? 'Atualizado!' : 'Criado!'); setIsModalOpen(false); load(); }
    else toast('Erro ao salvar.');
    setIsSubmitting(false);
  };

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === categories.length - 1) return;
    
    const newItems = [...categories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    
    // Optimistic update
    setCategories(newItems);
    
    // Save to DB (simulating reorder by updating sortOrder on each affected)
    await updateCategory(newItems[index].id, { sortOrder: index });
    await updateCategory(newItems[targetIndex].id, { sortOrder: targetIndex });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between bg-[var(--admin-card)] border border-[var(--admin-border)] p-4 md:p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-[var(--admin-text-main)] mb-1 flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-[var(--admin-primary)]" /> Categorias
          </h2>
          <p className="text-xs text-[var(--admin-text-muted)]">Organize tags de experiências e destinos</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={load} variant="outline" className="h-9 px-3 border-[var(--admin-border)] text-[var(--admin-text-main)]">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => openModal()} className="h-9 px-4 bg-[var(--admin-primary)] hover:bg-[var(--admin-primary-hover)] text-black font-semibold">
            <Plus className="w-4 h-4 mr-1" /> Nova Categoria
          </Button>
        </div>
      </div>

      <div className="bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-2xl overflow-hidden p-4">
        {loading ? (
          <div className="flex justify-center py-10"><RefreshCw className="w-6 h-6 animate-spin text-[var(--admin-text-muted)]" /></div>
        ) : categories.length === 0 ? (
          <div className="text-center py-10 text-[var(--admin-text-muted)] text-sm">Nenhuma categoria.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {categories.map((cat, idx) => (
              <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] hover:border-[var(--admin-primary)]/40 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-0.5">
                    <button disabled={idx === 0} onClick={() => handleReorder(idx, 'up')} className="text-[var(--admin-text-muted)] hover:text-white disabled:opacity-30"><ArrowUp className="w-3 h-3" /></button>
                    <button disabled={idx === categories.length - 1} onClick={() => handleReorder(idx, 'down')} className="text-[var(--admin-text-muted)] hover:text-white disabled:opacity-30"><ArrowDown className="w-3 h-3" /></button>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--admin-text-main)]">{cat.name}</p>
                    <p className="text-[10px] text-[var(--admin-text-muted)]">{cat.slug} • {cat.destination}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cat.isActive ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-gray-900/30 text-gray-500 border-gray-700'}`}>
                    {cat.isActive ? 'Ativa' : 'Inativa'}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleToggleActive(cat)} className="text-[10px] font-semibold px-2 py-1 rounded bg-[var(--admin-border)] hover:text-white transition-colors">
                      {cat.isActive ? 'Desativar' : 'Ativar'}
                    </button>
                    <button onClick={() => openModal(cat)} className="p-1.5 rounded text-[var(--admin-text-muted)] hover:text-[var(--admin-primary)] hover:bg-[var(--admin-border)]"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(cat.id, cat.name)} className="p-1.5 rounded text-[var(--admin-text-muted)] hover:text-[var(--admin-accent-red)] hover:bg-[var(--admin-accent-red)]/10"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[var(--admin-bg)] border border-[var(--admin-border)] shadow-2xl rounded-2xl z-[101]">
              <div className="flex items-center justify-between p-6 border-b border-[var(--admin-border)] bg-[var(--admin-card)]">
                <h3 className="text-lg font-bold text-[var(--admin-text-main)]">{editingItem ? 'Editar' : 'Nova Categoria'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-[var(--admin-text-muted)]"><X className="w-5 h-5" /></button>
              </div>
              <form id="catForm" onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--admin-text-main)]">Nome *</label>
                  <Input required value={formData.name} onChange={e => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    setFormData(p => ({ ...p, name, slug }));
                  }} className="bg-[var(--admin-card)] border-[var(--admin-border)] text-sm" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--admin-text-main)]">Destino Associado</label>
                  <Input value={formData.destination} onChange={e => setFormData(p => ({ ...p, destination: e.target.value }))} className="bg-[var(--admin-card)] border-[var(--admin-border)] text-sm" />
                </div>
              </form>
              <div className="p-6 border-t border-[var(--admin-border)] bg-[var(--admin-card)] flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsModalOpen(false)} className="border-[var(--admin-border)]">Cancelar</Button>
                <Button form="catForm" type="submit" disabled={isSubmitting} className="bg-[var(--admin-primary)] text-black font-semibold">Salvar</Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
