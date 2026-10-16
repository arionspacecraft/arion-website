// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import FlightJourney from '../src/components/FlightJourney'
import { MotionProvider } from '../src/components/Motion'
import { flightLayout, flightStages, orbitalPoint, orbitAngle, particleForce, planets, scrollProgress, spinAngle, stageAt } from '../src/lib/flightJourney'

const renderer = vi.hoisted(() => ({ draw: vi.fn(), resize: vi.fn() }))
vi.mock('../src/components/particleUniverse', () => ({ createFlightRenderer: () => renderer }))

let root: Root
let container: HTMLDivElement
let frames: Map<number, FrameRequestCallback>
let nextFrame: number
let reduced: boolean
let observed: Element[]

beforeEach(() => {
  reduced = false
  observed = []
  frames = new Map()
  nextFrame = 0
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frames.set(++nextFrame, callback); return nextFrame })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id))
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
  vi.stubGlobal('IntersectionObserver', class { observe(element: Element) { observed.push(element) } disconnect() {} })
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
  act(() => root.render(<MemoryRouter><MotionProvider><div className="home-journey"><FlightJourney /><section className="test-content">Homepage content</section></div></MotionProvider></MemoryRouter>))
  const page = container.querySelector<HTMLElement>('.home-journey')!
  const viewport = container.querySelector<HTMLElement>('.journey__viewport')!
  viewport.style.top = '85px'
  Object.defineProperty(page, 'offsetHeight', { value: 5000, configurable: true })
  Object.defineProperty(container.querySelector('.journey'), 'offsetHeight', { value: 800 })
  Object.defineProperty(viewport, 'offsetHeight', { value: 800 })
  return page
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
    expect(flightStages.map(stage => stageAt(stage.position))).toEqual([0, 1, 2, 3, 4, 5])
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
    vi.spyOn(section, 'getBoundingClientRect').mockReturnValue({ top: 85 - 4200 * 0.43 } as DOMRect)
    step()
    expect(renderer.draw.mock.lastCall?.[0]).toBe(flightStages[2].position)
    expect(renderer.draw.mock.lastCall?.[1]).toBe(0)
    expect(frames.size).toBe(0)
    expect(container.querySelector('.journey__viewport')?.getAttribute('data-stage')).toBe('solar')
    expect(container.querySelector('h1')?.textContent).toContain('우주를 향한')
    // Scroll backward updates the still frame while keeping time frozen.
    vi.mocked(section.getBoundingClientRect).mockReturnValue({ top: 85 } as DOMRect)
    act(() => window.dispatchEvent(new Event('scroll')))
    step(200)
    expect(renderer.draw.mock.lastCall?.[0]).toBe(0)
  })

  it('uses the same scroll geometry for chapter navigation and cancels animation on unmount', () => {
    const section = mount()
    vi.spyOn(section, 'getBoundingClientRect').mockReturnValue({ top: 85 } as DOMRect)
    step()
    const buttons = container.querySelectorAll<HTMLButtonElement>('.journey__stages button')
    act(() => buttons[5].click())
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
    const toggle = container.querySelector<HTMLButtonElement>('.journey__toggle')!
    await act(async () => toggle.click())
    step(200)
    expect(renderer.draw.mock.lastCall?.[3]).toBe(false)
    expect(frames.size).toBe(1)
    await act(async () => toggle.click())
    step(300)
    expect(renderer.draw.mock.lastCall?.[3]).toBe(true)
    expect(frames.size).toBe(0)
  })

  it('keeps Earth attached to its solar orbit through every zoom instead of duplicating it', () => {
    for (let i = 0; i <= 100; i++) {
      const scene = flightLayout(i / 100, 7)
      const orbit = orbitalPoint(scene.solarRadius * planets[2].orbit, orbitAngle(7, planets[2].years, planets[2].phase))
      expect(scene.earth.x).toBeCloseTo(scene.solar.x + orbit.x, 8)
      expect(scene.earth.y).toBeCloseTo(scene.solar.y + orbit.y, 8)
      expect(scene.earthRadius / scene.solarRadius).toBeCloseTo(0.017, 10)
      expect(scene.solarRadius / scene.galaxyRadius).toBeCloseTo(0.012, 10)
      expect(scene.galaxyRadius / scene.localRadius).toBeCloseTo(0.18, 10)
    }
  })

  it('uses a continuous, monotonically retreating camera across all stage boundaries', () => {
    let previous = Infinity
    for (let i = 0; i <= 1000; i++) {
      const radius = flightLayout(i / 1000, 0).cosmicRadius
      expect(radius).toBeLessThanOrEqual(previous + 1e-7)
      previous = radius
    }
    for (const progress of [0.2, 0.24, 0.43, 0.46, 0.65, 0.68, 0.83, 0.85]) {
      const before = flightLayout(progress - 1e-6, 0)
      const after = flightLayout(progress + 1e-6, 0)
      expect(Math.abs(after.cosmicRadius / before.cosmicRadius - 1)).toBeLessThan(0.0001)
      expect(Math.hypot(after.earth.x - before.earth.x, after.earth.y - before.earth.y)).toBeLessThan(0.0001)
    }
  })

  it('halves the interaction radius at desktop and mobile sizes without changing peak displacement', () => {
    const pointer = { x: 400, y: 300 }
    expect(particleForce(450, 300, pointer, 1440, 0).x).toBeGreaterThan(100)
    expect(particleForce(520, 300, pointer, 1440, 0)).toEqual({ x: 0, y: 0 })
    expect(particleForce(500, 300, pointer, 1440, 0).x).toBeGreaterThan(0)
    expect(particleForce(500, 300, pointer, 390, 0)).toEqual({ x: 0, y: 0 })
    expect(particleForce(400, 300, pointer, 1440, 0).x).toBe(175)
    expect(particleForce(400, 300, pointer, 1440, 1).x).toBeTypeOf('number')
    expect(Number.isFinite(particleForce(400, 300, pointer, 1440, 1).y)).toBe(true)
  })

  it('keeps the background running beyond the hero and uses the entire content height', () => {
    const page = mount()
    expect(observed).toContain(page)
    expect(observed).not.toContain(container.querySelector('.journey'))
    vi.spyOn(page, 'getBoundingClientRect').mockReturnValue({ top: 85 - 2100, bottom: 2985 } as DOMRect)
    step()
    expect(renderer.draw.mock.lastCall?.[0]).toBe(0.5)
    expect(frames.size).toBe(1)
    // Content becoming longer changes progress without adding a flight runway.
    Object.defineProperty(page, 'offsetHeight', { value: 9200 })
    reduced = false
    act(() => window.dispatchEvent(new Event('scroll')))
    step(200)
    const updatedProgress = renderer.draw.mock.lastCall?.[0] as number
    expect(updatedProgress).toBeLessThan(0.5)
    expect(updatedProgress).toBeGreaterThan(0.25)
  })

  it('reacts over the scene but releases particles when the pointer moves onto navigation', () => {
    mount()
    const content = container.querySelector('.test-content')!
    act(() => content.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 400, clientY: 300 })))
    step()
    expect(renderer.draw.mock.lastCall?.[2]).toEqual({ x: 400, y: 300 })
    const button = container.querySelector('.journey__stages button')!
    act(() => button.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 400, clientY: 600 })))
    step(200)
    expect(renderer.draw.mock.lastCall?.[2]).toEqual({ x: -10000, y: -10000 })
  })
})
