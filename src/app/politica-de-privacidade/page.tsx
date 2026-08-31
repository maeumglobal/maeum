'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Cookie, User, Mail, Phone, MapPin, ChevronRight, Check } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PoliticaPrivacidadePage() {
  const { t, locale } = useLanguage();
  const lp = (path: string) => (locale === 'pt' || path === '/' ? path : `/${locale}${path}`);
  const sections = [
    {
      title: t('1. Informações que Coletamos'),
      content: t(`Coletamos informações que você nos fornece diretamente ao utilizar nossos serviços:
      
      • Informações de identificação pessoal: nome, e-mail, telefone, CPF, data de nascimento
      • Informações de viagem: destinos de interesse, datas preferidas, orçamento
      • Informações de pagamento: dados de cartão de crédito (processados de forma segura por terceiros)
      • Preferências de comunicação: como deseja ser contatado
      • Dados de navegação: IP, tipo de navegador, páginas visitadas (via cookies)`)
    },
    {
      title: t('2. Como Usamos Suas Informações'),
      content: t(`Utilizamos suas informações para:
      
      • Personalizar roteiros e experiências de viagem
      • Processar reservas e pagamentos
      • Enviar confirmações e atualizações sobre sua viagem
      • Fornecer suporte antes, durante e após sua experiência
      • Enviar materiais promocionais (apenas com seu consentimento)
      • Melhorar continuamente nossos serviços
      • Cumprir obrigações legais e regulatórias`)
    },
    {
      title: t('3. Compartilhamento de Dados'),
      content: t(`Seus dados podem ser compartilhados apenas nas seguintes situações:
      
      • Fornecedores de serviços: hotéis, companhias aéreas, operadoras de turismo na Ásia
      • Processadores de pagamento: para processamento seguro de transações
      • Autoridades governamentais: quando exigido por lei (imigração, alfândega)
      • Parceiros de intercâmbio: escolas e instituições educacionais
      • Prestadores de experiências: guias, restaurantes, atrações turísticas
      
      Não vendemos, alugamos ou comercializamos seus dados pessoais.`)
    },
    {
      title: t('4. Cookies e Tecnologias de Rastreamento'),
      content: t(`Utilizamos diferentes tipos de cookies:
      
      • Cookies essenciais: necessários para o funcionamento do site
      • Cookies analíticos: Google Analytics para entender o uso do site
      • Cookies de funcionalidade: memorizar preferências e configurações
      • Cookies de marketing: exibir anúncios relevantes (com seu consentimento)
      
      Você pode gerenciar suas preferências de cookies a qualquer momento.`)
    },
    {
      title: t('5. Seus Direitos'),
      content: t(`Como titular dos dados, você tem direito a:
      
      • Acessar suas informações pessoais que mantemos
      • Corrigir dados incompletos, inexatos ou desatualizados
      • Solicitar a exclusão de seus dados (quando aplicável)
      • Revogar consentimento para processamento de dados
      • Portabilidade dos dados para outro fornecedor de serviço
      • Opor-se ao processamento em determinadas circunstâncias
      
      Para exercer seus direitos, entre em contato: privacidade@maeumglobal.com.br`)
    },
    {
      title: t('6. Segurança de Dados'),
      content: t(`Implementamos medidas de segurança técnicas e organizacionais:
      
      • Criptografia SSL/TLS para todas as transmissões de dados
      • Armazenamento seguro com acesso restrito
      • Sistemas de pagamento PCI DSS compliant
      • Monitoramento contínuo contra acessos não autorizados
      • Treinamento regular da equipe em proteção de dados
      • Backups seguros e planos de recuperação de desastres`)
    },
    {
      title: t('7. Retenção de Dados'),
      content: t(`Mantemos seus dados pelo tempo necessário para:
      
      • Cumprir a finalidade para a qual foram coletados
      • Cumprir obrigações contratuais e legais
      • Resolver disputas e fazer valer nossos acordos
      
      Após esse período, os dados são excluídos ou anonimizados de forma segura.`)
    },
    {
      title: t('8. Transferências Internacionais'),
      content: t(`Como operamos viagens para a Ásia, seus dados podem ser transferidos para:
      
      • Coreia do Sul e outros países asiáticos
      • Fornecedores e parceiros internacionais de turismo
      
      Garantimos que todas as transferências sigam padrões adequados de proteção, 
      conforme exigido pela LGPD.`)
    },
    {
      title: t('9. Menores de Idade'),
      content: t(`Nossos serviços são direcionados a maiores de 18 anos. Para menores:
      
      • Requeremos consentimento dos pais ou responsáveis legais
      • Coletamos apenas dados necessários para a viagem
      • Tratamos os dados com proteção reforçada
      • Não direcionamos marketing diretamente a menores`)
    },
    {
      title: t('10. Alterações nesta Política'),
      content: t(`Esta política pode ser atualizada periodicamente. Mudanças significativas 
      serão comunicadas através do site ou por e-mail. A versão mais recente estará 
      sempre disponível em maeumglobal.com.br/politica-de-privacidade.`)
    },
    {
      title: t('11. Contato do Encarregado de Dados'),
      content: t(`Dúvidas ou solicitações sobre privacidade:
      
      E-mail: privacidade@maeumglobal.com.br
      Telefone: +55 (41) 98709-4799
      Endereço: Curitiba, PR, Brasil
      
      Tempo de resposta: até 15 dias úteis`)
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
            <Shield className="h-4 w-4 text-accent" />
            <span className="text-xs uppercase tracking-widest text-primary font-bold">
              {t('Privacidade & Proteção de Dados')}
            </span>
          </div>
          
          <h1 className="font-heading text-4xl md:text-5xl font-light text-primary mb-4">
            {t('Política de Privacidade')}
          </h1>
          
          <p className="text-sm text-gray-400 max-w-2xl mx-auto">
            {t('Transparência e segurança no tratamento dos seus dados pessoais. Sua privacidade é nossa prioridade.')}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-4 md:px-8 bg-background flex-1">
        <div className="max-w-4xl mx-auto">
          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <div className="bg-card border border-border/60 rounded-xl p-5 flex flex-col items-center text-center">
              <div className="p-3 bg-primary/10 rounded-full mb-3">
                <User className="h-5 w-5 text-accent" />
              </div>
              <h3 className="text-xs font-semibold text-secondary mb-1">{t('Seus Dados')}</h3>
              <p className="text-[10px] text-muted-foreground">{t('Protegidos e utilizados apenas para melhorar sua experiência')}</p>
            </div>
            
            <div className="bg-card border border-border/60 rounded-xl p-5 flex flex-col items-center text-center">
              <div className="p-3 bg-primary/10 rounded-full mb-3">
                <Cookie className="h-5 w-5 text-accent" />
              </div>
              <h3 className="text-xs font-semibold text-secondary mb-1">{t('Cookies')}</h3>
              <p className="text-[10px] text-muted-foreground">{t('Você tem controle total sobre suas preferências')}</p>
            </div>
            
            <div className="bg-card border border-border/60 rounded-xl p-5 flex flex-col items-center text-center">
              <div className="p-3 bg-primary/10 rounded-full mb-3">
                <Mail className="h-5 w-5 text-accent" />
              </div>
              <h3 className="text-xs font-semibold text-secondary mb-1">{t('Contato')}</h3>
              <p className="text-[10px] text-muted-foreground">{t('Dúvidas? privacidade@maeumglobal.com.br')}</p>
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-8">
            {sections.map((section, idx) => (
              <div
                key={idx}
                className="bg-card border border-border/60 rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                    <Check className="h-4 w-4 text-accent" />
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
            ))}
          </div>

          {/* Navigation */}
          <div className="mt-12 pt-8 border-t border-border/60 flex items-center justify-between">
            <Link
              href={lp('/')}
              className="text-xs font-medium text-primary hover:text-accent-hover transition-colors flex items-center gap-2"
            >
              ← {t('Voltar ao início')}
            </Link>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{t('Última atualização:')}</span>
              <span className="font-semibold text-secondary">
                {new Date().toLocaleDateString(locale === 'en' ? 'en-US' : locale === 'es' ? 'es-ES' : 'pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
