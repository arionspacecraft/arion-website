type Props = {
  eyebrow?: string
  title: string
  lead?: string
}

export default function PageHeader({ eyebrow, title, lead }: Props) {
  return (
    <header className="page-header theme-dark">
      <div className="container">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {lead && <p className="lead">{lead}</p>}
      </div>
    </header>
  )
}
