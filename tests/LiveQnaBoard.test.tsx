// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import LiveQnaBoard from '../src/components/LiveQnaBoard'
import LanguageProvider from '../src/components/LanguageProvider'
import type { PublicQuestion, QnaApi, QuestionPage } from '../src/lib/qna'

let container: HTMLDivElement
let root: ReturnType<typeof createRoot>
let api: QnaApi
let staffChanged: (staff: boolean) => void
const question: PublicQuestion = { id: 'test-question', nickname: '방문자', title: '활동 질문', body: '가입은 어떻게 하나요?', created_at: '2026-10-19T00:00:00Z', answer: null, answered_at: null }
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  localStorage.clear()
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
  api = {
    list: vi.fn().mockResolvedValue({ questions: [question], total: 1 }),
    submit: vi.fn().mockResolvedValue(question.id), answer: vi.fn().mockResolvedValue(undefined), hide: vi.fn().mockResolvedValue(undefined),
    signIn: vi.fn().mockResolvedValue(undefined), signOut: vi.fn().mockResolvedValue(undefined),
    watchStaff: listener => { staffChanged = listener; listener(false); return () => {} },
  }
})
afterEach(() => { act(() => root.unmount()); container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals() })
async function mount() { await act(async () => root.render(<LanguageProvider><LiveQnaBoard api={api} /></LanguageProvider>)) }
function button(text: string) { return [...container.querySelectorAll<HTMLButtonElement>('button')].find(item => item.textContent?.includes(text))! }
async function click(text: string) { await act(async () => button(text).click()) }
function fill(selector: string, value: string) {
  const input = container.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)!
  act(() => {
    Object.getOwnPropertyDescriptor(input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value')!.set!.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}
async function submit(selector = '#qna-write-form') {
  await act(async () => container.querySelector(selector)!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
}

it('publishes through the server, trims content and never copies local preview records', async () => {
  localStorage.setItem('arion-qna-preview-v1', JSON.stringify([{ title: 'private draft' }]))
  await mount(); await click('질문 작성하기')
  fill('#qna-title', '  공개 질문  '); fill('#qna-body', '  질문 내용  ')
  await submit()
  expect(api.submit).toHaveBeenCalledWith({ nickname: '', title: '공개 질문', body: '질문 내용' }, expect.any(String))
  expect(container.textContent).toContain('질문이 등록되었습니다.')
  expect(container.textContent).not.toContain('private draft')
  expect(localStorage.getItem('arion-qna-preview-v1')).toContain('private draft')
  expect(container.querySelector('#qna-write-form')).toBeNull()
})
it('keeps failed drafts, reuses retry identity and prevents double submission while awaiting a response', async () => {
  let reject: (error: Error) => void
  vi.mocked(api.submit).mockImplementationOnce(() => new Promise((_resolve, rejectPromise) => { reject = rejectPromise }))
  await mount(); await click('질문 작성하기')
  fill('#qna-title', '질문'); fill('#qna-body', '내용')
  await submit(); await submit()
  expect(api.submit).toHaveBeenCalledTimes(1)
  await act(async () => reject(new Error('offline')))
  expect(container.querySelector<HTMLInputElement>('#qna-title')?.value).toBe('질문')
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('작성 내용은 유지됩니다.')
  const requestId = vi.mocked(api.submit).mock.calls[0][1]
  await submit()
  expect(vi.mocked(api.submit).mock.calls[1][1]).toBe(requestId)
})
it('rejects whitespace-only questions before creating an anonymous session', async () => {
  await mount(); await click('질문 작성하기')
  fill('#qna-title', '   '); fill('#qna-body', '내용'); await submit()
  expect(api.submit).not.toHaveBeenCalled()
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('공백만으로는')
})
it('distinguishes loading failure from an empty board and supports retry', async () => {
  vi.mocked(api.list).mockRejectedValueOnce(new Error('offline'))
  await mount()
  expect(container.textContent).not.toContain('아직 등록된 질문이 없습니다.')
  expect(container.textContent).toContain('불러오지 못했습니다.')
  await click('다시 시도')
  expect(container.textContent).toContain(question.title)
})
it('ignores stale searches and requests a new page from the server', async () => {
  await mount()
  let resolve: (value: QuestionPage) => void
  vi.mocked(api.list).mockImplementationOnce(() => new Promise(done => { resolve = done }))
  fill('#qna-search', 'old'); await submit('[role="search"]')
  fill('#qna-search', 'new')
  vi.mocked(api.list).mockResolvedValue({ questions: [{ ...question, title: 'new result' }], total: 21 })
  await submit('[role="search"]')
  await act(async () => resolve({ questions: [{ ...question, title: 'stale result' }], total: 1 }))
  expect(container.textContent).toContain('new result')
  expect(container.textContent).not.toContain('stale result')
  await click('다음')
  expect(api.list).toHaveBeenLastCalledWith('new', 1)
})
it('only shows answer controls after verified staff status and preserves failed answer drafts', async () => {
  await mount()
  expect(button('답변 작성')).toBeUndefined()
  await act(async () => staffChanged(true)); await click('답변 작성')
  fill(`#answer-${question.id}`, '  답변 초안  ')
  vi.mocked(api.answer).mockRejectedValueOnce(new Error('QNA_FORBIDDEN'))
  await submit('.qna__reply-form')
  expect(container.querySelector<HTMLTextAreaElement>(`#answer-${question.id}`)?.value).toBe('  답변 초안  ')
  expect(container.textContent).toContain('답변 권한이 없습니다.')
  await submit('.qna__reply-form')
  expect(api.answer).toHaveBeenLastCalledWith(question.id, '답변 초안')
  await act(async () => staffChanged(false))
  expect(button('답변 작성')).toBeUndefined()
})
it('requires explicit confirmation before hiding and renders answers as plain text', async () => {
  vi.mocked(api.list).mockResolvedValue({ questions: [{ ...question, answer: '<script>bad()</script>', answered_at: question.created_at }], total: 1 })
  await mount(); await act(async () => staffChanged(true))
  expect(container.querySelector('script')).toBeNull()
  expect(container.textContent).toContain('<script>bad()</script>')
  await click('질문 숨기기')
  expect(api.hide).not.toHaveBeenCalled()
  await click('숨기기 확인')
  expect(api.hide).toHaveBeenCalledWith(question.id)
})
it('keeps an active answer draft through refresh, then starts a new edit from the latest server answer', async () => {
  await mount(); await act(async () => staffChanged(true)); await click('답변 작성')
  fill(`#answer-${question.id}`, '작성 중 초안')
  vi.mocked(api.list).mockResolvedValue({ questions: [{ ...question, answer: '서버의 최신 답변', answered_at: question.created_at }], total: 1 })
  await click('새로고침')
  expect(container.querySelector<HTMLTextAreaElement>(`#answer-${question.id}`)?.value).toBe('작성 중 초안')
  await click('답변 수정'); await click('답변 수정')
  expect(container.querySelector<HTMLTextAreaElement>(`#answer-${question.id}`)?.value).toBe('서버의 최신 답변')
})
it('translates live actions to English and clears passwords after failed sign-in', async () => {
  localStorage.setItem('arion-language', 'en')
  await mount()
  expect(container.textContent).toContain('Anyone can ask a question.')
  fill('#qna-email', 'staff@example.test'); fill('#qna-password', 'do-not-store')
  vi.mocked(api.signIn).mockRejectedValueOnce(new Error('QNA_FORBIDDEN'))
  await submit('.qna__login-form')
  expect(container.querySelector<HTMLInputElement>('#qna-password')?.value).toBe('')
  expect(container.textContent).toContain('authorized ARION team account')
})
