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
  return (
    <section id={id} className={`section ${className}`}>
      <div className="container reveal">
        {(eyebrow || title || action) && (
          <div className="section__head">
            <div>
              {eyebrow && <p className="eyebrow">{eyebrow}</p>}
              {title && <h2>{title}</h2>}
            </div>
            {action}
          </div>
        )}
        {children}
      </div>
    </section>
  )
}
