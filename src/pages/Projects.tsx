import { useLanguage } from '../lib/language'
import { useState } from 'react'
import FilterTabs from '../components/FilterTabs'
import PageHeader from '../components/PageHeader'
import ProjectCard from '../components/ProjectCard'
import Section from '../components/Section'
import { projects, projectsEmptyMessage, projectStatuses } from '../content/projects'
import type { ProjectStatus } from '../content/projects'
import { usePageTitle } from '../lib/usePageTitle'

export default function Projects() {
  const { t } = useLanguage()
  usePageTitle('프로젝트')
  const [status, setStatus] = useState<ProjectStatus | null>(null)
  const shown = status ? projects.filter((p) => p.status === status) : projects

  return (
    <>
      <PageHeader eyebrow="Projects" title={t("프로젝트")} lead="ARION이 설계하고 만드는 것들" />
      <Section>
        <FilterTabs options={projectStatuses} value={status} onChange={setStatus} />
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
