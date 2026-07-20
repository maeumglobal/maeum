'use client';

import React from 'react';
import { ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';

export default function FinancialSummary() {
  return (
    <div className="bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[var(--admin-text-main)] text-sm font-medium">Resumo Financeiro</h3>
        <button className="text-[var(--admin-primary)] hover:text-[var(--admin-primary-hover)] text-xs font-medium flex items-center gap-1 transition-colors">
          Ver relatório financeiro completo <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-[var(--admin-text-muted)] text-[11px]">Recebido (período)</span>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[var(--admin-text-main)] text-xl font-bold tracking-tight">R$ 478.920,00</span>
            <span className="flex items-center text-[10px] font-bold text-[var(--admin-accent-green)]">
              <ArrowUp className="w-3 h-3 mr-0.5" /> 23.8%
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[var(--admin-text-muted)] text-[11px]">Pendente</span>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[var(--admin-text-main)] text-xl font-bold tracking-tight">R$ 92.540,00</span>
            <span className="flex items-center text-[10px] font-bold text-[var(--admin-text-muted)]">
              —
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[var(--admin-text-muted)] text-[11px]">Cancelado/Reembolsado</span>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[var(--admin-text-main)] text-xl font-bold tracking-tight">R$ 12.300,00</span>
            <span className="flex items-center text-[10px] font-bold text-[var(--admin-accent-red)]">
              <ArrowDown className="w-3 h-3 mr-0.5" /> 8.4%
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[var(--admin-text-muted)] text-[11px]">A receber (futuro)</span>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[var(--admin-text-main)] text-xl font-bold tracking-tight">R$ 215.780,00</span>
            <span className="flex items-center text-[10px] font-bold text-[var(--admin-accent-green)]">
              <ArrowUp className="w-3 h-3 mr-0.5" /> 15.2%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
