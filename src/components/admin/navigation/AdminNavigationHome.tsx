'use client';

/**
 * Editor da navegação do site (`NavigationItem`).
 *
 * ## Por que esta tela existe
 *
 * A tabela `NavigationItem` existe no banco (32 linhas) e nenhuma tela a lia:
 * `Header.tsx` tem o menu principal hardcoded (`NAV_ITEMS`) e `Footer.tsx` tem
 * as colunas hardcoded. As actions `getNavigationItems`, `createNavigationItem`,
 * `updateNavigationItem`, `deleteNavigationItem` e `reorderNavigationItems`
 * estavam inalcançáveis. Esta tela as consome — o que ainda falta é o
 * Header/Footer passarem a ler a tabela (passo documentado no relatório, com
 * fallback para a lista atual).
 *
 * ## Decisões
 *
 * - **Agrupamento por `navigationType`**, na ordem `main → footer → legal →
 *   social` e depois qualquer outro grupo que exista no banco (o campo é texto
 *   livre, não um enum).
 * - **Reordenar por conjunto de irmãos.** Trocar duas linhas "na tela" só é
 *   seguro dentro do mesmo `(navigationType, parentId)`: se a busca estivesse
 *   ativa, os vizinhos visuais seriam os vizinhos gravados. Por isso o ↑↓ usa a
 *   lista COMPLETA de irmãos (a busca precisa estar vazia) e grava
 *   `sortOrder` reindexado de 0..n-1 com `reorderNavigationItems` (que roda tudo
 *   numa única transação).
 * - **Rollback real no reorder**: o estado otimista é revertido e a lista é
 *   recarregada do banco, com toast de erro — nunca "sucesso mentiroso".
 * - **URL validada no cliente com mensagem explicativa**: rota interna começa
 *   com `/`, link externo precisa de `http(s)://`, `//host` é rejeitado e
 *   qualquer outro esquema (`javascript:`, `data:`, `mailto:`) é bloqueado
 *   dizendo o motivo. O servidor (`safeUrl`) também bloqueia, mas a tela
 *   precisa explicar antes de o formulário ser enviado.
 * - **Rótulo por idioma + prévia**: `label`/`labelEn`/`labelEs` lado a lado, com
 *   aviso explícito quando falta tradução (o site cai no rótulo de pt), e um
 *   painel "como fica no site" que renderiza apenas itens ATIVOS, na ordem
 *   salva, com os rótulos do idioma do painel.
 */
import { useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowDown,
  ArrowUp,
  Edit3,
  Eye,
  Link2,
  ListTree,
  Plus,
  RefreshCw,
  Trash2,
  TriangleAlert,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  createNavigationItem,
  deleteNavigationItem,
  getNavigationItems,
  reorderNavigationItems,
  updateNavigationItem,
} from '@/actions/siteConfigActions';
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
import type { Locale } from '@/i18n/config';

interface NavRow {
  id: string;
  parentId: string | null;
  navigationType: string;
  label: string;
  labelEn: string | null;
  labelEs: string | null;
  url: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
}

type NavForm = {
  navigationType: string;
  label: string;
  labelEn: string;
  labelEs: string;
  url: string;
  icon: string;
  sortOrder: string;
  parentId: string;
  isActive: boolean;
};

const EMPTY_FORM: NavForm = {
  navigationType: 'main',
  label: '',
  labelEn: '',
  labelEs: '',
  url: '',
  icon: '',
  sortOrder: '',
  parentId: '',
  isActive: true,
};

/** Ordem de exibição dos grupos conhecidos; qualquer outro vai para o fim. */
const KNOWN_GROUPS: Array<{ type: string; labelKey: string }> = [
  { type: 'main', labelKey: 'admin.navEditor.groupMain' },
  { type: 'footer', labelKey: 'admin.navEditor.groupFooter' },
  { type: 'legal', labelKey: 'admin.navEditor.groupLegal' },
  { type: 'social', labelKey: 'admin.navEditor.groupSocial' },
];

/** Mesmo teto da action (`take: 300`) e do `$transaction` do reorder. */
const MAX_REORDER_ITEMS = 300;

interface UrlError {
  key: string;
  scheme?: string;
}

/**
 * Regras de URL do menu: rota interna (`/...`), link externo (`http(s)://`),
 * e RECUSA EXPLÍCITA de `//host`, `javascript:`, `data:` e `mailto:`.
 */
function validateUrl(raw: string): UrlError | null {
  const value = raw.trim();
  if (!value) return { key: 'admin.navEditor.urlRequired' };
  if (value.startsWith('//')) return { key: 'admin.navEditor.urlProtocolRelative' };

  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(value)?.[1]?.toLowerCase();
  if (scheme) {
    if (scheme === 'http' || scheme === 'https') return null;
    return { key: 'admin.navEditor.urlSchemeBlocked', scheme: `${scheme}:` };
  }

  return value.startsWith('/') ? null : { key: 'admin.navEditor.urlInvalid' };
}

function isInternalUrl(url: string): boolean {
  return url.startsWith('/') && !url.startsWith('//');
}

function groupLabelKey(type: string): string {
  return KNOWN_GROUPS.find((group) => group.type === type)?.labelKey ?? 'admin.navEditor.groupOther';
}

function groupRank(type: string): number {
  const index = KNOWN_GROUPS.findIndex((group) => group.type === type);
  return index === -1 ? KNOWN_GROUPS.length : index;
}

/** Irmãos: mesmo grupo e mesmo pai (ou ambos sem pai). */
function siblingKey(row: NavRow): string {
  return `${row.navigationType}::${row.parentId ?? ''}`;
}

export default function AdminNavigationHome() {
  const { t, locale } = useLanguage();
  const { toast } = useToast();

  const [items, setItems] = useState<NavRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<NavForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const debouncedSearch = useDebouncedValue(search);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getNavigationItems();
    if (res.success) {
      setItems(Array.isArray(res.data) ? (res.data as NavRow[]) : []);
    } else {
      setItems([]);
      setError(res.error ?? t('admin.state.errorTitle'));
    }
    setLoading(false);
  }, [t]);

  useMountedLoad(loadItems);

  /** Ordem canônica de exibição: `sortOrder` crescente, desempate pelo rótulo. */
  const sorted = useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));
    return copy;
  }, [items]);

  const filtered = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    if (!query) return sorted;
    return sorted.filter((row) =>
      [row.label, row.labelEn ?? '', row.labelEs ?? '', row.url, row.navigationType]
        .some((field) => field.toLowerCase().includes(query)),
    );
  }, [sorted, debouncedSearch]);

  const groups = useMemo(() => {
    const map = new Map<string, NavRow[]>();
    for (const row of filtered) {
      const bucket = map.get(row.navigationType);
      if (bucket) bucket.push(row);
      else map.set(row.navigationType, [row]);
    }
    return [...map.entries()].sort(
      ([typeA], [typeB]) => groupRank(typeA) - groupRank(typeB) || typeA.localeCompare(typeB),
    );
  }, [filtered]);

  /** Conjuntos de irmãos na lista INTEIRA (nunca na filtrada). */
  const siblings = useMemo(() => {
    const map = new Map<string, NavRow[]>();
    for (const row of sorted) {
      const key = siblingKey(row);
      const bucket = map.get(key);
      if (bucket) bucket.push(row);
      else map.set(key, [row]);
    }
    return map;
  }, [sorted]);

  /** Prévia: só o que o site mostra de fato — itens ativos, ordem salva. */
  const previewGroups = useMemo(() => {
    const types = [...new Set(sorted.map((row) => row.navigationType))].sort(
      (a, b) => groupRank(a) - groupRank(b) || a.localeCompare(b),
    );
    return types.map((type) => ({
      type,
      labelKey: groupLabelKey(type),
      rows: sorted.filter((row) => row.navigationType === type && row.isActive),
    }));
  }, [sorted]);

  const activeCount = useMemo(() => items.filter((row) => row.isActive).length, [items]);

  const labelFor = useCallback(
    (row: NavRow, target: Locale): string => {
      if (target === 'en') return row.labelEn ?? '';
      if (target === 'es') return row.labelEs ?? '';
      return row.label;
    },
    [],
  );

  const openModal = (row?: NavRow) => {
    setFormErrors({});
    if (row) {
      setEditingId(row.id);
      setFormData({
        navigationType: row.navigationType,
        label: row.label,
        labelEn: row.labelEn ?? '',
        labelEs: row.labelEs ?? '',
        url: row.url,
        icon: row.icon ?? '',
        sortOrder: String(row.sortOrder),
        parentId: row.parentId ?? '',
        isActive: row.isActive,
      });
    } else {
      setEditingId(null);
      setFormData(EMPTY_FORM);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
  };

  const urlErrorText = useCallback(
    (issue: UrlError): string =>
      issue.scheme ? t(issue.key).replace('{scheme}', issue.scheme) : t(issue.key),
    [t],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const errors: Record<string, string> = {};
    if (formData.label.trim().length < 2) errors.label = t('admin.navEditor.labelRequired');

    const urlIssue = validateUrl(formData.url);
    if (urlIssue) errors.url = urlErrorText(urlIssue);

    const sortOrderRaw = formData.sortOrder.trim();
    const sortOrder = sortOrderRaw ? Number(sortOrderRaw) : null;
    if (sortOrder !== null && (!Number.isFinite(sortOrder) || sortOrder < 0)) {
      errors.sortOrder = t('admin.navEditor.sortOrderInvalid');
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload: Record<string, unknown> = {
      navigationType: formData.navigationType.trim() || 'main',
      label: formData.label.trim(),
      labelEn: formData.labelEn,
      labelEs: formData.labelEs,
      url: formData.url.trim(),
      icon: formData.icon,
      isActive: formData.isActive,
      // `''` vira `null` na action (`strOrNull`): limpar o pai funciona.
      parentId: formData.parentId,
    };
    // Ordem vazia NÃO entra no payload: no create a action usa a contagem do
    // grupo (item novo vai ao fim) e no update o `sortOrder` salvo é mantido.
    if (sortOrder !== null) payload.sortOrder = Math.max(0, Math.min(9999, Math.round(sortOrder)));

    setIsSubmitting(true);
    const res = editingId
      ? await updateNavigationItem(editingId, payload)
      : await createNavigationItem(payload);
    setIsSubmitting(false);

    if (res.success) {
      toast(editingId ? t('admin.navEditor.updated') : t('admin.navEditor.created'));
      closeModal();
      await loadItems();
    } else {
      toast(res.error ?? t('admin.state.errorTitle'), 'error');
    }
  };

  const handleToggleActive = async (row: NavRow) => {
    setBusy(true);
    const res = await updateNavigationItem(row.id, { isActive: !row.isActive });
    setBusy(false);
    if (res.success) {
      toast(row.isActive ? t('admin.navEditor.inactive') : t('admin.navEditor.active'));
      await loadItems();
    } else {
      toast(res.error ?? t('admin.state.errorTitle'), 'error');
    }
  };

  const handleDelete = async (row: NavRow) => {
    const children = items.filter((entry) => entry.parentId === row.id).length;
    const message = children
      ? t('admin.navEditor.deleteConfirmOrphans')
          .replace('{label}', row.label)
          .replace('{count}', String(children))
      : t('admin.navEditor.deleteConfirm').replace('{label}', row.label);
    if (!window.confirm(message)) return;

    setBusy(true);
    const res = await deleteNavigationItem(row.id);
    setBusy(false);
    if (res.success) {
      toast(t('admin.navEditor.deleted'));
      if (editingId === row.id) closeModal();
      await loadItems();
    } else {
      toast(res.error ?? t('admin.state.errorTitle'), 'error');
    }
  };

  /**
   * Move um item entre os irmãos e grava a ordem reindexada.
   *
   * `reorderNavigationItems` grava tudo numa única transação, então um único
   * call é mais atômico (e mais barato) do que disparar N `updateNavigationItem`
   * em paralelo: qualquer falha deixa a ordem antiga inteira no banco.
   */
  const handleReorder = async (row: NavRow, direction: 'up' | 'down') => {
    if (busy || debouncedSearch.trim()) return;

    const list = siblings.get(siblingKey(row));
    if (!list) return;
    const index = list.findIndex((entry) => entry.id === row.id);
    const target = direction === 'up' ? index - 1 : index + 1;
    if (index < 0 || target < 0 || target >= list.length) return;

    const reordered = [...list];
    const current = reordered[index];
    const neighbour = reordered[target];
    if (!current || !neighbour) return;
    reordered[index] = neighbour;
    reordered[target] = current;

    const payload = reordered
      .slice(0, MAX_REORDER_ITEMS)
      .map((entry, position) => ({ id: entry.id, sortOrder: position }));
    const sortOrders = new Map(payload.map((entry) => [entry.id, entry.sortOrder]));

    const previous = items;
    setItems((current2) =>
      current2.map((entry) => {
        const next = sortOrders.get(entry.id);
        return next === undefined ? entry : { ...entry, sortOrder: next };
      }),
    );
    setBusy(true);
    const res = await reorderNavigationItems(payload);
    setBusy(false);

    if (!res.success) {
      setItems(previous);
      toast(res.error ?? t('admin.navEditor.reorderFailed'), 'error');
      await loadItems();
      return;
    }
    toast(t('admin.navEditor.reordered'));
  };

  const canReorder = !debouncedSearch.trim();
  const parentOptions = items.filter(
    (row) => row.navigationType === formData.navigationType && row.id !== editingId,
  );
  /** Rótulos que o SALVAR gravaria, para a prévia por idioma dentro do form. */
  const formPreviewRow = useMemo(() => formDataToRow(formData, editingId), [formData, editingId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-full flex-col gap-6"
    >
      <AdminPageHeader
        icon={<ListTree className="w-5 h-5" />}
        title={t('admin.navEditor.title')}
        subtitle={t('admin.navEditor.subtitle')}
        actions={
          <>
            <Button
              onClick={loadItems}
              variant="outline"
              aria-label={t('admin.common.refresh')}
              className="h-9 border-[var(--admin-border)] px-3 text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              onClick={() => openModal()}
              className="h-9 bg-[var(--admin-primary)] px-4 font-semibold text-black hover:bg-[var(--admin-primary-hover)]"
            >
              <Plus className="w-4 h-4 mr-1" /> {t('admin.navEditor.newItem')}
            </Button>
          </>
        }
      />

      <p className="flex items-start gap-2 rounded-2xl border border-yellow-800/50 bg-yellow-900/20 p-4 text-[11px] leading-relaxed text-[var(--admin-text-muted)]">
        <TriangleAlert className="mt-0.5 w-4 h-4 shrink-0 text-yellow-400" />
        {t('admin.navEditor.hardcodedNote')}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('admin.navEditor.search')}
          aria-label={t('admin.navEditor.search')}
          className="h-9 max-w-md flex-1 bg-[var(--admin-card)] text-xs text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
        />
        <span className="text-[10px] text-[var(--admin-text-muted)]">
          {t('admin.navEditor.itemsCount').replace('{count}', String(items.length))} ·{' '}
          {t('admin.navEditor.activeItems').replace('{count}', String(activeCount))}
        </span>
      </div>

      {!canReorder && (
        <p className="text-[10px] text-[var(--admin-text-muted)]">{t('admin.navEditor.reorderHint')}</p>
      )}

      {error ? (
        <AdminErrorState message={error} onRetry={loadItems} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--admin-border)] bg-black/5 text-[10px] uppercase tracking-wider text-[var(--admin-text-muted)]">
                <th className="p-4 font-semibold">{t('admin.navEditor.label')}</th>
                <th className="hidden p-4 font-semibold md:table-cell">{t('admin.navEditor.group')}</th>
                <th className="hidden p-4 font-semibold lg:table-cell">{t('admin.navEditor.url')}</th>
                <th className="hidden p-4 font-semibold sm:table-cell">{t('admin.navEditor.sortOrder')}</th>
                <th className="p-4 font-semibold">{t('admin.navEditor.active')}</th>
                <th className="p-4 text-right font-semibold">{t('admin.team.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <AdminTableSkeleton rows={6} columns={4} />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <AdminEmptyState
                      title={t('admin.navEditor.empty')}
                      description={debouncedSearch ? t('admin.state.searchEmptyHint') : undefined}
                      icon={<ListTree className="w-5 h-5" />}
                    />
                  </td>
                </tr>
              ) : (
                groups.flatMap(([type, rows]) =>
                  rows.map((row) => {
                    const list = siblings.get(siblingKey(row)) ?? [];
                    const position = list.findIndex((entry) => entry.id === row.id);
                    const children = items.filter((entry) => entry.parentId === row.id).length;
                    return (
                      <tr
                        key={row.id}
                        className="group border-b border-[var(--admin-border)] transition-colors hover:bg-[var(--admin-border)]/20"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col">
                              <button
                                type="button"
                                disabled={busy || !canReorder || position <= 0}
                                onClick={() => void handleReorder(row, 'up')}
                                aria-label={t('admin.navEditor.moveUp')}
                                title={t('admin.navEditor.moveUp')}
                                className="rounded p-0.5 text-[var(--admin-text-muted)] transition-colors hover:text-[var(--admin-primary)] disabled:cursor-not-allowed disabled:opacity-25"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={busy || !canReorder || position < 0 || position >= list.length - 1}
                                onClick={() => void handleReorder(row, 'down')}
                                aria-label={t('admin.navEditor.moveDown')}
                                title={t('admin.navEditor.moveDown')}
                                className="rounded p-0.5 text-[var(--admin-text-muted)] transition-colors hover:text-[var(--admin-primary)] disabled:cursor-not-allowed disabled:opacity-25"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="min-w-0">
                              <p className="max-w-[220px] truncate text-xs font-semibold text-[var(--admin-text-main)]">
                                {row.label}
                              </p>
                              <p className="max-w-[220px] truncate text-[10px] text-[var(--admin-text-muted)]">
                                {labelFor(row, locale) || t('admin.navEditor.previewFallback')}
                                {row.icon ? ` • ${row.icon}` : ''}
                                {children > 0
                                  ? ` • ${t('admin.navEditor.childrenCount').replace('{count}', String(children))}`
                                  : ''}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="hidden p-4 md:table-cell">
                          <span className="rounded-full border border-[var(--admin-border)] bg-[var(--admin-border)]/30 px-2 py-1 text-[10px] font-bold text-[var(--admin-text-main)]">
                            {t(groupLabelKey(type))}
                          </span>
                        </td>
                        <td className="hidden p-4 lg:table-cell">
                          <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--admin-text-muted)]">
                            <Link2 className="w-3 h-3 shrink-0" />
                            <span className="max-w-[200px] truncate">{row.url}</span>
                            <span className="text-[9px] uppercase">
                              {t(
                                isInternalUrl(row.url)
                                  ? 'admin.navEditor.previewInternal'
                                  : 'admin.navEditor.previewExternal',
                              )}
                            </span>
                          </span>
                        </td>
                        <td className="hidden p-4 text-[11px] text-[var(--admin-text-muted)] sm:table-cell">
                          {row.sortOrder}
                        </td>
                        <td className="p-4">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void handleToggleActive(row)}
                            aria-pressed={row.isActive}
                            aria-label={t('admin.navEditor.toggleActive')}
                            className={`rounded-full border px-2 py-1 text-[10px] font-bold transition-colors disabled:opacity-50 ${
                              row.isActive
                                ? 'border-green-800 bg-green-900/30 text-green-400'
                                : 'border-gray-700 bg-gray-900/30 text-gray-500'
                            }`}
                          >
                            {row.isActive ? t('admin.navEditor.active') : t('admin.navEditor.inactive')}
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                            <button
                              type="button"
                              onClick={() => openModal(row)}
                              aria-label={t('admin.navEditor.editItem')}
                              title={t('admin.navEditor.editItem')}
                              className="rounded-md p-1.5 text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-border)] hover:text-[var(--admin-primary)]"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDelete(row)}
                              aria-label={t('admin.navEditor.deleteConfirm').replace('{label}', row.label)}
                              title={t('admin.navEditor.deleteConfirm').replace('{label}', row.label)}
                              className="rounded-md p-1.5 text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-accent-red)]/10 hover:text-[var(--admin-accent-red)]"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }),
                )
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Prévia "como fica no site" ───────────────────── */}
      <section className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-4 md:p-6">
        <header className="mb-4 flex items-start gap-2">
          <Eye className="mt-0.5 w-4 h-4 shrink-0 text-[var(--admin-primary)]" />
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[var(--admin-text-main)]">
              {t('admin.navEditor.preview')}
            </h3>
            <p className="text-[10px] text-[var(--admin-text-muted)]">
              {t('admin.navEditor.previewHint')}
            </p>
          </div>
        </header>

        <div className="flex flex-col gap-5">
          {previewGroups.map((group) => (
            <div key={group.type} className="flex flex-col gap-2">
              <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">
                {t(group.labelKey)}
                {group.type !== 'main' && group.type !== 'footer' ? ` (${group.type})` : ''}
              </span>
              {group.rows.length === 0 ? (
                <p className="text-[11px] text-[var(--admin-text-muted)]">
                  {t('admin.navEditor.previewEmpty')}
                </p>
              ) : (
                <ul className="flex flex-wrap items-center gap-2">
                  {group.rows.map((row) => {
                    const translated = labelFor(row, locale);
                    const parent = row.parentId ? sorted.find((entry) => entry.id === row.parentId) : null;
                    return (
                      <li
                        key={row.id}
                        className="flex items-center gap-1.5 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-2.5 py-1.5 text-[11px] text-[var(--admin-text-main)]"
                      >
                        <span className="truncate" style={parent ? { paddingLeft: '0.75rem' } : undefined}>
                          {translated || row.label}
                        </span>
                        {parent && (
                          <span className="text-[9px] text-[var(--admin-text-muted)]">
                            {t('admin.navEditor.previewChildren').replace('{label}', parent.label)}
                          </span>
                        )}
                        <span className="text-[9px] text-[var(--admin-text-muted)]">
                          {t(
                            isInternalUrl(row.url)
                              ? 'admin.navEditor.previewInternal'
                              : 'admin.navEditor.previewExternal',
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Criar / editar item ──────────────────────────── */}
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
              aria-label={editingId ? t('admin.navEditor.editItem') : t('admin.navEditor.newItem')}
              className="fixed top-1/2 left-1/2 z-[101] flex max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-bg)] shadow-2xl"
            >
              <header className="flex items-center justify-between gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
                <h3 className="text-lg font-bold text-[var(--admin-text-main)]">
                  {editingId ? t('admin.navEditor.editItem') : t('admin.navEditor.newItem')}
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
                <form id="navItemForm" onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="nav-group"
                        className="text-xs font-semibold text-[var(--admin-text-main)]"
                      >
                        {t('admin.navEditor.group')}
                      </label>
                      <Input
                        id="nav-group"
                        list="nav-group-options"
                        value={formData.navigationType}
                        onChange={(event) =>
                          setFormData((prev) => ({ ...prev, navigationType: event.target.value, parentId: '' }))
                        }
                        className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                      />
                      <datalist id="nav-group-options">
                        {KNOWN_GROUPS.map((group) => (
                          <option key={group.type} value={group.type} />
                        ))}
                      </datalist>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="nav-parent"
                        className="text-xs font-semibold text-[var(--admin-text-main)]"
                      >
                        {t('admin.navEditor.parent')}
                      </label>
                      <select
                        id="nav-parent"
                        value={formData.parentId}
                        onChange={(event) =>
                          setFormData((prev) => ({ ...prev, parentId: event.target.value }))
                        }
                        className="h-10 rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 text-sm text-[var(--admin-text-main)] focus-visible:border-[var(--admin-primary)] focus:outline-none"
                      >
                        <option value="">{t('admin.navEditor.parentNone')}</option>
                        {parentOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Rótulo + tradução, com o fallback explícito. */}
                  <fieldset className="flex flex-col gap-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-4">
                    <legend className="px-1 text-[10px] font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">
                      {t('admin.navEditor.labelsPreview')}
                    </legend>
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="nav-label"
                        className="text-xs font-semibold text-[var(--admin-text-main)]"
                      >
                        {t('admin.navEditor.label')} *
                      </label>
                      <Input
                        id="nav-label"
                        required
                        value={formData.label}
                        onChange={(event) =>
                          setFormData((prev) => ({ ...prev, label: event.target.value }))
                        }
                        aria-invalid={Boolean(formErrors.label)}
                        className="bg-[var(--admin-bg)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                      />
                      {formErrors.label && (
                        <span className="text-[10px] text-[var(--admin-accent-red)]">
                          {formErrors.label}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="nav-label-en"
                          className="text-xs font-semibold text-[var(--admin-text-main)]"
                        >
                          {t('admin.navEditor.labelEn')}
                        </label>
                        <Input
                          id="nav-label-en"
                          value={formData.labelEn}
                          onChange={(event) =>
                            setFormData((prev) => ({ ...prev, labelEn: event.target.value }))
                          }
                          className="bg-[var(--admin-bg)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="nav-label-es"
                          className="text-xs font-semibold text-[var(--admin-text-main)]"
                        >
                          {t('admin.navEditor.labelEs')}
                        </label>
                        <Input
                          id="nav-label-es"
                          value={formData.labelEs}
                          onChange={(event) =>
                            setFormData((prev) => ({ ...prev, labelEs: event.target.value }))
                          }
                          className="bg-[var(--admin-bg)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      {(['pt', 'en', 'es'] as const).map((target) => {
                        const value = labelFor(formPreviewRow, target);
                        const missing = target !== 'pt' && !value;
                        return (
                          <div
                            key={target}
                            className="flex flex-col gap-1 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] p-2.5"
                          >
                            <span className="text-[9px] font-bold uppercase text-[var(--admin-text-muted)]">
                              {target}
                            </span>
                            <span className="truncate text-[11px] text-[var(--admin-text-main)]">
                              {value || formData.label || '—'}
                            </span>
                            {missing && (
                              <span className="text-[9px] leading-snug text-yellow-400">
                                {t('admin.navEditor.previewFallback')}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </fieldset>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="nav-url" className="text-xs font-semibold text-[var(--admin-text-main)]">
                      {t('admin.navEditor.url')} *
                    </label>
                    <Input
                      id="nav-url"
                      required
                      value={formData.url}
                      onChange={(event) => setFormData((prev) => ({ ...prev, url: event.target.value }))}
                      aria-invalid={Boolean(formErrors.url)}
                      aria-describedby="nav-url-hint"
                      placeholder="/destinos"
                      className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                    />
                    <span id="nav-url-hint" className="text-[10px] text-[var(--admin-text-muted)]">
                      {t('admin.navEditor.urlHint')}
                    </span>
                    {formErrors.url && (
                      <span className="text-[10px] text-[var(--admin-accent-red)]">{formErrors.url}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="nav-icon"
                        className="text-xs font-semibold text-[var(--admin-text-main)]"
                      >
                        {t('admin.navEditor.icon')}
                      </label>
                      <Input
                        id="nav-icon"
                        value={formData.icon}
                        onChange={(event) =>
                          setFormData((prev) => ({ ...prev, icon: event.target.value }))
                        }
                        className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                      />
                      <span className="text-[10px] text-[var(--admin-text-muted)]">
                        {t('admin.navEditor.iconHint')}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="nav-sort"
                        className="text-xs font-semibold text-[var(--admin-text-main)]"
                      >
                        {t('admin.navEditor.sortOrder')}
                      </label>
                      <Input
                        id="nav-sort"
                        inputMode="numeric"
                        value={formData.sortOrder}
                        onChange={(event) =>
                          setFormData((prev) => ({ ...prev, sortOrder: event.target.value }))
                        }
                        aria-invalid={Boolean(formErrors.sortOrder)}
                        className="bg-[var(--admin-card)] text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
                      />
                      {formErrors.sortOrder && (
                        <span className="text-[10px] text-[var(--admin-accent-red)]">
                          {formErrors.sortOrder}
                        </span>
                      )}
                    </div>

                    <label className="flex items-end gap-2 pb-2 text-xs text-[var(--admin-text-main)]">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(event) =>
                          setFormData((prev) => ({ ...prev, isActive: event.target.checked }))
                        }
                        className="h-4 w-4 accent-[var(--admin-primary)]"
                      />
                      {t('admin.navEditor.active')}
                    </label>
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
                  form="navItemForm"
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

/** Projeta o formulário em uma linha para a prévia de rótulos por idioma. */
function formDataToRow(form: NavForm, id: string | null): NavRow {
  return {
    id: id ?? 'preview',
    parentId: null,
    navigationType: form.navigationType,
    label: form.label,
    labelEn: form.labelEn || null,
    labelEs: form.labelEs || null,
    url: form.url,
    icon: null,
    sortOrder: Number(form.sortOrder) || 0,
    isActive: form.isActive,
  };
}