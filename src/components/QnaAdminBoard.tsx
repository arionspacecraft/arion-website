import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Section from './Section'
import StaffLogin from './QnaStaffLogin'
import { useLanguage } from '../lib/language'
import { QNA_PAGE_SIZE, qnaError } from '../lib/qna'
import type { AdminPage, AdminQuestion, QnaApi, QueueFilter } from '../lib/qna'

export default function QnaAdminBoard({ api }: { api: QnaApi }) {
  const { t } = useLanguage()
  const [staff, setStaff] = useState(false)
  useEffect(() => api.watchStaff(setStaff), [api])
  return <Section id="qna-admin" className="qna" title="Q&A 관리" eyebrow="ARION TEAM">
    <Link className="text-link" to="/qna">{t('공개 Q&A 보기')}</Link>
    {staff ? <><StaffLogin api={api} /><Queue api={api} /></> : <p className="qna__notice">{t('운영진 인증이 필요합니다. Q&A의 질문 작성란에서 인증해 주세요.')}</p>}
  </Section>
}

function Queue({ api }: { api: QnaApi }) {
  const { t } = useLanguage()
  const [filter, setFilter] = useState<QueueFilter>('pending')
  const [page, setPage] = useState(0)
  const [revision, setRevision] = useState(0)
  const [result, setResult] = useState<AdminPage>({ questions: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    // eslint-disable-next-line react/set-state-in-effect -- Synchronize request state with the protected queue fetch.
    setLoading(true)
    setError('')
    api.staffList(filter, page).then(data => {
      if (active) {
        if (page > 0 && !data.questions.length) setPage(Math.max(0, Math.ceil(data.total / QNA_PAGE_SIZE) - 1))
        setResult(data)
      }
    }).catch(cause => {
      // An expired or revoked account must not retain previously fetched PII.
      if (active) { setResult({ questions: [], total: 0 }); setError(qnaError(cause)) }
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [api, filter, page, revision])
  const refresh = () => setRevision(value => value + 1)
  return <>
    <div className="qna__toolbar">
      <div className="qna__staff-actions" aria-label={t('질문 상태')}>
        {(['pending', 'published', 'hidden'] as const).map(value => <button className="button" type="button" key={value} aria-pressed={filter === value}
          onClick={() => { setFilter(value); setPage(0); setResult({ questions: [], total: 0 }) }}>{t(value === 'pending' ? '답변 대기' : value === 'published' ? '공개 중' : '숨김')}</button>)}
      </div>
      <button type="button" className="button" disabled={loading} onClick={refresh}>{t('새로고침')}</button>
    </div>
    {error && <p className="qna__status" role="alert">{t(error)}</p>}
    <div aria-busy={loading}>
      {loading && <p className="qna__status" role="status">{t('질문을 불러오는 중…')}</p>}
      {result.questions.length ? <ul className="qna__list">{result.questions.map(question => <AdminItem key={question.id} question={question} api={api} onChange={refresh} />)}</ul>
        : !loading && !error && <p className="qna__empty">{t('해당 상태의 질문이 없습니다.')}</p>}
    </div>
    {!loading && !error && result.total > QNA_PAGE_SIZE && <nav className="qna__pagination" aria-label={t('질문 페이지')}>
      <button type="button" className="button" disabled={page === 0} onClick={() => setPage(value => value - 1)}>{t('이전')}</button>
      <span>{page + 1} / {Math.ceil(result.total / QNA_PAGE_SIZE)}</span>
      <button type="button" className="button" disabled={(page + 1) * QNA_PAGE_SIZE >= result.total} onClick={() => setPage(value => value + 1)}>{t('다음')}</button>
    </nav>}
  </>
}

function AdminItem({ question: q, api, onChange }: { question: AdminQuestion; api: QnaApi; onChange: () => void }) {
  const { t, language } = useLanguage()
  const [answer, setAnswer] = useState(q.answer ?? '')
  const [title, setTitle] = useState(q.title)
  const [body, setBody] = useState(q.body)
  const [reviewed, setReviewed] = useState(false)
  const [editing, setEditing] = useState(false)
  const [confirmHide, setConfirmHide] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const pending = useRef(false)
  async function mutate(action: 'answer' | 'hide') {
    if (pending.current) return
    if (action === 'answer') {
      if (!reviewed) { setError('공개할 내용에 개인정보가 없는지 확인해 주세요.'); return }
      if (!answer.trim() || answer.trim().length > 4000) { setError('답변은 1자 이상, 4,000자 이하로 작성해 주세요.'); return }
      if (!title.trim() || title.trim().length > 100 || !body.trim() || body.trim().length > 2000) { setError('입력 내용을 확인해 주세요. 빈 내용이나 제한을 넘는 글은 등록할 수 없습니다.'); return }
    }
    pending.current = true; setBusy(true); setError('')
    try {
      if (action === 'answer') await api.answer(q.id, answer.trim(), title.trim(), body.trim())
      else await api.hide(q.id)
      setEditing(false); setConfirmHide(false); onChange()
    } catch (cause) { setError(qnaError(cause)) }
    finally { pending.current = false; setBusy(false) }
  }
  return <li><details className="qna__item">
    <summary><span className="qna__item-meta"><span className="badge">{t(q.hidden ? '숨김' : q.answer ? '공개 중' : '답변 대기')}</span><time dateTime={q.created_at}>{new Intl.DateTimeFormat(language === 'ko' ? 'ko-KR' : 'en-US', { dateStyle: 'medium' }).format(new Date(q.created_at))}</time></span><span className="qna__item-title">{q.original_title}</span></summary>
    <div className="qna__private">
      <h3>{t('운영진 전용 · 원문과 연락처')}</h3>
      <dl><dt>{t('이름')}</dt><dd>{q.name || '—'}</dd><dt>{t('전화번호')}</dt><dd>{q.phone || '—'}</dd><dt>{t('이메일')}</dt><dd>{q.email || '—'}</dd></dl>
      <p>{q.original_body}</p>
    </div>
    {q.answer && <div className="qna__answer"><strong>{t('현재 공개 답변')}</strong><p>{q.answer}</p></div>}
    {!q.hidden && <div className="qna__moderation">
      <div className="qna__staff-actions">
        <button type="button" className="button" disabled={busy} onClick={() => {
          if (!editing) { setAnswer(q.answer ?? ''); setTitle(q.title); setBody(q.body); setReviewed(false) }
          setEditing(!editing); setError('')
        }}>{t(q.answer ? '답변 수정' : '답변 작성')}</button>
        <button type="button" className="button" disabled={busy} onClick={() => setConfirmHide(!confirmHide)}>{t('질문 숨기기')}</button>
      </div>
      {editing && <form className="qna__reply-form" noValidate onSubmit={event => { event.preventDefault(); void mutate('answer') }}>
        <p>{t('아래 질문 문구와 답변만 공개됩니다. 원문에 적힌 개인정보를 지운 뒤 게시해 주세요.')}</p>
        <label className="qna__field" htmlFor={`public-title-${q.id}`}>{t('공개할 질문 제목')}<input id={`public-title-${q.id}`} className="qna__input" required maxLength={100} value={title} disabled={busy} onChange={event => { setTitle(event.target.value); setReviewed(false) }} /></label>
        <label className="qna__field" htmlFor={`public-body-${q.id}`}>{t('공개할 질문 내용')}<textarea id={`public-body-${q.id}`} className="qna__textarea" required maxLength={2000} value={body} disabled={busy} onChange={event => { setBody(event.target.value); setReviewed(false) }} /></label>
        <label className="qna__field" htmlFor={`answer-${q.id}`}>{t('운영진 답변')}<textarea id={`answer-${q.id}`} className="qna__textarea" required maxLength={4000} value={answer} disabled={busy} onChange={event => { setAnswer(event.target.value); setReviewed(false) }} /></label>
        <label className="qna__review"><input type="checkbox" checked={reviewed} disabled={busy} onChange={event => setReviewed(event.target.checked)} />{t('공개할 질문과 답변에 개인정보가 없는지 확인했습니다.')}</label>
        <button className="button button--primary" type="submit" disabled={busy}>{t(busy ? '저장 중…' : '답변 저장 및 공개')}</button>
      </form>}
      {confirmHide && <div className="qna__hide-confirm"><p>{t('질문과 답변을 공개 목록에서 숨길까요?')}</p><button type="button" className="button" disabled={busy} onClick={() => setConfirmHide(false)}>{t('취소')}</button><button type="button" className="button" disabled={busy} onClick={() => void mutate('hide')}>{t('숨기기 확인')}</button></div>}
      {error && <p className="qna__status" role="alert">{t(error)}</p>}
    </div>}
  </details></li>
}
