import { useLanguage } from '../lib/language'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { nav, site } from '../content/site'
import { teams } from '../content/teams'
import { newsCategoryFilters, projectStatusFilters, readNavigationFilter } from '../content/navigationFilters'
import { useMotion } from './Motion'

const MENU_HOVER_MEDIA = '(min-width: 1121px) and (hover: hover) and (pointer: fine)'
type MenuLink = { to: string; label: string; active: boolean }
type MenuGroup = { id: string; active: boolean; links: MenuLink[] }

export default function Header() {
  const { t, language, setLanguage } = useLanguage()
  const [open, setOpen] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const { pathname: locationPathname, search } = useLocation()
  // GitHub Pages directory entry URLs can end in a slash after a direct visit.
  const pathname = locationPathname.replace(/\/+$/, '') || '/'
  const { paused, toggle } = useMotion()
  const header = useRef<HTMLElement>(null)
  const menuButton = useRef<HTMLButtonElement>(null)
  const menus = useRef<Record<string, HTMLDivElement | null>>({})
  const menuLinks = useRef<Record<string, HTMLAnchorElement | null>>({})
  const keyboardInteraction = useRef(true)
  const suppressFocusOpen = useRef(false)
  const close = () => { setOpen(false); setOpenMenu(null) }
  const params = new URLSearchParams(search)
  const projectStatus = readNavigationFilter(params, 'status', projectStatusFilters)
  const newsCategory = readNavigationFilter(params, 'category', newsCategoryFilters)
  const groups: Record<string, MenuGroup> = {
    '/projects': {
      id: 'projects-submenu', active: pathname === '/projects' || pathname.startsWith('/projects/'),
      links: [
        { to: '/projects', label: '전체 프로젝트', active: pathname === '/projects' && projectStatus === null },
        ...projectStatusFilters.map(option => ({ to: `/projects?status=${option.slug}`, label: option.value, active: pathname === '/projects' && projectStatus === option.value })),
      ],
    },
    '/teams': {
      id: 'teams-submenu', active: pathname === '/teams' || pathname.startsWith('/teams/'),
      links: [
        { to: '/teams', label: '전체 팀', active: pathname === '/teams' },
        ...teams.map(team => ({ to: `/teams/${team.slug}`, label: team.name, active: pathname === `/teams/${team.slug}` })),
      ],
    },
    '/news': {
      id: 'news-submenu', active: pathname === '/news' || pathname.startsWith('/news/'),
      links: [
        { to: '/news', label: '전체 소식', active: pathname === '/news' && newsCategory === null },
        ...newsCategoryFilters.map(option => ({ to: `/news?category=${option.slug}`, label: option.value, active: pathname === '/news' && newsCategory === option.value })),
      ],
    },
    '/qna': {
      id: 'contact-submenu', active: pathname === '/contact' || pathname === '/qna',
      links: [
        { to: '/qna', label: 'Q&A', active: pathname === '/qna' },
        { to: '/contact', label: '직접 문의', active: pathname === '/contact' },
      ],
    },
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      keyboardInteraction.current = true
      if (event.key !== 'Escape') return
      if (openMenu) {
        setOpenMenu(null)
        suppressFocusOpen.current = true
        menuLinks.current[openMenu]?.focus()
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
        setOpenMenu(null)
      } else if (openMenu && !menus.current[openMenu]?.contains(target)) {
        setOpenMenu(null)
      }
    }
    document.addEventListener('keydown', onKey)
    if (open || openMenu) document.addEventListener('pointerdown', outside)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', outside)
    }
  }, [open, openMenu])

  return (
    <header ref={header} className="header">
      <div className="container header__inner">
        <Link to="/" className="header__brand" onClick={close} aria-label={t(`${site.name} 홈`)}><img src={`${import.meta.env.BASE_URL}logo-light.png`} alt={site.name} className="header__logo" /><span className="header__brand-sub">DGIST<br />ROCKET CLUB</span></Link>
        <nav id="site-nav" aria-label={t('메인 메뉴')} className={open ? 'nav nav--open' : 'nav'}>
          {nav.map((item, index) => {
            const group = groups[item.to]
            if (!group) return (
              <NavLink key={item.to} to={item.to} className="nav__link" onClick={close}>
                <span className="nav__index mono">0{index + 1}</span>{t(item.label)}
              </NavLink>
            )
            const expanded = openMenu === item.to
            const contactAlias = item.to === '/qna'
            return (
              <div
                ref={element => { menus.current[item.to] = element }}
                className={`nav-menu${contactAlias ? ' contact-menu' : ''}${expanded ? ' is-open' : ''}`}
                key={item.to}
                onPointerEnter={event => {
                  if (event.pointerType === 'mouse' && window.matchMedia(MENU_HOVER_MEDIA).matches) setOpenMenu(item.to)
                }}
                onPointerLeave={event => {
                  if (event.pointerType !== 'mouse' || !window.matchMedia(MENU_HOVER_MEDIA).matches) return
                  const hasKeyboardFocus = keyboardInteraction.current && event.currentTarget.contains(document.activeElement)
                  if (!hasKeyboardFocus) setOpenMenu(current => current === item.to ? null : current)
                }}
                onPointerDownCapture={() => { keyboardInteraction.current = false }}
                onFocus={() => {
                  if (keyboardInteraction.current && !suppressFocusOpen.current) setOpenMenu(item.to)
                }}
                onBlur={event => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpenMenu(current => current === item.to ? null : current)
                }}
              >
                <Link
                  ref={element => { menuLinks.current[item.to] = element }}
                  to={item.to}
                  className={`nav__link nav-menu__trigger${contactAlias ? ' contact-menu__trigger' : ''}${group.active ? ' active' : ''}`}
                  aria-expanded={expanded}
                  aria-controls={group.id}
                  onClick={event => {
                    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
                    close()
                    if (pathname === item.to) window.scrollTo({ top: 0, behavior: 'instant' })
                  }}
                >
                  <span className="nav__index mono">0{index + 1}</span>{t(item.label)}
                </Link>
                <button
                  type="button"
                  className="nav-menu__toggle"
                  aria-expanded={expanded}
                  aria-controls={group.id}
                  aria-label={t(`${item.label} 메뉴 ${expanded ? '닫기' : '열기'}`)}
                  onClick={() => setOpenMenu(current => current === item.to ? null : item.to)}
                >
                  <span aria-hidden="true">{expanded ? '−' : '+'}</span>
                </button>
                <div id={group.id} className={`nav-menu__links${contactAlias ? ' contact-menu__links' : ''}`} hidden={!expanded}>
                  {group.links.map(link => (
                    <Link key={link.to} to={link.to} className={link.active ? 'active' : undefined} aria-current={link.active ? 'page' : undefined} onClick={event => {
                      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
                      close()
                      if (pathname === link.to.split('?')[0]) window.scrollTo({ top: 0, behavior: 'instant' })
                    }}>{t(link.label)}</Link>
                  ))}
                </div>
              </div>
            )
          })}
        </nav>
        <div className="header__actions">
          <button className="language-toggle" type="button" lang={language === 'ko' ? 'en' : 'ko'} aria-label={language === 'ko' ? 'Switch to English' : '한국어로 전환'} onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}>{language === 'ko' ? 'EN' : '한국어'}</button>
          <button className="motion-toggle" onClick={toggle} type="button" aria-label={t(paused ? '애니메이션 재생' : '애니메이션 일시 정지')} aria-pressed={paused} title={t(paused ? '애니메이션 재생' : '애니메이션 일시 정지')}><span aria-hidden="true">{t(paused ? '▶' : 'Ⅱ')}</span></button>
          <Link to="/recruit" className="header__join" onClick={close}>JOIN US <span aria-hidden="true">↗</span></Link>
          <button ref={menuButton} type="button" className={`header__toggle${open ? ' is-open' : ''}`} aria-label={t(open ? '메뉴 닫기' : '메뉴 열기')} aria-expanded={open} aria-controls="site-nav" onClick={() => { setOpen(value => !value); setOpenMenu(null) }}><span /><span /></button>
        </div>
      </div>
    </header>
  )
}
