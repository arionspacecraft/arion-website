import { Link } from 'react-router-dom'
import NewsItem from '../components/NewsItem'
import ParticleField from '../components/ParticleField'
import ProjectCard from '../components/ProjectCard'
import RecruitStatus from '../components/RecruitStatus'
import Section from '../components/Section'
import { home } from '../content/home'
import { sortedNews } from '../content/news'
import { projects } from '../content/projects'
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
      <section className="launch" aria-label="ARION — 온 우주를 탐구하다">
        <div className="launch__grid" aria-hidden="true" />
        <div className="container launch__layout">
          <div className="launch__copy">
            <p className="launch__eyebrow"><span /> {home.hero.label} / EST. {site.founded}</p>
            <h1>{home.hero.first}<br /><span>{home.hero.second}</span></h1>
            <p className="launch__description">{site.description}.<br />{home.hero.note}</p>
            <div className="launch__actions">
              <Link to="/projects" className="button button--primary">우리의 프로젝트 <span aria-hidden="true">↗</span></Link>
              <Link to="/about" className="launch__about">ARION 소개 <span aria-hidden="true">→</span></Link>
            </div>
            <div className="launch__signature"><span className="mono">OUR MISSION</span><p>{site.tagline}</p></div>
          </div>
          <figure className="flight-scene" aria-label="마우스에 반응하는 로켓 입자와 비행 궤도 그래픽">
            <ParticleField />
            <div className="flight-scene__top mono"><span>ARION / FLIGHT FIELD</span><span>01</span></div>
            <div className="flight-scene__cross flight-scene__cross--one" aria-hidden="true">+</div>
            <div className="flight-scene__cross flight-scene__cross--two" aria-hidden="true">+</div>
            <div className="flight-scene__axis" aria-hidden="true"><span>Z</span><span>X</span></div>
            <figcaption><span className="flight-scene__dot" /> 마우스를 움직여 궤도를 깨워보세요</figcaption>
            <span className="flight-scene__note mono">CONCEPT VISUALIZATION</span>
          </figure>
        </div>
        <div className="container launch__strip">
          <p><span className="mono">01</span> 상상하고 <span className="launch__strip-en">DESIGN</span></p>
          <p><span className="mono">02</span> 직접 만들고 <span className="launch__strip-en">BUILD</span></p>
          <p><span className="mono">03</span> 더 멀리 나아가다 <span className="launch__strip-en">LAUNCH</span></p>
          <a href="#mission" aria-label="아래로 스크롤하여 ARION 알아보기">우리의 여정 <span aria-hidden="true">↓</span></a>
        </div>
      </section>

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
          <div><dt>PROJECTS <span>프로젝트</span></dt><dd>{String(projects.length).padStart(2, '0')}<span>개의 도전</span></dd></div>
          <div><dt>TEAMS <span>함께하는 팀</span></dt><dd>{String(teams.length).padStart(2, '0')}<span>개의 전문 분야</span></dd></div>
          <div className="stats__motto"><dt>OUR DESTINATION</dt><dd>SPACE<span>더 먼 곳을 향해</span></dd></div>
        </dl>
      </Section>

      <Section eyebrow="ENGINEERING IN PROGRESS" title={home.projects.title} action={<Link className="text-link" to="/projects">모든 프로젝트 <span aria-hidden="true">↗</span></Link>} className="home-projects">
        <p className="section__description">{home.projects.description}</p>
        <div className="grid grid--3">{shownProjects.map((project) => <ProjectCard key={project.slug} project={project} />)}</div>
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
