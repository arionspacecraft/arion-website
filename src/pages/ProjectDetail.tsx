import { useLanguage } from '../lib/language'
import { Link, useParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Section from '../components/Section'
import { projects } from '../content/projects'
import { usePageTitle } from '../lib/usePageTitle'
import NotFound from './NotFound'

export default function ProjectDetail() {
  const { t } = useLanguage()
  const { slug } = useParams()
  const project = projects.find((p) => p.slug === slug)
  usePageTitle(project?.title ?? t('페이지를 찾을 수 없습니다'), false)

  if (!project) return <NotFound />

  return (
    <>
      <PageHeader eyebrow={`${t(project.status)} · ${t(project.period)}`} title={project.title} lead={project.summary} translateContent={false} />
      <Section>
        <div className="prose">
          {project.body.map((paragraph) => (
            <p key={paragraph} data-notion-content translate="no">{paragraph}</p>
          ))}
        </div>

        {project.specs.length > 0 && (
          <table className="specs">
            <caption>{t("제원")}</caption>
            <tbody>
              {project.specs.map(([label, value]) => (
                <tr key={label}>
                  <th scope="row" data-notion-content translate="no">{label}</th>
                  <td data-notion-content translate="no">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {project.links.length > 0 && (
          <ul className="link-list">
            {project.links.map((link) => (
              <li key={link.href}>
                <a href={link.href} target="_blank" rel="noreferrer" data-notion-content translate="no">
                  {link.label} ↗
                </a>
              </li>
            ))}
          </ul>
        )}

        <p>
          <Link to="/projects">{t("← 프로젝트 목록")}</Link>
        </p>
      </Section>
    </>
  )
}
