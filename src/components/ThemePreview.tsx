import { useEffect, useLayoutEffect, useState } from 'react'
import { useLanguage } from '../lib/language'

type ThemeMode = 'system' | 'light' | 'dark'

// Production always follows the device, including changes while the site is open.
// Manual controls and URL overrides are available only in the local dev server.
export default function ThemePreview() {
  const { language } = useLanguage()
  const en = language === 'en'
  const [mode, setMode] = useState<ThemeMode>(() => {
    const requested = import.meta.env.DEV ? new URLSearchParams(location.search).get('theme') : null
    return requested === 'light' || requested === 'dark' ? requested : 'system'
  })
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => setSystemDark(media.matches)
    const resume = () => { if (!document.hidden) update() }
    update()
    // Mobile browsers can suspend the page while the device theme is changed.
    // Reconcile it on return as well as listening for the live media event.
    if (media.addEventListener) media.addEventListener('change', update)
    else media.addListener(update)
    document.addEventListener('visibilitychange', resume)
    window.addEventListener('pageshow', update)
    window.addEventListener('focus', update)
    return () => {
      if (media.removeEventListener) media.removeEventListener('change', update)
      else media.removeListener(update)
      document.removeEventListener('visibilitychange', resume)
      window.removeEventListener('pageshow', update)
      window.removeEventListener('focus', update)
    }
  }, [])
  const theme = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode
  useLayoutEffect(() => {
    const html = document.documentElement
    html.dataset.theme = theme
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (meta) meta.content = theme === 'dark' ? '#030627' : '#ffffff'
  }, [theme])

  if (!import.meta.env.DEV) return null
  return <details className="theme-preview">
    <summary>◐ {en ? 'Theme preview' : '테마 미리보기'} <span>{theme === 'light' ? (en ? 'LIGHT' : '라이트') : (en ? 'DARK' : '다크')}</span></summary>
    <div className="theme-preview__options" role="group" aria-label={en ? 'Theme preview' : '테마 미리보기'}>
      <p>{en ? 'Local preview only' : '로컬 미리보기 전용'}</p>
      <div>{(['system', 'light', 'dark'] as const).map((option, index) => <button type="button" key={option} aria-pressed={mode === option} onClick={() => setMode(option)}>{(en ? ['System', 'Light', 'Dark'] : ['자동', '라이트', '다크'])[index]}</button>)}</div>
      <small>{en ? 'Device preference: ' : '기기 설정: '}{systemDark ? (en ? 'Dark' : '다크') : (en ? 'Light' : '라이트')}</small>
    </div>
  </details>
}
