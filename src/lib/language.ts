import { createContext, useContext } from 'react'
import { english } from '../content/english'

export type Language = 'ko' | 'en'
export const translate = (text: string, language: Language) => language === 'en' ? english[text] ?? text : text
export const LanguageContext = createContext({ language: 'ko' as Language, setLanguage: (_language: Language) => {}, t: (text: string) => text })
export const useLanguage = () => useContext(LanguageContext)
