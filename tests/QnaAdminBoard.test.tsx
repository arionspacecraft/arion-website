// @vitest-environment jsdom
import { act } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import QnaAdminBoard from '../src/components/QnaAdminBoard'
import LanguageProvider from '../src/components/LanguageProvider'
import type { AdminQuestion, QnaApi } from '../src/lib/qna'

let container: HTMLDivElement
let root: ReturnType<typeof createRoot>
let api: QnaApi
let staffChanged: (staff: boolean) => void
const question: AdminQuestion = { id: 'private-question', name: '비공개 이름', phone: '010-0000-0000', email: 'private@example.test', nickname: '', title: '활동 질문', body: '가입은 어떻게 하나요?', original_title: '활동 질문', original_body: '가입은 어떻게 하나요?', created_at: '2026-10-19T00:00:00Z', answer: null, answered_at: null, hidden: false }
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  localStorage.clear()
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
  api = {
    list: vi.fn().mockResolvedValue({ questions: [], total: 0 }),
    staffList: vi.fn().mockResolvedValue({ questions: [question], total: 1 }),
    submit: vi.fn(), answer: vi.fn().mockResolvedValue(undefined), hide: vi.fn().mockResolvedValue(undefined),
    signIn: vi.fn().mockResolvedValue(undefined), signOut: vi.fn().mockResolvedValue(undefined),
    watchStaff: listener => { staffChanged = listener; listener(false); return () => {} },
  }
})
afterEach(() => { act(() => root.unmount()); container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals() })
async function mount() { await act(async () => root.render(<MemoryRouter><LanguageProvider><QnaAdminBoard api={api} /></LanguageProvider></MemoryRouter>)) }
function button(text: string) { return [...container.querySelectorAll<HTMLButtonElement>('button')].find(item => item.textContent?.includes(text))! }
async function click(text: string) { await act(async () => button(text).click()) }
function fill(selector: string, value: string) {
  const input = container.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)!
  act(() => {
    Object.getOwnPropertyDescriptor(input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value')!.set!.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}
async function submit(selector: string) { await act(async () => container.querySelector(selector)!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))) }
async function authorize() { await act(async () => staffChanged(true)) }
async function approveText() { await act(async () => container.querySelector<HTMLInputElement>('[type="checkbox"]')!.click()) }

it('requires a verified staff session and directs visitors to Q&A without a separate login form', async () => {
  await mount()
  expect(api.staffList).not.toHaveBeenCalled()
  expect(container.textContent).not.toContain(question.email)
  expect(container.querySelector('form')).toBeNull()
  expect(container.querySelector('a[href="/qna"]')).not.toBeNull()
  expect(container.textContent).toContain('Q&A의 질문 작성란에서 인증해 주세요.')
  expect(api.signIn).not.toHaveBeenCalled()
})
it('shows private details only after authorization and publishes the reviewed copy with an answer', async () => {
  await mount(); await authorize()
  expect(container.textContent).toContain(question.email)
  await click('답변 작성')
  fill(`#public-title-${question.id}`, '공개 제목'); fill(`#public-body-${question.id}`, '개인정보를 뺀 질문'); fill(`#answer-${question.id}`, '  운영진 답변  ')
  await submit('.qna__reply-form')
  expect(api.answer).not.toHaveBeenCalled()
  await approveText(); await submit('.qna__reply-form')
  expect(api.answer).toHaveBeenCalledWith(question.id, '운영진 답변', '공개 제목', '개인정보를 뺀 질문')
})
it('keeps a rejected answer draft and resets publication confirmation when text changes', async () => {
  await mount(); await authorize(); await click('답변 작성')
  fill(`#answer-${question.id}`, '답변 초안'); await approveText()
  vi.mocked(api.answer).mockRejectedValueOnce(new Error('offline'))
  await submit('.qna__reply-form')
  expect(container.querySelector<HTMLTextAreaElement>(`#answer-${question.id}`)?.value).toBe('답변 초안')
  fill(`#answer-${question.id}`, '변경된 답변')
  expect(container.querySelector<HTMLInputElement>('[type="checkbox"]')?.checked).toBe(false)
})
it('clears private data immediately when auth is lost, and ignores late protected responses', async () => {
  await mount(); await authorize()
  expect(container.textContent).toContain(question.email)
  let resolve: (data: { questions: AdminQuestion[]; total: number }) => void
  vi.mocked(api.staffList).mockImplementationOnce(() => new Promise(done => { resolve = done }))
  await click('새로고침')
  await act(async () => staffChanged(false))
  await act(async () => resolve({ questions: [question], total: 1 }))
  expect(container.textContent).not.toContain(question.email)
  expect(container.textContent).not.toContain(question.original_body)
})
it('clears cached private data when a refreshed server permission check fails', async () => {
  await mount(); await authorize()
  vi.mocked(api.staffList).mockRejectedValueOnce(new Error('QNA_FORBIDDEN'))
  await click('새로고침')
  expect(container.textContent).not.toContain(question.email)
  expect(container.textContent).toContain('답변 권한이 없습니다.')
})
it('requires confirmation to hide and keeps active answer drafts through list refreshes', async () => {
  await mount(); await authorize(); await click('답변 작성')
  fill(`#answer-${question.id}`, '작성 중 초안'); await click('새로고침')
  expect(container.querySelector<HTMLTextAreaElement>(`#answer-${question.id}`)?.value).toBe('작성 중 초안')
  await click('질문 숨기기')
  expect(api.hide).not.toHaveBeenCalled()
  await click('숨기기 확인')
  expect(api.hide).toHaveBeenCalledWith(question.id)
})
it('starts a fresh edit from the latest server copy, translates the UI and keeps all input as plain text', async () => {
  localStorage.setItem('arion-language', 'en')
  vi.mocked(api.staffList).mockResolvedValue({ questions: [{ ...question, answer: '<script>bad()</script>', answered_at: question.created_at, email: '<img src=x>' }], total: 1 })
  await mount(); await authorize(); await click('Edit answer')
  expect(container.querySelector<HTMLTextAreaElement>(`#answer-${question.id}`)?.value).toBe('<script>bad()</script>')
  expect(container.querySelector('script, img')).toBeNull()
  expect(container.textContent).toContain('Team only')
})
