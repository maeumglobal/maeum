'use client';

import React, { useState } from 'react';
import { Phone, Mail, MapPin, CheckCircle2 } from 'lucide-react';
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
      <main className="flex-1 py-16 px-4 md:px-8 max-w-7xl mx-auto w-full">
        <div className="max-w-2xl mb-12">
          <span className="text-xs uppercase tracking-widest text-primary font-bold">MAEUM GLOBAL</span>
          <h1 className="font-heading text-4xl sm:text-5xl font-light text-secondary mt-2">Fale Conosco</h1>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
            Estamos prontos para planejar sua próxima grande jornada pela Ásia. Entre em contato por WhatsApp, e-mail ou preencha o formulário abaixo.
          </p>
        </div>

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
