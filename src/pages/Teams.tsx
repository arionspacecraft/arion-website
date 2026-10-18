import { Link } from 'react-router-dom'
import { useLanguage } from '../lib/language'
import PageHeader from '../components/PageHeader'
import Section from '../components/Section'
import { teams } from '../content/teams'
import { usePageTitle } from '../lib/usePageTitle'

export default function Teams() {
  const { t } = useLanguage()
  usePageTitle('팀')

  return (
    <>
      <PageHeader eyebrow="Teams" title="팀 구성" lead="하나의 로켓을 위해 각 팀이 함께 움직입니다." />
      <Section>
        <div className="team-overview">
          {teams.map((team, index) => (
            <Link key={team.slug} to={`/teams/${team.slug}`} className="team-summary card">
              <div className="team-summary__top">
                <p className="eyebrow">DIVISION / 0{index + 1}</p>
                <span aria-hidden="true">↗</span>
              </div>
              <h2>{t(team.name)}</h2>
              <p className="team-summary__name">{team.nameEn}</p>
              <p className="muted">{t(team.summary)}</p>
              <ul className="tag-list">
                {team.tasks.map((task) => <li key={task} className="badge">{t(task)}</li>)}
              </ul>
              <span className="team-summary__more">{t('팀 소개 보기')} <span aria-hidden="true">→</span></span>
            </Link>
          ))}
        </div>
      </Section>
    </>
  )
}
