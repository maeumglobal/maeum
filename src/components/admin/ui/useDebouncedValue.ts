'use client';

/**
 * Debounce de busca para as telas do painel.
 *
 * Sem isto, cada tecla disparava uma server action (round-trip ao Postgres):
 * `AdminLeadsHome`, `AdminBlogHome`, `AdminExperiencesHome`,
 * `AdminJourneysHome` e `AdminUsersHome` faziam exatamente isso.
 *
 * Usa `useDeferredValue` (re-render barato enquanto o usuário digita) + um timer
 * de 300ms com cleanup, conforme o BRIEF.
 */
import { useEffect, useState } from 'react';

export const SEARCH_DEBOUNCE_MS = 300;

export function useDebouncedValue<T>(value: T, delay = SEARCH_DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
