export const TAU = Math.PI * 2
export const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value))
export const mix = (a: number, b: number, t: number) => a + (b - a) * t
export function ease(from: number, to: number, value: number) {
  const t = clamp((value - from) / (to - from))
  return t * t * (3 - 2 * t)
}

export const flightStages = [
  { id: 'launch', position: 0, number: '01', label: '발사', en: 'IGNITION', title: '우주를 향한 도전', description: '스크롤을 내려, 우리의 비행을 시작하세요.' },
  { id: 'earth', position: 0.34, number: '02', label: '지구와 달', en: 'EARTH & MOON', title: '우리의 시작점,\n그 너머로.', description: '스스로 도는 지구와 그 곁을 도는 달.\n익숙한 세상을 뒤로하고, 더 멀리 나아갑니다.' },
  { id: 'solar', position: 0.65, number: '03', label: '태양계', en: 'THE SOLAR SYSTEM', title: '여덟 개의 궤도,\n하나의 태양.', description: '저마다의 속도로 돌고 있는 행성들.\n우리의 호기심은 궤도 밖으로 향합니다.' },
  { id: 'galaxy', position: 1, number: '04', label: '우리 은하', en: 'THE MILKY WAY', title: '더 멀리,\n끝없는 가능성으로.', description: '태양계도 수많은 빛 중 하나가 되는 곳.\nARION의 도전은 이제 시작입니다.' },
] as const

export function stageAt(progress: number) {
  if (progress < 0.22) return 0
  if (progress < 0.49) return 1
  if (progress < 0.79) return 2
  return 3
}

export function scrollProgress(top: number, sectionHeight: number, viewportHeight: number, inset: number) {
  const distance = sectionHeight - viewportHeight
  return distance > 0 ? clamp((inset - top) / distance) : 0
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

export function seededRandom(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
}
