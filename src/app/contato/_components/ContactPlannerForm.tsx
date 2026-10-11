'use client';

import React, { useState, type FormEvent } from 'react';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { submitTripPlanAction } from '@/actions/tripPlanActions';

const inputClass =
  'h-10 rounded-xl border border-border bg-transparent px-3 text-xs text-secondary placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-colors';

const labelClass = 'text-[9px] uppercase font-bold text-muted-foreground tracking-widest';

const TRIP_TYPES = [
  { value: 'ida_volta', labelKey: 'contato.form.tripType.roundTrip' },
  { value: 'so_ida', labelKey: 'contato.form.tripType.oneWay' },
] as const;

const MAX_MESSAGE = 2000;

/**
 * Formulário público de planejamento de viagem (`submitTripPlanAction`).
 *
 * A action é pública com zod, rate limit (5 req / 10 min por IP) e honeypot
 * `website`. `tripType` decide se `returnDate` é obrigatório — a mesma regra do
 * `refine` do schema, replicada aqui só para dar retorno imediato.
 */
export default function ContactPlannerForm() {
  const { t } = useLanguage();

  const [tripType, setTripType] = useState<'ida_volta' | 'so_ida'>('ida_volta');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') ?? '').trim();
    const email = String(data.get('email') ?? '').trim();
    const phone = String(data.get('phone') ?? '').replace(/[^\d+]/g, '');
    const departDate = String(data.get('departDate') ?? '').trim();
    const returnDate = String(data.get('returnDate') ?? '').trim();
    const travelers = Number(String(data.get('travelers') ?? '1').replace(/[^\d]/g, '')) || 1;

    if (name.length < 2) {
      setError(t('pacotes.detail.nameRequired'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) {
      setError(t('pacotes.detail.emailInvalid'));
      return;
    }
    if (tripType === 'ida_volta' && !returnDate) {
      setError(t('contato.form.returnDateRequired'));
      return;
    }
    if (returnDate && departDate && returnDate < departDate) {
      setError(t('contato.form.returnDateAfterDepart'));
      return;
    }

    setSubmitting(true);
    const result = await submitTripPlanAction({
      name,
      email,
      phone,
      tripType,
      departDate,
      returnDate: tripType === 'ida_volta' ? returnDate : '',
      travelers,
      budgetPerPerson: String(data.get('budgetPerPerson') ?? '').trim(),
      interests: String(data.get('interests') ?? '').trim(),
      message: String(data.get('message') ?? '').trim(),
      website: String(data.get('website') ?? ''),
    });
    setSubmitting(false);

    if (result.success) {
      setSent(true);
      return;
    }
    setError(result.error ?? t('contato.form.error'));
  };

  if (sent) {
    return (
      <div
        role="status"
        className="flex items-start gap-3 border border-border bg-card rounded-3xl p-8"
      >
        <CheckCircle2 aria-hidden className="h-6 w-6 shrink-0 text-green-600" />
        <div>
          <p className="font-heading text-2xl font-light text-secondary">
            {t('contato.form.sentTitle')}
          </p>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {t('contato.form.sentDescription')}
          </p>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="mt-5 text-xs font-semibold text-primary hover:text-accent-hover transition-colors"
          >
            {t('contato.form.another')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4" aria-busy={submitting}>
      <fieldset className="flex flex-col gap-4" disabled={submitting}>
        <legend className="sr-only">{t('contato.cta.requestPlan')}</legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>
              {t('contato.form.name')} *
            </span>
            <input name="name" type="text" required autoComplete="name" maxLength={120} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>
              {t('contato.form.email')} *
            </span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              maxLength={180}
              placeholder="seu@email.com"
              className={inputClass}
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>
              {t('contato.form.phone')}{' '}
              <span className="normal-case tracking-normal">({t('pacotes.detail.optionalHint')})</span>
            </span>
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              maxLength={40}
              placeholder="+55 (41) 90000-0000"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>{t('contato.form.tripType')}</span>
            <select
              name="tripType"
              value={tripType}
              onChange={(event) => setTripType(event.target.value === 'so_ida' ? 'so_ida' : 'ida_volta')}
              className={inputClass}
            >
              {TRIP_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>
              {t('contato.form.departDate')} *
            </span>
            <input name="departDate" type="date" required className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>
              {t('contato.form.returnDate')}
              {tripType === 'ida_volta' ? ' *' : ''}
            </span>
            <input name="returnDate" type="date" required={tripType === 'ida_volta'} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>
              {t('contato.form.travelers')} *
            </span>
            <input
              name="travelers"
              type="number"
              min={1}
              max={40}
              step={1}
              defaultValue={1}
              required
              className={inputClass}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className={labelClass}>
            {t('contato.form.budget')}{' '}
            <span className="normal-case tracking-normal">({t('pacotes.detail.optionalHint')})</span>
          </span>
          <input name="budgetPerPerson" type="text" inputMode="decimal" maxLength={40} placeholder="25.000" className={inputClass} />
        </label>

        <label className="flex flex-col gap-1">
          <span className={labelClass}>
            {t('contato.form.interests')}{' '}
            <span className="normal-case tracking-normal">({t('pacotes.detail.optionalHint')})</span>
          </span>
          <input
            name="interests"
            type="text"
            maxLength={400}
            placeholder={t('contato.form.interestsPlaceholder')}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className={labelClass}>
            {t('contato.form.message')}{' '}
            <span className="normal-case tracking-normal">({t('pacotes.detail.optionalHint')})</span>
          </span>
          <textarea
            name="message"
            rows={4}
            maxLength={MAX_MESSAGE}
            placeholder={t('contato.form.messagePlaceholder')}
            className="rounded-xl border border-border bg-transparent px-3 py-2 text-xs text-secondary placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-colors resize-y"
          />
        </label>
      </fieldset>

      {/* Honeypot: a action rejeita qualquer valor aqui (zod `max(0)`). */}
      <div aria-hidden className="hidden">
        <label htmlFor="contato-website">website</label>
        <input
          id="contato-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      <p role="status" aria-live="polite" aria-label={t('contato.form.statusRegion')}>
        {error ? <span className="block text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</span> : null}
      </p>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-primary hover:bg-accent-hover disabled:opacity-60 text-white rounded-full py-3.5 font-bold uppercase tracking-wider text-[10px] flex items-center justify-center gap-2 transition-all shadow-sm"
      >
        {submitting ? (
          <>
            <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" />
            {t('contato.form.sending')}
          </>
        ) : (
          <>
            <Send aria-hidden className="h-3.5 w-3.5" />
            {t('contato.form.submit')}
          </>
        )}
      </button>

      <p className="text-[9px] text-muted-foreground text-center">{t('contato.form.requiredHint')}</p>
    </form>
  );
}
