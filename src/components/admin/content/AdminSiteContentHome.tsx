'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Save, RefreshCw, CheckCircle2, Search, Languages, Image as ImageIcon, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCmsText, getCmsMedia, saveCmsText, saveCmsMedia, ensureMediaBucket } from '@/actions/cmsActions';
import { getMediaSlotsByPage, type MediaSlot } from '@/lib/mediaSlots';
import { TEXT_GROUPS, type TextGroup } from '@/lib/textCatalog';
import AdminImageUpload from '@/components/admin/content/AdminImageUpload';
import { useToast } from '@/contexts/ToastContext';
import { useSiteContent, CMS_CHANGE_EVENT } from '@/contexts/SiteContentContext';
import type { Locale } from '@/i18n/config';
import type { TextOverrides, MediaOverrides } from '@/lib/cmsData';

const LOCALES: Locale[] = ['pt', 'en', 'es'];
const LOCALE_LABELS: Record<Locale, string> = { pt: 'Português', en: 'Inglês', es: 'Espanhol' };

export default function AdminSiteContentHome() {
  const [tab, setTab] = useState<'text' | 'media'>('text');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const { toast } = useToast();
  const { refresh } = useSiteContent();

  // ── TEXTO ────────────────────────────────────────────────
  const [text, setText] = useState<TextOverrides>({ pt: {}, en: {}, es: {} });
  // valores editados: { [group][key][locale] }
  const [textEdits, setTextEdits] = useState<Record<string, Record<string, Record<Locale, string>>>>({});

  // ── MÍDIA ────────────────────────────────────────────────
  const [media, setMedia] = useState<MediaOverrides>({});
  const [bucketOk, setBucketOk] = useState<boolean | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [tRes, mRes] = await Promise.all([getCmsText(), getCmsMedia()]);
      if (tRes.success && tRes.data) setText(tRes.data);
      if (mRes.success && mRes.data) setMedia(mRes.data);
      setLoading(false);
    };
    load();
  }, []);

  // Garante o bucket de imagens ao abrir o painel (só quando o admin acessa a aba de mídia).
  useEffect(() => {
    if (tab !== 'media') return;
    ensureMediaBucket().then((res) => setBucketOk(res.success));
  }, [tab]);

  const mediaByPage = useMemo(() => getMediaSlotsByPage(), []);

  const currentValue = (group: TextGroup, key: string, locale: Locale): string => {
    const staticVal = group.dict[locale]?.[key] ?? group.dict.pt[key] ?? '';
    const override = text[locale]?.[key];
    return typeof override === 'string' && override.length > 0 ? override : staticVal;
  };

  const handleTextChange = (groupId: string, key: string, locale: Locale, value: string) => {
    setTextEdits((prev) => {
      const next = { ...prev };
      next[groupId] = { ...(next[groupId] || {}) };
      next[groupId][key] = { ...(next[groupId][key] || { pt: '', en: '', es: '' }), [locale]: value };
      return next;
    });
  };

  const handleSaveText = async () => {
    setSaving(true);
    const next: TextOverrides = { pt: { ...text.pt }, en: { ...text.en }, es: { ...text.es } };
    for (const group of TEXT_GROUPS) {
      const groupEdits = textEdits[group.id];
      if (!groupEdits) continue;
      for (const [key, values] of Object.entries(groupEdits)) {
        for (const locale of LOCALES) {
          const staticVal = group.dict[locale]?.[key] ?? group.dict.pt[key] ?? '';
          const edited = values[locale];
          if (edited === undefined || edited === staticVal) {
            // limpa o override quando volta ao valor estático (a menos que o
            // estático já seja o que queremos — para pt a chave é o próprio texto)
            if (locale === 'pt') delete next.pt[key];
            else delete next[locale][key];
          } else {
            next[locale][key] = edited;
          }
        }
      }
    }
    const res = await saveCmsText(next);
    setSaving(false);
    if (res.success) {
      setText(next);
      setTextEdits({});
      await refresh();
      toast('Textos salvos com sucesso!');
    } else {
      toast('Erro ao salvar textos.', 'error');
    }
  };

  const handleSaveMedia = async () => {
    setSaving(true);
    const res = await saveCmsMedia(media);
    setSaving(false);
    if (res.success) {
      await refresh();
      window.dispatchEvent(new CustomEvent(CMS_CHANGE_EVENT));
      toast('Imagens salvas com sucesso!');
    } else {
      toast('Erro ao salvar imagens.', 'error');
    }
  };

  // Filtro de grupos de texto
  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return TEXT_GROUPS;
    return TEXT_GROUPS.map((g) => {
      const matchingKeys = Object.keys(g.dict.pt).filter(
        (k) =>
          k.toLowerCase().includes(q) ||
          (g.dict.en?.[k] || '').toLowerCase().includes(q) ||
          (g.dict.es?.[k] || '').toLowerCase().includes(q)
      );
      return { ...g, matchingKeys };
    }).filter((g) => g.matchingKeys.length > 0);
  }, [search]);

  const hasMediaOverrides = (slot: MediaSlot): boolean => {
    const stored = media[slot.key];
    return typeof stored === 'string' && stored.length > 0 && stored !== slot.fallback;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[var(--admin-text-muted)]">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Carregando conteúdo do site...
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--admin-card)] border border-[var(--admin-border)] p-4 md:p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-[var(--admin-text-main)] mb-1">Conteúdo do Site</h2>
          <p className="text-xs text-[var(--admin-text-muted)]">
            Edite textos, títulos, subtítulos e imagens de banners e cards em todos os idiomas. As alterações são permanentes.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('text')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${tab === 'text' ? 'bg-[var(--admin-primary)] text-black' : 'bg-[var(--admin-card)] text-[var(--admin-text-muted)] border border-[var(--admin-border)]'}`}
        >
          <Languages className="w-4 h-4" /> Textos (PT / EN / ES)
        </button>
        <button
          onClick={() => setTab('media')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${tab === 'media' ? 'bg-[var(--admin-primary)] text-black' : 'bg-[var(--admin-card)] text-[var(--admin-text-muted)] border border-[var(--admin-border)]'}`}
        >
          <ImageIcon className="w-4 h-4" /> Banners & Cards
        </button>
      </div>

      {/* ─────────── TEXTOS ─────────── */}
      {tab === 'text' && (
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--admin-text-muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar texto (PT, EN ou ES)..."
              className="w-full h-10 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] pl-10 pr-3 text-sm text-[var(--admin-text-main)] placeholder-[var(--admin-text-muted)]"
            />
          </div>

          {filteredGroups.map((group) => {
            const keys = (group as TextGroup & { matchingKeys?: string[] }).matchingKeys || Object.keys(group.dict.pt);
            return (
              <div key={group.id} className="bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-2xl overflow-hidden">
                <div className="px-4 py-3 bg-[var(--admin-bg)]/60 border-b border-[var(--admin-border)] flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-[var(--admin-primary)]" />
                  <h3 className="text-sm font-bold text-[var(--admin-text-main)]">{group.label}</h3>
                  <span className="text-[10px] text-[var(--admin-text-muted)] ml-auto">{keys.length} textos</span>
                </div>
                <div className="divide-y divide-[var(--admin-border)]">
                  {keys.map((key) => (
                    <div key={key} className="px-4 py-3 flex flex-col gap-3">
                      <div className="flex items-start gap-2">
                        <span className="text-[11px] text-[var(--admin-text-muted)] flex-1 leading-snug">{key}</span>
                        {(text.pt[key] || text.en[key] || text.es[key]) && (
                          <span className="text-[9px] text-[var(--admin-primary)] font-bold uppercase shrink-0 bg-[var(--admin-primary)]/10 px-1.5 py-0.5 rounded">Editado</span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {LOCALES.map((locale) => {
                          const edited = textEdits[group.id]?.[key]?.[locale];
                          const value = edited !== undefined ? edited : currentValue(group, key, locale);
                          return (
                            <label key={locale} className="flex flex-col gap-1">
                              <span className="text-[9px] font-bold uppercase text-[var(--admin-text-muted)]">{LOCALE_LABELS[locale]}</span>
                              <textarea
                                rows={1}
                                value={value}
                                onChange={(e) => handleTextChange(group.id, key, locale, e.target.value)}
                                className="w-full rounded-md border border-[var(--admin-border)] bg-[var(--admin-bg)] px-2.5 py-2 text-xs text-[var(--admin-text-main)] resize-y min-h-[32px] focus:border-[var(--admin-primary)] focus:outline-none"
                              />
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="sticky bottom-4 self-end">
            <Button onClick={handleSaveText} disabled={saving} className="h-10 px-6 bg-[var(--admin-primary)] hover:bg-[var(--admin-primary-hover)] text-black font-bold rounded-xl shadow-lg shadow-[var(--admin-primary)]/20">
              {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar Textos
            </Button>
          </div>
        </div>
      )}

      {/* ─────────── MÍDIA ─────────── */}
      {tab === 'media' && (
        <div className="flex flex-col gap-4">
          <div className="bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-2xl p-4 text-xs text-[var(--admin-text-muted)]">
            Ao enviar uma imagem nova, a imagem antiga é <strong className="text-[var(--admin-primary)]">removida do Supabase Storage</strong> automaticamente para não ocupar espaço. Você também pode colar uma URL externa.
            {bucketOk === false && (
              <p className="mt-2 text-red-400 font-semibold">
                Aviso: não foi possível garantir o bucket &quot;maeum-images&quot;. Crie-o manualmente no Supabase (Storage → New bucket → public) para que o upload funcione.
              </p>
            )}
          </div>

          {Object.entries(mediaByPage).map(([page, slots]) => (
            <div key={page} className="bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-2xl overflow-hidden">
              <div className="px-4 py-3 bg-[var(--admin-bg)]/60 border-b border-[var(--admin-border)] flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[var(--admin-primary)]" />
                <h3 className="text-sm font-bold text-[var(--admin-text-main)]">{page}</h3>
                <span className="text-[10px] text-[var(--admin-text-muted)] ml-auto">{slots.filter(hasMediaOverrides).length} editados</span>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {slots.map((slot) => (
                  <div key={slot.key} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[var(--admin-text-main)]">{slot.label}</span>
                      {hasMediaOverrides(slot) && (
                        <span className="text-[9px] text-[var(--admin-primary)] font-bold uppercase bg-[var(--admin-primary)]/10 px-1.5 py-0.5 rounded">Personalizado</span>
                      )}
                    </div>
                    <AdminImageUpload
                      currentUrl={media[slot.key] || slot.fallback}
                      onUrlChange={(url) => setMedia((prev) => {
                        const next = { ...prev };
                        if (url && url !== slot.fallback) next[slot.key] = url;
                        else delete next[slot.key];
                        return next;
                      })}
                      folder={page.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="sticky bottom-4 self-end">
            <Button onClick={handleSaveMedia} disabled={saving} className="h-10 px-6 bg-[var(--admin-primary)] hover:bg-[var(--admin-primary-hover)] text-black font-bold rounded-xl shadow-lg shadow-[var(--admin-primary)]/20">
              {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar Imagens
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
