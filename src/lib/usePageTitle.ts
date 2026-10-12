import { useEffect } from 'react'
import { site } from '../content/site'

export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${site.name}` : `${site.name} — ${site.tagline}`
  }, [title])
}
