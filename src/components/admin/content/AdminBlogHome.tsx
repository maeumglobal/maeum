'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit3, Trash2, Search, RefreshCw, FileText, X, Eye, EyeOff, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getBlogPosts, createBlogPost, updateBlogPost, deleteBlogPost } from '@/actions/contentActions';
import { useToast } from '@/contexts/ToastContext';

export default function AdminBlogHome() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ title: '', author: '', excerpt: '', content: '', coverImage: '', status: 'draft' });
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const res = await getBlogPosts({ search, status: statusFilter || undefined });
    if (res.success && res.data) setPosts(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [search, statusFilter]);

  const openModal = (item?: any) => {
    setEditingItem(item || null);
    setFormData(item ? { title: item.title, author: item.author, excerpt: item.excerpt || '', content: item.content, coverImage: item.coverImage || '', status: item.status } : { title: '', author: '', excerpt: '', content: '', coverImage: '', status: 'draft' });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este artigo?')) return;
    const res = await deleteBlogPost(id);
    if (res.success) { toast('Artigo excluído!'); load(); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return toast('Título é obrigatório!');
    setIsSubmitting(true);
    const res = editingItem ? await updateBlogPost(editingItem.id, formData) : await createBlogPost(formData);
    if (res.success) { toast(editingItem ? 'Artigo atualizado!' : 'Artigo criado!'); setIsModalOpen(false); load(); }
    else toast('Erro ao salvar artigo.');
    setIsSubmitting(false);
  };

  const toggleStatus = async (post: any) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    const res = await updateBlogPost(post.id, { status: newStatus });
    if (res.success) { toast(`Artigo ${newStatus === 'published' ? 'publicado' : 'despublicado'}!`); load(); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--admin-card)] border border-[var(--admin-border)] p-4 md:p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-[var(--admin-text-main)] mb-1 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[var(--admin-primary)]" /> Blog / Journal
          </h2>
          <p className="text-xs text-[var(--admin-text-muted)]">{posts.length} artigos no total</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={load} variant="outline" className="h-9 px-3 border-[var(--admin-border)] text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => openModal()} className="h-9 px-4 bg-[var(--admin-primary)] hover:bg-[var(--admin-primary-hover)] text-black font-semibold">
            <Plus className="w-4 h-4 mr-1" /> Novo Artigo
          </Button>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-muted)]" />
          <Input placeholder="Buscar artigo..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-xs bg-[var(--admin-card)] border-[var(--admin-border)] focus:border-[var(--admin-primary)] text-[var(--admin-text-main)]" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 px-3 text-xs rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-muted)] focus:outline-none focus:border-[var(--admin-primary)]">
          <option value="">Todos</option>
          <option value="published">Publicados</option>
          <option value="draft">Rascunhos</option>
        </select>
      </div>

      <div className="bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--admin-border)] bg-black/5 text-[10px] uppercase tracking-wider text-[var(--admin-text-muted)]">
              <th className="p-4 font-semibold">Artigo</th>
              <th className="p-4 font-semibold hidden sm:table-cell">Autor</th>
              <th className="p-4 font-semibold hidden md:table-cell">Data</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center"><RefreshCw className="w-5 h-5 animate-spin mx-auto text-[var(--admin-text-muted)]" /></td></tr>
            ) : posts.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-xs text-[var(--admin-text-muted)]">Nenhum artigo encontrado.</td></tr>
            ) : posts.map(post => (
              <tr key={post.id} className="border-b border-[var(--admin-border)] hover:bg-[var(--admin-border)]/20 group transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {post.coverImage ? (
                      <img src={post.coverImage} alt={post.title} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[var(--admin-border)] flex items-center justify-center">
                        <FileText className="w-4 h-4 text-[var(--admin-text-muted)]" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--admin-text-main)] truncate max-w-[200px]">{post.title}</p>
                      <p className="text-[10px] text-[var(--admin-text-muted)] truncate max-w-[200px]">{post.excerpt || 'Sem resumo'}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 hidden sm:table-cell text-[11px] text-[var(--admin-text-muted)]">{post.author}</td>
                <td className="p-4 hidden md:table-cell">
                  <span className="text-[10px] text-[var(--admin-text-muted)] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(post.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${post.status === 'published' ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-yellow-900/30 text-yellow-400 border-yellow-800'}`}>
                    {post.status === 'published' ? 'Publicado' : 'Rascunho'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => toggleStatus(post)} title={post.status === 'published' ? 'Despublicar' : 'Publicar'}
                      className="p-1.5 rounded-md text-[var(--admin-text-muted)] hover:text-[var(--admin-primary)] hover:bg-[var(--admin-border)] transition-colors">
                      {post.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={() => openModal(post)} className="p-1.5 rounded-md text-[var(--admin-text-muted)] hover:text-[var(--admin-primary)] hover:bg-[var(--admin-border)] transition-colors">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(post.id)} className="p-1.5 rounded-md text-[var(--admin-text-muted)] hover:text-[var(--admin-accent-red)] hover:bg-[var(--admin-accent-red)]/10 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-[var(--admin-bg)] border border-[var(--admin-border)] shadow-2xl rounded-2xl z-[101] flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between p-6 border-b border-[var(--admin-border)] bg-[var(--admin-card)]">
                <h3 className="text-lg font-bold text-[var(--admin-text-main)]">{editingItem ? 'Editar Artigo' : 'Novo Artigo'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)]"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 overflow-y-auto no-scrollbar flex-1">
                <form id="blogForm" onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[var(--admin-text-main)]">Título *</label>
                    <Input required value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} className="bg-[var(--admin-card)] border-[var(--admin-border)] focus:border-[var(--admin-primary)] text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[var(--admin-text-main)]">Autor</label>
                      <Input value={formData.author} onChange={e => setFormData(p => ({ ...p, author: e.target.value }))} className="bg-[var(--admin-card)] border-[var(--admin-border)] focus:border-[var(--admin-primary)] text-sm" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[var(--admin-text-main)]">Status</label>
                      <select value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))} className="h-10 px-3 text-sm rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-main)] focus:outline-none focus:border-[var(--admin-primary)]">
                        <option value="draft">Rascunho</option>
                        <option value="published">Publicar</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[var(--admin-text-main)]">URL da imagem de capa</label>
                    <Input value={formData.coverImage} onChange={e => setFormData(p => ({ ...p, coverImage: e.target.value }))} className="bg-[var(--admin-card)] border-[var(--admin-border)] focus:border-[var(--admin-primary)] text-sm" placeholder="https://..." />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[var(--admin-text-main)]">Resumo</label>
                    <textarea value={formData.excerpt} onChange={e => setFormData(p => ({ ...p, excerpt: e.target.value }))} className="flex min-h-[60px] w-full rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm text-[var(--admin-text-main)] focus-visible:outline-none focus-visible:border-[var(--admin-primary)] resize-none" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[var(--admin-text-main)]">Conteúdo (HTML)</label>
                    <textarea value={formData.content} onChange={e => setFormData(p => ({ ...p, content: e.target.value }))} className="flex min-h-[200px] w-full rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm font-mono text-[var(--admin-text-main)] focus-visible:outline-none focus-visible:border-[var(--admin-primary)] resize-y" placeholder="<h2>Título</h2><p>Conteúdo...</p>" />
                  </div>
                </form>
              </div>
              <div className="p-6 border-t border-[var(--admin-border)] bg-[var(--admin-card)] flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="border-[var(--admin-border)] text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50" disabled={isSubmitting}>Cancelar</Button>
                <Button form="blogForm" type="submit" disabled={isSubmitting} className="bg-[var(--admin-primary)] hover:bg-[var(--admin-primary-hover)] text-black font-semibold">
                  {isSubmitting ? 'Salvando...' : editingItem ? 'Atualizar' : 'Criar Artigo'}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
