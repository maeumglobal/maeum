'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { getCmsText, getCmsMediaMap } from '@/actions/cmsActions';
import type { TextOverrides } from '@/lib/cmsData';

export const CMS_CHANGE_EVENT = 'maeum_cms_change';

export interface SiteContentContextType {
  /** Overrides de texto por idioma (apenas o que foi alterado no painel). */
  text: TextOverrides;
  /** Mapa slot → URL efetiva (override ou fallback). */
  media: Record<string, string>;
  /** Recarrega o conteúdo do banco e dispara o evento global de mudança. */
  refresh: () => Promise<void>;
}

const SiteContentContext = createContext<SiteContentContextType | null>(null);

export function SiteContentProvider({
  children,
  initialText,
  initialMedia,
}: {
  children: ReactNode;
  initialText: TextOverrides;
  initialMedia: Record<string, string>;
}) {
  const [text, setText] = useState<TextOverrides>(initialText);
  const [media, setMedia] = useState<Record<string, string>>(initialMedia);

  const load = useCallback(async () => {
    try {
      const [textRes, mediaRes] = await Promise.all([getCmsText(), getCmsMediaMap()]);
      if (textRes.success && textRes.data) setText(textRes.data);
      if (mediaRes.success && mediaRes.data) setMedia(mediaRes.data);
    } catch {
      // mantém o estado atual em caso de erro
    }
  }, []);

  const refresh = useCallback(async () => {
    await load();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(CMS_CHANGE_EVENT));
    }
  }, [load]);

  // Recarrega ao montar (garante dados frescos após navegação/SSR) e quando o
  // painel salva (evento disparado pelo próprio painel em outra aba).
  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener(CMS_CHANGE_EVENT, handler);
    window.addEventListener('focus', handler);
    return () => {
      window.removeEventListener(CMS_CHANGE_EVENT, handler);
      window.removeEventListener('focus', handler);
    };
  }, [load]);

  return (
    <SiteContentContext.Provider value={{ text, media, refresh }}>
      {children}
    </SiteContentContext.Provider>
  );
}

export function useSiteContent(): SiteContentContextType {
  const ctx = useContext(SiteContentContext);
  if (!ctx) throw new Error('useSiteContent must be used within SiteContentProvider');
  return ctx;
}

/** URL efetiva de um slot (override do painel ou fallback). */
export function useMedia(slot: string): string {
  const { media } = useSiteContent();
  return media[slot] || '';
}
