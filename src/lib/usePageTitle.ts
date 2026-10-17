import { useEffect } from 'react'
import { useLanguage } from './language'
import { site } from '../content/site'

export function usePageTitle(title?: string) {
  const { t } = useLanguage()
  useEffect(() => {
    document.title = title ? `${t(title)} | ${site.name}` : `${site.name} — ${t(site.tagline)}`
  }, [title, t])
}
