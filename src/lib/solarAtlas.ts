import { clamp, planets } from './flightJourney'
import type { AtlasBox } from './mobileAtlas'

export const solarCaptionNames = ['SOL', ...planets.map(planet => planet.en)]

export type SolarLabelAnchor = AtlasBox & { name: string; radius: number }
export type SolarLabelBox = AtlasBox & { name: string }

export function solarLabelStyle(width: number, height: number, mobile: boolean) {
  const font = mobile ? (width < 360 || width > height * 1.4 ? 11 : 12) : width < 1050 || height < 500 ? 13 : 15
  return {
    font, distanceFont: mobile ? Math.max(9, font - 2) : 11,
    bounds: { x: 16, y: Math.max(44, height * 0.21), width: width - 32, height: Math.max(100, Math.min(height * 0.82, height - 88) - Math.max(44, height * 0.21)) },
  }
}

const gapX = 8
const gapY = 6
const epsilon = 0.01
function constrain(box: SolarLabelBox, bounds: AtlasBox) {
  box.x = clamp(box.x, bounds.x, bounds.x + bounds.width - box.width)
  box.y = clamp(box.y, bounds.y, bounds.y + bounds.height - box.height)
}
function intersects(a: AtlasBox, b: AtlasBox) {
  return a.x < b.x + b.width + gapX - epsilon && a.x + a.width + gapX - epsilon > b.x &&
    a.y < b.y + b.height + gapY - epsilon && a.y + a.height + gapY - epsilon > b.y
}
// Find nearby non-overlapping destinations beside the actual planets. Search
// rectangle edges rather than assigning a fixed list or flipping label sides.
function packNearby(boxes: SolarLabelBox[], bounds: AtlasBox) {
  const placed: SolarLabelBox[] = []
  for (const box of [...boxes].sort((a, b) => solarCaptionNames.indexOf(a.name) - solarCaptionNames.indexOf(b.name))) {
    placed.push(nearestFreeBox(box, bounds, placed))
  }
  return boxes.map(box => placed.find(item => item.name === box.name)!)
}

function nearestFreeBox(box: SolarLabelBox, bounds: AtlasBox, placed: SolarLabelBox[]) {
  if (!placed.some(other => intersects(box, other))) return box
  const xs = [box.x, bounds.x, bounds.x + bounds.width - box.width,
    ...placed.flatMap(other => [other.x + other.width + gapX, other.x - box.width - gapX])]
  const ys = [box.y, bounds.y, bounds.y + bounds.height - box.height,
    ...placed.flatMap(other => [other.y + other.height + gapY, other.y - box.height - gapY])]
  let best: SolarLabelBox | undefined; let bestCost = Infinity
  for (const x of xs) for (const y of ys) {
    const candidate = { ...box, x, y }; constrain(candidate, bounds)
    if (placed.some(other => intersects(candidate, other))) continue
    const dx = candidate.x - box.x; const dy = candidate.y - box.y
    const cost = dx * dx * (dx < 0 ? 4 : 2) + dy * dy
    if (cost < bestCost) { best = candidate; bestCost = cost }
  }
  return best ?? box
}

// Damped springs keep captions attached to their planet. Resolve contacts as a
// group so a crowded pair can yield together instead of trapping one caption.
export function createSolarLabelLayout() {
  let previous = new Map<string, SolarLabelBox>()
  const velocities = new Map<string, { x: number; y: number }>()
  return {
    reset() { previous.clear(); velocities.clear() },
    update(anchors: SolarLabelAnchor[], bounds: AtlasBox, dt: number, frozen = false): SolarLabelBox[] {
      const elapsed = clamp(dt, 0, 1 / 15)
      const speed = Math.max(80, bounds.width * 0.08)
      const desired = anchors.map(anchor => {
        const box = { name: anchor.name, x: anchor.x + anchor.radius + 12, y: anchor.y - anchor.height / 2, width: anchor.width, height: anchor.height }
        constrain(box, bounds)
        return box
      })
      const continuing = desired.length > 0 && desired.every(box => previous.has(box.name))
      if (!continuing) {
        const result = packNearby(desired, bounds)
        previous = new Map(result.map(box => [box.name, box]))
        velocities.clear()
        return result
      }
      const result = desired.map(box => ({ ...previous.get(box.name)! }))
      if (frozen || !elapsed) return result
      const substeps = 4
      const step = elapsed / substeps
      for (let substep = 0; substep < substeps; substep++) {
        const before = result.map(box => ({ ...box }))
        result.forEach((box, index) => {
          const velocity = velocities.get(box.name) ?? { x: 0, y: 0 }
          velocity.x += ((desired[index].x - box.x) * 14 - velocity.x * 8) * step
          velocity.y += ((desired[index].y - box.y) * 14 - velocity.y * 8) * step
          const scale = Math.min(1, speed / Math.max(0.001, Math.hypot(velocity.x, velocity.y)))
          box.x += velocity.x * scale * step
          box.y += velocity.y * scale * step
          constrain(box, bounds)
        })
        // Keep padding between both lines of every caption. Small substeps let
        // contacting labels move together without a sudden slot change.
        for (let pass = 0; pass < 20; pass++) {
          let contacts = 0
          for (let i = 0; i < result.length; i++) for (let j = i + 1; j < result.length; j++) {
            const a = result[i]; const b = result[j]
            const dx = a.x + a.width / 2 - b.x - b.width / 2
            const dy = a.y + a.height / 2 - b.y - b.height / 2
            const overlapX = (a.width + b.width) / 2 + gapX - Math.abs(dx)
            const overlapY = (a.height + b.height) / 2 + gapY - Math.abs(dy)
            if (overlapX <= 0 || overlapY <= 0) continue
            contacts++
            const axis = overlapX < overlapY * 0.65 ? 'x' : 'y'
            const shift = (axis === 'x' ? overlapX : overlapY) + 0.02
            const direction = (axis === 'x' ? dx : dy) < 0 ? -1 : 1
            const aStart = a[axis]; const bStart = b[axis]
            a[axis] += direction * shift / 2; b[axis] -= direction * shift / 2
            constrain(a, bounds); constrain(b, bounds)
            const remainder = shift - Math.abs(a[axis] - aStart) - Math.abs(b[axis] - bStart)
            if (remainder > 0) {
              if (Math.abs(a[axis] - aStart) < shift / 2) b[axis] -= direction * remainder
              else a[axis] += direction * remainder
              constrain(a, bounds); constrain(b, bounds)
            }
          }
          if (!contacts) break
        }
        result.forEach((box, index) => velocities.set(box.name, {
          x: (box.x - before[index].x) / step,
          y: (box.y - before[index].y) / step,
        }))
      }
      previous = new Map(result.map(box => [box.name, box]))
      return result
    },
  }
}
