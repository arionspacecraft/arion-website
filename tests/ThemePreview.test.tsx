// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import ThemePreview from '../src/components/ThemePreview'
import { createFlightRenderer } from '../src/components/particleUniverse'

let container: HTMLDivElement
let root: ReturnType<typeof createRoot>
let dark = false
let changed: () => void
const removed = vi.fn()
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  dark = false
  window.history.replaceState(null, '', '/')
  removed.mockClear()
  vi.stubGlobal('matchMedia', (query: string) => {
    expect(query).toBe('(prefers-color-scheme: dark)')
    return { get matches() { return dark }, addEventListener: (_: string, listener: () => void) => { changed = listener }, removeEventListener: removed }
  })
  container = document.createElement('div'); document.body.append(container)
  root = createRoot(container)
})
afterEach(() => {
  act(() => root.unmount()); container.remove()
  document.documentElement.removeAttribute('data-theme')
  document.querySelector('meta[name="theme-color"]')?.remove()
  window.history.replaceState(null, '', '/')
  vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs()
})

it.each([true, false])('follows the initial OS setting (%s) and changes live', initial => {
  dark = initial
  act(() => root.render(<ThemePreview />))
  expect(document.documentElement.dataset.theme).toBe(initial ? 'dark' : 'light')
  act(() => { dark = !initial; changed() })
  expect(document.documentElement.dataset.theme).toBe(initial ? 'light' : 'dark')
  act(() => root.unmount())
  expect(removed).toHaveBeenCalledWith('change', changed)
})

it('allows a local override and returns to the latest OS preference', () => {
  act(() => root.render(<ThemePreview />))
  const buttons = container.querySelectorAll<HTMLButtonElement>('button')
  act(() => buttons[1].click())
  act(() => { dark = true; changed() })
  expect(document.documentElement.dataset.theme).toBe('light')
  expect(buttons[1].getAttribute('aria-pressed')).toBe('true')
  act(() => buttons[0].click())
  expect(document.documentElement.dataset.theme).toBe('dark')
})

it.each([true, false])('production follows the device (%s), ignores preview URLs and hides controls', initial => {
  vi.stubEnv('DEV', false)
  dark = initial
  window.history.replaceState(null, '', `/?theme=${initial ? 'light' : 'dark'}`)
  const meta = document.createElement('meta')
  meta.name = 'theme-color'; document.head.append(meta)
  act(() => root.render(<ThemePreview />))
  expect(container.childElementCount).toBe(0)
  expect(document.documentElement.dataset.theme).toBe(initial ? 'dark' : 'light')
  expect(meta.content).toBe(initial ? '#030627' : '#f6f8fd')
  act(() => { dark = !initial; changed() })
  expect(document.documentElement.dataset.theme).toBe(initial ? 'light' : 'dark')
  expect(meta.content).toBe(initial ? '#f6f8fd' : '#030627')
})

it('recolors the paused canvas without changing celestial or label positions', () => {
  let theme: 'light' | 'dark' = 'dark'
  const stops: string[] = []
  const texts: { value: string; x: number; y: number; color: unknown }[] = []
  const context: Record<string, unknown> = {
    fillStyle: '', font: '', globalAlpha: 1,
    createRadialGradient: () => ({ addColorStop: (_: number, color: string) => stops.push(color) }),
    getImageData: () => ({ data: new Uint8ClampedArray(360 * 520 * 4) }),
    measureText: (value: string) => ({ width: value.length * (Number.parseFloat(String(context.font).split(' ')[1]) || 12) * .6 }),
    fillText: (value: string, x: number, y: number) => texts.push({ value, x, y, color: context.fillStyle }),
  }
  const ctx = new Proxy(context, { get: (target, key) => target[String(key)] ?? (() => {}) }) as unknown as CanvasRenderingContext2D
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx)
  const canvas = document.createElement('canvas')
  Object.defineProperties(canvas, { clientWidth: { value: 390 }, clientHeight: { value: 771 } })
  const renderer = createFlightRenderer(canvas, ctx, () => theme)
  renderer.resize()
  const draw = () => renderer.draw(.43, 30, { x: -10000, y: -10000 }, true)
  draw()
  const night = texts.splice(0)
  expect(stops).toContain('#030627')
  expect(night.find(text => text.value === 'EARTH')?.color).toBe('#e4efff')
  theme = 'light'; stops.length = 0; draw()
  expect(stops).toContain('#d5e3fb')
  expect(texts.find(text => text.value === 'EARTH')?.color).toBe('#16284b')
  expect(texts.map(({ value, x, y }) => ({ value, x, y }))).toEqual(night.map(({ value, x, y }) => ({ value, x, y })))
})
