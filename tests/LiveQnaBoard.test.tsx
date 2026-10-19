// @vitest-environment jsdom
import { act } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import QnaAdminBoard from '../src/components/QnaAdminBoard'
import { site } from '../src/content/site'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import LiveQnaBoard from '../src/components/LiveQnaBoard'
import LanguageProvider from '../src/components/LanguageProvider'
import type { PublicQuestion, QnaApi, QuestionPage } from '../src/lib/qna'

let container: HTMLDivElement
let root: ReturnType<typeof createRoot>
let api: QnaApi
const question: PublicQuestion = { id: 'test-question', nickname: '방문자', title: '활동 질문', body: '가입은 어떻게 하나요?', created_at: '2026-10-19T00:00:00Z', answer: '운영진 답변', answered_at: '2026-10-19T00:00:00Z' }
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  localStorage.clear()
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
  api = {
    list: vi.fn().mockResolvedValue({ questions: [question], total: 1 }), staffList: vi.fn().mockRejectedValue(new Error('QNA_FORBIDDEN')),
    submit: vi.fn().mockResolvedValue(question.id), answer: vi.fn().mockResolvedValue(undefined), hide: vi.fn().mockResolvedValue(undefined),
    signIn: vi.fn().mockResolvedValue(undefined), signOut: vi.fn().mockResolvedValue(undefined),
    watchStaff: listener => { listener(false); return () => {} },
  }
})
afterEach(() => { act(() => root.unmount()); container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals() })
async function mount() { await act(async () => root.render(<MemoryRouter><LanguageProvider><Routes><Route path="/" element={<LiveQnaBoard api={api} />} /><Route path="/qna/admin" element={<QnaAdminBoard api={api} />} /></Routes></LanguageProvider></MemoryRouter>)) }
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
  expect(api.submit).toHaveBeenCalledWith({ name: '', phone: '', email: '', title: '공개 질문', body: '질문 내용' }, expect.any(String))
  expect(container.textContent).toContain('질문이 접수되었습니다.')
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
it('accepts optional private contact details without adding them to the public list', async () => {
  await mount(); await click('질문 작성하기')
  fill('#qna-name', '비공개 이름'); fill('#qna-phone', '010-0000-0000'); fill('#qna-contact-email', 'private@example.test')
  fill('#qna-title', '공개 가능 질문'); fill('#qna-body', '내용'); await submit()
  expect(api.submit).toHaveBeenCalledWith({ name: '비공개 이름', phone: '010-0000-0000', email: 'private@example.test', title: '공개 가능 질문', body: '내용' }, expect.any(String))
  expect(container.textContent).not.toContain('private@example.test')
  expect(container.textContent).toContain('운영진이 답변한 뒤')
})
it('uses the requested shortcut only to navigate, without granting staff access or submitting a question', async () => {
  await mount(); await click('질문 작성하기')
  const leader = site.contact.leaders.find(person => person.name === '정우진')!
  fill('#qna-name', leader.name); fill('#qna-phone', leader.phone.replaceAll('-', '')); fill('#qna-contact-email', 'arion2026')
  await submit()
  expect(container.textContent).toContain('Q&A 관리')
  expect(container.querySelector('#qna-password')).not.toBeNull()
  expect(api.submit).not.toHaveBeenCalled()
  expect(api.signIn).not.toHaveBeenCalled()
  expect(api.staffList).not.toHaveBeenCalled()
})
it('rejects invalid ordinary email addresses and never treats the shortcut as an email login', async () => {
  await mount(); await click('질문 작성하기')
  fill('#qna-title', '제목'); fill('#qna-body', '내용'); fill('#qna-contact-email', 'arion2026'); await submit()
  expect(api.submit).not.toHaveBeenCalled()
  expect(api.signIn).not.toHaveBeenCalled()
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('이메일 형식')
})
it('shows the moderated publication policy in English', async () => {
  localStorage.setItem('arion-language', 'en'); await mount()
  expect(container.textContent).toContain('Questions are published only after')
})
