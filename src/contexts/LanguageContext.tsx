'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { translations, Language } from './translations'

interface LanguageContextType {
  locale: Language
  setLocale: (l: Language) => void
  t: (key: string) => string
  isModalOpen: boolean
  setIsModalOpen: (open: boolean) => void
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Language>('pt') // Default to pt
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const stored = localStorage.getItem('maeum_locale') as Language | null
    if (stored === 'es' || stored === 'pt' || stored === 'en') {
      setLocaleState(stored)
    }
  }, [])

  const setLocale = (l: Language) => {
    setLocaleState(l)
    localStorage.setItem('maeum_locale', l)
    document.cookie = `maeum_locale=${l};path=/;max-age=31536000;SameSite=Lax`
    setIsModalOpen(false)
  }

  const t = (key: string): string => {
    if (!isMounted) return key // Evita hydrate mismatch renderizando a chave inicialmente se necessário, embora não ideal. Melhor retornar a chave ou tradução em 'pt'
    if (translations[locale]?.[key]) {
      return translations[locale][key]
    }
    // Fallback to pt
    if (translations['pt']?.[key]) {
      return translations['pt'][key]
    }
    return key
  }

  // To prevent hydration mismatch better, just provide 'pt' on server
  const serverT = (key: string): string => {
    if (translations['pt']?.[key]) {
      return translations['pt'][key]
    }
    return key
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t: isMounted ? t : serverT, isModalOpen, setIsModalOpen }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
