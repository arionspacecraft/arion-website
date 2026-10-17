import { useLanguage } from '../lib/language'
type Props = {
  eyebrow?: string
  title: string
  lead?: string
}

export default function PageHeader({ eyebrow, title, lead }: Props) {
  const { t } = useLanguage()
  return (
    <header className="page-header theme-dark">
      <div className="container">
        {eyebrow && <p className="eyebrow">{t(eyebrow)}</p>}
        <h1>{t(title)}</h1>
        {lead && <p className="lead">{t(lead)}</p>}
      </div>
    </header>
  )
}
