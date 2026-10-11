'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useMedia, useNavigation, useSiteContent } from '@/contexts/SiteContentContext';
import { navLabel, isExternalNav } from '@/lib/cmsData';
import { useLanguage } from '@/contexts/LanguageContext';
// O slot `site_logo` aceita qualquer URL colada pelo painel — `next/image` lança
// ao renderizar domínios fora da allowlist. `SmartImage` cai para `<img>` puro
// quando o host não é permitido.
import SmartImage from '@/components/SmartImage';
import { localizedPath } from '@/i18n/config';

const WHATSAPP_URL = 'https://wa.me/821024836078';

const subscribeToNothing = () => () => {};
const getCurrentYear = () => new Date().getFullYear();
const getServerYear = () => null;

const SOCIAL_LINKS = [
  {
    key: 'Instagram',
    href: 'https://instagram.com/maeumglobal',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    ),
  },
  {
    key: 'YouTube',
    href: 'https://youtube.com/maeumglobal',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
        <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
      </svg>
    ),
  },
  {
    key: 'Pinterest',
    href: 'https://pinterest.com',
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12.017 0C5.396 0 0 5.397 0 12.017c0 5.078 3.158 9.41 7.61 11.173-.105-.951-.2-2.41.041-3.447.218-.934 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.17-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.204 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.22 7.464-1.215 0-2.358-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.62 0 12.016-5.396 12.016-12.017C24.033 5.397 18.637 0 12.017 0z" />
      </svg>
    ),
  },
  {
    key: 'WhatsApp',
    href: WHATSAPP_URL,
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    ),
  },
] as const;

export default function Footer() {
  const { t, locale } = useLanguage();
  const siteLogo = useMedia('site_logo');
  // Menu do rodapé e links legais vindos do painel (Configurações > Navegacao).
  const footerNav = useNavigation('footer');
  const legalNav = useNavigation('legal');
  const { text } = useSiteContent();

  // Editável no painel; o texto em pt é a chave canônica do dicionário.
  const contactEmail = text.pt['footer_contact_email'] || 'contato@maeumglobal.com.br';
  const contactPhone = text.pt['footer_contact_phone'] || '+82 10-2483-6078';
  const contactAddress = text.pt['footer_contact_address'] || 'São Paulo, Brasil · Seul, Coreia do Sul';

  /*
   * O ano é lido do "relojo" do navegador via useSyncExternalStore: o servidor
   * usa o snapshot `null` (renderiza `©`) e o cliente corrige logo após hidratar,
   * sem erro de hydration e sem setState dentro de efeito.
   */
  const year = useSyncExternalStore(
    subscribeToNothing,
    getCurrentYear,
    getServerYear,
  );

  return (
    <footer className="mt-auto w-full border-t border-border/40 bg-background px-4 py-16 text-white md:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 text-xs text-gray-400 md:grid-cols-7">
        <div className="col-span-2 flex flex-col gap-4">
          <SmartImage
            src={siteLogo || '/images/logo.png'}
            alt={t('Logotipo da Maeum Global')}
            width={150}
            height={50}
            className="h-auto w-32 object-contain"
          />
          <p className="max-w-xs text-[11px] leading-relaxed text-gray-400">
            {t(
              'Conectamos você ao melhor da Ásia através de experiências autênticas, roteiros personalizados e suporte completo em cada etapa da sua jornada.',
            )}
          </p>

          <div className="mt-2 flex items-center gap-4">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.key}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                aria-label={t(social.key)}
                title={t(social.key)}
                className="text-gray-400 transition-colors hover:text-accent"
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-accent">
            {t('Coreia do Sul')}
          </h3>
          <ul className="flex flex-col gap-2.5 text-gray-400">
            <li>
              <Link href={localizedPath('/coreia-do-sul', locale)} className="transition-colors hover:text-accent">
                {t('Visão geral')}
              </Link>
            </li>
            <li>
              <Link href={localizedPath('/coreia-do-sul/experiencias', locale)} className="transition-colors hover:text-accent">
                {t('Experiências')}
              </Link>
            </li>
            <li>
              <Link href={localizedPath('/coreia-do-sul/k-beauty', locale)} className="transition-colors hover:text-accent">
                {t('K-Beauty')}
              </Link>
            </li>
            <li>
              <Link href={localizedPath('/coreia-do-sul/intercambio', locale)} className="transition-colors hover:text-accent">
                {t('Intercâmbio')}
              </Link>
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-accent">{t('Jornadas')}</h3>
          <ul className="flex flex-col gap-2.5 text-gray-400">
            {['Próximas saídas', 'Cheotnun', 'Projeto ARMY', 'Caravana de Verão'].map((label) => (
              <li key={label}>
                <Link
                  href={localizedPath('/coreia-do-sul/jornadas', locale)}
                  className="transition-colors hover:text-accent"
                >
                  {t(label)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-accent">{t('Destinos')}</h3>
          <ul className="flex flex-col gap-2.5 text-gray-400">
            <li>
              <Link href={localizedPath('/destinos', locale)} className="transition-colors hover:text-accent">
                {t('Coreia do Sul')}
              </Link>
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-accent">{t('Journal')}</h3>
          <ul className="flex flex-col gap-2.5 text-gray-400">
            {footerNav.length > 0
              ? footerNav.slice(0, 8).map((item) => (
                  <li key={item.id}>
                    {isExternalNav(item.url) ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-colors hover:text-accent"
                      >
                        {navLabel(item, locale)}
                      </a>
                    ) : (
                      <Link
                        href={localizedPath(item.url, locale)}
                        className="transition-colors hover:text-accent"
                      >
                        {navLabel(item, locale)}
                      </Link>
                    )}
                  </li>
                ))
              : ['Todos os vídeos', 'Guias completos', 'Bastidores', 'Vlogs'].map((label) => (
                  <li key={label}>
                    <Link href={localizedPath('/journal', locale)} className="transition-colors hover:text-accent">
                      {t(label)}
                    </Link>
                  </li>
                ))}
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-accent">
            {t('Contato rápido')}
          </h3>
          <ul className="flex flex-col gap-2.5 text-gray-400">
            <li>
              <a href={`mailto:${contactEmail}`} className="transition-colors hover:text-accent">
                {contactEmail}
              </a>
            </li>
            <li>
              <a href={`tel:${contactPhone.replace(/[^\d+]/g, '')}`} className="transition-colors hover:text-accent">
                {contactPhone}
              </a>
            </li>
            <li className="transition-colors hover:text-accent">{contactAddress}</li>
            <li>
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="transition-colors hover:text-accent">
                {t('Atendimento via WhatsApp')}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-gray-800 pt-6 text-[10px] text-gray-500 sm:flex-row">
        <p>
          &copy; {year} MaeumGlobal Agency. {t('Todos os direitos reservados.')}
        </p>
        <div className="flex items-center gap-1">
          <span>{t('Orgulhosamente desenvolvido por')}</span>
          <a
            className="font-semibold text-gray-200 transition-colors duration-200 hover:text-accent"
            href="https://www.voltris.com.br"
            target="_blank"
            rel="noreferrer"
          >
            Voltris
          </a>
        </div>
        <div className="mt-4 flex gap-6 sm:mt-0">
          {(legalNav.length > 0
            ? legalNav.slice(0, 6).map((item) => ({ url: item.url, label: navLabel(item, locale) }))
            : ([
                ['/politica-de-privacidade', 'Política de Privacidade'],
                ['/termos-de-uso', 'Termos de Uso'],
                ['/reembolso', 'Reembolso'],
              ] as const).map(([url, label]) => ({ url, label: t(label) }))
          ).map((item) => (
            <Link
              key={item.url}
              href={isExternalNav(item.url) ? item.url : localizedPath(item.url, locale)}
              className="transition-colors hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-7xl text-center text-[10px] text-gray-500">
        <span>{t('Em parceria com a ')}</span>
        <a
          href="https://www.cheotnun.com"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-gray-200 transition-colors duration-200 hover:text-accent"
        >
          Cheotnun
        </a>
      </div>
    </footer>
  );
}