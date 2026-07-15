'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, Calendar, Heart } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';

export default function ExperienciasPage() {
  const experiencias = [
    {
      title: 'Workshop de K-Beauty & Skincare de Luxo',
      location: 'Gangnam, Seul',
      desc: 'Consulta dermatológica exclusiva em clínica VIP de Seul, seguida por um workshop privado sobre a formulação de cosméticos coreanos personalizados.',
      price: 'US$ 650 / pessoa',
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600'
    },
    {
      title: 'Ritual do Chá & Meditação Zen em Quioto',
      location: 'Templo de Daitoku-ji, Japão',
      desc: 'Participe de uma cerimônia de chá privada ministrada por um monge budista em um templo fechado ao público geral.',
      price: 'US$ 450 / pessoa',
      image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=600'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      <main className="flex-1 py-16 px-4 md:px-8 max-w-6xl mx-auto w-full">
        <div className="max-w-2xl mb-12">
          <span className="text-xs uppercase tracking-widest text-primary font-bold">Vivências Curadas</span>
          <h1 className="font-heading text-4xl sm:text-5xl font-light text-secondary mt-2">Experiências Exclusivas</h1>
          <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
            Roteiros temáticos focados em autocuidado, gastronomia autêntica e workshops privados que não estão disponíveis em agências tradicionais.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {experiencias.map((item, idx) => (
            <div key={idx} className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between group">
              <div className="relative aspect-video w-full">
                <Image src={item.image} alt={item.title} fill unoptimized className="object-cover group-hover:scale-102 transition-transform duration-500" />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[10px] text-primary font-bold uppercase tracking-wider mb-2">
                    <Sparkles className="h-4 w-4" />
                    <span>{item.location}</span>
                  </div>
                  <h3 className="font-heading text-xl font-bold text-secondary">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{item.desc}</p>
                </div>
                <div className="flex items-center justify-between border-t border-border mt-6 pt-4">
                  <span className="text-xs font-bold text-primary font-heading">{item.price}</span>
                  <Link href="/contato">
                    <Button className="bg-primary hover:bg-accent-hover text-white text-[10px] font-bold py-1.5 h-8 px-4 rounded-xl">
                      AGENDAR EXPERIÊNCIA
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
