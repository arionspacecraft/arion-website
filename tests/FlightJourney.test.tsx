// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import FlightJourney from '../src/components/FlightJourney'
import { MotionProvider } from '../src/components/Motion'
import { flightStages, orbitAngle, planets, scrollProgress, spinAngle, stageAt } from '../src/lib/flightJourney'

const renderer = vi.hoisted(() => ({ draw: vi.fn(), resize: vi.fn() }))
vi.mock('../src/components/flightRenderer', () => ({ createFlightRenderer: () => renderer }))

let root: Root
let container: HTMLDivElement
let frames: Map<number, FrameRequestCallback>
let nextFrame: number
let reduced: boolean

beforeEach(() => {
  reduced = false
  frames = new Map()
  nextFrame = 0
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frames.set(++nextFrame, callback); return nextFrame })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id))
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} })
  vi.stubGlobal('matchMedia', () => ({ matches: reduced, addEventListener() {}, removeEventListener() {} }))
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({} as CanvasRenderingContext2D)
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  renderer.draw.mockClear()
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
function mount() {
  act(() => root.render(<MemoryRouter><MotionProvider><FlightJourney /></MotionProvider></MemoryRouter>))
  const section = container.querySelector<HTMLElement>('.journey')!
  const viewport = container.querySelector<HTMLElement>('.journey__viewport')!
  viewport.style.top = '85px'
  Object.defineProperty(section, 'offsetHeight', { value: 5000 })
  Object.defineProperty(viewport, 'offsetHeight', { value: 800 })
  return section
}
function step(now = 100) {
  act(() => {
    const pending = [...frames.values()]
    frames.clear()
    pending.forEach(callback => callback(now))
  })
}

describe('scroll flight behavior', () => {
  it('clamps progress and reverses correctly instead of advancing on elapsed time', () => {
    expect(scrollProgress(85, 5000, 800, 85)).toBe(0)
    expect(scrollProgress(-4115, 5000, 800, 85)).toBe(1)
    expect(scrollProgress(-2015, 5000, 800, 85)).toBe(0.5)
    expect(scrollProgress(200, 5000, 800, 85)).toBe(0)
    expect(scrollProgress(-9000, 5000, 800, 85)).toBe(1)
    expect(scrollProgress(0, 800, 800, 85)).toBe(0)
    expect(flightStages.map(stage => stageAt(stage.position))).toEqual([0, 1, 2, 3])
  })

  it('keeps all eight orbital speeds ordered and retrograde spins reversed', () => {
    expect(planets).toHaveLength(8)
    const speeds = planets.map(p => orbitAngle(1, p.years, 0))
    expect(speeds.every((speed, i) => i === 0 || speed < speeds[i - 1])).toBe(true)
    expect(spinAngle(10, planets[1].hours)).toBeLessThan(0)
    expect(spinAngle(10, planets[6].hours)).toBeLessThan(0)
    expect(spinAngle(10, planets[2].hours)).toBeGreaterThan(0)
  })

  it('renders still stage snapshots under reduced motion and does not run a continuous loop', () => {
    reduced = true
    const section = mount()
    vi.spyOn(section, 'getBoundingClientRect').mockReturnValue({ top: 85 - 4200 * 0.56 } as DOMRect)
    step()
    expect(renderer.draw.mock.lastCall?.[0]).toBe(flightStages[2].position)
    expect(renderer.draw.mock.lastCall?.[1]).toBe(0)
    expect(frames.size).toBe(0)
    expect(container.querySelector('.journey__viewport')?.getAttribute('data-stage')).toBe('solar')
    expect(container.querySelector<HTMLElement>('.journey__intro')?.inert).toBe(true)
    // Scroll backward updates the still frame while keeping time frozen.
    vi.mocked(section.getBoundingClientRect).mockReturnValue({ top: 85 } as DOMRect)
    act(() => window.dispatchEvent(new Event('scroll')))
    step(200)
    expect(renderer.draw.mock.lastCall?.[0]).toBe(0)
    expect(container.querySelector<HTMLElement>('.journey__intro')?.inert).toBe(false)
  })

  it('uses the same scroll geometry for chapter navigation and cancels animation on unmount', () => {
    const section = mount()
    vi.spyOn(section, 'getBoundingClientRect').mockReturnValue({ top: 85 } as DOMRect)
    step()
    const buttons = container.querySelectorAll<HTMLButtonElement>('.journey__stages button')
    act(() => buttons[3].click())
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 4200, behavior: 'smooth' })
    expect(frames.size).toBe(1)
    act(() => root.render(null))
    expect(frames.size).toBe(0)
  })

  it('keeps the site and skip link available without Canvas support', () => {
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null)
    mount()
    expect(container.querySelector('.journey--fallback')).not.toBeNull()
    expect(container.querySelector('a[href="#mission"]')).not.toBeNull()
    expect(container.querySelector('h1')?.textContent).toContain('우주를 향한')
  })

  it('restarts the frame loop after play is selected without needing a scroll event', async () => {
    reduced = true
    mount()
    step()
    expect(frames.size).toBe(0)
    const toggle = container.querySelector<HTMLButtonElement>('.journey__footnote button')!
    await act(async () => toggle.click())
    step(200)
    expect(renderer.draw.mock.lastCall?.[3]).toBe(false)
    expect(frames.size).toBe(1)
    await act(async () => toggle.click())
    step(300)
    expect(renderer.draw.mock.lastCall?.[3]).toBe(true)
    expect(frames.size).toBe(0)
  })
})
