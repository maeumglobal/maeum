'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ChevronDown } from 'lucide-react';

const data = [
  { name: 'Always Destination', value: 10, color: 'var(--admin-chart-purple)' },
  { name: 'Horizon of Seven', value: 7, color: 'var(--admin-chart-orange)' },
  { name: 'Bom Sarang', value: 4, color: 'var(--admin-chart-yellow)' },
  { name: 'Caravana de Verão', value: 4, color: 'var(--admin-chart-cyan)' },
  { name: 'Founding ARMY', value: 3, color: 'var(--admin-chart-pink)' },
];

export default function BookingsChart() {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-xl p-6 h-[280px] flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[var(--admin-text-main)] text-sm font-medium">Reservas por Pacote</h3>
        <div className="relative">
          <select className="appearance-none bg-transparent border border-[var(--admin-border)] text-[var(--admin-text-main)] text-xs rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:border-[var(--admin-primary)] cursor-pointer">
            <option value="todos">Todos os pacotes</option>
            <option value="individuais">Individuais</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--admin-text-muted)] pointer-events-none" />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-between mt-2">
        <div className="relative w-1/2 h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[var(--admin-border)] border border-[var(--admin-border)] rounded-lg p-2 shadow-lg text-xs">
                        <span className="text-[var(--admin-text-main)] font-medium">{data.name}</span>
                        <div className="mt-1 font-bold" style={{ color: data.color }}>{data.value} reservas</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center text for donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[var(--admin-text-muted)] text-[10px] uppercase font-bold tracking-wider">Total</span>
            <span className="text-[var(--admin-text-main)] text-lg font-bold leading-tight">{total} reservas</span>
          </div>
        </div>

        {/* Legend */}
        <div className="w-1/2 flex flex-col justify-center gap-3 pl-2">
          {data.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-[var(--admin-text-muted)] truncate" title={item.name}>{item.name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[var(--admin-text-main)] font-medium">{Math.round((item.value / total) * 100)}%</span>
                <span className="text-[var(--admin-text-muted)] w-6 text-right">({item.value})</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
