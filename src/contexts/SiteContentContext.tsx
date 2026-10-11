'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { getCmsText, getCmsMediaMap, getCmsNavigation } from '@/actions/cmsActions';
import type { TextOverrides, PublicNavItem, NavigationMap } from '@/lib/cmsData';
import type { Locale } from '@/i18n/config';

export const CMS_CHANGE_EVENT = 'maeum_cms_change';

export interface SiteContentContextType {
  /** Overrides de texto por idioma (apenas o que foi alterado no painel). */
  text: TextOverrides;
  /** Alias explícito de `text` — o BRIEF pede `textOverrides` na contexto. */
  textOverrides: TextOverrides;
  /** Mapa slot → URL efetiva (override ou fallback). */
  media: Record<string, string>;
  /**
   * Menu do site por tipo (`main`, `footer`, `legal`, ...), vindo de
   * `NavigationItem`. Vem do servidor no primeiro paint; `{}` quando o painel
   * ainda não configurou nada — o Header/Footer caem na lista embutida.
   */
  navigation: NavigationMap;
  /** Recarrega o conteúdo do banco e dispara o evento global de mudança. */
  refresh: () => Promise<void>;
}

const SiteContentContext = createContext<SiteContentContextType | null>(null);

export function SiteContentProvider({
  children,
  initialText,
  initialMedia,
  initialNavigation,
}: {
  children: ReactNode;
  initialText: TextOverrides;
  initialMedia: Record<string, string>;
  initialNavigation?: NavigationMap;
}) {
  const [text, setText] = useState<TextOverrides>(initialText);
  const [media, setMedia] = useState<Record<string, string>>(initialMedia);
  const [navigation, setNavigation] = useState<NavigationMap>(initialNavigation ?? {});

  const load = useCallback(async () => {
    try {
      const [textRes, mediaRes, navRes] = await Promise.all([
        getCmsText(),
        getCmsMediaMap(),
        getCmsNavigation(),
      ]);
      if (textRes.success && textRes.data) setText(textRes.data);
      if (mediaRes.success && mediaRes.data) setMedia(mediaRes.data);
      if (navRes.success && navRes.data) setNavigation(navRes.data);
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
  // O refresh inicial fica no próximo tick para o primeiro paint usar os dados
  // do SSR e não provocar um render em cascata.
  useEffect(() => {
    const mount = window.setTimeout(() => void load(), 0);
    const handler = () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      void load();
    };
    window.addEventListener(CMS_CHANGE_EVENT, handler);
    window.addEventListener('focus', handler);
    return () => {
      window.clearTimeout(mount);
      window.removeEventListener(CMS_CHANGE_EVENT, handler);
      window.removeEventListener('focus', handler);
    };
  }, [load]);

  const value = useMemo<SiteContentContextType>(
    () => ({ text, textOverrides: text, media, navigation, refresh }),
    [text, media, navigation, refresh],
  );

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
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

/** Todos os overrides de texto, indexados por idioma. */
export function useSiteText(): TextOverrides {
  const { textOverrides } = useSiteContent();
  return textOverrides;
}

/** Overrides de texto de um idioma específico (com fallback para pt). */
export function useText(locale: Locale = 'pt'): Record<string, string> {
  const { textOverrides } = useSiteContent();
  return textOverrides[locale] ?? textOverrides.pt ?? {};
}

/** Itens de um tipo de navegação. `[]` enquanto o painel não configurou. */
export function useNavigation(navigationType: string): PublicNavItem[] {
  const { navigation } = useSiteContent();
  return navigation[navigationType] ?? EMPTY_NAV;
}

const EMPTY_NAV: PublicNavItem[] = [];