'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';

const statuses = [
  { label: 'Confirmadas', count: 28, color: 'text-[#10B981]', bg: 'bg-[#10B981]/10', border: 'border-[#10B981]/20' },
  { label: 'Em Análise', count: 12, color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]/20' },
  { label: 'Aguardando Pagamento', count: 9, color: 'text-[#F97316]', bg: 'bg-[#F97316]/10', border: 'border-[#F97316]/20' },
  { label: 'Canceladas', count: 3, color: 'text-[#EF4444]', bg: 'bg-[#EF4444]/10', border: 'border-[#EF4444]/20' },
  { label: 'Concluídas', count: 17, color: 'text-[#8B5CF6]', bg: 'bg-[#8B5CF6]/10', border: 'border-[#8B5CF6]/20' },
];

export default function BookingsStatus() {
  return (
    <div className="bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-xl p-6 h-[280px] flex flex-col">
      <h3 className="text-[var(--admin-text-main)] text-sm font-medium mb-6">Status das Reservas</h3>
      
      <div className="flex-1 flex flex-col gap-3 justify-center">
        {statuses.map((status, idx) => (
          <div key={idx} className="flex items-center justify-between pb-3 border-b border-[var(--admin-border)]/50 last:border-0 last:pb-0">
            <span className="text-[var(--admin-text-muted)] text-xs">{status.label}</span>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${status.bg} ${status.color} ${status.border}`}>
              {status.count}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 text-center">
        <button className="text-[var(--admin-primary)] hover:text-[var(--admin-primary-hover)] text-xs font-medium flex items-center justify-center w-full gap-1 transition-colors">
          Ver todas as reservas <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
