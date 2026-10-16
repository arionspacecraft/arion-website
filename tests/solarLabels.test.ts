// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { createFlightRenderer } from '../src/components/particleUniverse'
import { celestialDistances } from '../src/content/celestialDistances'
import { solarCaptionNames } from '../src/lib/solarAtlas'

afterEach(() => vi.restoreAllMocks())

it.each([[1440, 815], [1280, 635], [1024, 515], [768, 651], [320, 495], [390, 771], [667, 302]])(
  'keeps all solar names and distances fixed while planets orbit at %i × %i', (width, height) => {
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
    const initialAnchors = [...anchors]
    for (const name of solarCaptionNames) {
      expect(initial.some(text => text.value === name)).toBe(true)
      expect(initial.some(text => text.value === celestialDistances[name])).toBe(true)
    }
    for (const text of initial) {
      expect(text.x).toBeGreaterThanOrEqual(0)
      expect(text.x + text.width).toBeLessThanOrEqual(width)
      expect(text.y - text.font).toBeGreaterThanOrEqual(0)
      expect(text.y + 2).toBeLessThan(height - 80)
    }
    initial.forEach((text, index) => {
      for (const other of initial.slice(index + 1)) {
        expect(text.x + text.width <= other.x || other.x + other.width <= text.x ||
          text.y + 2 <= other.y - other.font + 0.001 || other.y + 2 <= text.y - text.font + 0.001).toBe(true)
      }
    })
    for (const time of [10, 40, 80, 160, 240]) {
      texts.length = 0; anchors.length = 0
      renderer.draw(0.43, time, { x: width / 2, y: height / 2 }, false)
      expect(texts).toEqual(initial)
      expect(anchors).not.toEqual(initialAnchors)
    }
    // Zoom/fade can remove a label but must not reflow any remaining slots.
    for (const progress of [0.38, 0.4, 0.48, 0.54, 0.56]) {
      texts.length = 0
      renderer.draw(progress, 40, { x: -10000, y: -10000 }, false)
      for (const text of texts) expect(initial).toContainEqual(text)
    }
  },
)
