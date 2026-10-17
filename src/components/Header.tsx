import { useLanguage } from '../lib/language'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { nav, site } from '../content/site'
import { useMotion } from './Motion'

export default function Header() {
  const { t, language, setLanguage } = useLanguage()
  const [open, setOpen] = useState(false)
  const { paused, toggle } = useMotion()
  const header = useRef<HTMLElement>(null)
  const menuButton = useRef<HTMLButtonElement>(null)
  const close = () => setOpen(false)
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); menuButton.current?.focus() } }
    const outside = (event: PointerEvent) => { if (!header.current?.contains(event.target as Node)) setOpen(false) }
    if (open) { document.addEventListener('keydown', onKey); document.addEventListener('pointerdown', outside) }
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', outside) }
  }, [open])
  return (
    <header ref={header} className="header">
      <div className="container header__inner">
        <Link to="/" className="header__brand" onClick={close} aria-label={t(`${site.name} 홈`)}><img src={`${import.meta.env.BASE_URL}logo-light.png`} alt={site.name} className="header__logo" /><span className="header__brand-sub">DGIST<br />ROCKET CLUB</span></Link>
        <nav id="site-nav" aria-label={t("메인 메뉴")} className={open ? 'nav nav--open' : 'nav'}>
          {nav.map((item, index) => <NavLink key={item.to} to={item.to} className="nav__link" onClick={close}><span className="nav__index mono">0{index + 1}</span>{t(item.label)}</NavLink>)}
        </nav>
        <div className="header__actions">
          <button className="language-toggle" type="button" lang={language === 'ko' ? 'en' : 'ko'} aria-label={language === 'ko' ? 'Switch to English' : '한국어로 전환'} onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}>{language === 'ko' ? 'EN' : '한국어'}</button>
          <button className="motion-toggle" onClick={toggle} type="button" aria-label={t(paused ? '애니메이션 재생' : '애니메이션 일시 정지')} aria-pressed={paused} title={t(paused ? '애니메이션 재생' : '애니메이션 일시 정지')}><span aria-hidden="true">{t(paused ? '▶' : 'Ⅱ')}</span></button>
          <Link to="/recruit" className="header__join" onClick={close}>JOIN US <span aria-hidden="true">↗</span></Link>
          <button ref={menuButton} type="button" className={`header__toggle${open ? ' is-open' : ''}`} aria-label={t(open ? '메뉴 닫기' : '메뉴 열기')} aria-expanded={open} aria-controls="site-nav" onClick={() => setOpen((value) => !value)}><span /><span /></button>
        </div>
      </div>
    </header>
  )
}
