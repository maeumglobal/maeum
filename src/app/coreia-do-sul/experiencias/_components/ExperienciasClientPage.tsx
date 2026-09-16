'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, MapPin, Clock, X, Search, SlidersHorizontal } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';

interface Experience {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  location: string;
  city: string;
  duration_hours: number;
  price_per_person: number;
  main_image: string;
  booking_type: string;
  status: string;
  category_slugs: string[];
}

interface Category {
  id: string;
  slug: string;
  name: string;
  active: boolean;
  sort_order: number;
}

interface Props {
  experiences: Experience[];
  categories: Category[];
}

export default function ExperienciasClientPage({ experiences, categories }: Props) {
  const { t, locale } = useLanguage();
  const lp = (path: string) => (locale === 'pt' || path === '/' ? path : `/${locale}${path}`);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [durationFilter, setDurationFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState('');

  const filteredExperiences = useMemo(() => {
    return experiences.filter((exp) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !exp.title.toLowerCase().includes(q) &&
          !exp.subtitle?.toLowerCase().includes(q) &&
          !exp.description?.toLowerCase().includes(q)
        ) return false;
      }
      if (selectedCategories.length > 0) {
        if (!selectedCategories.some((slug) => exp.category_slugs.includes(slug))) return false;
      }
      if (durationFilter) {
        const h = exp.duration_hours;
        if (durationFilter === '2' && h > 2) return false;
        if (durationFilter === '2-4' && (h < 2 || h > 4)) return false;
        if (durationFilter === '4-8' && (h < 4 || h > 8)) return false;
        if (durationFilter === '8' && h < 8) return false;
      }
      if (priceFilter) {
        const p = exp.price_per_person;
        if (priceFilter === '500' && p > 500) return false;
        if (priceFilter === '500-800' && (p < 500 || p > 800)) return false;
        if (priceFilter === '800-1200' && (p < 800 || p > 1200)) return false;
        if (priceFilter === '1200' && p < 1200) return false;
      }
      return true;
    });
  }, [experiences, searchQuery, selectedCategories, durationFilter, priceFilter]);

  const toggleCategory = (slug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setDurationFilter('');
    setPriceFilter('');
  };

  const hasActiveFilters = searchQuery || selectedCategories.length > 0 || durationFilter || priceFilter;

  const formatPrice = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace('R$', 'R$ ');

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      <main className="flex-1">
        {/* HERO */}
        <section className="relative pt-24 pb-12 md:pt-32 md:pb-16 px-4 md:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-3xl">
              <span className="inline-block text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-3">
                Maeum Global
              </span>
              <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-light text-secondary leading-tight">
                {t('Experiências na')}{' '}
                <span className="text-primary">{t('Coreia do Sul')}</span>
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-4 max-w-xl leading-relaxed">
                {t('Explore experiências cuidadosamente selecionadas em Seul — de rituais de bem-estar a tours gastronômicos, cada momento é desenhado para transformar sua viagem.')}
              </p>
            </div>
          </div>
        </section>

        {/* FILTERS */}
        <section className="sticky top-[72px] z-40 bg-background/95 backdrop-blur-md border-y border-border/40">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
            <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t('Buscar experiências...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-muted/50 border border-border rounded-xl text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-all"
                />
              </div>
              <select
                value={durationFilter}
                onChange={(e) => setDurationFilter(e.target.value)}
                className="px-3 py-2 bg-muted/50 border border-border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-all appearance-none cursor-pointer min-w-[140px]"
              >
                <option value="">{t('Qualquer duração')}</option>
                <option value="2">{t('Até 2h')}</option>
                <option value="2-4">{t('2-4h')}</option>
                <option value="4-8">{t('4-8h')}</option>
                <option value="8">{t('8h+')}</option>
              </select>
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="px-3 py-2 bg-muted/50 border border-border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-all appearance-none cursor-pointer min-w-[140px]"
              >
                <option value="">{t('Qualquer valor')}</option>
                <option value="500">{t('Até R$500')}</option>
                <option value="500-800">{t('R$500-R$800')}</option>
                <option value="800-1200">{t('R$800-R$1.200')}</option>
                <option value="1200">{t('R$1.200+')}</option>
              </select>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  {t('Limpar')}
                </button>
              )}
            </div>

            {/* Category tags */}
            <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              {categories.map((cat) => {
                const isActive = selectedCategories.includes(cat.slug);
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.slug)}
                    className={`shrink-0 px-4 py-1.5 rounded-xl text-[11px] font-medium border transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-secondary'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>

            {hasActiveFilters && (
              <p className="mt-2 text-[10px] text-muted-foreground">
                {filteredExperiences.length} {filteredExperiences.length !== 1 ? t('resultados') : t('resultado')}
              </p>
            )}
          </div>
        </section>

        {/* GRID */}
        <section className="px-4 md:px-8 py-8 md:py-12">
          <div className="max-w-7xl mx-auto">
            {filteredExperiences.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {filteredExperiences.map((exp) => {
                  const categoryInfo = categories.find((c) => exp.category_slugs.includes(c.slug));
                  return (
                    <Link
                      key={exp.id}
                      href={lp(`/coreia-do-sul/experiencias/${exp.slug}`)}
                      className="group block"
                    >
                      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col">
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <Image
                            src={exp.main_image}
                            alt={exp.title}
                            fill
                            unoptimized
                            className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                          {categoryInfo && (
                            <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm text-secondary text-[10px] font-semibold rounded-full shadow-sm">
                              {categoryInfo.name}
                            </span>
                          )}
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-sm hover:scale-105"
                            aria-label={t('Favoritar')}
                          >
                            <Heart className="h-4 w-4 text-secondary/70 hover:text-red-500 transition-colors" />
                          </button>
                        </div>

                        <div className="p-5 flex-1 flex flex-col">
                          <h3 className="font-heading text-lg font-semibold text-secondary leading-tight line-clamp-2">
                            {exp.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                            {exp.subtitle}
                          </p>
                          <div className="mt-auto pt-4 space-y-2">
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5 text-accent/70 shrink-0" />
                              <span>{exp.location}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                              <Clock className="h-3.5 w-3.5 text-accent/70 shrink-0" />
                              <span>{exp.duration_hours}h</span>
                            </div>
                          </div>
                          <div className="border-t border-border/60 my-3" />
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-heading text-base font-bold text-secondary">
                                {formatPrice(exp.price_per_person)}
                              </span>
                              <span className="text-[10px] text-muted-foreground ml-1">{t('/pessoa')}</span>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-3 py-1 rounded-full ${
                                exp.booking_type === 'direct'
                                  ? 'bg-primary/10 text-primary'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {exp.booking_type === 'direct' ? t('Reservar') : t('Solicitar')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-heading text-xl text-secondary mb-1">
                  {t('Nenhuma experiência encontrada')}
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  {t('Tente ajustar os filtros ou buscar por outros termos.')}
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-6 px-5 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-accent-hover transition-all"
                >
                  {t('Limpar Filtros')}
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
