'use client';

/**
 * Gerador de link de cobrança REAL.
 *
 * ## O que ele NÃO faz mais
 *
 * Antes esta tela fabricava um link de checkout do Stripe com um identificador
 * aleatório e oferecia mandar esse link MORTO por WhatsApp para clientes reais.
 * O projeto não tem integração Stripe (a `STRIPE_SECRET_KEY` do `.env` nunca foi
 * usada), então o painel exibia um checkout que nunca existiu.
 *
 * ## O que ele faz agora
 *
 * 1. Lê as reservas reais (`getBookings`, paginado).
 * 2. Grava/atualiza um `Payment` com `paymentUrl = /p/<crypto.randomUUID()>`.
 * 3. Só DEPOIS de gravar no banco oferece copiar ou mandar por WhatsApp.
 * 4. A página pública `/p/[token]` mostra valor, vencimento, dados do cliente
 *    e as instruções de Pix/boleto lidas de `SiteConfig`.
 *
 * TODO(stripe): quando houver integração real, trocar este fluxo por
 * Checkout Session (`POST /api/stripe/checkout`) + `/api/stripe/webhook` e
 * guardar o `sessionId` em `Payment.stripeSessionId`. Enquanto isso, o link
 * acima é um "link de cobrança interno" e a UI deixa isso explícito.
 */
import { useCallback, useMemo, useState } from 'react';
import { ArrowRight, Check, Copy, ExternalLink, Loader2, Send, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMountedLoad } from '@/components/admin/ui/useMountedLoad';
import { getBookings } from '@/actions/businessActions';
import { createPaymentLink, type PaymentLinkData } from '@/actions/adminActions';

interface BookingRow {
  id: string;
  status: string;
  totalPrice: number | null;
  startDate: string | null;
  client: { id: string; name: string; email: string };
  package: { id: string; title: string } | null;
  proposal: { id: string; title: string } | null;
}

const METHODS = ['pix', 'boleto', 'transferencia'] as const;
type Method = (typeof METHODS)[number];

/** Aceita `2500`, `2500,50`, `2.500,50`, `R$ 1.234,56`. */
function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[^\d,.-]/g, '').trim();
  if (!cleaned) return null;
  const normalized = /,\d{1,2}$/.test(cleaned) ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned.replace(/,/g, '.');
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100) / 100;
}

function defaultDueDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

export default function PaymentLinkGenerator() {
  const { t, formatCurrency } = useLanguage();
  const { toast } = useToast();

  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);

  const [bookingId, setBookingId] = useState('');
  /** 
ull = ainda não digitado (usa o total da reserva selecionada). */
  const [amountDraft, setAmountDraft] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [method, setMethod] = useState<Method>('pix');
  const [amountError, setAmountError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [link, setLink] = useState<PaymentLinkData | null>(null);
  const [copied, setCopied] = useState(false);

const loadBookings = useCallback(async () => {
    setLoadingBookings(true);
    setBookingsError(null);
    const res = await getBookings({ page: 1, pageSize: 20 });
    if (res.success) {
      setBookings((res.items ?? []) as BookingRow[]);
    } else {
      setBookings([]);
      setBookingsError(res.error ?? t('state.errorTitle'));
    }
    setLoadingBookings(false);
  }, [t]);

  useMountedLoad(loadBookings);

  const selected = useMemo(() => bookings.find((b) => b.id === bookingId) ?? null, [bookings, bookingId]);

  /**
   * Valor exibido: o que a pessoa digitou; enquanto não digitou nada, o total
   * da reserva selecionada. Estado DERIVADO (sem `useEffect`) — antes havia um
   * efeito que sobrescrevia o campo e podia apagar o que estava sendo digitado.
   */
  const amount = useMemo(() => {
    if (amountDraft !== null) return amountDraft;
    const total = selected?.totalPrice ?? 0;
    return total > 0 ? total.toFixed(2).replace('.', ',') : '';
  }, [amountDraft, selected]);

  const parsedAmount = parseAmount(amount);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setAmountError(null);

    if (!bookingId) {
      toast(t('pay.selectBooking'), 'error');
      return;
    }
    if (parsedAmount === null) {
      setAmountError(t('pay.amountInvalid'));
      return;
    }

    setSubmitting(true);
    // amount em pt-BR -> a action valida com toNumber (aceita vírgula).
    const res = await createPaymentLink({ bookingId, amount: parsedAmount, dueDate, method });
    setSubmitting(false);

    if (res.success && res.data) {
      setLink(res.data);
      await loadBookings();
      toast(t('pay.success'), 'success');
    } else {
      toast(res.error ?? t('state.errorTitle'), 'error');
    }
  };

  const absoluteLink = link ? `${typeof window === 'undefined' ? '' : window.location.origin}${link.paymentUrl}` : '';

  const handleCopy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(absoluteLink || link.paymentUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 3000);
    } catch {
      toast(t('state.errorTitle'), 'error');
    }
  };

  const whatsappHref = link
    ? `https://wa.me/?text=${encodeURIComponent(
        t('pay.whatsappMessage')
          .replace('{amount}', formatCurrency(link.amount))
          .replace('{link}', absoluteLink || link.paymentUrl),
      )}`
    : '';

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
      <header>
        <h3 className="text-sm font-medium text-[var(--admin-text-main)]">{t('pay.title')}</h3>
        <p className="mt-1 text-[11px] text-[var(--admin-text-muted)]">{t('pay.subtitle')}</p>
      </header>

      <p className="flex items-start gap-2 rounded-lg border border-[var(--admin-primary)]/30 bg-[var(--admin-primary)]/5 p-3 text-[11px] text-[var(--admin-text-muted)]">
        <TriangleAlert className="mt-0.5 w-3.5 h-3.5 shrink-0 text-[var(--admin-primary)]" />
        <span>
          <strong className="text-[var(--admin-text-main)]">Stripe não integrado.</strong> {t('pay.noStripe')}{' '}
          <span className="opacity-80">{t('pay.noStripeTodo')}</span>
        </span>
      </p>

      {link ? (
        <div className="flex flex-col gap-3 rounded-xl border border-[var(--admin-accent-green)]/30 bg-[var(--admin-bg)] p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--admin-accent-green)]/10 text-[var(--admin-accent-green)]">
              <Check className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[var(--admin-text-main)]">{t('pay.success')}</p>
              <p className="text-[10px] text-[var(--admin-text-muted)]">
                {link.clientName} · {formatCurrency(link.amount)}
                {link.packageTitle ? ` · ${link.packageTitle}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] p-2">
            <code className="flex-1 truncate bg-transparent text-[10px] text-[var(--admin-text-main)]">
              {link.paymentUrl}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              title={t('pay.copy')}
              className="shrink-0 rounded p-1.5 text-[var(--admin-primary)] transition-colors hover:bg-[var(--admin-border)]"
            >
              {copied ? <Check className="w-4 h-4 text-[var(--admin-accent-green)]" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={handleCopy}
              className="flex-1 bg-[var(--admin-primary)] text-black font-semibold hover:bg-[var(--admin-primary-hover)]"
            >
              {copied ? t('pay.copied') : t('pay.copy')}
            </Button>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#20ba5a]"
              title={t('pay.whatsapp')}
            >
              <Send className="w-3.5 h-3.5" />
              <span className="sr-only sm:not-sr-only">{t('pay.whatsapp')}</span>
            </a>
            <a
              href={link.paymentUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--admin-border)] px-3 py-2 text-xs font-semibold text-[var(--admin-text-main)] transition-colors hover:bg-[var(--admin-border)]/50"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="sr-only sm:not-sr-only">{t('pay.openPage')}</span>
            </a>
          </div>

          <button
            type="button"
            onClick={() => {
              setLink(null);
              setAmountError(null);
            }}
            className="self-start text-[10px] text-[var(--admin-text-muted)] transition-colors hover:text-[var(--admin-text-main)]"
          >
            {t('pay.another')}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pay-booking" className="text-[11px] text-[var(--admin-text-muted)]">
              {t('pay.booking')}
            </label>
            {loadingBookings ? (
              <div className="flex h-9 items-center gap-2 text-[11px] text-[var(--admin-text-muted)]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {t('state.loading')}
              </div>
            ) : bookingsError ? (
              <div className="flex flex-col gap-2 rounded-lg border border-[var(--admin-accent-red)]/40 bg-[var(--admin-accent-red)]/5 p-3 text-[11px] text-[var(--admin-text-muted)]">
                <span>{bookingsError}</span>
                <button type="button" onClick={() => void loadBookings()} className="self-start font-semibold text-[var(--admin-primary)]">
                  {t('state.retry')}
                </button>
              </div>
            ) : bookings.length === 0 ? (
              <p className="rounded-lg border border-[var(--admin-border)] p-3 text-[11px] text-[var(--admin-text-muted)]">
                {t('pay.noBooking')}
              </p>
            ) : (
              <select
                id="pay-booking"
                value={bookingId}
                onChange={(e) => {
                  setBookingId(e.target.value);
                  setAmountDraft(null);
                }}
                required
                className="h-9 w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 text-xs text-[var(--admin-text-main)] focus:border-[var(--admin-primary)] focus:outline-none"
              >
                <option value="">{t('pay.selectBooking')}</option>
                {bookings.map((booking) => (
                  <option key={booking.id} value={booking.id}>
                    {booking.client?.name ?? '—'} ·{' '}
                    {booking.package?.title ?? booking.proposal?.title ?? booking.id.slice(0, 8)}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pay-amount" className="text-[11px] text-[var(--admin-text-muted)]">
                {t('pay.amount')} *
              </label>
              <Input
                id="pay-amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  setAmountDraft(e.target.value);
                  if (amountError) setAmountError(null);
                }}
                placeholder="2.500,00"
                aria-invalid={Boolean(amountError)}
                aria-describedby={amountError ? 'pay-amount-error' : 'pay-amount-hint'}
                className="h-9 bg-[var(--admin-bg)] text-xs text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
              />
              {amountError ? (
                <span id="pay-amount-error" className="text-[10px] text-[var(--admin-accent-red)]">
                  {amountError}
                </span>
              ) : (
                <span id="pay-amount-hint" className="text-[10px] text-[var(--admin-text-muted)]">
                  {t('pay.amountHint')}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="pay-due" className="text-[11px] text-[var(--admin-text-muted)]">
                {t('pay.dueDate')}
              </label>
              <Input
                id="pay-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-9 bg-[var(--admin-bg)] text-xs text-[var(--admin-text-main)] border-[var(--admin-border)] focus:border-[var(--admin-primary)]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] text-[var(--admin-text-muted)]">{t('pay.method')}</span>
            <div className="flex gap-2">
              {METHODS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setMethod(option)}
                  className={`h-8 flex-1 rounded-lg border text-[11px] font-semibold transition-colors ${
                    method === option
                      ? 'border-[var(--admin-primary)] bg-[var(--admin-primary)] text-black'
                      : 'border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)]'
                  }`}
                >
                  {option === 'pix'
                    ? t('pay.methodPix')
                    : option === 'boleto'
                      ? t('pay.methodBoleto')
                      : t('pay.methodTransfer')}
                </button>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            disabled={submitting || loadingBookings || bookings.length === 0}
            className="w-full bg-[var(--admin-primary)] font-semibold text-black hover:bg-[var(--admin-primary-hover)]"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                {t('pay.generating')}
              </>
            ) : (
              <>
                {t('pay.generate')}
                <ArrowRight className="ml-2 w-4 h-4" />
              </>
            )}
          </Button>
        </form>
      )}
    </section>
  );
}
