'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Compass, ArrowRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const DESTINATIONS = [
  {
    id: 'd-1',
    name: 'Coreia do Sul',
    slug: 'coreia-do-sul',
    country: 'Coreia',
    desc: 'Um país fascinante que combina palácios tradicionais de dinastias milenares com a cultura pop contemporânea, tecnologia de ponta e clínicas exclusivas de K-Beauty.',
    image: 'https://images.unsplash.com/photo-1538669715515-5e3819766a9e?q=80&w=600',
    packages: 3
  },
  {
    id: 'd-2',
    name: 'Japão',
    slug: 'japao',
    country: 'Japão',
    desc: 'Encante-se com a harmonia dos templos históricos de Kyoto, os jardins zen, a gastronomia com estrelas Michelin e as ruas iluminadas de Tokyo.',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=600',
    packages: 2
  },
  {
    id: 'd-3',
    name: 'Vietnã',
    slug: 'vietna',
    country: 'Vietnã',
    desc: 'Explore paisagens deslumbrantes como a Baía de Ha Long, os charmosos templos de Hoi An e a rica herança culinária e histórica em Hanói.',
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=600',
    packages: 1
  }
];

export default function DestinosPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 py-16 px-4 md:px-8 max-w-7xl mx-auto w-full">
        <div className="max-w-2xl mb-12">
          <span className="text-xs uppercase tracking-widest text-primary font-bold">MAEUM GLOBAL</span>
          <h1 className="font-heading text-4xl sm:text-5xl font-light text-secondary mt-2">Destinos Exclusivos</h1>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
            Nossos destinos são cuidadosamente selecionados e planejados por especialistas nativos. Explore o melhor da Ásia Oriental com suporte e sofisticação incomparáveis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {DESTINATIONS.map((dest) => (
            <div key={dest.id} className="bg-card border border-border/80 rounded-3xl overflow-hidden shadow-sm group hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <Image
                    src={dest.image}
                    alt={dest.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="absolute bottom-4 left-4 text-white font-heading text-xl font-medium flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary fill-primary" />
                    {dest.name}
                  </span>
                </div>
                <div className="p-6">
                  <p className="text-xs text-primary font-semibold uppercase tracking-wider">{dest.packages} Pacotes Disponíveis</p>
                  <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                    {dest.desc}
                  </p>
                </div>
              </div>
              <div className="p-6 pt-0">
                <Link href={`/destinos/${dest.slug}`} className="w-full">
                  <button className="w-full flex items-center justify-center gap-2 bg-muted hover:bg-primary hover:text-white transition-all text-xs font-bold py-3 rounded-xl border border-border group-hover:border-primary/50 text-secondary">
                    VER PACOTES E ROTEIROS
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
