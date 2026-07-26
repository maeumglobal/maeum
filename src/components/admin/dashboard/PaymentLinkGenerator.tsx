'use client';

import React from 'react';
import { ChevronDown, ArrowRight } from 'lucide-react';

export default function PaymentLinkGenerator() {
  return (
    <div className="bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-xl p-6 flex flex-col h-full min-h-[300px]">
      <h3 className="text-[var(--admin-text-main)] text-sm font-medium mb-1">Criar Link de Pagamento</h3>
      <p className="text-[var(--admin-text-muted)] text-[11px] mb-6">Gere um link seguro da Stripe para enviar ao cliente.</p>

      <form className="flex-1 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-[var(--admin-text-muted)]">Cliente (opcional)</label>
          <div className="relative">
            <select className="appearance-none w-full bg-[var(--admin-bg)] border border-[var(--admin-border)] text-[var(--admin-text-main)] text-xs rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-[var(--admin-primary)]">
              <option value="">Selecione um cliente</option>
              <option value="1">Juliana Martins</option>
              <option value="2">Carolina Souza</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-muted)] pointer-events-none" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-[var(--admin-text-muted)]">Descrição</label>
          <input 
            type="text" 
            placeholder="Ex: Entrada Horizon of Seven"
            className="w-full bg-[var(--admin-bg)] border border-[var(--admin-border)] text-[var(--admin-text-main)] text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--admin-primary)] placeholder:text-[var(--admin-text-muted)]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-[var(--admin-text-muted)]">Valor (R$)</label>
            <input 
              type="text" 
              placeholder="0,00"
              className="w-full bg-[var(--admin-bg)] border border-[var(--admin-border)] text-[var(--admin-text-main)] text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--admin-primary)] placeholder:text-[var(--admin-text-muted)]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-[var(--admin-text-muted)]">Pacote</label>
            <div className="relative">
              <select className="appearance-none w-full bg-[var(--admin-bg)] border border-[var(--admin-border)] text-[var(--admin-text-main)] text-xs rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-[var(--admin-primary)]">
                <option value="">Selecione o pacote</option>
                <option value="always">Always Destination</option>
                <option value="horizon">Horizon of Seven</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-muted)] pointer-events-none" />
            </div>
          </div>
        </div>

        <button 
          type="button" 
          className="w-full bg-[var(--admin-primary)] hover:bg-[var(--admin-primary-hover)] text-[#1A0F14] font-bold text-xs py-3 rounded-lg transition-colors mt-auto"
        >
          Gerar Link de Pagamento
        </button>
      </form>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 opacity-70">
          <span className="text-[10px] text-[var(--admin-text-muted)] font-medium">Powered by</span>
          <span className="text-[var(--admin-text-main)] text-sm font-bold tracking-tighter">stripe</span>
        </div>
        <button className="text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)] text-[10px] flex items-center gap-1 transition-colors">
          Saiba mais <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
