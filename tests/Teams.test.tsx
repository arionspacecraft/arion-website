// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import App from '../src/App'
import { teams } from '../src/content/teams'

let root: Root
let container: HTMLDivElement
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }))
  vi.stubGlobal('IntersectionObserver', class { observe() {} unobserve() {} disconnect() {} })
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  localStorage.clear()
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(() => { act(() => root.unmount()); container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals() })
const mount = (path: string) => act(() => root.render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>))

it('opens each team from a whole overview card without category tabs', () => {
  mount('/teams')
  const main = container.querySelector('main')!
  const cards = [...main.querySelectorAll<HTMLAnchorElement>('.team-summary')]
  expect(cards.map(card => card.getAttribute('href'))).toEqual(teams.map(team => `/teams/${team.slug}`))
  cards.forEach((card, index) => {
    expect(card.querySelector('h2')?.textContent).toBe(teams[index].name)
    expect(card.textContent).toContain(teams[index].summary)
  })
  expect(main.querySelector('.tabs, [role="tablist"]')).toBeNull()
  act(() => cards[0].click())
  expect(container.querySelector('h1')?.textContent).toBe('동체팀')
})

it('links home team summaries directly to their own detail pages', () => {
  mount('/')
  expect([...container.querySelectorAll('.team-module')].map(link => link.getAttribute('href')))
    .toEqual(teams.map(team => `/teams/${team.slug}`))
})

it.each(teams)('shows distinct provisional content with both navigation links returning to the team list for $slug', team => {
  mount(`/teams/${team.slug}`)
  const main = container.querySelector('main')!
  expect(main.querySelector('h1')?.textContent).toBe(team.name)
  expect(main.textContent).toContain(team.introduction)
  expect(main.textContent).toContain('임시 소개')
  expect(main.textContent).toContain('소개 내용은 추후 업데이트됩니다.')
  expect([...main.querySelectorAll('.team-detail__step h3')].map(heading => heading.textContent)).toEqual(team.tasks)
  expect([...main.querySelectorAll('a')].map(link => link.getAttribute('href'))).toEqual(['/teams', '/teams'])
  expect(main.querySelector('.team-detail__breadcrumb [aria-current="page"]')?.textContent).toBe(team.name)
  expect(main.querySelector('.tabs, [role="tablist"]')).toBeNull()
  act(() => main.querySelector<HTMLAnchorElement>('.team-detail__back')!.click())
  expect(container.querySelector('h1')?.textContent).toBe('팀 구성')
})

it('returns to the team overview from the breadcrumb', () => {
  mount('/teams/airframe')
  const link = container.querySelector<HTMLAnchorElement>('.team-detail__breadcrumb a')!
  expect(link.textContent).toBe('전체 팀')
  act(() => link.click())
  expect(container.querySelector('h1')?.textContent).toBe('팀 구성')
})

it.each(teams)('translates detail content on $slug', team => {
  localStorage.setItem('arion-language', 'en')
  mount(`/teams/${team.slug}`)
  expect(container.querySelector('main')?.textContent).not.toMatch(/[가-힣]/)
  expect(document.title).toBe(`${team.nameEn} | ARION`)
})

it('renders the existing not-found page for an unknown team', () => {
  mount('/teams/missing')
  expect(container.querySelector('h1')?.textContent).toBe('페이지를 찾을 수 없습니다')
})
