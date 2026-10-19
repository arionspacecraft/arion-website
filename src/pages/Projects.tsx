import { useLanguage } from '../lib/language'
import FilterTabs from '../components/FilterTabs'
import PageHeader from '../components/PageHeader'
import ProjectCard from '../components/ProjectCard'
import Section from '../components/Section'
import { projects, projectsEmptyMessage } from '../content/projects'
import { projectStatusFilters } from '../content/navigationFilters'
import { useQueryFilter } from '../lib/useQueryFilter'
import { usePageTitle } from '../lib/usePageTitle'

export default function Projects() {
  const { t } = useLanguage()
  usePageTitle('프로젝트')
  const [status, setStatus] = useQueryFilter('status', projectStatusFilters)
  const shown = status ? projects.filter((p) => p.status === status) : projects

  return (
    <>
      <PageHeader eyebrow="Projects" title={t("프로젝트")} lead="ARION이 설계하고 만드는 것들" />
      <Section className="section--cards">
        <FilterTabs options={projectStatusFilters.map(option => option.value)} value={status} onChange={setStatus} />
        {shown.length > 0 ? (
          <div className="grid grid--3">
            {shown.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        ) : (
          <p className="empty">{t(projects.length ? '해당하는 프로젝트가 없습니다.' : projectsEmptyMessage)}</p>
        )}
      </Section>
    </>
  )
}
