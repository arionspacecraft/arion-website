import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import RecruitStatus from '../components/RecruitStatus'
import Section from '../components/Section'
import { faq, seeking, steps } from '../content/recruit'
import { formatDate, getRecruitState } from '../lib/recruit'
import { usePageTitle } from '../lib/usePageTitle'

export default function Recruit() {
  usePageTitle('모집')
  const state = getRecruitState()
  const applyUrl = state.status === 'open' ? state.round.applyUrl : ''

  return (
    <>
      <PageHeader eyebrow="Join us" title="신입 부원 모집" lead="아리온과 함께 DGIST 최초의 역사를 만들어갑니다." />

      <Section>
        <div className="card recruit-box">
          <RecruitStatus />
          {state.round && (
            <p className="muted">
              {state.status === 'closed' ? '지난 모집' : '모집 기간'}: {formatDate(state.round.start)} —{' '}
              {formatDate(state.round.end)}
            </p>
          )}
          {state.status === 'open' &&
            (applyUrl ? (
              <a href={applyUrl} target="_blank" rel="noreferrer" className="button button--primary">
                지원하기 ↗
              </a>
            ) : (
              <p className="muted">지원 링크는 곧 공개됩니다.</p>
            ))}
          {state.status !== 'open' && (
            <Link to="/contact" className="button">
              문의하기
            </Link>
          )}
        </div>
      </Section>

      <Section eyebrow="Who we seek" title="이런 분을 찾습니다">
        <ol className="grid grid--3 numbered">
          {seeking.map((item) => (
            <li key={item.title} className="card">
              <h3>{item.title}</h3>
              <p className="muted">{item.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section eyebrow="Process" title="모집 절차">
        <ol className="grid grid--3 numbered">
          {steps.map((step) => (
            <li key={step.title} className="card">
              <h3>{step.title}</h3>
              <p className="muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section eyebrow="FAQ" title="자주 묻는 질문">
        <div className="faq">
          {faq.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </Section>
    </>
  )
}
