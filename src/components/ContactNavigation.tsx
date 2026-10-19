import { NavLink } from 'react-router-dom'
import { useLanguage } from '../lib/language'

export default function ContactNavigation() {
  const { t } = useLanguage()
  return (
    <nav className="contact-nav" aria-label={t('문의 바로가기')}>
      <div className="container">
        <div className="tabs">
          <NavLink to="/qna" className="tab">Q&A</NavLink>
          <NavLink to="/contact" className="tab">{t('직접 문의')}</NavLink>
        </div>
      </div>
    </nav>
  )
}
