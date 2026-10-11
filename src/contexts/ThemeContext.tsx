'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  accentHover: string;
  text: string;
  background: string;
  card: string;
}

export interface ThemeTypography {
  titleFont: string;
  bodyFont: string;
  baseSize: string;
}

export interface ThemeSettings {
  colors: ThemeColors;
  typography: ThemeTypography;
  logo_url: string;
  favicon_url: string;
}

interface ThemeContextType {
  theme: ThemeSettings;
  updateTheme: (newTheme: Partial<ThemeSettings>) => void;
}

const DEFAULT_THEME: ThemeSettings = {
  colors: {
    primary: '#4A1F2D',
    secondary: '#F3E8DC',
    accent: '#C6A86A',
    accentHover: '#A88B50',
    text: '#F3E8DC',
    background: '#1A0F14',
    card: '#2A161D'
  },
  typography: {
    titleFont: 'Cormorant Garamond',
    bodyFont: 'Plus Jakarta Sans',
    baseSize: '16px'
  },
  logo_url: '/logo-maeum.png',
  favicon_url: '/favicon-maeum.ico'
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = 'maeum_theme_v2';

/** Notifica quando outra aba altera o tema salvo. */
function subscribeToStoredTheme(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', onStoreChange);
  return () => window.removeEventListener('storage', onStoreChange);
}

function readStoredTheme(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(THEME_KEY);
  } catch {
    // localStorage bloqueado (modo privado / cookies desligados).
    return null;
  }
}

const getStoredThemeServer = () => null;

export function ThemeProvider({ children, initialTheme }: { children: React.ReactNode; initialTheme?: ThemeSettings }) {
  const [theme, setTheme] = useState<ThemeSettings>(initialTheme || DEFAULT_THEME);

  /*
   * O tema salvo em outra aba é lido como "external store" em vez de ser
   * copiado para o estado dentro de um useEffect — evita o render em cascata
   * que o React 19 sinaliza e mantém o servidor como snapshot inicial.
   */
  const storedTheme = useSyncExternalStore(subscribeToStoredTheme, readStoredTheme, getStoredThemeServer);

  const resolvedTheme = useMemo<ThemeSettings>(() => {
    if (!storedTheme) return theme;
    try {
      const parsed = JSON.parse(storedTheme) as Partial<ThemeSettings>;
      return {
        ...theme,
        ...parsed,
        colors: { ...theme.colors, ...parsed.colors },
        typography: { ...theme.typography, ...parsed.typography },
      };
    } catch {
      return theme;
    }
  }, [storedTheme, theme]);

  // Efeito único: escreve as variáveis CSS no documento (sistema externo).
  useEffect(() => {
    const root = document.documentElement;
    const { colors } = resolvedTheme;
    root.style.setProperty('--primary-color', colors.primary);
    root.style.setProperty('--secondary-color', colors.secondary);
    root.style.setProperty('--accent-color', colors.accent);
    root.style.setProperty('--accent-hover', colors.accentHover);
    root.style.setProperty('--text-color', colors.text);
    root.style.setProperty('--background-color', colors.background);
    root.style.setProperty('--card-color', colors.card);
  }, [resolvedTheme]);

  const updateTheme = useCallback(
    (newTheme: Partial<ThemeSettings>) => {
      setTheme((prev) => {
        const updated: ThemeSettings = {
          ...prev,
          ...newTheme,
          colors: { ...prev.colors, ...newTheme.colors },
          typography: { ...prev.typography, ...newTheme.typography },
        };
        try {
          window.localStorage.setItem(THEME_KEY, JSON.stringify(updated));
        } catch {
          // Sem persistência: o tema ainda vale para a sessão atual.
        }
        return updated;
      });
    },
    [],
  );

  const value = useMemo<ThemeContextType>(
    () => ({ theme: resolvedTheme, updateTheme }),
    [resolvedTheme, updateTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
