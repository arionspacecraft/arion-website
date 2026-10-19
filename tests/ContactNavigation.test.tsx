// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
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

const mount = (path: string) => act(() => root.render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>))
const contactLink = () => container.querySelector<HTMLAnchorElement>('.contact-menu__trigger')!
const contactToggle = () => container.querySelector<HTMLButtonElement>('.contact-menu .nav-menu__toggle')!
const mobileToggle = () => container.querySelector<HTMLButtonElement>('.header__toggle')!
const submenu = () => container.querySelector<HTMLDivElement>('#contact-submenu')!

it('puts Q&A first while keeping direct contact reachable and both pages active in the contact group', () => {
  mount('/qna')
  expect([...container.querySelectorAll('.contact-nav a')].map(link => link.getAttribute('href'))).toEqual(['/qna', '/contact'])
  expect([...submenu().querySelectorAll('a')].map(link => link.getAttribute('href'))).toEqual(['/qna', '/contact'])
  expect(container.querySelectorAll('.footer__nav a[href="/qna"]')).toHaveLength(1)
  expect(container.querySelector('.footer__nav a[href="/contact"]')?.textContent).toContain('직접 문의')

  act(() => container.querySelector<HTMLAnchorElement>('.contact-nav a[href="/contact"]')!.click())
  expect(container.querySelector('h1')?.textContent).toBe('직접 문의하기')
  expect(container.querySelector('.contact-people')).not.toBeNull()
  expect(container.querySelector('#qna')).toBeNull()
  expect(container.querySelector('.contact-nav a[aria-current="page"]')?.getAttribute('href')).toBe('/contact')
  expect(contactLink().classList.contains('active')).toBe(true)

  act(() => container.querySelector<HTMLAnchorElement>('.contact-nav a[href="/qna"]')!.click())
  expect(container.querySelector('h1')?.textContent).toBe('Q&A')
  expect(container.querySelector('#qna')).not.toBeNull()
  expect(container.querySelector('.contact-people')).toBeNull()
  expect(container.querySelector('.contact-nav a[aria-current="page"]')?.getAttribute('href')).toBe('/qna')
  expect(container.querySelector('.contact-menu > .nav__link')?.classList.contains('active')).toBe(true)
  expect(document.title).toBe('Q&A | ARION')
})

it('opens the contact dropdown and closes it after navigating to Q&A', () => {
  mount('/about')
  expect(submenu().hidden).toBe(true)
  expect(container.querySelectorAll('.contact-menu > button')).toHaveLength(1)
  expect(contactLink().getAttribute('href')).toBe('/qna')
  expect(contactLink().getAttribute('aria-label')).toBeNull()
  expect(contactLink().textContent).not.toContain('⌄')
  pointer(contactLink(), 'pointerover', 'mouse', document.body)
  expect(contactToggle().getAttribute('aria-expanded')).toBe('true')
  expect(submenu().hidden).toBe(false)
  act(() => submenu().querySelector<HTMLAnchorElement>('a[href="/qna"]')!.click())
  expect(container.querySelector('h1')?.textContent).toBe('Q&A')
  expect(submenu().hidden).toBe(true)
  expect(contactToggle().getAttribute('aria-expanded')).toBe('false')
})

it('closes the nested menu first on Escape and preserves mobile menu focus behavior', () => {
  desktopHover = false
  mount('/contact')
  act(() => mobileToggle().click())
  act(() => contactToggle().click())
  expect(mobileToggle().getAttribute('aria-expanded')).toBe('true')
  act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })))
  expect(submenu().hidden).toBe(true)
  expect(mobileToggle().getAttribute('aria-expanded')).toBe('true')
  expect(document.activeElement).toBe(contactLink())
  act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })))
  expect(mobileToggle().getAttribute('aria-expanded')).toBe('false')
  expect(document.activeElement).toBe(mobileToggle())
})

it('closes dropdown on outside pointer interaction or when keyboard focus leaves it', () => {
  mount('/contact')
  act(() => contactToggle().click())
  act(() => document.body.dispatchEvent(new Event('pointerdown', { bubbles: true })))
  expect(submenu().hidden).toBe(true)

  act(() => contactLink().focus())
  act(() => container.querySelector<HTMLButtonElement>('.language-toggle')!.focus())
  expect(submenu().hidden).toBe(true)
})

function pointer(target: Element, type: string, pointerType: 'mouse' | 'touch', relatedTarget: EventTarget | null = null) {
  const event = new Event(type, { bubbles: true })
  Object.defineProperties(event, { pointerType: { value: pointerType }, relatedTarget: { value: relatedTarget } })
  act(() => target.dispatchEvent(event))
}

it('opens immediately on mouse hover, stays open inside the submenu, and closes on leaving the group', () => {
  mount('/about')
  const parent = contactLink()
  pointer(parent, 'pointerover', 'mouse', document.body)
  expect(submenu().hidden).toBe(false)
  expect(contactToggle().getAttribute('aria-expanded')).toBe('true')

  const qnaLink = submenu().querySelector<HTMLAnchorElement>('a[href="/qna"]')!
  pointer(parent, 'pointerout', 'mouse', qnaLink)
  pointer(qnaLink, 'pointerover', 'mouse', parent)
  expect(submenu().hidden).toBe(false)

  pointer(qnaLink, 'pointerout', 'mouse', document.body)
  expect(submenu().hidden).toBe(true)
  expect(contactToggle().getAttribute('aria-expanded')).toBe('false')
})

it('opens on keyboard focus and stays closed when Escape returns focus to the parent link', () => {
  mount('/about')
  const parent = contactLink()
  act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true })))
  act(() => parent.focus())
  expect(submenu().hidden).toBe(false)
  act(() => submenu().querySelector<HTMLAnchorElement>('a[href="/qna"]')!.focus())
  act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })))
  expect(document.activeElement).toBe(contactLink())
  expect(submenu().hidden).toBe(true)
})

it('does not pre-open on a touch pointer before the separate mobile button toggles the dropdown', () => {
  desktopHover = false
  mount('/about')
  act(() => mobileToggle().click())
  expect(contactToggle().getAttribute('aria-label')).toBe('문의 메뉴 열기')
  pointer(contactToggle(), 'pointerover', 'touch', document.body)
  expect(submenu().hidden).toBe(true)
  pointer(contactToggle(), 'pointerdown', 'touch')
  act(() => contactToggle().focus())
  expect(submenu().hidden).toBe(true)
  pointer(contactToggle(), 'pointerup', 'touch')
  act(() => contactToggle().click())
  expect(submenu().hidden).toBe(false)
  expect(contactToggle().getAttribute('aria-label')).toBe('문의 메뉴 닫기')
  act(() => contactToggle().click())
  expect(submenu().hidden).toBe(true)
})

it('uses clicks at mobile width even when a mouse pointer enters before clicking', () => {
  desktopHover = false
  mount('/about')
  act(() => mobileToggle().click())
  pointer(contactToggle(), 'pointerover', 'mouse', document.body)
  expect(submenu().hidden).toBe(true)
  pointer(contactToggle(), 'pointerdown', 'mouse')
  act(() => contactToggle().focus())
  pointer(contactToggle(), 'pointerup', 'mouse')
  act(() => contactToggle().click())
  expect(submenu().hidden).toBe(false)
  pointer(contactToggle(), 'pointerout', 'mouse', document.body)
  expect(submenu().hidden).toBe(false)
})
