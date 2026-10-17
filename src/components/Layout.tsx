import { useLanguage } from '../lib/language'
import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import { MotionProvider } from './Motion'

export default function Layout() {
  const { t } = useLanguage()
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.06 })
    document.querySelectorAll('.reveal').forEach((element) => {
      element.classList.add('reveal--ready')
      observer.observe(element)
    })
    return () => observer.disconnect()
  }, [pathname])

  return (
    <MotionProvider>
      <a className="skip-link" href="#main-content">{t("본문으로 바로가기")}</a>
      <Header />
      <main className="main" id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </MotionProvider>
  )
}
