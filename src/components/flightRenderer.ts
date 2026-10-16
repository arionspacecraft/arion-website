import { ease, mix, moonAngle, orbitAngle, planets, seededRandom, spinAngle, TAU } from '../lib/flightJourney'

type Point = { x: number; y: number }
type SurfacePoint = { lon: number; lat: number; size: number; land: boolean; cloud: boolean }

// Coarse cartographic outlines, sampled onto a rotating sphere (no image downloads).
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
    const [xi, yi] = polygon[i]
    const [xj, yj] = polygon[j]
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) result = !result
  }
  return result
}

export function createFlightRenderer(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const random = seededRandom(20261017)
  let width = 1
  let height = 1
  let mobile = false
  const stars = Array.from({ length: 230 }, () => ({ x: random(), y: random(), size: random() * 1.2 + 0.2, phase: random() * TAU }))
  const galaxy = Array.from({ length: 2900 }, (_, i) => {
    const r = Math.pow(random(), 0.65)
    const arm = i % 4
    const angle = arm * Math.PI / 2 + r * 6 + (random() - 0.5) * (0.28 + r * 0.28)
    return { r, angle, z: (random() - 0.5) * (1 - r) * 0.10, size: random() * 1.4 + 0.4, warm: random() < 0.20 }
  })
  const surface: SurfacePoint[] = []
  for (let lat = -84; lat <= 84; lat += 4) {
    for (let lon = -180; lon < 180; lon += 4 / Math.cos(lat * Math.PI / 180)) {
      surface.push({ lon: lon * Math.PI / 180, lat: lat * Math.PI / 180, size: random() * 0.5 + 0.7, land: continents.some(polygon => inside(lon, lat, polygon)), cloud: random() > 0.87 })
    }
  }
  const craters = Array.from({ length: 24 }, () => ({ lon: random() * TAU, lat: (random() - 0.5) * 2.5, size: random() * 0.1 + 0.04 }))

  // Retain the homepage's original particle rocket silhouette and broad repulsion.
  const mask = document.createElement('canvas')
  mask.width = 360; mask.height = 520
  const ink = mask.getContext('2d')!
  ink.fillStyle = 'white'
  ink.beginPath()
  ink.moveTo(153, 137); ink.bezierCurveTo(153, 103, 166, 63, 180, 38)
  ink.bezierCurveTo(194, 63, 207, 103, 207, 137)
  ink.lineTo(207, 352); ink.lineTo(153, 352); ink.closePath(); ink.fill()
  ink.beginPath()
  ink.moveTo(153, 278); ink.lineTo(109, 357); ink.lineTo(109, 389); ink.lineTo(153, 348); ink.closePath()
  ink.moveTo(207, 278); ink.lineTo(251, 357); ink.lineTo(251, 389); ink.lineTo(207, 348); ink.closePath(); ink.fill()
  ink.fillRect(162, 357, 36, 15)
  ink.beginPath(); ink.moveTo(165, 380); ink.quadraticCurveTo(161, 432, 180, 479); ink.quadraticCurveTo(199, 432, 195, 380); ink.fill()
  ink.clearRect(153, 137, 54, 5); ink.clearRect(153, 259, 54, 4); ink.clearRect(169, 177, 22, 31)
  const pixels = ink.getImageData(0, 0, 360, 520).data
  const rocket: { x: number; y: number; dx: number; dy: number; size: number; phase: number; bright: boolean }[] = []
  for (let y = 38; y < 480; y += 3) {
    for (let x = 109; x < 252; x += 3) {
      if (pixels[(y * 360 + x) * 4 + 3] < 100 || (y > 380 && random() < (y - 370) / 130)) continue
      rocket.push({ x: x - 180, y: y - 260, dx: 0, dy: 0, size: random() + 0.65, phase: random() * TAU, bright: random() > 0.36 })
    }
  }

  function circle(x: number, y: number, r: number, color: string | CanvasGradient) {
    if (r <= 0) return
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill()
  }
  function glow(x: number, y: number, radius: number, color: string) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
    gradient.addColorStop(0, color); gradient.addColorStop(1, 'transparent')
    circle(x, y, radius, gradient)
  }
  function label(text: string, x: number, y: number, alpha = 1, color = '#9fb4d5') {
    ctx.save(); ctx.globalAlpha *= alpha
    ctx.font = `${mobile ? 8 : 9}px Consolas, monospace`; ctx.fillStyle = color
    ctx.fillText(text, x, y); ctx.restore()
  }
  function ellipse(x: number, y: number, rx: number, ry: number, color: string, rotation = -0.22) {
    ctx.strokeStyle = color; ctx.lineWidth = 0.65
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rotation, 0, TAU); ctx.stroke()
  }
  function orbitPoint(cx: number, cy: number, radius: number, angle: number, flatten = 0.5): Point {
    const x = Math.cos(angle) * radius
    const y = -Math.sin(angle) * radius * flatten
    return { x: cx + x * Math.cos(-0.22) - y * Math.sin(-0.22), y: cy + x * Math.sin(-0.22) + y * Math.cos(-0.22) }
  }

  function earth(x: number, y: number, r: number, time: number) {
    glow(x, y, r * 1.28, '#487ddc38')
    circle(x, y, r, '#102d5a')
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.41)
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.clip()
    const rotation = time * 0.22 - 0.3
    for (const point of surface) {
      const longitude = point.lon + rotation
      const z = Math.cos(point.lat) * Math.cos(longitude)
      if (z < 0) continue
      const px = Math.cos(point.lat) * Math.sin(longitude) * r
      const py = -Math.sin(point.lat) * r
      ctx.fillStyle = point.land ? '#7abfc0' : point.cloud ? '#b9d3e1' : '#22507d'
      const size = Math.max(0.6, r * (point.land ? 0.037 : 0.012) * point.size * (0.4 + z * 0.6))
      ctx.fillRect(px, py, size, size)
    }
    const shade = ctx.createLinearGradient(-r, -r * 0.3, r, r * 0.3)
    shade.addColorStop(0, '#c8e8ff20'); shade.addColorStop(0.4, '#07102000'); shade.addColorStop(1, '#01030bea')
    circle(0, 0, r, shade)
    ctx.restore()
    ctx.strokeStyle = '#87c8f066'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke()
  }
  function moon(x: number, y: number, r: number, angle: number) {
    circle(x, y, r, '#a3adbf')
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip()
    // Project surface landmarks in the orbital plane. A landmark at longitude PI
    // always points toward Earth: its axial angle equals its orbital angle.
    for (const crater of craters) {
      const longitude = crater.lon + angle
      const px = Math.cos(crater.lat) * Math.cos(longitude)
      const py = -Math.cos(crater.lat) * Math.sin(longitude) * 0.52 - Math.sin(crater.lat) * 0.854
      const z = Math.cos(crater.lat) * Math.sin(longitude) * 0.854 - Math.sin(crater.lat) * 0.52
      if (z < 0) continue
      circle(x + (px * Math.cos(-0.22) - py * Math.sin(-0.22)) * r, y + (px * Math.sin(-0.22) + py * Math.cos(-0.22)) * r, crater.size * r, '#667284')
    }
    const shade = ctx.createLinearGradient(x - r, y - r, x + r, y + r)
    shade.addColorStop(0, '#d9e4f230'); shade.addColorStop(0.4, 'transparent'); shade.addColorStop(1, '#060a16ef')
    circle(x, y, r, shade); ctx.restore()
  }
  function planetBody(index: number, x: number, y: number, r: number, time: number) {
    const planet = planets[index]
    if (index === 2) { earth(x, y, r, time); return }
    ctx.save(); ctx.translate(x, y); ctx.rotate(-planet.tilt)
    if (index === 5 || index === 6) ellipse(0, 0, r * 1.9, r * 0.45, index === 5 ? '#c6b89c88' : '#a7d5df55', 0)
    circle(0, 0, r, planet.color)
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.clip()
    if (index >= 4) {
      for (let band = -3; band <= 3; band++) {
        ctx.fillStyle = band % 2 ? '#745d5533' : '#ffffff22'
        ctx.fillRect(-r, band * r / 4, r * 2, r * 0.12)
      }
    }
    const spin = spinAngle(time, planet.hours)
    for (let spot = 0; spot < 4; spot++) {
      const angle = spin + spot * TAU / 4
      if (Math.cos(angle) < 0) continue
      ctx.fillStyle = index === 4 ? '#9e685f' : '#ffffff50'
      ctx.beginPath(); ctx.ellipse(Math.sin(angle) * r * 0.86, r * 0.2, Math.max(0.3, r * 0.23 * Math.cos(angle)), r * 0.12, 0, 0, TAU); ctx.fill()
    }
    const shade = ctx.createLinearGradient(-r, -r, r, r)
    shade.addColorStop(0, '#ffffff30'); shade.addColorStop(0.35, 'transparent'); shade.addColorStop(1, '#010410ee')
    circle(0, 0, r, shade)
    ctx.restore(); ctx.restore()
  }

  function drawRocket(x: number, y: number, scale: number, angle: number, time: number, ignition: number, pointer: Point, paused: boolean, alpha = 1) {
    ctx.save(); ctx.globalAlpha *= alpha
    const cos = Math.cos(angle); const sin = Math.sin(angle)
    if (ignition > 0 && scale > 0.1) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(angle)
      const length = (100 + ignition * 230) * scale
      const fire = ctx.createLinearGradient(0, 112 * scale, 0, 112 * scale + length)
      fire.addColorStop(0, '#e6f1ffcc'); fire.addColorStop(0.2, '#8cb6ff70'); fire.addColorStop(1, '#4270ff00')
      ctx.fillStyle = fire; ctx.beginPath(); ctx.moveTo(-13 * scale, 112 * scale)
      ctx.quadraticCurveTo(-30 * scale, 200 * scale, 0, 112 * scale + length * (0.95 + 0.05 * Math.sin(time * 14)))
      ctx.quadraticCurveTo(30 * scale, 200 * scale, 13 * scale, 112 * scale); ctx.fill(); ctx.restore()
    }
    const interactionRadius = Math.min(240, width * 0.46)
    for (let i = 0; i < rocket.length; i += mobile ? 2 : 1) {
      const point = rocket[i]
      const px = x + (point.x * cos - point.y * sin) * scale
      const py = y + (point.x * sin + point.y * cos) * scale
      const dx = px - pointer.x; const dy = py - pointer.y
      const distance = Math.hypot(dx, dy)
      const force = !paused && distance < interactionRadius ? Math.pow(1 - distance / interactionRadius, 0.7) * Math.min(175, width * 0.3) * (1 - ignition) : 0
      const direction = distance > 0.1 ? Math.atan2(dy, dx) : point.phase
      if (paused) { point.dx = 0; point.dy = 0 }
      else {
        point.dx += (Math.cos(direction) * force - point.dx) * (force > 0 ? 0.14 : 0.055)
        point.dy += (Math.sin(direction) * force - point.dy) * (force > 0 ? 0.14 : 0.055)
      }
      ctx.fillStyle = point.bright ? '#dbeaff' : '#7196d5'
      const size = Math.max(0.7, point.size * Math.min(scale, 1.1))
      ctx.fillRect(px + point.dx, py + point.dy + (paused ? 0 : Math.sin(time + point.phase) * 0.6), size, size)
    }
    ctx.restore()
  }

  function draw(progress: number, time: number, pointer: Point, paused: boolean) {
    ctx.clearRect(0, 0, width, height)
    const cx = width * (mobile ? 0.5 : 0.67)
    const cy = height * (mobile ? 0.56 : 0.48)
    const unit = Math.min(width * (mobile ? 0.45 : 0.31), height * (height < 530 ? (mobile ? 0.24 : 0.32) : (mobile ? 0.30 : 0.47)))
    const background = ctx.createRadialGradient(cx, cy, 0, cx, cy, width * 0.72)
    background.addColorStop(0, '#030627'); background.addColorStop(0.65, '#050916'); background.addColorStop(1, '#06080e')
    ctx.fillStyle = background; ctx.fillRect(0, 0, width, height)
    for (const star of stars) {
      ctx.fillStyle = `rgba(174,199,237,${0.12 + (Math.sin(time * 0.3 + star.phase) + 1) * 0.18})`
      ctx.fillRect((star.x * width + progress * star.size * 22) % width, (star.y * height + progress * star.size * 45) % height, star.size, star.size)
    }

    // The galaxy grows into view while the solar system shrinks to its position.
    const galaxyIn = ease(0.72, 0.94, progress)
    const galaxyScale = mix(1.7, 1, galaxyIn)
    const galaxyRadius = unit * 1.03 * galaxyScale
    const galacticAngle = time * 0.045
    const sunInGalaxy = orbitPoint(cx, cy, galaxyRadius * 0.6, galacticAngle + 0.65, 0.53)
    if (galaxyIn > 0) {
      ctx.save(); ctx.globalAlpha = galaxyIn
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.25); ctx.scale(1, 0.53)
      glow(0, 0, galaxyRadius * 0.95, '#5864d125')
      for (let arm = 0; arm < 4; arm++) {
        ctx.beginPath()
        for (let i = 1; i <= 70; i++) {
          const r = i / 70
          const a = arm * Math.PI / 2 + r * 6 + galacticAngle / (0.6 + r * 0.4)
          const x = Math.cos(a) * r * galaxyRadius; const y = Math.sin(a) * r * galaxyRadius
          if (i === 1) ctx.moveTo(x, y); else ctx.lineTo(x, y)
        }
        ctx.lineWidth = galaxyRadius * 0.055; ctx.strokeStyle = '#8b9ee30a'; ctx.stroke()
      }
      for (let i = 0; i < galaxy.length; i += mobile ? 2 : 1) {
        const star = galaxy[i]
        const angle = star.angle + galacticAngle / (0.6 + star.r * 0.4)
        const x = Math.cos(angle) * star.r * galaxyRadius
        const y = Math.sin(angle) * star.r * galaxyRadius + star.z * galaxyRadius
        ctx.fillStyle = star.warm ? '#ebd3bb99' : star.r < 0.3 ? '#e5deefbb' : '#9cbaff99'
        ctx.fillRect(x, y, star.size * galaxyScale, star.size * galaxyScale)
      }
      ctx.save(); ctx.rotate(galacticAngle)
      const bar = ctx.createRadialGradient(0, 0, 0, 0, 0, galaxyRadius * 0.3)
      bar.addColorStop(0, '#fff4dbcc'); bar.addColorStop(0.28, '#d7c1c280'); bar.addColorStop(1, 'transparent')
      ctx.scale(1, 0.5); circle(0, 0, galaxyRadius * 0.3, bar); ctx.restore()
      glow(0, 0, galaxyRadius * 0.15, '#f9eadacc'); ctx.restore()
      circle(sunInGalaxy.x, sunInGalaxy.y, 3, '#dfeaff')
      ellipse(sunInGalaxy.x, sunInGalaxy.y, 8, 8, '#b2ceff99', 0)
      ctx.strokeStyle = '#8caccb88'; ctx.beginPath(); ctx.moveTo(sunInGalaxy.x + 8, sunInGalaxy.y); ctx.lineTo(sunInGalaxy.x + 26, sunInGalaxy.y - 24); ctx.lineTo(sunInGalaxy.x + 65, sunInGalaxy.y - 24); ctx.stroke()
      label('WE ARE HERE', sunInGalaxy.x + 28, sunInGalaxy.y - 32)
      label('태양계', sunInGalaxy.x + 28, sunInGalaxy.y - 10, 1, '#dceaff')
      label('MILKY WAY / OUR GALAXY', cx - unit * 0.5, cy + unit * 0.68)
      ctx.restore()
    }

    const solarIn = ease(0.41, 0.59, progress)
    const solarOut = ease(0.72, 0.9, progress)
    const solarRadius = unit * mix(1.4, 1, solarIn) * mix(1, 0.008, solarOut)
    const sx = mix(cx, sunInGalaxy.x, solarOut)
    const sy = mix(cy, sunInGalaxy.y, solarOut)
    const earthPlanet = planets[2]
    const solarEarth = orbitPoint(sx, sy, solarRadius * earthPlanet.orbit, orbitAngle(time, earthPlanet.years, earthPlanet.phase))
    if (solarIn > 0 && solarOut < 1) {
      ctx.save(); ctx.globalAlpha = solarIn * (1 - solarOut)
      for (const planet of planets) ellipse(sx, sy, solarRadius * planet.orbit, solarRadius * planet.orbit * 0.5, '#8d9ec344')
      const sunRadius = Math.max(1, solarRadius * 0.047)
      glow(sx, sy, sunRadius * 5, '#f3ad5455')
      const sun = ctx.createRadialGradient(sx - sunRadius * 0.3, sy - sunRadius * 0.3, 0, sx, sy, sunRadius)
      sun.addColorStop(0, '#fff6d4'); sun.addColorStop(0.6, '#f7ce83'); sun.addColorStop(1, '#c77c41')
      circle(sx, sy, sunRadius, sun)
      for (let spot = 0; spot < 3; spot++) {
        const angle = time * 0.14 + spot * TAU / 3
        if (Math.cos(angle) > 0) circle(sx + Math.sin(angle) * sunRadius * 0.75, sy + sunRadius * (spot - 1) * 0.3, sunRadius * 0.09 * Math.cos(angle), '#b2744866')
      }
      if (solarOut < 0.4) label('SUN', sx + sunRadius + 8, sy - sunRadius, 1 - solarOut)
      for (let i = 0; i < planets.length; i++) {
        const planet = planets[i]
        const position = orbitPoint(sx, sy, solarRadius * planet.orbit, orbitAngle(time, planet.years, planet.phase))
        const radius = planet.radius * (mobile ? 0.75 : 1) * (1 - solarOut)
        // Earth transitions from the close-up instead of appearing twice.
        if (i !== 2 || progress >= 0.59) planetBody(i, position.x, position.y, radius, time)
        if (solarOut < 0.4) label(planet.name, position.x + radius + 5, position.y - radius - 5, (1 - solarOut) * solarIn)
      }
      ctx.restore()
    }

    const earthIn = ease(0.07, 0.27, progress)
    if (progress < 0.59 && earthIn > 0) {
      const pullback = ease(0.10, 0.31, progress)
      const toSolar = ease(0.40, 0.59, progress)
      const r = mix(mix(unit * 2.4, unit * 0.30, pullback), earthPlanet.radius * (mobile ? 0.75 : 1), toSolar)
      const ex = mix(cx, solarEarth.x, toSolar)
      const ey = mix(mix(height + unit * 1.9, cy, pullback), solarEarth.y, toSolar)
      const moonRadius = mix(unit * 0.84, 12, toSolar)
      const angle = moonAngle(time)
      const position = orbitPoint(ex, ey, moonRadius, angle, 0.52)
      ctx.save(); ctx.globalAlpha = earthIn
      ellipse(ex, ey, moonRadius, moonRadius * 0.52, '#8faace55')
      const drawMoon = () => moon(position.x, position.y, r * 0.272, angle)
      if (position.y < ey) drawMoon()
      earth(ex, ey, r, time)
      if (position.y >= ey) drawMoon()
      const labels = pullback * (1 - toSolar)
      label('EARTH', ex - r, ey + r + 25, labels)
      label('MOON', position.x + r * 0.272 + 9, position.y, labels)
      ctx.restore()
    }

    if (progress < 0.18) {
      const opacity = 1 - ease(0.03, 0.18, progress)
      ctx.save(); ctx.globalAlpha = opacity
      for (let ring = 0; ring < 3; ring++) {
        ellipse(cx, cy, unit * (0.66 + ring * 0.16), unit * (0.27 + ring * 0.07), '#8dadd13b', -0.42)
      }
      if (!mobile) label('ARION / FLIGHT FIELD', cx - unit * 0.65, cy - unit * 0.75)
      label('+', cx - unit * 0.85, cy - unit * 0.38)
      label('+', cx + unit * 0.85, cy + unit * 0.38)
      ctx.restore()
    }
    if (progress < 0.59) {
      const launch = ease(0.02, 0.26, progress)
      const initialScale = Math.min(unit / 275, 1.15)
      const scale = initialScale * mix(1, 0.055, ease(0.07, 0.36, progress))
      const x = cx + unit * launch * 0.50
      const y = cy - unit * launch * 0.60
      drawRocket(x, y, scale, mix(0.4, 0.65, launch), time, ease(0.01, 0.08, progress), pointer, paused, 1 - ease(0.39, 0.54, progress))
      if (progress > 0.24) label('ARION', x + 12, y - 10, ease(0.24, 0.3, progress) * (1 - ease(0.39, 0.54, progress)))
    }
    // A restrained edge vignette leaves the space illustrations legible.
    const vignette = ctx.createLinearGradient(0, 0, width, 0)
    vignette.addColorStop(0, '#06080e77'); vignette.addColorStop(mobile ? 0.1 : 0.27, '#06080e00'); vignette.addColorStop(1, '#06080e00')
    ctx.fillStyle = vignette; ctx.fillRect(0, 0, width, height)
  }

  return {
    draw,
    resize() {
      width = Math.max(1, canvas.clientWidth); height = Math.max(1, canvas.clientHeight)
      mobile = width <= 700 && !window.matchMedia('(max-width: 700px) and (max-height: 570px) and (orientation: landscape)').matches
      const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2)
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    },
  }
}
