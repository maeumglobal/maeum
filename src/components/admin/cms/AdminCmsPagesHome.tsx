'use client';

/**
 * Páginas e blocos do CMS (`CmsPage` e `CmsBlock`).
 *
 * ## Aviso honesto (também está na tela, não só aqui)
 *
 * `CmsPage` e `CmsBlock` NÃO são renderizados por nenhuma página pública do
 * site hoje. As actions `getCmsPages`, `createCmsPage`, `updateCmsPage`,
 * `deleteCmsPage`, `getCmsBlocks`, `updateCmsBlock` e `reorderCmsBlocks`
 * estavam inalcançáveis (a tabela tinha 2 páginas e 1 bloco, invisíveis).
 * Esta tela as consome e manage o dado — mas o que for salvo aqui NÃO aparece
 * no site enquanto nenhuma rota ler `prisma.cmsPage`/`prisma.cmsBlock`.
 * O texto editável que realmente aparece no site é o da tela "Conteúdo do
 * Site" (`SiteSetting` + `cmsData.ts`), e o painel avisa isso explicitamente
 * para o administrador não achar que publicou algo que não existe.
 *
 * ## Decisões
 *
 * - **`CmsBlock.content` é JSON**: validado com `JSON.parse` ANTES de salvar,
 *   exibindo a mensagem real do parser com posição (e linha/coluna) calculada.
 *   A action (`safeJson`) cairia em `{ text: "..." }` silenciosamente se o
 *   JSON estivesse quebrado — isso apagaria o dado sem avisar ninguém.
 * - **`pageName` como filtro** (padrão `home`): é a chave que agrupa blocos e
 *   o campo que uma futura página pública usaria para escolher o que renderizar.
 * - **Não existe criação de bloco** no painel (as actions só listam, editam e
 *   reordenam) — a tela diz isso em vez de oferecer um botão que não funciona.
 * - **Slug imutável**: `updateCmsPage` não altera `slug`; o campo é somente
 *   leitura na edição e o aviso fica visível.
 */
import { useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowDown,
  ArrowUp,
  Braces,
  Edit3,
  FileText,
  Layers,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  TriangleAlert,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  createCmsPage,
  deleteCmsPage,
  getCmsBlocks,
  getCmsPages,
  reorderCmsBlocks,
  updateCmsBlock,
  updateCmsPage,
} from '@/actions/contentActions';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDebouncedValue } from '@/components/admin/ui/useDebouncedValue';
import { useMountedLoad } from '@/components/admin/ui/useMountedLoad';
import {
  AdminEmptyState,
  AdminErrorState,
  AdminPageHeader,
  AdminTableSkeleton,
} from '@/components/admin/ui/States';

interface CmsPageRow {
  id: string;
  title: string;
  slug: string;
  content: string;
  seoTitle: string | null;
  seoDesc: string | null;
  status: string;
}

interface CmsBlockRow {
  id: string;
  pageName: string;
  sectionId: string;
  blockType: string;
  content: string;
  sortOrder: number;
  isActive: boolean;
}

type PageForm = {
  title: string;
  slug: string;
  content: string;
  seoTitle: string;
  seoDesc: string;
  status: string;
};

const EMPTY_PAGE_FORM: PageForm = {
  title: '',
  slug: '',
  content: '',
  seoTitle: '',
  seoDesc: '',
  status: 'draft',
};

const DEFAULT_PAGE_NAME = 'home';
const MAX_REORDER_BLOCKS = 200;

interface JsonIssue {
  message: string;
  position: number | null;
  line: number | null;
  column: number | null;
}

type JsonParse =
  | { ok: true; formatted: string }
  | { ok: false; issue: JsonIssue };

/** `JSON.parse` com a posição do erro (V8 muda o formato entre versões). */
function parseJsonBlock(raw: string): JsonParse {
  const text = raw.trim();
  if (!text) return { ok: true, formatted: '{}' };

  try {
    const value: unknown = JSON.parse(text);
    return { ok: true, formatted: JSON.stringify(value, null, 2) };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'erro desconhecido';
    const positionMatch = /position\s+(\d+)/i.exec(message);
    const lineColMatch = /line\s+(\d+)\s+column\s+(\d+)/i.exec(message);
    const position = positionMatch ? Number(positionMatch[1]) : null;

    let line = lineColMatch ? Number(lineColMatch[1]) : null;
    let column = lineColMatch ? Number(lineColMatch[2]) : null;

    if (line === null && position !== null) {
      const before = text.slice(0, Math.min(position, text.length));
      line = before.split(/\r?\n/).length;
      column = position - before.lastIndexOf('\n');
    }

    return { ok: false, issue: { message, position, line, column } };
  }
}

export default function AdminCmsPagesHome() {
  const { t, formatNumber } = useLanguage();
  const { toast } = useToast();

  const [tab, setTab] = useState<'pages' | 'blocks'>('pages');

  const [pages, setPages] = useState<CmsPageRow[]>([]);
  const [pagesLoading, setPagesLoading] = useState(true);
  const [pagesError, setPagesError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageForm, setPageForm] = useState<PageForm>(EMPTY_PAGE_FORM);
  const [pageErrors, setPageErrors] = useState<Record<string, string>>({});

  const [pageName, setPageName] = useState(DEFAULT_PAGE_NAME);
  const [blocks, setBlocks] = useState<CmsBlockRow[]>([]);
  const [blocksLoading, setBlocksLoading] = useState(true);
  const [blocksError, setBlocksError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const debouncedSearch = useDebouncedValue(search);

  const loadPages = useCallback(async () => {
    setPagesLoading(true);
    setPagesError(null);
    const res = await getCmsPages();
    if (res.success) {
      setPages(Array.isArray(res.data) ? (res.data as CmsPageRow[]) : []);
    } else {
      setPages([]);
      setPagesError(res.error ?? t('admin.state.errorTitle'));
    }
    setPagesLoading(false);
  }, [t]);

  const loadBlocks = useCallback(async () => {
    setBlocksLoading(true);
    setBlocksError(null);
    const res = await getCmsBlocks(pageName);
    if (res.success) {
      setBlocks(Array.isArray(res.data) ? (res.data as CmsBlockRow[]) : []);
      setDrafts({});
    } else {
      setBlocks([]);
      setDrafts({});
      setBlocksError(res.error ?? t('admin.state.errorTitle'));
    }
    setBlocksLoading(false);
  }, [pageName, t]);

  useMountedLoad(loadPages);
  useMountedLoad(loadBlocks);

  const filteredPages = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    if (!query) return pages;
    return pages.filter((row) => row.title.toLowerCase().includes(query) || row.slug.toLowerCase().includes(query));
  }, [pages, debouncedSearch]);

  /** Ordem de leitura = `sortOrder`. Derivada (nunca mutada) para que o
   * estado otimista do reorder apareça na tela antes do round-trip. */
  const orderedBlocks = useMemo(
    () => [...blocks].sort((a, b) => a.sortOrder - b.sortOrder),
    [blocks],
  );

  const dirtyBlockIds = useMemo(
    () =>
      Object.entries(drafts)
        .filter(([id, value]) => orderedBlocks.some((block) => block.id === id && block.content !== value))
        .map(([id]) => id),
    [drafts, orderedBlocks],
  );

  const openModal = (row?: CmsPageRow) => {
    setPageErrors({});
    if (row) {
      setEditingId(row.id);
      setPageForm({
        title: row.title,
        slug: row.slug,
        content: row.content,
        seoTitle: row.seoTitle ?? '',
        seoDesc: row.seoDesc ?? '',
        status: row.status,
      });
    } else {
      setEditingId(null);
      setPageForm(EMPTY_PAGE_FORM);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setPageForm(EMPTY_PAGE_FORM);
    setPageErrors({});
  };

  const handlePageSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const errors: Record<string, string> = {};
    if (pageForm.title.trim().length < 3) errors.title = t('admin.cmsPages.pageTitle');
    if (!editingId && !pageForm.slug.trim() && !pageForm.title.trim()) {
      errors.slug = t('admin.cmsPages.slug');
    }

    setPageErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload: Record<string, unknown> = {
      title: pageForm.title.trim(),
      content: pageForm.content,
      seoTitle: pageForm.seoTitle,
      seoDesc: pageForm.seoDesc,
      status: pageForm.status,
    };
    // `updateCmsPage` nunca altera `slug`: só enviar na criação.
    if (!editingId) payload.slug = pageForm.slug.trim();

    setIsSubmitting(true);
    const res = editingId ? await updateCmsPage(editingId, payload) : await createCmsPage(payload);
    setIsSubmitting(false);

    if (res.success) {
      toast(editingId ? t('admin.cmsPages.updated') : t('admin.cmsPages.created'));
      closeModal();
      await loadPages();
    } else {
      toast(res.error ?? t('admin.state.errorTitle'), 'error');
    }
  };

  const handlePageDelete = async (row: CmsPageRow) => {
    if (!window.confirm(t('admin.cmsPages.deleteConfirm').replace('{title}', row.title))) return;
    setBusy(true);
    const res = await deleteCmsPage(row.id);
    setBusy(false);
    if (res.success) {
      toast(t('admin.cmsPages.deleted'));
      if (editingId === row.id) closeModal();
      await loadPages();
    } else {
      toast(res.error ?? t('admin.state.errorTitle'), 'error');
    }
  };

  const handleBlockSave = async (block: CmsBlockRow) => {
    const draft = drafts[block.id] ?? block.content;
    const parsed = parseJsonBlock(draft);
    if (!parsed.ok) {
      toast(t('admin.cmsPages.blockJsonInvalid').replace('{message}', parsed.issue.message), 'error');
      return;
    }

    setBusy(true);
    const res = await updateCmsBlock(block.id, { content: parsed.formatted });
    setBusy(false);

    if (res.success) {
      toast(t('admin.cmsPages.blockSaved'));
      await loadBlocks();
    } else {
      toast(res.error ?? t('admin.state.errorTitle'), 'error');
    }
  };

  const handleBlockToggle = async (block: CmsBlockRow) => {
    setBusy(true);
    const res = await updateCmsBlock(block.id, { isActive: !block.isActive });
    setBusy(false);
    if (res.success) {
      await loadBlocks();
    } else {
      toast(res.error ?? t('admin.state.errorTitle'), 'error');
    }
  };

  /**
   * Reordena os blocos com `reorderCmsBlocks` (uma transação só). Em caso de
   * falha o estado otimista volta ao que estava e a lista é recarregada.
   */
  const handleBlockReorder = async (block: CmsBlockRow, direction: 'up' | 'down') => {
    if (busy) return;
    const index = orderedBlocks.findIndex((entry) => entry.id === block.id);
    const target = direction === 'up' ? index - 1 : index + 1;
    if (index < 0 || target < 0 || target >= orderedBlocks.length) return;

    const reordered = [...orderedBlocks];
    const current = reordered[index];
    const neighbour = reordered[target];
    if (!current || !neighbour) return;
    reordered[index] = neighbour;
    reordered[target] = current;

    const payload = reordered
      .slice(0, MAX_REORDER_BLOCKS)
      .map((entry, position) => ({ id: entry.id, sortOrder: position }));
    const sortOrders = new Map(payload.map((entry) => [entry.id, entry.sortOrder]));

    const previous = blocks;
    setBlocks((current2) =>
      current2.map((entry) => {
        const next = sortOrders.get(entry.id);
        return next === undefined ? entry : { ...entry, sortOrder: next };
      }),
    );

    setBusy(true);
    const res = await reorderCmsBlocks(payload);
    setBusy(false);

    if (!res.success) {
      setBlocks(previous);
      toast(res.error ?? t('admin.cmsPages.blockReorderFailed'), 'error');
      await loadBlocks();
      return;
    }
    toast(t('admin.cmsPages.blockReordered'));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-full flex-col gap-6"
    >
      <AdminPageHeader
        icon={<Layers className="w-5 h-5" />}
        title={t('admin.cmsPages.title')}
        subtitle={t('admin.cmsPages.subtitle')}
        actions={
          <Button
            onClick={tab === 'pages' ? loadPages : loadBlocks}
            variant="outline"
            aria-label={t('admin.common.refresh')}
            className="h-9 border-[var(--admin-border)] px-3 text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50"
          >
            <RefreshCw
              className={`w-4 h-4 ${(tab === 'pages' ? pagesLoading : blocksLoading) ? 'animate-spin' : ''}`}
            />
          </Button>
        }
      />

      <p className="flex items-start gap-2 rounded-2xl border border-yellow-800/50 bg-yellow-900/20 p-4 text-[11px] leading-relaxed text-[var(--admin-text-muted)]">
        <TriangleAlert className="mt-0.5 w-4 h-4 shrink-0 text-yellow-400" />
        {t('admin.cmsPages.advancedNotice')}
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab('pages')}
          aria-pressed={tab === 'pages'}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition-all ${
            tab === 'pages'
              ? 'bg-[var(--admin-primary)] text-black'
              : 'border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-muted)]'
          }`}
        >
          <FileText className="w-4 h-4" /> {t('admin.cmsPages.tabPages')}
          <span className="rounded bg-black/20 px-1.5 text-[10px]">{formatNumber(pages.length)}</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('blocks')}
          aria-pressed={tab === 'blocks'}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition-all ${
            tab === 'blocks'
              ? 'bg-[var(--admin-primary)] text-black'
              : 'border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-muted)]'
          }`}
        >
          <Braces className="w-4 h-4" /> {t('admin.cmsPages.tabBlocks')}
          {dirtyBlockIds.length > 0 && (
            <span className="rounded bg-[var(--admin-accent-red)]/20 px-1.5 text-[10px]">
              {formatNumber(dirtyBlockIds.length)}
            </span>
          )}
        </button>
      </div>

      {/* ── Páginas ──────────────────────────────────────── */}
      {tab === 'pages' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('admin.cmsPages.search')}
              aria-label={t('admin.cmsPages.search')}
              className="h-9 max-w-md flex-1 bg-[var(--admin-card)] text-xs text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
            />
            <Button
              onClick={() => openModal()}
              className="h-9 bg-[var(--admin-primary)] px-4 font-semibold text-black hover:bg-[var(--admin-primary-hover)]"
            >
              <Plus className="w-4 h-4 mr-1" /> {t('admin.cmsPages.newPage')}
            </Button>
          </div>

          {pagesError ? (
            <AdminErrorState message={pagesError} onRetry={loadPages} />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--admin-border)] bg-black/5 text-[10px] uppercase tracking-wider text-[var(--admin-text-muted)]">
                    <th className="p-4 font-semibold">{t('admin.cmsPages.pageTitle')}</th>
                    <th className="hidden p-4 font-semibold md:table-cell">{t('admin.cmsPages.slug')}</th>
                    <th className="hidden p-4 font-semibold lg:table-cell">
                      {t('admin.cmsPages.seoTitle')}
                    </th>
                    <th className="p-4 font-semibold">{t('admin.cmsPages.status')}</th>
                    <th className="p-4 text-right font-semibold">{t('admin.team.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {pagesLoading && pages.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-0">
                        <AdminTableSkeleton rows={4} columns={3} />
                      </td>
                    </tr>
                  ) : filteredPages.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-0">
                        <AdminEmptyState
                          title={t('admin.cmsPages.empty')}
                          description={debouncedSearch ? t('admin.state.searchEmptyHint') : undefined}
                          icon={<FileText className="w-5 h-5" />}
                        />
                      </td>
                    </tr>
                  ) : (
                    filteredPages.map((row) => (
                      <tr
                        key={row.id}
                        className="group border-b border-[var(--admin-border)] transition-colors hover:bg-[var(--admin-border)]/20"
                      >
                        <td className="p-4">
                          <p className="max-w-[260px] truncate text-xs font-semibold text-[var(--admin-text-main)]">
                            {row.title}
                          </p>
                          <p className="max-w-[260px] truncate text-[10px] text-[var(--admin-text-muted)]">
                            {row.seoDesc || t('admin.cmsPages.content')}
                          </p>
                        </td>
                        <td className="hidden p-4 md:table-cell">
                          <code className="rounded bg-[var(--admin-border)]/30 px-2 py-1 text-[10px] text-[var(--admin-text-muted)]">
                            {row.slug}
                          </code>
                        </td>
                        <td className="hidden max-w-[220px] truncate p-4 text-[11px] text-[var(--admin-text-muted)] lg:table-cell">
                          {row.seoTitle ?? '—'}
                        </td>
                        <td className="p-4">
                          <span
                            className={`rounded-full border px-2 py-1 text-[10px] font-bold ${
                              row.status === 'published'
                                ? 'border-green-800 bg-green-900/30 text-green-400'
                                : 'border-yellow-800 bg-yellow-900/30 text-yellow-400'
                            }`}
                          >
                            {row.status === 'published'
                              ? t('admin.cmsPages.published')
                              : t('admin.cmsPages.draft')}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                            <button
                              type="button"
                              onClick={() => openModal(row)}
                              aria-label={t('admin.cmsPages.editPage')}
                              title={t('admin.cmsPages.editPage')}
                              className="rounded-md p-1.5 text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-border)] hover:text-[var(--admin-primary)]"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void handlePageDelete(row)}
                              aria-label={t('admin.cmsPages.deleteConfirm').replace('{title}', row.title)}
                              title={t('admin.cmsPages.deleteConfirm').replace('{title}', row.title)}
                              className="rounded-md p-1.5 text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-accent-red)]/10 hover:text-[var(--admin-accent-red)] disabled:opacity-50"
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
        </div>
      )}

      {/* ── Blocos ───────────────────────────────────────── */}
      {tab === 'blocks' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex flex-col gap-1.5 sm:max-w-xs sm:flex-1">
              <label
                htmlFor="cms-page-name"
                className="text-xs font-semibold text-[var(--admin-text-main)]"
              >
                {t('admin.cmsPages.pageName')}
              </label>
              <Input
                id="cms-page-name"
                value={pageName}
                onChange={(event) => setPageName(event.target.value)}
                aria-describedby="cms-page-name-hint"
                className="h-9 bg-[var(--admin-card)] text-xs text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
              />
              <span id="cms-page-name-hint" className="text-[10px] text-[var(--admin-text-muted)]">
                {t('admin.cmsPages.pageNameHint')}
              </span>
            </div>
            <Button
              onClick={() => void loadBlocks()}
              variant="outline"
              className="h-9 border-[var(--admin-border)] text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50"
            >
              <RefreshCw className={`w-4 h-4 ${blocksLoading ? 'animate-spin' : ''}`} />
              {t('admin.common.refresh')}
            </Button>
          </div>

          <p className="text-[10px] text-[var(--admin-text-muted)]">{t('admin.cmsPages.reorderHint')}</p>

          {blocksError ? (
            <AdminErrorState message={blocksError} onRetry={loadBlocks} />
          ) : blocksLoading && blocks.length === 0 ? (
            <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)]">
              <AdminTableSkeleton rows={3} columns={2} />
            </div>
          ) : blocks.length === 0 ? (
            <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)]">
              <AdminEmptyState
                title={t('admin.cmsPages.blockEmpty')}
                description={t('admin.cmsPages.blockEmptyHint')}
                icon={<Braces className="w-5 h-5" />}
              />
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {orderedBlocks.map((block, index) => {
                const draft = drafts[block.id] ?? block.content;
                const parsed = parseJsonBlock(draft);
                const dirty = block.content !== draft;
                return (
                  <li
                    key={block.id}
                    className="flex flex-col gap-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex flex-col">
                        <button
                          type="button"
                          disabled={busy || index === 0}
                          onClick={() => void handleBlockReorder(block, 'up')}
                          aria-label={t('admin.cat.moveUp')}
                          title={t('admin.cat.moveUp')}
                          className="rounded p-0.5 text-[var(--admin-text-muted)] transition-colors hover:text-[var(--admin-primary)] disabled:cursor-not-allowed disabled:opacity-25"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={busy || index === orderedBlocks.length - 1}
                          onClick={() => void handleBlockReorder(block, 'down')}
                          aria-label={t('admin.cat.moveDown')}
                          title={t('admin.cat.moveDown')}
                          className="rounded p-0.5 text-[var(--admin-text-muted)] transition-colors hover:text-[var(--admin-primary)] disabled:cursor-not-allowed disabled:opacity-25"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="rounded bg-[var(--admin-border)]/40 px-2 py-1 text-[10px] font-bold text-[var(--admin-text-main)]">
                        {block.sectionId}
                      </span>
                      <span className="rounded bg-[var(--admin-border)]/30 px-2 py-1 text-[10px] text-[var(--admin-text-muted)]">
                        {block.blockType}
                      </span>
                      <span className="text-[10px] text-[var(--admin-text-muted)]">
                        {t('admin.cmsPages.blocksCount').replace('{count}', String(blocks.length))}
                      </span>
                      {dirty && (
                        <span className="rounded bg-[var(--admin-accent-red)]/10 px-2 py-0.5 text-[9px] font-bold uppercase text-[var(--admin-accent-red)]">
                          •
                        </span>
                      )}

                      <div className="ml-auto flex items-center gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleBlockToggle(block)}
                          aria-pressed={block.isActive}
                          aria-label={t('admin.cat.activate')}
                          className={`rounded-full border px-2 py-1 text-[10px] font-bold transition-colors disabled:opacity-50 ${
                            block.isActive
                              ? 'border-green-800 bg-green-900/30 text-green-400'
                              : 'border-gray-700 bg-gray-900/30 text-gray-500'
                          }`}
                        >
                          {block.isActive ? t('admin.cmsPages.blockActive') : t('admin.users.inactive')}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor={`block-content-${block.id}`}
                        className="text-xs font-semibold text-[var(--admin-text-main)]"
                      >
                        {t('admin.cmsPages.blockContent')}
                      </label>
                      <textarea
                        id={`block-content-${block.id}`}
                        rows={6}
                        value={draft}
                        onChange={(event) =>
                          setDrafts((prev) => ({ ...prev, [block.id]: event.target.value }))
                        }
                        aria-invalid={!parsed.ok}
                        aria-describedby={`block-hint-${block.id}`}
                        spellCheck={false}
                        className="w-full resize-y rounded-md border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 font-mono text-[11px] text-[var(--admin-text-main)] focus-visible:border-[var(--admin-primary)] focus-visible:outline-none"
                      />
                      <span
                        id={`block-hint-${block.id}`}
                        className="text-[10px] text-[var(--admin-text-muted)]"
                      >
                        {t('admin.cmsPages.blockContentHint')}
                      </span>

                      {!parsed.ok && (
                        <div
                          role="alert"
                          className="flex flex-col gap-1 rounded-lg border border-[var(--admin-accent-red)]/40 bg-[var(--admin-accent-red)]/5 p-3 text-[10px] text-[var(--admin-accent-red)]"
                        >
                          <span className="font-bold">
                            {t('admin.cmsPages.blockJsonInvalid').replace(
                              '{message}',
                              parsed.issue.message,
                            )}
                          </span>
                          {parsed.issue.position !== null && (
                            <span>
                              {t('admin.cmsPages.blockJsonPosition').replace(
                                '{position}',
                                formatNumber(parsed.issue.position),
                              )}
                            </span>
                          )}
                          {parsed.issue.line !== null && parsed.issue.column !== null && (
                            <span>
                              {t('admin.cmsPages.blockJsonLine')
                                .replace('{line}', formatNumber(parsed.issue.line))
                                .replace('{column}', formatNumber(parsed.issue.column))}
                            </span>
                          )}
                        </div>
                      )}

                      {parsed.ok && draft.trim() !== parsed.formatted && (
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-bold uppercase text-[var(--admin-text-muted)]">
                            {t('admin.cmsPages.formattedJson')}
                          </span>
                          <pre className="max-h-40 overflow-auto rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] p-3 font-mono text-[10px] text-[var(--admin-text-main)]">
                            {parsed.formatted}
                          </pre>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {parsed.ok && (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={busy}
                          onClick={() =>
                            setDrafts((prev) => ({ ...prev, [block.id]: parsed.formatted }))
                          }
                          className="h-8 border-[var(--admin-border)] text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50"
                        >
                          {t('admin.cmsPages.formatJson')}
                        </Button>
                      )}
                      <Button
                        type="button"
                        disabled={busy || !parsed.ok || !dirty}
                        onClick={() => void handleBlockSave(block)}
                        className="h-8 bg-[var(--admin-primary)] px-4 font-semibold text-black hover:bg-[var(--admin-primary-hover)]"
                      >
                        <Save className="w-3.5 h-3.5 mr-1" /> {t('admin.cmsPages.saveBlock')}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {dirtyBlockIds.length > 0 && (
            <p className="self-end text-[10px] text-[var(--admin-text-muted)]">
              {t('admin.cmsPages.dirtyBlocks').replace('{count}', String(dirtyBlockIds.length))}
            </p>
          )}
        </div>
      )}

      {/* ── Criar / editar página ────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.button
              type="button"
              aria-label={t('admin.common.close')}
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
              role="dialog"
              aria-modal="true"
              aria-label={editingId ? t('admin.cmsPages.editPage') : t('admin.cmsPages.newPage')}
              className="fixed top-1/2 left-1/2 z-[101] flex max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-bg)] shadow-2xl"
            >
              <header className="flex items-center justify-between gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
                <h3 className="text-lg font-bold text-[var(--admin-text-main)]">
                  {editingId ? t('admin.cmsPages.editPage') : t('admin.cmsPages.newPage')}
                </h3>
                <button
                  type="button"
                  onClick={closeModal}
                  aria-label={t('admin.common.close')}
                  className="text-[var(--admin-text-muted)] transition-colors hover:text-[var(--admin-text-main)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-6">
                <form id="cmsPageForm" onSubmit={handlePageSubmit} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="cms-title"
                        className="text-xs font-semibold text-[var(--admin-text-main)]"
                      >
                        {t('admin.cmsPages.pageTitle')} *
                      </label>
                      <Input
                        id="cms-title"
                        required
                        value={pageForm.title}
                        onChange={(event) =>
                          setPageForm((prev) => ({ ...prev, title: event.target.value }))
                        }
                        aria-invalid={Boolean(pageErrors.title)}
                        className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                      />
                      {pageErrors.title && (
                        <span className="text-[10px] text-[var(--admin-accent-red)]">
                          {pageErrors.title}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="cms-slug"
                        className="text-xs font-semibold text-[var(--admin-text-main)]"
                      >
                        {t('admin.cmsPages.slug')}
                      </label>
                      <Input
                        id="cms-slug"
                        disabled={isSubmitting}
                        value={pageForm.slug}
                        onChange={(event) =>
                          setPageForm((prev) => ({ ...prev, slug: event.target.value }))
                        }
                        className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="cms-content"
                      className="text-xs font-semibold text-[var(--admin-text-main)]"
                    >
                      {t('admin.cmsPages.content')}
                    </label>
                    <textarea
                      id="cms-content"
                      rows={8}
                      value={pageForm.content}
                      onChange={(event) =>
                        setPageForm((prev) => ({ ...prev, content: event.target.value }))
                      }
                      aria-describedby="cms-content-hint"
                      className="flex w-full resize-y rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm text-[var(--admin-text-main)] focus-visible:border-[var(--admin-primary)] focus-visible:outline-none"
                    />
                    <span id="cms-content-hint" className="text-[10px] text-[var(--admin-text-muted)]">
                      {t('admin.cmsPages.contentHint')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="cms-seo-title"
                        className="text-xs font-semibold text-[var(--admin-text-main)]"
                      >
                        {t('admin.cmsPages.seoTitle')}
                      </label>
                      <Input
                        id="cms-seo-title"
                        value={pageForm.seoTitle}
                        onChange={(event) =>
                          setPageForm((prev) => ({ ...prev, seoTitle: event.target.value }))
                        }
                        className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="cms-status"
                        className="text-xs font-semibold text-[var(--admin-text-main)]"
                      >
                        {t('admin.cmsPages.status')}
                      </label>
                      <select
                        id="cms-status"
                        value={pageForm.status}
                        onChange={(event) =>
                          setPageForm((prev) => ({ ...prev, status: event.target.value }))
                        }
                        className="h-10 rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 text-sm text-[var(--admin-text-main)] focus-visible:border-[var(--admin-primary)] focus-visible:outline-none"
                      >
                        <option value="draft">{t('admin.cmsPages.draft')}</option>
                        <option value="published">{t('admin.cmsPages.published')}</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="cms-seo-desc"
                      className="text-xs font-semibold text-[var(--admin-text-main)]"
                    >
                      {t('admin.cmsPages.seoDesc')}
                    </label>
                    <textarea
                      id="cms-seo-desc"
                      rows={2}
                      value={pageForm.seoDesc}
                      onChange={(event) =>
                        setPageForm((prev) => ({ ...prev, seoDesc: event.target.value }))
                      }
                      className="flex w-full resize-y rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm text-[var(--admin-text-main)] focus-visible:border-[var(--admin-primary)] focus-visible:outline-none"
                    />
                  </div>
                </form>
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
                  form="cmsPageForm"
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[var(--admin-primary)] font-semibold text-black hover:bg-[var(--admin-primary-hover)]"
                >
                  {isSubmitting
                    ? t('admin.state.loading')
                    : editingId
                      ? t('admin.common.update')
                      : t('admin.common.create')}
                </Button>
              </footer>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}