import { useLanguage } from '../lib/language'
import { Link } from 'react-router-dom'
import NewsItem from '../components/NewsItem'
import FlightJourney from '../components/FlightJourney'
import ProjectCard from '../components/ProjectCard'
import RecruitStatus from '../components/RecruitStatus'
import Section from '../components/Section'
import { home } from '../content/home'
import { sortedNews } from '../content/news'
import { projects, projectsAvailable, projectsEmptyMessage } from '../content/projects'
import { site } from '../content/site'
import { teams } from '../content/teams'
import { usePageTitle } from '../lib/usePageTitle'

export default function Home() {
  const { t } = useLanguage()
  usePageTitle()
  const shownProjects = [...projects]
    .sort((a, b) => Number(!!b.featured) - Number(!!a.featured))
    .slice(0, 3)

  return (
    <div className="home-journey">
      <FlightJourney />

      <div className="journey__window" data-flight-stop="earth" aria-hidden="true" />

      <Section id="mission" eyebrow="OUR MISSION" className="mission">
        <div className="mission__layout">
          <div><p className="eyebrow">WHY WE BUILD</p><div className="mission__orbit" aria-hidden="true"><span /></div></div>
          <div>
            <h2 className="mission__title">{t(home.mission.first)}<br /><span>{t(home.mission.second)}</span></h2>
            <div className="mission__description"><p>{t(home.mission.body)}</p><Link className="text-link" to="/about">{t("우리의 이야기")} <span aria-hidden="true">↗</span></Link></div>
          </div>
        </div>
        <dl className="stats">
          <div><dt>THE BEGINNING <span>{t("창립")}</span></dt><dd>{site.founded}<span>{t("년")}</span></dd></div>
          <div><dt>PROJECTS <span>{t("공개 프로젝트")}</span></dt><dd>{t(projectsAvailable ? String(projects.length).padStart(2, '0') : '—')}<span>{t("개의 도전")}</span></dd></div>
          <div><dt>TEAMS <span>{t("함께하는 팀")}</span></dt><dd>{String(teams.length).padStart(2, '0')}<span>{t("개의 전문 분야")}</span></dd></div>
          <div className="stats__motto"><dt>OUR DESTINATION</dt><dd>SPACE<span>{t("더 먼 곳을 향해")}</span></dd></div>
        </dl>
      </Section>

      <div className="journey__window" data-flight-stop="solar" aria-hidden="true" />

      <Section eyebrow="ENGINEERING IN PROGRESS" title={home.projects.title} action={<Link className="text-link" to="/projects">{t("모든 프로젝트")} <span aria-hidden="true">↗</span></Link>} className="home-projects">
        <p className="section__description">{t(home.projects.description)}</p>
        {shownProjects.length > 0
          ? <div className="grid grid--3">{shownProjects.map((project) => <ProjectCard key={project.slug} project={project} />)}</div>
          : <p className="empty">{t(projectsEmptyMessage)}</p>}
      </Section>

      <div className="journey__window" data-flight-stop="galaxy" aria-hidden="true" />

      <Section eyebrow="THE TEAM BEHIND THE ROCKET" title={`${t(home.teams.title)} ${t(home.teams.accent)}`} action={<Link className="text-link" to="/teams">{t("팀 자세히 보기")} <span aria-hidden="true">↗</span></Link>} className="home-teams">
        <p className="section__description">{t(home.teams.description)}</p>
        <div className="team-deck">
          {teams.map((team, index) => (
            <Link className="team-module" to={`/teams/${team.slug}`} key={team.slug}>
              <div className="team-module__top"><span className="mono">DIVISION / 0{index + 1}</span><span aria-hidden="true">↗</span></div>
              <h3>{t(team.name)}</h3><span className="team-module__en">{team.nameEn}</span>
              <p>{t(team.summary)}</p>
              <div className="team-module__line" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </Section>

      <div className="journey__window" data-flight-stop="local" aria-hidden="true" />

      <Section eyebrow="ARION LOGBOOK" title={t("도전의 기록")} action={<Link className="text-link" to="/news">{t("모든 소식")} <span aria-hidden="true">↗</span></Link>}>
        <ul className="news-list">{sortedNews.slice(0, 3).map((post) => <NewsItem key={post.slug} post={post} />)}</ul>
      </Section>

      <div className="journey__window" data-flight-stop="cosmic" aria-hidden="true" />

      <section className="join-banner">
        <div className="container join-banner__inner reveal">
          <div><p className="eyebrow">YOUR PLACE IN THE MISSION</p><h2>{t(home.recruit.title)}<br /><span>{t(home.recruit.accent)}</span></h2><p className="join-banner__description">{t(home.recruit.description)}</p></div>
          <div className="join-banner__actions"><Link to="/recruit" className="button button--primary">{t("모집 안내 보기")} <span aria-hidden="true">↗</span></Link><RecruitStatus /></div>
        </div>
      </section>
    </div>
  )
}
