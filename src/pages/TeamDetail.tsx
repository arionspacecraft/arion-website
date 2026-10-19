import { Link, useParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Section from '../components/Section'
import { teams } from '../content/teams'
import { useLanguage } from '../lib/language'
import { usePageTitle } from '../lib/usePageTitle'
import NotFound from './NotFound'

export default function TeamDetail() {
  const { slug } = useParams()
  const { t } = useLanguage()
  const team = teams.find((item) => item.slug === slug)
  usePageTitle(team?.name ?? '페이지를 찾을 수 없습니다')

  if (!team) return <NotFound />

  return (
    <div className="team-detail">
      <PageHeader eyebrow={team.nameEn} title={team.name} lead={team.summary} />
      <Section>
        <nav className="team-detail__breadcrumb" aria-label={t('현재 위치')}>
          <ol>
            <li><Link to="/teams">{t('전체 팀')}</Link></li>
            <li><span aria-hidden="true">&gt;</span><span aria-current="page">{t(team.name)}</span></li>
          </ol>
        </nav>
        <div className="section__head">
          <div><h2>{t('팀 소개')}</h2></div>
        </div>
        <div className="team-detail__intro">
          <div className="prose">
            <span className="badge team-detail__placeholder">{t('임시 소개')}</span>
            <p>{t(team.introduction)}</p>
            <p>{t(team.collaboration)}</p>
          </div>
          <aside className="team-detail__roles">
            <h3>{t('주요 역할')}</h3>
            <ul>{team.tasks.map((task) => <li key={task}>{t(task)}</li>)}</ul>
          </aside>
        </div>
      </Section>
      <Section eyebrow="WHAT WE EXPLORE" title="함께하는 일">
        <div className="team-detail__tasks">
          {team.tasks.map((task, index) => (
            <article className="team-detail__step card" key={task}>
              <p className="eyebrow">0{index + 1}</p>
              <h3>{t(task)}</h3>
              <p className="muted">{t(team.taskDescriptions[index])}</p>
            </article>
          ))}
        </div>
        <p className="team-detail__note muted">{t('소개 내용은 추후 업데이트됩니다.')}</p>
        <Link className="team-detail__back text-link" to="/teams"><span aria-hidden="true">←</span> {t('팀 목록')}</Link>
      </Section>
    </div>
  )
}
