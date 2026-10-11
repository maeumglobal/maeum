'use client';

import { useMemo, useState, type FormEvent } from 'react';
import {
  Calendar, Users, DollarSign, Heart, ArrowRight, MessageSquare,
  ChevronLeft, ChevronRight, Check, Loader2,
} from 'lucide-react';
import { submitTripPlanAction } from '@/actions/tripPlanActions';
import { useLanguage } from '@/contexts/LanguageContext';
import { htmlLang, type Locale } from '@/i18n/config';

/** Faixas de orçamento em BRL. O texto exibido vem do dicionário (`t`). */
const BUDGET_RANGES = [10000, 15000, 20000, 30000, 40000, 50000] as const;
const BUDGET_KEYS = [
  'Até R$ 10 mil',
  'R$ 10 mil – R$ 15 mil',
  'R$ 15 mil – R$ 20 mil',
  'R$ 20 mil – R$ 30 mil',
  'R$ 30 mil – R$ 40 mil',
  'R$ 40 mil – R$ 50 mil',
  'Acima de R$ 50 mil',
] as const;

const INTEREST_KEYS = [
  'Lua de mel / Casal',
  'Lazer e Turismo',
  'K-Pop & Entretenimento',
  'Compras & Moda',
  'Gastronomia Coreana',
  'Cultura e Tradição',
  'Intercâmbio de Idiomas',
  'K-Beauty & Skincare',
  'Aventura e Natureza',
  'Família com Crianças',
  'Roteiro Solo',
  'Grupo de Amigos',
] as const;

function toISODate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Mês/ano no idioma do visitante (`Intl`, sem dependência extra). */
function monthLabel(locale: Locale, monthIndex: number, year: number): string {
  const tag = htmlLang[locale];
  const month = new Intl.DateTimeFormat(tag, { month: 'long' }).format(
    new Date(year, monthIndex, 1),
  );
  return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${year}`;
}

/** Iniciais dos dias da semana na ordem local (domingo primeiro). */
function weekdayLabels(locale: Locale): string[] {
  const tag = htmlLang[locale];
  // 2024-01-07 foi um domingo.
  return Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(tag, { weekday: 'narrow' }).format(new Date(2024, 0, 7 + index)),
  );
}

/** Data no formato curto do idioma do visitante. */
function formatDate(locale: Locale, iso: string): string {
  if (!iso) return '';
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return iso;
  return new Intl.DateTimeFormat(htmlLang[locale], {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
}

export default function TripPlanner() {
  const { t, locale } = useLanguage();
  const [tripType, setTripType] = useState<'ida_volta' | 'so_ida'>('ida_volta');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [travelers, setTravelers] = useState(2);
  const [budget, setBudget] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [message, setMessage] = useState('');

  const [departDate, setDepartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [pickerFor, setPickerFor] = useState<'depart' | 'return' | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const isRT = tripType === 'ida_volta';

  const toggleInterest = (key: string) =>
    setInterests((prev) => (prev.includes(key) ? prev.filter((i) => i !== key) : [...prev, key]));

  // "Hoje" é lido uma vez no mount: evitahydration mismatch e recálculo por render.
  const [today] = useState(() => new Date());
  const nowIso = useMemo(() => toISODate(today.getFullYear(), today.getMonth(), today.getDate()), [today]);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // Rótulos derivados do idioma — memoizados para não refazer `Intl` a cada render.
  const weekdays = useMemo(() => weekdayLabels(locale), [locale]);
  const monthTitle = useMemo(() => monthLabel(locale, viewMonth, viewYear), [locale, viewMonth, viewYear]);
  const departLabel = useMemo(() => formatDate(locale, departDate), [locale, departDate]);
  const returnLabel = useMemo(() => formatDate(locale, returnDate), [locale, returnDate]);

  const openPicker = (forWhich: 'depart' | 'return') => {
    const base = forWhich === 'return' && returnDate ? new Date(`${returnDate}T00:00:00`) : today;
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    setPickerFor(forWhich);
  };

  const handleSelectDate = (year: number, month: number, day: number) => {
    const iso = toISODate(year, month, day);
    if (pickerFor === 'depart') {
      setDepartDate(iso);
      setReturnDate('');
      setPickerFor(isRT ? 'return' : null);
    } else {
      setReturnDate(iso);
      setPickerFor(null);
    }
  };

  const isSelectable = (iso: string) => {
    if (iso < nowIso) return false;
    if (pickerFor === 'return' && departDate && iso <= departDate) return false;
    return true;
  };

  // A grade do mês só é recalculada quando muda o mês/ano em exibição.
  const calendarCells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i += 1) cells.push(null);
    for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);
    return cells;
  }, [viewYear, viewMonth]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!departDate) {
      setError(t('Selecione a data de ida.'));
      return;
    }
    if (isRT && !returnDate) {
      setError(t('Selecione a data de volta.'));
      return;
    }
    setSubmitting(true);
    const res = await submitTripPlanAction({
      name,
      email,
      phone,
      tripType,
      departDate,
      returnDate: isRT ? returnDate : undefined,
      travelers,
      budgetPerPerson: budget || undefined,
      interests: interests.join(', '),
      message,
    });
    setSubmitting(false);
    if (res.success) setDone(true);
    else setError(res.error || t('Erro ao enviar. Tente novamente.'));
  };

  const reset = () => {
    setDone(false);
    setName(''); setEmail(''); setPhone('');
    setTravelers(2); setBudget(''); setInterests([]); setMessage('');
    setDepartDate(''); setReturnDate(''); setPickerFor(null); setError('');
  };

  const renderCalendar = () => {
    if (!pickerFor) return null;

    const prev = () => {
      if (viewMonth === 0) {
        setViewMonth(11);
        setViewYear(viewYear - 1);
      } else {
        setViewMonth(viewMonth - 1);
      }
    };

    const next = () => {
      if (viewMonth === 11) {
        setViewMonth(0);
        setViewYear(viewYear + 1);
      } else {
        setViewMonth(viewMonth + 1);
      }
    };

    return (
      <div
        className="absolute left-0 top-full z-[100] mt-2 w-full min-w-[300px] animate-in fade-in slide-in-from-top-2 rounded-lg border border-[#3D2620] bg-[#150E0C] p-4 shadow-2xl duration-150"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={prev}
            aria-label={t('Mês anterior')}
            className="rounded-md p-1.5 text-white/60 transition-colors hover:bg-white/5 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#C8A27C]">
            {monthTitle}
          </span>
          <button
            type="button"
            onClick={next}
            aria-label={t('Próximo mês')}
            className="rounded-md p-1.5 text-white/60 transition-colors hover:bg-white/5 hover:text-white"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mb-1 grid grid-cols-7 gap-1">
          {weekdays.map((label, index) => (
            <span key={`wd-${index}`} className="text-center text-[8px] font-bold text-white/30">
              {label}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarCells.map((day, index) => {
            if (day === null) return <span key={`empty-${index}`} />;
            const iso = toISODate(viewYear, viewMonth, day);
            const selectable = isSelectable(iso);
            const isSelected = iso === departDate || iso === returnDate;
            const isRange = Boolean(departDate && returnDate && iso > departDate && iso < returnDate);

            return (
              <button
                key={`day-${day}`}
                type="button"
                disabled={!selectable}
                onClick={() => handleSelectDate(viewYear, viewMonth, day)}
                className={`flex h-9 items-center justify-center text-[11px] font-medium transition ${
                  isSelected
                    ? 'bg-[#C8A27C] font-bold text-[#0F0A08]'
                    : isRange
                      ? 'bg-[#C8A27C]/15 text-white'
                      : selectable
                        ? 'text-white/80 hover:bg-white/5'
                        : 'cursor-not-allowed text-white/20'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-center gap-4 border-t border-[#3D2620] pt-3 text-[9px] font-semibold uppercase tracking-wider text-gray-500">
          {pickerFor === 'depart' ? t('Selecione a data de ida') : t('Selecione a data de volta')}
        </div>
      </div>
    );
  };

  if (done) {
    return (
      <div className="flex animate-in fade-in flex-col items-center justify-center py-10 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#C8A27C]/40 bg-[#C8A27C]/15">
          <Check className="h-8 w-8 text-[#C8A27C]" aria-hidden="true" />
        </div>
        <h3 className="mb-3 font-heading text-2xl font-light text-white">{t('Planejamento recebido!')}</h3>
        <p className="mb-8 max-w-sm text-[12px] font-light leading-relaxed text-gray-400">
          {t(
            'Uma consultora Maeum vai entrar em contato com você em breve para personalizar sua viagem.',
          )}
        </p>
        <button
          type="button"
          onClick={reset}
          className="border-b border-[#C8A27C]/40 pb-1 text-[10px] font-bold uppercase tracking-widest text-[#C8A27C] transition-colors hover:border-white/40 hover:text-white"
        >
          {t('Enviar outra solicitação')}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="relative flex flex-col gap-6" onClick={() => setPickerFor(null)}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-widest text-gray-400">
            <Calendar className="h-3 w-3 text-[#C8A27C]" aria-hidden="true" /> {t('TIPO DE VIAGEM')}
          </label>
          <div className="grid grid-cols-2 gap-1 border border-[#3D2620] bg-[#0F0A08] p-1 text-[11px]">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setTripType('ida_volta');
              }}
              aria-pressed={isRT}
              className={`rounded-sm px-2 py-2 transition-all ${
                isRT ? 'bg-[#C8A27C] font-bold text-[#0F0A08]' : 'text-white/70 hover:text-white'
              }`}
            >
              {t('Ida e Volta')}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setTripType('so_ida');
                setReturnDate('');
              }}
              aria-pressed={!isRT}
              className={`rounded-sm px-2 py-2 transition-all ${
                !isRT ? 'bg-[#C8A27C] font-bold text-[#0F0A08]' : 'text-white/70 hover:text-white'
              }`}
            >
              {t('Só Ida')}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="tp-travelers"
            className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-widest text-gray-400"
          >
            <Users className="h-3 w-3 text-[#C8A27C]" aria-hidden="true" /> {t('QUANTAS PESSOAS?')}
          </label>
          <div className="flex items-center gap-1 border border-[#3D2620] bg-[#0F0A08] p-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setTravelers((value) => Math.max(1, value - 1));
              }}
              aria-label="-1"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-[#3D2620] bg-[#18110F] text-lg font-bold text-white transition-colors hover:border-[#C8A27C]"
            >
              −
            </button>
            <div id="tp-travelers" className="flex-1 text-center">
              <span className="text-base font-bold text-white">{travelers}</span>
              <span className="ml-2 text-[9px] uppercase tracking-wider text-gray-500">
                {travelers > 1 ? t('viajantes') : t('viajante')}
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setTravelers((value) => value + 1);
              }}
              aria-label="+1"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-[#3D2620] bg-[#5A2324] text-lg text-white transition-colors hover:border-[#C8A27C]"
            >
              ＋
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="relative flex flex-col gap-2">
          <label className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-widest text-gray-400">
            <Calendar className="h-3 w-3 text-[#C8A27C]" aria-hidden="true" /> {t('DATA DE IDA')}
          </label>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openPicker('depart');
            }}
            aria-expanded={pickerFor === 'depart'}
            className="relative flex items-center justify-between gap-2 border border-[#3D2620] bg-[#0F0A08] p-3 text-left text-[12px] text-white transition-colors hover:border-[#C8A27C]"
          >
            <span className={departDate ? '' : 'text-gray-600'}>
              {departDate ? departLabel : t('Selecionar data')}
            </span>
            <Calendar className="h-3.5 w-3.5 shrink-0 text-[#C8A27C]" aria-hidden="true" />
          </button>
          {pickerFor === 'depart' && renderCalendar()}
        </div>

        {isRT && (
          <div className="relative flex flex-col gap-2">
            <label className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-widest text-gray-400">
              <Calendar className="h-3 w-3 text-[#C8A27C]" aria-hidden="true" /> {t('DATA DE VOLTA')}
            </label>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openPicker('return');
              }}
              aria-expanded={pickerFor === 'return'}
              className="relative flex items-center justify-between gap-2 border border-[#3D2620] bg-[#0F0A08] p-3 text-left text-[12px] text-white transition-colors hover:border-[#C8A27C]"
            >
              <span className={returnDate ? '' : 'text-white/40'}>
                {returnDate ? returnLabel : t('Escolha a ida primeiro')}
              </span>
              <Calendar className="h-3.5 w-3.5 shrink-0 text-[#C8A27C]" aria-hidden="true" />
            </button>
            {pickerFor === 'return' && renderCalendar()}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:max-w-[50%]">
        <label
          htmlFor="tp-budget"
          className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-widest text-gray-400"
        >
          <DollarSign className="h-3 w-3 text-[#C8A27C]" aria-hidden="true" /> {t('ORÇAMENTO POR PESSOA')}{' '}
          <span className="text-gray-600">({t('opcional')})</span>
        </label>
        <select
          id="tp-budget"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          className="cursor-pointer appearance-none border border-[#3D2620] bg-[#0F0A08] p-3 text-[12px] text-white outline-none focus:border-[#C8A27C]"
        >
          <option value="">{t('Selecione seu orçamento')}</option>
          {BUDGET_KEYS.map((key, index) => (
            <option key={key} value={String(BUDGET_RANGES[index] ?? 0)}>
              {t(key)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-widest text-gray-400">
          <Heart className="h-3 w-3 text-[#C8A27C]" aria-hidden="true" /> {t('O QUE VOCÊ PROCURA?')}
        </label>
        <div className="flex flex-wrap gap-1.5">
          {INTEREST_KEYS.map((key) => {
            const selected = interests.includes(key);
            return (
              <button
                key={key}
                type="button"
                aria-pressed={selected}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleInterest(key);
                }}
                className={`rounded-sm border px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-wider transition-colors ${
                  selected
                    ? 'border-[#C8A27C] bg-[#C8A27C] text-[#0F0A08]'
                    : 'border-[#3D2620] text-gray-400 hover:border-[#C8A27C]/60 hover:text-white'
                }`}
              >
                {t(key)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-widest text-gray-400">
          {t('SEU CONTATO PARA RECEBER O PLANEJAMENTO')}
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input
            required
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('Seu nome')}
            aria-label={t('Seu nome')}
            className="border border-[#3D2620] bg-[#0F0A08] p-3 text-[12px] text-white outline-none transition-colors focus:border-[#C8A27C]"
          />
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('Seu e-mail')}
            aria-label={t('Seu e-mail')}
            className="border border-[#3D2620] bg-[#0F0A08] p-3 text-[12px] text-white outline-none transition-colors focus:border-[#C8A27C]"
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t('WhatsApp (opcional)')}
            aria-label={t('WhatsApp (opcional)')}
            className="border border-[#3D2620] bg-[#0F0A08] p-3 text-[12px] text-white outline-none transition-colors focus:border-[#C8A27C]"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="tp-message" className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-widest text-gray-400">
          <MessageSquare className="h-3 w-3 text-[#C8A27C]" aria-hidden="true" />{' '}
          {t('ALGO IMPORTANTE QUE DEVEMOS SABER?')}
        </label>
        <input
          id="tp-message"
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('Ex: lua de mel, aniversário, interesses específicos...')}
          aria-label={t('ALGO IMPORTANTE QUE DEVEMOS SABER?')}
          className="border border-[#3D2620] bg-[#0F0A08] p-3 text-[12px] text-white outline-none transition-colors focus:border-[#C8A27C]"
        />
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-sm border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-[11px] text-red-400"
        >
          <div className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 border-red-400 text-[8px]">
            !
          </div>{' '}
          {error}
        </div>
      )}

      <div className="mt-2 flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          aria-busy={submitting}
          className="group flex items-center justify-center gap-3 rounded-none bg-[#C8A27C] px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#0F0A08] transition-all hover:bg-[#B8906C] disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> {t('Enviando...')}
            </>
          ) : (
            <>
              {t('SOLICITAR ORÇAMENTO')}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}