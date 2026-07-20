/* eslint-disable @next/next/no-img-element */
'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function RecentPayments({ payments: apiPayments }: { payments?: any[] }) {
  // Map API payments or fallback to mock if empty
  const payments = apiPayments && apiPayments.length > 0 ? apiPayments.map(p => ({
    id: p.id,
    name: 'Cliente ' + p.clientId?.substring(0, 5) || 'Cliente', // Ideally would join with User table for name
    pkg: p.booking?.packageId || 'Pacote Padrão',
    amount: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.amount),
    status: p.status === 'paid' ? 'Pago' : 'Pendente',
    date: new Date(p.createdAt).toLocaleDateString('pt-BR'),
    avatar: `https://ui-avatars.com/api/?name=${p.clientId ? 'C' : 'U'}&background=random`
  })) : [
    { id: 'mock1', name: 'Nenhum pagamento', pkg: '-', amount: 'R$ 0,00', status: 'Pendente', date: '-', avatar: 'https://ui-avatars.com/api/?name=Vazio' }
  ];

  return (
    <div className="bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-xl p-6 flex flex-col h-[300px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[var(--admin-text-main)] text-sm font-medium">Pagamentos Recentes</h3>
        <button className="text-[var(--admin-primary)] hover:text-[var(--admin-primary-hover)] text-xs font-medium flex items-center gap-1 transition-colors">
          Ver todos <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pr-2 -mr-2">
        <div className="flex flex-col gap-3">
          {payments.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--admin-border)]/30 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-[var(--admin-border)] shrink-0">
                  <img src={item.avatar} alt={item.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[var(--admin-text-main)] text-xs font-medium">{item.name}</span>
                  <span className="text-[var(--admin-text-muted)] text-[10px] truncate max-w-[120px]">{item.pkg}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-[var(--admin-text-main)] text-xs font-bold w-[80px] text-right">{item.amount}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border w-[65px] text-center ${
                  item.status === 'Pago' 
                    ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' 
                    : 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20'
                }`}>
                  {item.status}
                </span>
                <span className="text-[var(--admin-text-muted)] text-[10px] w-[60px] text-right">{item.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-4 pt-4 text-center border-t border-[var(--admin-border)]/50">
        <button className="text-[var(--admin-primary)] hover:text-[var(--admin-primary-hover)] text-xs font-medium flex items-center justify-center w-full gap-1 transition-colors">
          Ver todos os pagamentos <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
