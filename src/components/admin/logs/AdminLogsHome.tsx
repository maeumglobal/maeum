'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Search, ShieldAlert, Clock, User, Activity, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getLogs } from '@/actions/adminActions';
import { useToast } from '@/contexts/ToastContext';

export default function AdminLogsHome() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 20;

  const load = async () => {
    setLoading(true);
    const res = await getLogs({ page, pageSize: PAGE_SIZE, entity: entityFilter || undefined });
    if (res.success && res.data) { setLogs(res.data); setTotal(res.total || 0); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [entityFilter, page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const ACTION_COLORS: Record<string, string> = {
    system_init: 'bg-purple-900/30 text-purple-400 border-purple-800',
    create: 'bg-green-900/30 text-green-400 border-green-800',
    update: 'bg-blue-900/30 text-blue-400 border-blue-800',
    delete: 'bg-red-900/30 text-red-400 border-red-800',
    login: 'bg-gray-800 text-gray-300 border-gray-700',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--admin-card)] border border-[var(--admin-border)] p-4 md:p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-[var(--admin-text-main)] mb-1 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[var(--admin-primary)]" /> Auditoria e Logs
          </h2>
          <p className="text-xs text-[var(--admin-text-muted)]">{total} registros no sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={load} variant="outline" className="h-9 px-3 border-[var(--admin-border)] text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <select value={entityFilter} onChange={e => { setEntityFilter(e.target.value); setPage(1); }} className="h-9 px-3 text-xs rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-muted)] focus:outline-none focus:border-[var(--admin-primary)] w-48">
          <option value="">Todas as entidades</option>
          <option value="system">Sistema</option>
          <option value="user">Usuários</option>
          <option value="booking">Reservas</option>
          <option value="lead">Leads</option>
          <option value="experience">Experiências</option>
        </select>
      </div>

      <div className="bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--admin-border)] bg-black/5 text-[10px] uppercase tracking-wider text-[var(--admin-text-muted)]">
              <th className="p-4 font-semibold">Data / Hora</th>
              <th className="p-4 font-semibold hidden sm:table-cell">Usuário</th>
              <th className="p-4 font-semibold">Ação</th>
              <th className="p-4 font-semibold hidden md:table-cell">Entidade</th>
              <th className="p-4 font-semibold hidden lg:table-cell">Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center"><RefreshCw className="w-5 h-5 animate-spin mx-auto text-[var(--admin-text-muted)]" /></td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-xs text-[var(--admin-text-muted)]">Nenhum log registrado.</td></tr>
            ) : logs.map(log => (
              <tr key={log.id} className="border-b border-[var(--admin-border)] hover:bg-[var(--admin-border)]/20 transition-colors">
                <td className="p-4 text-xs font-mono text-[var(--admin-text-muted)] whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1 text-[var(--admin-text-main)]"><Clock className="w-3 h-3" /> {new Date(log.createdAt).toLocaleDateString('pt-BR')}</span>
                    <span className="ml-4">{new Date(log.createdAt).toLocaleTimeString('pt-BR')}</span>
                  </div>
                </td>
                <td className="p-4 hidden sm:table-cell">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[var(--admin-border)] flex items-center justify-center shrink-0">
                      <User className="w-3 h-3 text-[var(--admin-text-muted)]" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-[var(--admin-text-main)] truncate max-w-[150px]">{log.user?.name || 'Sistema'}</p>
                      <p className="text-[9px] text-[var(--admin-text-muted)]">{log.user?.role || 'SYSTEM'}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ACTION_COLORS[log.action] || 'bg-gray-800 text-gray-300 border-gray-700'}`}>
                    {log.action}
                  </span>
                </td>
                <td className="p-4 hidden md:table-cell text-[11px] text-[var(--admin-text-muted)] uppercase font-semibold">
                  {log.entity}
                </td>
                <td className="p-4 hidden lg:table-cell text-[10px] text-[var(--admin-text-muted)] font-mono truncate max-w-[200px]">
                  {log.details ? log.details : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="h-8 px-3 text-xs border-[var(--admin-border)]">Anterior</Button>
          <span className="text-xs text-[var(--admin-text-muted)]">Página {page} de {totalPages}</span>
          <Button variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="h-8 px-3 text-xs border-[var(--admin-border)]">Próxima</Button>
        </div>
      )}
    </motion.div>
  );
}
