'use client';

import React from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChevronDown } from 'lucide-react';

const data = [
  { month: 'Jan', revenue: 150000 },
  { month: 'Fev', revenue: 120000 },
  { month: 'Mar', revenue: 210000 },
  { month: 'Abr', revenue: 340000 },
  { month: 'Mai', revenue: 420000 },
  { month: 'Jun', revenue: 478920 },
];

export default function RevenueChart() {
  return (
    <div className="bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-xl p-6 h-[280px] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[var(--admin-text-main)] text-sm font-medium">Faturamento</h3>
        <div className="relative">
          <select className="appearance-none bg-transparent border border-[var(--admin-border)] text-[var(--admin-text-main)] text-xs rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:border-[var(--admin-primary)] cursor-pointer">
            <option value="mensal">Mensal</option>
            <option value="semanal">Semanal</option>
            <option value="anual">Anual</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--admin-text-muted)] pointer-events-none" />
        </div>
      </div>
      
      <div className="flex-1 w-full h-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--admin-chart-pink)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--admin-chart-pink)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--admin-text-muted)', fontSize: 11 }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--admin-text-muted)', fontSize: 11 }}
              tickFormatter={(value) => `R$ ${value / 1000}k`}
              dx={-10}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-[var(--admin-border)] border border-[var(--admin-border)] rounded-lg p-3 shadow-lg">
                      <p className="text-[var(--admin-text-main)] text-xs mb-1 font-medium">{label}/2024</p>
                      <p className="text-[var(--admin-chart-pink)] text-sm font-bold">
                        R$ {payload[0].value?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="var(--admin-chart-pink)" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorRevenue)" 
              activeDot={{ r: 6, fill: "var(--admin-chart-pink)", stroke: "var(--admin-bg)", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
