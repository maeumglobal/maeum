'use client';

import React, { useMemo, useState, type FormEvent } from 'react';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { submitExchangeInquiryAction } from '@/actions/tripPlanActions';

export interface ExchangeOption {
  value: string;
  label: string;
}

interface ExchangeInquiryFormProps {
  campuses: ExchangeOption[];
  programs: ExchangeOption[];
}

const LEVELS = [
  { value: 'beginner', labelKey: 'intercambios.iniciante' },
  { value: 'basic', labelKey: 'intercambios.basico' },
  { value: 'intermediate', labelKey: 'intercambios.intermediario' },
  { value: 'advanced', labelKey: 'intercambios.avancado' },
  { value: 'fluent', labelKey: 'intercambios.fluente' },
] as const;

const LANGUAGES = [
  { value: 'Português', labelKey: 'intercambios.form.languagePt' },
  { value: 'English', labelKey: 'intercambios.form.languageEn' },
  { value: 'Español', labelKey: 'intercambios.form.languageEs' },
] as const;

const inputClass =
  'h-10 rounded-xl border border-border bg-transparent px-3 text-xs text-secondary placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-colors';

const labelClass = 'text-[9px] uppercase font-bold text-muted-foreground tracking-widest';

/**
 * Formulário público de solicitação de intercâmbio.
 *
 * `submitExchangeInquiryAction` valida com zod, tem rate limit (5 req / 10 min
 * por IP) e honeypot `website`. Os campos booleanos são enviados APENAS quando
 * marcados — `z.coerce.boolean()` trataria a string "false" como `true`.
 */
export default function ExchangeInquiryForm({ campuses, programs }: ExchangeInquiryFormProps) {
  const { t } = useLanguage();

  const [campus, setCampus] = useState('');
  const [program, setProgram] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const programOptions = useMemo(
    () => programs.filter((option) => !campus || option.value.startsWith(`${campus}::`)),
    [programs, campus],
  );

  const campusLabel = useMemo(
    () => campuses.find((option) => option.value === campus)?.label ?? '',
    [campuses, campus],
  );
  const programLabel = useMemo(
    () => programs.find((option) => option.value === program)?.label ?? '',
    [programs, program],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const form = event.currentTarget;
    const data = new FormData(form);
    const nome = String(data.get('nome') ?? '').trim();
    const email = String(data.get('email') ?? '').trim();
    const phone = String(data.get('phone') ?? '').replace(/[^\d+]/g, '');

    if (nome.length < 2) {
      setError(t('intercambios.nome-completo'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) {
      setError(t('intercambios.korea.form.email'));
      return;
    }
    if (phone.length < 6) {
      setError(t('intercambios.korea.form.phoneWhatsapp'));
      return;
    }

    setSubmitting(true);
    const result = await submitExchangeInquiryAction({
      nome,
      email,
      phone,
      pais: String(data.get('pais') ?? '').trim(),
      idioma: String(data.get('idioma') ?? '').trim(),
      idade: String(data.get('idade') ?? '').trim(),
      campusName: campusLabel,
      cursoName: programLabel,
      nivel: String(data.get('nivel') ?? '').trim(),
      semanas: String(data.get('semanas') ?? '').trim(),
      periodo: String(data.get('periodo') ?? '').trim(),
      // Só envia o que está marcado (ver nota do cabeçalho).
      ...(data.get('hospedagem') ? { hospedagem: true } : {}),
      ...(data.get('seguro') ? { seguro: true } : {}),
      ...(data.get('transfer') ? { transfer: true } : {}),
      observacoes: String(data.get('observacoes') ?? '').trim(),
      website: String(data.get('website') ?? ''),
    });
    setSubmitting(false);

    if (result.success) {
      setSent(true);
      return;
    }
    setError(result.error ?? t('intercambios.form.error'));
  };

  if (sent) {
    return (
      <div className="flex flex-col gap-4">
        <div
          role="status"
          className="flex items-start gap-3 border border-border bg-muted/40 rounded-2xl p-5"
        >
          <CheckCircle2 aria-hidden className="h-5 w-5 shrink-0 text-green-600" />
          <div>
            <p className="font-heading text-lg font-light text-secondary">
              {t('intercambios.form.successTitle')}
            </p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {t('intercambios.form.sentDescription')}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="text-xs font-semibold text-primary hover:text-accent-hover transition-colors w-fit"
        >
          {t('intercambios.form.another')}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4" aria-busy={submitting}>
      <fieldset className="flex flex-col gap-4" disabled={submitting}>
        <legend className="sr-only">{t('intercambios.programs.formTitle')}</legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>{t('intercambios.nome-completo')}</span>
            <input
              name="nome"
              type="text"
              required
              autoComplete="name"
              maxLength={120}
              placeholder={t('intercambios.seu-nome-completo')}
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className={labelClass}>{t('intercambios.korea.form.email')}</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              maxLength={180}
              placeholder={t('intercambios.korea.form.emailPlaceholder')}
              className={inputClass}
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>{t('intercambios.korea.form.phoneWhatsapp')}</span>
            <input
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              maxLength={40}
              placeholder="+55 (41) 90000-0000"
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className={labelClass}>{t('intercambios.pais-de-residencia')}</span>
            <input
              name="pais"
              type="text"
              maxLength={80}
              defaultValue={t('intercambios.brasil')}
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className={labelClass}>{t('intercambios.idade')}</span>
            <input
              name="idade"
              type="number"
              min={10}
              max={99}
              maxLength={10}
              placeholder={t('intercambios.sua-idade')}
              className={inputClass}
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>{t('intercambios.idioma-de-atendimento')}</span>
            <select name="idioma" defaultValue="Português" className={inputClass}>
              {LANGUAGES.map((language) => (
                <option key={language.value} value={language.value}>
                  {t(language.labelKey)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className={labelClass}>{t('intercambios.nivel-atual-de-coreano')}</span>
            <select name="nivel" defaultValue="beginner" className={inputClass}>
              {LEVELS.map((level) => (
                <option key={level.value} value={t(level.labelKey)}>
                  {t(level.labelKey)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>{t('intercambios.campus-de-interesse')}</span>
            <select
              value={campus}
              onChange={(event) => {
                setCampus(event.target.value);
                setProgram('');
              }}
              className={inputClass}
            >
              <option value="">{t('intercambios.selecione-um-campus')}</option>
              {campuses.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className={labelClass}>{t('intercambios.curso-de-interesse')}</span>
            <select
              value={program}
              onChange={(event) => setProgram(event.target.value)}
              className={inputClass}
            >
              <option value="">{t('intercambios.selecione-um-curso')}</option>
              {programOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>{t('intercambios.quantidade-de-semanas')}</span>
            <input
              name="semanas"
              type="number"
              min={1}
              max={104}
              maxLength={20}
              placeholder={t('intercambios.ex-4')}
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className={labelClass}>{t('intercambios.periodo-pretendido')}</span>
            <input
              name="periodo"
              type="text"
              maxLength={80}
              placeholder={t('intercambios.ex-janeiro-2027')}
              className={inputClass}
            />
          </label>
        </div>

        <fieldset className="flex flex-col gap-2 border border-border rounded-2xl p-4">
          <legend className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest px-1">
            {t('intercambios.form.benefit3')}
          </legend>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {[
              { name: 'hospedagem', labelKey: 'intercambios.interesse-em-hospedagem' },
              { name: 'seguro', labelKey: 'intercambios.interesse-em-seguro-viagem' },
              { name: 'transfer', labelKey: 'intercambios.interesse-em-transfer' },
            ].map((item) => (
              <label key={item.name} className="flex items-center gap-2 text-xs text-secondary">
                <input
                  type="checkbox"
                  name={item.name}
                  value="true"
                  className="h-4 w-4 rounded border-border accent-[var(--primary)]"
                />
                {t(item.labelKey)}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex flex-col gap-1">
          <span className={labelClass}>{t('intercambios.observacoes')}</span>
          <textarea
            name="observacoes"
            rows={4}
            maxLength={2000}
            placeholder={t('intercambios.form.notesPlaceholder')}
            className="rounded-xl border border-border bg-transparent px-3 py-2 text-xs text-secondary placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-colors resize-y"
          />
        </label>
      </fieldset>

      {/* Honeypot: a action rejeita qualquer valor aqui (zod `max(0)`). */}
      <div aria-hidden className="hidden">
        <label htmlFor="intercambio-website">website</label>
        <input
          id="intercambio-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      <p role="status" aria-live="polite">
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
            {t('intercambios.korea.form.submitting')}
          </>
        ) : (
          <>
            <Send aria-hidden className="h-3.5 w-3.5" />
            {t('intercambios.form.submit')}
          </>
        )}
      </button>

      <p className="text-[9px] text-muted-foreground text-center">{t('intercambios.form.requiredHint')}</p>
    </form>
  );
}
