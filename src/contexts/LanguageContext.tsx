'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { getLocaleFromPathname, stripLocalePrefix, localizedPath, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n'
import { useSiteContent } from '@/contexts/SiteContentContext'

interface LanguageContextType {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string) => string
  dict: Record<string, string>
  isModalOpen: boolean
  setIsModalOpen: (open: boolean) => void
}

const LanguageContext = createContext<LanguageContextType | null>(null)

type LanguageProviderProps = {
  children: ReactNode
  /** Locale resolved on the server from the x-maeum-locale header (SEO source of truth). */
  initialLocale: Locale
}

export function LanguageProvider({ children, initialLocale }: LanguageProviderProps) {
  const pathname = usePathname()
  const router = useRouter()
  // SSR first paint uses the server-resolved locale → localized HTML for SEO, no hydration gap.
  const [locale, setLocaleState] = useState<Locale>(initialLocale)
  const [dict, setDict] = useState<Record<string, string>>(() => getDictionary(initialLocale))
  const [isModalOpen, setIsModalOpen] = useState(false)
  // Overrides de texto salvos no painel (por idioma). Têm prioridade sobre o dicionário estático.
  const { text: textOverrides } = useSiteContent()

  const applyLocale = (l: Locale) => {
    setLocaleState(l)
    setDict(getDictionary(l))
    try {
      localStorage.setItem('maeum_locale', l)
      document.cookie = `maeum_locale=${l};path=/;max-age=31536000;SameSite=Lax`
    } catch {}
  }

  // Keep the locale in sync with the URL after navigation (soft navigations do
  // not re-run the server layout, so we derive the locale from the pathname).
  useEffect(() => {
    applyLocale(getLocaleFromPathname(pathname))
  }, [pathname])

  const setLocale = (l: Locale) => {
    if (l === getLocaleFromPathname(pathname)) {
      setIsModalOpen(false)
      return
    }
    // Update UI immediately on the client; the router.push keeps the URL/SEO
    // consistent. No need to wait for a server round-trip.
    applyLocale(l)
    setIsModalOpen(false)
    const target = localizedPath(stripLocalePrefix(pathname), l)
    if (target !== pathname) router.push(target)
  }

  const t = (key: string): string => {
    const override = textOverrides?.[locale]?.[key]
    if (typeof override === 'string' && override.length > 0) return override
    return typeof dict?.[key] === 'string' ? dict[key] : key
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, dict, isModalOpen, setIsModalOpen }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}