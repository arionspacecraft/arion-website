import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import Section from './Section'
import { Link } from 'react-router-dom'
import { useLanguage } from '../lib/language'
import { readPreviewQuestions, savePreviewQuestions } from '../lib/qnaPreview'
import type { PreviewQuestion } from '../lib/qnaPreview'

type Props = { preview?: boolean }
type Draft = { nickname: string; title: string; body: string }
const emptyDraft: Draft = { nickname: '', title: '', body: '' }
const notice = '작성한 질문과 답변은 모든 방문자에게 공개됩니다. 개인정보는 적지 마세요.'

export default function QnaBoard({ preview = import.meta.env.DEV }: Props) {
  const { t, language } = useLanguage()
  const [questions, setQuestions] = useState<PreviewQuestion[]>(() => preview ? readPreviewQuestions() : [])
  const [isWriting, setIsWriting] = useState(false)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const writeButton = useRef<HTMLButtonElement>(null)
  const titleInput = useRef<HTMLInputElement>(null)
  const bodyInput = useRef<HTMLTextAreaElement>(null)
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const visibleQuestions = (preview ? questions : []).filter(question =>
    (question.title + ' ' + question.body).toLocaleLowerCase().includes(normalizedQuery),
  )

  function closeForm() {
    setIsWriting(false)
    setError('')
    writeButton.current?.focus()
  }

  function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!preview) return
    const nextDraft = {
      nickname: draft.nickname.trim(),
      title: draft.title.trim(),
      body: draft.body.trim(),
    }
    if (!nextDraft.title || !nextDraft.body) {
      setError('제목과 내용을 입력해 주세요. 공백만으로는 저장할 수 없습니다.')
      if (!nextDraft.title) titleInput.current?.focus()
      else bodyInput.current?.focus()
      return
    }
    if (nextDraft.nickname.length > 40 || nextDraft.title.length > 100 || nextDraft.body.length > 2000) {
      setError('입력 길이를 확인해 주세요. 제목은 100자, 내용은 2,000자까지 작성할 수 있습니다.')
      return
    }
    const question: PreviewQuestion = {
      ...nextDraft,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    const nextQuestions = [question, ...questions]
    if (!savePreviewQuestions(nextQuestions)) {
      setError('저장하지 못했습니다. 브라우저 저장 공간을 확인하고 다시 시도해 주세요.')
      return
    }
    setQuestions(nextQuestions)
    setDraft(emptyDraft)
    setSearch('')
    setQuery('')
    setStatus('이 브라우저에 미리보기를 저장했습니다. 다른 방문자에게는 보이지 않습니다.')
    closeForm()
  }

  return (
    <Section
      id="qna"
      className="qna"
      eyebrow="QUESTIONS & ANSWERS"
      title="질문과 답변"
      action={preview ? (
        <button
          ref={writeButton}
          type="button"
          className="button button--primary"
          aria-expanded={isWriting}
          aria-controls="qna-write-form"
          onClick={() => {
            if (isWriting) closeForm()
            else { setIsWriting(true); setStatus('') }
          }}
        >
          {t('질문 작성하기')} <span aria-hidden="true">↗</span>
        </button>
      ) : undefined}
    >
      <p id="qna-public-notice" className="qna__notice">{t(notice)}</p>
      {preview ? (
        <p id="qna-preview-note" className="qna__preview-note">{t('로컬 미리보기 · 작성한 질문은 이 브라우저에만 저장됩니다.')}</p>
      ) : (
        <p className="qna__preview-note">
          {t('질문 등록을 준비하고 있습니다. 직접 문의를 이용해 주세요.')}{' '}
          <Link to="/contact">{t('직접 문의하기')}</Link>
        </p>
      )}

      {preview && isWriting && (
        <form
          id="qna-write-form"
          className="qna__form"
          aria-label={t('질문 작성하기')}
          aria-describedby="qna-public-notice qna-preview-note"
          onSubmit={submitQuestion}
        >
          <div className="qna__field">
            <label className="qna__field-label" htmlFor="qna-nickname">{t('닉네임 (선택)')}</label>
            <input
              id="qna-nickname"
              className="qna__input"
              name="nickname"
              maxLength={40}
              autoComplete="nickname"
              placeholder={t('익명으로 표시됩니다')}
              value={draft.nickname}
              onChange={event => setDraft({ ...draft, nickname: event.target.value })}
            />
          </div>
          <div className="qna__field qna__field--wide">
            <label className="qna__field-label" htmlFor="qna-title">{t('질문 제목')}</label>
            <input
              ref={titleInput}
              id="qna-title"
              className="qna__input"
              name="title"
              required
              maxLength={100}
              placeholder={t('궁금한 내용을 간단히 적어 주세요')}
              value={draft.title}
              onChange={event => setDraft({ ...draft, title: event.target.value })}
            />
          </div>
          <div className="qna__field qna__field--wide">
            <label className="qna__field-label" htmlFor="qna-body">{t('질문 내용')}</label>
            <textarea
              ref={bodyInput}
              id="qna-body"
              className="qna__textarea"
              name="body"
              required
              maxLength={2000}
              rows={6}
              placeholder={t('질문 내용을 적어 주세요')}
              value={draft.body}
              onChange={event => setDraft({ ...draft, body: event.target.value })}
            />
          </div>
          {error && <p className="qna__status qna__field--wide" role="alert">{t(error)}</p>}
          <div className="qna__form-actions qna__field--wide">
            <button type="button" className="button" onClick={closeForm}>{t('취소')}</button>
            <button type="submit" className="button button--primary">{t('미리보기 저장')}</button>
          </div>
        </form>
      )}
      <p className="qna__status" role="status" aria-live="polite">{t(status)}</p>

      <div className="qna__toolbar">
        <p className="qna__count"><strong>{visibleQuestions.length}</strong> {t('개의 질문')}</p>
        <form className="qna__search" role="search" aria-label={t('질문 검색')} onSubmit={event => { event.preventDefault(); setQuery(search) }}>
          <label className="sr-only" htmlFor="qna-search">{t('질문 검색')}</label>
          <input
            id="qna-search"
            className="qna__search-input"
            type="search"
            value={search}
            placeholder={t('제목이나 내용으로 검색')}
            onChange={event => {
              setSearch(event.target.value)
              if (!event.target.value) setQuery('')
            }}
          />
          <button type="submit" className="button">{t('검색')}</button>
        </form>
      </div>

      {visibleQuestions.length > 0 ? (
        <ul className="qna__list">
          {visibleQuestions.map(question => (
            <li key={question.id}>
              <details className="qna__item">
                <summary>
                  <span className="qna__item-meta">
                    <span className="badge">{t('답변 대기')}</span>
                    <span>{question.nickname || t('익명')}</span>
                    <time dateTime={question.createdAt}>{new Intl.DateTimeFormat(language === 'ko' ? 'ko-KR' : 'en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(question.createdAt))}</time>
                  </span>
                  <span className="qna__item-title">{question.title}</span>
                </summary>
                <div className="qna__item-body"><p>{question.body}</p></div>
              </details>
            </li>
          ))}
        </ul>
      ) : <p className="qna__empty">{t(normalizedQuery ? '검색 결과가 없습니다.' : '아직 등록된 질문이 없습니다.')}</p>}
    </Section>
  )
}
