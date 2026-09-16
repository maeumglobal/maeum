'use client';

import React, { useState } from 'react';
import { Calendar, Users, X, Loader2, CheckCircle2 } from 'lucide-react';
import { submitBookingInquiryAction } from '@/actions/tripPlanActions';

interface Props {
  experienceTitle: string;
  experienceSlug: string;
  pricePerPerson: number;
  bookingType: string;
  availableFrom: string | null;
}

export default function ExperienceBookingWidget({
  experienceTitle,
  experienceSlug,
  pricePerPerson,
  bookingType,
  availableFrom,
}: Props) {
  const [participants, setParticipants] = useState(1);
  const [selectedDate, setSelectedDate] = useState(availableFrom?.slice(0, 10) ?? '');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const totalPrice = pricePerPerson * participants;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const result = await submitBookingInquiryAction({
      name,
      email,
      phone,
      type: 'experiencia',
      itemTitle: experienceTitle,
      itemSlug: experienceSlug,
      date: selectedDate || undefined,
      participants,
      totalPrice,
      notes: notes || undefined,
    });

    setSubmitting(false);
    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error ?? 'Erro ao enviar. Tente novamente.');
    }
  };

  return (
    <>
      {/* Booking Card */}
      <div className="lg:sticky lg:top-28 border border-border rounded-3xl p-6 md:p-8 bg-card shadow-sm">
        <div className="flex items-baseline gap-1.5 mb-6">
          <span className="font-heading text-3xl font-bold text-secondary">
            R$ {pricePerPerson.toLocaleString('pt-BR')}
          </span>
          <span className="text-sm text-muted-foreground">/ pessoa</span>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Data</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="date"
                value={selectedDate}
                min={availableFrom?.slice(0, 10) ?? ''}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full h-10 pl-10 pr-3 rounded-xl border border-border bg-transparent text-sm text-secondary focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                <span>participantes</span>
              </div>
            </label>
            <div className="flex items-center justify-between border border-border rounded-xl px-4 h-10">
              <button
                onClick={() => setParticipants(Math.max(1, participants - 1))}
                className="text-secondary hover:text-primary transition-colors text-lg font-medium leading-none disabled:opacity-30"
                disabled={participants <= 1}
              >
                −
              </button>
              <span className="text-sm font-semibold text-secondary">{participants}</span>
              <button
                onClick={() => setParticipants(Math.min(10, participants + 1))}
                className="text-secondary hover:text-primary transition-colors text-lg font-medium leading-none disabled:opacity-30"
                disabled={participants >= 10}
              >
                +
              </button>
            </div>
          </div>

          <div className="h-px bg-border" />

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              R$ {pricePerPerson.toLocaleString('pt-BR')} × {participants} {participants === 1 ? 'pessoa' : 'pessoas'}
            </span>
            <span className="font-heading font-bold text-lg text-secondary">
              R$ {totalPrice.toLocaleString('pt-BR')}
            </span>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="w-full bg-primary hover:bg-accent-hover text-white text-sm font-bold py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            {bookingType === 'direct' ? 'Reservar experiência' : 'Solicitar reserva'}
          </button>

          <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
            {bookingType === 'direct'
              ? 'Você não será cobrado(a) agora. A confirmação será enviada por e-mail.'
              : 'Após solicitar, nossa equipe verificará a disponibilidade e retornará em até 24h.'}
          </p>
        </div>
      </div>

      {/* Mobile sticky bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border px-4 py-3 md:hidden shadow-lg">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <span className="font-heading text-xl font-bold text-secondary">
              R$ {pricePerPerson.toLocaleString('pt-BR')}
            </span>
            <span className="text-xs text-muted-foreground ml-1">/ pessoa</span>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary hover:bg-accent-hover text-white text-sm font-bold px-6 py-3 rounded-xl transition-all shadow-sm active:scale-[0.98]"
          >
            {bookingType === 'direct' ? 'Reservar' : 'Solicitar'}
          </button>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 md:p-8 shadow-2xl">
            {success ? (
              <div className="flex flex-col items-center text-center py-6">
                <CheckCircle2 className="h-14 w-14 text-green-500 mb-4" />
                <h3 className="font-heading text-2xl font-light text-secondary mb-2">Solicitação Enviada!</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Recebemos sua solicitação para <strong>{experienceTitle}</strong>. Nossa equipe entrará em contato em até 24h. 🌸
                </p>
                <button
                  onClick={() => { setShowModal(false); setSuccess(false); }}
                  className="mt-6 px-8 py-3 bg-primary text-white text-sm font-bold rounded-xl hover:bg-accent-hover transition-all"
                >
                  Fechar
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-heading text-xl font-light text-secondary">{bookingType === 'direct' ? 'Reservar' : 'Solicitar reserva'}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{experienceTitle}</p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-secondary"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Summary */}
                <div className="bg-muted/40 rounded-2xl p-4 mb-5 text-sm flex items-center justify-between">
                  <span className="text-muted-foreground">{participants} {participants === 1 ? 'pessoa' : 'pessoas'} · {selectedDate || 'Data a combinar'}</span>
                  <span className="font-heading font-bold text-secondary">R$ {totalPrice.toLocaleString('pt-BR')}</span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Nome completo *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome"
                      className="w-full h-10 px-3 rounded-xl border border-border bg-transparent text-sm text-secondary placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">E-mail *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full h-10 px-3 rounded-xl border border-border bg-transparent text-sm text-secondary placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+55 (11) 9 0000-0000"
                      className="w-full h-10 px-3 rounded-xl border border-border bg-transparent text-sm text-secondary placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Observações</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      placeholder="Alguma dúvida ou pedido especial?"
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
                    {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</> : 'Confirmar Solicitação'}
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
