import { useLanguage } from '../lib/language'
import PageHeader from '../components/PageHeader'
import Section from '../components/Section'
import { activities, concept, history, vision } from '../content/about'
import { usePageTitle } from '../lib/usePageTitle'

export default function About() {
  const { t, language } = useLanguage()
  usePageTitle('소개')

  return (
    <>
      <PageHeader eyebrow="About" title={t("ARION 소개")} lead={concept.body} />

      <Section eyebrow="Concept" title={concept.title}>
        <dl className="concept">
          {concept.parts.map((part, index) => (
            <div key={part.word}>
              <dt>
                {index > 0 && <span className="concept__plus" aria-hidden="true">+</span>}
                {t(part.word)}
              </dt>
              <dd>{t(part.meaning)}</dd>
            </div>
          ))}
        </dl>
        <div className="concept-copy">
          {language === 'ko' ? (
            <>
              <p>우주를 뜻하는 아라와 모든것을 뜻하는 온을 합쳐</p>
              <p className="concept-copy__meaning"><strong>우주를 향한 <span className="concept-copy__accent">도전</span></strong><span className="concept-copy__suffix">이라는 의미를 담았습니다.</span></p>
            </>
          ) : (
            <>
              <p>By combining ARA, meaning the universe, with ON, meaning everything,</p>
              <p className="concept-copy__meaning">we express our <strong><span className="concept-copy__accent">challenge</span> to reach space</strong>.</p>
            </>
          )}
        </div>
      </Section>

      <Section eyebrow="Vision" title={vision.title}>
        <p className="lead">{t(vision.body)}</p>
      </Section>

      <Section eyebrow="Activities" title={t("활동 내용")}>
        <ol className="grid grid--3 numbered">
          {activities.map((activity) => (
            <li key={activity.title} className="card">
              <h3>{t(activity.title)}</h3>
              <p className="muted">{t(activity.body)}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section eyebrow="History" title={t("연혁")}>
        <ol className="timeline">
          {history.map((item) => (
            <li key={item.date + item.title}>
              <span className="timeline__date">{item.date}</span>
              <div>
                <strong>{t(item.title)}</strong>
                {item.body && <p className="muted">{t(item.body)}</p>}
              </div>
            </li>
          ))}
        </ol>
      </Section>
    </>
  )
}
