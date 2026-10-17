import { useLanguage } from '../lib/language'
import type { ReactNode } from 'react'

type Props = {
  id?: string
  className?: string
  eyebrow?: string
  title?: string
  action?: ReactNode
  children: ReactNode
}

export default function Section({ id, className = '', eyebrow, title, action, children }: Props) {
  const { t } = useLanguage()
  return (
    <section id={id} className={`section ${className}`}>
      <div className="container reveal">
        {(eyebrow || title || action) && (
          <div className="section__head">
            <div>
              {eyebrow && <p className="eyebrow">{t(eyebrow)}</p>}
              {title && <h2>{t(title)}</h2>}
            </div>
            {action}
          </div>
        )}
        {children}
      </div>
    </section>
  )
}
