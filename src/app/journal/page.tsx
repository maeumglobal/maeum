'use client';

import React from 'react';
import Image from 'next/image';
import { Clock, Tag } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMedia } from '@/contexts/SiteContentContext';

const POSTS = [
  {
    id: 'p-1',
    title: 'Guia completo para explorar o Palácio Gyeongbokgung em Seul',
    summary: 'Aprenda sobre a história do palácio mais importante da dinastia Joseon, dicas de aluguel de hanbok e os melhores horários para a troca de guarda.',
    author: 'Mariana Santos',
    date: '10 de Junho, 2026',
    category: 'CULTURA',
    imageSlot: 'journal_post_1'
  },
  {
    id: 'p-2',
    title: 'O que comer no Mercado de Gwangjang: O guia definitivo',
    summary: 'Do famoso tteokbokki aos bolinhos de feijão mungo (bindaetteok) e o polêmico polvo vivo. Descubra os sabores da culinária de rua de Seul.',
    author: 'Mariana Santos',
    date: '28 de Maio, 2026',
    category: 'GASTRONOMIA',
    imageSlot: 'journal_post_2'
  }
];

export default function JournalPage() {
  const { t, locale } = useLanguage();
  const lp = (path: string) => (locale === 'pt' || path === '/' ? path : `/${locale}${path}`);
  const postImages = [useMedia('journal_post_1'), useMedia('journal_post_2')];
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 py-16 px-4 md:px-8 max-w-7xl mx-auto w-full">
        <div className="max-w-2xl mb-12">
          <span className="text-xs uppercase tracking-widest text-primary font-bold">{t('MAEUM JOURNAL')}</span>
          <h1 className="font-heading text-4xl sm:text-5xl font-light text-secondary mt-2">{t('Dicas & Relatos de Viagem')}</h1>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
            {t('Leia artigos produzidos pelas nossas consultoras e clientes compartilhando vivências, roteiros práticos e inspirações para a sua jornada.')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {POSTS.map((post, idx) => (
            <div key={post.id} className="bg-card border border-border/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  <Image src={postImages[idx]} alt={t(post.title)} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  <span className="absolute top-4 left-4 bg-primary text-white text-[9px] font-bold tracking-widest px-2 py-0.5 rounded uppercase">
                    {t(post.category)}
                  </span>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-semibold mb-2">
                    <Clock className="h-3.5 w-3.5 text-accent" />
                    <span>{t(post.date)}</span>
                    <span>•</span>
                    <span>{t('Por')} {post.author}</span>
                  </div>
                  <h3 className="font-heading text-xl font-medium text-secondary group-hover:text-primary transition-colors leading-snug">
                    {t(post.title)}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                    {t(post.summary)}
                  </p>
                </div>
              </div>
              <div className="p-6 pt-0">
                <button className="text-xs font-bold text-primary hover:text-accent-hover transition-colors flex items-center gap-1.5">
                  {t('LER ARTIGO COMPLETO')}
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}