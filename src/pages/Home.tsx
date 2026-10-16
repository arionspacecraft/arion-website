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
  usePageTitle()
  const shownProjects = [...projects]
    .sort((a, b) => Number(!!b.featured) - Number(!!a.featured))
    .slice(0, 3)

  return (
    <>
      <FlightJourney />

      <Section id="mission" eyebrow="OUR MISSION" className="mission">
        <div className="mission__layout">
          <div><p className="eyebrow">WHY WE BUILD</p><div className="mission__orbit" aria-hidden="true"><span /></div></div>
          <div>
            <h2 className="mission__title">{home.mission.first}<br /><span>{home.mission.second}</span></h2>
            <div className="mission__description"><p>{home.mission.body}</p><Link className="text-link" to="/about">우리의 이야기 <span aria-hidden="true">↗</span></Link></div>
          </div>
        </div>
        <dl className="stats">
          <div><dt>THE BEGINNING <span>창립</span></dt><dd>{site.founded}<span>년</span></dd></div>
          <div><dt>PROJECTS <span>공개 프로젝트</span></dt><dd>{projectsAvailable ? String(projects.length).padStart(2, '0') : '—'}<span>개의 도전</span></dd></div>
          <div><dt>TEAMS <span>함께하는 팀</span></dt><dd>{String(teams.length).padStart(2, '0')}<span>개의 전문 분야</span></dd></div>
          <div className="stats__motto"><dt>OUR DESTINATION</dt><dd>SPACE<span>더 먼 곳을 향해</span></dd></div>
        </dl>
      </Section>

      <Section eyebrow="ENGINEERING IN PROGRESS" title={home.projects.title} action={<Link className="text-link" to="/projects">모든 프로젝트 <span aria-hidden="true">↗</span></Link>} className="home-projects">
        <p className="section__description">{home.projects.description}</p>
        {shownProjects.length > 0
          ? <div className="grid grid--3">{shownProjects.map((project) => <ProjectCard key={project.slug} project={project} />)}</div>
          : <p className="empty">{projectsEmptyMessage}</p>}
      </Section>

      <Section eyebrow="THE TEAM BEHIND THE ROCKET" className="home-teams">
        <div className="team-intro">
          <div><h2>{home.teams.title}<br /><span>{home.teams.accent}</span></h2></div>
          <div><p className="muted">{home.teams.description}</p><Link className="text-link" to="/teams">팀 자세히 보기 <span aria-hidden="true">↗</span></Link></div>
        </div>
        <div className="team-deck">
          {teams.map((team, index) => (
            <Link className="team-module" to="/teams" key={team.nameEn}>
              <div className="team-module__top"><span className="mono">DIVISION / 0{index + 1}</span><span aria-hidden="true">↗</span></div>
              <h3>{team.name}</h3><span className="team-module__en">{team.nameEn}</span>
              <p>{team.summary}</p>
              <div className="team-module__line" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </Section>

      <Section eyebrow="ARION LOGBOOK" title="도전의 기록" action={<Link className="text-link" to="/news">모든 소식 <span aria-hidden="true">↗</span></Link>}>
        <ul className="news-list">{sortedNews.slice(0, 3).map((post) => <NewsItem key={post.slug} post={post} />)}</ul>
      </Section>

      <section className="join-banner">
        <div className="container join-banner__inner reveal">
          <div><p className="eyebrow">YOUR PLACE IN THE MISSION</p><h2>{home.recruit.title}<br /><span>{home.recruit.accent}</span></h2><p className="join-banner__description">{home.recruit.description}</p></div>
          <div className="join-banner__actions"><Link to="/recruit" className="button button--primary">모집 안내 보기 <span aria-hidden="true">↗</span></Link><RecruitStatus /></div>
        </div>
      </section>
    </>
  )
}
