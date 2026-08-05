'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit3, Trash2, RefreshCw, Star, X, Check, ThumbsDown, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getTestimonials, createTestimonial, approveTestimonial, rejectTestimonial, deleteTestimonial,
  getFaqItems, createFaqItem, updateFaqItem, deleteFaqItem
} from '@/actions/contentActions';
import { useToast } from '@/contexts/ToastContext';

export default function AdminTestimonialsFaqHome() {
  const [activeTab, setActiveTab] = useState<'testimonials' | 'faq'>('testimonials');
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [faqItems, setFaqItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingFaq, setEditingFaq] = useState<any>(null);
  const [testimonialForm, setTestimonialForm] = useState({ name: '', destination: '', text: '', rating: '5', avatarUrl: '' });
  const [faqForm, setFaqForm] = useState({ question: '', answer: '', category: 'Geral' });
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const [tRes, fRes] = await Promise.all([getTestimonials(), getFaqItems()]);
    if (tRes.success && tRes.data) setTestimonials(tRes.data);
    if (fRes.success && fRes.data) setFaqItems(fRes.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleTestimonialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await createTestimonial({ ...testimonialForm, rating: Number(testimonialForm.rating) });
    if (res.success) { toast('Depoimento adicionado!'); setIsModalOpen(false); setTestimonialForm({ name: '', destination: '', text: '', rating: '5', avatarUrl: '' }); load(); }
    else toast('Erro ao salvar depoimento.');
    setIsSubmitting(false);
  };

  const handleFaqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = editingFaq ? await updateFaqItem(editingFaq.id, faqForm) : await createFaqItem(faqForm);
    if (res.success) { toast(editingFaq ? 'FAQ atualizado!' : 'FAQ criado!'); setEditingFaq(null); setIsModalOpen(false); setFaqForm({ question: '', answer: '', category: 'Geral' }); load(); }
    else toast('Erro ao salvar FAQ.');
    setIsSubmitting(false);
  };

  const STATUS_COLORS: Record<string, string> = {
    approved: 'bg-green-900/30 text-green-400 border-green-800',
    pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-800',
    rejected: 'bg-red-900/30 text-red-400 border-red-800',
  };

  const FAQ_CATEGORIES = ['Geral', 'Coreia do Sul', 'Intercâmbio', 'Pagamentos', 'Viagem', 'K-Beauty'];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 w-full">
      {/* Tab Header */}
      <div className="bg-[var(--admin-card)] border border-[var(--admin-border)] p-4 md:p-6 rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex gap-2">
            {(['testimonials', 'faq'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${activeTab === tab ? 'bg-[var(--admin-primary)] text-black' : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)] bg-[var(--admin-border)]/30'}`}>
                {tab === 'testimonials' ? `⭐ Depoimentos (${testimonials.length})` : `❓ FAQ (${faqItems.length})`}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={load} variant="outline" className="h-9 px-3 border-[var(--admin-border)] text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={() => { setEditingFaq(null); setIsModalOpen(true); }} className="h-9 px-4 bg-[var(--admin-primary)] hover:bg-[var(--admin-primary-hover)] text-black font-semibold">
              <Plus className="w-4 h-4 mr-1" /> {activeTab === 'testimonials' ? 'Novo Depoimento' : 'Nova Pergunta'}
            </Button>
          </div>
        </div>
      </div>

      {/* TESTIMONIALS TAB */}
      {activeTab === 'testimonials' && (
        <div className="flex flex-col gap-3">
          {loading ? (
            <div className="flex items-center justify-center py-12"><RefreshCw className="w-6 h-6 animate-spin text-[var(--admin-text-muted)]" /></div>
          ) : testimonials.map(t => (
            <motion.div key={t.id} layout className="bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-xl p-4 flex items-start gap-4 group hover:border-[var(--admin-primary)]/30 transition-colors">
              <div className="w-10 h-10 rounded-full bg-[var(--admin-border)] overflow-hidden shrink-0 flex items-center justify-center">
                {t.avatarUrl ? <img src={t.avatarUrl} alt={t.name} className="w-full h-full object-cover" /> : <span className="text-sm font-bold text-[var(--admin-text-muted)]">{t.name[0]}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-[var(--admin-text-main)]">{t.name}</span>
                  <span className="text-[10px] text-[var(--admin-text-muted)]">— {t.destination}</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[t.status]}`}>
                    {t.status === 'approved' ? 'Aprovado' : t.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                  </span>
                </div>
                <div className="flex gap-0.5 mb-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < t.rating ? 'text-[var(--admin-primary)] fill-[var(--admin-primary)]' : 'text-[var(--admin-border)]'}`} />
                  ))}
                </div>
                <p className="text-[11px] text-[var(--admin-text-muted)] line-clamp-2">{t.text}</p>
              </div>
              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                {t.status !== 'approved' && (
                  <button onClick={async () => { await approveTestimonial(t.id); toast('Aprovado!'); load(); }}
                    className="p-1.5 rounded-md text-green-400 hover:bg-green-900/30 transition-colors" title="Aprovar">
                    <Check className="w-4 h-4" />
                  </button>
                )}
                {t.status !== 'rejected' && (
                  <button onClick={async () => { await rejectTestimonial(t.id); toast('Rejeitado.'); load(); }}
                    className="p-1.5 rounded-md text-[var(--admin-text-muted)] hover:text-yellow-400 hover:bg-yellow-900/30 transition-colors" title="Rejeitar">
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                )}
                <button onClick={async () => { await deleteTestimonial(t.id); toast('Excluído!'); load(); }}
                  className="p-1.5 rounded-md text-[var(--admin-text-muted)] hover:text-[var(--admin-accent-red)] hover:bg-[var(--admin-accent-red)]/10 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* FAQ TAB */}
      {activeTab === 'faq' && (
        <div className="bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--admin-border)] bg-black/5 text-[10px] uppercase tracking-wider text-[var(--admin-text-muted)]">
                <th className="p-4 font-semibold">Pergunta</th>
                <th className="p-4 font-semibold hidden md:table-cell">Categoria</th>
                <th className="p-4 font-semibold hidden lg:table-cell">Status</th>
                <th className="p-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center"><RefreshCw className="w-5 h-5 animate-spin mx-auto text-[var(--admin-text-muted)]" /></td></tr>
              ) : faqItems.map(item => (
                <tr key={item.id} className="border-b border-[var(--admin-border)] hover:bg-[var(--admin-border)]/20 group transition-colors">
                  <td className="p-4">
                    <p className="text-xs font-semibold text-[var(--admin-text-main)] line-clamp-1">{item.question}</p>
                    <p className="text-[10px] text-[var(--admin-text-muted)] line-clamp-1 mt-0.5">{item.answer}</p>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <span className="text-[10px] px-2 py-0.5 rounded border border-[var(--admin-border)] text-[var(--admin-text-muted)]">{item.category}</span>
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.isActive ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-gray-900/30 text-gray-400 border-gray-700'}`}>
                      {item.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingFaq(item); setFaqForm({ question: item.question, answer: item.answer, category: item.category }); setIsModalOpen(true); }}
                        className="p-1.5 rounded-md text-[var(--admin-text-muted)] hover:text-[var(--admin-primary)] hover:bg-[var(--admin-border)] transition-colors">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={async () => { await deleteFaqItem(item.id); toast('Excluído!'); load(); }}
                        className="p-1.5 rounded-md text-[var(--admin-text-muted)] hover:text-[var(--admin-accent-red)] hover:bg-[var(--admin-accent-red)]/10 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODALS */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[var(--admin-bg)] border border-[var(--admin-border)] shadow-2xl rounded-2xl z-[101] flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between p-6 border-b border-[var(--admin-border)] bg-[var(--admin-card)]">
                <h3 className="text-lg font-bold text-[var(--admin-text-main)]">
                  {activeTab === 'testimonials' ? 'Novo Depoimento' : editingFaq ? 'Editar FAQ' : 'Nova Pergunta'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-[var(--admin-text-muted)]"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 overflow-y-auto no-scrollbar flex-1">
                {activeTab === 'testimonials' ? (
                  <form id="tForm" onSubmit={handleTestimonialSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[var(--admin-text-main)]">Nome *</label>
                      <Input required value={testimonialForm.name} onChange={e => setTestimonialForm(p => ({ ...p, name: e.target.value }))} className="bg-[var(--admin-card)] border-[var(--admin-border)] focus:border-[var(--admin-primary)] text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-[var(--admin-text-main)]">Destino</label>
                        <Input value={testimonialForm.destination} onChange={e => setTestimonialForm(p => ({ ...p, destination: e.target.value }))} className="bg-[var(--admin-card)] border-[var(--admin-border)] focus:border-[var(--admin-primary)] text-sm" placeholder="Coreia do Sul" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-[var(--admin-text-main)]">Avaliação</label>
                        <select value={testimonialForm.rating} onChange={e => setTestimonialForm(p => ({ ...p, rating: e.target.value }))} className="h-10 px-3 text-sm rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-main)] focus:outline-none focus:border-[var(--admin-primary)]">
                          {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} ⭐</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[var(--admin-text-main)]">Depoimento *</label>
                      <textarea required value={testimonialForm.text} onChange={e => setTestimonialForm(p => ({ ...p, text: e.target.value }))} className="flex min-h-[100px] w-full rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm text-[var(--admin-text-main)] focus-visible:outline-none focus-visible:border-[var(--admin-primary)] resize-none" />
                    </div>
                  </form>
                ) : (
                  <form id="faqForm" onSubmit={handleFaqSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[var(--admin-text-main)]">Pergunta *</label>
                      <Input required value={faqForm.question} onChange={e => setFaqForm(p => ({ ...p, question: e.target.value }))} className="bg-[var(--admin-card)] border-[var(--admin-border)] focus:border-[var(--admin-primary)] text-sm" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[var(--admin-text-main)]">Resposta *</label>
                      <textarea required value={faqForm.answer} onChange={e => setFaqForm(p => ({ ...p, answer: e.target.value }))} className="flex min-h-[100px] w-full rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm text-[var(--admin-text-main)] focus-visible:outline-none focus-visible:border-[var(--admin-primary)] resize-none" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[var(--admin-text-main)]">Categoria</label>
                      <select value={faqForm.category} onChange={e => setFaqForm(p => ({ ...p, category: e.target.value }))} className="h-10 px-3 text-sm rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-main)] focus:outline-none focus:border-[var(--admin-primary)]">
                        {FAQ_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </form>
                )}
              </div>
              <div className="p-6 border-t border-[var(--admin-border)] bg-[var(--admin-card)] flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="border-[var(--admin-border)] text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50" disabled={isSubmitting}>Cancelar</Button>
                <Button form={activeTab === 'testimonials' ? 'tForm' : 'faqForm'} type="submit" disabled={isSubmitting} className="bg-[var(--admin-primary)] hover:bg-[var(--admin-primary-hover)] text-black font-semibold">
                  {isSubmitting ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const FAQ_CATEGORIES = ['Geral', 'Coreia do Sul', 'Intercâmbio', 'Pagamentos', 'Viagem', 'K-Beauty'];
