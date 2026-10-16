import { describe, expect, it } from 'vitest'
import { deepSky, flightLayout, moonAngle, orbitalPoint, orbitAngle, planets } from '../src/lib/flightJourney'
import { mobileAtlasCaptions, mobileAtlasFrame } from '../src/lib/mobileAtlas'
import { celestialDistances } from '../src/content/celestialDistances'

const screens = [[320, 495], [375, 594], [390, 771], [430, 859], [667, 302], [844, 305]]
const names = [
  ['EARTH', 'MOON'],
  ['SOL', ...planets.map(p => p.en)],
  ['SOLAR SYSTEM', ...deepSky.galactic.map(p => p.name)],
  ['MILKY WAY', ...deepSky.local.map(p => p.name)],
  ['LOCAL GROUP', ...deepSky.cosmic.map(p => p.name)],
  ['LOCAL GROUP', 'MILKY WAY', ...deepSky.local.map(p => p.name), ...deepSky.cosmic.map(p => p.name)],
]

describe('mobile atlas readability', () => {
  it.each(screens)('fits completed celestial systems across orbit phases at %ipx × %ipx', (width, height) => {
    const frame = mobileAtlasFrame(width, height)
    const check = (x: number, y: number, radius = 0) => {
      const sx = frame.centre.x + x * frame.unit
      const sy = frame.centre.y + y * frame.unit
      expect(sx - radius * frame.unit).toBeGreaterThanOrEqual(frame.scene.x)
      expect(sx + radius * frame.unit).toBeLessThanOrEqual(frame.scene.x + frame.scene.width)
      expect(sy - radius * frame.unit).toBeGreaterThanOrEqual(frame.scene.y)
      expect(sy + radius * frame.unit).toBeLessThanOrEqual(frame.scene.y + frame.scene.height)
    }
    for (let time = 0; time <= 360; time += 6) {
      const earth = flightLayout(0.22, time)
      const moon = orbitalPoint(earth.earthRadius * 2.8, moonAngle(time), 0.52)
      check(earth.earth.x, earth.earth.y, earth.earthRadius)
      check(earth.earth.x + moon.x, earth.earth.y + moon.y, earth.earthRadius * 0.272)
      const solar = flightLayout(0.43, time)
      planets.forEach(planet => {
        const p = orbitalPoint(solar.solarRadius * planet.orbit, orbitAngle(time, planet.years, planet.phase))
        check(solar.solar.x + p.x, solar.solar.y + p.y, solar.solarRadius * planet.radius / 380 * 1.8)
      })
      // Enclose the rotating Milky Way ellipse, including thickness.
      for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
        const p = orbitalPoint(1, angle, 0.56)
        check(p.x, p.y)
      }
    }
    deepSky.local.forEach(p => check(p.x, p.y, p.radius))
    deepSky.cosmic.forEach(p => check(p.x, p.y, 0.09))
    check(0.95, -0.6, 0.09)
    check(0.95, 0.75, 0.09)
    check(-0.86, -0.22, 0.09)
  })

  it.each(screens)('keeps complete English names inside separate caption boxes at %ipx × %ipx', (width, height) => {
    const frame = mobileAtlasFrame(width, height)
    // Consolas is monospaced; use a conservative glyph width for the geometry check.
    const measure = (text: string) => text.length * frame.font * 0.65
    for (const stageNames of names) {
      const captions = mobileAtlasCaptions(stageNames.map(name => ({ name, distance: celestialDistances[name] })), frame.captions, frame.font, measure)
      captions.forEach((caption, index) => {
        const { box, text, lines, lineHeight, distance, distanceFont, distanceY } = caption
        expect(lines.join(' ')).toBe(stageNames[index])
        expect(box.x).toBeGreaterThanOrEqual(0)
        expect(box.x + box.width).toBeLessThanOrEqual(width)
        expect(box.y + box.height).toBeLessThanOrEqual(height - 80)
        expect(box.y + box.height).toBeLessThanOrEqual(frame.captions.y + frame.captions.height)
        lines.forEach(line => expect(text.x + measure(line)).toBeLessThanOrEqual(box.x + box.width))
        expect(text.y - frame.font).toBeGreaterThanOrEqual(box.y)
        expect(text.y + (lines.length - 1) * lineHeight + 2).toBeLessThanOrEqual(box.y + box.height)
        expect(distance).toBeTruthy()
        expect(text.x + distance.length * distanceFont * 0.65).toBeLessThanOrEqual(box.x + box.width)
        expect(distanceY - distanceFont + 0.001).toBeGreaterThanOrEqual(text.y + (lines.length - 1) * lineHeight + 2)
        expect(distanceY + 2).toBeLessThanOrEqual(box.y + box.height + 0.001)
        for (const other of captions.slice(index + 1)) {
          expect(box.x + box.width <= other.box.x || other.box.x + other.box.width <= box.x || box.y + box.height <= other.box.y || other.box.y + other.box.height <= box.y).toBe(true)
        }
      })
    }
  })
})
