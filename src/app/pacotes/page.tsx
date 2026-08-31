'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight, Check, MapPin, Users, Calendar, Award, Headphones, FileText, CalendarCheck, Crown, Clock, MessageCircle, HeartHandshake, Plane
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMedia } from '@/contexts/SiteContentContext';

const JORNADAS = [
  { tag: 'GRUPO FUNDADOR', tagColor: 'bg-[#8A3324]', title: 'Founding ARMY Edition', days: '14 dias', route: 'Seoul + Busan', exclusive: 'Grupo Exclusivo', desc: 'Uma jornada criada para fas de K-Pop que desejam viver a Coreia atraves da musica, da cultura e das conexoes que marcaram a historia do BTS.', price: 'R$ 26.500', pricePrefix: 'A partir de' },
  { tag: 'PRIMAVERA', tagColor: 'bg-[#B85D29]', title: 'Bom Sarang', days: '15 dias', route: 'Seoul + Busan', desc: 'Uma viagem inspirada na delicadeza da primavera coreana. Palacios historicos, cerimonias do cha, jardins floridos, gastronomia e momentos para desacelerar e viver cada detalhe.', price: 'R$ 29.700', pricePrefix: 'A partir de' },
  { tag: 'VERAO', tagColor: 'bg-[#B85D29]', title: 'Caravana de Verao', days: '10 dias', route: 'Seoul + Busan', desc: 'Dias ensolarados, praias de Busan, piqueniques no Rio Han, cafes escondidos e uma Coreia vibrante durante a estacao mais animada do ano.', price: '', pricePrefix: '', dualPrice: true, priceLiberty: 'R$ 29.000', pricePrestige: 'R$ 34.000' },
  { tag: 'COMPLETO', tagColor: 'bg-[#6B2727]', title: 'Always Destination', days: '15 dias', route: 'Seoul + Busan + Daegu', desc: 'Nosso roteiro mais completo. Perfeito para quem deseja conhecer diferentes regioes da Coreia atraves de experiencias cuidadosamente selecionadas.', price: 'R$ 39.000', pricePrefix: 'A partir de' },
  { tag: 'JEJU PREMIUM', tagColor: 'bg-[#4A1A1A]', title: 'The Horizon of Seven', days: '15 dias', route: 'Seoul + Busan + Jeju', desc: 'Paisagens vulcanicas, praias, campos de cha, hospedagens exclusivas e experiencias unicas. Uma viagem desenhada para quem busca o extraordinario.', price: 'R$ 42.000', pricePrefix: 'A partir de' }
];

const EXPERIENCES = [
  { title: 'Aula de culinaria coreana' }, { title: 'Oficina de Ceramica' }, { title: 'Hanbok Premium' },
  { title: 'Aula de danca K-Pop' }, { title: 'Ensaio Fotografico' }, { title: 'Trem Bala KTX' },
  { title: 'Cruzeiro no Rio Han' }, { title: 'Spa Coreano' }, { title: 'Cerimonia do Cha' },
  { title: 'Banho em Floresta' }, { title: 'Experiencia K-Beauty' }, { title: 'Welcome Gift' },
];

const INCLUDED = [
  'Passagem aerea internacional *','Seguro viagem','Hospedagem selecionada','Trem Bala KTX',
  'Coordenador Maeum Global','Guia em portugues','Reuniao Pre-Embarque','Planejamento personalizado',
  'Chip de internet','Welcome Kit exclusivo','Suporte durante toda a viagem','Atendimento em portugues','Grupo exclusivo e limitado'
];

export default function PacotesPage() {
  const { t, locale } = useLanguage();
  const heroDesktop = useMedia('pacotes_hero_desktop');
  const heroMobile  = useMedia('pacotes_hero_mobile');
  const lp = (path: string) => (locale === 'pt' || path === '/' ? path : `/${locale}${path}`);
  const jornadaImages = [
    useMedia('pacotes_jornada_army'), useMedia('pacotes_jornada_bom_sarang'), useMedia('pacotes_jornada_caravana'),
    useMedia('pacotes_jornada_always'), useMedia('pacotes_jornada_horizon'),
  ];
  const expImages = [
    useMedia('pacotes_experiencia_1'), useMedia('pacotes_experiencia_2'), useMedia('pacotes_experiencia_3'),
    useMedia('pacotes_experiencia_4'), useMedia('pacotes_experiencia_5'), useMedia('pacotes_experiencia_6'),
    useMedia('pacotes_experiencia_7'), useMedia('pacotes_experiencia_8'), useMedia('pacotes_experiencia_9'),
    useMedia('pacotes_experiencia_10'), useMedia('pacotes_experiencia_11'), useMedia('pacotes_experiencia_12'),
  ];
  const destinoSeoul  = useMedia('pacotes_destino_seoul');
  const destinoBusan  = useMedia('pacotes_destino_busan');
  const destinoDaegu  = useMedia('pacotes_destino_daegu');
  const destinoJeju   = useMedia('pacotes_destino_jeju');
  const inclusobanner = useMedia('pacotes_incluso_banner');
  const ctaTradition  = useMedia('pacotes_cta_tradition');

  return (
    <div className="flex flex-col min-h-screen bg-[#0F0A08] text-[#EFEBE4] font-sans selection:bg-[#C8A27C] selection:text-[#0F0A08]">
      <Header />

      {/* HERO */}
      <section className="relative min-h-[100dvh] flex flex-col justify-center overflow-hidden border-b border-[#3A232E]/30">
        <div className="absolute inset-0 z-0">
          <Image src={heroDesktop} alt={t('Agência de Viagens Coreia do Sul Maeum Global')} fill className="object-cover object-center hidden md:block" priority />
          <Image src={heroMobile}  alt={t('Agência de Viagens Coreia do Sul Maeum Global')} fill className="object-cover object-center block md:hidden" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F0A08] via-[#0F0A08]/70 to-transparent w-full sm:w-2/3" />
        </div>
        <div className="relative z-10 px-6 sm:px-12 max-w-7xl mx-auto w-full flex flex-col items-start gap-5 pt-28 md:pt-40 pb-20">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold">{t('MAEUM GLOBAL')}</span>
          <h1 className="font-heading text-5xl sm:text-6xl md:text-[80px] font-light tracking-wide leading-[1.1] text-white max-w-3xl">
            {t('Descubra uma')} <br />{t('Coreia que')} <span className="italic text-[#C8A27C]">{t('poucos')}</span><br/>{t('brasileiros conhecem.')}
          </h1>
          <p className="text-[13px] sm:text-sm text-gray-300 max-w-xl font-light leading-relaxed mt-2 opacity-90">
            {t('Cada roteiro da Maeum Global é desenvolvido para quem busca experiências autênticas, grupos exclusivos e uma imersão completa na cultura coreana.')}
          </p>
          <div className="flex flex-col gap-1 mt-2 mb-2">
            <span className="font-semibold text-white text-[13px] sm:text-sm">{t('Não vendemos excursões.')}</span>
            <span className="font-semibold text-white text-[13px] sm:text-sm">{t('Criamos jornadas.')}</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <Link href={lp('/jornadas')} className="flex items-center justify-center gap-3 bg-[#C8A27C] hover:bg-[#B8906C] text-[#0F0A08] font-bold text-[11px] py-4 px-8 rounded-none transition-all group uppercase tracking-widest">
              {t('CONHECER JORNADAS')} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href={lp('/contato')} className="flex items-center justify-center gap-3 bg-transparent border border-[#C8A27C] text-[#C8A27C] hover:bg-[#C8A27C]/10 font-bold text-[11px] py-4 px-8 rounded-none transition-all uppercase tracking-widest">
              <CalendarCheck className="w-4 h-4" /> {t('SOLICITAR PLANEJAMENTO')}
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-10 mt-16 pt-8 border-t border-white/10 w-full max-w-2xl opacity-70">
            <div className="flex flex-col items-center gap-3"><MapPin className="h-5 w-5 text-[#C8A27C]" strokeWidth={1} /><span className="text-[9px] text-gray-300 font-medium tracking-widest uppercase text-center">{t('Destino Exclusivo')}</span></div>
            <div className="flex flex-col items-center gap-3"><Users className="h-5 w-5 text-[#C8A27C]" strokeWidth={1} /><span className="text-[9px] text-gray-300 font-medium tracking-widest uppercase text-center">{t('Grupos Limitados')}<br/>{t('(Até 12 viajantes)')}</span></div>
            <div className="flex flex-col items-center gap-3"><Calendar className="h-5 w-5 text-[#C8A27C]" strokeWidth={1} /><span className="text-[9px] text-gray-300 font-medium tracking-widest uppercase text-center">{t('Saídas Programadas')}</span></div>
            <div className="flex flex-col items-center gap-3"><Award className="h-5 w-5 text-[#C8A27C]" strokeWidth={1} /><span className="text-[9px] text-gray-300 font-medium tracking-widest uppercase text-center">{t('Curadoria Premium')}</span></div>
          </div>
        </div>
      </section>

      {/* NOSSAS JORNADAS */}
      <section className="py-24 px-6 sm:px-12 max-w-[1400px] mx-auto w-full">
        <div className="text-center mb-16">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold block mb-3">{t('NOSSAS JORNADAS')}</span>
          <h2 className="font-heading text-3xl sm:text-4xl font-light text-white">{t('Cada grupo possui uma personalidade.')}</h2>
          <p className="text-sm text-gray-400 mt-3 font-light">{t('Escolha aquela que combina com a história que você deseja viver.')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {JORNADAS.map((j, idx) => (
            <div key={j.title} className="bg-[#261514] border border-[#3D2620] flex flex-col overflow-hidden group hover:border-[#C8A27C]/40 transition-colors">
              <div className="relative aspect-[16/9] w-full overflow-hidden">
                <Image src={jornadaImages[idx]} alt={j.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className={`absolute top-3 left-3 ${j.tagColor} text-white text-[8px] font-bold tracking-widest px-2.5 py-1 rounded-sm uppercase shadow-sm`}>{t(j.tag)}</div>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="font-heading text-xl font-medium text-white mb-3 leading-tight">{j.title}</h3>
                <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-4">
                  <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-[#C8A27C]" /> {t(j.days)}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-[#C8A27C]" /> {j.route}</span>
                  {j.exclusive && <span className="flex items-center gap-1.5"><Crown className="w-3 h-3 text-[#C8A27C]" /> {t(j.exclusive)}</span>}
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed font-light mb-6 flex-1">{t(j.desc)}</p>
                <div className="mt-auto">
                  {j.dualPrice ? (
                    <div className="flex justify-between items-end mb-4 gap-2">
                      <div><span className="block text-[9px] text-gray-500 uppercase tracking-widest mb-0.5">Liberty</span><span className="font-heading text-xl text-white font-medium">{j.priceLiberty}</span></div>
                      <div className="text-right"><span className="block text-[9px] text-gray-500 uppercase tracking-widest mb-0.5">Prestige</span><span className="font-heading text-xl text-white font-medium">{j.pricePrestige}</span></div>
                    </div>
                  ) : (
                    <div className="mb-4"><span className="block text-[9px] text-gray-500 uppercase tracking-widest mb-0.5">{t(j.pricePrefix)}</span><span className="font-heading text-2xl text-white font-medium">{j.price}</span></div>
                  )}
                  <Link href={lp('/jornadas')} className="w-full bg-[#C8A27C] hover:bg-[#B8906C] text-[#0F0A08] transition-colors py-3.5 text-[9px] font-bold uppercase tracking-widest rounded-sm flex items-center justify-center gap-2 group">
                    {t('CONHECER JORNADA')} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* EXPERIENCIAS */}
      <section className="py-20 px-6 sm:px-12 max-w-[1400px] mx-auto w-full">
        <div className="text-center mb-12">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold block mb-3">{t('EXPERIÊNCIAS EXCLUSIVAS')}</span>
          <h2 className="font-heading text-3xl font-light text-white">{t('Muito além dos pontos turísticos.')}</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {EXPERIENCES.map((exp, idx) => (
            <div key={idx} className="relative aspect-square border border-[#3D2620] rounded-sm overflow-hidden group cursor-pointer">
              <Image src={expImages[idx]} alt={t(exp.title)} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F0A08] via-[#0F0A08]/40 to-transparent" />
              <div className="absolute inset-0 p-4 flex items-end justify-center text-center">
                <span className="text-[10px] sm:text-[11px] font-semibold text-white tracking-wide uppercase leading-tight whitespace-pre-line group-hover:text-[#C8A27C] transition-colors duration-300">{t(exp.title)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DESTINOS */}
      <section className="py-20 px-6 sm:px-12 max-w-[1400px] mx-auto w-full border-t border-[#3D2620]">
        <div className="text-center mb-12"><span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold block mb-3">{t('DESTINOS')}</span></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { img: destinoSeoul, name: 'SEOUL', items: ['Palácios Históricos','Gangnam','Hongdae','Bukchon Hanok Village','Myeongdong','Rio Han','K-Beauty'] },
            { img: destinoBusan, name: 'BUSAN', items: ['Praias icônicas','Sky Capsule','Gamcheon Village','Mercados','Templos','Vida costeira'] },
            { img: destinoDaegu, name: 'DAEGU', badge: 'Exclusivo Always Destination', desc: 'Cidade de tradição, cafés especiais e uma atmosfera tranquila que surpreende.' },
            { img: destinoJeju,  name: 'JEJU',  badge: 'Exclusivo Horizon of Seven',    items: ['Paisagens vulcânicas','Patrimônio Natural da UNESCO','Campos de chá','Praias cristalinas','Pôr do sol inesquecível'] },
          ].map((d) => (
            <div key={d.name} className="relative h-[380px] border border-[#3D2620] rounded-sm overflow-hidden group">
              <Image src={d.img} alt={d.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F0A08] via-[#0F0A08]/30 to-transparent" />
              <div className="absolute inset-0 p-8 flex flex-col justify-end gap-2">
                <h3 className="font-heading text-2xl text-white tracking-wider">{d.name}</h3>
                {d.badge && <span className="text-[8px] bg-[#6B1F1F] text-white uppercase tracking-widest px-2 py-0.5 rounded-sm self-start font-bold">{t(d.badge)}</span>}
                {d.desc && <p className="text-[11px] text-gray-300 font-light leading-relaxed">{t(d.desc)}</p>}
                {d.items && <ul className="text-[10px] text-gray-300 space-y-1 font-light tracking-wide uppercase">{d.items.map(i => <li key={i}>• {t(i)}</li>)}</ul>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* INCLUSO + TABELA */}
      <section className="py-20 px-6 sm:px-12 max-w-[1400px] mx-auto w-full">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-[35%] relative border border-[#3D2620] rounded-sm overflow-hidden min-h-[400px]">
            <Image src={inclusobanner} alt={t('O QUE ESTÁ INCLUSO')} fill className="object-cover" />
            <div className="absolute inset-0 bg-[#120D0A]/95" />
            <div className="relative z-10 p-8 sm:p-10 h-full flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold block mb-3">{t('O QUE ESTÁ INCLUSO')}</span>
              <h2 className="font-heading text-2xl font-light text-white mb-8 leading-tight">{t('Pensamos em todos os detalhes para você viver o melhor da Coreia.')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 mt-auto">
                {INCLUDED.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="bg-[#C8A27C] rounded-full p-0.5 mt-0.5 shrink-0 flex items-center justify-center"><Check className="h-2 w-2 text-[#0F0A08]" strokeWidth={4} /></div>
                    <span className="text-[10px] text-gray-300 font-light leading-snug">{t(item)}</span>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-gray-500 mt-6 italic">{t('* Conforme a categoria escolhida')}</p>
            </div>
          </div>
          <div className="lg:w-[65%] border border-[#3D2620] bg-[#1A1211] rounded-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[#3D2620] bg-[#2A1616]"><span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold block text-center">{t('COMPARAÇÃO DOS PACOTES')}</span></div>
            <div className="overflow-x-auto p-4 sm:p-6">
              <table className="w-full min-w-[600px] text-left">
                <thead><tr className="border-b border-[#3D2620]">
                  <th className="py-4 px-4 text-[9px] font-semibold text-[#C8A27C] uppercase tracking-widest w-[25%]">{t('Pacote')}</th>
                  <th className="py-4 px-4 text-[9px] font-semibold text-[#C8A27C] uppercase tracking-widest text-center">{t('Dias')}</th>
                  <th className="py-4 px-4 text-[9px] font-semibold text-[#C8A27C] uppercase tracking-widest text-center">{t('Destinos')}</th>
                  <th className="py-4 px-4 text-[9px] font-semibold text-[#C8A27C] uppercase tracking-widest w-[30%]">{t('Perfil')}</th>
                  <th className="py-4 px-4 text-[9px] font-semibold text-[#C8A27C] uppercase tracking-widest text-right">{t('Valor Inicial')}</th>
                </tr></thead>
                <tbody className="divide-y divide-[#3D2620]/50">
                  {[
                    ['Founding ARMY Edition','14','Seoul + Busan','K-Pop / Fas','R$ 26.500'],
                    ['Bom Sarang','15','Seoul + Busan','Primavera / Flores de Cerejeira','R$ 29.700'],
                    ['Caravana de Verao Liberty','10','Seoul + Busan','Verao / Leve e Economico','R$ 29.000'],
                    ['Caravana de Verao Prestige','10','Seoul + Busan','Verao / Premium','R$ 34.000'],
                    ['Always Destination','15','Seoul + Busan + Daegu','Imersao Completa','R$ 39.000'],
                    ['The Horizon of Seven','15','Seoul + Busan + Jeju','Luxo / Experiencia Premium','R$ 42.000'],
                  ].map(([nome,dias,dest,perfil,valor],i) => (
                    <tr key={i} className={`${i%2===0?'bg-[#120D0A]':'bg-[#1A1211]'} hover:bg-[#2A1616] transition-colors`}>
                      <td className="py-4 px-4 text-[11px] text-white font-medium">{t(nome)}</td>
                      <td className="py-4 px-4 text-[10px] text-gray-400 text-center">{dias}</td>
                      <td className="py-4 px-4 text-[10px] text-gray-400 text-center">{dest}</td>
                      <td className="py-4 px-4 text-[10px] text-gray-400">{t(perfil)}</td>
                      <td className="py-4 px-4 text-[11px] text-white text-right font-medium">{valor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA + CTA */}
      <section className="py-24 px-6 sm:px-12 max-w-[1400px] mx-auto w-full border-t border-[#3D2620]">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <div className="lg:w-1/2 w-full">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8A27C] font-semibold block mb-12 text-center lg:text-left">{t('COMO FUNCIONA')}</span>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 sm:gap-2">
              {[
                { Icon: FileText, n:'01', l1:'Solicite seu', l2:'planejamento' },
                { Icon: MessageCircle, n:'02', l1:'Conversamos', l2:'sobre seu perfil' },
                { Icon: MapPin, n:'03', l1:'Escolhemos o', l2:'roteiro ideal' },
                { Icon: Calendar, n:'04', l1:'Organizamos', l2:'toda a viagem' },
                { Icon: Users, n:'05', l1:'Reuniao', l2:'pre-embarque' },
                { Icon: Plane, n:'06', l1:'Embarque', l2:'acompanhado' },
              ].map(({ Icon, n, l1, l2 }, i) => (
                <div key={n} className="flex flex-col items-center text-center gap-3 relative w-full sm:w-[15%]">
                  <Icon className="w-6 h-6 text-[#C8A27C] stroke-1" />
                  <span className="text-[10px] font-bold text-[#C8A27C]">{n}</span>
                  <p className="text-[9px] text-gray-400 font-light leading-tight">{t(l1)}<br/>{t(l2)}</p>
                  {i < 5 && <div className="hidden sm:block absolute top-[40%] -right-[50%] w-[100%]"><ArrowRight className="w-4 h-4 text-[#C8A27C]/50 mx-auto" /></div>}
                </div>
              ))}
            </div>
          </div>
          <div className="lg:w-1/2 w-full relative bg-[#2A1112] border border-[#3D2620] rounded-sm overflow-hidden p-10 sm:p-14">
            <div className="absolute right-0 bottom-0 opacity-30 w-1/2 h-full">
              <Image src={ctaTradition} alt="Tradition" fill className="object-cover object-right" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#2A1112] to-transparent" />
            </div>
            <div className="relative z-10 max-w-sm">
              <h2 className="font-heading text-3xl font-light text-[#C8A27C] leading-tight mb-4">{t('SUA PRÓXIMA GRANDE HISTÓRIA COMEÇA NA COREIA.')}</h2>
              <p className="text-[11px] text-gray-400 font-light mb-8">{t('Solicite um planejamento personalizado e descubra qual experiência Maeum Global foi criada para você.')}</p>
              <Link href="/contato" className="w-full sm:w-auto bg-[#C8A27C] hover:bg-[#B8906C] text-[#0F0A08] font-bold text-[10px] py-4 px-8 rounded-none transition-all uppercase tracking-widest flex items-center justify-center">{t('SOLICITAR PLANEJAMENTO')}</Link>
              <Link href="/contato" className="flex items-center gap-2 text-[10px] text-[#C8A27C] hover:text-[#B8906C] uppercase tracking-widest transition-colors font-semibold mt-4"><MessageCircle className="w-3.5 h-3.5" />{t('FALAR COM UM ESPECIALISTA')}</Link>
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM BAR */}
      <section className="py-10 px-6 border-t border-[#3D2620] bg-[#0A0705]">
        <div className="max-w-[1400px] mx-auto flex flex-wrap justify-center sm:justify-between items-center gap-6 opacity-70">
          <div className="flex items-center gap-3"><Headphones className="w-4 h-4 text-[#C8A27C]" strokeWidth={1.5} /><span className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">{t('Atendimento em português')}</span></div>
          <div className="flex items-center gap-3"><HeartHandshake className="w-4 h-4 text-[#C8A27C]" strokeWidth={1.5} /><span className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">{t('Suporte antes e durante a viagem')}</span></div>
          <div className="flex items-center gap-3"><Users className="w-4 h-4 text-[#C8A27C]" strokeWidth={1.5} /><span className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">{t('Grupos exclusivos e limitados')}</span></div>
          <div className="flex items-center gap-3"><Award className="w-4 h-4 text-[#C8A27C]" strokeWidth={1.5} /><span className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">{t('Curadoria Maeum Global')}</span></div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
