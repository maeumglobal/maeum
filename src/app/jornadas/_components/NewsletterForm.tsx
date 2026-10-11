'use client';

import React, { useState, type FormEvent } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { submitNewsletterAction } from '@/actions/tripPlanActions';

/**
 * Newsletter da sidebar de `/jornadas`.
 *
 * `submitNewsletterAction` é pública com rate limit (5 req / 10 min por IP) e
 * devolve `{ success, message?, error? }` — as duas mensagens traduzidas ficam
 * no dicionário (`jornadas.newsletter.*`).
 */
export default function NewsletterForm() {
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(value)) {
      setStatus({ kind: 'error', text: t('pacotes.detail.emailInvalid') });
      return;
    }

    setSubmitting(true);
    const result = await submitNewsletterAction(value);
    setSubmitting(false);

    if (result.success) {
      setEmail('');
      setStatus({ kind: 'ok', text: result.message ?? t('jornadas.newsletter.success') });
      return;
    }
    setStatus({ kind: 'error', text: result.error ?? t('jornadas.newsletter.error') });
  };

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit} noValidate aria-busy={submitting}>
      <label htmlFor="jornadas-newsletter-email" className="sr-only">
        {t('jornadas.newsletter.emailLabel')}
      </label>
      <input
        id="jornadas-newsletter-email"
        type="email"
        required
        maxLength={180}
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder={t('jornadas.newsletter.placeholder')}
        disabled={submitting}
        className="w-full bg-[#150E0C] border border-[#3D2620] text-white text-[12px] px-4 py-3 placeholder:text-gray-500 focus:outline-none focus:border-[#C8A27C] transition-colors rounded-none disabled:opacity-60"
      />

      <p role="status" aria-live="polite">
        {status ? (
          <span
            className={`flex items-start gap-2 text-[11px] border px-3 py-2 ${
              status.kind === 'ok'
                ? 'text-green-400 border-green-700/30 bg-green-900/20'
                : 'text-red-400 border-red-700/30 bg-red-900/20'
            }`}
          >
            {status.kind === 'ok' ? <CheckCircle2 aria-hidden className="h-4 w-4 shrink-0" /> : null}
            {status.text}
          </span>
        ) : null}
      </p>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-[#C8A27C] hover:bg-[#B8906C] disabled:opacity-60 text-[#0F0A08] font-bold text-[10px] py-3.5 px-4 rounded-none transition-all uppercase tracking-widest flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" />
            {t('jornadas.newsletter.sending')}
          </>
        ) : (
          t('jornadas.newsletter.cta')
        )}
      </button>
    </form>
  );
}
