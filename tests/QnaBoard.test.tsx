// @vitest-environment jsdom
import { act } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import QnaBoard from '../src/components/QnaBoard'
import LanguageProvider from '../src/components/LanguageProvider'
import { QNA_PREVIEW_STORAGE_KEY } from '../src/lib/qnaPreview'

let container: HTMLDivElement
let root: ReturnType<typeof createRoot>

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  localStorage.clear()
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function mount(preview = true) {
  act(() => root.render(<MemoryRouter><LanguageProvider><QnaBoard preview={preview} /></LanguageProvider></MemoryRouter>))
}

function button(label: string) {
  return [...container.querySelectorAll<HTMLButtonElement>('button')].find(item => item.textContent?.includes(label))!
}

function fill(selector: string, value: string) {
  const input = container.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)!
  const prototype = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  act(() => {
    Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

function submit() {
  act(() => container.querySelector<HTMLFormElement>('#qna-write-form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
}

it('saves only to the local preview, restores questions, searches body text, and keeps a cancelled draft', () => {
  mount()
  expect(container.querySelector('.qna__empty')?.textContent).toContain('아직 등록된 질문이 없습니다.')
  act(() => button('질문 작성하기').click())
  expect(container.querySelector('form')?.getAttribute('aria-describedby')).toBe('qna-public-notice qna-preview-note')
  fill('#qna-title', '  로켓 제작  ')
  fill('#qna-body', '  동체 설계를 배울 수 있나요?  ')
  act(() => button('취소').click())
  expect(container.querySelector('#qna-write-form')).toBeNull()
  expect(document.activeElement).toBe(button('질문 작성하기'))
  act(() => button('질문 작성하기').click())
  expect(container.querySelector<HTMLInputElement>('#qna-title')?.value).toBe('  로켓 제작  ')
  submit()
  expect(container.querySelector('#qna-write-form')).toBeNull()
  expect(container.querySelector('[role="status"]')?.textContent).toContain('다른 방문자에게는 보이지 않습니다.')
  const saved = JSON.parse(localStorage.getItem(QNA_PREVIEW_STORAGE_KEY)!)
  expect(saved).toHaveLength(1)
  expect(saved[0]).toMatchObject({ title: '로켓 제작', body: '동체 설계를 배울 수 있나요?', nickname: '' })
  expect(container.querySelector('.qna__item')?.textContent).toContain('익명')

  act(() => root.render(null))
  mount()
  expect(container.querySelector('.qna__item-title')?.textContent).toBe('로켓 제작')
  fill('#qna-search', '동체')
  act(() => button('검색').click())
  expect(container.querySelector('.qna__count')?.textContent).toContain('1')
  fill('#qna-search', '없는 검색어')
  act(() => button('검색').click())
  expect(container.querySelector('.qna__empty')?.textContent).toBe('검색 결과가 없습니다.')
  fill('#qna-search', '')
  expect(container.querySelector('.qna__item-title')?.textContent).toBe('로켓 제작')
})

it('rejects whitespace-only content and keeps the form open without storing a question', () => {
  mount()
  act(() => button('질문 작성하기').click())
  fill('#qna-title', '   ')
  fill('#qna-body', '내용')
  submit()
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('제목과 내용을')
  expect(document.activeElement).toBe(container.querySelector('#qna-title'))
  expect(localStorage.getItem(QNA_PREVIEW_STORAGE_KEY)).toBeNull()
  expect(container.querySelector('#qna-write-form')).not.toBeNull()
})

it('keeps the draft and reports a failed save when storage is unavailable', () => {
  mount()
  act(() => button('질문 작성하기').click())
  fill('#qna-title', '질문')
  fill('#qna-body', '질문 내용')
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
  submit()
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('저장하지 못했습니다.')
  expect(container.querySelector<HTMLInputElement>('#qna-title')?.value).toBe('질문')
  expect(container.querySelector('.qna__item')).toBeNull()
  expect(container.querySelector('[role="status"]')?.textContent).toBe('')
})

it.each(['{broken', '{"title":"not an array"}', '[{"id":"bad","title":"bad"}]'])('ignores malformed preview storage: %s', stored => {
  localStorage.setItem(QNA_PREVIEW_STORAGE_KEY, stored)
  mount()
  expect(container.querySelector('.qna__item')).toBeNull()
  expect(container.querySelector('.qna__empty')).not.toBeNull()
})

it('does not read or expose saved previews or allow writing in production mode', () => {
  localStorage.setItem(QNA_PREVIEW_STORAGE_KEY, JSON.stringify([{ id: 'private', nickname: 'Local name', title: 'Private local draft', body: 'Private local body', createdAt: '2026-10-19T00:00:00.000Z' }]))
  const getItem = vi.spyOn(Storage.prototype, 'getItem')
  mount(false)
  expect(getItem).not.toHaveBeenCalledWith(QNA_PREVIEW_STORAGE_KEY)
  expect(container.textContent).not.toContain('Private local')
  expect(container.textContent).not.toContain('미리보기 저장')
  expect(container.querySelector('#qna-write-form')).toBeNull()
  expect(button('질문 작성하기')).toBeUndefined()
  expect(container.querySelector('a[href="/contact"]')).not.toBeNull()
  expect(container.querySelector('#qna-public-notice')?.textContent).toContain('모든 방문자에게 공개됩니다.')
})

it('renders saved content as plain text', () => {
  localStorage.setItem(QNA_PREVIEW_STORAGE_KEY, JSON.stringify([{ id: 'plain', nickname: '<b>name</b>', title: '<img src=x onerror=alert(1)>', body: '<script>alert(1)</script>', createdAt: '2026-10-19T00:00:00.000Z' }]))
  mount()
  expect(container.querySelector('img, script')).toBeNull()
  expect(container.querySelector('.qna__item-title')?.textContent).toBe('<img src=x onerror=alert(1)>')
})
