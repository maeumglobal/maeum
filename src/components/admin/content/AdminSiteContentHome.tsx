'use client';

/**
 * Conteúdo do Site — textos (pt/en/es) e mídias dos slots.
 *
 * ## Correções
 *
 * - `ensureMediaBucket()` foi REMOVIDO de `cmsActions` (criava bucket/policies
 *   via `$executeRawUnsafe` sem autenticação). O upload agora é `POST /api/media`
 *   e o status do bucket (`bucketOk`) sumiu junto.
 * - Os slots ficam agrupados por `page` (via `getMediaSlotsByPage()`), com
 *   **dirty state**: quantos slots mudaram desde o último "Salvar", para não
 *   perder trabalho achando que salvou.
 * - Preview das imagens com `<SmartImage>` (a URL de um slot pode vir de
 *   qualquer host — `<img>` cru ou next/image com allowlist, sem risco de 500).
 * - Busca no catálogo agrupa as chaves e mostra o valor em pt/en/es lado a
 *   lado, para o editor saber exatamente o que está editando.
 * - Erro de leitura no load deixa de virar "vazio" silencioso.
 */
import { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FolderOpen,
  Image as ImageIcon,
  Languages,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  TriangleAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getCmsMedia, getCmsSlots, getCmsText, saveCmsMedia, saveCmsText, updateCmsMediaSlot } from '@/actions/cmsActions';
import { getMediaSlotsByPage, MEDIA_SLOTS, type MediaSlot } from '@/lib/mediaSlots';
import { TEXT_GROUPS, type TextGroup } from '@/lib/textCatalog';
import AdminImageUpload from '@/components/admin/content/AdminImageUpload';
import SmartImage from '@/components/SmartImage';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteContent, CMS_CHANGE_EVENT } from '@/contexts/SiteContentContext';
import type { Locale } from '@/i18n/config';
import type { TextOverrides, MediaOverrides } from '@/lib/cmsData';
import { AdminErrorState } from '@/components/admin/ui/States';
import { useMountedLoad } from '@/components/admin/ui/useMountedLoad';

const LOCALES: Locale[] = ['pt', 'en', 'es'];

/** Nome do idioma por locale — chaves explícitas (template com uppercase não casa). */
const LOCALE_LABEL_KEY: Record<Locale, string> = {
  pt: 'admin.cms.languagePt',
  en: 'admin.cms.languageEn',
  es: 'admin.cms.languageEs',
};

type GroupedTextGroup = TextGroup & { matchingKeys: string[] };

export default function AdminSiteContentHome() {
  const { t, formatNumber } = useLanguage();
  const { toast } = useToast();
  const { refresh } = useSiteContent();

  const [tab, setTab] = useState<'text' | 'media'>('text');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('');

  // ── Texto ──────────────────────────────────────────────────
  const [text, setText] = useState<TextOverrides>({ pt: {}, en: {}, es: {} });
  const [textEdits, setTextEdits] = useState<Record<string, Record<string, Record<Locale, string>>>>({});

  // ── Mídia ──────────────────────────────────────────────────
  const [media, setMedia] = useState<MediaOverrides>({});
  /** Snapshot do que está no banco, para calcular o dirty state. */
  const [savedMedia, setSavedMedia] = useState<MediaOverrides>({});
  /** Slots vindos de `getCmsSlots`; cai no catálogo local se a action falhar. */
  const [mediaSlots, setMediaSlots] = useState<MediaSlot[]>(MEDIA_SLOTS);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [tRes, mRes, sRes] = await Promise.all([getCmsText(), getCmsMedia(), getCmsSlots()]);

    if (!tRes.success) {
      setError(tRes.error ?? t('state.errorTitle'));
      setLoading(false);
      return;
    }

    if (tRes.data) setText(tRes.data);

    if (mRes.success && mRes.data) {
      setMedia(mRes.data);
      setSavedMedia(mRes.data);
    } else {
      setError(mRes.error ?? t('state.errorTitle'));
    }

    if (!sRes.success) {
      // `MEDIA_SLOTS` é uma constante local: seguimos com ela para não travar
      // a tela por causa de uma action de leitura.
      setMediaSlots(MEDIA_SLOTS);
    } else {
      setMediaSlots(Array.isArray(sRes.data) ? (sRes.data as MediaSlot[]) : MEDIA_SLOTS);
    }

    setLoading(false);
  }, [t]);

  useMountedLoad(load);

  const mediaByPage = useMemo(() => {
    const grouped = getMediaSlotsByPage();
    return Object.entries(grouped).map(([page, slots]) => ({
      page,
      slots: mediaSlots.filter((slot) => slot.key && slots.some((item) => item.key === slot.key)),
    }));
  }, [mediaSlots]);

  const staticValue = useCallback(
    (group: TextGroup, key: string, locale: Locale): string =>
      group.dict[locale]?.[key] ?? group.dict.pt[key] ?? '',
    [],
  );

  const currentValue = useCallback(
    (group: TextGroup, key: string, locale: Locale): string => {
      const override = text[locale]?.[key];
      return typeof override === 'string' && override.length > 0 ? override : staticValue(group, key, locale);
    },
    [text, staticValue],
  );

  const handleTextChange = (groupId: string, key: string, locale: Locale, value: string) => {
    setTextEdits((prev) => {
      const next = { ...prev };
      next[groupId] = { ...(next[groupId] || {}) };
      next[groupId][key] = { ...(next[groupId][key] || { pt: '', en: '', es: '' }), [locale]: value };
      return next;
    });
  };

  const dirtyTextCount = useMemo(
    () =>
      Object.values(textEdits).reduce((acc, group) => acc + Object.keys(group).length, 0),
    [textEdits],
  );

  const dirtyMediaKeys = useMemo(() => {
    const keys: string[] = [];
    for (const slot of mediaSlots) {
      const next = media[slot.key] ?? '';
      const previous = savedMedia[slot.key] ?? '';
      if (next !== previous) keys.push(slot.key);
    }
    return keys;
  }, [mediaSlots, media, savedMedia]);

  const hasDirtyText = dirtyTextCount > 0;
  const hasDirtyMedia = dirtyMediaKeys.length > 0;

  const handleSaveText = async () => {
    setSaving(true);
    const next: TextOverrides = {
      pt: { ...text.pt },
      en: { ...text.en },
      es: { ...text.es },
    };

    for (const group of TEXT_GROUPS) {
      const groupEdits = textEdits[group.id];
      if (!groupEdits) continue;
      for (const [key, values] of Object.entries(groupEdits)) {
        for (const locale of LOCALES) {
          const base = staticValue(group, key, locale);
          const edited = values[locale];
          // Voltou ao valor estático → limpa o override (senão o CMS guardaria
          // uma cópia que ninguém mais consegue remover pela UI).
          if (edited === undefined || edited === base) delete next[locale][key];
          else next[locale][key] = edited;
        }
      }
    }

    const res = await saveCmsText(next);
    setSaving(false);

    if (res.success) {
      setText(next);
      setTextEdits({});
      await refresh();
      window.dispatchEvent(new CustomEvent(CMS_CHANGE_EVENT));
      toast(t('admin.cms.textsSaved'));
    } else {
      toast(res.error ?? t('state.errorTitle'), 'error');
    }
  };

  const handleSaveMedia = async () => {
    setSaving(true);
    const res = await saveCmsMedia(media);
    setSaving(false);

    if (res.success) {
      setSavedMedia({ ...media });
      await refresh();
      window.dispatchEvent(new CustomEvent(CMS_CHANGE_EVENT));
      toast(t('admin.cms.mediaSaved'));
    } else {
      toast(res.error ?? t('state.errorTitle'), 'error');
    }
  };

  /** Salva UM slot — útil quando o time edita em paralelo. */
  const handleSaveOneSlot = async (slot: MediaSlot) => {
    setSaving(true);
    const url = media[slot.key] ?? '';
    const res = await updateCmsMediaSlot(slot.key, url);
    setSaving(false);

    if (res.success) {
      setSavedMedia((prev) => {
        const next = { ...prev };
        if (url) next[slot.key] = url;
        else delete next[slot.key];
        return next;
      });
      await refresh();
      window.dispatchEvent(new CustomEvent(CMS_CHANGE_EVENT));
      toast(t('admin.cms.mediaSaved'));
    } else {
      toast(res.error ?? t('state.errorTitle'), 'error');
    }
  };

  const discardText = () => {
    setTextEdits({});
    toast(t('admin.cms.discard'));
  };

  const discardMedia = () => {
    setMedia({ ...savedMedia });
    toast(t('admin.cms.discard'));
  };

  /** Grupos com as chaves que casam a busca (pt OU en OU es). */
  const filteredGroups = useMemo<GroupedTextGroup[]>(() => {
    const query = search.trim().toLowerCase();
    return TEXT_GROUPS.filter((group) => !groupFilter || group.id === groupFilter).map((group) => {
      if (!query) return { ...group, matchingKeys: Object.keys(group.dict.pt) };
      const matchingKeys = Object.keys(group.dict.pt).filter(
        (key) =>
          key.toLowerCase().includes(query) ||
          (group.dict.en?.[key] ?? '').toLowerCase().includes(query) ||
          (group.dict.es?.[key] ?? '').toLowerCase().includes(query),
      );
      return { ...group, matchingKeys };
    }).filter((group) => group.matchingKeys.length > 0);
  }, [search, groupFilter]);

  const dirtySet = useMemo(() => new Set(dirtyMediaKeys), [dirtyMediaKeys]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[var(--admin-text-muted)]">
        <RefreshCw className="w-6 h-6 mr-2 animate-spin" />
        {t('admin.state.loading')}
      </div>
    );
  }

  if (error && mediaSlots.length === 0) {
    return <AdminErrorState message={error} onRetry={load} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-full flex-col gap-6"
    >
      <header className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-4 md:p-6">
        <h2 className="text-xl font-bold text-[var(--admin-text-main)]">{t('admin.cms.title')}</h2>
        <p className="text-xs text-[var(--admin-text-muted)]">{t('admin.cms.subtitle')}</p>
        {error && (
          <p className="mt-3 flex items-center gap-2 text-[11px] text-[var(--admin-accent-red)]">
            <TriangleAlert className="w-3.5 h-3.5" />
            {error}
          </p>
        )}
      </header>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab('text')}
          aria-pressed={tab === 'text'}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition-all ${
            tab === 'text'
              ? 'bg-[var(--admin-primary)] text-black'
              : 'border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-muted)]'
          }`}
        >
          <Languages className="w-4 h-4" /> {t('admin.cms.tabText')}
          {hasDirtyText && (
            <span className="rounded bg-black/20 px-1.5 text-[10px]">
              {formatNumber(dirtyTextCount)}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab('media')}
          aria-pressed={tab === 'media'}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition-all ${
            tab === 'media'
              ? 'bg-[var(--admin-primary)] text-black'
              : 'border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-muted)]'
          }`}
        >
          <ImageIcon className="w-4 h-4" /> {t('admin.cms.tabMedia')}
          {hasDirtyMedia && (
            <span className="rounded bg-black/20 px-1.5 text-[10px]">
              {formatNumber(dirtyMediaKeys.length)}
            </span>
          )}
        </button>
      </div>

      {/* ── Textos ─────────────────────────────────────── */}
      {tab === 'text' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 w-4 h-4 -translate-y-1/2 text-[var(--admin-text-muted)]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('admin.cms.searchPlaceholder')}
                aria-label={t('admin.cms.searchPlaceholder')}
                className="h-10 bg-[var(--admin-bg)] pl-10 text-sm text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
              />
            </div>
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              aria-label={t('admin.cms.textCount').replace('{count}', '')}
              className="h-10 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 text-xs text-[var(--admin-text-muted)] focus:border-[var(--admin-primary)] focus:outline-none"
            >
              <option value="">{t('admin.book.filterAll')}</option>
              {TEXT_GROUPS.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.label}
                </option>
              ))}
            </select>
          </div>

          {filteredGroups.length === 0 ? (
            <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-10 text-center text-xs text-[var(--admin-text-muted)]">
              {t('state.searchEmpty')}
            </div>
          ) : (
            filteredGroups.map((group) => (
              <section
                key={group.id}
                className="overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)]"
              >
                <header className="flex items-center gap-2 border-b border-[var(--admin-border)] bg-[var(--admin-bg)]/60 px-4 py-3">
                  <FolderOpen className="w-4 h-4 text-[var(--admin-primary)]" />
                  <h3 className="text-sm font-bold text-[var(--admin-text-main)]">{group.label}</h3>
                  <span className="ml-auto text-[10px] text-[var(--admin-text-muted)]">
                    {t('admin.cms.textCount').replace('{count}', formatNumber(group.matchingKeys.length))}
                  </span>
                </header>

                <ul className="divide-y divide-[var(--admin-border)]">
                  {group.matchingKeys.map((key) => {
                    const editedInSomeLocale = Boolean(text.pt[key] || text.en[key] || text.es[key]);
                    const dirtyHere = Boolean(textEdits[group.id]?.[key]);
                    return (
                      <li key={key} className="flex flex-col gap-3 px-4 py-3">
                        <div className="flex items-start gap-2">
                          <span className="flex-1 text-[11px] leading-snug text-[var(--admin-text-muted)]">
                            {key}
                          </span>
                          {editedInSomeLocale && (
                            <span className="shrink-0 rounded bg-[var(--admin-primary)]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[var(--admin-primary)]">
                              {t('admin.cms.editedBadge')}
                            </span>
                          )}
                          {dirtyHere && (
                            <span className="shrink-0 rounded bg-[var(--admin-accent-red)]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[var(--admin-accent-red)]">
                              •
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                          {LOCALES.map((locale) => {
                            const edited = textEdits[group.id]?.[key]?.[locale];
                            const value = edited !== undefined ? edited : currentValue(group, key, locale);
                            return (
                              <label key={locale} className="flex flex-col gap-1">
<span className="text-[9px] font-bold uppercase text-[var(--admin-text-muted)]">
                                  {t(LOCALE_LABEL_KEY[locale])}
                                </span>
                                <textarea
                                  rows={1}
                                  value={value}
                                  onChange={(e) => handleTextChange(group.id, key, locale, e.target.value)}
                                  className="min-h-[32px] w-full resize-y rounded-md border border-[var(--admin-border)] bg-[var(--admin-bg)] px-2.5 py-2 text-xs text-[var(--admin-text-main)] focus:border-[var(--admin-primary)] focus:outline-none"
                                />
                              </label>
                            );
                          })}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}

          <div className="sticky bottom-4 flex items-center gap-3 self-end">
            {hasDirtyText && (
              <span className="text-[10px] text-[var(--admin-text-muted)]">
                {t('admin.cms.dirtySlots').replace('{count}', formatNumber(dirtyTextCount))}
              </span>
            )}
            <Button
              onClick={discardText}
              disabled={!hasDirtyText || saving}
              className="h-10 border-[var(--admin-border)] bg-transparent px-4 text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {t('admin.cms.discard')}
            </Button>
            <Button
              onClick={handleSaveText}
              disabled={saving || !hasDirtyText}
              className="h-10 rounded-xl bg-[var(--admin-primary)] px-6 font-bold text-black hover:bg-[var(--admin-primary-hover)]"
            >
              {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {t('admin.cms.saveTexts')}
            </Button>
          </div>
        </div>
      )}

      {/* ── Mídia ──────────────────────────────────────── */}
      {tab === 'media' && (
        <div className="flex flex-col gap-4">
          <p className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-4 text-[11px] text-[var(--admin-text-muted)]">
            {t('admin.cms.mediaHint')}
          </p>

          {mediaByPage.map(({ page, slots }) => (
            <section
              key={page}
              className="overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)]"
            >
              <header className="flex items-center gap-2 border-b border-[var(--admin-border)] bg-[var(--admin-bg)]/60 px-4 py-3">
                <ImageIcon className="w-4 h-4 text-[var(--admin-primary)]" />
                <h3 className="text-sm font-bold text-[var(--admin-text-main)]">{page}</h3>
                <span className="ml-auto text-[10px] text-[var(--admin-text-muted)]">
                  {formatNumber(slots.length)}
                </span>
              </header>

              <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
                {slots.map((slot) => {
                  const dirty = dirtySet.has(slot.key);
                  const current = media[slot.key] ?? '';
                  return (
                    <article key={slot.key} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-semibold text-[var(--admin-text-main)]">
                          {slot.label}
                        </span>
                        <span className="flex shrink-0 items-center gap-1">
                          {dirty && (
                            <span
                              className="rounded bg-[var(--admin-accent-red)]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[var(--admin-accent-red)]"
                              title={t('admin.cms.dirtySlots').replace('{count}', '')}
                            >
                              •
                            </span>
                          )}
                          {current && current !== slot.fallback && (
                            <span className="rounded bg-[var(--admin-primary)]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[var(--admin-primary)]">
                              {t('admin.cms.customized')}
                            </span>
                          )}
                        </span>
                      </div>

                      {current ? (
                        <div className="relative h-20 w-full overflow-hidden rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)]">
                          <SmartImage
                            src={current}
                            alt=""
                            fill
                            sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
                            className="object-cover"
                          />
                        </div>
                      ) : null}

                      <AdminImageUpload
                        currentUrl={current}
                        onUrlChange={(url) =>
                          setMedia((prev) => {
                            const next = { ...prev };
                            if (url && url !== slot.fallback) next[slot.key] = url;
                            else delete next[slot.key];
                            return next;
                          })
                        }
                        folder={page.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
                      />

                      {dirty && (
                        <Button
                          onClick={() => void handleSaveOneSlot(slot)}
                          disabled={saving}
                          className="h-7 self-start border-[var(--admin-border)] bg-transparent px-2 text-[10px] text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50"
                        >
                          {t('admin.common.save')}
                        </Button>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}

          <div className="sticky bottom-4 flex items-center gap-3 self-end">
            {hasDirtyMedia ? (
              <span className="text-[10px] text-[var(--admin-text-muted)]">
                {t('admin.cms.dirtySlots').replace('{count}', formatNumber(dirtyMediaKeys.length))}
              </span>
            ) : (
              <span className="text-[10px] text-[var(--admin-text-muted)]">{t('admin.cms.noDirty')}</span>
            )}
            <Button
              onClick={discardMedia}
              disabled={!hasDirtyMedia || saving}
              className="h-10 border-[var(--admin-border)] bg-transparent px-4 text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {t('admin.cms.discard')}
            </Button>
            <Button
              onClick={handleSaveMedia}
              disabled={saving || !hasDirtyMedia}
              className="h-10 rounded-xl bg-[var(--admin-primary)] px-6 font-bold text-black hover:bg-[var(--admin-primary-hover)]"
            >
              {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {t('admin.cms.saveImages')}
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
