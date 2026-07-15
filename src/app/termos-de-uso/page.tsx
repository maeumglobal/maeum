'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, CheckCircle, AlertCircle, Shield, CreditCard, Calendar, ChevronRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function TermosUsoPage() {
  const sections = [
    {
      icon: FileText,
      title: '1. Aceitação dos Termos',
      content: `Ao acessar e utilizar o site maeumglobal.com.br, você concorda com estes Termos de Uso. 
      Se não concordar com qualquer parte destes termos, não utilize nossos serviços.
      
      Estes termos podem ser modificados a qualquer momento. O uso continuado do site após alterações 
      constitui aceitação dos novos termos.`
    },
    {
      icon: Shield,
      title: '2. Nossos Serviços',
      content: `A MAEUM GLOBAL oferece:
      
      • Planejamento e organização de viagens personalizadas para a Ásia
      • Roteiros turísticos customizados
      • Reservas de hospedagem, transporte e experiências
      • Programas de intercâmbio cultural e educacional
      • Acompanhamento de grupos em viagens
      • Consultoria especializada em destinos asiáticos
      
      Os serviços exatos serão definidos em contrato específico para cada cliente.`
    },
    {
      icon: CreditCard,
      title: '3. Pagamentos e Valores',
      content: `• Todos os valores estão em Reais (BRL) salvo indicação contrária
      • Pagamentos podem ser realizados via cartão de crédito, transferência ou PIX
      • Parcelamento disponível conforme condições contratuais
      • Valores podem sofrer alteração até confirmação final da reserva
      • Taxas cambiais podem impactar valores de serviços internacionais
      • Pagamentos devem ser realizados nas datas estipuladas em contrato
      
      O não pagamento nas datas acordadas pode resultar em cancelamento da reserva.`
    },
    {
      icon: Calendar,
      title: '4. Reservas e Cancelamentos',
      content: `Política de cancelamento:
      
      • Cancelamento com mais de 60 dias da viagem: reembolso integral (exceto taxa administrativa de 5%)
      • Cancelamento entre 30-60 dias: 50% de reembolso
      • Cancelamento entre 15-30 dias: 25% de reembolso
      • Cancelamento com menos de 15 dias: sem reembolso
      
      Casos de força maior (doença, problemas documentais, eventos climáticos) serão analisados 
      individualmente e podem ter condições especiais.`
    },
    {
      icon: AlertCircle,
      title: '5. Responsabilidades do Cliente',
      content: `O cliente é responsável por:
      
      • Fornecer informações verdadeiras e completas
      • Possuir documentação necessária (passaporte, vistos, vacinas)
      • Respeitar leis e costumes dos países visitados
      • Comparecer em horários e locais estabelecidos
      • Comunicar necessidades especiais ou restrições
      • Contratar seguro viagem (obrigatório para intercâmbios)
      
      A MAEUM GLOBAL não se responsabiliza por problemas decorrentes do descumprimento.`
    },
    {
      icon: Shield,
      title: '6. Limitação de Responsabilidade',
      content: `A MAEUM GLOBAL atua como intermediária entre cliente e fornecedores (hotéis, companhias aéreas, 
      prestadores de serviços). Não nos responsabilizamos por:
      
      • Alterações unilaterais feitas por fornecedores
      • Atrasos ou cancelamentos de voos
      • Condições climáticas que impactem a viagem
      • Problemas de saúde ou acidentes pessoais
      • Perda ou extravio de bagagem
      • Situações de força maior ou caso fortuito
      
      Faremos o melhor para auxiliar na resolução de quaisquer problemas.`
    },
    {
      icon: FileText,
      title: '7. Propriedade Intelectual',
      content: `Todo o conteúdo do site (textos, imagens, logotipos, vídeos, roteiros) é de propriedade 
      da MAEUM GLOBAL e protegido por leis de direitos autorais.
      
      É proibida a reprodução, distribuição ou uso comercial sem autorização prévia por escrito.
      
      O uso é permitido apenas para fins pessoais e não comerciais.`
    },
    {
      icon: AlertCircle,
      title: '8. Conduta do Usuário',
      content: `Ao utilizar nosso site e serviços, você concorda em:
      
      • Não usar o site para fins ilegais ou não autorizados
      • Não tentar acessar sistemas ou dados restritos
      • Não interferir no funcionamento adequado do site
      • Não copiar, modificar ou distribuir conteúdo sem permissão
      • Não se passar por outra pessoa ou entidade
      • Fornecer informações de contato válidas e atualizadas`
    },
    {
      icon: FileText,
      title: '9. Intercâmbios e Programas Educacionais',
      content: `Para programas de intercâmbio:
      
      • Matrículas são pessoais e intransferíveis
      • Visto de estudante é responsabilidade do aluno (com nossa orientação)
      • Frequência mínima exigida conforme regulamentação do país
      • Desempenho acadêmico é responsabilidade do aluno
      • Hospedagem está sujeita aos termos do fornecedor parceiro
      • Seguro saúde é obrigatório durante todo o período
      
      Consulte condições específicas de cada programa.`
    },
    {
      icon: Shield,
      title: '10. Lei Aplicável e Foro',
      content: `Estes termos são regidos pelas leis da República Federativa do Brasil.
      
      Fica eleito o foro da Comarca de Curitiba/PR para resolução de quaisquer 
      questões decorrentes destes termos, com renúncia a qualquer outro, 
      por mais privilegiado que seja.
      
      Em caso de dúvidas, entre em contato: juridico@maeumglobal.com.br`
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
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-xs uppercase tracking-widest text-primary font-bold">
              Termos e Condições
            </span>
          </div>
          
          <h1 className="font-heading text-4xl md:text-5xl font-light text-primary mb-4">
            Termos de Uso
          </h1>
          
          <p className="text-sm text-gray-400 max-w-2xl mx-auto">
            Condições gerais de contratação e utilização dos nossos serviços. 
            Leia atentamente antes de prosseguir.
          </p>
        </div>
      </section>

      {/* Info Banner */}
      <section className="py-8 px-4 bg-background border-b border-border/60">
        <div className="max-w-4xl mx-auto">
          <div className="bg-muted/30 border border-border/60 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6">
            <div className="p-3 bg-primary/10 rounded-full">
              <AlertCircle className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-sm font-semibold text-secondary mb-1">
                Importante
              </h3>
              <p className="text-xs text-muted-foreground">
                Ao contratar nossos serviços, você declara ter lido, compreendido e aceito 
                integralmente estes Termos de Uso.
              </p>
            </div>
            <Link
              href="/contato"
              className="text-xs font-semibold text-primary hover:text-accent-hover transition-colors flex items-center gap-1.5"
            >
              Fale Conosco <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-4 md:px-8 bg-background flex-1">
        <div className="max-w-4xl mx-auto">
          {/* Sections */}
          <div className="space-y-6">
            {sections.map((section, idx) => {
              const Icon = section.icon;
              return (
                <div
                  key={idx}
                  className="bg-card border border-border/60 rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-primary/10 rounded-xl shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h2 className="font-heading text-xl font-semibold text-secondary mb-4">
                        {section.title}
                      </h2>
                      <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                        {section.content}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <div className="mt-12 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-8 text-center">
            <h3 className="font-heading text-2xl font-light text-secondary mb-3">
              Pronto para planejar sua viagem dos sonhos?
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xl mx-auto">
              Entre em contato com nossa equipe e descubra como podemos transformar 
              sua experiência na Ásia em realidade.
            </p>
            <Link
              href="/contato"
              className="inline-flex items-center gap-2 bg-primary hover:bg-accent-hover text-white text-xs font-semibold px-6 py-3 rounded-full shadow-md transition-all hover:scale-105"
            >
              Solicitar Orçamento
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Navigation */}
          <div className="mt-12 pt-8 border-t border-border/60 flex items-center justify-between">
            <Link
              href="/"
              className="text-xs font-medium text-primary hover:text-accent-hover transition-colors flex items-center gap-2"
            >
              ← Voltar ao início
            </Link>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <Link href="/politica-de-privacidade" className="hover:text-primary transition-colors">
                Política de Privacidade
              </Link>
              <span>•</span>
              <Link href="/reembolso" className="hover:text-primary transition-colors">
                Política de Reembolso
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}