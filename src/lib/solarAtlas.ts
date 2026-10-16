import { planets } from './flightJourney'
import { mobileAtlasFrame } from './mobileAtlas'

// Keep every slot reserved even while an offscreen/fading planet has no label.
// Neither the orbit phase nor the currently visible label count sets its place.
export const solarCaptionNames = ['SOL', ...planets.map(planet => planet.en)]

export function solarCaptionFrame(width: number, height: number, mobile: boolean) {
  if (mobile) return mobileAtlasFrame(width, height)
  return {
    captions: {
      x: Math.max(18, width * 0.04),
      y: height * 0.29,
      width: Math.min(440, width * 0.35),
      height: Math.min(230, height * 0.48),
    },
    font: width < 1050 || height < 500 ? 12 : 15,
  }
}
