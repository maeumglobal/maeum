'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit3, Trash2, Search, Filter, RefreshCw, Package as PackageIcon, MapPin, DollarSign, X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getPackages, deletePackage, updatePackageStatus, createPackage } from '@/actions/packageActions';
import { useToast } from '@/contexts/ToastContext';

export default function AdminPackagesHome() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    destination: 'Coreia do Sul',
    price: '',
    description: '',
    status: 'active'
  });
  
  const { toast } = useToast();

  const loadPackages = async () => {
    setLoading(true);
    const res = await getPackages();
    if (res.success && res.data) {
      setPackages(res.data);
    } else {
      toast('Erro ao carregar pacotes');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPackages();
  }, []);

  // Auto-generate slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const slug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    setFormData(prev => ({ ...prev, title: val, slug }));
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este pacote permanentemente?')) {
      const res = await deletePackage(id);
      if (res.success) {
        toast('Pacote excluído com sucesso');
        loadPackages();
      } else {
        toast('Erro ao excluir pacote');
      }
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const res = await updatePackageStatus(id, newStatus);
    if (res.success) {
      toast(`Status alterado com sucesso`);
      loadPackages();
    } else {
      toast('Erro ao mudar status');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.slug || !formData.price) {
      return toast('Preencha os campos obrigatórios!');
    }
    
    setIsSubmitting(true);
    const res = await createPackage({
      title: formData.title,
      slug: formData.slug,
      destination: formData.destination,
      price: Number(formData.price),
      description: formData.description,
      status: formData.status
    });

    if (res.success) {
      toast('Pacote criado com sucesso!');
      setIsModalOpen(false);
      setFormData({ title: '', slug: '', destination: 'Coreia do Sul', price: '', description: '', status: 'active' });
      loadPackages();
    } else {
      toast(res.error || 'Erro ao criar pacote.');
    }
    setIsSubmitting(false);
  };

  const filteredPackages = packages.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.destination?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'active') return 'bg-green-50 text-green-700 border-green-200';
    if (s === 'draft') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (s === 'archived') return 'bg-gray-50 text-gray-700 border-gray-200';
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
          <h2 className="text-xl font-bold text-[var(--admin-text-main)] mb-1">Pacotes de Viagem</h2>
          <p className="text-xs text-[var(--admin-text-muted)]">Gerencie as opções de roteiros, pacotes e intercâmbios</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={loadPackages} variant="outline" className="h-9 px-3 border-[var(--admin-border)] text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="h-9 px-4 bg-[var(--admin-primary)] hover:bg-[var(--admin-primary-hover)] text-white">
            <Plus className="w-4 h-4 mr-2" /> Novo Pacote
          </Button>
        </div>
      </div>

      <div className="bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-2xl overflow-hidden flex flex-col min-h-0 flex-1">
        <div className="p-4 border-b border-[var(--admin-border)] flex flex-col sm:flex-row sm:items-center gap-4 justify-between bg-black/5">
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-muted)]" />
            <Input 
              placeholder="Buscar pacote por título ou destino..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs bg-[var(--admin-bg)] border-[var(--admin-border)] focus:border-[var(--admin-primary)] text-[var(--admin-text-main)]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--admin-border)] bg-black/5 text-[10px] uppercase tracking-wider text-[var(--admin-text-muted)] font-semibold">
                <th className="p-4 font-semibold whitespace-nowrap">Pacote</th>
                <th className="p-4 font-semibold whitespace-nowrap">Destino</th>
                <th className="p-4 font-semibold whitespace-nowrap">Preço</th>
                <th className="p-4 font-semibold whitespace-nowrap">Status</th>
                <th className="p-4 font-semibold text-right whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-xs text-[var(--admin-text-muted)]">
                    Carregando pacotes...
                  </td>
                </tr>
              ) : filteredPackages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-xs text-[var(--admin-text-muted)]">
                    Nenhum pacote encontrado.
                  </td>
                </tr>
              ) : (
                filteredPackages.map((pkg) => (
                  <tr key={pkg.id} className="border-b border-[var(--admin-border)] hover:bg-[var(--admin-border)]/20 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[var(--admin-border)] flex items-center justify-center shrink-0 border border-[var(--admin-border)] overflow-hidden">
                          <PackageIcon className="w-5 h-5 text-[var(--admin-text-muted)]" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-[var(--admin-text-main)] truncate">{pkg.title}</span>
                          <span className="text-[10px] text-[var(--admin-text-muted)] truncate">/{pkg.slug}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-[11px] text-[var(--admin-text-main)]">
                      {pkg.destination ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-[var(--admin-border)]/50 rounded-md border border-[var(--admin-border)] whitespace-nowrap">
                          <MapPin className="w-3 h-3 text-[var(--admin-primary)]" /> {pkg.destination}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="p-4 text-[11px] font-bold text-[var(--admin-text-main)] whitespace-nowrap">
                      {pkg.price ? (
                        <span className="inline-flex items-center gap-1 text-[var(--admin-accent-green)]">
                          <DollarSign className="w-3 h-3" />
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pkg.price)}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="p-4">
                      <select 
                        value={pkg.status || 'active'}
                        onChange={(e) => handleStatusChange(pkg.id, e.target.value)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border appearance-none cursor-pointer outline-none ${getStatusBadge(pkg.status || 'active')}`}
                      >
                        <option value="active">Ativo (Publicado)</option>
                        <option value="draft">Rascunho</option>
                        <option value="archived">Arquivado</option>
                      </select>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-[var(--admin-text-muted)] hover:text-[var(--admin-primary)] hover:bg-[var(--admin-border)] rounded-md transition-colors">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(pkg.id)} className="p-1.5 text-[var(--admin-text-muted)] hover:text-[var(--admin-accent-red)] hover:bg-[var(--admin-accent-red)]/10 rounded-md transition-colors">
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

      {/* Modal de Criação */}
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
                <h3 className="text-lg font-bold text-[var(--admin-text-main)]">Novo Pacote / Viagem</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto no-scrollbar flex-1">
                <form id="createPackageForm" onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[var(--admin-text-main)]">Título do Pacote *</label>
                    <Input 
                      required 
                      value={formData.title} 
                      onChange={handleTitleChange}
                      className="bg-[var(--admin-card)] border-[var(--admin-border)] focus:border-[var(--admin-primary)] text-sm" 
                      placeholder="Ex: Intercâmbio de Verão 2027" 
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[var(--admin-text-main)]">URL (Slug) *</label>
                    <Input 
                      required 
                      value={formData.slug} 
                      onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      className="bg-[var(--admin-card)] border-[var(--admin-border)] focus:border-[var(--admin-primary)] text-sm text-gray-400" 
                      placeholder="intercambio-de-verao-2027" 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[var(--admin-text-main)]">Destino Principal</label>
                      <select 
                        value={formData.destination} 
                        onChange={e => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                        className="flex h-10 w-full rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm text-[var(--admin-text-main)] focus:outline-none focus:border-[var(--admin-primary)]" 
                      >
                        <option value="Coreia do Sul">Coreia do Sul</option>
                        <option value="Japão">Japão</option>
                        <option value="Vietnã">Vietnã</option>
                        <option value="Multi-Destinos">Multi-Destinos</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[var(--admin-text-main)]">Preço Base (R$) *</label>
                      <Input 
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price} 
                        onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        className="bg-[var(--admin-card)] border-[var(--admin-border)] focus:border-[var(--admin-primary)] text-sm" 
                        placeholder="Ex: 8500.00" 
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[var(--admin-text-main)]">Visão Geral do Pacote</label>
                    <textarea 
                      value={formData.description} 
                      onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="flex min-h-[100px] w-full rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm text-[var(--admin-text-main)] focus-visible:outline-none focus-visible:border-[var(--admin-primary)] resize-none"
                      placeholder="Descreva a experiência, atrações principais, etc."
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
                  form="createPackageForm"
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[var(--admin-primary)] hover:bg-[var(--admin-primary-hover)] text-white font-medium"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Pacote'}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
