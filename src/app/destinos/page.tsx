'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowRight, Map, Camera, Leaf, Utensils, ShoppingBag, Star, 
  Heart, Compass, ShieldCheck, Headphones, Calendar, Award, Building,
  Waves, TreePine, Coffee, Landmark, Moon
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const DESTINATIONS = [
  {
    id: 'seoul',
    name: 'SEOUL',
    desc: 'Tradição e modernidade lado a lado. Palácios históricos, bairros vibrantes, compras, cafés e a energia de uma metrópole que nunca para.',
    image: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?q=80&w=800',
    features: [
      { icon: Landmark, label: 'Cultura' },
      { icon: ShoppingBag, label: 'Compras' },
      { icon: Utensils, label: 'Gastronomia' },
      { icon: Moon, label: 'Vida Noturna' },
    ]
  },
  {
    id: 'busan',
    name: 'BUSAN',
    desc: 'O mar, as montanhas e uma atmosfera descontraída. Praias, templos à beira-mar, passeios únicos e uma gastronomia que é de dar água na boca.',
    image: 'https://images.unsplash.com/photo-1588667590805-728b74f3ebda?q=80&w=800',
    features: [
      { icon: Waves, label: 'Praias' },
      { icon: Landmark, label: 'Templos' },
      { icon: ShoppingBag, label: 'Mercados' },
      { icon: Utensils, label: 'Gastronomia' },
    ]
  },
  {
    id: 'daegu',
    name: 'DAEGU',
    desc: 'A Coreia que muitos ainda não conhecem. Cidades acolhedora, rica em cultura local, ruas históricas e cafés encantadores.',
    image: 'https://images.unsplash.com/photo-1590209673531-1585f52e5a25?q=80&w=800',
    features: [
      { icon: Users, label: 'Cultura Local' },
      { icon: Coffee, label: 'Cafés' },
      { icon: Landmark, label: 'História' },
      { icon: Leaf, label: 'Natureza' },
    ]
  },
  {
    id: 'jeju',
    name: 'JEJU',
    desc: 'A ilha mais amada da Coreia. Natureza exuberante, trilhas, cachoeiras, campos de flores e paisagens que parecem ter saído de um sonho.',
    image: 'https://images.unsplash.com/photo-1583098380252-16a75f5647a7?q=80&w=800',
    features: [
      { icon: TreePine, label: 'Natureza' },
      { icon: Map, label: 'Trilhas' },
      { icon: Waves, label: 'Cachoeiras' },
      { icon: Coffee, label: 'Relaxamento' },
    ]
  }
];

// Helper icon component for 'Users' alternative
function Users(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

export default function DestinosPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0F0A08] text-[#EFEBE4] font-sans selection:bg-[#C8A27C] selection:text-[#0F0A08]">
      <Header />

      {/* 1. Hero Section */}
      <section className="relative h-[100dvh] flex flex-col justify-center overflow-hidden border-b border-[#3D2620]">
        <div className="absolute inset-0 z-0">
          <Image 
            src="/images/agencia-viagens-coreia-do-sul-maeum-global-destinos.webp" 
            alt="Destinos na Coreia" 
            fill 
            className="object-cover object-center hidden md:block" 
            priority
          />
          <Image 
            src="/images/mobile/agencia-viagens-coreia-do-sul-maeum-global-destinos-mobile.webp" 
            alt="Destinos na Coreia Mobile" 
            fill 
            className="object-cover object-center block md:hidden" 
            priority
          />
        </div>

        <div className="relative z-10 px-6 sm:px-12 max-w-[1400px] mx-auto w-full flex flex-col items-start gap-6 pt-20">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold">
            DESTINOS
          </span>
          <h1 className="font-heading text-5xl sm:text-7xl font-light tracking-wide leading-tight text-white">
            Descubra a <br />
            Coreia do Sul
          </h1>
          <p className="text-[13px] text-gray-300 max-w-[400px] font-light leading-relaxed mt-2 opacity-90">
            Quatro destinos, infinitas possibilidades. 
            Da modernidade vibrante à natureza 
            intocada, cada cidade oferece experiências 
            únicas que vão transformar a sua viagem 
            em memórias inesquecíveis.
          </p>
          <button className="flex items-center justify-center gap-3 bg-transparent border border-[#3D2620] hover:border-[#C8A27C] text-[#C8A27C] font-bold text-[10px] py-4 px-8 mt-4 rounded-none transition-all group uppercase tracking-widest">
            PLANEJE SUA JORNADA
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* 2. Main Content (Map & Destinations list) */}
      <section className="py-20 px-6 sm:px-12 max-w-[1400px] mx-auto w-full">
        <div className="flex flex-col lg:flex-row gap-16">
          
          {/* Left Col - Map */}
          <div className="lg:w-1/3 flex flex-col relative">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-bold mb-6">
              A COREIA DO SUL
            </span>
            <p className="text-[12px] text-gray-400 font-light leading-relaxed max-w-[280px] mb-12">
              Um país que combina tradição 
              e inovação como poucos. 
              Explore o melhor de cada 
              região com roteiros feitos 
              para você viver o que a 
              Coreia tem de mais especial.
            </p>

            {/* Stylized Map Area */}
            <div className="relative w-full h-[500px] opacity-80">
              {/* Abstract Map Shape (Using an image or SVG would be better, but we simulate it with positioning) */}
              <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/e4/South_Korea_location_map.svg')] bg-contain bg-no-repeat bg-left-top opacity-10 filter invert sepia hue-rotate-[340deg] saturate-[300%]" />
              
              {/* Map Points */}
              <div className="absolute top-[20%] left-[40%] flex items-center gap-3">
                <div className="relative">
                  <div className="w-3 h-3 rounded-full border border-[#C8A27C] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C8A27C]" />
                  </div>
                  <div className="absolute -inset-2 rounded-full border border-[#C8A27C]/20 animate-ping" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-[#C8A27C] tracking-widest">SEOUL</span>
                  <span className="text-[9px] text-gray-500">Capital e coração<br/>da Coreia.</span>
                </div>
              </div>

              <div className="absolute top-[50%] left-[55%] flex items-center gap-3">
                <div className="relative">
                  <div className="w-3 h-3 rounded-full border border-[#C8A27C] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C8A27C]/50" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-[#C8A27C] tracking-widest">DAEGU</span>
                  <span className="text-[9px] text-gray-500">Cultura local<br/>e história viva.</span>
                </div>
              </div>

              <div className="absolute top-[65%] left-[60%] flex items-center gap-3">
                <div className="relative">
                  <div className="w-3 h-3 rounded-full border border-[#C8A27C] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C8A27C]/50" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-[#C8A27C] tracking-widest">BUSAN</span>
                  <span className="text-[9px] text-gray-500">Praias, mar<br/>e energia única.</span>
                </div>
              </div>

              <div className="absolute top-[85%] left-[30%] flex items-center gap-3">
                <div className="relative">
                  <div className="w-3 h-3 rounded-full border border-[#C8A27C] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C8A27C]/50" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-[#C8A27C] tracking-widest">JEJU</span>
                  <span className="text-[9px] text-gray-500">Natureza paradisíaca<br/>e tranquilidade.</span>
                </div>
              </div>

              {/* Dotted lines connecting them */}
              <svg className="absolute inset-0 w-full h-full" style={{ zIndex: -1 }}>
                <path d="M 120 100 L 165 250 L 180 325" fill="none" stroke="#3D2620" strokeWidth="1" strokeDasharray="4 4" />
              </svg>

              {/* Compass */}
              <div className="absolute bottom-0 left-0">
                <Compass className="w-16 h-16 text-[#3D2620]" strokeWidth={1} />
                <span className="absolute top-[-10px] left-1/2 -translate-x-1/2 text-[8px] text-gray-600">N</span>
                <span className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 text-[8px] text-gray-600">S</span>
                <span className="absolute right-[-10px] top-1/2 -translate-y-1/2 text-[8px] text-gray-600">E</span>
                <span className="absolute left-[-10px] top-1/2 -translate-y-1/2 text-[8px] text-gray-600">W</span>
              </div>
            </div>
          </div>

          {/* Right Col - Destinations */}
          <div className="lg:w-2/3 flex flex-col gap-6">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-bold mb-2">
              CONHEÇA NOSSOS DESTINOS
            </span>

            {DESTINATIONS.map((dest) => (
              <div key={dest.id} className="group bg-[#150E0C] border border-[#3D2620] rounded-sm overflow-hidden flex flex-col md:flex-row hover:border-[#C8A27C]/50 transition-colors cursor-pointer min-h-[220px]">
                <div className="relative md:w-[40%] h-[200px] md:h-auto overflow-hidden">
                  <Image src={dest.image} alt={dest.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="p-8 md:w-[60%] flex flex-col relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading text-2xl text-white font-light uppercase tracking-wide group-hover:text-[#C8A27C] transition-colors">{dest.name}</h3>
                    <div className="w-8 h-8 rounded-full border border-[#3D2620] group-hover:border-[#C8A27C] flex items-center justify-center transition-colors">
                      <ArrowRight className="w-3 h-3 text-gray-500 group-hover:text-[#C8A27C]" />
                    </div>
                  </div>
                  <p className="text-[12px] text-gray-400 font-light leading-relaxed mb-6 flex-1">
                    {dest.desc}
                  </p>
                  <div className="grid grid-cols-4 gap-2 pt-4 border-t border-[#3D2620]">
                    {dest.features.map((feat, idx) => {
                      const Icon = feat.icon;
                      return (
                        <div key={idx} className="flex flex-col items-center gap-2">
                          <Icon className="w-5 h-5 text-[#C8A27C]" strokeWidth={1.5} />
                          <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest text-center">{feat.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 3. Features Section */}
      <section className="py-16 px-6 sm:px-12 max-w-[1400px] mx-auto w-full border-t border-[#3D2620]">
        <div className="text-center mb-12">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-bold">
            O QUE TORNA A COREIA DO SUL ESPECIAL
          </span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <Heart className="w-8 h-8 text-[#C8A27C]" strokeWidth={1} />
            <div className="flex flex-col">
              <span className="text-[11px] text-white font-bold mb-2">Hospitalidade</span>
              <span className="text-[10px] text-gray-400 font-light leading-relaxed">Um povo acolhedor<br/>e experiências<br/>autênticas.</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-4">
            <Camera className="w-8 h-8 text-[#C8A27C]" strokeWidth={1} />
            <div className="flex flex-col">
              <span className="text-[11px] text-white font-bold mb-2">Cultura Vibrante</span>
              <span className="text-[10px] text-gray-400 font-light leading-relaxed">Tradições milenares<br/>e a influência pop<br/>que conquista o mundo.</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-4">
            <Leaf className="w-8 h-8 text-[#C8A27C]" strokeWidth={1} />
            <div className="flex flex-col">
              <span className="text-[11px] text-white font-bold mb-2">Natureza Diversa</span>
              <span className="text-[10px] text-gray-400 font-light leading-relaxed">Montanhas, ilhas, praias<br/>e paisagens para todos<br/>os estilos de viajantes.</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-4">
            <Utensils className="w-8 h-8 text-[#C8A27C]" strokeWidth={1} />
            <div className="flex flex-col">
              <span className="text-[11px] text-white font-bold mb-2">Gastronomia Única</span>
              <span className="text-[10px] text-gray-400 font-light leading-relaxed">Sabores marcantes<br/>e pratos que são uma<br/>experiência à parte.</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-4">
            <ShoppingBag className="w-8 h-8 text-[#C8A27C]" strokeWidth={1} />
            <div className="flex flex-col">
              <span className="text-[11px] text-white font-bold mb-2">Compras e Beleza</span>
              <span className="text-[10px] text-gray-400 font-light leading-relaxed">Do K-beauty à moda,<br/>tudo que você precisa<br/>em um só lugar.</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-4">
            <Star className="w-8 h-8 text-[#C8A27C]" strokeWidth={1} />
            <div className="flex flex-col">
              <span className="text-[11px] text-white font-bold mb-2">Experiências Exclusivas</span>
              <span className="text-[10px] text-gray-400 font-light leading-relaxed">Roteiros personalizados<br/>que vão além do óbvio e<br/>dos pontos turísticos.</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Bottom CTA Section */}
      <section className="py-12 px-6 sm:px-12 max-w-[1400px] mx-auto w-full">
        <div className="relative w-full border border-[#3D2620] overflow-hidden rounded-sm flex flex-col md:flex-row bg-[#150E0C]">
          
          <div className="absolute inset-0 z-0">
            <Image 
              src="https://images.unsplash.com/photo-1590209673531-1585f52e5a25?q=80&w=1600" 
              alt="Gyeongbokgung Palace at Sunset" 
              fill 
              className="object-cover object-center" 
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0F0A08] via-[#0F0A08]/90 to-transparent w-full md:w-2/3" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0F0A08]/20 to-[#0F0A08]/80" />
          </div>

          {/* Left side content */}
          <div className="w-full md:w-[60%] flex flex-col items-start justify-center text-left p-10 md:p-16 gap-6 relative z-10">
            <h2 className="font-heading text-4xl sm:text-5xl font-light text-white leading-[1.1]">
              Mais do que destinos, <br />
              <span className="italic text-[#C8A27C]">criamos jornadas.</span>
            </h2>
            <p className="text-[13px] text-gray-300 font-light max-w-md leading-relaxed">
              Conte com especialistas que vivem a Coreia 
              para planejar cada detalhe da sua viagem 
              e transformar sonhos em realidade.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-6 mt-4 w-full sm:w-auto">
              <button className="flex items-center justify-center gap-3 bg-[#C8A27C] hover:bg-[#B8906C] text-[#0F0A08] font-bold text-[10px] py-4 px-8 rounded-none transition-all group uppercase tracking-widest w-full sm:w-auto">
                SOLICITAR PLANEJAMENTO
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <Link href="/jornadas" className="flex items-center justify-center bg-transparent border border-[#3D2620] hover:border-[#C8A27C] text-[#C8A27C] font-bold text-[10px] py-4 px-8 rounded-none transition-all uppercase tracking-widest w-full sm:w-auto">
                CONHECER JORNADAS
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Support Info Footer */}
      <section className="bg-[#150E0C] border-t border-b border-[#3D2620] py-8 px-6">
        <div className="max-w-[1400px] mx-auto grid grid-cols-2 md:grid-cols-5 gap-6 opacity-80">
          <div className="flex items-start gap-4">
            <ShieldCheck className="w-6 h-6 text-[#C8A27C] shrink-0" strokeWidth={1.5} />
            <div className="flex flex-col">
              <span className="text-[10px] text-white font-bold mb-1">Segurança</span>
              <span className="text-[9px] text-gray-400">Suporte completo<br/>antes e durante<br/>sua viagem.</span>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Headphones className="w-6 h-6 text-[#C8A27C] shrink-0" strokeWidth={1.5} />
            <div className="flex flex-col">
              <span className="text-[10px] text-white font-bold mb-1">Consultoria<br/>Especializada</span>
              <span className="text-[9px] text-gray-400">Atendimento humanizado<br/>e em português.</span>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Calendar className="w-6 h-6 text-[#C8A27C] shrink-0" strokeWidth={1.5} />
            <div className="flex flex-col">
              <span className="text-[10px] text-white font-bold mb-1">Roteiros<br/>Personalizados</span>
              <span className="text-[9px] text-gray-400">Cada detalhe pensado<br/>para você.</span>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Heart className="w-6 h-6 text-[#C8A27C] shrink-0" strokeWidth={1.5} />
            <div className="flex flex-col">
              <span className="text-[10px] text-white font-bold mb-1">Parcerias<br/>Confiáveis</span>
              <span className="text-[9px] text-gray-400">Os melhores parceiros<br/>na Coreia do Sul.</span>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Award className="w-6 h-6 text-[#C8A27C] shrink-0" strokeWidth={1.5} />
            <div className="flex flex-col">
              <span className="text-[10px] text-white font-bold mb-1">Experiências<br/>Autênticas</span>
              <span className="text-[9px] text-gray-400">Vivencie o que a maioria<br/>dos turistas não vê.</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
