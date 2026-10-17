import { useLanguage } from '../lib/language'
type Props = {
  eyebrow?: string
  title: string
  lead?: string
  translateContent?: boolean
}

export default function PageHeader({ eyebrow, title, lead, translateContent = true }: Props) {
  const { t } = useLanguage()
  return (
    <header className="page-header theme-dark">
      <div className="container">
        {eyebrow && <p className="eyebrow">{t(eyebrow)}</p>}
        <h1 data-notion-content={translateContent ? undefined : ''} translate={translateContent ? undefined : 'no'}>{translateContent ? t(title) : title}</h1>
        {lead && <p className="lead" data-notion-content={translateContent ? undefined : ''} translate={translateContent ? undefined : 'no'}>{translateContent ? t(lead) : lead}</p>}
      </div>
    </header>
  )
}
