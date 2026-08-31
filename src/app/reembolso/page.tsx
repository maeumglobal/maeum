'use client';

import React from 'react';
import Link from 'next/link';
import { DollarSign, Calendar, CheckCircle, AlertCircle, FileText, Phone, Mail, ChevronRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ReembolsoPage() {
  const { t, locale } = useLanguage();
  const lp = (path: string) => (locale === 'pt' || path === '/' ? path : `/${locale}${path}`);
  const policies = [
    {
      period: t('Mais de 60 dias'),
      percentage: '95%',
      description: t('Reembolso integral menos taxa administrativa de 5%'),
      icon: CheckCircle,
      color: 'text-green-500'
    },
    {
      period: t('30 a 60 dias'),
      percentage: '50%',
      description: t('Metade do valor pago será reembolsado'),
      icon: AlertCircle,
      color: 'text-yellow-500'
    },
    {
      period: t('15 a 30 dias'),
      percentage: '25%',
      description: t('Um quarto do valor pago será reembolsado'),
      icon: AlertCircle,
      color: 'text-orange-500'
    },
    {
      period: t('Menos de 15 dias'),
      percentage: '0%',
      description: t('Sem reembolso disponível'),
      icon: AlertCircle,
      color: 'text-red-500'
    }
  ];

  const steps = [
    {
      number: '01',
      title: t('Solicitação'),
      description: t('Envie sua solicitação de cancelamento por e-mail ou WhatsApp com número do contrato e motivo.')
    },
    {
      number: '02',
      title: t('Análise'),
      description: t('Nossa equipe analisará seu caso e confirmará a elegibilidade conforme a política de cancelamento.')
    },
    {
      number: '03',
      title: t('Documentação'),
      description: t('Você receberá um formulário de cancelamento que deverá ser preenchido e assinado.')
    },
    {
      number: '04',
      title: t('Processamento'),
      description: t('Após aprovação, o reembolso será processado em até 30 dias úteis na mesma forma de pagamento.')
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-secondary overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur border border-primary/45 rounded-full px-4 py-2 mb-6">
            <DollarSign className="h-4 w-4 text-accent" />
            <span className="text-xs uppercase tracking-widest text-primary font-bold">
              {t('Cancelamento & Reembolso')}
            </span>
          </div>
          
          <h1 className="font-heading text-4xl md:text-5xl font-light text-primary mb-4">
            {t('Política de Reembolso')}
          </h1>
          
          <p className="text-sm text-gray-400 max-w-2xl mx-auto">
            {t('Transparência e justiça em nossos processos de cancelamento. Conheça seus direitos e nossas condições.')}
          </p>
        </div>
      </section>

      {/* Timeline de Reembolso */}
      <section className="py-16 px-4 md:px-8 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl font-light text-secondary mb-3">
              {t('Percentual de Reembolso por Período')}
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              {t('O valor reembolsado varia de acordo com a antecedência do cancelamento em relação à data de início da viagem ou intercâmbio.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {policies.map((policy, idx) => {
              const Icon = policy.icon;
              return (
                <div
                  key={idx}
                  className="bg-card border border-border/60 rounded-2xl p-6 text-center hover:shadow-lg transition-all hover:-translate-y-1 group"
                >
                  <div className={`inline-flex p-3 rounded-full bg-muted/50 mb-4 group-hover:scale-110 transition-transform ${policy.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-secondary mb-2">
                    {policy.period}
                  </h3>
                  <div className={`text-4xl font-bold mb-3 ${policy.color}`}>
                    {policy.percentage}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {policy.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Como Solicitar */}
      <section className="py-16 px-4 md:px-8 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl font-light text-secondary mb-3">
              {t('Como Solicitar Reembolso')}
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              {t('Siga os passos abaixo para iniciar o processo de cancelamento e reembolso.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, idx) => (
              <div key={idx} className="relative">
                {idx < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-primary/30 to-transparent -translate-x-4" />
                )}
                <div className="bg-card border border-border/60 rounded-2xl p-6 h-full">
                  <div className="text-5xl font-bold text-primary/20 mb-4">
                    {step.number}
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-secondary mb-3">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Informações Importantes */}
      <section className="py-16 px-4 md:px-8 bg-background">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-heading text-3xl font-light text-secondary mb-8 text-center">
            {t('Informações Importantes')}
          </h2>

          <div className="space-y-6">
            <div className="bg-card border border-border/60 rounded-2xl p-6 md:p-8">
              <h3 className="font-heading text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent" />
{t('Prazos de Processamento')}
              </h3>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                <p>
                  • <strong>{t('Cartão de crédito: 1-2 faturas')}</strong>
                </p>
                <p>
                  • <strong>{t('PIX ou transferência: até 10 dias úteis')}</strong>
                </p>
                <p>
                  • <strong>{t('Boleto bancário: até 15 dias úteis após compensação')}</strong>
                </p>
              </div>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl p-6 md:p-8">
              <h3 className="font-heading text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-accent" />
{t('Casos Especiais')}
              </h3>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                <p>
                  <strong>{t('Doença ou acidente:')}</strong> {t('Com apresentação de atestado médico, analisamos condições especiais mesmo dentro do período de 15 dias.')}
                </p>
                <p>
                  <strong>{t('Problemas documentais:')}</strong> {t('Vistos negados por motivos não atribuíveis à MaeumGlobal seguem a tabela padrão.')}
                </p>
                <p>
                  <strong>{t('Força maior:')}</strong> {t('Situações extraordinárias (pandemia, desastres naturais, conflitos) serão analisadas caso a caso.')}
                </p>
              </div>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl p-6 md:p-8">
              <h3 className="font-heading text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-accent" />
                {t('Taxas Não Reembolsáveis')}
              </h3>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                <p>
                  {t('Alguns valores não são reembolsáveis pois já foram pagos a fornecedores no momento da reserva:')}
                </p>
                <p className="ml-4">
                  • {t('Taxas de emissão de passagens aéreas (após emissão)')}
                </p>
                <p className="ml-4">
                  • {t('Reservas de hospedagem em alta temporada')}
                </p>
                <p className="ml-4">
                  • {t('Taxas de matrícula em escolas de intercâmbio')}
                </p>
                <p className="ml-4">
                  • {t('Seguros viagem já contratados')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contato */}
      <section className="py-16 px-4 md:px-8 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-3xl font-light text-secondary mb-4">
            {t('Dúvidas sobre Reembolso?')}
          </h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-xl mx-auto">
            {t('Nossa equipe financeira está disponível para esclarecer qualquer questão sobre o processo de cancelamento e reembolso.')}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="mailto:financeiro@maeumglobal.com.br"
              className="bg-card border border-border/60 rounded-xl p-6 flex items-center justify-center gap-3 hover:shadow-md transition-all group"
            >
              <Mail className="h-5 w-5 text-accent group-hover:scale-110 transition-transform" />
              <span className="text-sm font-semibold text-secondary">financeiro@maeumglobal.com.br</span>
            </a>
            
            <a
              href="https://wa.me/5541987094799"
              target="_blank"
              rel="noreferrer"
              className="bg-card border border-border/60 rounded-xl p-6 flex items-center justify-center gap-3 hover:shadow-md transition-all group"
            >
              <Phone className="h-5 w-5 text-accent group-hover:scale-110 transition-transform" />
              <span className="text-sm font-semibold text-secondary">+55 (41) 98709-4799</span>
            </a>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="py-12 px-4 md:px-8 bg-background border-t border-border/60">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href={lp('/')}
            className="text-xs font-medium text-primary hover:text-accent-hover transition-colors flex items-center gap-2"
          >
            ← {t('Voltar ao início')}
          </Link>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href={lp('/politica-de-privacidade')} className="hover:text-primary transition-colors">
              {t('Política de Privacidade')}
            </Link>
            <span>•</span>
            <Link href={lp('/termos-de-uso')} className="hover:text-primary transition-colors">
              {t('Termos de Uso')}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
