import { useLanguage } from '../lib/language'
import { Link } from 'react-router-dom'
import { nav, site } from '../content/site'
import { useMotion } from './Motion'

export default function Footer() {
  const { t } = useLanguage()
  const { email, instagram, leaders } = site.contact
  const { paused } = useMotion()
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__inner">
          <div className="footer__brand"><Link to="/" aria-label={t("ARION 홈")}><img src={`${import.meta.env.BASE_URL}logo-light.png`} alt={site.name} /></Link><p>{t(site.tagline)}<br /><span className="muted">{site.org} Rocket Club · Est. {site.founded}</span></p></div>
          <nav className="footer__nav" aria-label={t("하단 메뉴")}><p className="eyebrow">EXPLORE</p>{nav.map((item) => <Link key={item.to} to={item.to}>{t(item.label)} <span aria-hidden="true">↗</span></Link>)}</nav>
          <div className="footer__contact"><p className="eyebrow">GET IN TOUCH</p><p>{t(site.contact.location)}</p>{leaders.map((person) => <div className="footer__person" key={person.role}><p>{t(person.role)} — {t(person.name)}</p><a href={`tel:${person.phone.replaceAll('-', '')}`}>{person.phone}</a><a href={`mailto:${person.email}`}>{person.email}</a></div>)}{email && <a href={`mailto:${email}`}>{email}</a>}{instagram && <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noreferrer">@{instagram} ↗</a>}<Link className="text-link" to="/contact">{t("함께 이야기해요")} <span aria-hidden="true">↗</span></Link></div>
        </div>
        <div className="footer__bottom mono"><p>© {new Date().getFullYear()} ARION. ALL RIGHTS RESERVED.</p><span>BUILT ON CURIOSITY.</span><button type="button" onClick={() => window.scrollTo({ top: 0, behavior: paused ? 'instant' : 'smooth' })}>BACK TO TOP ↑</button></div>
      </div>
    </footer>
  )
}
