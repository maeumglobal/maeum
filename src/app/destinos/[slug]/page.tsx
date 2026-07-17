'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { MapPin, Calendar, Compass, ArrowRight, ArrowLeft, Sparkles, GraduationCap, Map } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { db } from '@/lib/db';

export default function DestinoDetailPage() {
  const { slug } = useParams();
  const [destination, setDestination] = useState<any>(null);
  const [relatedPackages, setRelatedPackages] = useState<any[]>([]);

  useEffect(() => {
    const dests = db.get('destinations') || [];
    const found = dests.find((d: any) => d.slug === slug);
    setDestination(found || null);

    if (found) {
      const allPkgs = db.get('packages') || [];
      const pkgs = allPkgs.filter((p: any) => p.destination_id === found.id);
      setRelatedPackages(pkgs);
    }
  }, [slug]);

  if (!destination) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-12 text-center">
          <h2 className="font-heading text-3xl font-light text-secondary">Destino no encontrado</h2>
          <Link href="/destinos" className="mt-4 text-primary hover:underline text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Volver a Destinos
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      <main className="flex-1 w-full">
        {/* Banner principal */}
        <section className="relative h-[60vh] min-h-[400px] w-full overflow-hidden">
          <Image
            src={destination.main_image || 'https://images.unsplash.com/photo-1538669715515-5e3819766a9e?q=80&w=1200'}
            alt={destination.name}
            fill
            className="object-cover"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-16 max-w-7xl mx-auto w-full">
            <div className="max-w-2xl text-white">
              <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 backdrop-blur-sm">
                Destino Premium
              </span>
              <h1 className="font-heading text-4xl sm:text-6xl font-light mt-4 tracking-wide uppercase leading-tight">
                {destination.name}
              </h1>
            </div>
          </div>
        </section>

        {/* Informações detalhadas */}
        <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-16">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <h2 className="font-heading text-2xl font-light text-secondary uppercase tracking-wider">Sobre el destino</h2>
            <p className="text-sm text-muted-foreground leading-relaxed font-light">
              {destination.description}
            </p>

            {/* Galeria de fotos */}
            {destination.gallery && destination.gallery.length > 0 && (
              <div className="mt-8">
                <h3 className="font-heading text-lg font-light text-secondary uppercase tracking-wider mb-4">Galería de Experiencias</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {destination.gallery.map((img: string, idx: number) => (
                    <div key={idx} className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-border">
                      <Image src={img} alt={`Gallery ${idx}`} fill unoptimized className="object-cover hover:scale-102 transition-transform duration-500" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {slug === 'coreia-do-sul' && (
              <div className="mt-8 bg-muted/20 rounded-3xl p-8 border border-border">
                <h3 className="font-heading text-xl font-light text-secondary uppercase tracking-wider mb-6">Explorar Coreia do Sul</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link href="/coreia-do-sul/experiencias" className="flex items-center gap-4 bg-card border border-border rounded-2xl p-5 hover:shadow-md hover:border-primary/30 transition-all group">
                    <span className="p-3 bg-primary/10 rounded-xl text-primary"><Compass className="h-6 w-6" /></span>
                    <div>
                      <h4 className="font-bold text-sm text-secondary group-hover:text-primary transition-colors">Experiências</h4>
                      <p className="text-[10px] text-muted-foreground">Explore experiências individuais</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-primary ml-auto shrink-0" />
                  </Link>
                  <Link href="/coreia-do-sul/k-beauty" className="flex items-center gap-4 bg-card border border-border rounded-2xl p-5 hover:shadow-md hover:border-primary/30 transition-all group">
                    <span className="p-3 bg-primary/10 rounded-xl text-primary"><Sparkles className="h-6 w-6" /></span>
                    <div>
                      <h4 className="font-bold text-sm text-secondary group-hover:text-primary transition-colors">K-Beauty</h4>
                      <p className="text-[10px] text-muted-foreground">Beleza e cuidados coreanos</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-primary ml-auto shrink-0" />
                  </Link>
                  <Link href="/coreia-do-sul/intercambio" className="flex items-center gap-4 bg-card border border-border rounded-2xl p-5 hover:shadow-md hover:border-primary/30 transition-all group">
                    <span className="p-3 bg-primary/10 rounded-xl text-primary"><GraduationCap className="h-6 w-6" /></span>
                    <div>
                      <h4 className="font-bold text-sm text-secondary group-hover:text-primary transition-colors">Intercâmbio</h4>
                      <p className="text-[10px] text-muted-foreground">Lexis Korea — programas de coreano</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-primary ml-auto shrink-0" />
                  </Link>
                  <Link href="/coreia-do-sul/jornadas" className="flex items-center gap-4 bg-card border border-border rounded-2xl p-5 hover:shadow-md hover:border-primary/30 transition-all group">
                    <span className="p-3 bg-primary/10 rounded-xl text-primary"><Map className="h-6 w-6" /></span>
                    <div>
                      <h4 className="font-bold text-sm text-secondary group-hover:text-primary transition-colors">Jornadas</h4>
                      <p className="text-[10px] text-muted-foreground">Viagens em grupo exclusivas</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-primary ml-auto shrink-0" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Localização / Informações do destino */}
          <div className="border border-border rounded-3xl p-8 bg-card shadow-sm h-fit flex flex-col gap-6">
            <div>
              <span className="text-[10px] uppercase font-bold text-primary tracking-widest">Información de Viaje</span>
              <h3 className="font-heading text-xl font-light text-secondary mt-1">País: {destination.country}</h3>
            </div>
            
            <div className="h-px bg-border" />
            
            <div className="flex flex-col gap-2.5 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Coordenadas:</span>
                <span className="font-bold text-secondary">{destination.map_coordinates?.lat}° N, {destination.map_coordinates?.lng}° E</span>
              </div>
              <div className="flex justify-between">
                <span>Temporada ideal:</span>
                <span className="font-bold text-secondary">Todo el año</span>
              </div>
              <div className="flex justify-between">
                <span>Idioma local:</span>
                <span className="font-bold text-secondary">Nativo / Inglés</span>
              </div>
            </div>

            {destination.video_url && (
              <div className="mt-2">
                <a
                  href={destination.video_url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-accent-hover text-white transition-all text-xs font-bold py-3.5 rounded-xl uppercase tracking-wider shadow-sm"
                >
                  <Compass className="h-4 w-4" />
                  Ver Vídeo Destacado
                </a>
              </div>
            )}

            {slug === 'coreia-do-sul' && (
              <Link href="/coreia-do-sul" className="mt-2 block">
                <button className="w-full flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 text-white transition-all text-xs font-bold py-3.5 rounded-xl uppercase tracking-wider shadow-sm">
                  <Compass className="h-4 w-4" />
                  EXPLORAR COREIA DO SUL
                </button>
              </Link>
            )}
          </div>
        </section>

        {/* Pacotes para este destino */}
        <section className="py-20 bg-muted/20 border-t border-border w-full">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <h2 className="font-heading text-3xl font-light text-secondary uppercase tracking-wide mb-12 text-center">
              Programas y Viajes Disponibles
            </h2>

            {relatedPackages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {relatedPackages.map((pkg) => (
                  <div key={pkg.id} className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                      <Image
                        src={pkg.gallery?.[0] || 'https://images.unsplash.com/photo-1538669715515-5e3819766a9e?q=80&w=600'}
                        alt={pkg.title}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-102 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-heading text-lg font-bold text-secondary leading-tight group-hover:text-primary transition-colors">{pkg.title}</h4>
                        <span className="font-heading text-md font-bold text-primary shrink-0">US$ {pkg.price.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-3 line-clamp-3 font-light leading-relaxed">
                        {pkg.description}
                      </p>
                      <div className="flex items-center gap-2 mt-4 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        <span>{pkg.duration || '10 Dias'}</span>
                      </div>
                    </div>
                    <div className="p-6 pt-0">
                      <Link href={`/pacotes/${pkg.slug}`} className="w-full">
                        <button className="w-full flex items-center justify-center gap-2 bg-muted hover:bg-primary hover:text-white transition-all text-xs font-bold py-3 rounded-xl border border-border text-secondary">
                          VER ROTEIRO DETALHADO
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-xs text-muted-foreground py-12">
                Próximamente agregaremos salidas para este destino.
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
