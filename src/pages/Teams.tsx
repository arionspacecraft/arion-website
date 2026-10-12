import PageHeader from '../components/PageHeader'
import Section from '../components/Section'
import { teams } from '../content/teams'
import { usePageTitle } from '../lib/usePageTitle'

export default function Teams() {
  usePageTitle('팀')

  return (
    <>
      <PageHeader eyebrow="Teams" title="팀 구성" lead="하나의 로켓을 위해 각 팀이 함께 움직입니다." />
      <Section>
        <div className="grid grid--2">
          {teams.map((team) => (
            <article key={team.name} className="card">
              <p className="eyebrow">{team.nameEn}</p>
              <h2>{team.name}</h2>
              <p className="muted">{team.summary}</p>
              <ul className="tag-list">
                {team.tasks.map((task) => (
                  <li key={task} className="badge">
                    {task}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </Section>
    </>
  )
}
