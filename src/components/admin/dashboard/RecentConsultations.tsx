/* eslint-disable @next/next/no-img-element */
'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function RecentConsultations({ consultations: apiConsultations }: { consultations?: any[] }) {
  // Use mock data as fallback if no real data exists yet
  const consultations = apiConsultations && apiConsultations.length > 0 ? apiConsultations.map(c => ({
    id: c.id,
    name: c.name,
    contact: c.email,
    pkg: c.destination || 'N/A',
    pkgColor: 'bg-[var(--admin-chart-cyan)]/20 text-[var(--admin-chart-cyan)] border-[var(--admin-chart-cyan)]/30',
    date: new Date(c.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=random`
  })) : [
    { id: 'mock1', name: 'Nenhum lead real', contact: 'O banco está vazio', pkg: 'N/A', pkgColor: 'bg-[var(--admin-border)] text-[var(--admin-text-muted)]', date: '-', avatar: 'https://ui-avatars.com/api/?name=Vazio' }
  ];

  return (
    <div className="bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-xl p-6 flex flex-col h-[300px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[var(--admin-text-main)] text-sm font-medium">Consultas Recentes</h3>
        <button className="text-[var(--admin-primary)] hover:text-[var(--admin-primary-hover)] text-xs font-medium flex items-center gap-1 transition-colors">
          Ver todas <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pr-2 -mr-2">
        <div className="flex flex-col gap-3">
          {consultations.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--admin-border)]/30 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-[var(--admin-border)] shrink-0">
                  <img src={item.avatar} alt={item.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[var(--admin-text-main)] text-xs font-medium">{item.name}</span>
                  <span className="text-[var(--admin-text-muted)] text-[10px]">{item.contact}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4 shrink-0">
                <span className={`text-[10px] font-bold px-2 py-1 rounded border ${item.pkgColor} truncate max-w-[120px] text-center`}>
                  {item.pkg}
                </span>
                <span className="text-[var(--admin-text-muted)] text-[10px] w-[100px] text-right">{item.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
