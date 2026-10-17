import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { LanguageContext, translate } from '../lib/language'
import type { Language } from '../lib/language'

export default function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    try { return localStorage.getItem('arion-language') === 'en' ? 'en' : 'ko' } catch { return 'ko' }
  })
  useEffect(() => {
    document.documentElement.lang = language
    try { localStorage.setItem('arion-language', language) } catch { /* Browsing still works when storage is disabled. */ }
  }, [language])
  const t = useCallback((text: string) => translate(text, language), [language])
  const value = useMemo(() => ({ language, setLanguage, t }), [language, t])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
