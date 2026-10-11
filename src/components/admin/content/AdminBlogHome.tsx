'use client';

/**
 * Blog / Journal.
 *
 * Correções: debounce na busca (antes um round-trip por tecla), paginação real
 * (antes mostrava só os 20 primeiros e anunciava "N artigos no total" usando o
 * tamanho da página, não o total), e tratamento de erro em create/update/
 * delete/toggle — o `else` faltava em todos.
 */
import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Edit3, Eye, EyeOff, FileText, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getBlogPosts, createBlogPost, updateBlogPost, deleteBlogPost } from '@/actions/contentActions';
import SmartImage from '@/components/SmartImage';
import AdminPagination from '@/components/admin/ui/Pagination';
import { useDebouncedValue } from '@/components/admin/ui/useDebouncedValue';
import { useMountedLoad } from '@/components/admin/ui/useMountedLoad';
import { AdminEmptyState, AdminErrorState, AdminPageHeader, AdminTableSkeleton } from '@/components/admin/ui/States';

interface BlogPostRow {
  id: string;
  slug: string;
  title: string;
  author: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  status: string;
  createdAt: string;
}

/**
 * `type` e não `interface`: `ActionInput` aceita `Record<string, unknown>` e só
 * tipos-literal ganham índice implícito — com `interface` o TS recusa o payload.
 */
type BlogForm = {
  title: string;
  author: string;
  excerpt: string;
  content: string;
  coverImage: string;
  status: string;
};

const EMPTY_FORM: BlogForm = {
  title: '',
  author: '',
  excerpt: '',
  content: '',
  coverImage: '',
  status: 'draft',
};

export default function AdminBlogHome() {
  const { t, formatNumber, formatDate } = useLanguage();
  const { toast } = useToast();

  const [posts, setPosts] = useState<BlogPostRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BlogPostRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<BlogForm>(EMPTY_FORM);

  const debouncedSearch = useDebouncedValue(search);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getBlogPosts({ page, pageSize, search: debouncedSearch, status: statusFilter || undefined });
    if (res.success) {
      setPosts((res.items ?? []) as unknown as BlogPostRow[]);
      setTotal(res.total ?? 0);
      setTotalPages(res.totalPages ?? 1);
    } else {
      setPosts([]);
      setTotal(0);
      setTotalPages(1);
      setError(res.error ?? t('state.errorTitle'));
    }
    setLoading(false);
  }, [page, pageSize, debouncedSearch, statusFilter, t]);

  useMountedLoad(load);

  const openModal = (item?: BlogPostRow) => {
    setEditingItem(item ?? null);
    setFormData(
      item
        ? {
            title: item.title,
            author: item.author ?? '',
            excerpt: item.excerpt ?? '',
            content: item.content ?? '',
            coverImage: item.coverImage ?? '',
            status: item.status,
          }
        : EMPTY_FORM,
    );
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('admin.blog.deleteConfirm'))) return;
    const res = await deleteBlogPost(id);
    if (res.success) {
      toast(t('admin.blog.deleted'));
      await load();
    } else {
      toast(res.error ?? t('state.errorTitle'), 'error');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.title.trim()) {
      toast(t('admin.blog.titleField'), 'error');
      return;
    }
    setIsSubmitting(true);
    const res = editingItem
      ? await updateBlogPost(editingItem.id, formData)
      : await createBlogPost(formData);
    setIsSubmitting(false);

    if (res.success) {
      toast(editingItem ? t('admin.blog.updated') : t('admin.blog.created'));
      setIsModalOpen(false);
      setFormData(EMPTY_FORM);
      await load();
    } else {
      toast(res.error ?? t('state.errorTitle'), 'error');
    }
  };

  const toggleStatus = async (post: BlogPostRow) => {
    const next = post.status === 'published' ? 'draft' : 'published';
    const res = await updateBlogPost(post.id, { status: next });
    if (res.success) {
      toast(next === 'published' ? t('admin.blog.publishedOk') : t('admin.blog.unpublishedOk'));
      await load();
    } else {
      toast(res.error ?? t('state.errorTitle'), 'error');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-full flex-col gap-6"
    >
      <AdminPageHeader
        icon={<FileText className="w-5 h-5" />}
        title={t('admin.blog.title')}
        subtitle={t('admin.blog.subtitle').replace('{count}', formatNumber(total))}
        actions={
          <>
            <Button
              onClick={load}
              variant="outline"
              aria-label={t('state.retry')}
              className="h-9 border-[var(--admin-border)] px-3 text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              onClick={() => openModal()}
              className="h-9 bg-[var(--admin-primary)] px-4 font-semibold text-black hover:bg-[var(--admin-primary-hover)]"
            >
              <Plus className="w-4 h-4 mr-1" /> {t('admin.blog.newArticle')}
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder={t('admin.blog.search')}
          aria-label={t('admin.blog.search')}
          className="h-9 max-w-md flex-1 bg-[var(--admin-card)] text-xs text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          aria-label={t('admin.blog.status')}
          className="h-9 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 text-xs text-[var(--admin-text-muted)] focus:border-[var(--admin-primary)] focus:outline-none"
        >
          <option value="">{t('admin.book.filterAll')}</option>
          <option value="published">{t('admin.blog.published')}</option>
          <option value="draft">{t('admin.blog.draft')}</option>
        </select>
      </div>

      {error ? (
        <AdminErrorState message={error} onRetry={load} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--admin-border)] bg-black/5 text-[10px] uppercase tracking-wider text-[var(--admin-text-muted)]">
                <th className="p-4 font-semibold">{t('admin.blog.titleField')}</th>
                <th className="hidden p-4 font-semibold sm:table-cell">{t('admin.blog.author')}</th>
                <th className="hidden p-4 font-semibold md:table-cell">{t('admin.logs.dateTime')}</th>
                <th className="p-4 font-semibold">{t('admin.blog.status')}</th>
                <th className="p-4 text-right font-semibold">{t('admin.team.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && posts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-0">
                    <AdminTableSkeleton rows={8} columns={4} />
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-0">
                    <AdminEmptyState
                      title={t('admin.blog.empty')}
                      description={debouncedSearch ? t('state.searchEmptyHint') : undefined}
                      icon={<FileText className="w-5 h-5" />}
                    />
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr
                    key={post.id}
                    className="group border-b border-[var(--admin-border)] transition-colors hover:bg-[var(--admin-border)]/20"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[var(--admin-border)]">
                          {post.coverImage ? (
                            <SmartImage
                              src={post.coverImage}
                              alt=""
                              fill
                              sizes="40px"
                              className="object-cover"
                              unoptimizedMedia
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center">
                              <FileText className="w-4 h-4 text-[var(--admin-text-muted)]" />
                            </span>
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="max-w-[220px] truncate text-xs font-semibold text-[var(--admin-text-main)]">
                            {post.title}
                          </p>
                          <p className="max-w-[220px] truncate text-[10px] text-[var(--admin-text-muted)]">
                            {post.excerpt ?? t('admin.blog.noExcerpt')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden p-4 text-[11px] text-[var(--admin-text-muted)] sm:table-cell">
                      {post.author || '—'}
                    </td>
                    <td className="hidden p-4 md:table-cell">
                      <span className="flex items-center gap-1 text-[10px] text-[var(--admin-text-muted)]">
                        <Clock className="w-3 h-3" />
                        {formatDate(post.createdAt)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                          post.status === 'published'
                            ? 'border-green-800 bg-green-900/30 text-green-400'
                            : 'border-yellow-800 bg-yellow-900/30 text-yellow-400'
                        }`}
                      >
                        {post.status === 'published' ? t('admin.blog.published') : t('admin.blog.draft')}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                        <button
                          type="button"
                          onClick={() => void toggleStatus(post)}
                          title={post.status === 'published' ? t('admin.blog.unpublish') : t('admin.blog.publish')}
                          aria-label={post.status === 'published' ? t('admin.blog.unpublish') : t('admin.blog.publish')}
                          className="rounded-md p-1.5 text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-border)] hover:text-[var(--admin-primary)]"
                        >
                          {post.status === 'published' ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => openModal(post)}
                          aria-label={t('admin.blog.editArticle')}
                          className="rounded-md p-1.5 text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-border)] hover:text-[var(--admin-primary)]"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(post.id)}
                          aria-label={t('admin.blog.deleteConfirm')}
                          className="rounded-md p-1.5 text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-accent-red)]/10 hover:text-[var(--admin-accent-red)]"
                        >
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
      )}

      <AdminPagination
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        disabled={loading || Boolean(error)}
      />

      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.button
              type="button"
              aria-label={t('admin.common.cancel')}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 z-[101] flex max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-bg)] shadow-2xl"
            >
              <header className="flex items-center justify-between gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
                <h3 className="text-lg font-bold text-[var(--admin-text-main)]">
                  {editingItem ? t('admin.blog.editArticle') : t('admin.blog.newArticle')}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  aria-label={t('admin.common.cancel')}
                  className="text-[var(--admin-text-muted)] transition-colors hover:text-[var(--admin-text-main)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-6">
                <form id="blogForm" onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="blog-title" className="text-xs font-semibold text-[var(--admin-text-main)]">
                      {t('admin.blog.titleField')} *
                    </label>
                    <Input
                      id="blog-title"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="blog-author" className="text-xs font-semibold text-[var(--admin-text-main)]">
                        {t('admin.blog.author')}
                      </label>
                      <Input
                        id="blog-author"
                        value={formData.author}
                        onChange={(e) => setFormData((prev) => ({ ...prev, author: e.target.value }))}
                        className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="blog-status" className="text-xs font-semibold text-[var(--admin-text-main)]">
                        {t('admin.blog.status')}
                      </label>
                      <select
                        id="blog-status"
                        value={formData.status}
                        onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                        className="h-10 rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 text-sm text-[var(--admin-text-main)] focus:border-[var(--admin-primary)] focus:outline-none"
                      >
                        <option value="draft">{t('admin.blog.draft')}</option>
                        <option value="published">{t('admin.blog.published')}</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="blog-cover"
                      className="text-xs font-semibold text-[var(--admin-text-main)]"
                    >
                      {t('admin.blog.coverImage')}
                    </label>
                    <Input
                      id="blog-cover"
                      value={formData.coverImage}
                      onChange={(e) => setFormData((prev) => ({ ...prev, coverImage: e.target.value }))}
                      className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                      placeholder="https://…"
                    />
                    {formData.coverImage && (
                      <div className="relative mt-1 h-28 w-full overflow-hidden rounded-lg border border-[var(--admin-border)]">
                        <SmartImage
                          src={formData.coverImage}
                          alt=""
                          fill
                          sizes="480px"
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="blog-excerpt" className="text-xs font-semibold text-[var(--admin-text-main)]">
                      {t('admin.blog.excerpt')}
                    </label>
                    <textarea
                      id="blog-excerpt"
                      value={formData.excerpt}
                      onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
                      className="flex min-h-[60px] w-full resize-none rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm text-[var(--admin-text-main)] focus-visible:border-[var(--admin-primary)] focus-visible:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="blog-content" className="text-xs font-semibold text-[var(--admin-text-main)]">
                      {t('admin.blog.content')}
                    </label>
                    <textarea
                      id="blog-content"
                      value={formData.content}
                      onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                      className="flex min-h-[200px] w-full resize-y rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 font-mono text-sm text-[var(--admin-text-main)] focus-visible:border-[var(--admin-primary)] focus-visible:outline-none"
                      placeholder="<h2>Título</h2>"
                    />
                  </div>
                </form>
              </div>

              <footer className="flex justify-end gap-3 border-t border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="border-[var(--admin-border)] text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50"
                >
                  {t('admin.common.cancel')}
                </Button>
                <Button
                  form="blogForm"
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[var(--admin-primary)] font-semibold text-black hover:bg-[var(--admin-primary-hover)]"
                >
                  {isSubmitting ? t('admin.state.loading') : editingItem ? t('admin.common.update') : t('admin.common.create')}
                </Button>
              </footer>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
