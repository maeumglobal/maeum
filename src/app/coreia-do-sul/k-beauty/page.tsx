'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { db } from '@/lib/db';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, Clock, MapPin, Check, Star } from 'lucide-react';

export default function KBeautyPage() {
  const [kbeautyExp, setKbeautyExp] = useState<any>(null);
  const [partners, setPartners] = useState<any[]>([]);
  const [kbeautyExperiences, setKbeautyExperiences] = useState<any[]>([]);

  useEffect(() => {
    const exps = db.get('kbeauty_experiences') || [];
    setKbeautyExp(exps[0] || null);

    const prts = db.get('kbeauty_partners') || [];
    setPartners(prts);

    const allExps = db.get('experiences') || [];
    const filtered = allExps.filter((exp: any) =>
      exp.category_slugs?.includes('k-beauty')
    );
    setKbeautyExperiences(filtered);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      <main className="flex-1 w-full">
        {/* Hero */}
        <section className="relative h-[70vh] min-h-[500px] w-full overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=1920"
            alt="K-Beauty"
            fill
            className="object-cover"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-16 max-w-7xl mx-auto w-full">
            <div className="max-w-3xl text-white">
              <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 backdrop-blur-sm inline-block mb-4">
                Coreia do Sul
              </span>
              <h1 className="font-heading text-5xl sm:text-7xl font-light tracking-wide uppercase leading-tight">
                K-Beauty Experiences
              </h1>
              <p className="text-sm sm:text-base text-white/80 mt-4 max-w-xl font-light leading-relaxed">
                Uma curadoria exclusiva de experiências de beleza coreana — da rotina de skincare aos rituais de bem-estar que transformam a forma como você cuida de si.
              </p>
            </div>
          </div>
        </section>

        {/* Introduction */}
        <section className="py-20 px-4 md:px-8 max-w-4xl mx-auto w-full text-center">
          <span className="text-xs uppercase tracking-widest text-primary font-bold">A Essência da Beleza Coreana</span>
          <h2 className="font-heading text-3xl sm:text-4xl font-light text-secondary mt-3 leading-tight">
            A Coreia não inventou o skincare — ela o aperfeiçoou como forma de arte.
          </h2>
          <div className="mt-8 space-y-4 text-sm text-muted-foreground leading-relaxed max-w-3xl mx-auto font-light">
            <p>
              Na Maeum Global, acreditamos que a verdadeira beleza coreana vai além dos 10 passos. 
              É sobre o ritual, a intenção e o conhecimento transmitido entre gerações. 
              Nossas experiências K-Beauty são desenhadas para oferecer um mergulho autêntico 
              no universo da estética coreana — seja através de consultas com especialistas, 
              workshops de skincare personalizados ou vivências imersivas em clínicas e estúdios selecionados.
            </p>
            <p>
              Cada experiência é individualmente contratável e pode ser adicionada ao seu roteiro, 
              permitindo que você construa a jornada de beleza que faz sentido para você.
            </p>
          </div>
        </section>

        {/* Featured K-Beauty Experience */}
        {kbeautyExp && (
          <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto w-full">
            <div className="text-center mb-12">
              <span className="text-xs uppercase tracking-widest text-primary font-bold">Experiência em Destaque</span>
              <h2 className="font-heading text-3xl font-light text-secondary mt-2">K-Beauty Signature</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
              <div className="relative aspect-[4/3] lg:aspect-auto lg:h-full min-h-[400px] w-full">
                <Image
                  src={kbeautyExp.main_image || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800'}
                  alt={kbeautyExp.title}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>

              <div className="p-8 md:p-12 flex flex-col gap-6">
                <h3 className="font-heading text-2xl md:text-3xl font-bold text-secondary leading-tight">
                  {kbeautyExp.title}
                </h3>

                {kbeautyExp.subtitle && (
                  <p className="text-sm text-muted-foreground font-light leading-relaxed">
                    {kbeautyExp.subtitle}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {kbeautyExp.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>{kbeautyExp.location}</span>
                    </div>
                  )}
                  {kbeautyExp.duration_hours && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>{kbeautyExp.duration_hours}h</span>
                    </div>
                  )}
                  {kbeautyExp.price_per_person && (
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span>US$ {kbeautyExp.price_per_person} / pessoa</span>
                    </div>
                  )}
                </div>

                {kbeautyExp.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed font-light">
                    {kbeautyExp.description}
                  </p>
                )}

                {kbeautyExp.included && kbeautyExp.included.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] uppercase font-bold text-primary tracking-widest">Incluso</span>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {kbeautyExp.included.map((item: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                          <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Link
                  href={`/coreia-do-sul/experiencias/${kbeautyExp.slug}`}
                  className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-accent-hover text-white transition-all text-xs font-bold py-3.5 px-8 rounded-xl uppercase tracking-wider shadow-sm w-fit mt-2"
                >
                  Solicitar reserva
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Partners Section */}
        <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto w-full">
          <div className="text-center mb-12">
            <span className="text-xs uppercase tracking-widest text-primary font-bold">Parceiros</span>
            <h2 className="font-heading text-3xl font-light text-secondary mt-2">Empresas Parceiras</h2>
          </div>

          <div className="bg-card border border-border rounded-3xl p-8 md:p-12 text-center">
            <Star className="h-8 w-8 text-primary/40 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground font-light leading-relaxed max-w-2xl mx-auto">
              Em breve: experiências K-Beauty por empresas parceiras selecionadas.
            </p>
          </div>
        </section>

        {/* K-Beauty in Journeys */}
        <section className="py-20 bg-muted/20 border-t border-border w-full">
          <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
            <span className="text-xs uppercase tracking-widest text-primary font-bold">Jornadas em Grupo</span>
            <h2 className="font-heading text-3xl font-light text-secondary mt-2 leading-tight">
              K-Beauty nas Jornadas Cheotnun
            </h2>
            <p className="text-sm text-muted-foreground font-light leading-relaxed max-w-3xl mx-auto mt-6">
              As experiências K-Beauty também estão incluídas em nossas jornadas em grupo Cheotnun, 
              onde o cuidado com a pele e o bem-estar fazem parte da experiência completa de imersão na Coreia. 
              Descubra como a beleza coreana se integra a cada momento da sua viagem.
            </p>
            <Link
              href="/coreia-do-sul/jornadas"
              className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-accent-hover text-white transition-all text-xs font-bold py-3.5 px-8 rounded-xl uppercase tracking-wider shadow-sm mt-8"
            >
              Conhecer Jornadas
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
