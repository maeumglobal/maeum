import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, MapPin, Clock, Users, Check, X, ChevronLeft } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { prisma } from '@/lib/prisma';
import JornadaBookingWidget from './_components/JornadaBookingWidget';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const journey = await prisma.journey.findUnique({ where: { slug } });
  if (!journey) return { title: 'Jornada não encontrada' };
  return {
    title: `${journey.title} | Maeum Global`,
    description: journey.subtitle?.slice(0, 160),
  };
}

export default async function JornadaDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const journey = await prisma.journey.findUnique({
    where: { slug },
    include: { departures: { orderBy: { startDate: 'asc' } } },
  });

  if (!journey) notFound();

  // Parse JSON fields
  const parseJson = (val: unknown, fallback: unknown[] = []) => {
    try { return JSON.parse(val as string) ?? fallback; } catch { return fallback; }
  };

  const destinations: string[] = parseJson(journey.destinations);
  const included: string[] = parseJson(journey.included);
  const notIncluded: string[] = parseJson(journey.notIncluded);
  const itinerary: { day: number; title: string; description: string }[] = parseJson(journey.itinerary);
  const highlights: { title: string; description: string; image: string }[] = parseJson(journey.highlights);
  const categories: { name: string; price: number; description: string; included: string[] }[] = parseJson((journey as any).categories ?? '[]');
  const gallery: string[] = parseJson(journey.gallery);
  const allImages = [journey.mainImage, ...gallery].filter(Boolean) as string[];

  const departures = journey.departures.map((d) => ({
    id: d.id,
    start_date: d.startDate.toISOString(),
    end_date: d.endDate.toISOString(),
    total_spots: d.totalSpots,
    available_spots: d.availableSpots,
    status: d.status,
    notes: d.notes,
  }));

  const nextAvailableDeparture = departures.find((d) => d.status === 'available') ?? null;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  const formatDateShort = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('pt-BR');

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

        {/* HERO IMAGE */}
        <section className="relative h-[60vh] min-h-[420px] w-full overflow-hidden mt-4 mx-auto max-w-7xl px-4 md:px-8">
          <div className="relative w-full h-full rounded-3xl overflow-hidden">
            <Image
              src={journey.mainImage ?? 'https://images.unsplash.com/photo-1519817914152-22d216bb9170?w=1200'}
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
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border shadow-sm inline-block mb-4 ${
                      journey.category === 'army'
                        ? 'bg-purple-600/90 text-white border-purple-500/30'
                        : 'bg-primary/90 text-white border-primary/30'
                    }`}
                  >
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
                    <MapPin className="h-4 w-4 text-accent" />
                    {destinations.join(', ')}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-accent" />
                    {journey.durationDays} Dias
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CONTENT GRID */}
        <section className="max-w-7xl mx-auto px-4 md:px-8 mt-10 grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
          {/* LEFT CONTENT */}
          <div className="lg:col-span-2 space-y-12">
            {journey.concept && (
              <div>
                <h2 className="font-heading text-2xl font-light text-secondary mb-4">Conceito da Viagem</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{journey.concept}</p>
              </div>
            )}

            {/* Departures */}
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
                        <th className="text-left font-bold text-secondary py-3 pr-4 uppercase tracking-wider">Disponíveis</th>
                        <th className="text-left font-bold text-secondary py-3 pr-4 uppercase tracking-wider">Status</th>
                        <th className="text-left font-bold text-secondary py-3 uppercase tracking-wider">Obs.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {departures.map((dep) => (
                        <tr key={dep.id} className="border-b border-border/50">
                          <td className="py-3 pr-4 text-muted-foreground">{formatDateShort(dep.start_date)}</td>
                          <td className="py-3 pr-4 text-muted-foreground">{formatDateShort(dep.end_date)}</td>
                          <td className="py-3 pr-4 text-muted-foreground">{dep.total_spots}</td>
                          <td className="py-3 pr-4 text-muted-foreground">{dep.available_spots}</td>
                          <td className="py-3 pr-4">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                                dep.status === 'available' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                              }`}
                            >
                              {dep.status === 'available' ? 'Disponível' : 'Esgotada'}
                            </span>
                          </td>
                          <td className="py-3 text-muted-foreground">{dep.notes ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Highlights */}
            {highlights.length > 0 && (
              <div>
                <h2 className="font-heading text-2xl font-light text-secondary mb-6">Destaques da Jornada</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {highlights.map((h, idx) => (
                    <div key={idx} className="bg-card border border-border rounded-2xl overflow-hidden group">
                      {h.image && (
                        <div className="relative aspect-video w-full overflow-hidden">
                          <Image
                            src={h.image}
                            alt={h.title}
                            fill
                            unoptimized
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      )}
                      <div className="p-5">
                        <h4 className="font-heading text-base font-bold text-secondary">{h.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{h.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Itinerary */}
            {itinerary.length > 0 && (
              <div>
                <h2 className="font-heading text-2xl font-light text-secondary mb-6">Roteiro</h2>
                <div className="space-y-0">
                  {itinerary.map((day, idx) => (
                    <div key={idx} className="flex gap-5 pb-8 relative">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-primary">{String(day.day).padStart(2, '0')}</span>
                        </div>
                        {idx < itinerary.length - 1 && <div className="w-px flex-1 bg-border mt-2" />}
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

            {/* Included */}
            {included.length > 0 && (
              <div>
                <h2 className="font-heading text-2xl font-light text-secondary mb-4">Inclusões</h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {included.map((item, idx) => (
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

            {/* Not Included */}
            {notIncluded.length > 0 && (
              <div>
                <h2 className="font-heading text-2xl font-light text-secondary mb-4">Não Inclusões</h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {notIncluded.map((item, idx) => (
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

            {/* Categories */}
            {categories.length > 0 && (
              <div>
                <h2 className="font-heading text-2xl font-light text-secondary mb-6">Categorias da Caravana</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {categories.map((cat, idx) => (
                    <div key={idx} className="bg-card border-2 border-border rounded-3xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-heading text-xl font-bold text-secondary">{cat.name}</h3>
                        <span className="font-heading text-2xl font-bold text-primary">
                          R$ {cat.price.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-4">{cat.description}</p>
                      {cat.included?.length > 0 && (
                        <ul className="space-y-2">
                          {cat.included.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                              <Check className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
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

            {/* Gallery */}
            {allImages.length > 1 && (
              <div>
                <h2 className="font-heading text-2xl font-light text-secondary mb-4">Galeria</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {allImages.slice(0, 6).map((img, idx) => (
                    <div
                      key={idx}
                      className={`relative overflow-hidden rounded-xl ${idx === 0 ? 'col-span-2 row-span-2' : ''}`}
                    >
                      <div className={`relative ${idx === 0 ? 'aspect-[4/3]' : 'aspect-square'}`}>
                        <Image
                          src={img}
                          alt={`${journey.title} - Imagem ${idx + 1}`}
                          fill
                          unoptimized
                          className="object-cover hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Video */}
            <div>
              <h2 className="font-heading text-2xl font-light text-secondary mb-4">Vídeo</h2>
              {journey.videoUrl ? (
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-black">
                  <iframe
                    src={journey.videoUrl.replace('watch?v=', 'embed/')}
                    title="Jornada em vídeo"
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-muted flex flex-col items-center justify-center gap-4 border border-dashed border-border">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <svg className="h-7 w-7 text-primary ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">Em breve: vídeo exclusivo desta jornada</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDEBAR — Booking Widget (client) */}
          <div className="lg:col-span-1">
            <JornadaBookingWidget
              journeyTitle={journey.title}
              journeySlug={journey.slug}
              pricePerPerson={journey.pricePerPerson}
              categories={categories}
              nextAvailableDeparture={nextAvailableDeparture}
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
