'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin, Send } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-border/40 bg-secondary text-white py-16 px-4 md:px-8 mt-auto">
      <div className="mx-auto max-w-7xl grid grid-cols-2 md:grid-cols-7 gap-8 text-xs text-gray-400">
        
        {/* Column 1 - Brand Info */}
        <div className="col-span-2 flex flex-col gap-4">
          <Image
            src="/images/logo.png"
            alt="MAEUM Logo"
            width={150}
            height={50}
            className="h-auto w-32 object-contain"
          />
          <p className="leading-relaxed text-[11px] text-gray-400 max-w-xs">
            Conectamos você ao melhor da Ásia através de experiências autênticas, roteiros personalizados e suporte completo em cada etapa da sua jornada.
          </p>
          {/* Custom SVG Social Icons matching reference */}
          <div className="flex gap-4 items-center mt-2">
            {/* Instagram */}
            <a href="https://instagram.com/maeumglobal" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors text-gray-400">
              <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
            </a>
            {/* Youtube */}
            <a href="https://youtube.com/maeumglobal" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors text-gray-400">
              <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"></path><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"></polygon></svg>
            </a>
            {/* Pinterest */}
            <a href="https://pinterest.com" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors text-gray-400">
              <svg className="h-4.5 w-4.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.017 0C5.396 0 0 5.397 0 12.017c0 5.078 3.158 9.41 7.61 11.173-.105-.951-.2-2.41.041-3.447.218-.934 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.17-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.204 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.22 7.464-1.215 0-2.358-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.62 0 12.016-5.396 12.016-12.017C24.033 5.397 18.637 0 12.017 0z"></path></svg>
            </a>
            {/* WhatsApp */}
            <a href="https://wa.me/5541987094799" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors text-gray-400">
              <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            </a>
          </div>
        </div>

        {/* Column 2 - Coreia do Sul */}
        <div className="flex flex-col gap-4">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-primary">Coreia do Sul</h3>
          <ul className="flex flex-col gap-2.5 text-gray-400">
            <li><Link href="/coreia-do-sul" className="hover:text-primary transition-colors">Visão geral</Link></li>
            <li><Link href="/coreia-do-sul/experiencias" className="hover:text-primary transition-colors">Experiências</Link></li>
            <li><Link href="/coreia-do-sul/k-beauty" className="hover:text-primary transition-colors">K-Beauty</Link></li>
            <li><Link href="/coreia-do-sul/intercambio" className="hover:text-primary transition-colors">Intercâmbio</Link></li>
          </ul>
        </div>

        {/* Column 3 - Jornadas */}
        <div className="flex flex-col gap-4">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-primary">Jornadas</h3>
          <ul className="flex flex-col gap-2.5 text-gray-400">
            <li><Link href="/coreia-do-sul/jornadas" className="hover:text-primary transition-colors">Próximas saídas</Link></li>
            <li><Link href="/coreia-do-sul/jornadas" className="hover:text-primary transition-colors">Cheotnun</Link></li>
            <li><Link href="/coreia-do-sul/jornadas" className="hover:text-primary transition-colors">Projeto ARMY</Link></li>
            <li><Link href="/coreia-do-sul/jornadas" className="hover:text-primary transition-colors">Caravana de Verão</Link></li>
          </ul>
        </div>

        {/* Column 4 - Destinos */}
        <div className="flex flex-col gap-4">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-primary">Destinos</h3>
          <ul className="flex flex-col gap-2.5 text-gray-400">
            <li><Link href="/destinos" className="hover:text-primary transition-colors">Coreia do Sul</Link></li>
            <li><Link href="/destinos" className="hover:text-primary transition-colors">Japão</Link></li>
            <li><Link href="/destinos" className="hover:text-primary transition-colors">Vietnã</Link></li>
          </ul>
        </div>

        {/* Column 5 - Journal */}
        <div className="flex flex-col gap-4">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-primary">Journal</h3>
          <ul className="flex flex-col gap-2.5 text-gray-400">
            <li><Link href="/journal" className="hover:text-primary transition-colors">Todos os vídeos</Link></li>
            <li><Link href="/journal" className="hover:text-primary transition-colors">Guias completos</Link></li>
            <li><Link href="/journal" className="hover:text-primary transition-colors">Bastidores</Link></li>
            <li><Link href="/journal" className="hover:text-primary transition-colors">Vlogs</Link></li>
          </ul>
        </div>

        {/* Column 7 - Contato */}
        <div className="flex flex-col gap-4">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-primary">Contato</h3>
          <ul className="flex flex-col gap-2.5 text-gray-400">
            <li className="hover:text-primary transition-colors">contato@maeumglobal.com.br</li>
            <li className="hover:text-primary transition-colors">+55 (41) 98709-4799</li>
            <li className="hover:text-primary transition-colors">Atendimento via WhatsApp</li>
          </ul>
        </div>
      </div>

      <div className="mx-auto max-w-7xl border-t border-gray-800 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between text-[10px] text-gray-500 gap-4">
        <p>&copy; {new Date().getFullYear()} Maeum Global Agency. Todos os direitos reservados.</p>
        <div className="flex items-center gap-1">
          <span>Orgulhosamente desenvolvido por</span>
          <a className="font-semibold text-gray-200 hover:text-primary transition-colors duration-200" href="https://www.voltris.com.br" target="_blank" rel="noreferrer">Voltris</a>
        </div>
        <div className="flex gap-6 mt-4 sm:mt-0">
          <Link href="/politica-de-privacidade" className="hover:text-primary transition-colors">Política de Privacidade</Link>
          <Link href="/termos-de-uso" className="hover:text-primary transition-colors">Termos de Uso</Link>
          <Link href="/reembolso" className="hover:text-primary transition-colors">Reembolso</Link>
        </div>
      </div>
    </footer>
  );
}
