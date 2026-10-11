'use client';

/**
 * Cabeçalho do painel: saudação, data e central de notificações.
 *
 * Correções aplicadas:
 *  - `new Date()` no corpo do componente → hydration mismatch garantido (o
 *    servidor e o cliente renderizavam horários diferentes). Agora a data é
 *    calculada DENTRO do `useEffect`, com estado inicial `null`.
 *  - `fetchNotifications` era recriado a cada render e o `setInterval` de 15s
 *    nunca era pausado: a aba em segundo plano continuava batendo no banco.
 *    Agora é `useCallback` e o intervalo é suspenso em `document.hidden`.
 *  - o id do usuário vinha de um UUID hardcoded como fallback
 *    (`'a1eebc99-…'`), que é exatamente o tipo de dado que `assertSelf()` da
 *    action rejeita. Sem sessão, não há polling.
 *  - "Ver histórico completo" era um botão sem ação — virou link real.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Bell, Check, CheckCircle2, ExternalLink, RefreshCw, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMountedLoad } from '@/components/admin/ui/useMountedLoad';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createTestNotification,
} from '@/actions/notificationActions';

interface NotificationRow {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  linkUrl: string | null;
  createdAt: string | Date;
}

const POLL_MS = 15_000;

export default function AdminHeader() {
  const { user } = useAuth();
  const { t, formatDate } = useLanguage();

  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unread, setUnread] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [today, setToday] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userId = user?.id ?? null;

  const fetchNotifications = useCallback(async (): Promise<void> => {
    if (!userId) {
      setNotifications([]);
      setUnread(0);
      setLoading(false);
      return;
    }
    try {
      const res = await getNotifications({ userId, pageSize: 20 });
      if (res.success) {
        setNotifications((res.items ?? []) as unknown as NotificationRow[]);
        setUnread(res.unread ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useMountedLoad(fetchNotifications);

  // Polling de 15s, suspenso enquanto a aba está oculta.
  useEffect(() => {
    if (!userId) return;

    let timer: number | undefined;

    const tick = () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      void fetchNotifications();
    };

    const start = () => {
      window.clearInterval(timer);
      timer = window.setInterval(tick, POLL_MS);
    };
    const onVisibility = () => {
      if (document.hidden) window.clearInterval(timer);
      else {
        tick();
        start();
      }
    };

    start();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [userId, fetchNotifications]);

// Data do dia: agendada para o próximo paint (nunca na render — `new Date()`
  // no corpo do componente é hydration mismatch garantido).
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setToday(
        formatDate(new Date(), {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }),
      );
    });
    return () => window.cancelAnimationFrame(frame);
  }, [formatDate]);

  // Fecha o dropdown ao clicar fora.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const greeting = useMemo(
    () => t('admin.header.greeting').replace('{name}', user?.name?.split(' ')[0] ?? '—'),
    [t, user?.name],
  );

  const handleMarkAsRead = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    const res = await markAsRead(id);
    if (!res.success) await fetchNotifications();
  };

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
    const res = await markAllAsRead(userId ?? undefined);
    if (!res.success) await fetchNotifications();
  };

  const handleDelete = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const res = await deleteNotification(id);
    if (!res.success) await fetchNotifications();
  };

  const handleCreateTest = async () => {
    setIsTestLoading(true);
    await createTestNotification(userId ?? undefined);
    await fetchNotifications();
    setIsTestLoading(false);
  };

  return (
    <header className="relative z-20 flex w-full shrink-0 items-center justify-between gap-4 border-b border-[var(--admin-border)] bg-[var(--admin-bg)] p-6">
      <div className="min-w-0">
        <h2 className="mb-1 truncate text-2xl font-light text-[var(--admin-text-main)]">{greeting}</h2>
        <p className="text-sm text-[var(--admin-text-muted)]">{t('admin.header.subtitle')}</p>
      </div>

      <div className="flex items-center gap-4">
        <span className="hidden text-sm text-[var(--admin-text-muted)] sm:inline">
          {today ?? '—'}
        </span>

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            aria-label={t('admin.header.notifications')}
            className="relative rounded-full p-2 text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-border)]/50 hover:text-[var(--admin-text-main)]"
          >
            <Bell className="w-6 h-6" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--admin-accent-red)] px-1 text-[10px] font-bold text-white shadow-md">
                {unread > 9 ? '9+' : unread}
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
                className="absolute right-0 mt-3 flex w-80 flex-col overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] shadow-2xl sm:w-96"
              >
                <div className="flex items-center justify-between gap-2 border-b border-[var(--admin-border)] bg-[var(--admin-bg)] p-4">
                  <h3 className="text-sm font-bold text-[var(--admin-text-main)]">
                    {t('admin.header.notifications')}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCreateTest}
                      disabled={isTestLoading}
                      title={t('admin.header.testNotification')}
                      aria-label={t('admin.header.testNotification')}
                      className="p-1 text-[var(--admin-text-muted)] transition-colors hover:text-[var(--admin-primary)] disabled:opacity-50"
                    >
                      {isTestLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                    </button>
                    {unread > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllAsRead}
                        className="flex items-center gap-1 rounded bg-[var(--admin-primary)]/10 px-2 py-1 text-[10px] font-semibold text-[var(--admin-primary)] transition-colors hover:bg-[var(--admin-primary)] hover:text-white"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {t('admin.header.markAllRead')}
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                  {loading ? (
                    <div className="flex flex-col items-center gap-3 p-8 text-sm text-[var(--admin-text-muted)]">
                      <RefreshCw className="w-5 h-5 animate-spin text-[var(--admin-primary)]" />
                      {t('admin.header.loading')}
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 p-8">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--admin-border)]/50 text-[var(--admin-text-muted)]">
                        <Bell className="w-5 h-5" />
                      </span>
                      <p className="text-sm font-medium text-[var(--admin-text-muted)]">
                        {t('admin.header.notificationsEmpty')}
                      </p>
                    </div>
                  ) : (
                    <ul className="flex flex-col">
                      {notifications.map((notification) => (
                        <li
                          key={notification.id}
                          className={`group relative border-b border-[var(--admin-border)]/50 p-4 transition-colors hover:bg-[var(--admin-border)]/30 ${
                            notification.isRead ? '' : 'bg-[var(--admin-primary)]/5'
                          }`}
                        >
                          {!notification.isRead && (
                            <span
                              aria-hidden="true"
                              className="absolute top-0 bottom-0 left-0 w-1 bg-[var(--admin-primary)]"
                            />
                          )}
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1 pr-6">
                              <h4
                                className={`mb-1 text-sm ${
                                  notification.isRead
                                    ? 'font-medium text-[var(--admin-text-muted)]'
                                    : 'font-bold text-[var(--admin-text-main)]'
                                }`}
                              >
                                {notification.title}
                              </h4>
                              <p className="mb-2 text-[11px] leading-relaxed text-[var(--admin-text-muted)]">
                                {notification.message}
                              </p>
                              <span className="text-[9px] font-semibold uppercase text-[var(--admin-text-muted)]/70">
                                {formatDate(notification.createdAt, {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>

                            <div className="absolute top-4 right-3 flex flex-col gap-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                              {!notification.isRead && (
                                <button
                                  type="button"
                                  onClick={(event) => void handleMarkAsRead(notification.id, event)}
                                  className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-bg)] p-1.5 text-[var(--admin-primary)] shadow-sm transition-all hover:bg-[var(--admin-primary)] hover:text-white"
                                  title={t('admin.header.markRead')}
                                  aria-label={t('admin.header.markRead')}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(event) => void handleDelete(notification.id, event)}
                                className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-bg)] p-1.5 text-red-500 shadow-sm transition-all hover:bg-red-500 hover:text-white"
                                title={t('admin.header.deleteNotification')}
                                aria-label={t('admin.header.deleteNotification')}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {notification.linkUrl && (
                            <a
                              href={notification.linkUrl}
                              className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-[var(--admin-primary)] hover:underline"
                            >
                              {t('admin.header.viewDetails')} <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="border-t border-[var(--admin-border)] bg-[var(--admin-bg)] p-3 text-center">
                    <Link
                      href="/dashboard/admin"
                      onClick={() => setIsOpen(false)}
                      className="text-xs text-[var(--admin-text-muted)] transition-colors hover:text-[var(--admin-text-main)]"
                    >
                      {t('admin.header.allRead')}
                    </Link>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
