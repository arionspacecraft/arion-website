import type { Vector } from './flightJourney'

export type AtlasBox = { x: number; y: number; width: number; height: number }

// Use the same visible window as the scroll stops, leaving the bottom controls
// clear. A fixed caption reserve avoids camera jumps as labels fade in/out.
export function mobileAtlasFrame(width: number, height: number) {
  const landscape = width > height * 1.4
  const top = Math.max(16, height * 0.21)
  const bottom = Math.max(top + 80, Math.min(height * 0.83, height - 88))
  const available = bottom - top
  const captionHeight = Math.min(150, available * 0.43)
  const scene: AtlasBox = landscape
    ? { x: 16, y: top + 6, width: width * 0.50 - 28, height: available - 12 }
    : { x: 16, y: top + 10, width: width - 32, height: available - captionHeight - 24 }
  const captions: AtlasBox = landscape
    ? { x: width * 0.52, y: top, width: width * 0.48 - 16, height: available }
    : { x: 16, y: bottom - captionHeight, width: width - 32, height: captionHeight }
  return {
    scene, captions,
    centre: { x: scene.x + scene.width / 2, y: scene.y + scene.height / 2 },
    // Includes lunar/planetary orbits, rings and the outer cosmic-web clusters.
    unit: Math.max(1, Math.min(scene.width / 2.24, scene.height / 2.1)),
    font: width < 360 || landscape ? 11 : 12,
  }
}

export function wrapAtlasName(name: string, maxWidth: number, measure: (text: string) => number) {
  const lines: string[] = []
  for (const word of name.split(' ')) {
    const last = lines.length - 1
    if (last >= 0 && measure(`${lines[last]} ${word}`) <= maxWidth) lines[last] += ` ${word}`
    else lines.push(word)
  }
  return lines
}

export function mobileAtlasCaptions(names: string[], bounds: AtlasBox, font: number, measure: (text: string) => number) {
  const rows = Math.ceil(names.length / 2)
  const rowHeight = Math.min(34, bounds.height / Math.max(1, rows))
  const columnWidth = (bounds.width - 12) / 2
  const lineHeight = font + 2
  return names.map((name, index) => {
    const lines = wrapAtlasName(name, columnWidth - 12, measure)
    const box: AtlasBox = {
      x: bounds.x + index % 2 * (columnWidth + 12),
      y: bounds.y + (bounds.height - rows * rowHeight) / 2 + Math.floor(index / 2) * rowHeight,
      width: columnWidth,
      height: rowHeight - 3,
    }
    const text: Vector = { x: box.x + 6, y: box.y + (box.height - lines.length * lineHeight) / 2 + font }
    return { box, lines, text, lineHeight }
  })
}
