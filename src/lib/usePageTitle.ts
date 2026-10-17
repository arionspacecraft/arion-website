import { useEffect } from 'react'
import { useLanguage } from './language'
import { site } from '../content/site'

export function usePageTitle(title?: string, translateTitle = true) {
  const { t } = useLanguage()
  useEffect(() => {
    document.title = title ? `${translateTitle ? t(title) : title} | ${site.name}` : `${site.name} — ${t(site.tagline)}`
  }, [title, t, translateTitle])
}
