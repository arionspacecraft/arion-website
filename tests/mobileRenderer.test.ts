// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { createFlightRenderer } from '../src/components/particleUniverse'
import { deepSky, planets } from '../src/lib/flightJourney'

afterEach(() => vi.restoreAllMocks())

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
    for (const name of stage.names) expect(texts.map(text => text.value).join(' ')).toContain(name)
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
