import { useLanguage } from '../lib/language'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { nav, site } from '../content/site'
import { useMotion } from './Motion'

const CONTACT_HOVER_MEDIA = '(min-width: 1121px) and (hover: hover) and (pointer: fine)'

export default function Header() {
  const { t, language, setLanguage } = useLanguage()
  const [open, setOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const { pathname } = useLocation()
  const { paused, toggle } = useMotion()
  const header = useRef<HTMLElement>(null)
  const menuButton = useRef<HTMLButtonElement>(null)
  const contactMenu = useRef<HTMLDivElement>(null)
  const contactButton = useRef<HTMLButtonElement>(null)
  const keyboardInteraction = useRef(true)
  const suppressFocusOpen = useRef(false)
  const close = () => { setOpen(false); setContactOpen(false) }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      keyboardInteraction.current = true
      if (event.key !== 'Escape') return
      if (contactOpen) {
        setContactOpen(false)
        suppressFocusOpen.current = true
        contactButton.current?.focus()
        suppressFocusOpen.current = false
      } else if (open) {
        setOpen(false)
        menuButton.current?.focus()
      }
    }
    const outside = (event: PointerEvent) => {
      const target = event.target as Node
      if (!header.current?.contains(target)) {
        setOpen(false)
        setContactOpen(false)
      } else if (!contactMenu.current?.contains(target)) {
        setContactOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    if (open || contactOpen) document.addEventListener('pointerdown', outside)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', outside)
    }
  }, [open, contactOpen])

  return (
    <header ref={header} className="header">
      <div className="container header__inner">
        <Link to="/" className="header__brand" onClick={close} aria-label={t(`${site.name} 홈`)}><img src={`${import.meta.env.BASE_URL}logo-light.png`} alt={site.name} className="header__logo" /><span className="header__brand-sub">DGIST<br />ROCKET CLUB</span></Link>
        <nav id="site-nav" aria-label={t('메인 메뉴')} className={open ? 'nav nav--open' : 'nav'}>
          {nav.map((item, index) => item.to === '/contact' ? (
            <div
              ref={contactMenu}
              className={`contact-menu${contactOpen ? ' is-open' : ''}`}
              key={item.to}
              onPointerEnter={event => {
                if (event.pointerType === 'mouse' && window.matchMedia(CONTACT_HOVER_MEDIA).matches) setContactOpen(true)
              }}
              onPointerLeave={event => {
                if (event.pointerType !== 'mouse' || !window.matchMedia(CONTACT_HOVER_MEDIA).matches) return
                const hasKeyboardFocus = keyboardInteraction.current && event.currentTarget.contains(document.activeElement)
                if (!hasKeyboardFocus) setContactOpen(false)
              }}
              onPointerDownCapture={() => { keyboardInteraction.current = false }}
              onFocus={() => {
                if (keyboardInteraction.current && !suppressFocusOpen.current) setContactOpen(true)
              }}
              onBlur={event => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setContactOpen(false)
              }}
            >
              <button
                ref={contactButton}
                type="button"
                className={`nav__link contact-menu__trigger${pathname === '/contact' || pathname === '/qna' ? ' active' : ''}`}
                aria-expanded={contactOpen}
                aria-controls="contact-submenu"
                aria-label={t(contactOpen ? '문의 메뉴 닫기' : '문의 메뉴 열기')}
                onClick={() => setContactOpen(value => !value)}
              >
                <span className="nav__index mono">0{index + 1}</span>{t(item.label)}
              </button>
              <div id="contact-submenu" className="contact-menu__links" hidden={!contactOpen}>
                <NavLink to="/contact" onClick={close}>{t('직접 문의')}</NavLink>
                <NavLink to="/qna" onClick={close}>Q&A</NavLink>
              </div>
            </div>
          ) : (
            <NavLink key={item.to} to={item.to} className="nav__link" onClick={close}>
              <span className="nav__index mono">0{index + 1}</span>{t(item.label)}
            </NavLink>
          ))}
        </nav>
        <div className="header__actions">
          <button className="language-toggle" type="button" lang={language === 'ko' ? 'en' : 'ko'} aria-label={language === 'ko' ? 'Switch to English' : '한국어로 전환'} onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}>{language === 'ko' ? 'EN' : '한국어'}</button>
          <button className="motion-toggle" onClick={toggle} type="button" aria-label={t(paused ? '애니메이션 재생' : '애니메이션 일시 정지')} aria-pressed={paused} title={t(paused ? '애니메이션 재생' : '애니메이션 일시 정지')}><span aria-hidden="true">{t(paused ? '▶' : 'Ⅱ')}</span></button>
          <Link to="/recruit" className="header__join" onClick={close}>JOIN US <span aria-hidden="true">↗</span></Link>
          <button ref={menuButton} type="button" className={`header__toggle${open ? ' is-open' : ''}`} aria-label={t(open ? '메뉴 닫기' : '메뉴 열기')} aria-expanded={open} aria-controls="site-nav" onClick={() => { setOpen(value => !value); setContactOpen(false) }}><span /><span /></button>
        </div>
      </div>
    </header>
  )
}
