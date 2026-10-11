'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Calendar, CheckCircle2, Loader2, Users, X } from 'lucide-react';
import { submitBookingInquiryAction } from '@/actions/tripPlanActions';
import { useLanguage } from '@/contexts/LanguageContext';

interface Departure {
  id: string;
  startDate: string;
  endDate: string;
  totalSpots: number;
  availableSpots: number;
  status: string;
  notes: string | null;
}

interface Props {
  journeyTitle: string;
  journeySlug: string;
  pricePerPerson: number;
  /** Moeda do catálogo (`Journey.priceCurrency`); default BRL. */
  priceCurrency?: string | null;
  nextAvailableDeparture: Departure | null;
}

/** Máscara de telefone brasileiro: é um formato, não copy traduzível. */
const PHONE_PLACEHOLDER = '+55 (11) 9 0000-0000';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const MIN_PARTICIPANTS = 1;
const MAX_PARTICIPANTS = 20;

/** Substitui `{chave}` em um template do dicionário por valores reais. */
const fill = (template: string, vars: Record<string, string>): string =>
  template.replace(/\{(\w+)\}/g, (whole, key: string) => vars[key] ?? whole);

export default function JornadaBookingWidget({
  journeyTitle,
  journeySlug,
  pricePerPerson,
  priceCurrency,
  nextAvailableDeparture,
}: Props) {
  const { t, formatDate, formatNumber, formatCurrency } = useLanguage();

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [participants, setParticipants] = useState(MIN_PARTICIPANTS);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);

  const basePriceId = useId();
  const nameId = useId();
  const emailId = useId();
  const phoneId = useId();
  const notesId = useId();
  const participantsId = useId();

  const currency = priceCurrency || 'BRL';
  const unitPrice = formatCurrency(pricePerPerson, currency);
  const totalPrice = pricePerPerson * participants;
  const totalFormatted = formatCurrency(totalPrice, currency);
  const departureDate = nextAvailableDeparture
    ? formatDate(nextAvailableDeparture.startDate, { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const closeModal = useCallback(() => {
    setShowModal(false);
    // Devolve o foco ao gatilho que abriu o diálogo.
    window.requestAnimationFrame(() => openButtonRef.current?.focus());
  }, []);

  const openModal = useCallback(() => {
    setError('');
    setShowModal(true);
  }, []);

  /* Foco no primeiro campo + `Esc` fecha + trava o scroll do body. */
  useEffect(() => {
    if (!showModal) return;

    firstFieldRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setShowModal(false);
        window.requestAnimationFrame(() => openButtonRef.current?.focus());
        return;
      }
      if (event.key !== 'Tab') return;

      /* Focus trap: mantém o Tab dentro do diálogo. */
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [showModal]);

  const validate = (): boolean => {
    if (name.trim().length < 2) {
      setError(t('detalhe.booking.invalidName'));
      return false;
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError(t('detalhe.booking.invalidEmail'));
      return false;
    }
    if (phone.replace(/\D/g, '').length < 8) {
      setError(t('detalhe.booking.invalidPhone'));
      return false;
    }
    if (participants < MIN_PARTICIPANTS || participants > MAX_PARTICIPANTS) {
      setError(t('detalhe.booking.invalidParticipants'));
      return false;
    }
    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const result = await submitBookingInquiryAction({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        type: 'jornada',
        itemTitle: journeyTitle,
        itemSlug: journeySlug,
        date: nextAvailableDeparture?.startDate?.slice(0, 10) || undefined,
        participants,
        totalPrice,
        notes: notes.trim() || undefined,
      });

      if (result.success) {
        setSuccess(true);
        setName('');
        setEmail('');
        setPhone('');
        setNotes('');
        setParticipants(MIN_PARTICIPANTS);
      } else {
        setError(result.error || t('detalhe.booking.genericError'));
      }
    } catch {
      setError(t('detalhe.booking.genericError'));
    } finally {
      setSubmitting(false);
    }
  };

  const requestLabel = t('detalhe.booking.requestBooking');

  return (
    <>
      {/* Sidebar card */}
      <div className="lg:sticky lg:top-28 border border-border rounded-3xl p-6 md:p-8 bg-card shadow-sm">
        <div className="flex items-baseline gap-1.5 mb-2">
          <span className="font-heading text-3xl font-bold text-secondary">{unitPrice}</span>
          <span className="text-sm text-muted-foreground">{t('detalhe.pessoa-x')}</span>
        </div>

        <div className="space-y-5 mt-6">
          {/* Quantidade de participantes */}
          <div>
            <span
              id={participantsId}
              className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block"
            >
              <span className="flex items-center gap-1.5">
                <Users aria-hidden className="h-3.5 w-3.5" />
                <span>{t('detalhe.participantes')}</span>
              </span>
            </span>
            <div
              role="group"
              aria-labelledby={participantsId}
              className="flex items-center justify-between border border-border rounded-xl px-4 h-10"
            >
              <button
                type="button"
                onClick={() =>
                  setParticipants((value) => Math.max(MIN_PARTICIPANTS, value - 1))
                }
                disabled={participants <= MIN_PARTICIPANTS}
                aria-label={t('detalhe.booking.decrease')}
                className="text-secondary hover:text-primary transition-colors text-lg font-medium leading-none disabled:opacity-30"
              >
                &minus;
              </button>
              <span aria-live="polite" className="text-sm font-semibold text-secondary">
                {formatNumber(participants)}
              </span>
              <button
                type="button"
                onClick={() =>
                  setParticipants((value) => Math.min(MAX_PARTICIPANTS, value + 1))
                }
                disabled={participants >= MAX_PARTICIPANTS}
                aria-label={t('detalhe.booking.increase')}
                className="text-secondary hover:text-primary transition-colors text-lg font-medium leading-none disabled:opacity-30"
              >
                +
              </button>
            </div>
          </div>

          {/* Próxima saída */}
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
              {nextAvailableDeparture
                ? t('detalhe.proxima-saida-disponivel')
                : t('coreia.jornadas.departuresEmptyTitle')}
            </div>
            {nextAvailableDeparture ? (
              <>
                <div className="flex items-center gap-2 text-sm text-secondary font-medium">
                  <Calendar aria-hidden className="h-4 w-4 shrink-0 text-accent" />
                  <span>{departureDate}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <Users aria-hidden className="h-3.5 w-3.5 shrink-0 text-accent" />
                  <span>
                    {formatNumber(nextAvailableDeparture.availableSpots)}{' '}
                    {t('detalhe.vagas-restantes')}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('coreia.jornadas.departuresEmptyDescription')}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between text-sm border-t border-border pt-4">
            <label htmlFor={basePriceId} className="text-muted-foreground">
              {t('detalhe.booking.total')}
            </label>
            <span id={basePriceId} className="font-heading font-bold text-lg text-secondary">
              {totalFormatted}
            </span>
          </div>

          <button
            ref={openButtonRef}
            type="button"
            onClick={openModal}
            className="w-full bg-primary hover:bg-accent-hover text-white text-sm font-bold py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            {t('detalhe.solicitar-reserva')}
          </button>

          <div className="text-center space-y-1.5">
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              {t('detalhe.package.paymentTerms')}
            </p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              {t('detalhe.package.installmentSurcharge')}
            </p>
          </div>
        </div>
      </div>

      {/* Mobile sticky bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border px-4 py-3 md:hidden shadow-lg">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <span className="font-heading text-xl font-bold text-secondary">{unitPrice}</span>
            <span className="text-xs text-muted-foreground ml-1">{t('detalhe.pessoa-x')}</span>
          </div>
          <button
            type="button"
            onClick={openModal}
            className="bg-primary hover:bg-accent-hover text-white text-sm font-bold px-6 py-3 rounded-xl transition-all shadow-sm active:scale-[0.98]"
          >
            {t('detalhe.solicitar-reserva')}
          </button>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowModal(false);
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${basePriceId}-title`}
            className="w-full max-w-md bg-white rounded-3xl p-6 md:p-8 shadow-2xl max-h-[90dvh] overflow-y-auto"
          >
            {success ? (
              <div className="flex flex-col items-center text-center py-6" aria-live="polite">
                <CheckCircle2 aria-hidden className="h-14 w-14 text-green-500 mb-4" />
                <h3
                  id={`${basePriceId}-title`}
                  className="font-heading text-2xl font-light text-secondary mb-2"
                >
                  {t('detalhe.booking.successTitle')}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {fill(t('detalhe.booking.successBody'), { item: journeyTitle })}
                </p>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={() => {
                    setSuccess(false);
                    closeModal();
                  }}
                  className="mt-6 px-8 py-3 bg-primary text-white text-sm font-bold rounded-xl hover:bg-accent-hover transition-all"
                >
                  {t('detalhe.booking.close')}
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <h3
                      id={`${basePriceId}-title`}
                      className="font-heading text-xl font-light text-secondary"
                    >
                      {requestLabel}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {journeyTitle}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeModal}
                    aria-label={t('detalhe.booking.close')}
                    className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-secondary"
                  >
                    <X aria-hidden className="h-5 w-5" />
                  </button>
                </div>

                {/* Resumo */}
                <div className="bg-muted/40 rounded-2xl p-4 mb-5 text-sm flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">
                    {t('detalhe.booking.journeyLabel')} ·{' '}
                    {departureDate ?? t('detalhe.booking.dateTbd')}
                  </span>
                  <span className="font-heading font-bold text-secondary shrink-0">
                    {totalFormatted}
                  </span>
                </div>

                {/* Resultado do envio, anunciado para leitores de tela */}
                <p aria-live="assertive" role="status" className="sr-only">
                  {error}
                </p>

                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  <div>
                    <span
                      id={`${participantsId}-modal-label`}
                      className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block"
                    >
                      {t('detalhe.participantes')}
                    </span>
                    <div
                      role="group"
                      aria-labelledby={`${participantsId}-modal-label`}
                      className="flex items-center justify-between border border-border rounded-xl px-4 h-10"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setParticipants((value) => Math.max(MIN_PARTICIPANTS, value - 1))
                        }
                        disabled={participants <= MIN_PARTICIPANTS || submitting}
                        aria-label={t('detalhe.booking.decrease')}
                        className="text-secondary hover:text-primary transition-colors text-lg font-medium leading-none disabled:opacity-30"
                      >
                        &minus;
                      </button>
                      <span className="text-sm font-semibold text-secondary">
                        {formatNumber(participants)}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setParticipants((value) => Math.min(MAX_PARTICIPANTS, value + 1))
                        }
                        disabled={participants >= MAX_PARTICIPANTS || submitting}
                        aria-label={t('detalhe.booking.increase')}
                        className="text-secondary hover:text-primary transition-colors text-lg font-medium leading-none disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor={nameId}
                      className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block"
                    >
                      {t('detalhe.booking.fullName')}
                    </label>
                    <input
                      ref={firstFieldRef}
                      id={nameId}
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      maxLength={120}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder={t('detalhe.booking.namePlaceholder')}
                      className="w-full h-10 px-3 rounded-xl border border-border bg-transparent text-sm text-secondary placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={emailId}
                      className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block"
                    >
                      {t('detalhe.booking.email')}
                    </label>
                    <input
                      id={emailId}
                      name="email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      required
                      maxLength={180}
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="seu@email.com"
                      className="w-full h-10 px-3 rounded-xl border border-border bg-transparent text-sm text-secondary placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={phoneId}
                      className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block"
                    >
                      {t('detalhe.booking.whatsapp')}
                    </label>
                    <input
                      id={phoneId}
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      required
                      maxLength={40}
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder={PHONE_PLACEHOLDER}
                      className="w-full h-10 px-3 rounded-xl border border-border bg-transparent text-sm text-secondary placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={notesId}
                      className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block"
                    >
                      {t('detalhe.observacoes')}
                    </label>
                    <textarea
                      id={notesId}
                      name="notes"
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      rows={2}
                      maxLength={2000}
                      placeholder={t('detalhe.booking.notesPlaceholder')}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-transparent text-sm text-secondary placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-colors resize-none"
                    />
                  </div>

                  {error && (
                    <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-primary hover:bg-accent-hover disabled:opacity-60 text-white text-sm font-bold py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                        {t('detalhe.enviando')}
                      </>
                    ) : (
                      t('detalhe.booking.confirm')
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
