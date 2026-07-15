'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Calendar, CheckCircle2, XCircle, ArrowLeft, Send, PhoneCall } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { submitLeadAction } from '@/actions/crmActions';

export default function PacoteDetailPage() {
  const { slug } = useParams();
  const [pack, setPack] = useState<any>(null);
  const [destination, setDestination] = useState<any>(null);
  
  // Inquiry Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const pkgs = db.get('packages') || [];
    const found = pkgs.find((p: any) => p.slug === slug);
    setPack(found || null);

    if (found) {
      const dests = db.get('destinations') || [];
      const d = dests.find((dest: any) => dest.id === found.destination_id);
      setDestination(d || null);
    }
  }, [slug]);

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone) return;
    setLoading(true);
    const res = await submitLeadAction({
      name,
      phone,
      email,
      interest: pack.title,
      origin: 'Formulário Pacote: ' + pack.title
    });
    setLoading(false);
    if (res.success) {
      setFormSuccess(true);
      setName('');
      setEmail('');
      setPhone('');
      setTimeout(() => setFormSuccess(false), 5000);
    }
  };

  if (!pack) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-12 text-center">
          <h2 className="font-heading text-3xl font-light text-secondary">Paquete no encontrado</h2>
          <Link href="/pacotes" className="mt-4 text-primary hover:underline text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Volver a los Paquetes
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      <main className="flex-1 w-full py-12 px-4 md:px-8 max-w-7xl mx-auto">
        <Link href="/pacotes" className="text-xs uppercase font-bold text-muted-foreground hover:text-primary tracking-wider flex items-center gap-1.5 mb-8">
          <ArrowLeft className="h-4 w-4" /> Volver a todos los paquetes
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content Area */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                {destination ? destination.name : 'Viaje Exclusivo'}
              </span>
              <h1 className="font-heading text-3xl sm:text-5xl font-light text-secondary mt-2 leading-tight uppercase">
                {pack.title}
              </h1>
              <p className="text-sm text-muted-foreground font-light mt-4 leading-relaxed">
                {pack.description}
              </p>
            </div>

            {/* Gallery Images */}
            {pack.gallery && pack.gallery.length > 0 && (
              <div className="relative aspect-[16/9] w-full rounded-3xl overflow-hidden border border-border">
                <Image src={pack.gallery[0]} alt={pack.title} fill unoptimized className="object-cover" />
              </div>
            )}

            {/* Itinerary */}
            {pack.itinerary && pack.itinerary.length > 0 && (
              <div className="mt-4">
                <h3 className="font-heading text-2xl font-light text-secondary uppercase tracking-wider border-b border-border pb-4 mb-6">
                  Roteiro Día a Día
                </h3>
                <div className="flex flex-col gap-6 pl-4 border-l border-primary/20 relative">
                  {pack.itinerary.map((day: any) => (
                    <div key={day.day} className="relative flex flex-col gap-1 pb-4">
                      {/* Node point */}
                      <span className="absolute -left-[21px] top-0 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Día {day.day}</span>
                      <h4 className="font-heading text-lg font-bold text-secondary leading-tight mt-0.5">{day.title}</h4>
                      <p className="text-xs text-muted-foreground font-light leading-relaxed mt-1">{day.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Included & Not Included Lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-border pt-8 mt-4">
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-bold text-secondary uppercase tracking-widest flex items-center gap-1.5">
                  <CheckCircle2 className="h-4.5 w-4.5 text-green-600" /> Qué está incluido
                </h4>
                <ul className="flex flex-col gap-2 text-xs text-muted-foreground">
                  {pack.included && pack.included.map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-1.5 font-light">
                      <span className="text-green-500 font-bold mr-1">✓</span> {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-bold text-secondary uppercase tracking-widest flex items-center gap-1.5">
                  <XCircle className="h-4.5 w-4.5 text-red-500" /> Qué no está incluido
                </h4>
                <ul className="flex flex-col gap-2 text-xs text-muted-foreground">
                  {pack.not_included && pack.not_included.map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-1.5 font-light">
                      <span className="text-red-500 font-bold mr-1">✗</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Booking Inquiry Sidebar */}
          <div className="flex flex-col gap-6">
            <div className="border border-border rounded-3xl p-8 bg-card shadow-sm flex flex-col gap-6 h-fit">
              <div>
                <span className="text-[10px] uppercase font-bold text-primary tracking-widest">Inversión del Viaje</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-heading text-3xl font-bold text-primary">US$ {pack.price.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">/ por persona</span>
                </div>
              </div>

              <div className="h-px bg-border" />

              <div className="flex flex-col gap-2.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Duración:</span>
                  <span className="font-bold text-secondary">{pack.duration || '10 Dias'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Próximas salidas:</span>
                  <span className="font-bold text-secondary">
                    {pack.start_dates?.map((d: string) => new Date(d).toLocaleDateString('pt-BR')).join(' / ') || 'A definir'}
                  </span>
                </div>
              </div>

              {/* Inquiry form */}
              <div className="mt-2">
                <h4 className="text-[10px] uppercase font-bold text-secondary tracking-widest mb-3">Solicitar Presupuesto</h4>
                
                {formSuccess ? (
                  <div className="bg-green-50 border border-green-200 text-green-800 text-xs rounded-xl p-3.5 text-center font-bold">
                    ✓ ¡Solicitud recibida! Te contactaremos en breve.
                  </div>
                ) : (
                  <form onSubmit={handleInquirySubmit} className="flex flex-col gap-3 text-xs">
                    <Input
                      required
                      placeholder="Nombre Completo"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="rounded-xl h-10 border-border"
                    />
                    <Input
                      required
                      type="email"
                      placeholder="E-mail de contacto"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="rounded-xl h-10 border-border"
                    />
                    <Input
                      required
                      placeholder="Teléfono (WhatsApp)"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="rounded-xl h-10 border-border"
                    />
                    <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-accent-hover text-white rounded-xl py-3 font-bold uppercase tracking-wider text-[10px]">
                      {loading ? 'Enviando...' : 'ENVIAR SOLICITUD'}
                    </Button>
                  </form>
                )}
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-2 border-t border-border pt-4">
                Ou converse agora pelo
              </div>

              <a
                href={`https://wa.me/5541987094799?text=Olá,%20gostaria%20de%20saber%20mais%20sobre%20o%20pacote%20${encodeURIComponent(pack.title)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-[#25d366] hover:bg-[#20ba5a] text-white text-xs font-bold py-3.5 rounded-xl uppercase tracking-wider shadow-sm"
              >
                <PhoneCall className="h-4 w-4" />
                WhatsApp Directo
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
