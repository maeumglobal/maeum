import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, Clock, Check, ChevronLeft, Star } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { prisma } from '@/lib/prisma';
import ExperienceBookingWidget from './_components/ExperienceBookingWidget';

// ─── SERVER PAGE ────────────────────────────────────────────
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const exp = await prisma.experience.findUnique({ where: { slug } });
  if (!exp) return { title: 'Experiência não encontrada' };
  return {
    title: `${exp.title} | Maeum Global`,
    description: exp.description?.slice(0, 160),
  };
}

export default async function ExperienceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const experience = await prisma.experience.findUnique({
    where: { slug },
    include: { categories: { include: { category: true } } },
  });

  if (!experience) notFound();

  // Parse JSON fields stored as strings
  const highlights: string[] = (() => {
    try { return JSON.parse(experience.highlights as string ?? '[]'); } catch { return []; }
  })();
  const included: string[] = (() => {
    try { return JSON.parse(experience.included as string ?? '[]'); } catch { return []; }
  })();
  const gallery: string[] = (() => {
    try { return JSON.parse(experience.gallery as string ?? '[]'); } catch { return []; }
  })();

  const allImages = [experience.mainImage, ...gallery].filter(Boolean) as string[];
  const mainImage = allImages[0] ?? 'https://images.unsplash.com/photo-1543489822-c49534f3271f?w=800';
  const sideImages = allImages.slice(1, 3);
  const expCategories = experience.categories.map((ec) => ec.category);

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

        {/* GALLERY */}
        <section className="max-w-7xl mx-auto px-4 md:px-8 mt-4 mb-10">
          <div className="hidden md:grid grid-cols-4 gap-2 rounded-3xl overflow-hidden h-[60vh] min-h-[420px]">
            <div className="col-span-2 row-span-2 relative">
              <Image
                src={mainImage}
                alt={experience.title}
                fill
                unoptimized
                className="object-cover hover:scale-105 transition-transform duration-500"
                priority
              />
            </div>
            {sideImages.map((img, idx) => (
              <div key={idx} className="relative">
                <Image
                  src={img}
                  alt={`${experience.title} ${idx + 2}`}
                  fill
                  unoptimized
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>

          <div className="md:hidden relative aspect-[4/3] rounded-3xl overflow-hidden">
            <Image src={mainImage} alt={experience.title} fill unoptimized className="object-cover" priority />
          </div>
        </section>

        {/* CONTENT + BOOKING */}
        <section className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
          {/* LEFT */}
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
                {experience.durationHours && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-accent" />
                    <span className="font-medium text-secondary">{experience.durationHours}h</span>
                  </div>
                )}
              </div>
              {expCategories.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {expCategories.map((cat) => (
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

            {highlights.length > 0 && (
              <div>
                <h2 className="font-heading text-2xl font-light text-secondary mb-4">O que você vai viver</h2>
                <ul className="space-y-3">
                  {highlights.map((item, idx) => (
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

            {included.length > 0 && (
              <div>
                <h2 className="font-heading text-2xl font-light text-secondary mb-4">O que está incluso</h2>
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

            {experience.location && (
              <>
                <div className="h-px bg-border" />
                <div>
                  <h2 className="font-heading text-2xl font-light text-secondary mb-4">Localização</h2>
                  <div className="flex items-start gap-3 text-sm text-muted-foreground">
                    <MapPin className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-secondary">{experience.location}</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="h-px bg-border" />
            <div>
              <h2 className="font-heading text-2xl font-light text-secondary mb-6">Informações de reserva</h2>
              <p className="text-sm text-muted-foreground">
                {experience.bookingType === 'direct'
                  ? 'Reserva direta disponível — garanta sua vaga agora mesmo.'
                  : 'Esta experiência requer solicitação de reserva. Nossa equipe entrará em contato para confirmar disponibilidade.'}
              </p>
            </div>
          </div>

          {/* RIGHT: Booking Widget (client component) */}
          <div className="lg:col-span-1">
            <ExperienceBookingWidget
              experienceTitle={experience.title}
              experienceSlug={experience.slug}
              pricePerPerson={experience.pricePerPerson}
              bookingType={experience.bookingType ?? 'request'}
              availableFrom={experience.availableFrom?.toISOString() ?? null}
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
