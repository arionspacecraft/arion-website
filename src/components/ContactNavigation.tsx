import { NavLink } from 'react-router-dom'
import { useLanguage } from '../lib/language'

export default function ContactNavigation() {
  const { t } = useLanguage()
  return (
    <nav className="contact-nav" aria-label={t('문의 바로가기')}>
      <div className="container">
        <NavLink to="/contact">{t('직접 문의')}</NavLink>
        <NavLink to="/qna">Q&A</NavLink>
      </div>
    </nav>
  )
}
