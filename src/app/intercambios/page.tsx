'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Compass, GraduationCap, Clock, Award } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';

export default function IntercambiosPage() {
  const intercambios = [
    {
      title: 'Intercâmbio de Idiomas & Cultura em Seul',
      duration: '4 a 12 semanas',
      institution: 'Sogang University / Lexis Korea',
      desc: 'Aprenda coreano no coração de Seul, com hospedagem em estúdio de luxo e atividades culturais inclusas (culinária, caligrafia e K-Pop).',
      price: 'A partir de US$ 2,800',
      image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=600'
    },
    {
      title: 'Semestre Acadêmico em Tóquio',
      duration: '6 meses',
      institution: 'Waseda University',
      desc: 'Imersão completa no ambiente acadêmico japonês com aulas de negócios e cultura. Acomodação premium em Shinjuku.',
      price: 'A partir de US$ 5,900',
      image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=600'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      <main className="flex-1 py-16 px-4 md:px-8 max-w-6xl mx-auto w-full">
        <div className="max-w-2xl mb-12">
          <span className="text-xs uppercase tracking-widest text-primary font-bold">Imersão de Prestígio</span>
          <h1 className="font-heading text-4xl sm:text-5xl font-light text-secondary mt-2">Programas de Intercâmbio</h1>
          <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
            Estude nas melhores universidades da Ásia com suporte completo da Maeum Global. Cuidamos de todo o processo de visto, matrícula, hospedagem executiva e acolhimento local.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {intercambios.map((item, idx) => (
            <div key={idx} className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between group">
              <div className="relative aspect-video w-full">
                <Image src={item.image} alt={item.title} fill className="object-cover group-hover:scale-102 transition-transform duration-500" />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[10px] text-accent font-bold uppercase tracking-wider mb-2">
                    <GraduationCap className="h-4 w-4" />
                    <span>{item.institution}</span>
                  </div>
                  <h3 className="font-heading text-xl font-bold text-secondary">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{item.desc}</p>
                </div>
                <div className="flex items-center justify-between border-t border-border mt-6 pt-4">
                  <span className="text-xs font-bold text-primary font-heading">{item.price}</span>
                  <Link href="/contato">
                    <Button className="bg-primary hover:bg-accent-hover text-white text-[10px] font-bold py-1.5 h-8 px-4 rounded-xl">
                      SOLICITAR ORÇAMENTO
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
