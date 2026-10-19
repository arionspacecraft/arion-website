import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import Section from './Section'
import { useLanguage } from '../lib/language'
import { QNA_PAGE_SIZE, qnaError } from '../lib/qna'
import type { PublicQuestion, QnaApi, QuestionDraft, QuestionPage } from '../lib/qna'

const emptyDraft: QuestionDraft = { nickname: '', title: '', body: '' }

export default function LiveQnaBoard({ api }: { api: QnaApi }) {
  const { t } = useLanguage()
  const [result, setResult] = useState<QuestionPage>({ questions: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [revision, setRevision] = useState(0)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [staff, setStaff] = useState(false)
  const [writing, setWriting] = useState(false)
  const [draft, setDraft] = useState<QuestionDraft>(emptyDraft)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const writeButton = useRef<HTMLButtonElement>(null)
  const request = useRef<{ id: string; draft: string } | null>(null)
  const submitting = useRef(false)

  useEffect(() => api.watchStaff(setStaff), [api])
  useEffect(() => {
    let active = true
    // eslint-disable-next-line react/set-state-in-effect -- Synchronize the pending state with this network request.
    setLoading(true)
    setLoadError(false)
    api.list(query, page).then(data => {
      if (active) {
        if (page > 0 && data.questions.length === 0) setPage(Math.max(0, Math.ceil(data.total / QNA_PAGE_SIZE) - 1))
        setResult(data)
      }
    }).catch(() => { if (active) setLoadError(true) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [api, query, page, revision])

  function refresh() { setRevision(value => value + 1) }
  function closeForm() { setWriting(false); setError(''); writeButton.current?.focus() }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current) return
    const clean = { nickname: draft.nickname.trim(), title: draft.title.trim(), body: draft.body.trim() }
    if (!clean.title || !clean.body) { setError('제목과 내용을 입력해 주세요. 공백만으로는 저장할 수 없습니다.'); return }
    if (clean.nickname.length > 40 || clean.title.length > 100 || clean.body.length > 2000) {
      setError('입력 길이를 확인해 주세요. 제목은 100자, 내용은 2,000자까지 작성할 수 있습니다.'); return
    }
    const fingerprint = JSON.stringify(clean)
    if (!request.current || request.current.draft !== fingerprint) request.current = { id: crypto.randomUUID(), draft: fingerprint }
    submitting.current = true
    setSaving(true); setError(''); setStatus('')
    try {
      await api.submit(clean, request.current.id)
      request.current = null
      setDraft(emptyDraft); setSearch(''); setQuery(''); setPage(0)
      setStatus('질문이 등록되었습니다. 모든 방문자가 볼 수 있습니다.')
      closeForm(); refresh()
    } catch (cause) { setError(qnaError(cause)) }
    finally { submitting.current = false; setSaving(false) }
  }

  return <Section id="qna" className="qna" eyebrow="QUESTIONS & ANSWERS" title="질문과 답변" action={
    <button ref={writeButton} type="button" className="button button--primary" aria-expanded={writing} aria-controls="qna-write-form" disabled={saving}
      onClick={() => { if (writing) closeForm(); else { setWriting(true); setStatus('') } }}>
      {t('질문 작성하기')} <span aria-hidden="true">↗</span>
    </button>
  }>
    <p id="qna-public-notice" className="qna__notice">{t('작성한 질문과 답변은 모든 방문자에게 공개됩니다. 개인정보는 적지 마세요.')}</p>
    <p className="qna__preview-note">{t('누구나 질문할 수 있으며, ARION 운영진이 답변합니다.')}</p>
    {writing && <form id="qna-write-form" className="qna__form" aria-label={t('질문 작성하기')} aria-describedby="qna-public-notice" onSubmit={submit}>
      <div className="qna__field">
        <label className="qna__field-label" htmlFor="qna-nickname">{t('닉네임 (선택)')}</label>
        <input id="qna-nickname" className="qna__input" maxLength={40} autoComplete="nickname" placeholder={t('익명으로 표시됩니다')} disabled={saving}
          value={draft.nickname} onChange={event => setDraft({ ...draft, nickname: event.target.value })} />
      </div>
      <div className="qna__field qna__field--wide">
        <label className="qna__field-label" htmlFor="qna-title">{t('질문 제목')}</label>
        <input id="qna-title" className="qna__input" required maxLength={100} placeholder={t('궁금한 내용을 간단히 적어 주세요')} disabled={saving}
          value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} />
      </div>
      <div className="qna__field qna__field--wide">
        <label className="qna__field-label" htmlFor="qna-body">{t('질문 내용')}</label>
        <textarea id="qna-body" className="qna__textarea" required maxLength={2000} rows={6} placeholder={t('질문 내용을 적어 주세요')} disabled={saving}
          value={draft.body} onChange={event => setDraft({ ...draft, body: event.target.value })} />
      </div>
      {error && <p className="qna__status" role="alert">{t(error)}</p>}
      <div className="qna__form-actions">
        <button type="button" className="button" disabled={saving} onClick={closeForm}>{t('취소')}</button>
        <button type="submit" className="button button--primary" disabled={saving}>{t(saving ? '등록 중…' : '질문 등록')}</button>
      </div>
    </form>}
    <p className="qna__status" role="status" aria-live="polite">{t(status)}</p>
    <div className="qna__toolbar">
      <p className="qna__count">{!loading && !loadError && <><strong>{result.total}</strong> {t('개의 질문')}</>}</p>
      <form className="qna__search" role="search" aria-label={t('질문 검색')} onSubmit={event => { event.preventDefault(); setPage(0); setQuery(search.trim()); refresh() }}>
        <label className="sr-only" htmlFor="qna-search">{t('질문 검색')}</label>
        <input id="qna-search" className="qna__search-input" type="search" maxLength={100} placeholder={t('제목이나 내용으로 검색')} value={search}
          onChange={event => { setSearch(event.target.value); if (!event.target.value) { setQuery(''); setPage(0) } }} />
        <button type="submit" className="button">{t('검색')}</button>
      </form>
      <button type="button" className="button" onClick={refresh} disabled={loading}>{t('새로고침')}</button>
    </div>
    <div aria-busy={loading}>
      {loading && <p className="qna__status" role="status">{t('질문을 불러오는 중…')}</p>}
      {loadError && <div className="qna__empty" role="alert"><p>{t('질문을 불러오지 못했습니다. 다시 시도해 주세요.')}</p><button type="button" className="button" onClick={refresh}>{t('다시 시도')}</button></div>}
      {result.questions.length ? <ul className="qna__list">{result.questions.map(question =>
          <Question key={question.id} question={question} staff={staff} api={api} onChange={refresh} />
        )}</ul> : !loading && !loadError && <p className="qna__empty">{t(query ? '검색 결과가 없습니다.' : '아직 등록된 질문이 없습니다.')}</p>}
    </div>
    {!loading && !loadError && result.total > QNA_PAGE_SIZE && <nav className="qna__pagination" aria-label={t('질문 페이지')}>
      <button type="button" className="button" disabled={page === 0} onClick={() => setPage(value => value - 1)}>{t('이전')}</button>
      <span>{page + 1} / {Math.ceil(result.total / QNA_PAGE_SIZE)}</span>
      <button type="button" className="button" disabled={(page + 1) * QNA_PAGE_SIZE >= result.total} onClick={() => setPage(value => value + 1)}>{t('다음')}</button>
    </nav>}
    <StaffLogin api={api} staff={staff} />
  </Section>
}

function Question({ question: q, staff, api, onChange }: { question: PublicQuestion; staff: boolean; api: QnaApi; onChange: () => void }) {
  const { t, language } = useLanguage()
  const [answer, setAnswer] = useState(q.answer ?? '')
  const [editing, setEditing] = useState(false)
  const [confirmHide, setConfirmHide] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const pending = useRef(false)
  const date = (value: string) => new Intl.DateTimeFormat(language === 'ko' ? 'ko-KR' : 'en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value))
  async function mutate(action: 'answer' | 'hide') {
    if (pending.current) return
    if (action === 'answer' && (!answer.trim() || answer.trim().length > 4000)) { setError('답변은 1자 이상, 4,000자 이하로 작성해 주세요.'); return }
    pending.current = true; setBusy(true); setError('')
    try {
      if (action === 'answer') await api.answer(q.id, answer.trim())
      else await api.hide(q.id)
      setEditing(false); setConfirmHide(false); onChange()
    } catch (cause) { setError(qnaError(cause)) }
    finally { pending.current = false; setBusy(false) }
  }
  return <li><details className="qna__item">
    <summary>
      <span className="qna__item-meta"><span className="badge">{t(q.answer ? '답변 완료' : '답변 대기')}</span><span>{q.nickname || t('익명')}</span><time dateTime={q.created_at}>{date(q.created_at)}</time></span>
      <span className="qna__item-title">{q.title}</span>
    </summary>
    <div className="qna__item-body"><p>{q.body}</p></div>
    {q.answer && <div className="qna__answer"><div className="qna__item-meta"><strong>{t('ARION 운영진')}</strong>{q.answered_at && <time dateTime={q.answered_at}>{date(q.answered_at)}</time>}</div><p>{q.answer}</p></div>}
    {staff && <div className="qna__moderation">
      <div className="qna__staff-actions">
        <button type="button" className="button" disabled={busy} onClick={() => { if (!editing) setAnswer(q.answer ?? ''); setEditing(!editing); setError('') }}>{t(q.answer ? '답변 수정' : '답변 작성')}</button>
        <button type="button" className="button" disabled={busy} onClick={() => setConfirmHide(!confirmHide)}>{t('질문 숨기기')}</button>
      </div>
      {editing && <form className="qna__reply-form" onSubmit={event => { event.preventDefault(); void mutate('answer') }}>
        <label className="qna__field-label" htmlFor={`answer-${q.id}`}>{t('운영진 답변')}</label>
        <textarea id={`answer-${q.id}`} className="qna__textarea" required maxLength={4000} value={answer} disabled={busy} onChange={event => setAnswer(event.target.value)} />
        <button className="button button--primary" type="submit" disabled={busy}>{t(busy ? '저장 중…' : '답변 저장')}</button>
      </form>}
      {confirmHide && <div className="qna__hide-confirm"><p>{t('질문과 답변을 공개 목록에서 숨길까요?')}</p><button type="button" className="button" disabled={busy} onClick={() => setConfirmHide(false)}>{t('취소')}</button><button type="button" className="button" disabled={busy} onClick={() => void mutate('hide')}>{t('숨기기 확인')}</button></div>}
      {error && <p className="qna__status" role="alert">{t(error)}</p>}
    </div>}
  </details></li>
}

function StaffLogin({ api, staff }: { api: QnaApi; staff: boolean }) {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const pending = useRef(false)
  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending.current) return
    pending.current = true; setBusy(true); setError('')
    try { await api.signIn(email, password); setPassword('') }
    catch (cause) { setError(qnaError(cause)); setPassword('') }
    finally { pending.current = false; setBusy(false) }
  }
  async function signOut() {
    if (pending.current) return
    pending.current = true; setBusy(true); setError('')
    try { await api.signOut() } catch (cause) { setError(qnaError(cause)) }
    finally { pending.current = false; setBusy(false) }
  }
  return <div className="qna__staff-login">
    {staff ? <div className="qna__staff-actions"><span>{t('ARION 운영진으로 로그인했습니다.')}</span><button type="button" className="button" disabled={busy} onClick={() => void signOut()}>{t('로그아웃')}</button></div>
      : <details><summary>{t('운영진 로그인')}</summary><form className="qna__login-form" onSubmit={signIn}>
        <label className="qna__field" htmlFor="qna-email">{t('이메일')}<input id="qna-email" className="qna__input" type="email" required autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} disabled={busy} /></label>
        <label className="qna__field" htmlFor="qna-password">{t('비밀번호')}<input id="qna-password" className="qna__input" type="password" required autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} disabled={busy} /></label>
        <button className="button" type="submit" disabled={busy}>{t(busy ? '로그인 중…' : '로그인')}</button>
      </form></details>}
    {error && <p className="qna__status" role="alert">{t(error)}</p>}
  </div>
}
