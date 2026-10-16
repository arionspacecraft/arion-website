export const TAU = Math.PI * 2
export const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value))
export const mix = (a: number, b: number, t: number) => a + (b - a) * t
export function ease(from: number, to: number, value: number) {
  const t = clamp((value - from) / (to - from))
  return t * t * (3 - 2 * t)
}

export const flightStages = [
  { id: 'launch', position: 0, number: '01', label: 'IGNITION', en: 'MISSION / ARION', title: '우주를 향한 도전', description: '스크롤을 내려, 우리의 비행을 시작하세요.' },
  { id: 'earth', position: 0.22, number: '02', label: 'EARTH + MOON', en: 'EARTH–MOON SYSTEM', title: 'LEAVE\nTHE BLUE.', description: '우리의 시작점을 뒤로하고,\n아직 닿지 않은 곳을 향해.' },
  { id: 'solar', position: 0.43, number: '03', label: 'SOLAR SYSTEM', en: 'OUR STELLAR NEIGHBOURHOOD', title: 'CHASE\nTHE LIGHT.', description: '여덟 개의 궤도와 하나의 태양.\n비행은 계속됩니다.' },
  { id: 'galaxy', position: 0.65, number: '04', label: 'MILKY WAY', en: 'THE MILKY WAY / GALACTIC ATLAS', title: 'INTO\nTHE STARDUST.', description: '별과 성운, 성단 사이로.\n태양계마저 하나의 빛이 되는 곳.' },
  { id: 'local', position: 0.83, number: '05', label: 'LOCAL GROUP', en: 'BEYOND OUR HOME GALAXY', title: 'NO FINAL\nFRONTIER.', description: '우리 은하를 벗어나 이웃 은하들로.\n더 넓은 우주가 모습을 드러냅니다.' },
  { id: 'cosmic', position: 1, number: '06', label: 'COSMIC WEB', en: 'THE LARGE-SCALE UNIVERSE', title: 'THE COSMIC\nODYSSEY.', description: '수많은 은하가 이어지는 우주 속에서,\n우리의 작은 도전은 계속됩니다.' },
] as const

export function stageAt(progress: number) {
  if (progress < 0.16) return 0
  if (progress < 0.34) return 1
  if (progress < 0.55) return 2
  if (progress < 0.74) return 3
  if (progress < 0.91) return 4
  return 5
}

export function scrollProgress(top: number, sectionHeight: number, viewportHeight: number, inset: number) {
  const distance = sectionHeight - viewportHeight
  return distance > 0 ? clamp((inset - top) / distance) : 0
}

export type FlightStop = { scroll: number; position: number; hold: number }

// Finish the zoom before the clear gap is centred, then keep its full scene
// visible while the gap passes. Orbit, spin and rocket motion keep running.
export function anchoredProgress(scroll: number, stops: readonly FlightStop[]) {
  if (!stops.length) return 0
  for (let i = 1; i < stops.length; i++) {
    const previous = stops[i - 1]
    const next = stops[i]
    const distance = Math.max(0, next.scroll - previous.scroll)
    const start = previous.scroll + Math.min(previous.hold, distance * 0.35)
    const end = next.scroll - Math.min(next.hold, distance * 0.35)
    if (scroll < start) return previous.position
    if (scroll < end) return mix(previous.position, next.position, ease(start, end, scroll))
  }
  return stops[stops.length - 1].position
}

// Visual time is compressed separately for orbit and spin, not an ephemeris.
// Periods determine ordering; distances and radii are composed for readability.
export const planets = [
  { name: '수성', en: 'MERCURY', orbit: 0.16, radius: 3.2, color: '#a9a39c', years: 0.241, hours: 1407.6, phase: 0.5, tilt: 0 },
  { name: '금성', en: 'VENUS', orbit: 0.25, radius: 5.1, color: '#e4c59a', years: 0.615, hours: -5832.5, phase: 2.7, tilt: 0 },
  { name: '지구', en: 'EARTH', orbit: 0.35, radius: 5.7, color: '#6eaeef', years: 1, hours: 23.93, phase: 4.0, tilt: 0.41 },
  { name: '화성', en: 'MARS', orbit: 0.45, radius: 4.1, color: '#d8896c', years: 1.881, hours: 24.62, phase: 1.9, tilt: 0.44 },
  { name: '목성', en: 'JUPITER', orbit: 0.60, radius: 13, color: '#d3b99d', years: 11.86, hours: 9.93, phase: 3.5, tilt: 0.05 },
  { name: '토성', en: 'SATURN', orbit: 0.75, radius: 10.5, color: '#e0c99f', years: 29.46, hours: 10.7, phase: 0.5, tilt: 0.47 },
  { name: '천왕성', en: 'URANUS', orbit: 0.88, radius: 7.4, color: '#9fdcde', years: 84.01, hours: -17.24, phase: 2.7, tilt: 1.71 },
  { name: '해왕성', en: 'NEPTUNE', orbit: 1, radius: 7.2, color: '#6992ec', years: 164.8, hours: 16.11, phase: 5.5, tilt: 0.49 },
] as const

export const orbitAngle = (seconds: number, years: number, phase: number) => phase + seconds * 0.23 / Math.pow(years, 0.32)
export const spinAngle = (seconds: number, hours: number) => seconds * Math.sign(hours) * 0.9 / Math.log2(Math.abs(hours) + 2)
export const moonAngle = (seconds: number) => 0.7 + seconds * 0.18

export type Vector = { x: number; y: number }
export function orbitalPoint(radius: number, angle: number, flatten = 0.5): Vector {
  const x = Math.cos(angle) * radius
  const y = -Math.sin(angle) * radius * flatten
  return { x: x * Math.cos(-0.22) - y * Math.sin(-0.22), y: x * Math.sin(-0.22) + y * Math.cos(-0.22) }
}
const geometric = (a: number, b: number, t: number) => Math.exp(mix(Math.log(a), Math.log(b), t))

// Nested transforms keep the SAME Earth, Sun and Milky Way on screen while
// the camera pulls back. All radii share a single logarithmic zoom, not fades.
export function flightLayout(progress: number, time: number) {
  const launch = ease(0.04, 0.20, progress)
  const es = ease(0.24, 0.43, progress)
  const sg = ease(0.46, 0.65, progress)
  const gl = ease(0.68, 0.83, progress)
  const lc = ease(0.85, 1, progress)
  const z0 = geometric(7, 1, launch)
  const z1 = geometric(18, 1, es)
  const z2 = geometric(1 / 0.012, 1, sg)
  const z3 = geometric(1 / 0.18, 1, gl)
  const z4 = geometric(1 / 0.035, 1, lc)
  const cosmicRadius = z0 * z1 * z2 * z3 * z4
  const localRadius = cosmicRadius * 0.035
  const galaxyRadius = localRadius * 0.18
  const solarRadius = galaxyRadius * 0.012
  const earthRadius = solarRadius * 0.017
  const e = orbitalPoint(planets[2].orbit, orbitAngle(time, planets[2].years, planets[2].phase))
  const s = orbitalPoint(0.60, 0.65 + time * 0.035, 0.53)
  const m = { x: -0.45, y: 0.24 }
  const l = { x: -0.32, y: 0.3 }
  const earth = {
    x: e.x * solarRadius / (z0 * z1) * es + s.x * galaxyRadius / (z0 * z1 * z2) * sg + m.x * localRadius / (z0 * z1 * z2 * z3) * gl + l.x * lc,
    y: e.y * solarRadius / (z0 * z1) * es + s.y * galaxyRadius / (z0 * z1 * z2) * sg + m.y * localRadius / (z0 * z1 * z2 * z3) * gl + l.y * lc + (1 - launch) * 3.2,
  }
  const solar = { x: earth.x - e.x * solarRadius, y: earth.y - e.y * solarRadius }
  const galaxy = { x: solar.x - s.x * galaxyRadius, y: solar.y - s.y * galaxyRadius }
  const local = { x: galaxy.x - m.x * localRadius, y: galaxy.y - m.y * localRadius }
  const cosmic = { x: local.x - l.x * cosmicRadius, y: local.y - l.y * cosmicRadius }
  return { earth, solar, galaxy, local, cosmic, earthRadius, solarRadius, galaxyRadius, localRadius, cosmicRadius }
}

export const PARTICLE_REACTION = { radius: 60, displacement: 87.5 } as const
export function particleForce(x: number, y: number, pointer: Vector, width: number, phase: number): Vector {
  const dx = x - pointer.x; const dy = y - pointer.y
  const distance = Math.hypot(dx, dy)
  const radius = Math.min(PARTICLE_REACTION.radius, width * 0.115)
  if (distance >= radius) return { x: 0, y: 0 }
  const force = Math.pow(1 - distance / radius, 0.7) * Math.min(PARTICLE_REACTION.displacement, width * 0.15)
  const angle = distance > 0.1 ? Math.atan2(dy, dx) : phase
  return { x: Math.cos(angle) * force, y: Math.sin(angle) * force }
}

// Real names and classifications; positions are composed, NOT survey coordinates.
export const deepSky = {
  galactic: [
    { name: 'SAGITTARIUS A*', catalog: 'GALACTIC CENTRE', x: 0, y: 0 },
    { name: 'ORION NEBULA', catalog: 'M42 · EMISSION NEBULA', x: 0.46, y: -0.10 },
    { name: 'OMEGA CENTAURI', catalog: 'NGC 5139 · GLOBULAR CLUSTER', x: -0.48, y: 0.28 },
  ],
  local: [
    { name: 'ANDROMEDA', catalog: 'M31 · SPIRAL GALAXY', x: 0.48, y: -0.28, radius: 0.24, tilt: -0.55 },
    { name: 'TRIANGULUM', catalog: 'M33 · SPIRAL GALAXY', x: 0.65, y: 0.43, radius: 0.12, tilt: 0.15 },
    { name: 'LARGE MAGELLANIC CLOUD', catalog: 'LMC · SATELLITE GALAXY', x: -0.28, y: 0.57, radius: 0.055, tilt: 0.3 },
  ],
  cosmic: [
    { name: 'VIRGO CLUSTER', catalog: 'GALAXY CLUSTER · M87', x: 0.26, y: -0.24 },
    { name: 'COMA CLUSTER', catalog: 'ABELL 1656 · GALAXY CLUSTER', x: 0.75, y: 0.28 },
    { name: 'PERSEUS CLUSTER', catalog: 'ABELL 426 · GALAXY CLUSTER', x: -0.36, y: -0.60 },
  ],
} as const

export function seededRandom(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
}
