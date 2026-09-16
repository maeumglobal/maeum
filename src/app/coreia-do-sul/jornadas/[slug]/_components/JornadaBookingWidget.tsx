'use client';

import React, { useState } from 'react';
import { Calendar, Users, X, Loader2, CheckCircle2 } from 'lucide-react';
import { submitBookingInquiryAction } from '@/actions/tripPlanActions';

interface Departure {
  id: string;
  start_date: string;
  end_date: string;
  total_spots: number;
  available_spots: number;
  status: string;
  notes: string | null;
}

interface JourneyCategory {
  name: string;
  price: number;
  description: string;
  included: string[];
}

interface Props {
  journeyTitle: string;
  journeySlug: string;
  pricePerPerson: number;
  categories: JourneyCategory[];
  nextAvailableDeparture: Departure | null;
}

export default function JornadaBookingWidget({
  journeyTitle,
  journeySlug,
  pricePerPerson,
  categories,
  nextAvailableDeparture,
}: Props) {
  const hasCategories = categories.length > 0;
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.name ?? '');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const displayPrice = () => {
    if (hasCategories) {
      const cat = categories.find((c) => c.name === selectedCategory);
      return cat?.price ?? pricePerPerson;
    }
    return pricePerPerson;
  };

  const formatCurrency = (value: number) => value.toLocaleString('pt-BR');

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const result = await submitBookingInquiryAction({
      name,
      email,
      phone,
      type: 'jornada',
      itemTitle: journeyTitle,
      itemSlug: journeySlug,
      date: nextAvailableDeparture?.start_date?.slice(0, 10) ?? undefined,
      participants: 1,
      totalPrice: displayPrice(),
      categoryName: selectedCategory || undefined,
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
      {/* Sidebar card */}
      <div className="lg:sticky lg:top-28 border border-border rounded-3xl p-6 md:p-8 bg-card shadow-sm">
        <div className="flex items-baseline gap-1.5 mb-2">
          <span className="font-heading text-3xl font-bold text-secondary">
            R$ {formatCurrency(displayPrice())}
          </span>
          <span className="text-sm text-muted-foreground">/ pessoa</span>
        </div>

        {/* Category selector */}
        {hasCategories && (
          <div className="mb-6 mt-4">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
              Categoria
            </label>
            <div className="flex gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`flex-1 text-xs font-bold py-2.5 px-3 rounded-xl border transition-all ${
                    selectedCategory === cat.name
                      ? 'bg-primary text-white border-primary'
                      : 'bg-transparent text-secondary border-border hover:border-primary/50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-5 mt-6">
          {/* Next departure */}
          {nextAvailableDeparture && (
            <div className="bg-muted/50 rounded-xl p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Próxima saída disponível
              </div>
              <div className="flex items-center gap-2 text-sm text-secondary font-medium">
                <Calendar className="h-4 w-4 text-accent" />
                <span>{formatDate(nextAvailableDeparture.start_date)}</span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5 text-accent" />
                <span>{nextAvailableDeparture.available_spots} vagas restantes</span>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowModal(true)}
            className="w-full bg-primary hover:bg-accent-hover text-white text-sm font-bold py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            SOLICITAR RESERVA
          </button>

          <div className="text-center space-y-1.5">
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Aceitamos Pix, boleto em até 48x e cartão em até 24x sem juros
            </p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Entre 25 e 48 vezes possuem acréscimo simples de 5%
            </p>
          </div>
        </div>
      </div>

      {/* Mobile sticky bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border px-4 py-3 md:hidden shadow-lg">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <span className="font-heading text-xl font-bold text-secondary">
              R$ {formatCurrency(displayPrice())}
            </span>
            <span className="text-xs text-muted-foreground ml-1">/ pessoa</span>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary hover:bg-accent-hover text-white text-sm font-bold px-6 py-3 rounded-xl transition-all shadow-sm active:scale-[0.98]"
          >
            SOLICITAR RESERVA
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
                  Recebemos sua solicitação para <strong>{journeyTitle}</strong>. Nossa equipe entrará em contato em até 24h. 🌸
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
                    <h3 className="font-heading text-xl font-light text-secondary">Solicitar Reserva</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{journeyTitle}</p>
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
                  <span className="text-muted-foreground">
                    {selectedCategory || 'Jornada'} · {nextAvailableDeparture ? formatDate(nextAvailableDeparture.start_date) : 'Data a combinar'}
                  </span>
                  <span className="font-heading font-bold text-secondary">R$ {formatCurrency(displayPrice())}</span>
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
