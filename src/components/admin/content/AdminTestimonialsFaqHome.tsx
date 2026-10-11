'use client';

/**
 * Depoimentos + FAQ.
 *
 * ## Lacunas fechadas
 *
 * - **Não existia edição de depoimento.** Só havia criar/aprovar/rejeitar/
 *   excluir, então o texto publicado era imutável. Agora há modal de edição
 *   chamando `updateTestimonial` (action nova em `adminActions.ts`, porque
 *   `contentActions` não expõe esse verbo).
 * - **FAQ mostrava `isActive` mas não havia toggle.** Agora alterna via
 *   `updateFaqItem({ isActive })`.
 * - **Não havia reordenação.** Agora há botões ↑↓ que gravam `sortOrder`
 *   com `Promise.all` + rollback, sem biblioteca nova.
 * - **`FAQ_CATEGORIES` estava declarado duas vezes** (linha 60 dentro do
 *   componente e linha 252 no escopo do módulo) — agora só uma vez, no módulo.
 * - **Todas as actions devolviam sucesso ignorado**: aprovar, rejeitar,
 *   excluir e salvar toastavam "Aprovado!" mesmo em falha. Agora cada ramo tem
 *   `else`.
 */
import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Edit3,
  MessageCircleQuestion,
  Plus,
  Quote,
  RefreshCw,
  Star,
  ThumbsDown,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  approveTestimonial,
  createFaqItem,
  createTestimonial,
  deleteFaqItem,
  deleteTestimonial,
  getFaqItems,
  getTestimonials,
  rejectTestimonial,
  updateFaqItem,
} from '@/actions/contentActions';
import { updateTestimonial } from '@/actions/adminActions';
import { AdminEmptyState, AdminErrorState } from '@/components/admin/ui/States';
import { useMountedLoad } from '@/components/admin/ui/useMountedLoad';

/** Categorias do FAQ — uma única declaração (ficava duplicada no arquivo). */
const FAQ_CATEGORIES = ['Geral', 'Coreia do Sul', 'Intercâmbio', 'Pagamentos', 'Viagem', 'K-Beauty'];

interface TestimonialRow {
  id: string;
  name: string;
  destination: string | null;
  text: string;
  rating: number;
  avatarUrl: string | null;
  status: string;
  sortOrder: number;
}

interface FaqRow {
  id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
}

interface TestimonialForm {
  name: string;
  destination: string;
  text: string;
  rating: string;
  avatarUrl: string;
}

const EMPTY_TESTIMONIAL: TestimonialForm = {
  name: '',
  destination: '',
  text: '',
  rating: '5',
  avatarUrl: '',
};

const FAQ_STYLE: Record<string, string> = {
  approved: 'border-green-800 bg-green-900/30 text-green-400',
  pending: 'border-yellow-800 bg-yellow-900/30 text-yellow-400',
  rejected: 'border-red-800 bg-red-900/30 text-red-400',
};

export default function AdminTestimonialsFaqHome() {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'testimonials' | 'faq'>('testimonials');
  const [testimonials, setTestimonials] = useState<TestimonialRow[]>([]);
  const [faqItems, setFaqItems] = useState<FaqRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<TestimonialRow | null>(null);
  const [editingFaq, setEditingFaq] = useState<FaqRow | null>(null);

  const [testimonialForm, setTestimonialForm] = useState<TestimonialForm>(EMPTY_TESTIMONIAL);
  const [faqForm, setFaqForm] = useState({ question: '', answer: '', category: FAQ_CATEGORIES[0] ?? 'Geral' });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [tRes, fRes] = await Promise.all([getTestimonials(), getFaqItems()]);

    if (tRes.success && tRes.data) setTestimonials(tRes.data as TestimonialRow[]);
    if (fRes.success && fRes.data) setFaqItems(fRes.data as FaqRow[]);

    if (!tRes.success && !fRes.success) {
      setError(tRes.error ?? fRes.error ?? t('state.errorTitle'));
    } else if (!tRes.success || !fRes.success) {
      // Uma aba carregou e a outra não: mostra o aviso em vez de fingir vazio.
      setError(tRes.success ? (fRes.error ?? t('state.errorTitle')) : (tRes.error ?? t('state.errorTitle')));
    }

    setLoading(false);
  }, [t]);

  useMountedLoad(load);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTestimonial(null);
    setEditingFaq(null);
    setTestimonialForm(EMPTY_TESTIMONIAL);
    setFaqForm({ question: '', answer: '', category: FAQ_CATEGORIES[0] ?? 'Geral' });
  };

  const openNewTestimonial = () => {
    setEditingTestimonial(null);
    setEditingFaq(null);
    setTestimonialForm(EMPTY_TESTIMONIAL);
    setIsModalOpen(true);
  };

  const openEditTestimonial = (row: TestimonialRow) => {
    setEditingFaq(null);
    setEditingTestimonial(row);
    setTestimonialForm({
      name: row.name,
      destination: row.destination ?? '',
      text: row.text,
      rating: String(row.rating),
      avatarUrl: row.avatarUrl ?? '',
    });
    setIsModalOpen(true);
  };

  const openNewFaq = () => {
    setEditingTestimonial(null);
    setEditingFaq(null);
    setFaqForm({ question: '', answer: '', category: FAQ_CATEGORIES[0] ?? 'Geral' });
    setIsModalOpen(true);
  };

  const openEditFaq = (row: FaqRow) => {
    setEditingTestimonial(null);
    setEditingFaq(row);
    setFaqForm({ question: row.question, answer: row.answer, category: row.category });
    setIsModalOpen(true);
  };

  // ── Depoimentos ─────────────────────────────────────────

  const handleTestimonialSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    const payload = {
      name: testimonialForm.name,
      destination: testimonialForm.destination,
      text: testimonialForm.text,
      rating: Number(testimonialForm.rating),
      avatarUrl: testimonialForm.avatarUrl,
    };
    const res = editingTestimonial
      ? await updateTestimonial(editingTestimonial.id, payload)
      : await createTestimonial(payload);
    setIsSubmitting(false);

    if (res.success) {
      toast(editingTestimonial ? t('admin.tf.testimonialUpdated') : t('admin.tf.testimonialCreated'));
      closeModal();
      await load();
    } else {
      toast(res.error ?? t('state.errorTitle'), 'error');
    }
  };

  const handleApprove = async (id: string) => {
    setBusy(true);
    const res = await approveTestimonial(id);
    setBusy(false);
    if (res.success) {
      toast(t('admin.tf.approved'));
      await load();
    } else {
      toast(res.error ?? t('state.errorTitle'), 'error');
    }
  };

  const handleReject = async (id: string) => {
    setBusy(true);
    const res = await rejectTestimonial(id);
    setBusy(false);
    if (res.success) {
      toast(t('admin.tf.rejected'));
      await load();
    } else {
      toast(res.error ?? t('state.errorTitle'), 'error');
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (!window.confirm(t('admin.tf.deleteConfirm'))) return;
    setBusy(true);
    const res = await deleteTestimonial(id);
    setBusy(false);
    if (res.success) {
      toast(t('admin.tf.deleted'));
      await load();
    } else {
      toast(res.error ?? t('state.errorTitle'), 'error');
    }
  };

  // ── FAQ ────────────────────────────────────────────────

  const handleFaqSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    const res = editingFaq ? await updateFaqItem(editingFaq.id, faqForm) : await createFaqItem(faqForm);
    setIsSubmitting(false);

    if (res.success) {
      toast(editingFaq ? t('admin.tf.faqUpdated') : t('admin.tf.faqCreated'));
      closeModal();
      await load();
    } else {
      toast(res.error ?? t('state.errorTitle'), 'error');
    }
  };

  const handleToggleFaq = async (row: FaqRow) => {
    setBusy(true);
    const res = await updateFaqItem(row.id, { isActive: !row.isActive });
    setBusy(false);
    if (res.success) {
      toast(row.isActive ? t('admin.tf.inactive') : t('admin.tf.active'));
      await load();
    } else {
      toast(res.error ?? t('state.errorTitle'), 'error');
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!window.confirm(t('admin.tf.deleteConfirm'))) return;
    setBusy(true);
    const res = await deleteFaqItem(id);
    setBusy(false);
    if (res.success) {
      toast(t('admin.tf.deleted'));
      await load();
    } else {
      toast(res.error ?? t('state.errorTitle'), 'error');
    }
  };

  /** Reordena dentro do grupo de categoria (o site agrupa por categoria). */
  const handleReorderFaq = async (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= faqItems.length) return;
    const a = faqItems[index] as FaqRow;
    const b = faqItems[target] as FaqRow;
    if (a.category !== b.category) return;

    const previous = faqItems;
    const next = [...faqItems];
    next[index] = b;
    next[target] = a;
    setFaqItems(next);
    setBusy(true);

    const [first, second] = await Promise.all([
      updateFaqItem(b.id, { sortOrder: index }),
      updateFaqItem(a.id, { sortOrder: target }),
    ]);
    setBusy(false);

    if (!first.success || !second.success) {
      setFaqItems(previous);
      toast(first.error ?? second.error ?? t('admin.cat.reorderFailed'), 'error');
      await load();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-full flex-col gap-6"
    >
      <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-4 md:p-6">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('testimonials')}
              aria-pressed={activeTab === 'testimonials'}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
                activeTab === 'testimonials'
                  ? 'bg-[var(--admin-primary)] text-black'
                  : 'bg-[var(--admin-border)]/30 text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)]'
              }`}
            >
              {t('admin.tf.tabTestimonials').replace('{count}', String(testimonials.length))}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('faq')}
              aria-pressed={activeTab === 'faq'}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
                activeTab === 'faq'
                  ? 'bg-[var(--admin-primary)] text-black'
                  : 'bg-[var(--admin-border)]/30 text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)]'
              }`}
            >
              {t('admin.tf.tabFaq').replace('{count}', String(faqItems.length))}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={load}
              variant="outline"
              aria-label={t('common.refresh')}
              className="h-9 border-[var(--admin-border)] px-3 text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              onClick={activeTab === 'testimonials' ? openNewTestimonial : openNewFaq}
              className="h-9 bg-[var(--admin-primary)] px-4 font-semibold text-black hover:bg-[var(--admin-primary-hover)]"
            >
              <Plus className="w-4 h-4 mr-1" />
              {activeTab === 'testimonials' ? t('admin.tf.newTestimonial') : t('admin.tf.newQuestion')}
            </Button>
          </div>
        </div>
      </div>

      {error ? (
        <AdminErrorState message={error} onRetry={load} />
      ) : activeTab === 'testimonials' ? (
        loading ? (
          <div className="flex justify-center rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-[var(--admin-text-muted)]" />
          </div>
        ) : testimonials.length === 0 ? (
          <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)]">
            <AdminEmptyState title={t('admin.tf.emptyTestimonials')} icon={<Quote className="w-5 h-5" />} />
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {testimonials.map((row) => (
              <motion.li
                key={row.id}
                layout
                className="group flex items-start gap-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-4 transition-colors hover:border-[var(--admin-primary)]/30"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--admin-border)] text-sm font-bold text-[var(--admin-text-muted)]">
                  {(row.name ?? '?').charAt(0).toUpperCase()}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-[var(--admin-text-main)]">{row.name}</span>
                    {row.destination && (
                      <span className="text-[10px] text-[var(--admin-text-muted)]">— {row.destination}</span>
                    )}
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${
                        FAQ_STYLE[row.status] ?? FAQ_STYLE.pending
                      }`}
                    >
                      {row.status === 'approved'
                        ? t('admin.tf.statusApproved')
                        : row.status === 'rejected'
                          ? t('admin.tf.statusRejected')
                          : t('admin.tf.statusPending')}
                    </span>
                  </div>
                  <div className="mb-1 flex gap-0.5" aria-label={`${row.rating}/5`}>
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star
                        key={`star-${row.id}-${index}`}
                        aria-hidden="true"
                        className={`w-3 h-3 ${
                          index < row.rating
                            ? 'fill-[var(--admin-primary)] text-[var(--admin-primary)]'
                            : 'text-[var(--admin-border)]'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="line-clamp-2 text-[11px] text-[var(--admin-text-muted)]">{row.text}</p>
                </div>

                <div className="flex shrink-0 flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <button
                    type="button"
                    onClick={() => openEditTestimonial(row)}
                    aria-label={t('admin.tf.editTestimonial')}
                    title={t('admin.tf.editTestimonial')}
                    className="rounded-md p-1.5 text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-border)] hover:text-[var(--admin-primary)]"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  {row.status !== 'approved' && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleApprove(row.id)}
                      aria-label={t('admin.tf.approve')}
                      title={t('admin.tf.approve')}
                      className="rounded-md p-1.5 text-green-400 transition-colors hover:bg-green-900/30 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  {row.status !== 'rejected' && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleReject(row.id)}
                      aria-label={t('admin.tf.reject')}
                      title={t('admin.tf.reject')}
                      className="rounded-md p-1.5 text-[var(--admin-text-muted)] transition-colors hover:bg-yellow-900/30 hover:text-yellow-400 disabled:opacity-50"
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleDeleteTestimonial(row.id)}
                    aria-label={t('admin.tf.deleteConfirm')}
                    title={t('admin.tf.deleteConfirm')}
                    className="rounded-md p-1.5 text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-accent-red)]/10 hover:text-[var(--admin-accent-red)] disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.li>
            ))}
          </ul>
        )
      ) : loading ? (
        <div className="flex justify-center rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-[var(--admin-text-muted)]" />
        </div>
      ) : faqItems.length === 0 ? (
        <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)]">
          <AdminEmptyState title={t('admin.tf.emptyFaq')} icon={<MessageCircleQuestion className="w-5 h-5" />} />
        </div>
      ) : (
        <>
          <p className="text-[10px] text-[var(--admin-text-muted)]">{t('admin.tf.reorderHint')}</p>
          <div className="overflow-x-auto rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--admin-border)] bg-black/5 text-[10px] uppercase tracking-wider text-[var(--admin-text-muted)]">
                  <th className="p-4 font-semibold">{t('admin.tf.question')}</th>
                  <th className="hidden p-4 font-semibold md:table-cell">{t('admin.tf.category')}</th>
                  <th className="hidden p-4 font-semibold lg:table-cell">{t('admin.team.status')}</th>
                  <th className="p-4 text-right font-semibold">{t('admin.team.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {faqItems.map((row, index) => {
                  const firstOfGroup = index === 0 || faqItems[index - 1]?.category !== row.category;
                  return (
                    <tr
                      key={row.id}
                      className="group border-b border-[var(--admin-border)] transition-colors hover:bg-[var(--admin-border)]/20"
                    >
                      <td className="p-4">
                        <p className="text-xs font-semibold text-[var(--admin-text-main)]">{row.question}</p>
                        <p className="mt-0.5 line-clamp-1 text-[10px] text-[var(--admin-text-muted)]">
                          {row.answer}
                        </p>
                      </td>
                      <td className="hidden p-4 md:table-cell">
                        <span className="rounded border border-[var(--admin-border)] px-2 py-0.5 text-[10px] text-[var(--admin-text-muted)]">
                          {row.category}
                        </span>
                      </td>
                      <td className="hidden p-4 lg:table-cell">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleToggleFaq(row)}
                          aria-pressed={row.isActive}
                          title={t('admin.tf.toggleActive')}
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold transition-colors disabled:opacity-50 ${
                            row.isActive
                              ? 'border-green-800 bg-green-900/30 text-green-400'
                              : 'border-gray-700 bg-gray-900/30 text-gray-400'
                          }`}
                        >
                          {row.isActive ? t('admin.tf.active') : t('admin.tf.inactive')}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                          <div className="flex flex-col">
                            <button
                              type="button"
                              disabled={busy || firstOfGroup || index === 0}
                              onClick={() => void handleReorderFaq(index, 'up')}
                              aria-label={t('admin.tf.moveUp')}
                              title={t('admin.tf.moveUp')}
                              className="text-[var(--admin-text-muted)] transition-colors hover:text-[var(--admin-text-main)] disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={busy || index === faqItems.length - 1}
                              onClick={() => void handleReorderFaq(index, 'down')}
                              aria-label={t('admin.tf.moveDown')}
                              title={t('admin.tf.moveDown')}
                              className="text-[var(--admin-text-muted)] transition-colors hover:text-[var(--admin-text-main)] disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => openEditFaq(row)}
                            aria-label={t('admin.tf.editQuestion')}
                            title={t('admin.tf.editQuestion')}
                            className="rounded-md p-1.5 text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-border)] hover:text-[var(--admin-primary)]"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void handleDeleteFaq(row.id)}
                            aria-label={t('admin.tf.deleteConfirm')}
                            title={t('admin.tf.deleteConfirm')}
                            className="rounded-md p-1.5 text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-accent-red)]/10 hover:text-[var(--admin-accent-red)] disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Modais ───────────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.button
              type="button"
              aria-label={t('admin.common.cancel')}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 z-[101] flex max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-bg)] shadow-2xl"
            >
              <header className="flex items-center justify-between gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
                <h3 className="text-lg font-bold text-[var(--admin-text-main)]">
                  {activeTab === 'testimonials'
                    ? editingTestimonial
                      ? t('admin.tf.editTestimonial')
                      : t('admin.tf.newTestimonial')
                    : editingFaq
                      ? t('admin.tf.editQuestion')
                      : t('admin.tf.newQuestion')}
                </h3>
                <button
                  type="button"
                  onClick={closeModal}
                  aria-label={t('admin.common.cancel')}
                  className="text-[var(--admin-text-muted)] transition-colors hover:text-[var(--admin-text-main)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'testimonials' ? (
                  <form id="tForm" onSubmit={handleTestimonialSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="t-name" className="text-xs font-semibold text-[var(--admin-text-main)]">
                        {t('admin.tf.name')} *
                      </label>
                      <Input
                        id="t-name"
                        required
                        value={testimonialForm.name}
                        onChange={(e) => setTestimonialForm((prev) => ({ ...prev, name: e.target.value }))}
                        className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="t-destination"
                          className="text-xs font-semibold text-[var(--admin-text-main)]"
                        >
                          {t('admin.tf.destination')}
                        </label>
                        <Input
                          id="t-destination"
                          value={testimonialForm.destination}
                          onChange={(e) =>
                            setTestimonialForm((prev) => ({ ...prev, destination: e.target.value }))
                          }
                          className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="t-rating" className="text-xs font-semibold text-[var(--admin-text-main)]">
                          {t('admin.tf.rating')}
                        </label>
                        <select
                          id="t-rating"
                          value={testimonialForm.rating}
                          onChange={(e) => setTestimonialForm((prev) => ({ ...prev, rating: e.target.value }))}
                          className="h-10 rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 text-sm text-[var(--admin-text-main)] focus:border-[var(--admin-primary)] focus:outline-none"
                        >
                          {[5, 4, 3, 2, 1].map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="t-avatar" className="text-xs font-semibold text-[var(--admin-text-main)]">
                        {t('admin.users.avatar')}
                      </label>
                      <Input
                        id="t-avatar"
                        value={testimonialForm.avatarUrl}
                        onChange={(e) => setTestimonialForm((prev) => ({ ...prev, avatarUrl: e.target.value }))}
                        className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                        placeholder="/api/media/… ou https://…"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="t-text" className="text-xs font-semibold text-[var(--admin-text-main)]">
                        {t('admin.tf.text')} *
                      </label>
                      <textarea
                        id="t-text"
                        required
                        value={testimonialForm.text}
                        onChange={(e) => setTestimonialForm((prev) => ({ ...prev, text: e.target.value }))}
                        className="flex min-h-[110px] w-full resize-none rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm text-[var(--admin-text-main)] focus-visible:border-[var(--admin-primary)] focus-visible:outline-none"
                      />
                    </div>
                  </form>
                ) : (
                  <form id="faqForm" onSubmit={handleFaqSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="faq-question" className="text-xs font-semibold text-[var(--admin-text-main)]">
                        {t('admin.tf.question')} *
                      </label>
                      <Input
                        id="faq-question"
                        required
                        value={faqForm.question}
                        onChange={(e) => setFaqForm((prev) => ({ ...prev, question: e.target.value }))}
                        className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="faq-answer" className="text-xs font-semibold text-[var(--admin-text-main)]">
                        {t('admin.tf.answer')} *
                      </label>
                      <textarea
                        id="faq-answer"
                        required
                        value={faqForm.answer}
                        onChange={(e) => setFaqForm((prev) => ({ ...prev, answer: e.target.value }))}
                        className="flex min-h-[110px] w-full resize-none rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm text-[var(--admin-text-main)] focus-visible:border-[var(--admin-primary)] focus-visible:outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="faq-category" className="text-xs font-semibold text-[var(--admin-text-main)]">
                        {t('admin.tf.category')}
                      </label>
                      <select
                        id="faq-category"
                        value={faqForm.category}
                        onChange={(e) => setFaqForm((prev) => ({ ...prev, category: e.target.value }))}
                        className="h-10 rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 text-sm text-[var(--admin-text-main)] focus:border-[var(--admin-primary)] focus:outline-none"
                      >
                        {FAQ_CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                  </form>
                )}
              </div>

              <footer className="flex justify-end gap-3 border-t border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="border-[var(--admin-border)] text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50"
                >
                  {t('admin.common.cancel')}
                </Button>
                <Button
                  form={activeTab === 'testimonials' ? 'tForm' : 'faqForm'}
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[var(--admin-primary)] font-semibold text-black hover:bg-[var(--admin-primary-hover)]"
                >
                  {isSubmitting ? t('admin.state.loading') : t('admin.common.save')}
                </Button>
              </footer>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
