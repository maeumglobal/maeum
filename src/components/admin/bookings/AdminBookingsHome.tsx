'use client';

/**
 * Reservas — com PAGINAÇÃO de verdade.
 *
 * Bug que motivou a reescrita: `getBookings({ status })` era chamado SEM `page`
 * e SEM `pageSize`, então a action aplicava o default (20) e a tela não tinha
 * pager. Tudo a partir da reserva 21 era permanentemente invisível.
 */
import { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarCheck, ChevronDown, ChevronUp, Link2, Package, RefreshCw, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getBookings, updateBookingStatus, updatePaymentStatus } from '@/actions/businessActions';
import { regeneratePaymentLink } from '@/actions/adminActions';
import AdminPagination from '@/components/admin/ui/Pagination';
import { useMountedLoad } from '@/components/admin/ui/useMountedLoad';
import { AdminEmptyState, AdminErrorState, AdminPageHeader, AdminTableSkeleton } from '@/components/admin/ui/States';


interface PaymentRow {
  id: string;
  amount: number;
  status: string;
  dueDate: string | null;
  paidAt: string | null;
}

interface TimelineRow {
  id: string;
  eventDate: string;
  eventTime: string | null;
  title: string;
}

interface BookingRow {
  id: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  totalPrice: number | null;
  clientId: string;
  client?: { id: string; name: string; email: string; phone: string | null } | null;
  package?: { id: string; title: string; destination: string | null } | null;
  proposal?: { id: string; title: string; totalValue: number } | null;
  payments?: PaymentRow[];
  timeline?: TimelineRow[];
}

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-800',
  confirmed: 'bg-green-900/30 text-green-400 border-green-800',
  in_progress: 'bg-cyan-900/30 text-cyan-400 border-cyan-800',
  completed: 'bg-blue-900/30 text-blue-400 border-blue-800',
  cancelled: 'bg-red-900/30 text-red-400 border-red-800',
};

const PAYMENT_STYLE: Record<string, string> = {
  pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-800',
  paid: 'bg-green-900/30 text-green-400 border-green-800',
  failed: 'bg-red-900/30 text-red-400 border-red-800',
  refunded: 'bg-purple-900/30 text-purple-400 border-purple-800',
  cancelled: 'bg-gray-900/30 text-gray-400 border-gray-700',
};

export default function AdminBookingsHome() {
  const { t, formatCurrency, formatDate, formatNumber } = useLanguage();
  const { toast } = useToast();

  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** id do pagamento cujo link está sendo reemitido (evita clique duplo). */
  const [relinkingId, setRelinkingId] = useState<string | null>(null);


  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getBookings({ page, pageSize, status: statusFilter || undefined });
    if (res.success) {
      setBookings((res.items ?? []) as unknown as BookingRow[]);
      setTotal(res.total ?? 0);
      setTotalPages(res.totalPages ?? 1);
    } else {
      setBookings([]);
      setTotal(0);
      setTotalPages(1);
      setError(res.error ?? t('state.errorTitle'));
    }
    setLoading(false);
  }, [page, pageSize, statusFilter, t]);

  useMountedLoad(load);

  const statusOptions = useMemo(
    () => [
      { value: '', labelKey: 'admin.book.filterAll' },
      { value: 'pending', labelKey: 'admin.book.statusPending' },
      { value: 'confirmed', labelKey: 'admin.book.statusConfirmed' },
      { value: 'in_progress', labelKey: 'admin.book.statusInProgress' },
      { value: 'completed', labelKey: 'admin.book.statusCompleted' },
{ value: 'cancelled', labelKey: 'admin.book.statusCancelled' },
    ],
    // Só guarda as CHAVES; a tradução acontece no JSX (evita refazer a lista
    // a cada troca de idioma).
    [],
  );

  const handleBookingStatusChange = async (id: string, status: string) => {
    const res = await updateBookingStatus(id, status);
    if (res.success) {
      toast(t('admin.book.statusChanged').replace('{status}', t(`admin.book.status${status}`) || status));
      await load();
    } else {
      toast(res.error ?? t('state.errorTitle'), 'error');
    }
  };

  const handlePaymentStatusChange = async (id: string, status: string) => {
    const res = await updatePaymentStatus(id, status);
    if (res.success) {
      toast(t('admin.book.paymentMarked').replace('{status}', t(`admin.list.status${status}`) || status));
      await load();
    } else {
      toast(res.error ?? t('state.errorTitle'), 'error');
    }
  };

  /**
   * `regeneratePaymentLink` troca o token público de `/p/<uuid>` — o link
   * anterior MORRE. Por isso a confirmação cita o valor e é obrigatória, e o
   * `else` mostra o erro em vez de fingir que o link foi reemitido.
   */
  const handleRegenerateLink = async (payment: PaymentRow) => {
    if (relinkingId) return;
    if (
      !window.confirm(
        t('admin.book.regenerateConfirm')
          .replace('{amount}', formatCurrency(payment.amount))
          .replace('{date}', payment.dueDate ? formatDate(payment.dueDate) : '—'),
      )
    ) {
      return;
    }

    setRelinkingId(payment.id);
    try {
      const res = await regeneratePaymentLink(payment.id);
      if (res.success) {
        toast(t('admin.book.linkRegenerated'), 'success');
        await load();
      } else {
        toast(res.error ?? t('state.errorTitle'), 'error');
      }
    } catch {
      toast(t('admin.book.linkRegenerateFailed'), 'error');
    } finally {
      setRelinkingId(null);
    }
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-full flex-col gap-6"
    >
      <AdminPageHeader
        icon={<CalendarCheck className="w-5 h-5" />}
        title={t('admin.book.title')}
        subtitle={t('admin.book.subtitle').replace('{count}', formatNumber(total))}
        actions={
          <>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] px-3 text-xs text-[var(--admin-text-muted)] focus:border-[var(--admin-primary)] focus:outline-none"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
            <Button
              onClick={load}
              variant="outline"
              aria-label={t('state.retry')}
              className="h-9 border-[var(--admin-border)] px-3 text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </>
        }
      />

      {error ? (
        <AdminErrorState message={error} onRetry={load} />
      ) : loading && bookings.length === 0 ? (
        <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)]">
          <AdminTableSkeleton rows={6} columns={4} />
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)]">
          <AdminEmptyState
            title={t('admin.book.empty')}
            icon={<CalendarCheck className="w-5 h-5" />}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {bookings.map((booking) => (
            <motion.div
              key={booking.id}
              layout
              className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] transition-colors hover:border-[var(--admin-primary)]/40"
            >
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--admin-border)]">
                    <User className="w-4 h-4 text-[var(--admin-text-muted)]" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[var(--admin-text-main)]">
                      {booking.client?.name ?? t('admin.book.client')}
                    </p>
                    <p className="truncate text-[10px] text-[var(--admin-text-muted)]">
                      {booking.client?.email ?? '—'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-center">
                    <p className="text-[9px] uppercase text-[var(--admin-text-muted)]">
                      {t('admin.book.package')}
                    </p>
                    <p className="max-w-[130px] truncate text-xs font-semibold text-[var(--admin-text-main)]">
                      {booking.package?.title ?? booking.proposal?.title ?? '—'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] uppercase text-[var(--admin-text-muted)]">
                      {t('admin.book.total')}
                    </p>
                    <p className="text-xs font-bold text-[var(--admin-accent-green)]">
                      {booking.totalPrice ? formatCurrency(booking.totalPrice) : '—'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] uppercase text-[var(--admin-text-muted)]">
                      {t('admin.book.period')}
                    </p>
                    <p className="text-[10px] text-[var(--admin-text-muted)]">
                      {booking.startDate ? formatDate(booking.startDate) : '—'} →{' '}
                      {booking.endDate ? formatDate(booking.endDate) : '—'}
                    </p>
                  </div>

                  <select
                    value={booking.status}
                    onChange={(e) => void handleBookingStatusChange(booking.id, e.target.value)}
                    className={`cursor-pointer appearance-none rounded border px-2 py-1 text-[10px] font-bold outline-none ${
                      STATUS_STYLE[booking.status] ?? ''
                    }`}
                  >
                    {statusOptions
                      .filter((option) => option.value !== '')
                      .map((option) => (
                        <option key={option.value} value={option.value}>
                          {t(option.labelKey)}
                        </option>
                      ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => setExpandedId(expandedId === booking.id ? null : booking.id)}
                    aria-expanded={expandedId === booking.id}
                    aria-label={t('admin.book.installments')}
                    className="rounded-md p-1.5 text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-border)] hover:text-[var(--admin-primary)]"
                  >
                    {expandedId === booking.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {expandedId === booking.id && (booking.payments?.length ?? 0) > 0 && (
                <div className="border-t border-[var(--admin-border)] bg-[var(--admin-bg)]/50 p-4">
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--admin-text-muted)]">
                    {t('admin.book.installments')}
                  </p>
                  <div className="flex flex-col gap-2">
                    {booking.payments?.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] p-3"
                      >
                        <div>
                          <p className="text-xs font-bold text-[var(--admin-text-main)]">
                            {formatCurrency(payment.amount)}
                          </p>
                          <p className="text-[10px] text-[var(--admin-text-muted)]">
                            {t('admin.book.dueDate')}: {payment.dueDate ? formatDate(payment.dueDate) : '—'}
                            {payment.paidAt && ` · ${t('admin.book.paidOn')}: ${formatDate(payment.paidAt)}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${
                              PAYMENT_STYLE[payment.status] ?? ''
                            }`}
                          >
                            {t(`admin.list.status${payment.status}`) || payment.status}
                          </span>
                          {payment.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => void handlePaymentStatusChange(payment.id, 'paid')}
                              className="rounded border border-green-800 bg-green-900/30 px-2 py-1 text-[10px] font-semibold text-green-400 transition-colors hover:bg-green-900/60"
                            >
                              {t('admin.book.markPaid')}
                            </button>
                          )}
                          {payment.status !== 'paid' && (
                            <button
                              type="button"
                              onClick={() => void handleRegenerateLink(payment)}
                              disabled={relinkingId === payment.id}
                              title={t('admin.book.regenerateLink')}
                              aria-label={t('admin.book.regenerateLink')}
                              className="inline-flex items-center gap-1 rounded border border-[var(--admin-border)] px-2 py-1 text-[10px] font-semibold text-[var(--admin-text-muted)] transition-colors hover:border-[var(--admin-primary)] hover:text-[var(--admin-primary)] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Link2 className="h-3 w-3" />
                              {relinkingId === payment.id
                                ? t('admin.state.loading')
                                : t('admin.book.regenerateLink')}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {expandedId === booking.id && (booking.timeline?.length ?? 0) > 0 && (
                <div className="border-t border-[var(--admin-border)] bg-[var(--admin-bg)]/30 p-4">
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--admin-text-muted)]">
                    {t('admin.book.timeline')}
                  </p>
                  <div className="flex flex-col gap-2">
                    {booking.timeline?.map((entry) => (
                      <div key={entry.id} className="flex flex-wrap items-baseline gap-3 text-xs">
                        <span className="font-bold whitespace-nowrap text-[var(--admin-primary)]">
                          {formatDate(entry.eventDate)}
                        </span>
                        {entry.eventTime && (
                          <span className="text-[var(--admin-text-muted)]">{entry.eventTime}</span>
                        )}
                        <span className="font-medium text-[var(--admin-text-main)]">{entry.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <AdminPagination
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        disabled={loading}
      />

      {!loading && bookings.length > 0 && (
        <p className="flex items-center gap-2 text-[10px] text-[var(--admin-text-muted)]">
          <Package className="w-3 h-3" />
          {formatNumber(bookings.length)} {t('admin.book.title').toLowerCase()} {t('pager.page').toLowerCase()} {page}
        </p>
      )}
    </motion.div>
  );
}
