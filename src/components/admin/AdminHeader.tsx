'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Bell, Check, Trash2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification,
  createTestNotification 
} from '@/actions/notificationActions';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminHeader() {
  const { user } = useAuth();
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isTestLoading, setIsTestLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Date formatting for the header
  const today = new Date();
  const nextMonth = new Date();
  nextMonth.setMonth(today.getMonth() + 1);
  const dateRange = `${today.getDate()} de ${today.toLocaleString('pt-BR', { month: 'short' })}, ${today.getFullYear()} - ${nextMonth.getDate()} de ${nextMonth.toLocaleString('pt-BR', { month: 'short' })}, ${nextMonth.getFullYear()}`;

  // Use the predefined admin ID matching AuthContext for testing
  const adminId = user?.id || 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  const fetchNotifications = async () => {
    if (!adminId) return;
    const res = await getNotifications(adminId);
    if (res.success && res.data) {
      setNotifications(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [adminId]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    await markAsRead(id);
    fetchNotifications();
  };

  const handleMarkAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    await markAllAsRead(adminId);
    fetchNotifications();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
    await deleteNotification(id);
    fetchNotifications();
  };

  const handleCreateTest = async () => {
    setIsTestLoading(true);
    await createTestNotification(adminId);
    await fetchNotifications();
    setIsTestLoading(false);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="flex items-center justify-between p-6 border-b border-[var(--admin-border)] bg-[var(--admin-bg)] shrink-0 font-sans w-full relative z-20">
      <div>
        <h2 className="text-2xl font-light text-[var(--admin-text-main)] mb-1 flex items-center gap-2">
          Olá, {user?.name ? user.name.split(' ')[0] : 'Priscila'}! <span className="text-xl">✨</span>
        </h2>
        <p className="text-[var(--admin-text-muted)] text-sm">
          Bem-vinda ao painel administrativo da Maeum Global.
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Date Range Picker Mock */}
        <button className="flex items-center gap-3 px-4 py-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)] hover:border-[var(--admin-primary)] transition-colors text-sm">
          <span className="capitalize">{dateRange}</span>
          <Calendar className="w-4 h-4 text-[var(--admin-primary)]" />
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="relative p-2 text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)] transition-colors rounded-full hover:bg-[var(--admin-border)]/50"
          >
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[var(--admin-accent-red)] text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-md animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {isOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-3 w-80 sm:w-96 bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
              >
                <div className="p-4 border-b border-[var(--admin-border)] flex items-center justify-between bg-[var(--admin-bg)]">
                  <h3 className="font-bold text-[var(--admin-text-main)]">Notificações</h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleCreateTest}
                      disabled={isTestLoading}
                      title="Gerar Notificação Teste"
                      className="text-xs text-[var(--admin-text-muted)] hover:text-[var(--admin-primary)] transition-colors p-1"
                    >
                      {isTestLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
                    </button>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllAsRead}
                        className="text-[10px] text-[var(--admin-primary)] hover:text-white transition-colors flex items-center gap-1 font-semibold px-2 py-1 rounded bg-[var(--admin-primary)]/10 hover:bg-[var(--admin-primary)]"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Lidas
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="overflow-y-auto max-h-[400px] no-scrollbar">
                  {loading ? (
                    <div className="p-8 text-center text-sm text-[var(--admin-text-muted)] flex flex-col items-center gap-3">
                      <RefreshCw className="w-5 h-5 animate-spin text-[var(--admin-primary)]" />
                      Carregando...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[var(--admin-border)]/50 flex items-center justify-center text-[var(--admin-text-muted)]">
                        <Bell className="w-5 h-5" />
                      </div>
                      <p className="text-sm text-[var(--admin-text-muted)] font-medium">Nenhuma notificação por aqui.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {notifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          className={`p-4 border-b border-[var(--admin-border)]/50 hover:bg-[var(--admin-border)]/30 transition-colors group relative cursor-default
                            ${!notif.isRead ? 'bg-[var(--admin-primary)]/5' : ''}
                          `}
                        >
                          {!notif.isRead && (
                            <span className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--admin-primary)]" />
                          )}
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex-1 pr-6">
                              <h4 className={`text-sm mb-1 ${notif.isRead ? 'text-[var(--admin-text-muted)] font-medium' : 'text-[var(--admin-text-main)] font-bold'}`}>
                                {notif.title}
                              </h4>
                              <p className="text-[11px] text-[var(--admin-text-muted)] leading-relaxed mb-2">
                                {notif.message}
                              </p>
                              <span className="text-[9px] text-[var(--admin-text-muted)]/70 uppercase font-semibold">
                                {new Date(notif.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                              </span>
                            </div>
                            
                            {/* Actions overlay on hover */}
                            <div className="absolute right-3 top-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!notif.isRead && (
                                <button 
                                  onClick={(e) => handleMarkAsRead(notif.id, e)}
                                  className="p-1.5 rounded-md bg-[var(--admin-bg)] text-[var(--admin-primary)] border border-[var(--admin-border)] hover:bg-[var(--admin-primary)] hover:text-white transition-all shadow-sm"
                                  title="Marcar como lida"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button 
                                onClick={(e) => handleDelete(notif.id, e)}
                                className="p-1.5 rounded-md bg-[var(--admin-bg)] text-red-500 border border-[var(--admin-border)] hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                title="Excluir notificação"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          
                          {notif.linkUrl && (
                            <a 
                              href={notif.linkUrl} 
                              className="mt-3 text-[11px] font-bold text-[var(--admin-primary)] hover:underline inline-flex items-center gap-1"
                            >
                              Ver detalhes &rarr;
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {notifications.length > 0 && (
                  <div className="p-3 border-t border-[var(--admin-border)] text-center bg-[var(--admin-bg)]">
                    <button className="text-xs text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)] transition-colors">
                      Ver histórico completo
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
