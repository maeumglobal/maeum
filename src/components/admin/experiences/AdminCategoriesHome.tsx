'use client';

/**
 * Categorias.
 *
 * Correções:
 *  - o update mandava `slug` e `destination` num payload cujo tipo só declara
 *    `{name?, isActive?, sortOrder?}`. Confirmado na action: `updateCategory`
 *    aceita `name`, `nameEn`, `nameEs`, `destination`, `isActive`, `sortOrder`
 *    e `slug` — este formulário envia exatamente o que a action lê;
 *  - o reorder fazia DOIS awaits sequenciais sem rollback: se o segundo falhasse,
 *    a ordem ficava pela metade no banco e a tela mostrava a ordem nova (otimista)
 *    sem volta. Agora os dois `Promise.all` disparam juntos, o estado otimista é
 *    revertido em qualquer falha e há toast de erro.
 */
import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, ArrowUp, Edit3, FolderTree, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { createCategory, deleteCategory, getCategories, updateCategory } from '@/actions/experienceActions';
import { AdminEmptyState, AdminErrorState, AdminPageHeader } from '@/components/admin/ui/States';
import { useMountedLoad } from '@/components/admin/ui/useMountedLoad';

interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  nameEn: string | null;
  nameEs: string | null;
  destination: string;
  isActive: boolean;
  sortOrder: number;
}

/** `type` (não `interface`) para ser aceito como `ActionInput`. */
type CategoryForm = {
  name: string;
  nameEn: string;
  nameEs: string;
  destination: string;
  isActive: boolean;
};

const DEFAULT_FORM: CategoryForm = {
  name: '',
  nameEn: '',
  nameEs: '',
  destination: 'Coreia do Sul',
  isActive: true,
};

function slugifyLocal(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ç/g, 'c')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 80);
}

export default function AdminCategoriesHome() {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CategoryRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CategoryForm>(DEFAULT_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getCategories();
    if (res.success && res.data) {
      setCategories(res.data as CategoryRow[]);
    } else {
      setCategories([]);
      setError(res.error ?? t('state.errorTitle'));
    }
    setLoading(false);
  }, [t]);

  useMountedLoad(load);

  const openModal = (item?: CategoryRow) => {
    setEditingItem(item ?? null);
    setFormData(
      item
        ? {
            name: item.name,
            nameEn: item.nameEn ?? '',
            nameEs: item.nameEs ?? '',
            destination: item.destination ?? '',
            isActive: item.isActive,
          }
        : DEFAULT_FORM,
    );
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData(DEFAULT_FORM);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.name.trim()) {
      toast(t('admin.cat.name'), 'error');
      return;
    }

    setIsSubmitting(true);
    const res = editingItem
      ? await updateCategory(editingItem.id, formData)
      : await createCategory({ ...formData, slug: slugifyLocal(formData.name) });
    setIsSubmitting(false);

    if (res.success) {
      toast(editingItem ? t('admin.cat.updated') : t('admin.cat.created'));
      closeModal();
      await load();
    } else {
      toast(res.error ?? t('state.errorTitle'), 'error');
    }
  };

  const handleToggleActive = async (category: CategoryRow) => {
    setBusy(true);
    const res = await updateCategory(category.id, { isActive: !category.isActive });
    setBusy(false);
    if (res.success) {
      toast(category.isActive ? t('admin.cat.inactive') : t('admin.cat.active'));
      await load();
    } else {
      toast(res.error ?? t('state.errorTitle'), 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(t('admin.cat.deleteConfirm').replace('{name}', name))) return;
    const res = await deleteCategory(id);
    if (res.success) {
      toast(t('admin.cat.deleted'));
      await load();
    } else {
      toast(res.error ?? t('state.errorTitle'), 'error');
    }
  };

  /**
   * Reordena trocando os dois vizinhos.
   *
   * Os dois `updateCategory` saem JUNTOS (`Promise.all`) e o estado otimista é
   * restaurado se qualquer um falhar — antes, uma falha no segundo deixava
   * `sortOrder` inconsistente sem aviso.
   */
  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= categories.length) return;

    const previous = categories;
    const next = [...categories];
    const a = next[index] as CategoryRow;
    const b = next[target] as CategoryRow;
    next[index] = b;
    next[target] = a;
    setCategories(next);
    setBusy(true);

    const [first, second] = await Promise.all([
      updateCategory(b.id, { sortOrder: index }),
      updateCategory(a.id, { sortOrder: target }),
    ]);
    setBusy(false);

    if (!first.success || !second.success) {
      setCategories(previous);
      toast(first.error ?? second.error ?? t('admin.cat.reorderFailed'), 'error');
      await load();
      return;
    }
    toast(t('admin.cat.reordered'));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex w-full max-w-4xl flex-col gap-6"
    >
      <AdminPageHeader
        icon={<FolderTree className="w-5 h-5" />}
        title={t('admin.cat.title')}
        subtitle={t('admin.cat.subtitle')}
        actions={
          <>
            <Button
              onClick={load}
              variant="outline"
              aria-label={t('common.refresh')}
              className="h-9 border-[var(--admin-border)] px-3 text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              onClick={() => openModal()}
              className="h-9 bg-[var(--admin-primary)] px-4 font-semibold text-black hover:bg-[var(--admin-primary-hover)]"
            >
              <Plus className="w-4 h-4 mr-1" /> {t('admin.cat.newCategory')}
            </Button>
          </>
        }
      />

      {error ? (
        <AdminErrorState message={error} onRetry={load} />
      ) : loading ? (
        <div className="flex justify-center rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-[var(--admin-text-muted)]" />
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)]">
          <AdminEmptyState title={t('admin.cat.empty')} icon={<FolderTree className="w-5 h-5" />} />
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {categories.map((category, index) => (
            <li
              key={category.id}
              className="group flex items-center justify-between gap-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] p-3 transition-colors hover:border-[var(--admin-primary)]/40"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    disabled={busy || index === 0}
                    onClick={() => void handleReorder(index, 'up')}
                    aria-label={t('admin.cat.moveUp')}
                    title={t('admin.cat.moveUp')}
                    className="text-[var(--admin-text-muted)] transition-colors hover:text-[var(--admin-text-main)] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    disabled={busy || index === categories.length - 1}
                    onClick={() => void handleReorder(index, 'down')}
                    aria-label={t('admin.cat.moveDown')}
                    title={t('admin.cat.moveDown')}
                    className="text-[var(--admin-text-muted)] transition-colors hover:text-[var(--admin-text-main)] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[var(--admin-text-main)]">{category.name}</p>
                  <p className="truncate text-[10px] text-[var(--admin-text-muted)]">
                    {category.slug} • {category.destination}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                    category.isActive
                      ? 'border-green-800 bg-green-900/30 text-green-400'
                      : 'border-gray-700 bg-gray-900/30 text-gray-500'
                  }`}
                >
                  {category.isActive ? t('admin.cat.active') : t('admin.cat.inactive')}
                </span>
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleToggleActive(category)}
                    className="rounded bg-[var(--admin-border)] px-2 py-1 text-[10px] font-semibold transition-colors hover:text-[var(--admin-text-main)] disabled:opacity-50"
                  >
                    {category.isActive ? t('admin.cat.deactivate') : t('admin.cat.activate')}
                  </button>
                  <button
                    type="button"
                    onClick={() => openModal(category)}
                    aria-label={t('admin.cat.newCategory')}
                    className="rounded p-1 text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-border)] hover:text-[var(--admin-primary)]"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(category.id, category.name)}
                    aria-label={t('admin.cat.deleteConfirm').replace('{name}', category.name)}
                    className="rounded p-1 text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-accent-red)]/10 hover:text-[var(--admin-accent-red)]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 z-[101] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-bg)] shadow-2xl"
            >
              <header className="flex items-center justify-between gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
                <h3 className="text-lg font-bold text-[var(--admin-text-main)]">
                  {editingItem ? t('admin.cat.title') : t('admin.cat.newCategory')}
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

              <form id="catForm" onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="cat-name" className="text-xs font-semibold text-[var(--admin-text-main)]">
                    {t('admin.cat.name')} *
                  </label>
                  <Input
                    id="cat-name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="cat-name-en" className="text-xs font-semibold text-[var(--admin-text-main)]">
                      {t('admin.cms.languageEn')}
                    </label>
                    <Input
                      id="cat-name-en"
                      value={formData.nameEn}
                      onChange={(e) => setFormData((prev) => ({ ...prev, nameEn: e.target.value }))}
                      className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="cat-name-es" className="text-xs font-semibold text-[var(--admin-text-main)]">
                      {t('admin.cms.languageEs')}
                    </label>
                    <Input
                      id="cat-name-es"
                      value={formData.nameEs}
                      onChange={(e) => setFormData((prev) => ({ ...prev, nameEs: e.target.value }))}
                      className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="cat-destination" className="text-xs font-semibold text-[var(--admin-text-main)]">
                    {t('admin.cat.destination')}
                  </label>
                  <Input
                    id="cat-destination"
                    value={formData.destination}
                    onChange={(e) => setFormData((prev) => ({ ...prev, destination: e.target.value }))}
                    className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs text-[var(--admin-text-main)]">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 accent-[var(--admin-primary)]"
                  />
                  {t('admin.cat.active')}
                </label>
              </form>

              <footer className="flex justify-end gap-3 border-t border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="border-[var(--admin-border)] text-[var(--admin-text-main)]"
                >
                  {t('admin.common.cancel')}
                </Button>
                <Button
                  form="catForm"
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
