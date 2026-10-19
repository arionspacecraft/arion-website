// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import App from '../src/App'

let container: HTMLDivElement
let root: ReturnType<typeof createRoot>
let desktopHover = true

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  desktopHover = true
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: query === '(min-width: 1121px) and (hover: hover) and (pointer: fine)' && desktopHover, addEventListener() {}, removeEventListener() {} }))
  vi.stubGlobal('IntersectionObserver', class { observe() {} unobserve() {} disconnect() {} })
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
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

function HistoryControls() {
  const location = useLocation()
  const navigate = useNavigate()
  return <><output data-location>{location.pathname}{location.search}</output><button data-back onClick={() => navigate(-1)}>Back</button><button data-forward onClick={() => navigate(1)}>Forward</button></>
}
const mount = (path: string) => act(() => root.render(<MemoryRouter initialEntries={[path]}><App /><HistoryControls /></MemoryRouter>))
const pressedTab = () => container.querySelector<HTMLButtonElement>('main .tab[aria-pressed="true"]')!
const tab = (label: string) => [...container.querySelectorAll<HTMLButtonElement>('main .tab')].find(button => button.textContent?.trim() === label)!
const parentLink = (name: string) => container.querySelector<HTMLAnchorElement>(`.nav-menu__trigger[aria-controls="${name}-submenu"]`)!
const submenu = (name: string) => container.querySelector<HTMLDivElement>(`#${name}-submenu`)!
const route = () => container.querySelector('[data-location]')?.textContent
function hover(name: string) {
  const event = new Event('pointerover', { bubbles: true })
  Object.defineProperties(event, { pointerType: { value: 'mouse' }, relatedTarget: { value: document.body } })
  act(() => parentLink(name).dispatchEvent(event))
}

it.each([
  ['in-progress', '진행 중', 1], ['completed', '완료', 0], ['planned', '계획', 0], ['archived', '아카이브', 0],
])('opens project status %s from a direct URL and marks exactly one header child', (slug, label, count) => {
  mount(`/projects?status=${slug}`)
  expect(pressedTab().textContent?.trim()).toBe(label)
  expect(container.querySelectorAll('main .project-card')).toHaveLength(count as number)
  expect(submenu('projects').querySelectorAll('[aria-current="page"]')).toHaveLength(1)
  expect(submenu('projects').querySelector('[aria-current="page"]')?.getAttribute('href')).toBe(`/projects?status=${slug}`)
  expect(parentLink('projects').classList.contains('active')).toBe(true)
})

it.each([
  ['announcements', '공지', 0], ['activities', '활동', 2], ['recruitment', '모집', 1],
])('opens news category %s from a direct URL and marks its header child', (slug, label, count) => {
  mount(`/news?category=${slug}`)
  expect(pressedTab().textContent?.trim()).toBe(label)
  expect(container.querySelectorAll('main .news-list > li')).toHaveLength(count as number)
  expect(submenu('news').querySelectorAll('[aria-current="page"]')).toHaveLength(1)
  expect(submenu('news').querySelector('[aria-current="page"]')?.getAttribute('href')).toBe(`/news?category=${slug}`)
})

it.each([
  ['/teams/airframe/', 'teams', '/teams/airframe'],
  ['/projects/?status=completed', 'projects', '/projects?status=completed'],
  ['/news/?category=activities', 'news', '/news?category=activities'],
  ['/qna/', 'contact', '/qna'],
])('keeps the current menu highlighted for the static entry URL %s', (path, name, href) => {
  mount(path)
  const current = submenu(name).querySelectorAll<HTMLAnchorElement>('[aria-current="page"]')
  expect(current).toHaveLength(1)
  expect(current[0].getAttribute('href')).toBe(href)
  expect(current[0].classList.contains('active')).toBe(true)
  expect(parentLink(name).classList.contains('active')).toBe(true)
  expect(route()).toBe(path)
})

it('keeps filter clicks, the URL and back/forward navigation synchronized while preserving other parameters', () => {
  mount('/projects?status=completed&theme=dark')
  act(() => tab('진행 중').click())
  expect(route()).toBe('/projects?status=in-progress&theme=dark')
  expect(container.querySelector('main .project-card')).not.toBeNull()
  act(() => container.querySelector<HTMLButtonElement>('[data-back]')!.click())
  expect(pressedTab().textContent?.trim()).toBe('완료')
  expect(container.querySelector('main .project-card')).toBeNull()
  act(() => container.querySelector<HTMLButtonElement>('[data-forward]')!.click())
  expect(pressedTab().textContent?.trim()).toBe('진행 중')
  act(() => tab('전체').click())
  expect(route()).toBe('/projects?theme=dark')
  expect(pressedTab().textContent?.trim()).toBe('전체')
})

it('changes news content through its pills and returns to all categories', () => {
  mount('/news?category=activities&theme=light')
  act(() => tab('모집').click())
  expect(route()).toBe('/news?category=recruitment&theme=light')
  expect(container.querySelector('main .news-list')?.textContent).toContain('2026 신입 부원 모집')
  expect(container.querySelector('main .news-list')?.textContent).not.toContain('동아리 부스 운영')
  act(() => tab('공지').click())
  expect(container.querySelector('main .empty')?.textContent).toBe('해당하는 소식이 없습니다.')
  act(() => tab('전체').click())
  expect(route()).toBe('/news?theme=light')
  expect(container.querySelectorAll('main .news-list > li')).toHaveLength(3)
})

it.each(['/projects?status=unknown', '/news?category=unknown'])('uses the all filter for an unknown query on %s', path => {
  mount(path)
  expect(pressedTab().textContent?.trim()).toBe('전체')
  const name = path.startsWith('/projects') ? 'projects' : 'news'
  expect(submenu(name).querySelectorAll('[aria-current="page"]')).toHaveLength(1)
  expect(submenu(name).querySelector('[aria-current="page"]')?.getAttribute('href')).toBe(`/${name}`)
})

it('opens only one floating group at a time and offers the team overview plus all five team pages', () => {
  mount('/about')
  for (const name of ['projects', 'news', 'teams', 'contact']) {
    hover(name)
    expect(container.querySelectorAll('.nav-menu__links:not([hidden])')).toHaveLength(1)
    expect(submenu(name).hidden).toBe(false)
  }
  expect([...submenu('teams').querySelectorAll('a')].map(link => link.getAttribute('href'))).toEqual([
    '/teams', '/teams/airframe', '/teams/propulsion', '/teams/avionics', '/teams/recovery', '/teams/administration',
  ])
  expect(container.querySelectorAll('.nav-menu > button')).toHaveLength(4)
})

it('navigates directly to a filtered category from another page and closes the floating menu', () => {
  mount('/contact')
  hover('projects')
  act(() => submenu('projects').querySelector<HTMLAnchorElement>('a[href="/projects?status=completed"]')!.click())
  expect(route()).toBe('/projects?status=completed')
  expect(pressedTab().textContent?.trim()).toBe('완료')
  expect(submenu('projects').hidden).toBe(true)
})

it('returns to the page top for header filter navigation on the same route', () => {
  mount('/news?category=activities')
  vi.mocked(window.scrollTo).mockClear()
  hover('news')
  act(() => submenu('news').querySelector<HTMLAnchorElement>('a[href="/news?category=recruitment"]')!.click())
  expect(pressedTab().textContent?.trim()).toBe('모집')
  expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'instant' })
})


it.each([
  ['projects', '프로젝트', '/projects?status=completed', '/projects'],
  ['teams', '팀', '/teams/avionics', '/teams'],
  ['news', '소식', '/news?category=activities', '/news'],
  ['contact', '문의', '/contact', '/qna'],
])('navigates to the %s root when its parent label is clicked and closes the menu', (name, label, start, destination) => {
  mount(start)
  const link = parentLink(name)
  expect(link.tagName).toBe('A')
  expect(link.getAttribute('href')).toBe(destination)
  expect(link.getAttribute('aria-label')).toBeNull()
  expect(link.textContent).toContain(label)
  hover(name)
  expect(submenu(name).hidden).toBe(false)

  act(() => link.click())
  expect(route()).toBe(destination)
  expect(submenu(name).hidden).toBe(true)
  if (name === 'projects' || name === 'news') expect(pressedTab().textContent?.trim()).toBe('전체')
})

it('keeps mobile label navigation separate from submenu expansion', () => {
  desktopHover = false
  mount('/teams/propulsion')
  const mobileToggle = container.querySelector<HTMLButtonElement>('.header__toggle')!
  act(() => mobileToggle.click())
  const submenuToggle = container.querySelector<HTMLButtonElement>('.nav-menu__toggle[aria-controls="teams-submenu"]')!
  act(() => submenuToggle.click())
  expect(route()).toBe('/teams/propulsion')
  expect(submenu('teams').hidden).toBe(false)

  act(() => parentLink('teams').click())
  expect(route()).toBe('/teams')
  expect(submenu('teams').hidden).toBe(true)
  expect(mobileToggle.getAttribute('aria-expanded')).toBe('false')
})

it.each(['ctrlKey', 'metaKey'] as const)('leaves a modified %s parent click to the browser without closing its menu', modifier => {
  mount('/teams/avionics')
  hover('teams')
  // The browser owns opening the new tab; prevent only jsdom's unsupported native navigation.
  document.addEventListener('click', event => event.preventDefault(), { once: true })
  act(() => parentLink('teams').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, [modifier]: true })))
  expect(route()).toBe('/teams/avionics')
  expect(submenu('teams').hidden).toBe(false)
})

it('returns to the page top when a parent label clears a filter on the current route', () => {
  mount('/projects?status=completed')
  vi.mocked(window.scrollTo).mockClear()
  act(() => parentLink('projects').click())
  expect(route()).toBe('/projects')
  expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'instant' })
})
