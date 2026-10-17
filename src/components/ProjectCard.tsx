import { useLanguage } from '../lib/language'
import { Link } from 'react-router-dom'
import type { Project } from '../content/projects'
import ProjectVisual from './ProjectVisual'

export default function ProjectCard({ project }: { project: Project }) {
  const { t } = useLanguage()
  return (
    <Link to={`/projects/${project.slug}`} className="card card--link project-card">
      <ProjectVisual variant={project.slug} />
      <div className="project-card__body">
      <p className="card__meta">
        <span className={`badge${project.status === '진행 중' ? ' badge--active' : ''}`}>{t(project.status)}</span>
        <span>{t(project.period)}</span>
      </p>
      <h3 data-notion-content translate="no">{project.title}</h3>
      <p className="muted" data-notion-content translate="no">{project.summary}</p>
      <span className="project-card__link">{t("프로젝트 살펴보기")} <span aria-hidden="true">↗</span></span>
      </div>
    </Link>
  )
}
