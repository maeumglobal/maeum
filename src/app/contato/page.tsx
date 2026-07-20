'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Phone, Mail, MapPin, CheckCircle2, MessageSquare, Calendar, 
  MessageCircle, Clock, ShieldCheck, Users, Heart 
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { submitLeadAction } from '@/actions/crmActions';

export default function ContatoPage() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', interest: 'Coreia do Sul' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await submitLeadAction({
      name: form.name,
      phone: form.phone,
      email: form.email,
      interest: form.interest,
      origin: 'Página de Contato'
    });
    setLoading(false);
    if (res.success) {
      setSubmitted(true);
      setForm({ name: '', phone: '', email: '', interest: 'Coreia do Sul' });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      {/* Hero Banner Section */}
      <section className="relative w-full overflow-hidden bg-zinc-950 pb-16">
        <div className="absolute inset-0 z-0 h-[85%]">
          <Image
            src="/images/consultoras-maeum-global-contato-planejamento.webp"
            alt="Consultoras Maeum Global conversando sobre planejamento de viagem"
            fill
            className="object-cover object-center filter brightness-[0.7]"
            priority
          />
          {/* Gradient to darken the left side and bottom for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A0F14] via-[#1A0F14]/90 to-transparent sm:w-2/3" />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-zinc-950 to-transparent" />
        </div>

        <div className="relative z-10 px-8 max-w-7xl mx-auto w-full pt-32 sm:pt-40">
          <span className="text-xs uppercase tracking-widest text-accent font-bold">
            ESTAMOS AQUI PARA VOCÊ
          </span>
          <h1 className="font-heading text-4xl sm:text-6xl font-light tracking-wide leading-tight text-left text-white mt-4">
            Converse com <br className="hidden sm:inline" />
            nossa equipe.
            <br />
            <span className="italic text-accent">Seu sonho, nosso propósito.</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-300 max-w-xl font-light text-left leading-relaxed mt-6">
            Tire dúvidas, conheça melhor nossos pacotes, solicite seu planejamento ou apenas venha conversar. Nossa equipe está sempre pronta para te acolher e transformar sua viagem para a Coreia em realidade.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <button className="flex items-center justify-center gap-2.5 bg-accent hover:bg-accent-hover text-zinc-950 font-bold text-xs py-4 px-8 rounded-xl shadow-lg transition-all group uppercase tracking-wider">
              INICIAR CONVERSA AGORA
              <MessageSquare className="h-4 w-4 text-zinc-950 group-hover:scale-110 transition-transform ml-1" />
            </button>
            <button className="flex items-center justify-center gap-2.5 bg-transparent border border-accent text-accent hover:bg-accent/10 font-bold text-xs py-4 px-8 rounded-xl transition-all group uppercase tracking-wider">
              SOLICITAR PLANEJAMENTO
              <Calendar className="h-4 w-4 text-accent group-hover:scale-110 transition-transform ml-1" />
            </button>
          </div>
        </div>

        {/* Features Row inside the dark section below the image */}
        <div className="relative z-10 px-8 max-w-7xl mx-auto w-full mt-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 border border-white/10 rounded-2xl p-8 bg-black/40 backdrop-blur-sm">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-6 w-6 text-accent" strokeWidth={1.5} />
                <h4 className="text-[10px] sm:text-xs text-accent font-bold uppercase tracking-wider leading-snug">Atendimento <br/>em Português</h4>
              </div>
              <p className="text-[11px] text-gray-400 pl-9">Equipe brasileira na Coreia e no Brasil.</p>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-accent" strokeWidth={1.5} />
                <h4 className="text-[10px] sm:text-xs text-accent font-bold uppercase tracking-wider leading-snug">Resposta <br/>Rápida</h4>
              </div>
              <p className="text-[11px] text-gray-400 pl-9">Agilidade para tornar seus planos realidade.</p>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-accent" strokeWidth={1.5} />
                <h4 className="text-[10px] sm:text-xs text-accent font-bold uppercase tracking-wider leading-snug">Segurança</h4>
              </div>
              <p className="text-[11px] text-gray-400 pl-9">Suporte completo antes, durante e após sua viagem.</p>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-accent" strokeWidth={1.5} />
                <h4 className="text-[10px] sm:text-xs text-accent font-bold uppercase tracking-wider leading-snug">Consultoras <br/>Especializadas</h4>
              </div>
              <p className="text-[11px] text-gray-400 pl-9">Consultoras apaixonadas pela Coreia.</p>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <Heart className="h-6 w-6 text-accent" strokeWidth={1.5} />
                <h4 className="text-[10px] sm:text-xs text-accent font-bold uppercase tracking-wider leading-snug">Atendimento <br/>Humano</h4>
              </div>
              <p className="text-[11px] text-gray-400 pl-9">Conversas reais para decisões seguras.</p>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1 py-16 px-4 md:px-8 max-w-7xl mx-auto w-full">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Left - Contact info & Map */}
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="border border-border/80 rounded-2xl p-5 bg-card flex flex-col gap-2">
                <Phone className="h-6 w-6 text-primary" />
                <span className="text-xs font-bold text-secondary">Telefone / WhatsApp</span>
                <span className="text-xs text-muted-foreground">+55 (41) 98709-4799</span>
              </div>
              <div className="border border-border/80 rounded-2xl p-5 bg-card flex flex-col gap-2">
                <Mail className="h-6 w-6 text-primary" />
                <span className="text-xs font-bold text-secondary">E-mail</span>
                <span className="text-xs text-muted-foreground truncate">contato@maeumglobal.com</span>
              </div>
              <div className="border border-border/80 rounded-2xl p-5 bg-card flex flex-col gap-2">
                <MapPin className="h-6 w-6 text-primary" />
                <span className="text-xs font-bold text-secondary">Endereço</span>
                <span className="text-[10px] text-muted-foreground leading-snug">Av. Batel 1230, Curitiba, PR, Brasil</span>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="relative aspect-video w-full rounded-3xl overflow-hidden border border-border/80 bg-muted">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3602.8123282245367!2d-49.28825828498559!3d-25.444535383782782!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1m3!1d3602.8!2d-49.288!3d-25.445!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sbr!4v1650000000000!5m2!1sen!2sbr"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="grayscale opacity-80"
              ></iframe>
            </div>
          </div>

          {/* Right - Form */}
          <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
            <h3 className="font-heading text-2xl font-light text-secondary mb-6">Enviar Mensagem</h3>

            {submitted ? (
              <div className="flex flex-col items-center justify-center text-center p-6 bg-green-50 rounded-2xl border border-green-200">
                <CheckCircle2 className="h-10 w-10 text-green-500 mb-2" />
                <h4 className="font-bold text-green-950">Mensagem Enviada!</h4>
                <p className="text-xs text-green-800 mt-1">
                  Já registramos seu interesse e em breve retornaremos pelo e-mail ou WhatsApp cadastrado.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="name" className="text-xs font-semibold text-secondary">Nome Completo</label>
                  <Input
                    id="name"
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Seu nome"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="phone" className="text-xs font-semibold text-secondary">WhatsApp</label>
                  <Input
                    id="phone"
                    required
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-xs font-semibold text-secondary">E-mail</label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="interest" className="text-xs font-semibold text-secondary">Interesse</label>
                  <select
                    id="interest"
                    value={form.interest}
                    onChange={e => setForm({ ...form, interest: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="Coreia do Sul">Coreia do Sul</option>
                    <option value="Japão">Japão</option>
                    <option value="Vietnã">Vietnã</option>
                    <option value="Intercâmbio">Intercâmbio de Estudos</option>
                  </select>
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-accent-hover text-white py-3 rounded-xl font-bold mt-2">
                  {loading ? 'Enviando...' : 'ENVIAR MENSAGEM'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
