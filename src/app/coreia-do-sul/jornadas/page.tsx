'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Map, Users, ArrowRight, Clock } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { db } from '@/lib/db';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMedia } from '@/contexts/SiteContentContext';

export default function JornadasPage() {
  const { t, locale } = useLanguage();
  const hero = useMedia('ks_jornadas_hero');
  const lp = (path: string) => (locale === 'pt' || path === '/' ? path : `/${locale}${path}`);
  const [journeys, setJourneys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const allJourneys = db.get('journeys').filter((j: any) => j.status === 'active');
    const allDepartures = db.get('journey_departures');

    const enriched = allJourneys.map((journey: any) => {
      const departures = allDepartures.filter(
        (d: any) => d.journey_id === journey.id && d.status === 'available'
      );
      const nextDeparture = departures.sort(
        (a: any, b: any) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      )[0] || null;
      return { ...journey, nextDeparture };
    });

    setJourneys(enriched);
    setLoading(false);
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 w-full animate-pulse">
          <div className="h-[60vh] min-h-[400px] bg-muted" />
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-20">
            <div className="h-8 w-1/3 bg-muted rounded mx-auto mb-16" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card border border-border rounded-3xl overflow-hidden">
                  <div className="aspect-[4/3] bg-muted" />
                  <div className="p-6 space-y-3">
                    <div className="h-6 w-3/4 bg-muted rounded" />
                    <div className="h-4 w-1/2 bg-muted rounded" />
                    <div className="h-4 w-1/3 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      <main className="flex-1 w-full">
        <section className="relative min-h-[100dvh] w-full overflow-hidden">
          <Image
            src={hero}
            alt={t('Coreia do Sul')}
            fill
            className="object-cover"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-16 max-w-7xl mx-auto w-full">
            <div className="max-w-3xl text-white">
              <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 backdrop-blur-sm inline-block mb-4">
                {t('Coreia do Sul')}
              </span>
              <h1 className="font-heading text-5xl sm:text-7xl font-light tracking-wide uppercase leading-tight">
                {t('Jornadas Maeum Global')}
              </h1>
              <p className="text-sm sm:text-base text-white/80 mt-4 max-w-xl font-light leading-relaxed">
                {t('Viagens em grupo com curadoria exclusiva')}
              </p>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 md:px-8 max-w-4xl mx-auto w-full text-center">
          <span className="text-xs uppercase tracking-widest text-primary font-bold">{t('Jornadas em Grupo')}</span>
          <h2 className="font-heading text-3xl sm:text-4xl font-light text-secondary mt-3 leading-tight">
            {t('Uma nova forma de viajar')}
          </h2>
          <div className="mt-8 space-y-4 text-sm text-muted-foreground leading-relaxed max-w-3xl mx-auto font-light">
            <p>
              {t('Nossas jornadas em grupo são muito mais que roteiros turísticos — são experiências cuidadosamente desenhadas para conectar você com a essência da Coreia do Sul ao lado de outras viajantes que compartilham dos mesmos sonhos.')}
            </p>
            <p>
              {t('Cada jornada inclui acompanhamento exclusivo Maeum, hospedagem selecionada, experiências curadas e todo o suporte para que você viva cada momento com profundidade e significado.')}
            </p>
          </div>
        </section>

        <section className="py-10 pb-24 px-4 md:px-8 max-w-7xl mx-auto w-full">
          {journeys.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Map className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-heading text-xl font-light text-secondary">{t('Nenhuma jornada disponível no momento')}</h3>
              <p className="text-xs text-muted-foreground mt-2">
                {t('Novas jornadas estão sendo preparadas. Volte em breve.')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {journeys.map((journey: any) => (
                <div key={journey.id} className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm flex flex-col group">
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <Image
                      src={journey.main_image}
                      alt={journey.title}
                      fill
                      unoptimized
                      className="object-cover group-hover:scale-102 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border shadow-sm backdrop-blur-sm ${
                        journey.category === 'army'
                          ? 'bg-purple-600/90 text-white border-purple-500/30'
                          : 'bg-primary/90 text-white border-primary/30'
                      }`}>
                        {journey.category === 'army' ? 'ARMY' : t('Premium')}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-heading text-xl font-bold text-secondary leading-tight">
                        {journey.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                        <Map className="h-3.5 w-3.5 text-accent" />
                        <span>{journey.destinations.join(', ')}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-accent" />
                          {journey.duration_days} {t('dias')}
                        </span>
                        {journey.nextDeparture && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-accent" />
                            {formatDate(journey.nextDeparture.start_date)}
                          </span>
                        )}
                      </div>
                      {journey.nextDeparture && (
                        <div className="flex items-center gap-1 mt-2 text-[11px] text-muted-foreground">
                          <Users className="h-3.5 w-3.5 text-accent" />
                          <span>{journey.nextDeparture.available_spots} {t('vagas disponíveis')}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between border-t border-border mt-5 pt-4">
                      <div>
                        <span className="font-heading text-lg font-bold text-secondary">
                          R$ {journey.price_per_person.toLocaleString('pt-BR')}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-1">/ {t('pessoa')}</span>
                      </div>
                      <Link
                        href={lp(`/coreia-do-sul/jornadas/${journey.slug}`)}
                        className="inline-flex items-center gap-1.5 bg-primary hover:bg-accent-hover text-white transition-all text-[10px] font-bold py-2.5 px-5 rounded-xl uppercase tracking-wider shadow-sm"
                      >
                        {t('CONHECER JORNADA')}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
