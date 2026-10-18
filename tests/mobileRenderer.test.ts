// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { createFlightRenderer } from '../src/components/particleUniverse'
import { deepSky, planets } from '../src/lib/flightJourney'
import { celestialDistances } from '../src/content/celestialDistances'

afterEach(() => vi.restoreAllMocks())

it('keeps particle response and recovery consistent across refresh rates', () => {
  const sample = (fps: number) => {
    const stars: { x: number; y: number }[] = []
    const context: Record<string, unknown> = {
      fillStyle: '',
      createRadialGradient: () => ({ addColorStop() {} }),
      getImageData: () => ({ data: new Uint8ClampedArray(360 * 520 * 4) }),
      measureText: (value: string) => ({ width: value.length * 8 }),
      arc: (x: number, y: number) => {
        if (context.fillStyle === '#8faacc' && !stars.length) stars.push({ x, y })
      },
    }
    const ctx = new Proxy(context, { get: (target, key) => target[String(key)] ?? (() => {}) }) as unknown as CanvasRenderingContext2D
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx)
    const canvas = document.createElement('canvas')
    Object.defineProperties(canvas, { clientWidth: { value: 390 }, clientHeight: { value: 771 } })
    const renderer = createFlightRenderer(canvas, ctx)
    renderer.resize()
    const far = { x: -10000, y: -10000 }
    const draw = (time: number, pointer = far) => {
      stars.length = 0
      // At launch, background stars stay still, isolating pointer displacement.
      renderer.draw(0, time, pointer, false)
      expect(stars).toHaveLength(1)
      return stars[0]
    }
    const origin = draw(0)
    const pointer = { x: origin.x - 30, y: origin.y + 20 }
    let response = origin
    for (let frame = 1; frame <= fps / 2; frame++) response = draw(frame / fps, pointer)
    // Theme/other redraws at the same visual time must not advance the reaction.
    expect(draw(0.5, pointer)).toEqual(response)
    let recovery = response
    for (let frame = fps / 2 + 1; frame <= fps; frame++) recovery = draw(frame / fps)
    expect(Math.hypot(response.x - origin.x, response.y - origin.y)).toBeGreaterThan(10)
    expect(Math.hypot(recovery.x - origin.x, recovery.y - origin.y)).toBeLessThan(Math.hypot(response.x - origin.x, response.y - origin.y))
    return { response, recovery }
  }
  const baseline = sample(30)
  for (const fps of [60, 120, 144]) {
    const actual = sample(fps)
    for (const phase of ['response', 'recovery'] as const) {
      expect(actual[phase].x).toBeCloseTo(baseline[phase].x, 6)
      expect(actual[phase].y).toBeCloseTo(baseline[phase].y, 6)
    }
  }
})

it.each([[320, 495], [390, 771], [667, 302], [844, 305]])('renders every mobile scene name without offscreen celestial particles at %i × %i', (width, height) => {
  const points: { x: number; y: number; radius: number }[] = []
  const texts: { value: string; x: number; y: number; width: number }[] = []
  const context: Record<string, unknown> = {
    fillStyle: '', font: '', globalAlpha: 1,
    createRadialGradient: () => ({ addColorStop() {} }),
    getImageData: () => ({ data: new Uint8ClampedArray(360 * 520 * 4) }),
    measureText: (value: string) => ({ width: value.length * (Number.parseFloat(String(context.font).split(' ')[1]) || 12) * 0.6 }),
    arc: (x: number, y: number, radius: number) => {
      if (context.fillStyle !== '#8faacc') points.push({ x, y, radius })
    },
    fillText: (value: string, x: number, y: number) => {
      texts.push({ value, x, y, width: (context.measureText as (value: string) => { width: number })(value).width })
    },
  }
  const ctx = new Proxy(context, { get: (target, key) => target[String(key)] ?? (() => {}) }) as unknown as CanvasRenderingContext2D
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx)
  const canvas = document.createElement('canvas')
  Object.defineProperties(canvas, { clientWidth: { value: width }, clientHeight: { value: height } })
  const renderer = createFlightRenderer(canvas, ctx)
  renderer.resize()
  const stages = [
    { progress: 0.22, names: ['EARTH', 'MOON'] },
    { progress: 0.43, names: ['SOL', ...planets.map(p => p.en)] },
    { progress: 0.65, names: ['SOLAR SYSTEM', ...deepSky.galactic.map(p => p.name)] },
    { progress: 0.83, names: ['MILKY WAY', ...deepSky.local.map(p => p.name)] },
    { progress: 1, names: ['LOCAL GROUP', ...deepSky.cosmic.map(p => p.name)] },
  ]
  for (const stage of stages) for (const time of [0, 80, 240]) {
    points.length = 0; texts.length = 0
    renderer.draw(stage.progress, time, { x: -10000, y: -10000 }, false)
    for (const name of stage.names) {
      expect(texts.map(text => text.value).join(' ')).toContain(name)
      expect(texts.some(text => text.value === celestialDistances[name])).toBe(true)
    }
    for (const text of texts) {
      expect(text.x).toBeGreaterThanOrEqual(0)
      expect(text.x + text.width).toBeLessThanOrEqual(width)
      expect(text.y).toBeGreaterThan(0)
      expect(text.y).toBeLessThan(height - 80)
    }
    for (const point of points) {
      expect(point.x - point.radius).toBeGreaterThanOrEqual(0)
      expect(point.x + point.radius).toBeLessThanOrEqual(width)
      expect(point.y - point.radius).toBeGreaterThanOrEqual(0)
      expect(point.y + point.radius).toBeLessThanOrEqual(height)
    }
  }
})
