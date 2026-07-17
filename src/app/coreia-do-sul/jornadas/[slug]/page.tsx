'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Calendar, MapPin, Clock, Users, Check, X, ChevronLeft, Star, ArrowRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/db';

export default function JornadaDetailPage() {
  const { slug } = useParams();
  const [journey, setJourney] = useState<any>(null);
  const [departures, setDepartures] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const allJourneys = db.get('journeys');
    const found = allJourneys.find((j: any) => j.slug === slug);

    if (found) {
      const allDepartures = db.get('journey_departures');
      const journeyDepartures = allDepartures
        .filter((d: any) => d.journey_id === found.id)
        .sort((a: any, b: any) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

      setJourney(found);
      setDepartures(journeyDepartures);
      if (found.categories && found.categories.length > 0) {
        setSelectedCategory(found.categories[0].name);
      }
    }

    setLoading(false);
  }, [slug]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  const formatDateShort = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR');
  };

  const currentCategoryPrice = () => {
    if (!journey?.categories || journey.categories.length === 0) return null;
    const cat = journey.categories.find((c: any) => c.name === selectedCategory);
    return cat ? cat.price : null;
  };

  const displayPrice = () => {
    if (journey?.categories && journey.categories.length > 0) {
      const cp = currentCategoryPrice();
      return cp || journey.price_per_person;
    }
    return journey?.price_per_person;
  };

  const nextAvailableDeparture = departures.find((d: any) => d.status === 'available') || null;

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 w-full animate-pulse">
          <div className="h-[60vh] min-h-[400px] bg-muted" />
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 grid grid-cols-1 lg:grid-cols-3 gap-16">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-8 w-3/4 bg-muted rounded" />
              <div className="h-4 w-1/2 bg-muted rounded" />
              <div className="h-4 w-1/3 bg-muted rounded" />
              <div className="h-32 bg-muted rounded" />
              <div className="h-48 bg-muted rounded" />
            </div>
            <div className="h-96 bg-muted rounded-3xl" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-12 text-center">
          <h2 className="font-heading text-3xl font-light text-secondary">Jornada não encontrada</h2>
          <Link
            href="/coreia-do-sul/jornadas"
            className="mt-4 text-primary hover:underline text-xs font-bold uppercase tracking-wider flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" /> Voltar para Jornadas
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const allImages = [journey.main_image, ...(journey.gallery || [])].filter(Boolean);
  const hasCategories = journey.categories && journey.categories.length > 0;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      <main className="flex-1 w-full pb-32 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 pb-2">
          <Link
            href="/coreia-do-sul/jornadas"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Voltar para Jornadas</span>
          </Link>
        </div>

        <section className="relative h-[60vh] min-h-[420px] w-full overflow-hidden mt-4 mx-auto max-w-7xl px-4 md:px-8">
          <div className="relative w-full h-full rounded-3xl overflow-hidden">
            <Image
              src={journey.main_image}
              alt={journey.title}
              fill
              className="object-cover"
              priority
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
              <div className="max-w-3xl text-white">
                {journey.category && (
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border shadow-sm inline-block mb-4 ${
                    journey.category === 'army'
                      ? 'bg-purple-600/90 text-white border-purple-500/30'
                      : 'bg-primary/90 text-white border-primary/30'
                  }`}>
                    {journey.category === 'army' ? 'ARMY' : 'Premium'}
                  </span>
                )}
                <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-light tracking-wide leading-tight">
                  {journey.title}
                </h1>
                {journey.subtitle && (
                  <p className="text-sm sm:text-base text-white/80 mt-3 max-w-2xl font-light leading-relaxed">
                    {journey.subtitle}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-4 mt-5 text-xs text-white/70">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary" />
                    {journey.destinations.join(', ')}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-primary" />
                    {journey.duration_days} dias
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 md:px-8 mt-10 grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
          {/* LEFT CONTENT */}
          <div className="lg:col-span-2 space-y-12">
            {/* Conceito */}
            {journey.concept && (
              <div>
                <h2 className="font-heading text-2xl font-light text-secondary mb-4">Conceito da Viagem</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{journey.concept}</p>
              </div>
            )}

            {/* Datas e Saídas */}
            {departures.length > 0 && (
              <div>
                <h2 className="font-heading text-2xl font-light text-secondary mb-4">Datas e Saídas</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left font-bold text-secondary py-3 pr-4 uppercase tracking-wider">Data Inicial</th>
                        <th className="text-left font-bold text-secondary py-3 pr-4 uppercase tracking-wider">Data Final</th>
                        <th className="text-left font-bold text-secondary py-3 pr-4 uppercase tracking-wider">Vagas Totais</th>
                        <th className="text-left font-bold text-secondary py-3 pr-4 uppercase tracking-wider">Vagas Disponíveis</th>
                        <th className="text-left font-bold text-secondary py-3 pr-4 uppercase tracking-wider">Status</th>
                        <th className="text-left font-bold text-secondary py-3 uppercase tracking-wider">Observações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {departures.map((dep: any) => (
                        <tr key={dep.id} className="border-b border-border/50">
                          <td className="py-3 pr-4 text-muted-foreground">{formatDateShort(dep.start_date)}</td>
                          <td className="py-3 pr-4 text-muted-foreground">{formatDateShort(dep.end_date)}</td>
                          <td className="py-3 pr-4 text-muted-foreground">{dep.total_spots}</td>
                          <td className="py-3 pr-4 text-muted-foreground">{dep.available_spots}</td>
                          <td className="py-3 pr-4">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                              dep.status === 'available'
                                ? 'bg-green-50 text-green-700'
                                : 'bg-red-50 text-red-700'
                            }`}>
                              {dep.status === 'available' ? 'Disponível' : 'Esgotada'}
                            </span>
                          </td>
                          <td className="py-3 text-muted-foreground">{dep.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Destaques */}
            {journey.highlights && journey.highlights.length > 0 && (
              <div>
                <h2 className="font-heading text-2xl font-light text-secondary mb-6">Destaques da Jornada</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {journey.highlights.map((h: any, idx: number) => (
                    <div key={idx} className="bg-card border border-border rounded-2xl overflow-hidden group">
                      <div className="relative aspect-video w-full overflow-hidden">
                        <Image
                          src={h.image}
                          alt={h.title}
                          fill
                          unoptimized
                          className="object-cover group-hover:scale-102 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-5">
                        <h4 className="font-heading text-base font-bold text-secondary">{h.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{h.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Roteiro */}
            {journey.itinerary && journey.itinerary.length > 0 && (
              <div>
                <h2 className="font-heading text-2xl font-light text-secondary mb-6">Roteiro</h2>
                <div className="space-y-0">
                  {journey.itinerary.map((day: any, idx: number) => (
                    <div key={idx} className="flex gap-5 pb-8 relative">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-primary">{String(day.day).padStart(2, '0')}</span>
                        </div>
                        {idx < journey.itinerary.length - 1 && (
                          <div className="w-px flex-1 bg-border mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pt-1.5">
                        <h4 className="font-heading text-lg font-bold text-secondary">{day.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{day.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inclusões */}
            {journey.included && journey.included.length > 0 && (
              <div>
                <h2 className="font-heading text-2xl font-light text-secondary mb-4">Inclusões</h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {journey.included.map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-50">
                        <Check className="h-3 w-3 text-green-600" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Não Inclusões */}
            {journey.not_included && journey.not_included.length > 0 && (
              <div>
                <h2 className="font-heading text-2xl font-light text-secondary mb-4">Não Inclusões</h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {journey.not_included.map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-50">
                        <X className="h-3 w-3 text-red-500" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Categorias (Caravana Liberty / Prestige) */}
            {hasCategories && (
              <div>
                <h2 className="font-heading text-2xl font-light text-secondary mb-6">Categorias da Caravana</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {journey.categories.map((cat: any, idx: number) => (
                    <div
                      key={idx}
                      className={`bg-card border-2 rounded-3xl p-6 transition-all ${
                        selectedCategory === cat.name
                          ? 'border-primary shadow-md'
                          : 'border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-heading text-xl font-bold text-secondary">{cat.name}</h3>
                        <span className="font-heading text-2xl font-bold text-primary">
                          R$ {cat.price.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-4">{cat.description}</p>
                      {cat.included && cat.included.length > 0 && (
                        <ul className="space-y-2">
                          {cat.included.map((item: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                              <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Galeria */}
            {allImages.length > 1 && (
              <div>
                <h2 className="font-heading text-2xl font-light text-secondary mb-4">Galeria</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {allImages.slice(0, 6).map((img: string, idx: number) => (
                    <div
                      key={idx}
                      className={`relative overflow-hidden rounded-xl ${
                        idx === 0 ? 'col-span-2 row-span-2' : ''
                      }`}
                    >
                      <div className={`relative ${idx === 0 ? 'aspect-[4/3]' : 'aspect-square'}`}>
                        <Image
                          src={img}
                          alt={`${journey.title} - Imagem ${idx + 1}`}
                          fill
                          unoptimized
                          className="object-cover hover:scale-102 transition-transform duration-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vídeo */}
            <div>
              <h2 className="font-heading text-2xl font-light text-secondary mb-4">Vídeo</h2>
              {journey.video_url ? (
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-black">
                  <iframe
                    src={journey.video_embed || journey.video_url.replace('watch?v=', 'embed/')}
                    title="Jornada em vídeo"
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-muted flex flex-col items-center justify-center gap-4 border border-dashed border-border group cursor-pointer hover:bg-muted/80 transition-colors">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <svg className="h-7 w-7 text-primary ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">Em breve: vídeo exclusivo desta jornada</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-28 border border-border rounded-3xl p-6 md:p-8 bg-card shadow-sm">
              {/* Price */}
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
                    {journey.categories.map((cat: any) => (
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
                  {journey.categories.length === 2 && selectedCategory && (
                    <p className="text-[11px] text-muted-foreground mt-2 text-center">
                      {selectedCategory === journey.categories[0].name
                        ? `Economize R$ ${(journey.categories[1].price - journey.categories[0].price).toLocaleString('pt-BR')} com a categoria ${journey.categories[0].name}`
                        : `Upgrade para ${journey.categories[1].name} por apenas R$ ${(journey.categories[1].price - journey.categories[0].price).toLocaleString('pt-BR')} a mais`}
                    </p>
                  )}
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
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>{formatDate(nextAvailableDeparture.start_date)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5 text-primary" />
                      <span>{nextAvailableDeparture.available_spots} vagas restantes</span>
                    </div>
                  </div>
                )}

                <Button className="w-full bg-primary hover:bg-accent-hover text-white text-sm font-bold py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98] h-auto">
                  SOLICITAR RESERVA
                </Button>

                {/* Payment info */}
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
          </div>
        </section>
      </main>

      {/* MOBILE BOTTOM BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border px-4 py-3 md:hidden shadow-lg">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <span className="font-heading text-xl font-bold text-secondary">
              R$ {formatCurrency(displayPrice())}
            </span>
            <span className="text-xs text-muted-foreground ml-1">/ pessoa</span>
          </div>
          <Button className="bg-primary hover:bg-accent-hover text-white text-sm font-bold px-6 py-3 rounded-xl transition-all shadow-sm active:scale-[0.98] h-auto">
            SOLICITAR RESERVA
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
