'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, X, ArrowRight, Calendar, Landmark } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const PACKAGES = [
  {
    id: 'p-1',
    title: 'Essência da Coreia do Sul',
    slug: 'essencia-da-coreia-do-sul',
    price: 3500.00,
    duration: '10 Dias / 9 Noites',
    destination: 'Coreia do Sul',
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=600',
    included: ['Traslado privativo aeroporto/hotel', 'Hospedagem 5 estrelas em Seul e Busan', 'Guia bilíngue em português e coreano', 'Ingressos de todas as atrações listadas'],
    not_included: ['Passagens aéreas internacionais', 'Seguro viagem internacional (adicional recomendado)', 'Almoços e jantares livres']
  },
  {
    id: 'p-2',
    title: 'Japão Tradicional e Moderno',
    slug: 'japao-tradicional-e-moderno',
    price: 4900.00,
    duration: '12 Dias / 11 Noites',
    destination: 'Japão',
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=600',
    included: ['JR Rail Pass de 7 dias (Trem-bala)', 'Hospedagem em Ryokans tradicionais com onsen', 'Guia especializado em cultura e gastronomia', 'Traslados VIP de chegada/saída'],
    not_included: ['Voos internacionais', 'Despesas pessoais e souvenirs', 'Refeições não especificadas no roteiro']
  }
];

export default function PacotesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 py-16 px-4 md:px-8 max-w-7xl mx-auto w-full">
        <div className="max-w-2xl mb-12">
          <span className="text-xs uppercase tracking-widest text-primary font-bold">MAEUM GLOBAL</span>
          <h1 className="font-heading text-4xl sm:text-5xl font-light text-secondary mt-2">Pacotes de Viagem</h1>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
            Roteiros de alto padrão com curadoria exclusiva. Nossos pacotes contam com transfers privativos, hospedagem 5 estrelas e guias experientes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {PACKAGES.map((pkg) => (
            <div key={pkg.id} className="bg-card border border-border/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="relative aspect-[16/9] w-full overflow-hidden">
                  <Image src={pkg.image} alt={pkg.title} fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between text-white">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-primary bg-primary/20 backdrop-blur border border-primary/30 px-2 py-0.5 rounded">
                        {pkg.destination}
                      </span>
                      <h3 className="font-heading text-xl font-medium mt-1">{pkg.title}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-300 block">A partir de</span>
                      <span className="text-lg font-bold text-primary font-heading">US$ {pkg.price.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground border-b border-border/60 pb-4 mb-4">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-primary" />
                      {pkg.duration}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Landmark className="h-4 w-4 text-primary" />
                      Hotéis 5★ e Ryokans
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                    <div>
                      <h4 className="font-bold text-green-700 uppercase tracking-wider mb-2">O QUE ESTÁ INCLUSO</h4>
                      <ul className="flex flex-col gap-2 text-muted-foreground">
                        {pkg.included.map((inc, i) => (
                          <li key={i} className="flex items-start gap-2 leading-relaxed">
                            <Check className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
                            <span>{inc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold text-red-700 uppercase tracking-wider mb-2">NÃO INCLUSO</h4>
                      <ul className="flex flex-col gap-2 text-muted-foreground">
                        {pkg.not_included.map((ninc, i) => (
                          <li key={i} className="flex items-start gap-2 leading-relaxed">
                            <X className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                            <span>{ninc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0">
                <Link href={`/destinos/coreia-do-sul`}>
                  <button className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-accent-hover text-white text-xs font-bold py-3 rounded-xl shadow transition-all">
                    SOLICITAR DETALHES DESTE PACOTE
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
