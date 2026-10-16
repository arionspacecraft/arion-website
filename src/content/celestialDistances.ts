// Reference distances from Earth, NOT live ephemerides or camera coordinates.
// Planet ranges are approximate orbital envelopes derived from NASA perihelion /
// aphelion values; orientation and epoch are not modelled. See README sources.
export const celestialDistances: Record<string, string> = {
  EARTH: '0 km · HOME',
  MOON: 'AVG 384,400 km',
  SOL: 'AVG 149.6M km',
  MERCURY: '~77–222M km',
  VENUS: '~38–261M km',
  MARS: '~55–401M km',
  JUPITER: '~589–969M km',
  SATURN: '~1.21–1.66B km',
  URANUS: '~2.58–3.15B km',
  NEPTUNE: '~4.32–4.71B km',
  'SOLAR SYSTEM': 'EARTH IS INSIDE',
  'SAGITTARIUS A*': '~26,000 ly',
  'ORION NEBULA': '~1,500 ly',
  'OMEGA CENTAURI': '~17,700 ly',
  'MILKY WAY': 'EARTH IS INSIDE',
  ANDROMEDA: '~2.5M ly',
  TRIANGULUM: '~3M ly',
  'LARGE MAGELLANIC CLOUD': '~160,000 ly',
  'LOCAL GROUP': 'EARTH IS INSIDE',
  'VIRGO CLUSTER': '~54M ly',
  'COMA CLUSTER': '~330M ly',
  'PERSEUS CLUSTER': '~240M ly',
}
