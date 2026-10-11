'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar, Clock, MapPin, Search, Users } from 'lucide-react';
import SmartImage from '@/components/SmartImage';
import { useLanguage } from '@/contexts/LanguageContext';

export interface JourneyCard {
  id: string;
  title: string;
  subtitle: string;
  /** Rótulo de categoria já traduzido no servidor (vazio se não houver). */
  tag: string;
  isFeatured: boolean;
  days: number;
  /** Vagas da próxima saída; 0 quando não há saída cadastrada. */
  spots: number;
  totalSpots: number;
  price: number;
  /** Preço já formatado no servidor — sem `toLocaleString()` no cliente. */
  priceLabel: string;
  /** Rótulo da próxima saída já formatado; `null` quando não há. */
  departureLabel: string | null;
  image: string;
  fallbackImage: string;
  url: string;
  /** Nomes de destino (para o filtro por cidade). */
  cities: string[];
  /** Texto minúsculo já normalizado para a busca. */
  searchText: string;
}

interface JourneyExplorerProps {
  journeys: JourneyCard[];
  /** Template de contagem com `{n}` — preenchido no cliente com `formatNumber`. */
  countTemplate: string;
  countLabelOne: string;
  emptyTitle: string;
  emptyDescription: string;
  searchLabel: string;
  searchPlaceholder: string;
  clearLabel: string;
  filters: { id: string; label: string }[];
  ctaLabel: string;
  featuredBadge: string;
  daysTemplate: string;
  spotsTemplate: string;
  priceFromLabel: string;
  priceOnRequestLabel: string;
}

const CITY_TOKENS: Record<string, string[]> = {
  seoul: ['seul', 'seoul', 'seúl'],
  busan: ['busan'],
  daegu: ['daegu', 'daegu'],
  jeju: ['jeju'],
};

const normalize = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

/**
 * Listagem de jornadas com busca e filtro por cidade.
 *
 * Filtro 100% no cliente: são no máximo 6 cartões serializados do servidor, e
 * isso evita uma rodada de rede a cada tecla. A normalização de acentos
 * acontece uma única vez, no servidor (`searchText` / `cities`).
 */
export default function JourneyExplorer({
  journeys,
  countTemplate,
  countLabelOne,
  emptyTitle,
  emptyDescription,
  searchLabel,
  searchPlaceholder,
  clearLabel,
  filters,
  ctaLabel,
  featuredBadge,
  daysTemplate,
  spotsTemplate,
  priceFromLabel,
  priceOnRequestLabel,
}: JourneyExplorerProps) {
  const { formatNumber } = useLanguage();
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('all');

  const visible = useMemo(() => {
    const needle = normalize(query.trim());
    const tokens = city === 'all' ? null : (CITY_TOKENS[city] ?? null);
    return journeys.filter((journey) => {
      if (tokens && !journey.cities.some((name) => tokens.includes(normalize(name)))) return false;
      if (needle && !journey.searchText.includes(needle)) return false;
      return true;
    });
  }, [journeys, query, city]);

  return (
    <div className="flex flex-col gap-8">
      {/* ── Controles ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="relative flex-1">
          <label htmlFor="jornadas-search" className="sr-only">
            {searchLabel}
          </label>
          <input
            id="jornadas-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-[#150E0C] border border-[#3D2620] text-white text-[12px] px-5 py-4 pr-12 placeholder:text-gray-500 focus:outline-none focus:border-[#C8A27C] transition-colors rounded-none"
          />
          <Search aria-hidden className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label={searchLabel}>
          {filters.map((filter) => {
            const active = city === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                aria-pressed={active}
                onClick={() => setCity(filter.id)}
                className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                  active
                    ? 'bg-[#C8A27C] text-[#0F0A08] border-[#C8A27C]'
                    : 'bg-transparent text-[#C8A27C] border-[#3D2620] hover:border-[#C8A27C]'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Resultado ───────────────────────────────────────────────────────── */}
      <p aria-live="polite" className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
        {visible.length === 1
          ? countLabelOne
          : countTemplate.replace('{n}', formatNumber(visible.length))}
        {query.trim() || city !== 'all' ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setCity('all');
            }}
            className="ml-4 text-[#C8A27C] hover:underline normal-case tracking-normal"
          >
            {clearLabel}
          </button>
        ) : null}
      </p>

      {visible.length === 0 ? (
        <div className="border border-[#3D2620] bg-[#150E0C] rounded-sm py-16 px-6 text-center">
          <MapPin aria-hidden className="w-10 h-10 mx-auto text-[#C8A27C] mb-4" />
          <h3 className="font-heading text-xl font-light text-white">{emptyTitle}</h3>
          <p className="text-xs text-gray-400 mt-2">{emptyDescription}</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map((journey) => (
            <li
              key={journey.id}
              className="group bg-[#150E0C] border border-[#3D2620] rounded-sm overflow-hidden flex flex-col hover:border-[#C8A27C]/50 transition-colors"
            >
              <div className="relative h-[180px] w-full overflow-hidden">
                <SmartImage
                  src={journey.image}
                  alt={journey.title}
                  fill
                  sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                  quality={75}
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  fallbackSrc={journey.fallbackImage || undefined}
                  placeholderLabel={journey.title}
                />
                {journey.tag ? (
                  <span className="absolute top-4 left-4 bg-[#0F0A08] text-white text-[9px] font-bold px-2 py-1 uppercase tracking-widest border border-[#3D2620]">
                    {journey.tag}
                  </span>
                ) : null}
                {journey.isFeatured ? (
                  <span className="absolute top-4 right-4 bg-[#C8A27C] text-[#0F0A08] text-[9px] font-bold px-2 py-1 uppercase tracking-widest">
                    {featuredBadge}
                  </span>
                ) : null}
              </div>

              <div className="p-6 flex flex-col flex-1">
                {journey.subtitle ? (
                  <p className="text-[10px] text-gray-500 font-light leading-relaxed mb-2 line-clamp-2">
                    {journey.subtitle}
                  </p>
                ) : null}
                <h3 className="text-xl font-heading text-white font-light leading-snug mb-3 group-hover:text-[#C8A27C] transition-colors">
                  <Link href={journey.url}>{journey.title}</Link>
                </h3>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-4">
                  {journey.days > 0 ? (
                    <span className="flex items-center gap-1.5">
                      <Clock aria-hidden className="h-3 w-3 text-[#C8A27C]" />
                      {daysTemplate.replace('{n}', formatNumber(journey.days))}
                    </span>
                  ) : null}
                  {journey.cities.length > 0 ? (
                    <span className="flex items-center gap-1.5">
                      <MapPin aria-hidden className="h-3 w-3 text-[#C8A27C]" />
                      {journey.cities.join(' + ')}
                    </span>
                  ) : null}
                  {journey.spots > 0 ? (
                    <span className="flex items-center gap-1.5">
                      <Users aria-hidden className="h-3 w-3 text-[#C8A27C]" />
                      {spotsTemplate.replace('{n}', formatNumber(journey.spots))}
                    </span>
                  ) : null}
                </div>

                <div className="mt-auto pt-4 border-t border-[#3D2620] flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    {journey.price > 0 ? (
                      <>
                        <span className="block text-[9px] text-gray-500 uppercase tracking-widest">
                          {priceFromLabel}
                        </span>
                        <span className="font-heading text-lg text-white font-medium">
                          {journey.priceLabel}
                        </span>
                      </>
                    ) : (
                      <span className="text-[9px] text-gray-500 uppercase tracking-widest">
                        {priceOnRequestLabel}
                      </span>
                    )}
                    {journey.departureLabel ? (
                      <p className="text-[9px] text-gray-500 font-light mt-1 flex items-center gap-1.5">
                        <Calendar aria-hidden className="h-3 w-3" />
                        {journey.departureLabel}
                      </p>
                    ) : null}
                  </div>
                  <Link
                    href={journey.url}
                    className="shrink-0 inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-[#0F0A08] bg-[#C8A27C] hover:bg-[#B8906C] transition-colors px-4 py-2.5"
                  >
                    {ctaLabel}
                    <ArrowRight aria-hidden className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
