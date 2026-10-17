// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { createFlightRenderer } from '../src/components/particleUniverse'
import { celestialDistances } from '../src/content/celestialDistances'
import { solarCaptionNames } from '../src/lib/solarAtlas'

afterEach(() => vi.restoreAllMocks())

it.each([[1440, 815], [1280, 635], [1024, 515], [768, 651], [320, 495], [390, 771], [667, 302]])(
  'keeps nearby solar labels separate and moves them without jumps at %i × %i', (width, height) => {
    const texts: { value: string; x: number; y: number; width: number; font: number }[] = []
    const anchors: number[][] = []
    const fontSize = () => Number.parseFloat(String(context.font).split(' ')[1]) || 12
    const context: Record<string, unknown> = {
      font: '', strokeStyle: '',
      createRadialGradient: () => ({ addColorStop() {} }),
      getImageData: () => ({ data: new Uint8ClampedArray(360 * 520 * 4) }),
      measureText: (value: string) => ({ width: value.length * fontSize() * 0.6 }),
      fillText: (value: string, x: number, y: number) => texts.push({ value, x, y, width: value.length * fontSize() * 0.6, font: fontSize() }),
      moveTo: (x: number, y: number) => { if (context.strokeStyle === '#8fafd0') anchors.push([x, y]) },
    }
    const ctx = new Proxy(context, { get: (target, key) => target[String(key)] ?? (() => {}) }) as unknown as CanvasRenderingContext2D
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx)
    const canvas = document.createElement('canvas')
    Object.defineProperties(canvas, { clientWidth: { value: width }, clientHeight: { value: height } })
    const renderer = createFlightRenderer(canvas, ctx)
    renderer.resize()
    renderer.draw(0.43, 0, { x: -10000, y: -10000 }, false)
    const initial = [...texts]
    for (const name of solarCaptionNames) {
      expect(initial.some(text => text.value === name)).toBe(true)
      expect(initial.some(text => text.value === celestialDistances[name])).toBe(true)
    }
    const checkReadability = () => {
      for (const text of texts) {
        expect(text.x).toBeGreaterThanOrEqual(0)
        expect(text.x + text.width).toBeLessThanOrEqual(width)
        expect(text.y - text.font).toBeGreaterThanOrEqual(0)
        expect(text.y + 2).toBeLessThan(height - 80)
      }
      texts.forEach((text, index) => {
        for (const other of texts.slice(index + 1)) {
          expect(text.x + text.width <= other.x || other.x + other.width <= text.x ||
            text.y + 2 <= other.y - other.font + 0.001 || other.y + 2 <= text.y - text.font + 0.001,
          `${text.value} overlaps ${other.value}`).toBe(true)
        }
      })
    }
    checkReadability()
    let last = initial
    const maxStep = Math.max(100, (width - 32) * 0.1) / 30 + 0.01
    const frames = width === 1440 ? 3600 : 900
    for (let frame = 1; frame <= frames; frame++) {
      texts.length = 0; anchors.length = 0
      renderer.draw(0.43, frame / 30, { x: width / 2, y: height / 2 }, false)
      checkReadability()
      for (const text of texts) {
        const old = last.find(item => item.value === text.value)!
        expect(Math.hypot(text.x - old.x, text.y - old.y)).toBeLessThanOrEqual(maxStep)
      }
      last = [...texts]
      if (frame % 900 === 0) {
        const currentNames = texts.filter(text => solarCaptionNames.includes(text.value))
        for (const [index, text] of currentNames.entries()) {
          expect(Math.hypot(text.x - anchors[index][0], text.y - anchors[index][1]), `${text.value} has drifted away at ${frame / 30}s`).toBeLessThan(220)
        }
      }
    }
    expect(texts.some(text => { const old = initial.find(item => item.value === text.value)!; return Math.hypot(text.x - old.x, text.y - old.y) > 10 })).toBe(true)
    // The names remain locally attached, not collected in a distant sidebar.
    const names = texts.filter(text => solarCaptionNames.includes(text.value))
    expect(names.filter((text, index) => text.x >= anchors[index][0]).length).toBeGreaterThanOrEqual(6)
    const meanDistance = names.reduce((sum, text, index) => sum + Math.hypot(text.x - anchors[index][0], text.y - anchors[index][1]), 0) / names.length
    expect(meanDistance).toBeLessThan(Math.max(140, width * 0.12))
    texts.length = 0
    renderer.draw(0.43, frames / 30, { x: -10000, y: -10000 }, true)
    expect(texts).toEqual(last)
    // Zoom and fade retain the gradual motion and separation.
    for (const [index, progress] of [0.4, 0.48, 0.54, 0.56].entries()) {
      texts.length = 0
      renderer.draw(progress, frames / 30 + (index + 1) / 30, { x: -10000, y: -10000 }, false)
      checkReadability()
    }
  },
  60000,
)
