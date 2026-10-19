import { useLanguage } from '../lib/language'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import RecruitStatus from '../components/RecruitStatus'
import Section from '../components/Section'
import { faq, seeking, steps } from '../content/recruit'
import { formatDate, getRecruitState } from '../lib/recruit'
import { usePageTitle } from '../lib/usePageTitle'

export default function Recruit() {
  const { t } = useLanguage()
  usePageTitle('모집')
  const state = getRecruitState()
  const applyUrl = state.status === 'open' ? state.round.applyUrl : ''

  return (
    <>
      <PageHeader eyebrow="Join us" title={t("신입 부원 모집")} lead="아리온과 함께 DGIST 최초의 역사를 만들어갑니다." />

      <Section className="section--cards">
        <div className="card recruit-box">
          <RecruitStatus />
          {state.round && (
            <p className="muted">
              {t(state.status === 'closed' ? '지난 모집' : '모집 기간')}: {formatDate(state.round.start)} —{' '}
              {formatDate(state.round.end)}
            </p>
          )}
          {state.status === 'open' &&
            (applyUrl ? (
              <a href={applyUrl} target="_blank" rel="noreferrer" className="button button--primary">{t("지원하기 ↗")} </a>
            ) : (
              <p className="muted">{t("지원 링크는 곧 공개됩니다.")}</p>
            ))}
          {state.status !== 'open' && (
            <Link to="/contact" className="button">{t("문의하기")} </Link>
          )}
        </div>
      </Section>

      <Section eyebrow="Who we seek" title={t("이런 분을 찾습니다")} className="section--cards">
        <ol className="grid grid--3 numbered">
          {seeking.map((item) => (
            <li key={item.title} className="card">
              <h3>{t(item.title)}</h3>
              <p className="muted">{t(item.body)}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section eyebrow="Process" title={t("모집 절차")} className="section--cards">
        <ol className="grid grid--3 numbered">
          {steps.map((step) => (
            <li key={step.title} className="card">
              <h3>{t(step.title)}</h3>
              <p className="muted">{t(step.body)}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section eyebrow="FAQ" title={t("자주 묻는 질문")}>
        <div className="faq">
          {faq.map((item) => (
            <details key={item.q}>
              <summary>{t(item.q)}</summary>
              <p>{t(item.a)}</p>
            </details>
          ))}
        </div>
      </Section>
    </>
  )
}
