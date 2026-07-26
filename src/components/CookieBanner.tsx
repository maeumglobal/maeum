'use client';

import React, { useState, useEffect } from 'react';
import { X, Cookie, Check, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const hasAccepted = localStorage.getItem('cookie-consent');
    if (!hasAccepted) {
      setTimeout(() => {
        setIsVisible(true);
        setTimeout(() => setIsAnimating(true), 100);
      }, 1500);
    }
  }, []);

  const handleAccept = (type: 'all' | 'necessary') => {
    setIsAnimating(false);
    setTimeout(() => {
      localStorage.setItem('cookie-consent', type);
      setIsVisible(false);
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 bg-background/98 backdrop-blur-md border-t border-border/50 shadow-2xl transition-all duration-300 ${
        isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Content */}
          <div className="flex items-start gap-4 flex-1">
            <div className="p-2.5 bg-primary/10 rounded-full shrink-0">
              <Cookie className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-accent" />
                <h3 className="font-heading text-sm font-semibold text-secondary">
                  Privacidade e Cookies
                </h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Utilizamos cookies essenciais para o funcionamento do site e cookies analíticos para melhorar sua experiência. 
                Ao aceitar, você concorda com nossa{' '}
                <a href="/politica-de-privacidade" className="text-primary hover:underline font-medium">
                  Política de Privacidade
                </a>.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <Button
              onClick={() => handleAccept('necessary')}
              variant="outline"
              size="sm"
              className="border-border text-xs font-semibold px-5 py-2.5 rounded-full hover:bg-muted transition-colors"
            >
              Rejeitar
            </Button>
            <Button
              onClick={() => handleAccept('all')}
              size="sm"
              className="bg-primary hover:bg-accent-hover text-white text-xs font-semibold px-6 py-2.5 rounded-full shadow-md transition-all hover:scale-105"
            >
              <Check className="h-3.5 w-3.5 mr-1.5" />
              Aceitar Todos
            </Button>
            <button
              onClick={() => handleAccept('necessary')}
              className="p-2 text-muted-foreground hover:text-secondary transition-colors"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}