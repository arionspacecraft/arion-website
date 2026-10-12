import { Link, useParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Section from '../components/Section'
import { projects } from '../content/projects'
import { usePageTitle } from '../lib/usePageTitle'
import NotFound from './NotFound'

export default function ProjectDetail() {
  const { slug } = useParams()
  const project = projects.find((p) => p.slug === slug)
  usePageTitle(project?.title ?? '페이지를 찾을 수 없습니다')

  if (!project) return <NotFound />

  return (
    <>
      <PageHeader eyebrow={`${project.status} · ${project.period}`} title={project.title} lead={project.summary} />
      <Section>
        <div className="prose">
          {project.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        {project.specs.length > 0 && (
          <table className="specs">
            <caption>제원</caption>
            <tbody>
              {project.specs.map(([label, value]) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {project.links.length > 0 && (
          <ul className="link-list">
            {project.links.map((link) => (
              <li key={link.href}>
                <a href={link.href} target="_blank" rel="noreferrer">
                  {link.label} ↗
                </a>
              </li>
            ))}
          </ul>
        )}

        <p>
          <Link to="/projects">← 프로젝트 목록</Link>
        </p>
      </Section>
    </>
  )
}
