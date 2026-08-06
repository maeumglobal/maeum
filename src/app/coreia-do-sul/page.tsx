'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Compass, Sparkles, GraduationCap, Map, Heart, UtensilsCrossed, Palette, Landmark, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const CATEGORIES = [
  {
    title: 'Experiências na Coreia',
    slug: 'experiencias',
    description: 'Viva momentos únicos com experiências individuais cuidadosamente selecionadas — da culinária ao lifestyle coreano.',
    icon: Compass,
    color: 'from-[#8B0000]/80 to-[#8B0000]',
  },
  {
    title: 'Experiências K-Beauty',
    slug: 'k-beauty',
    description: 'Descubra o universo da beleza coreana com clínicas premium, skincare de ponta e consultorias exclusivas.',
    icon: Sparkles,
    color: 'from-[#B8860B]/80 to-[#B8860B]',
  },
  {
    title: 'Intercâmbio na Coreia',
    slug: 'intercambio',
    description: 'Programas de intercâmbio de alto padrão com escolas renomadas, acomodações premium e suporte completo.',
    icon: GraduationCap,
    color: 'from-[#8B0000]/80 to-[#8B0000]',
  },
  {
    title: 'Jornadas Maeum',
    slug: 'jornadas',
    description: 'Grupos exclusivos com roteiros imersivos, acompanhamento local e experiências que transformam.',
    icon: Map,
    color: 'from-[#B8860B]/80 to-[#B8860B]',
  },
];

const HIGHLIGHTS = [
  {
    title: 'Cultura Milenar',
    description: 'Palácios centenários, templos budistas, vilarejos tradicionais e uma rica herança cultural que convive em harmonia com o moderno.',
    icon: Landmark,
  },
  {
    title: 'Gastronomia Incomparável',
    description: 'Do kimchi ao bulgogi, passando pelos mercados de rua e restaurantes com estrelas Michelin — a culinária coreana é uma experiência por si só.',
    icon: UtensilsCrossed,
  },
  {
    title: 'K-Beauty & Bem-Estar',
    description: 'A Coreia é a capital global da beleza. Clínicas de skincare, spas de luxo e as tendências mais inovadoras do mundo da estética.',
    icon: Palette,
  },
  {
    title: 'História & Tradição',
    description: 'Palácios da dinastia Joseon, templos budistas milenares e vilarejos preservados contam a história de um povo orgulhoso de suas raízes.',
    icon: Landmark,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeInOut' as const },
  },
};

export default function CoreiaDoSulPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      {/* Hero Banner */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/agencia-viagens-coreia-do-sul-maeum-global-destinos.webp"
            alt="Coreia do Sul Desktop"
            fill
            className="object-cover object-center scale-105 hidden md:block"
            priority
          />
          <Image
            src="/images/mobile/agencia-viagens-coreia-do-sul-maeum-global-destinos-mobile.webp"
            alt="Coreia do Sul Mobile"
            fill
            className="object-cover object-center scale-105 block md:hidden"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1C] via-[#1C1C1C]/50 to-black/60" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto text-white flex flex-col items-center gap-5">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xs uppercase tracking-[0.2em] text-[#C8A27C] font-bold bg-[#C8A27C]/10 backdrop-blur border border-[#C8A27C]/30 rounded-full px-4 py-1.5"
          >
            MAEUM GLOBAL
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="font-heading text-5xl sm:text-7xl md:text-8xl font-light tracking-wide leading-tight text-white"
          >
            Coreia do Sul
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="text-base sm:text-lg text-gray-200 max-w-xl font-light tracking-wide"
          >
            Descubra a Coreia através de experiências únicas
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="flex gap-3 mt-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#C8A27C]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#C8A27C]/60" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#C8A27C]/30" />
          </motion.div>
        </div>
      </section>

      {/* Category Cards */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto w-full">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <motion.div key={cat.slug} variants={itemVariants}>
                <Link href={`/coreia-do-sul/${cat.slug}`} className="group block h-full">
                  <div className="relative h-full bg-card border border-border/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col">
                    <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                    <div className="p-8 flex flex-col items-center text-center gap-5 flex-1">
                      <div className="p-4 rounded-2xl bg-muted/50 group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-500">
                        <Icon className="h-8 w-8 text-accent group-hover:text-[#B8860B] transition-colors duration-500" />
                      </div>
                      <h3 className="font-heading text-xl font-medium text-secondary group-hover:text-primary transition-colors duration-300">
                        {cat.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {cat.description}
                      </p>
                    </div>
                    <div className="px-8 pb-8 pt-2">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-primary group-hover:text-[#B8860B] uppercase tracking-wider transition-colors duration-300">
                        Explorar
                        <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform duration-300" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* Por que a Coreia? */}
      <section className="py-20 px-4 md:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <span className="text-xs uppercase tracking-widest text-primary font-bold">MAEUM GLOBAL</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-light text-secondary mt-2">Por que a Coreia?</h2>
            <p className="text-sm text-muted-foreground mt-3 max-w-xl mx-auto leading-relaxed">
              Um país que encanta em todos os sentidos — da cultura milenar à vanguarda da inovação.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {HIGHLIGHTS.map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  variants={itemVariants}
                  className="group relative bg-card border border-border/80 rounded-2xl p-6 hover:shadow-lg transition-all duration-500 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100%] -mr-8 -mt-8 group-hover:bg-primary/10 transition-colors duration-500" />
                  <div className="relative z-10">
                      <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4 group-hover:bg-primary/20 transition-colors duration-500">
                        <Icon className="h-5 w-5 text-accent" />

                    </div>
                    <h3 className="font-heading text-lg font-medium text-secondary mb-2">{item.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
