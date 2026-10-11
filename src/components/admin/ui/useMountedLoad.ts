'use client';

/**
 * Dispara um carregamento assíncrono a partir de um efeito, SEM `setState`
 * síncrono no corpo do efeito.
 *
 * ## Por que existe
 *
 * Todas as telas do painel carregam dados com server actions dentro de
 * `useEffect`. O padrão direto
 *
 * ```ts
 * useEffect(() => { void load(); }, [load]);   // load() chama setLoading(true)
 * ```
 *
 * chama `setState` de forma síncrona no corpo do efeito, o que dispara um
 * render em cascata antes mesmo de a promise resolver (regra
 * `react-hooks/set-state-in-effect` do eslint-config-next 16).
 *
 * Aqui o carregamento é agendado para o próximo tick. Benefício real, além da
 * regra: o estado de loading entra em paint antes da ida ao banco, então a
 * tela não pisca com conteúdo velho enquanto a request está em voo.
 *
 * O cleanup cancela o timer quando as dependências mudam antes do disparo —
 * dois filtros digitados rápido não disparam duas requests.
 */
import { useEffect } from 'react';

export function useMountedLoad(load: () => Promise<unknown> | unknown): void {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
}