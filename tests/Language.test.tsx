// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import App from '../src/App'

let root: Root
let container: HTMLDivElement
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }))
  vi.stubGlobal('IntersectionObserver', class { observe() {} unobserve() {} disconnect() {} })
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  localStorage.clear()
  container = document.createElement('div'); document.body.append(container)
  root = createRoot(container)
})
afterEach(() => { act(() => root.unmount()); container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals() })
const mount = (path: string) => act(() => root.render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>))

it('switches the whole site, retains the route, and remembers the language after remount', () => {
  mount('/contact')
  expect(container.textContent).toContain('길한겸')
  act(() => container.querySelector<HTMLButtonElement>('.language-toggle')!.click())
  expect(container.querySelector('h1')?.textContent).toBe('Contact us directly')
  expect(container.textContent).toContain('Hangyum Gil')
  expect(container.textContent).toContain('Woojin Jung')
  expect(document.documentElement.lang).toBe('en')
  expect(document.title).toBe('Contact us directly | ARION')
  expect(localStorage.getItem('arion-language')).toBe('en')
  act(() => root.render(null)); mount('/about')
  expect(container.querySelector('h1')?.textContent).toBe('About ARION')
  act(() => container.querySelector<HTMLButtonElement>('.language-toggle')!.click())
  expect(container.querySelector('h1')?.textContent).toBe('ARION 소개')
  expect(document.documentElement.lang).toBe('ko')
})

it.each(['/', '/about', '/teams', '/teams/airframe', '/teams/propulsion', '/teams/avionics', '/teams/recovery', '/teams/administration', '/projects', '/projects/test-project', '/news', '/news/hybrid-study-start', '/news/club-booth', '/news/recruit-2026', '/recruit', '/contact', '/qna', '/missing'])(
  'renders English page copy and accessible names on %s', path => {
    localStorage.setItem('arion-language', 'en'); mount(path)
    const siteCopy = container.cloneNode(true) as HTMLElement
    siteCopy.querySelectorAll('[data-notion-content]').forEach(element => element.remove())
    const visibleText = siteCopy.textContent!.replaceAll('한국어', '')
    expect(visibleText.match(/[가-힣]+/g), visibleText).toBeNull()
    const labels = [...container.querySelectorAll('[aria-label]')].filter(el => !el.classList.contains('language-toggle')).map(el => el.getAttribute('aria-label')).join(' ')
    expect(labels).not.toMatch(/[가-힣]/)
    if (path === '/projects/test-project') expect(document.title).toBe('공개 연구 | ARION')
    else expect(document.title).not.toMatch(/[가-힣]/)
  },
)

it.each(['/', '/projects', '/projects/test-project'])('preserves Notion original copy in both languages on %s', path => {
  mount(path)
  const original = [...container.querySelectorAll('[data-notion-content]')].map(element => element.textContent)
  expect(original).toContain('공개 연구')
  // This text also exists in the site dictionary: it must not translate here.
  expect(original).toContain('온 우주를 탐구하다')
  act(() => container.querySelector<HTMLButtonElement>('.language-toggle')!.click())
  expect([...container.querySelectorAll('[data-notion-content]')].map(element => element.textContent)).toEqual(original)
  expect(container.textContent).not.toContain('Public research')
  expect(container.textContent).not.toContain('A public research project.')
})

it('keeps category filters functional in English', () => {
  localStorage.setItem('arion-language', 'en'); mount('/projects')
  const button = [...container.querySelectorAll<HTMLButtonElement>('.tab')].find(el => el.textContent === 'Completed')!
  act(() => button.click())
  expect(button.getAttribute('aria-pressed')).toBe('true')
  expect(container.querySelector('.empty')?.textContent).toBe('No projects match this filter.')
})

it('still switches when persistent storage is unavailable', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
  mount('/contact')
  act(() => container.querySelector<HTMLButtonElement>('.language-toggle')!.click())
  expect(container.textContent).toContain('Hangyum Gil')
})
