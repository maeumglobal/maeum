'use client';

import React, { useState } from 'react';
import {
  Calendar, Users, DollarSign, Heart, ArrowRight, MessageSquare,
  ChevronLeft, ChevronRight, Check, Loader2,
} from 'lucide-react';
import { submitTripPlanAction } from '@/actions/tripPlanActions';
import { useLanguage } from '@/contexts/LanguageContext';

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const BUDGET_OPTIONS = [
  'Até R$ 10 mil',
  'R$ 10 mil – R$ 15 mil',
  'R$ 15 mil – R$ 20 mil',
  'R$ 20 mil – R$ 30 mil',
  'R$ 30 mil – R$ 40 mil',
  'R$ 40 mil – R$ 50 mil',
  'Acima de R$ 50 mil',
];
const INTEREST_OPTIONS = [
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
];

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateBR(iso: string): string {
  if (!iso) return 'Selecionar';
  const d = new Date(iso + 'T00:00:00');
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export default function TripPlanner() {
  const { t } = useLanguage();
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

  const toggleInterest = (it: string) =>
    setInterests(prev => prev.includes(it) ? prev.filter(i => i !== it) : [...prev, it]);

  const today = new Date();
  const nowIso = toISODate(today);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const openPicker = (forWhich: 'depart' | 'return') => {
    const base = forWhich === 'return' && returnDate ? new Date(returnDate + 'T00:00:00') : today;
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    setPickerFor(forWhich);
  };

  const handleSelectDate = (y: number, m: number, day: number) => {
    const iso = toISODate(new Date(y, m, day));
    if (pickerFor === 'depart') {
      setDepartDate(iso);
      if (isRT) setPickerFor('return');
      else setPickerFor(null);
    } else {
      if (departDate && iso <= departDate) return;
      setReturnDate(iso);
      setPickerFor(null);
    }
  };

  const isSelectable = (y: number, m: number, day: number) => {
    const iso = toISODate(new Date(y, m, day));
    if (iso < nowIso) return false;
    if (pickerFor === 'return' && departDate && iso <= departDate) return false;
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!departDate) { setError(t('Selecione a data de ida.')); return; }
    if (isRT && !returnDate) { setError(t('Selecione a data de volta.')); return; }
    setSubmitting(true);
    const res = await submitTripPlanAction({
      name, email, phone,
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
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const prev = () => {
      if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
      else setViewMonth(viewMonth - 1);
    };
    const next = () => {
      if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
      else setViewMonth(viewMonth + 1);
    };

    return (
      <div className="absolute top-full left-0 z-[100] mt-2 bg-[#150E0C] border border-[#3D2620] rounded-lg p-4 shadow-2xl w-full min-w-[300px] animate-in fade-in slide-in-from-top-2 duration-150" onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <button type="button" onClick={prev} className="p-1.5 hover:bg-white/5 rounded-md text-white/60 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#C8A27C]">
            {MONTHS[viewMonth]} {viewYear}
          </span>
          <button type="button" onClick={next} className="p-1.5 hover:bg-white/5 rounded-md text-white/60 hover:text-white transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((wd, i) => (
            <span key={i} className="text-center text-[8px] font-bold text-white/30">{wd}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <span key={`e${i}`} />;
            const iso = toISODate(new Date(viewYear, viewMonth, day));
            const selectable = isSelectable(viewYear, viewMonth, day);
            const isSelected = iso === departDate || iso === returnDate;
            const isRange = departDate && returnDate && iso > departDate && iso < returnDate;

            return (
              <button
                key={i}
                type="button"
                disabled={!selectable}
                onClick={() => handleSelectDate(viewYear, viewMonth, day)}
                className={`h-9 text-[11px] font-medium transition flex items-center justify-center ${
                  isSelected
                    ? 'bg-[#C8A27C] text-[#0F0A08] font-bold'
                    : isRange
                    ? 'bg-[#C8A27C]/15 text-white'
                    : selectable
                    ? 'text-white/80 hover:bg-white/5'
                    : 'text-white/20 cursor-not-allowed'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-[#3D2620] text-[9px] text-gray-500 font-semibold uppercase tracking-wider">
          {pickerFor === 'depart' ? t('Selecione a data de ida') : t('Selecione a data de volta')}
        </div>
      </div>
    );
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-10 animate-in fade-in">
        <div className="w-16 h-16 rounded-full bg-[#C8A27C]/15 border border-[#C8A27C]/40 flex items-center justify-center mb-6">
          <Check className="w-8 h-8 text-[#C8A27C]" />
        </div>
<h3 className="font-heading text-2xl font-light text-white mb-3">{t('Planejamento recebido!')}</h3>
        <p className="text-[12px] text-gray-400 font-light leading-relaxed max-w-sm mb-8">
          {t('Uma consultora Maeum vai entrar em contato com você em breve para personalizar sua viagem.')}
        </p>
        <button onClick={reset} className="text-[10px] text-[#C8A27C] hover:text-white font-bold uppercase tracking-widest border-b border-[#C8A27C]/40 hover:border-white/40 pb-1 transition-colors">
          {t('Enviar outra solicitação')}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="relative flex flex-col gap-6" onClick={() => setPickerFor(null)}>
      {/* Datas + tipo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-gray-400 font-semibold">
            <Calendar className="w-3 h-3 text-[#C8A27C]" /> {t('TIPO DE VIAGEM')}
          </label>
          <div className="grid grid-cols-2 gap-1 bg-[#0F0A08] border border-[#3D2620] p-1 text-[11px]">
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setTripType('ida_volta'); }}
              className={`py-2 px-2 rounded-sm transition-all ${isRT ? 'bg-[#C8A27C] text-[#0F0A08] font-bold' : 'text-white/70 hover:text-white'}`}
            >
              {t('Ida e Volta')}
            </button>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setTripType('so_ida'); setReturnDate(''); }}
              className={`rounded-sm transition-all ${!isRT ? 'bg-[#C8A27C] text-[#0F0A08] font-bold' : 'text-white/70 hover:text-white'}`}
            >
              {t('Só Ida')}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-gray-400 font-semibold">
            <Users className="w-3 h-3 text-[#C8A27C]" /> {t('QUANTAS PESSOAS?')}
          </label>
          <div className="bg-[#0F0A08] border border-[#3D2620] p-1.5 flex items-center gap-1">
            <button type="button" onClick={e => { e.stopPropagation(); setTravelers(Math.max(1, travelers - 1)); }} className="w-9 h-9 flex items-center justify-center bg-[#18110F] border border-[#3D2620] rounded-md text-white hover:border-[#C8A27C] transition-colors text-lg font-bold">−</button>
            <div className="flex-1 text-center">
              <span className="text-base font-bold text-white">{travelers}</span>
              <span className="ml-2 text-[9px] text-gray-500 uppercase tracking-wider">{travelers > 1 ? t('viajantes') : t('viajante')}</span>
            </div>
            <button type="button" onClick={e => { e.stopPropagation(); setTravelers(travelers + 1); }} className="w-9 h-9 flex items-center justify-center bg-[#5A2324] border border-[#3D2620] rounded-md text-white hover:border-[#C8A27C] transition-colors text-lg">＋</button>
          </div>
        </div>
      </div>

      {/* Datas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2 relative">
          <label className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-gray-400 font-semibold">
            <Calendar className="w-3 h-3 text-[#C8A27C]" /> {t('DATA DE IDA')}
          </label>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); openPicker('depart'); }}
            className="flex items-center justify-between gap-2 bg-[#0F0A08] border border-[#3D2620] p-3 text-[12px] text-white hover:border-[#C8A27C] transition-colors text-left relative"
          >
            <span className={departDate ? '' : 'text-gray-600'}>{departDate ? formatDateBR(departDate) : t('Selecionar data')}</span>
            <Calendar className="w-3.5 h-3.5 text-[#C8A27C] shrink-0" />
          </button>
          {pickerFor === 'depart' && renderCalendar()}
        </div>

        {isRT && (
          <div className="flex flex-col gap-2 relative">
            <label className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-gray-400 font-semibold">
              <Calendar className="w-3 h-3 text-[#C8A27C]" /> {t('DATA DE VOLTA')}
            </label>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); openPicker('return'); }}
              className="flex items-center justify-between gap-2 bg-[#0F0A08] border border-[#3D2620] p-3 text-[12px] text-white hover:border-[#C8A27C] transition-colors text-left relative"
            >
              <span className={returnDate ? '' : 'text-white/40'}>
                {returnDate ? formatDateBR(returnDate) : (isRT ? t('Escolha a ida primeiro') : '')}
              </span>
              <Calendar className="w-3.5 h-3.5 text-[#C8A27C] shrink-0" />
            </button>
            {pickerFor === 'return' && renderCalendar()}
          </div>
        )}
      </div>

      {/* Orçamento */}
      <div className="flex flex-col gap-2 sm:max-w-[50%]">
        <label className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-gray-400 font-semibold">
          <DollarSign className="w-3 h-3 text-[#C8A27C]" /> {t('ORÇAMENTO POR PESSOA')} <span className="text-gray-600">({t('opcional')})</span>
        </label>
        <select value={budget} onChange={e => setBudget(e.target.value)} className="bg-[#0F0A08] border border-[#3D2620] p-3 text-[12px] text-white outline-none appearance-none cursor-pointer focus:border-[#C8A27C]">
          <option value="">{t('Selecione seu orçamento')}</option>
          {BUDGET_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {/* Interesses */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-gray-400 font-semibold">
          <Heart className="w-3 h-3 text-[#C8A27C]" /> {t('O QUE VOCÊ PROCURA?')}
        </label>
        <div className="flex flex-wrap gap-1.5">
          {INTEREST_OPTIONS.map(it => (
            <button
              key={it}
              type="button"
              onClick={e => { e.stopPropagation(); toggleInterest(it); }}
              className={`px-2.5 py-1.5 rounded-sm text-[9px] font-semibold uppercase tracking-wider border transition-colors ${
                interests.includes(it)
                  ? 'bg-[#C8A27C] text-[#0F0A08] border-[#C8A27C]'
                  : 'text-gray-400 border-[#3D2620] hover:border-[#C8A27C]/60 hover:text-white'
              }`}
            >
              {it}
            </button>
          ))}
        </div>
      </div>

      {/* Contato */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-gray-400 font-semibold">
          {t('SEU CONTATO PARA RECEBER O PLANEJAMENTO')}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t('Seu nome')} className="bg-[#0F0A08] border border-[#3D2620] p-3 text-[12px] text-white outline-none focus:border-[#C8A27C] transition-colors" />
          <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('Seu e-mail')} className="bg-[#0F0A08] border border-[#3D2620] p-3 text-[12px] text-white outline-none focus:border-[#C8A27C] transition-colors" />
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder={t('WhatsApp (opcional)')} className="bg-[#0F0A08] border border-[#3D2620] p-3 text-[12px] text-white outline-none focus:border-[#C8A27C] transition-colors" />
        </div>
      </div>

      {/* Mensagem */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-gray-400 font-semibold">
          <MessageSquare className="w-3 h-3 text-[#C8A27C]" /> {t('ALGO IMPORTANTE QUE DEVEMOS SABER?')}
        </label>
        <input type="text" value={message} onChange={e => setMessage(e.target.value)} placeholder={t('Ex: lua de mel, aniversário, interesses específicos...')} className="bg-[#0F0A08] border border-[#3D2620] p-3 text-[12px] text-white outline-none focus:border-[#C8A27C] transition-colors" />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-[11px] text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2.5 rounded-sm">
          <div className="w-3.5 h-3.5 rounded-full border-2 border-red-400 flex items-center justify-center text-[8px] shrink-0">!</div> {error}
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end mt-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center justify-center gap-3 bg-[#C8A27C] hover:bg-[#B8906C] disabled:opacity-60 text-[#0F0A08] font-bold text-[10px] py-4 px-8 rounded-none transition-all group uppercase tracking-widest"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> {t('Enviando...')}
            </>
          ) : (
            <>
              {t('SOLICITAR ORÇAMENTO')}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}