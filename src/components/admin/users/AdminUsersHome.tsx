'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit3, Trash2, Search, RefreshCw, UserCog, Mail, Phone, X, ShieldCheck, ShieldAlert, ToggleLeft, ToggleRight, Bell, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getUsers, createUser, updateUser, deleteUser, updateUserRole, toggleUserActive, sendNotificationToAll } from '@/actions/usersActions';
import { useToast } from '@/contexts/ToastContext';

const ROLE_LABELS: Record<string, { label: string; badge: string }> = {
  super_admin: { label: 'Super Admin', badge: 'bg-[var(--admin-primary)]/20 text-[var(--admin-primary)] border-[var(--admin-primary)]/30' },
  admin: { label: 'Admin', badge: 'bg-purple-900/30 text-purple-400 border-purple-800' },
  consultora: { label: 'Consultora', badge: 'bg-blue-900/30 text-blue-400 border-blue-800' },
  customer: { label: 'Cliente', badge: 'bg-gray-800 text-gray-400 border-gray-700' },
};

export default function AdminUsersHome() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;
  const [formData, setFormData] = useState({ name: '', email: '', password: 'maeum2026', role: 'customer', phone: '' });
  const [notifData, setNotifData] = useState({ title: '', message: '', type: 'info', priority: 'normal', category: 'system' });
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const res = await getUsers({ page, pageSize: PAGE_SIZE, search, role: roleFilter || undefined });
    if (res.success && res.data) { setUsers(res.data); setTotal(res.total || 0); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [search, roleFilter, page]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir o usuário "${name}" permanentemente?`)) return;
    const res = await deleteUser(id);
    if (res.success) { toast('Usuário excluído!'); load(); } else toast('Erro ao excluir usuário.');
  };

  const handleToggleActive = async (id: string) => {
    const res = await toggleUserActive(id);
    if (res.success) { toast(`Usuário ${res.data?.isActive ? 'ativado' : 'desativado'}!`); load(); }
  };

  const handleRoleChange = async (id: string, role: string) => {
    const res = await updateUserRole(id, role);
    if (res.success) { toast('Papel atualizado!'); load(); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return toast('Nome e e-mail são obrigatórios!');
    setIsSubmitting(true);
    const res = await createUser(formData);
    if (res.success) { toast('Usuário criado!'); setIsModalOpen(false); setFormData({ name: '', email: '', password: 'maeum2026', role: 'customer', phone: '' }); load(); }
    else toast(String(res.error) || 'Erro ao criar usuário.');
    setIsSubmitting(false);
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await sendNotificationToAll(notifData);
    if (res.success) { toast(`Notificação enviada para ${res.count} usuários!`); setIsNotifModalOpen(false); setNotifData({ title: '', message: '', type: 'info', priority: 'normal', category: 'system' }); }
    else toast('Erro ao enviar notificação.');
    setIsSubmitting(false);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--admin-card)] border border-[var(--admin-border)] p-4 md:p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-[var(--admin-text-main)] mb-1 flex items-center gap-2">
            <Users className="w-5 h-5 text-[var(--admin-primary)]" /> Usuários & Equipe
          </h2>
          <p className="text-xs text-[var(--admin-text-muted)]">{total} usuários no total</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={load} variant="outline" className="h-9 px-3 border-[var(--admin-border)] text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => setIsNotifModalOpen(true)} variant="outline" className="h-9 px-3 border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)]">
            <Bell className="w-4 h-4 mr-1" /> Notificar Todos
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="h-9 px-4 bg-[var(--admin-primary)] hover:bg-[var(--admin-primary-hover)] text-black font-semibold">
            <Plus className="w-4 h-4 mr-1" /> Novo Usuário
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-muted)]" />
          <Input placeholder="Buscar por nome ou e-mail..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-xs bg-[var(--admin-card)] border-[var(--admin-border)] focus:border-[var(--admin-primary)] text-[var(--admin-text-main)]" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="h-9 px-3 text-xs rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-muted)] focus:outline-none focus:border-[var(--admin-primary)]">
          <option value="">Todos os papéis</option>
          <option value="super_admin">Super Admin</option>
          <option value="admin">Admin</option>
          <option value="consultora">Consultora</option>
          <option value="customer">Cliente</option>
        </select>
      </div>

      <div className="bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--admin-border)] bg-black/5 text-[10px] uppercase tracking-wider text-[var(--admin-text-muted)]">
              <th className="p-4 font-semibold">Usuário</th>
              <th className="p-4 font-semibold hidden sm:table-cell">Contato</th>
              <th className="p-4 font-semibold">Papel</th>
              <th className="p-4 font-semibold hidden md:table-cell">Status</th>
              <th className="p-4 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center"><RefreshCw className="w-5 h-5 animate-spin mx-auto text-[var(--admin-text-muted)]" /></td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-xs text-[var(--admin-text-muted)]">Nenhum usuário encontrado.</td></tr>
            ) : users.map(user => (
              <tr key={user.id} className={`border-b border-[var(--admin-border)] hover:bg-[var(--admin-border)]/20 group transition-colors ${!user.isActive ? 'opacity-50' : ''}`}>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[var(--admin-border)] overflow-hidden flex items-center justify-center shrink-0">
                      {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-[var(--admin-text-muted)]">{user.name?.[0]?.toUpperCase()}</span>}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--admin-text-main)] truncate">{user.name}</p>
                      <p className="text-[10px] text-[var(--admin-text-muted)]">
                        {user._count?.assignedLeads || 0} lead(s) • desde {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-4 hidden sm:table-cell">
                  <div className="flex flex-col gap-0.5 text-[11px] text-[var(--admin-text-muted)]">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{user.email}</span>
                    {user.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{user.phone}</span>}
                  </div>
                </td>
                <td className="p-4">
                  <select value={user.role} onChange={e => handleRoleChange(user.id, e.target.value)}
                    className={`text-[10px] font-bold px-2 py-1 rounded border appearance-none cursor-pointer outline-none ${ROLE_LABELS[user.role]?.badge || 'border-gray-700 text-gray-400'}`}>
                    <option value="customer">Cliente</option>
                    <option value="consultora">Consultora</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </td>
                <td className="p-4 hidden md:table-cell">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${user.isActive ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-gray-900/30 text-gray-500 border-gray-700'}`}>
                    {user.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleToggleActive(user.id)} title={user.isActive ? 'Desativar' : 'Ativar'}
                      className="p-1.5 rounded-md text-[var(--admin-text-muted)] hover:text-[var(--admin-primary)] hover:bg-[var(--admin-border)] transition-colors">
                      {user.isActive ? <ToggleRight className="w-4 h-4 text-green-400" /> : <ToggleLeft className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleDelete(user.id, user.name)}
                      className="p-1.5 rounded-md text-[var(--admin-text-muted)] hover:text-[var(--admin-accent-red)] hover:bg-[var(--admin-accent-red)]/10 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="h-8 px-3 text-xs border-[var(--admin-border)]">Anterior</Button>
          <span className="text-xs text-[var(--admin-text-muted)]">Página {page} de {totalPages}</span>
          <Button variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="h-8 px-3 text-xs border-[var(--admin-border)]">Próxima</Button>
        </div>
      )}

      {/* Create User Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[var(--admin-bg)] border border-[var(--admin-border)] shadow-2xl rounded-2xl z-[101] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-[var(--admin-border)] bg-[var(--admin-card)]">
                <h3 className="text-lg font-bold text-[var(--admin-text-main)]">Novo Usuário</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-[var(--admin-text-muted)]"><X className="w-5 h-5" /></button>
              </div>
              <form id="userForm" onSubmit={handleCreate} className="p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--admin-text-main)]">Nome Completo *</label>
                  <Input required value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="bg-[var(--admin-card)] border-[var(--admin-border)] focus:border-[var(--admin-primary)] text-sm" placeholder="Ex: Mariana Santos" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[var(--admin-text-main)]">E-mail *</label>
                    <Input required type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} className="bg-[var(--admin-card)] border-[var(--admin-border)] focus:border-[var(--admin-primary)] text-sm" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[var(--admin-text-main)]">Telefone</label>
                    <Input value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} className="bg-[var(--admin-card)] border-[var(--admin-border)] focus:border-[var(--admin-primary)] text-sm" placeholder="+5541..." />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[var(--admin-text-main)]">Papel</label>
                    <select value={formData.role} onChange={e => setFormData(p => ({ ...p, role: e.target.value }))} className="h-10 px-3 text-sm rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-main)] focus:outline-none focus:border-[var(--admin-primary)]">
                      <option value="customer">Cliente</option>
                      <option value="consultora">Consultora</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[var(--admin-text-main)]">Senha inicial</label>
                    <Input value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} className="bg-[var(--admin-card)] border-[var(--admin-border)] focus:border-[var(--admin-primary)] text-sm" />
                  </div>
                </div>
              </form>
              <div className="p-6 border-t border-[var(--admin-border)] bg-[var(--admin-card)] flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="border-[var(--admin-border)] text-[var(--admin-text-main)]" disabled={isSubmitting}>Cancelar</Button>
                <Button form="userForm" type="submit" disabled={isSubmitting} className="bg-[var(--admin-primary)] hover:bg-[var(--admin-primary-hover)] text-black font-semibold">
                  {isSubmitting ? 'Criando...' : 'Criar Usuário'}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Broadcast Notification Modal */}
      <AnimatePresence>
        {isNotifModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsNotifModalOpen(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[var(--admin-bg)] border border-[var(--admin-border)] shadow-2xl rounded-2xl z-[101] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-[var(--admin-border)] bg-[var(--admin-card)]">
                <h3 className="text-lg font-bold text-[var(--admin-text-main)]">Notificação para Todos</h3>
                <button onClick={() => setIsNotifModalOpen(false)} className="text-[var(--admin-text-muted)]"><X className="w-5 h-5" /></button>
              </div>
              <form id="notifForm" onSubmit={handleBroadcast} className="p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--admin-text-main)]">Título *</label>
                  <Input required value={notifData.title} onChange={e => setNotifData(p => ({ ...p, title: e.target.value }))} className="bg-[var(--admin-card)] border-[var(--admin-border)] focus:border-[var(--admin-primary)] text-sm" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--admin-text-main)]">Mensagem *</label>
                  <textarea required value={notifData.message} onChange={e => setNotifData(p => ({ ...p, message: e.target.value }))} className="flex min-h-[80px] w-full rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 py-2 text-sm text-[var(--admin-text-main)] focus-visible:outline-none focus-visible:border-[var(--admin-primary)] resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[var(--admin-text-main)]">Tipo</label>
                    <select value={notifData.type} onChange={e => setNotifData(p => ({ ...p, type: e.target.value }))} className="h-10 px-3 text-sm rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-main)] focus:outline-none focus:border-[var(--admin-primary)]">
                      <option value="info">Info</option>
                      <option value="success">Sucesso</option>
                      <option value="warning">Aviso</option>
                      <option value="error">Alerta</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[var(--admin-text-main)]">Prioridade</label>
                    <select value={notifData.priority} onChange={e => setNotifData(p => ({ ...p, priority: e.target.value }))} className="h-10 px-3 text-sm rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-main)] focus:outline-none focus:border-[var(--admin-primary)]">
                      <option value="low">Baixa</option>
                      <option value="normal">Normal</option>
                      <option value="high">Alta</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>
                </div>
              </form>
              <div className="p-6 border-t border-[var(--admin-border)] bg-[var(--admin-card)] flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsNotifModalOpen(false)} className="border-[var(--admin-border)] text-[var(--admin-text-main)]" disabled={isSubmitting}>Cancelar</Button>
                <Button form="notifForm" type="submit" disabled={isSubmitting} className="bg-[var(--admin-primary)] hover:bg-[var(--admin-primary-hover)] text-black font-semibold">
                  {isSubmitting ? 'Enviando...' : 'Enviar para Todos'}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
