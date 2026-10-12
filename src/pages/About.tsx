import PageHeader from '../components/PageHeader'
import Section from '../components/Section'
import { activities, concept, history, vision } from '../content/about'
import { usePageTitle } from '../lib/usePageTitle'

export default function About() {
  usePageTitle('소개')

  return (
    <>
      <PageHeader eyebrow="About" title="ARION 소개" lead={concept.body} />

      <Section eyebrow="Concept" title={concept.title}>
        <dl className="concept">
          {concept.parts.map((part) => (
            <div key={part.word}>
              <dt>{part.word}</dt>
              <dd>{part.meaning}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section eyebrow="Vision" title={vision.title}>
        <p className="lead">{vision.body}</p>
      </Section>

      <Section eyebrow="Activities" title="활동 내용">
        <ol className="grid grid--3 numbered">
          {activities.map((activity) => (
            <li key={activity.title} className="card">
              <h3>{activity.title}</h3>
              <p className="muted">{activity.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section eyebrow="History" title="연혁">
        <ol className="timeline">
          {history.map((item) => (
            <li key={item.date + item.title}>
              <span className="timeline__date">{item.date}</span>
              <div>
                <strong>{item.title}</strong>
                {item.body && <p className="muted">{item.body}</p>}
              </div>
            </li>
          ))}
        </ol>
      </Section>
    </>
  )
}
