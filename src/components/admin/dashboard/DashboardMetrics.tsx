'use client';

import React from 'react';
import { CircleDollarSign, Gem, Users, Percent, Ticket, ArrowUp, Info } from 'lucide-react';
import { motion, Variants } from 'framer-motion';

interface MetricsData {
  revenue: { value: number, change: number };
  bookings: { value: number, change: number };
  leads: { value: number, change: number };
  conversion: { value: number, change: number };
  ticket: { value: number, change: number };
}

export default function DashboardMetrics({ metrics: apiMetrics }: { metrics?: MetricsData }) {
  // Map API metrics to the UI structure
  const metrics = [
    {
      title: 'Faturamento Total',
      value: apiMetrics?.revenue?.value 
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(apiMetrics?.revenue?.value) 
        : 'R$ 0,00',
      change: `${(apiMetrics?.revenue?.change || 0) > 0 ? '+' : ''}${(apiMetrics?.revenue?.change || 0).toFixed(1)}%`,
      changeType: (apiMetrics?.revenue?.change || 0) >= 0 ? 'positive' : 'negative',
      icon: CircleDollarSign,
      hasTooltip: true,
    },
    {
      title: 'Reservas Confirmadas',
      value: apiMetrics?.bookings?.value?.toString() || '0',
      change: `${(apiMetrics?.bookings?.change || 0) > 0 ? '+' : ''}${(apiMetrics?.bookings?.change || 0).toFixed(1)}%`,
      changeType: (apiMetrics?.bookings?.change || 0) >= 0 ? 'positive' : 'negative',
      icon: Gem,
    },
    {
      title: 'Novas Consultas',
      value: apiMetrics?.leads?.value?.toString() || '0',
      change: `${(apiMetrics?.leads?.change || 0) > 0 ? '+' : ''}${(apiMetrics?.leads?.change || 0).toFixed(1)}%`,
      changeType: (apiMetrics?.leads?.change || 0) >= 0 ? 'positive' : 'negative',
      icon: Users,
    },
    {
      title: 'Taxa de Conversão',
      value: `${apiMetrics?.conversion?.value?.toFixed(1) || '0'}%`,
      change: `${(apiMetrics?.conversion?.change || 0) > 0 ? '+' : ''}${(apiMetrics?.conversion?.change || 0).toFixed(1)}%`,
      changeType: (apiMetrics?.conversion?.change || 0) >= 0 ? 'positive' : 'negative',
      icon: Percent,
    },
    {
      title: 'Ticket Médio',
      value: apiMetrics?.ticket?.value 
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(apiMetrics?.ticket?.value) 
        : 'R$ 0,00',
      change: `${(apiMetrics?.ticket?.change || 0) > 0 ? '+' : ''}${(apiMetrics?.ticket?.change || 0).toFixed(1)}%`,
      changeType: (apiMetrics?.ticket?.change || 0) >= 0 ? 'positive' : 'negative',
      icon: Ticket,
    }
  ];
  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
    >
      {metrics.map((metric, idx) => {
        const Icon = metric.icon;
        return (
          <motion.div 
            key={idx}
            variants={item}
            className="bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-xl p-5 hover:border-[var(--admin-primary)] transition-colors group relative overflow-hidden"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-[var(--admin-border)]/50 flex items-center justify-center border border-[var(--admin-border)] group-hover:border-[var(--admin-primary)]/50 transition-colors">
                <Icon className="w-5 h-5 text-[var(--admin-primary)]" strokeWidth={1.5} />
              </div>
            </div>
            
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-[var(--admin-text-main)] text-sm">{metric.title}</h3>
              {metric.hasTooltip && (
                <Info className="w-3.5 h-3.5 text-[var(--admin-text-muted)] cursor-help" />
              )}
            </div>
            
            <div className="text-2xl font-bold text-[var(--admin-text-main)] mb-3 tracking-tight">
              {metric.value}
            </div>
            
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--admin-text-muted)]">
              <span className={`flex items-center ${metric.changeType === 'positive' ? 'text-[var(--admin-accent-green)]' : 'text-[var(--admin-accent-red)]'}`}>
                {metric.changeType === 'positive' && <ArrowUp className="w-3 h-3 mr-0.5" />}
                {metric.change}
              </span>
              <span>vs período anterior</span>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
