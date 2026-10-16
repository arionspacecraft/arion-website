import { clamp, deepSky, ease, flightLayout, mix, moonAngle, orbitalPoint, orbitAngle, particleForce, planets, seededRandom, spinAngle, TAU } from '../lib/flightJourney'
import type { Vector } from '../lib/flightJourney'
import { mobileAtlasCaptions, mobileAtlasFrame } from '../lib/mobileAtlas'
import { celestialDistances } from '../content/celestialDistances'
import { solarCaptionFrame, solarCaptionNames } from '../lib/solarAtlas'

type Label = { name: string; catalog: string; x: number; y: number; radius: number; alpha: number; priority: number }
type Box = { x: number; y: number; width: number; height: number }
type Displacement = { x: number; y: number }
const continents = [
  [[-168, 65], [-130, 72], [-60, 52], [-80, 26], [-98, 16], [-119, 33], [-133, 54]],
  [[-80, 11], [-50, 5], [-35, -10], [-53, -35], [-70, -55], [-76, -25]],
  [[-16, 35], [12, 37], [37, 24], [50, 10], [34, -33], [18, -35], [5, -5], [-16, 10]],
  [[-10, 36], [-10, 59], [32, 71], [70, 77], [180, 60], [145, 38], [120, 21], [108, 5], [78, 8], [65, 27], [38, 35]],
  [[112, -11], [145, -10], [155, -28], [133, -39], [114, -30]],
  [[-53, 59], [-20, 72], [-40, 83], [-62, 79]],
]
function inside(x: number, y: number, polygon: number[][]) {
  let result = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]; const [xj, yj] = polygon[j]
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) result = !result
  }
  return result
}

export function createFlightRenderer(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  let width = 1; let height = 1; let mobile = false
  let pointer: Vector = { x: -10000, y: -10000 }
  let paused = false
  let lastTime = 0
  let step = 1
  let labels: Label[] = []
  let solarLabelsActive = false
  const offsets = new Map<string, Displacement>()
  const random = seededRandom(20261018)
  const stars = Array.from({ length: 180 }, () => ({ x: random(), y: random(), z: random(), phase: random() * TAU }))
  const surface = Array.from({ length: 2400 }, (_, i) => {
    const lat = Math.asin(1 - 2 * (i + 0.5) / 2400)
    const lon = ((i * 2.39996323) % TAU) - Math.PI
    return { lat, lon, noise: random(), land: continents.some(p => inside(lon * 180 / Math.PI, lat * 180 / Math.PI, p)) }
  })
  const spiral = Array.from({ length: 3200 }, (_, i) => {
    const r = Math.pow(random(), 0.7)
    return { r, angle: (i % 4) * Math.PI / 2 + r * 6 + (random() - 0.5) * (0.27 + r * 0.34), z: (random() - 0.5) * 0.06, bright: random(), size: 0.6 + random() * 0.65 }
  })
  const cloud = Array.from({ length: 440 }, () => ({ angle: random() * TAU, r: Math.pow(random(), 2), z: random() - 0.5, size: random() * 0.8 + 0.5 }))
  // A composed cosmic web, with named nodes anchored to the same camera.
  const nodes: Vector[] = [
    { x: -0.32, y: 0.3 }, ...deepSky.cosmic,
    { x: -0.86, y: -0.22 }, { x: -0.8, y: 0.67 }, { x: 0.1, y: 0.7 },
    { x: 0.95, y: -0.6 }, { x: 0.02, y: -0.8 }, { x: 0.95, y: 0.75 },
  ]
  const strands = [[0, 1], [0, 4], [0, 5], [0, 6], [1, 2], [1, 3], [1, 7], [2, 6], [2, 9], [3, 4], [3, 8], [4, 5], [6, 9], [7, 8]]
  const web = strands.flatMap(([a, b], strand) => Array.from({ length: 100 }, (_, i) => {
    const t = random(); const bend = Math.sin(t * Math.PI) * (strand % 2 ? 0.12 : -0.12)
    return { x: mix(nodes[a].x, nodes[b].x, t) + (random() - 0.5) * 0.08, y: mix(nodes[a].y, nodes[b].y, t) + bend + (random() - 0.5) * 0.065, size: i % 13 === 0 ? 1.7 : 0.65 + random() * 0.7 }
  }))

  const mask = document.createElement('canvas'); mask.width = 360; mask.height = 520
  const ink = mask.getContext('2d')!
  ink.fillStyle = 'white'; ink.beginPath()
  ink.moveTo(153, 137); ink.bezierCurveTo(153, 103, 166, 63, 180, 38); ink.bezierCurveTo(194, 63, 207, 103, 207, 137)
  ink.lineTo(207, 352); ink.lineTo(153, 352); ink.closePath(); ink.fill(); ink.beginPath()
  ink.moveTo(153, 278); ink.lineTo(109, 357); ink.lineTo(109, 389); ink.lineTo(153, 348); ink.closePath()
  ink.moveTo(207, 278); ink.lineTo(251, 357); ink.lineTo(251, 389); ink.lineTo(207, 348); ink.closePath(); ink.fill()
  ink.fillRect(162, 357, 36, 15)
  ink.clearRect(153, 137, 54, 5); ink.clearRect(153, 259, 54, 4); ink.clearRect(169, 177, 22, 31)
  const pixels = ink.getImageData(0, 0, 360, 520).data
  const rocket: { x: number; y: number; size: number; bright: boolean }[] = []
  for (let y = 38; y < 373; y += 3) for (let x = 109; x < 252; x += 3) {
    if (pixels[(y * 360 + x) * 4 + 3] > 100) rocket.push({ x: x - 180, y: y - 240, size: random() + 0.5, bright: random() > 0.35 })
  }
  const exhaust = Array.from({ length: 230 }, () => ({ phase: random(), spread: random() - 0.5, size: random() + 0.5 }))

  function dot(id: string, x: number, y: number, radius: number, color: string, alpha = 1) {
    if (alpha < 0.015 || x < -230 || x > width + 230 || y < -230 || y > height + 230) return
    let offset = offsets.get(id)
    if (!offset) { offset = { x: 0, y: 0 }; offsets.set(id, offset) }
    const force = paused ? { x: 0, y: 0 } : particleForce(x, y, pointer, width, id.length * 1.7)
    const damping = 1 - Math.pow(force.x || force.y ? 0.84 : 0.90, step)
    offset.x = paused ? 0 : mix(offset.x, force.x, damping)
    offset.y = paused ? 0 : mix(offset.y, force.y, damping)
    ctx.globalAlpha = clamp(alpha); ctx.fillStyle = color
    ctx.beginPath(); ctx.arc(x + offset.x, y + offset.y, Math.max(0.35, radius), 0, TAU); ctx.fill()
  }
  function glow(x: number, y: number, radius: number, color: string, alpha = 1) {
    if (radius < 1 || x + radius < 0 || x - radius > width || y + radius < 0 || y - radius > height) return
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
    gradient.addColorStop(0, color); gradient.addColorStop(1, 'transparent')
    ctx.globalAlpha = alpha; ctx.fillStyle = gradient; ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
  }
  function annotation(name: string, catalog: string, point: Vector, radius: number, alpha = 1, priority = 5) {
    const fixedSlot = solarLabelsActive && solarCaptionNames.includes(name)
    const onScreen = point.x > 0 && point.x < width && point.y > 45 && point.y < height - 110
    if (alpha > 0.12 && (fixedSlot || onScreen)) labels.push({ name, catalog, ...point, radius, alpha, priority })
  }
  function ring(id: string, centre: Vector, radius: number, flatten: number, alpha: number) {
    if (radius < 6 || radius > width * 7) return
    const count = Math.min(220, Math.max(40, Math.round(radius * 0.8)))
    for (let i = 0; i < count; i++) {
      const p = orbitalPoint(radius, i / count * TAU, flatten)
      dot(`${id}:${i}`, centre.x + p.x, centre.y + p.y, 0.5, '#718dbd', alpha)
    }
  }
  function sphere(id: string, centre: Vector, radius: number, color: string, spin: number, tilt = 0, kind = 'planet', alpha = 1) {
    if (radius < 0.5 || centre.x + radius < -200 || centre.x - radius > width + 200 || centre.y + radius < -100 || centre.y - radius > height + 100) return
    if (radius < 2.5) { dot(`${id}:distant`, centre.x, centre.y, 1, color, alpha * Math.min(radius / 2, 1)); return }
    const stride = radius > 70 ? (mobile ? 2 : 1) : radius > 22 ? 3 : radius > 8 ? 9 : 22
    const cos = Math.cos(-tilt); const sin = Math.sin(-tilt)
    for (let i = 0; i < surface.length; i += stride) {
      const p = surface[i]; const longitude = p.lon + spin
      let px = Math.cos(p.lat) * Math.sin(longitude)
      let py = -Math.sin(p.lat)
      let z = Math.cos(p.lat) * Math.cos(longitude)
      if (kind === 'moon') {
        px = Math.cos(p.lat) * Math.cos(longitude)
        py = -Math.cos(p.lat) * Math.sin(longitude) * 0.52 - Math.sin(p.lat) * 0.854
        z = Math.cos(p.lat) * Math.sin(longitude) * 0.854 - Math.sin(p.lat) * 0.52
      }
      if (z < 0) continue
      const tint = kind === 'earth' ? (p.land ? '#96e5db' : p.noise > 0.9 ? '#e2f2ff' : '#5d91d6') : kind === 'sun' ? (p.noise > 0.7 ? '#fff0ce' : '#eab676') : color
      const brightness = (0.32 + z * 0.68) * (0.6 + p.noise * 0.4)
      const size = Math.min(1.9, Math.max(0.5, radius * (kind === 'earth' && p.land ? 0.009 : 0.006)))
      dot(`${id}:${i}`, centre.x + (px * cos - py * sin) * radius, centre.y + (px * sin + py * cos) * radius, size, tint, brightness * alpha)
    }
    if (kind === 'earth') glow(centre.x, centre.y, radius * 1.2, '#4e90ff0c', alpha)
  }
  function galaxy(id: string, centre: Vector, radius: number, time: number, tilt = -0.22, irregular = false) {
    if (radius < 0.8 || radius > width * 6 || centre.x + radius < -100 || centre.x - radius > width + 100 || centre.y + radius < -100 || centre.y - radius > height + 100) return
    const stride = radius > 120 ? (mobile ? 2 : 1) : radius > 25 ? 5 : 16
    const spin = time * 0.035
    const cos = Math.cos(tilt); const sin = Math.sin(tilt)
    for (let i = 0; i < spiral.length; i += stride) {
      const s = spiral[i]
      const angle = s.angle + spin / (0.6 + s.r * 0.4) + (irregular ? s.bright * 4 : 0)
      const px = Math.cos(angle) * s.r * radius
      const py = (Math.sin(angle) * s.r * 0.53 + s.z) * radius
      dot(`${id}:${i}`, centre.x + px * cos - py * sin, centre.y + px * sin + py * cos, s.size * Math.min(1.2, Math.max(0.6, radius / 200)), s.r < 0.2 ? '#eee2cc' : s.bright > 0.8 ? '#b9c3ff' : '#8baef0', 0.65)
    }
    for (let i = 0; i < cloud.length; i += mobile ? 3 : 2) {
      const s = cloud[i]; const a = s.angle + spin
      const px = Math.cos(a) * s.r * radius * 0.18; const py = Math.sin(a) * s.r * radius * 0.06
      dot(`${id}:core:${i}`, centre.x + px * cos - py * sin, centre.y + px * sin + py * cos, 0.6, '#e7d8bd', 0.5)
    }
  }
  function cluster(id: string, centre: Vector, radius: number, color: string) {
    for (let i = 0; i < cloud.length; i += mobile ? 3 : 2) {
      const s = cloud[i]
      dot(`${id}:${i}`, centre.x + Math.cos(s.angle) * s.r * radius, centre.y + Math.sin(s.angle) * s.r * radius * 0.65, s.size, color, 0.6)
    }
  }
  function drawRocket(progress: number, time: number, centre: Vector, unit: number) {
    const departure = ease(0.01, 0.21, progress)
    const scale = mix(Math.min(unit / 270, 1.15), mobile ? 0.16 : 0.22, departure)
    // Foreground flight marker remains visible at EVERY scale; it is not to scale.
    const x = centre.x + unit * (0.48 * departure + Math.sin(time * 0.32) * 0.025 * departure)
    const y = centre.y - unit * (0.69 * departure + Math.cos(time * 0.27) * 0.02 * departure)
    const angle = 0.4 + departure * 0.30 + Math.sin(time * 0.25) * 0.035 * departure
    const cos = Math.cos(angle); const sin = Math.sin(angle)
    for (let i = 0; i < rocket.length; i += mobile ? 2 : 1) {
      const p = rocket[i]
      dot(`rocket:${i}`, x + (p.x * cos - p.y * sin) * scale, y + (p.x * sin + p.y * cos) * scale, Math.max(0.45, p.size * scale), p.bright ? '#e5f1ff' : '#8fb7f6', 0.95)
    }
    for (let i = 0; i < exhaust.length; i += mobile ? 2 : 1) {
      const p = exhaust[i]; const travel = (p.phase + time * 0.75) % 1
      const length = 140 + departure * 340
      const px = p.spread * (1 - travel) * (25 + departure * 20) * scale
      const py = (135 + travel * length) * scale
      dot(`exhaust:${i}`, x + px * cos - py * sin, y + px * sin + py * cos, p.size * (0.6 + scale * 0.4), '#9ecaff', (1 - travel) * 0.85)
    }
    if (departure > 0.8 && !mobile) annotation('ARION', 'FLIGHT IN PROGRESS', { x, y: y - 160 * scale }, 3, 0.85, 0)
  }

  function drawCaptionLabels(items: Label[], frame: ReturnType<typeof solarCaptionFrame>, names = items.map(item => item.name)) {
    ctx.font = `500 ${frame.font}px Consolas, monospace`
    const captions = mobileAtlasCaptions(names.map(name => ({ name, distance: celestialDistances[name] ?? '' })), frame.captions, frame.font, text => ctx.measureText(text).width)
    const entries = items.map(item => ({ item, caption: captions[names.indexOf(item.name)] }))
    // Draw every leader first; opaque caption backs keep lines and particles
    // out of the names, including long names which wrap instead of shrinking.
    entries.forEach(({ item, caption }) => {
      if (item.x < 0 || item.x > width || item.y < 0 || item.y > height) return
      const box = caption.box
      const endX = clamp(item.x, box.x, box.x + box.width)
      const endY = box.y + box.height / 2
      const angle = Math.atan2(endY - item.y, endX - item.x)
      ctx.globalAlpha = item.alpha * 0.55
      ctx.strokeStyle = '#8fafd0'; ctx.lineWidth = 0.5; ctx.beginPath()
      ctx.moveTo(item.x + Math.cos(angle) * item.radius, item.y + Math.sin(angle) * item.radius)
      ctx.lineTo(endX, endY); ctx.stroke()
    })
    entries.forEach(({ item, caption }) => {
      const { box, text, lines, lineHeight, distance, distanceFont, distanceY } = caption
      ctx.globalAlpha = item.alpha
      ctx.fillStyle = '#050a18'; ctx.fillRect(box.x, box.y, box.width, box.height)
      ctx.fillStyle = '#dbeaff'; ctx.font = `500 ${frame.font}px Consolas, monospace`
      lines.forEach((line, row) => ctx.fillText(line, text.x, text.y + row * lineHeight))
      ctx.fillStyle = '#91b7d8'; ctx.font = `500 ${distanceFont}px Consolas, monospace`
      ctx.fillText(distance, text.x, distanceY)
    })
    if (items.length) {
      ctx.globalAlpha = Math.max(...items.map(item => item.alpha))
      ctx.fillStyle = '#91b7d8'; ctx.font = '500 9px Consolas, monospace'
      ctx.fillText('DISTANCE FROM EARTH', frame.captions.x + 6, frame.captions.y - 6)
    }
  }

  function drawLabels() {
    if (solarLabelsActive) {
      drawCaptionLabels(labels.filter(item => solarCaptionNames.includes(item.name)), solarCaptionFrame(width, height, mobile), solarCaptionNames)
      return
    }
    if (mobile) {
      drawCaptionLabels(labels.sort((a, b) => a.priority - b.priority), mobileAtlasFrame(width, height))
      return
    }
    const occupied: Box[] = []
    const minX = mobile ? 16 : width * 0.29
    const minY = 40
    const maxY = height - (mobile ? 100 : 90)
    const font = mobile ? 12 : 15
    for (const item of labels.sort((a, b) => a.priority - b.priority)) {
      const distance = celestialDistances[item.name]
      ctx.font = `500 ${font}px Consolas, monospace`
      const textWidth = Math.min(width - minX - 22, Math.max(ctx.measureText(item.name).width + 8, ctx.measureText(item.catalog).width * 0.73, ctx.measureText(distance ? `${distance} · FROM EARTH` : '').width * 0.73))
      const labelHeight = distance ? 55 : 40
      const gap = Math.min(item.radius, 65) + 14
      const candidates = [
        { x: item.x + gap, y: item.y - gap - 10 },
        { x: item.x - gap - textWidth, y: item.y - gap - 10 },
        { x: item.x + gap, y: item.y + gap },
        { x: item.x - gap - textWidth, y: item.y + gap },
      ]
      let selected: Box | undefined
      for (let offset = 0; offset < 4 && !selected; offset++) {
        for (const candidate of candidates) {
          const box = { x: clamp(candidate.x, minX, width - textWidth - 18), y: clamp(candidate.y + offset * (labelHeight + 5), minY, maxY - labelHeight), width: textWidth, height: labelHeight }
          if (!occupied.some(other => box.x < other.x + other.width + 12 && box.x + box.width + 12 > other.x && box.y < other.y + other.height + 8 && box.y + box.height + 8 > other.y)) { selected = box; break }
        }
      }
      if (!selected) continue
      occupied.push(selected)
      ctx.globalAlpha = item.alpha
      const endX = clamp(item.x, selected.x, selected.x + selected.width)
      const endY = selected.y + 5
      const angle = Math.atan2(endY - item.y, endX - item.x)
      const anchorR = Math.min(item.radius, Math.hypot(endX - item.x, endY - item.y) * 0.45)
      // The anchor is the projected body centre/rim, not a fixed screen offset.
      ctx.strokeStyle = '#8fafd06e'; ctx.lineWidth = 0.65; ctx.beginPath()
      ctx.moveTo(item.x + Math.cos(angle) * anchorR, item.y + Math.sin(angle) * anchorR)
      ctx.lineTo(endX, endY); ctx.stroke()
      ctx.shadowColor = '#020411'; ctx.shadowBlur = 7
      ctx.fillStyle = '#e4efff'; ctx.font = `500 ${font}px Consolas, monospace`
      ctx.fillText(item.name, selected.x, selected.y + font)
      ctx.fillStyle = '#a4badb'; ctx.font = '500 11px Consolas, monospace'
      if (distance) ctx.fillText(distance === 'EARTH IS INSIDE' ? distance : `${distance} · FROM EARTH`, selected.x, selected.y + font + 15, textWidth)
      ctx.fillStyle = '#8293ad'
      ctx.fillText(item.catalog, selected.x, selected.y + font + (distance ? 30 : 15), textWidth)
      ctx.shadowBlur = 0
    }
  }

  return {
    draw(progress: number, time: number, mouse: Vector, frozen: boolean) {
      pointer = mouse; paused = frozen; step = clamp((time - lastTime) * 30, 0.5, 3); lastTime = time; labels = []
      solarLabelsActive = progress >= 0.38 && progress <= 0.58
      ctx.globalAlpha = 1; ctx.clearRect(0, 0, width, height)
      // Fit mobile systems and captions without changing desktop composition.
      const mobileFrame = mobileAtlasFrame(width, height)
      const fit = ease(0.04, 0.20, progress)
      const centre = mobile
        ? { x: mix(width * 0.52, mobileFrame.centre.x, fit), y: mix(height * 0.57, mobileFrame.centre.y, fit) }
        : { x: width * 0.61, y: height * 0.52 }
      const unit = mobile ? mix(Math.min(width * 0.58, height * 0.54), mobileFrame.unit, fit) : Math.min(width * 0.35, height * 0.64)
      const background = ctx.createRadialGradient(centre.x, centre.y, 0, centre.x, centre.y, width * 0.8)
      background.addColorStop(0, '#030627'); background.addColorStop(0.65, '#050916'); background.addColorStop(1, '#06080e')
      ctx.fillStyle = background; ctx.fillRect(0, 0, width, height)
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i]
        const flow = time * (2 + s.z * 4) * ease(0, 0.15, progress)
        dot(`star:${i}`, (s.x * width - flow * 0.45 + width * 100) % width, (s.y * height + flow) % height, 0.4 + s.z * 0.65, '#8faacc', 0.18 + s.z * 0.22)
      }
      const layout = flightLayout(progress, time)
      const screen = (p: Vector): Vector => ({ x: centre.x + p.x * unit, y: centre.y + p.y * unit })
      const earth = screen(layout.earth); const solar = screen(layout.solar); const milky = screen(layout.galaxy); const local = screen(layout.local); const cosmic = screen(layout.cosmic)
      const er = layout.earthRadius * unit; const sr = layout.solarRadius * unit; const gr = layout.galaxyRadius * unit; const lr = layout.localRadius * unit; const cr = layout.cosmicRadius * unit

      // Start mobile neighbouring structures with their zoom so distant fragments
      // cannot intrude into the caption area of a completed smaller-scale view.
      if ((!mobile || progress > 0.85) && cr < width * 7) {
        for (let i = 0; i < web.length; i += mobile ? 2 : 1) dot(`web:${i}`, cosmic.x + web[i].x * cr, cosmic.y + web[i].y * cr, web[i].size, '#9eaef0', 0.55)
        for (let i = 0; i < nodes.length; i++) cluster(`cluster:${i}`, { x: cosmic.x + nodes[i].x * cr, y: cosmic.y + nodes[i].y * cr }, cr * 0.09, '#bac4ed')
        const amount = ease(0.88, 0.97, progress)
        for (const item of deepSky.cosmic) annotation(item.name, item.catalog, { x: cosmic.x + item.x * cr, y: cosmic.y + item.y * cr }, cr * 0.04, amount, 3)
        annotation('LOCAL GROUP', 'OUR GALACTIC NEIGHBOURHOOD', local, 4, amount, 2)
      }
      if ((!mobile || progress > 0.68) && lr < width * 8) {
        for (const item of deepSky.local) {
          const p = { x: local.x + item.x * lr, y: local.y + item.y * lr }
          galaxy(item.name, p, item.radius * lr, time, item.tilt, item.catalog.startsWith('LMC'))
          annotation(item.name, item.catalog, p, item.radius * lr * 0.5, ease(0.73, 0.81, progress) * (1 - ease(0.87, 0.95, progress)), 3)
        }
      }
      if (!mobile || progress > 0.46) galaxy('milky-way', milky, gr, time)
      const galacticLabels = ease(0.58, 0.64, progress) * (1 - ease(0.69, 0.78, progress))
      const sunMark = { x: solar.x, y: solar.y }
      annotation('SOLAR SYSTEM', 'ORION SPUR · YOU ARE HERE', sunMark, 3, galacticLabels, 1)
      for (const item of deepSky.galactic) {
        const p = orbitalPoint(gr * Math.hypot(item.x, item.y), Math.atan2(-item.y / 0.53, item.x) + time * 0.035, 0.53)
        const point = { x: milky.x + p.x, y: milky.y + p.y }
        if (galacticLabels > 0.01) {
          if (item.name === 'OMEGA CENTAURI') cluster('omega', point, Math.max(4, gr * 0.025), '#d6cbe3')
          else dot(item.name, point.x, point.y, 1.6, '#e5dbef', galacticLabels)
        }
        annotation(item.name, item.catalog, point, 2, galacticLabels, 3)
      }
      annotation('MILKY WAY', 'OUR HOME GALAXY', milky, gr * 0.3, ease(0.72, 0.8, progress) * (1 - ease(0.88, 0.95, progress)), 2)

      // Neighbouring planets only enter once we leave the Earth–Moon view.
      if (progress > 0.26 && sr < width * 30 && sr > 1) {
        const orbitOpacity = 0.26 * (1 - ease(0.49, 0.66, progress))
        for (let i = 0; i < planets.length; i++) {
          const planet = planets[i]
          ring(`orbit:${i}`, solar, sr * planet.orbit, 0.5, orbitOpacity)
          if (i === 2) continue
          const p = orbitalPoint(sr * planet.orbit, orbitAngle(time, planet.years, planet.phase))
          const point = { x: solar.x + p.x, y: solar.y + p.y }
          const radius = sr * planet.radius / 380
          sphere(planet.en, point, radius, planet.color, spinAngle(time, planet.hours), planet.tilt)
          if (i === 5 || i === 6) ring(`ring:${i}`, point, radius * 1.8, 0.36, 0.75)
          annotation(planet.en, `PLANET ${String(i + 1).padStart(2, '0')}`, point, radius, ease(0.34, 0.42, progress) * (1 - ease(0.48, 0.57, progress)), i + 4)
        }
        sphere('sun', solar, sr * 0.047, '#eebf86', time * 0.14, 0, 'sun')
        glow(solar.x, solar.y, Math.min(sr * 0.13, unit), '#e9ac4e0e')
        annotation('SOL', 'THE SUN · G2 V', solar, sr * 0.047, ease(0.32, 0.42, progress) * (1 - ease(0.49, 0.58, progress)), 1)
      }
      if (er > 0.4) {
        const orbit = orbitalPoint(er * 2.8, moonAngle(time), 0.52)
        const moon = { x: earth.x + orbit.x, y: earth.y + orbit.y }
        ring('lunar-orbit', earth, er * 2.8, 0.52, 0.3)
        const drawMoon = () => sphere('moon', moon, er * 0.272, '#c6cfdd', moonAngle(time), 0.22, 'moon')
        if (moon.y < earth.y) drawMoon()
        sphere('earth', earth, er, '#71b1f4', time * 0.22 - 0.3, 0.41, 'earth')
        if (moon.y >= earth.y) drawMoon()
        annotation('EARTH', 'TERRA · OUR ORIGIN', earth, er, ease(0.13, 0.19, progress) * (1 - ease(0.49, 0.57, progress)), 1)
        annotation('MOON', 'LUNA · TIDALLY LOCKED', moon, er * 0.272, ease(0.14, 0.20, progress) * (1 - ease(0.28, 0.38, progress)), 2)
      }
      if (progress < 0.14) for (let i = 0; i < 3; i++) ring(`launch-orbit:${i}`, centre, unit * (0.65 + i * 0.17), 0.43, 0.3 * (1 - ease(0.02, 0.14, progress)))
      drawRocket(progress, time, centre, unit)
      drawLabels()
      ctx.globalAlpha = 1
    },
    resize() {
      width = Math.max(1, canvas.clientWidth); height = Math.max(1, canvas.clientHeight)
      mobile = width <= 700 || (width <= 950 && height <= 500)
      const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2)
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      offsets.clear()
    },
  }
}
