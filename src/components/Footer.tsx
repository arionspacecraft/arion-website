import { Link } from 'react-router-dom'
import { nav, site } from '../content/site'
import { useMotion } from './Motion'

export default function Footer() {
  const { email, instagram } = site.contact
  const { paused } = useMotion()
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__inner">
          <div className="footer__brand"><Link to="/" aria-label="ARION 홈"><img src={`${import.meta.env.BASE_URL}logo-light.png`} alt={site.name} /></Link><p>{site.tagline}<br /><span className="muted">{site.org} Rocket Club · Est. {site.founded}</span></p></div>
          <nav className="footer__nav" aria-label="하단 메뉴"><p className="eyebrow">EXPLORE</p>{nav.map((item) => <Link key={item.to} to={item.to}>{item.label} <span aria-hidden="true">↗</span></Link>)}</nav>
          <div className="footer__contact"><p className="eyebrow">GET IN TOUCH</p><p>{site.contact.location}</p>{email && <a href={`mailto:${email}`}>{email}</a>}{instagram && <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noreferrer">@{instagram} ↗</a>}<Link className="text-link" to="/contact">함께 이야기해요 <span aria-hidden="true">↗</span></Link></div>
        </div>
        <div className="footer__bottom mono"><p>© {new Date().getFullYear()} ARION. ALL RIGHTS RESERVED.</p><span>BUILT ON CURIOSITY.</span><button type="button" onClick={() => window.scrollTo({ top: 0, behavior: paused ? 'instant' : 'smooth' })}>BACK TO TOP ↑</button></div>
      </div>
    </footer>
  )
}
