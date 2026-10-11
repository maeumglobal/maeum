'use client';

import React, { useState, type FormEvent } from 'react';
import { CheckCircle2, Loader2, PhoneCall, Send } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { submitBookingInquiryAction } from '@/actions/tripPlanActions';

interface PackageRequestFormProps {
  /** Título exibido no CRM (não é traduzido: vem do painel). */
  packTitle: string;
  packSlug: string;
  /** Preço por pessoa, na moeda do registro (BRL por padrão). */
  price: number;
  currency: string;
  /** Rótulo do preço já formatado no servidor (evita divergir pt/en/es). */
  priceLabel: string;
  whatsappUrl: string;
}

const MAX_NOTES = 800;

/**
 * Formulário de solicitação de reserva de um pacote.
 *
 * `submitBookingInquiryAction` é PÚBLICA mas valida com zod, tem rate limit
 * (5 req / 10 min por IP) e campo honeypot `website` (que precisa chegar
 * vazio). O `error` devolvido é exibido em `role="status"` para leitores de
 * tela; o botão fica `disabled` durante o envio e o formulário inteiro some
 * depois do sucesso (evita envio duplicado sem `revalidatePath` no cliente).
 */
export default function PackageRequestForm({
  packTitle,
  packSlug,
  price,
  currency,
  priceLabel,
  whatsappUrl,
}: PackageRequestFormProps) {
  const { t } = useLanguage();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [participants, setParticipants] = useState(1);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    // Validação leve no cliente; a action valida de novo (fonte da verdade).
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    if (cleanName.length < 2) {
      setError(t('pacotes.detail.nameRequired'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(cleanEmail)) {
      setError(t('pacotes.detail.emailInvalid'));
      return;
    }
    if (cleanPhone.length < 6) {
      setError(t('pacotes.detail.phoneInvalid'));
      return;
    }

    setSubmitting(true);
    const result = await submitBookingInquiryAction({
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      type: 'jornada',
      itemTitle: packTitle,
      itemSlug: packSlug,
      participants: Math.max(1, Math.min(40, participants)),
      totalPrice: price > 0 ? price * Math.max(1, Math.min(40, participants)) : undefined,
      notes: notes.trim() ? `${packTitle} (${currency}) — ${notes.trim()}`.slice(0, 2000) : undefined,
      website: '',
    });
    setSubmitting(false);

    if (result.success) {
      setSent(true);
      return;
    }
    setError(result.error ?? t('pacotes.detail.sendError'));
  };

  if (sent) {
    return (
      <div className="flex flex-col gap-4">
        <p
          role="status"
          className="flex items-start gap-2 bg-green-50 border border-green-200 text-green-800 text-xs rounded-xl p-3.5 font-bold"
        >
          <CheckCircle2 aria-hidden className="h-4 w-4 shrink-0" />
          {t('pacotes.detail.requestReceived')}
        </p>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="w-full flex items-center justify-center gap-2 bg-[#25d366] hover:bg-[#20ba5a] text-white text-xs font-bold py-3.5 rounded-xl uppercase tracking-wider shadow-sm"
        >
          <PhoneCall aria-hidden className="h-4 w-4" />
          {t('pacotes.detail.directWhatsApp')}
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3" aria-busy={submitting}>
      <fieldset className="flex flex-col gap-3" disabled={submitting}>
        <legend className="sr-only">{t('pacotes.detail.formLegend')}</legend>

        <label className="flex flex-col gap-1">
          <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">
            {t('pacotes.nome-completo')} *
          </span>
          <input
            type="text"
            required
            autoComplete="name"
            maxLength={120}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t('pacotes.detalhe.nomeExemplo')}
            className="h-10 rounded-xl border border-border bg-transparent px-3 text-xs text-secondary placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-colors"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">
            {t('pacotes.detail.contactEmail')} *
          </span>
          <input
            type="email"
            required
            autoComplete="email"
            maxLength={180}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="seu@email.com"
            className="h-10 rounded-xl border border-border bg-transparent px-3 text-xs text-secondary placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-colors"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">
            {t('pacotes.detail.phoneWhatsApp')} *
          </span>
          <input
            type="tel"
            required
            autoComplete="tel"
            maxLength={40}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+55 (41) 90000-0000"
            className="h-10 rounded-xl border border-border bg-transparent px-3 text-xs text-secondary placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-colors"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">
              {t('contato.form.travelers')}
            </span>
            <input
              type="number"
              min={1}
              max={40}
              step={1}
              value={participants}
              onChange={(event) => setParticipants(Number(event.target.value) || 1)}
              className="h-10 rounded-xl border border-border bg-transparent px-3 text-xs text-secondary focus:outline-none focus:border-primary transition-colors"
            />
          </label>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">
              {t('pacotes.detail.investment')}
            </span>
            <span className="h-10 flex items-center font-heading text-sm font-bold text-primary">
              {priceLabel}
            </span>
          </div>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">
            {t('contato.form.message')}{' '}
            <span className="normal-case tracking-normal">({t('pacotes.detail.optionalHint')})</span>
          </span>
          <textarea
            rows={3}
            maxLength={MAX_NOTES}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={t('contato.form.messagePlaceholder')}
            className="rounded-xl border border-border bg-transparent px-3 py-2 text-xs text-secondary placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-colors resize-y"
          />
        </label>
      </fieldset>

      {/* Honeypot: a action rejeita qualquer valor aqui (zod `max(0)`). */}
      <div aria-hidden className="hidden">
        <label htmlFor="pacote-website">website</label>
        <input id="pacote-website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      <p role="status" aria-live="polite" className="min-h-0">
        {error ? <span className="block text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</span> : null}
      </p>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-primary hover:bg-accent-hover disabled:opacity-60 text-white rounded-xl py-3 font-bold uppercase tracking-wider text-[10px] flex items-center justify-center gap-2 transition-colors"
      >
        {submitting ? (
          <>
            <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" />
            {t('pacotes.detail.sending')}
          </>
        ) : (
          <>
            <Send aria-hidden className="h-3.5 w-3.5" />
            {t('pacotes.detail.sendRequest')}
          </>
        )}
      </button>

      <p className="text-[9px] text-muted-foreground text-center">{t('pacotes.detail.formLegendHint')}</p>
    </form>
  );
}
