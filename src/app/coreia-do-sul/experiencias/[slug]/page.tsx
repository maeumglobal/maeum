'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { MapPin, Clock, Check, ChevronLeft, Calendar, Users, Heart, Share2, Star } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { db } from '@/lib/db';

export default function ExperienceDetailPage() {
  const { slug } = useParams();
  const [experience, setExperience] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [participants, setParticipants] = useState(1);

  useEffect(() => {
    const exps = db.get('experiences') || [];
    const found = exps.find((e: any) => e.slug === slug);
    setExperience(found || null);
    const cats = db.get('categories') || [];
    setCategories(cats);
    setLoading(false);
    if (found?.available_from) {
      setSelectedDate(found.available_from);
    }
  }, [slug]);

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
            </div>
            <div className="h-96 bg-muted rounded-3xl" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!experience) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-12 text-center">
          <h2 className="font-heading text-3xl font-light text-secondary">Experiência não encontrada</h2>
          <Link
            href="/coreia-do-sul/experiencias"
            className="mt-4 text-primary hover:underline text-xs font-bold uppercase tracking-wider flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" /> Voltar para Experiências
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const expCategories = (experience.category_slugs || [])
    .map((slug: string) => categories.find((c: any) => c.slug === slug))
    .filter(Boolean);

  const totalPrice = experience.price_per_person * participants;
  const allImages = [experience.main_image, ...(experience.gallery || [])].filter(Boolean).slice(0, 5);
  const mainImage = allImages[0];
  const sideImages = allImages.slice(1, 3);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      <main className="flex-1 w-full pb-32 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 pb-2">
          <Link
            href="/coreia-do-sul/experiencias"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Voltar para Experiências</span>
          </Link>
        </div>

        <section className="max-w-7xl mx-auto px-4 md:px-8 mt-4 mb-10">
          <div className="hidden md:grid grid-cols-4 gap-2 rounded-3xl overflow-hidden h-[60vh] min-h-[420px]">
            <div className="col-span-2 row-span-2 relative">
              <Image src={mainImage} alt={experience.title} fill unoptimized className="object-cover hover:scale-102 transition-transform duration-500" priority />
            </div>
            {sideImages.map((img: string, idx: number) => (
              <div key={idx} className="relative">
                <Image src={img} alt={`${experience.title} ${idx + 2}`} fill unoptimized className="object-cover hover:scale-102 transition-transform duration-500" />
              </div>
            ))}
            {allImages.length > 3 && (
              <button className="absolute bottom-4 right-4 bg-white/90 backdrop-blur text-secondary text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:bg-white transition-colors flex items-center gap-1.5 z-10">
                <Share2 className="h-3.5 w-3.5" />
                Compartilhar
              </button>
            )}
          </div>

          <div className="md:hidden relative aspect-[4/3] rounded-3xl overflow-hidden">
            <Image src={mainImage} alt={experience.title} fill unoptimized className="object-cover" priority />
            <div className="absolute top-4 right-4 flex gap-2">
              <button className="bg-white/90 backdrop-blur text-secondary p-2.5 rounded-full shadow-sm hover:bg-white transition-colors">
                <Heart className="h-4 w-4" />
              </button>
              <button className="bg-white/90 backdrop-blur text-secondary p-2.5 rounded-full shadow-sm hover:bg-white transition-colors">
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
          <div className="lg:col-span-2 space-y-10">
            <div>
              <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-light text-secondary leading-tight">
                {experience.title}
              </h1>
              {experience.subtitle && (
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed max-w-2xl">
                  {experience.subtitle}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4 mt-5 text-xs text-muted-foreground">
                {experience.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-accent" />
                    <span className="font-medium text-secondary">{experience.location}</span>
                  </div>
                )}
                {experience.duration_hours && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-accent" />
                    <span className="font-medium text-secondary">{experience.duration_hours}h</span>
                  </div>
                )}
              </div>
              {expCategories.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {expCategories.map((cat: any) => (
                    <span
                      key={cat.id}
                      className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/5 border border-primary/10 rounded-full px-3.5 py-1.5"
                    >
                      {cat.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="h-px bg-border" />

            <div>
              <h2 className="font-heading text-2xl font-light text-secondary mb-4">Sobre esta experiência</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{experience.description}</p>
            </div>

            {experience.highlights && experience.highlights.length > 0 && (
              <div>
                <h2 className="font-heading text-2xl font-light text-secondary mb-4">O que você vai viver</h2>
                <ul className="space-y-3">
                  {experience.highlights.map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Star className="h-3 w-3 text-accent" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {experience.included && experience.included.length > 0 && (
              <div>
                <h2 className="font-heading text-2xl font-light text-secondary mb-4">O que está incluso</h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {experience.included.map((item: string, idx: number) => (
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

            {experience.location && (
              <>
                <div className="h-px bg-border" />
                <div>
                  <h2 className="font-heading text-2xl font-light text-secondary mb-4">Localização</h2>
                  <div className="flex items-start gap-3 text-sm text-muted-foreground">
                    <MapPin className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-secondary">{experience.location}</p>
                      {experience.region && <p className="text-xs mt-0.5">{experience.region}</p>}
                    </div>
                  </div>
                </div>
              </>
            )}

            {experience.booking_type && (
              <>
                <div className="h-px bg-border" />
                <div>
                  <h2 className="font-heading text-2xl font-light text-secondary mb-4">Informações importantes</h2>
                  <div className="text-sm text-muted-foreground">
                    {experience.booking_type === 'direct' ? (
                      <p>Reserva direta disponível — garanta sua vaga agora mesmo.</p>
                    ) : (
                      <p>Esta experiência requer solicitação de reserva. Nossa equipe entrará em contato para confirmar disponibilidade.</p>
                    )}
                  </div>
                </div>
              </>
            )}

            <div className="h-px bg-border" />

            <div>
              <h2 className="font-heading text-2xl font-light text-secondary mb-6">Viva essa experiência comigo</h2>
              {experience.video_url ? (
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-black">
                  <iframe
                    src={experience.video_embed || experience.video_url.replace('watch?v=', 'embed/')}
                    title="Experiência em vídeo"
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-muted flex flex-col items-center justify-center gap-4 border border-dashed border-border group cursor-pointer hover:bg-muted/80 transition-colors">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <svg className="h-7 w-7 text-accent ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">Em breve: vídeo exclusivo desta experiência</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-28 border border-border rounded-3xl p-6 md:p-8 bg-card shadow-sm">
              <div className="flex items-baseline gap-1.5 mb-6">
                <span className="font-heading text-3xl font-bold text-secondary">
                  R$ {experience.price_per_person?.toLocaleString('pt-BR')}
                </span>
                <span className="text-sm text-muted-foreground">/ pessoa</span>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                    Data
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="date"
                      value={selectedDate}
                      min={experience.available_from || ''}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full h-10 pl-10 pr-3 rounded-xl border border-border bg-transparent text-sm text-secondary focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      <span>Participantes</span>
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
                    R$ {experience.price_per_person?.toLocaleString('pt-BR')} x {participants} {participants === 1 ? 'pessoa' : 'pessoas'}
                  </span>
                  <span className="font-heading font-bold text-lg text-secondary">
                    R$ {totalPrice.toLocaleString('pt-BR')}
                  </span>
                </div>

                <button
                  className="w-full bg-primary hover:bg-accent-hover text-white text-sm font-bold py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
                >
                  {experience.booking_type === 'direct' ? 'Reservar experiência' : 'Solicitar reserva'}
                </button>

                <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                  {experience.booking_type === 'direct'
                    ? 'Você não será cobrado(a) agora. A confirmação será enviada por e-mail.'
                    : 'Após solicitar, nossa equipe verificará a disponibilidade e retornará em até 24h.'}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border px-4 py-3 md:hidden shadow-lg">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <span className="font-heading text-xl font-bold text-secondary">
              R$ {experience.price_per_person?.toLocaleString('pt-BR')}
            </span>
            <span className="text-xs text-muted-foreground ml-1">/ pessoa</span>
          </div>
          <button className="bg-primary hover:bg-accent-hover text-white text-sm font-bold px-6 py-3 rounded-xl transition-all shadow-sm active:scale-[0.98]">
            {experience.booking_type === 'direct' ? 'Reservar' : 'Solicitar'}
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
