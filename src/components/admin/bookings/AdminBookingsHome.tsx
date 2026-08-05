'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, CalendarCheck, User, Package, DollarSign, Clock, CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getBookings, updateBookingStatus, updatePaymentStatus } from '@/actions/businessActions';
import { useToast } from '@/contexts/ToastContext';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-800',
  confirmed: 'bg-green-900/30 text-green-400 border-green-800',
  cancelled: 'bg-red-900/30 text-red-400 border-red-800',
  completed: 'bg-blue-900/30 text-blue-400 border-blue-800',
};

const PAYMENT_STATUS: Record<string, string> = {
  pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-800',
  paid: 'bg-green-900/30 text-green-400 border-green-800',
  failed: 'bg-red-900/30 text-red-400 border-red-800',
  refunded: 'bg-purple-900/30 text-purple-400 border-purple-800',
};

export default function AdminBookingsHome() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const res = await getBookings({ status: statusFilter || undefined });
    if (res.success && res.data) { setBookings(res.data); setTotal(res.total || 0); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleBookingStatusChange = async (id: string, status: string) => {
    const res = await updateBookingStatus(id, status);
    if (res.success) { toast(`Status alterado para "${status}"`); load(); }
    else toast('Erro ao atualizar status.');
  };

  const handlePaymentStatusChange = async (id: string, status: string) => {
    const res = await updatePaymentStatus(id, status);
    if (res.success) { toast(`Pagamento marcado como "${status}"`); load(); }
    else toast('Erro ao atualizar pagamento.');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--admin-card)] border border-[var(--admin-border)] p-4 md:p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-[var(--admin-text-main)] mb-1 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-[var(--admin-primary)]" /> Reservas
          </h2>
          <p className="text-xs text-[var(--admin-text-muted)]">{total} reservas no sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 px-3 text-xs rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-muted)] focus:outline-none focus:border-[var(--admin-primary)]">
            <option value="">Todos</option>
            <option value="pending">Pendente</option>
            <option value="confirmed">Confirmado</option>
            <option value="cancelled">Cancelado</option>
            <option value="completed">Concluído</option>
          </select>
          <Button onClick={load} variant="outline" className="h-9 px-3 border-[var(--admin-border)] text-[var(--admin-text-main)] hover:bg-[var(--admin-border)]/50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="flex items-center justify-center py-16"><RefreshCw className="w-6 h-6 animate-spin text-[var(--admin-text-muted)]" /></div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--admin-text-muted)]">
            <CalendarCheck className="w-12 h-12 opacity-30" />
            <p className="text-sm">Nenhuma reserva encontrada.</p>
          </div>
        ) : bookings.map(booking => (
          <motion.div key={booking.id} layout className="bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-xl overflow-hidden hover:border-[var(--admin-primary)]/40 transition-colors">
            {/* Row */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-full bg-[var(--admin-border)] flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-[var(--admin-text-muted)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[var(--admin-text-main)]">{booking.client?.name || 'Cliente'}</p>
                  <p className="text-[10px] text-[var(--admin-text-muted)]">{booking.client?.email}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-center">
                  <p className="text-[9px] text-[var(--admin-text-muted)] uppercase">Pacote</p>
                  <p className="text-xs font-semibold text-[var(--admin-text-main)] max-w-[120px] truncate">{booking.package?.title || booking.proposal?.title || '—'}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-[var(--admin-text-muted)] uppercase">Total</p>
                  <p className="text-xs font-bold text-[var(--admin-accent-green)]">
                    {booking.totalPrice ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(booking.totalPrice) : '—'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-[var(--admin-text-muted)] uppercase">Período</p>
                  <p className="text-[10px] text-[var(--admin-text-muted)]">
                    {booking.startDate ? new Date(booking.startDate).toLocaleDateString('pt-BR') : '—'} →{' '}
                    {booking.endDate ? new Date(booking.endDate).toLocaleDateString('pt-BR') : '—'}
                  </p>
                </div>
                <select
                  value={booking.status}
                  onChange={e => handleBookingStatusChange(booking.id, e.target.value)}
                  className={`text-[10px] font-bold px-2 py-1 rounded border appearance-none cursor-pointer outline-none ${STATUS_COLORS[booking.status] || ''}`}
                >
                  <option value="pending">Pendente</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="cancelled">Cancelado</option>
                  <option value="completed">Concluído</option>
                </select>
                <button onClick={() => setExpandedId(expandedId === booking.id ? null : booking.id)}
                  className="p-1.5 rounded-md text-[var(--admin-text-muted)] hover:text-[var(--admin-primary)] hover:bg-[var(--admin-border)] transition-colors">
                  {expandedId === booking.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Expanded: Payments */}
            {expandedId === booking.id && booking.payments?.length > 0 && (
              <div className="border-t border-[var(--admin-border)] p-4 bg-[var(--admin-bg)]/50">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--admin-text-muted)] mb-3">Parcelas / Pagamentos</p>
                <div className="flex flex-col gap-2">
                  {booking.payments.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)]">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-xs font-bold text-[var(--admin-text-main)]">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.amount)}
                          </p>
                          <p className="text-[10px] text-[var(--admin-text-muted)]">
                            Vencimento: {p.dueDate ? new Date(p.dueDate).toLocaleDateString('pt-BR') : '—'}
                            {p.paidAt && ` • Pago em: ${new Date(p.paidAt).toLocaleDateString('pt-BR')}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${PAYMENT_STATUS[p.status] || ''}`}>
                          {p.status === 'paid' ? 'Pago' : p.status === 'pending' ? 'Pendente' : p.status === 'failed' ? 'Falhou' : 'Reembolsado'}
                        </span>
                        {p.status === 'pending' && (
                          <button onClick={() => handlePaymentStatusChange(p.id, 'paid')}
                            className="text-[10px] px-2 py-1 rounded border border-green-800 bg-green-900/30 text-green-400 hover:bg-green-900/60 transition-colors font-semibold">
                            Marcar Pago
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expanded: Timeline */}
            {expandedId === booking.id && booking.timeline?.length > 0 && (
              <div className="border-t border-[var(--admin-border)] p-4 bg-[var(--admin-bg)]/30">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--admin-text-muted)] mb-3">Cronograma da Viagem</p>
                <div className="flex flex-col gap-2">
                  {booking.timeline.map((t: any) => (
                    <div key={t.id} className="flex gap-3 text-xs">
                      <span className="text-[var(--admin-primary)] font-bold whitespace-nowrap">{new Date(t.eventDate).toLocaleDateString('pt-BR')}</span>
                      <span className="text-[var(--admin-text-muted)]">{t.eventTime}</span>
                      <span className="text-[var(--admin-text-main)] font-medium">{t.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
