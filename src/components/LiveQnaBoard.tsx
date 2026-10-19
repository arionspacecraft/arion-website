import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Section from './Section'
import { useLanguage } from '../lib/language'
import { QNA_PAGE_SIZE, QNA_STAFF_EMAIL, isStaffIdentity, qnaError } from '../lib/qna'
import type { PublicQuestion, QnaApi, QuestionDraft, QuestionPage } from '../lib/qna'

const emptyDraft: QuestionDraft = { name: '', phone: '', email: '', title: '', body: '' }

export default function LiveQnaBoard({ api }: { api: QnaApi }) {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [result, setResult] = useState<QuestionPage>({ questions: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [revision, setRevision] = useState(0)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [writing, setWriting] = useState(false)
  const [draft, setDraft] = useState<QuestionDraft>(emptyDraft)
  // Keep credentials out of the question draft, retry fingerprint and contact payload.
  const [password, setPassword] = useState('')
  const staffEntry = isStaffIdentity(draft)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const writeButton = useRef<HTMLButtonElement>(null)
  const request = useRef<{ id: string; draft: string } | null>(null)
  const submitting = useRef(false)

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
  function closeForm() { setWriting(false); setPassword(''); setError(''); writeButton.current?.focus() }
  function changeIdentity(field: 'name' | 'phone', value: string) {
    setPassword(''); setError(''); setDraft({ ...draft, [field]: value })
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current) return
    if (staffEntry) {
      if (!password) { setError('운영진 비밀번호를 입력해 주세요.'); return }
      submitting.current = true
      setSaving(true); setError(''); setStatus(''); setPassword('')
      try {
        await api.signIn(QNA_STAFF_EMAIL, password)
        setDraft(emptyDraft); request.current = null
        navigate('/qna/admin')
      } catch {
        setError('운영진 인증에 실패했습니다. 비밀번호와 연결 상태를 확인한 뒤 다시 시도해 주세요.')
      } finally { submitting.current = false; setSaving(false) }
      return
    }
    const clean = { name: draft.name.trim(), phone: draft.phone.trim(), email: draft.email.trim(), title: draft.title.trim(), body: draft.body.trim() }
    if (!clean.title || !clean.body) { setError('제목과 내용을 입력해 주세요. 공백만으로는 저장할 수 없습니다.'); return }
    if (clean.title.length > 100 || clean.body.length > 2000) {
      setError('입력 길이를 확인해 주세요. 제목은 100자, 내용은 2,000자까지 작성할 수 있습니다.'); return
    }
    if (clean.name.length > 80 || (clean.phone && !/^[0-9+() .-]{7,30}$/.test(clean.phone)) || clean.email.length > 254 || (clean.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email))) {
      setError('이름·전화번호·이메일 형식을 확인해 주세요. 연락처는 비워도 됩니다.'); return
    }
    const fingerprint = JSON.stringify(clean)
    if (!request.current || request.current.draft !== fingerprint) request.current = { id: crypto.randomUUID(), draft: fingerprint }
    submitting.current = true
    setSaving(true); setError(''); setStatus('')
    try {
      await api.submit(clean, request.current.id)
      request.current = null
      setDraft(emptyDraft); setSearch(''); setQuery(''); setPage(0)
      setStatus('질문이 접수되었습니다. 운영진이 답변한 뒤 질문과 답변이 공개됩니다.')
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
    <p id="qna-public-notice" className="qna__notice">{t('질문은 운영진이 답변한 뒤 공개됩니다. 질문 제목과 내용에는 개인정보를 적지 마세요.')}</p>
    <p id="qna-contact-notice" className="qna__preview-note">{t('이름·전화번호·이메일은 선택 사항이며 문의 확인을 위해 운영진만 열람합니다. 공개 게시글에는 표시되지 않습니다.')}</p>
    {writing && <form id="qna-write-form" className="qna__form" noValidate aria-label={t('질문 작성하기')} aria-describedby="qna-public-notice qna-contact-notice" onSubmit={submit}>
      <div className="qna__field">
        <label className="qna__field-label" htmlFor="qna-name">{t('이름 (선택)')}</label>
        <input id="qna-name" className="qna__input" maxLength={80} autoComplete="name" disabled={saving}
          value={draft.name} onChange={event => changeIdentity('name', event.target.value)} />
      </div>
      <div className="qna__field">
        <label className="qna__field-label" htmlFor="qna-phone">{t('전화번호 (선택)')}</label>
        <input id="qna-phone" className="qna__input" type="tel" maxLength={30} autoComplete="tel" disabled={saving}
          value={draft.phone} onChange={event => changeIdentity('phone', event.target.value)} />
      </div>
      {staffEntry ? <div key="staff-password" className="qna__field qna__field--wide">
        <label className="qna__field-label" htmlFor="qna-entry-password">{t('운영진 비밀번호')}</label>
        <input id="qna-entry-password" className="qna__input" type="password" required autoComplete="current-password" disabled={saving}
          aria-describedby="qna-entry-notice" value={password} onChange={event => setPassword(event.target.value)} />
        <p id="qna-entry-notice" className="qna__preview-note" role="status">{t('설정한 운영진 비밀번호를 입력하면 관리 화면으로 이동합니다.')}</p>
      </div> : <div key="contact-email" className="qna__field qna__field--wide">
        <label className="qna__field-label" htmlFor="qna-contact-email">{t('이메일 (선택)')}</label>
        <input id="qna-contact-email" className="qna__input" type="email" inputMode="email" maxLength={254} autoComplete="email" disabled={saving}
          value={draft.email} onChange={event => setDraft({ ...draft, email: event.target.value })} />
      </div>}
      {!staffEntry && <>
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
      </>}
      {error && <p className="qna__status" role="alert">{t(error)}</p>}
      <div className="qna__form-actions">
        <button type="button" className="button" disabled={saving} onClick={closeForm}>{t('취소')}</button>
        <button type="submit" className="button button--primary" disabled={saving}>{t(staffEntry ? (saving ? '로그인 중…' : '관리 화면으로') : (saving ? '등록 중…' : '질문 등록'))}</button>
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
          <Question key={question.id} question={question} />
        )}</ul> : !loading && !loadError && <p className="qna__empty">{t(query ? '검색 결과가 없습니다.' : '아직 공개된 질문이 없습니다.')}</p>}
    </div>
    {!loading && !loadError && result.total > QNA_PAGE_SIZE && <nav className="qna__pagination" aria-label={t('질문 페이지')}>
      <button type="button" className="button" disabled={page === 0} onClick={() => setPage(value => value - 1)}>{t('이전')}</button>
      <span>{page + 1} / {Math.ceil(result.total / QNA_PAGE_SIZE)}</span>
      <button type="button" className="button" disabled={(page + 1) * QNA_PAGE_SIZE >= result.total} onClick={() => setPage(value => value + 1)}>{t('다음')}</button>
    </nav>}
  </Section>
}

function Question({ question: q }: { question: PublicQuestion }) {
  const { t, language } = useLanguage()
  const date = (value: string) => new Intl.DateTimeFormat(language === 'ko' ? 'ko-KR' : 'en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value))
  return <li><details className="qna__item">
    <summary><span className="qna__item-meta"><span className="badge">{t('답변 완료')}</span><span>{t('익명')}</span><time dateTime={q.created_at}>{date(q.created_at)}</time></span><span className="qna__item-title">{q.title}</span></summary>
    <div className="qna__item-body"><p>{q.body}</p></div>
    <div className="qna__answer"><div className="qna__item-meta"><strong>{t('ARION 운영진')}</strong>{q.answered_at && <time dateTime={q.answered_at}>{date(q.answered_at)}</time>}</div><p>{q.answer}</p></div>
  </details></li>
}
