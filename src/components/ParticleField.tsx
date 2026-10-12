import { useEffect, useRef } from 'react'
import { useMotion } from './Motion'

// Pointer influence is deliberately wider than the original 110px / 28px effect.
export const PARTICLE_INTERACTION = { radius: 240, displacement: 175 } as const

type Particle = {
  x: number
  y: number
  ox: number
  oy: number
  size: number
  phase: number
  bright: boolean
}

export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { paused } = useMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    let particles: Particle[] = []
    let width = 0
    let height = 0
    let frame = 0
    let time = 0
    let previous = 0
    let visible = true
    let disposed = false
    const pointer = { x: -1000, y: -1000 }
    const stars = Array.from({ length: 75 }, () => ({
      x: Math.random(), y: Math.random(), size: Math.random() + 0.4,
      phase: Math.random() * Math.PI * 2,
    }))

    function draw() {
      if (!context) return
      context.clearRect(0, 0, width, height)
      const cx = width * 0.5
      const cy = height * 0.47
      const scale = Math.min(width / 620, height / 590)
      context.save()
      context.translate(cx, cy)
      context.rotate(-0.42)
      for (let ring = 0; ring < 3; ring++) {
        const rx = (195 + ring * 42) * scale
        const ry = (88 + ring * 25) * scale
        context.strokeStyle = ring === 1 ? '#6579af55' : '#6178b02a'
        context.lineWidth = 0.8
        context.setLineDash(ring === 2 ? [2, 9] : [])
        context.beginPath()
        context.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2)
        context.stroke()
        const angle = time * 0.00011 + ring * 2.1
        context.fillStyle = '#b9ccf1'
        context.beginPath()
        context.arc(Math.cos(angle) * rx, Math.sin(angle) * ry, ring === 1 ? 3 : 1.6, 0, Math.PI * 2)
        context.fill()
      }
      context.restore()
      context.setLineDash([])
      for (const star of stars) {
        const opacity = 0.1 + (Math.sin(time * 0.0005 + star.phase) + 1) * 0.15
        context.fillStyle = `rgba(157,180,224,${opacity})`
        context.fillRect(star.x * width, star.y * height, star.size, star.size)
      }
      const radius = Math.min(PARTICLE_INTERACTION.radius, width * 0.46)
      const displacement = Math.min(PARTICLE_INTERACTION.displacement, width * 0.3)
      for (const p of particles) {
        const dx = p.ox - pointer.x
        const dy = p.oy - pointer.y
        const distance = Math.hypot(dx, dy)
        const influence = !paused && distance < radius ? Math.pow(1 - distance / radius, 0.7) : 0
        const force = influence * displacement
        const angle = distance > 0.1 ? Math.atan2(dy, dx) : p.phase
        const scatter = Math.sin(p.phase + time * 0.0015) * force * 0.18
        const drift = paused ? 0 : Math.sin(time * 0.0008 + p.phase) * 1.3
        const targetX = p.ox + Math.cos(angle) * force - Math.sin(angle) * scatter
        const targetY = p.oy + Math.sin(angle) * force + Math.cos(angle) * scatter + drift
        const easing = influence > 0 ? 0.14 : 0.055
        p.x += (targetX - p.x) * easing
        p.y += (targetY - p.y) * easing
        const opacity = 0.5 + (Math.sin(time * 0.001 + p.phase) + 1) * 0.24
        context.fillStyle = p.bright ? `rgba(218,233,255,${opacity})` : `rgba(117,144,212,${opacity})`
        context.fillRect(p.x, p.y, p.size, p.size)
      }
    }

    function tick(now: number) {
      frame = 0
      if (disposed || !visible || document.hidden || paused) return
      if (now - previous >= 1000 / 30) {
        time += Math.min(now - previous, 50)
        previous = now
        draw()
      }
      frame = requestAnimationFrame(tick)
    }

    function resume() {
      cancelAnimationFrame(frame)
      frame = 0
      if (!paused && visible && !document.hidden && !disposed) frame = requestAnimationFrame(tick)
    }

    function resize() {
      if (!canvas || !context || disposed) return
      width = canvas.clientWidth
      height = canvas.clientHeight
      if (width < 1 || height < 1) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      context.setTransform(dpr, 0, 0, dpr, 0, 0)

      // An original rocket silhouette, sampled into particles instead of a wordmark.
      const sample = document.createElement('canvas')
      sample.width = 360
      sample.height = 520
      const ink = sample.getContext('2d')
      if (!ink) return
      ink.fillStyle = 'white'
      ink.beginPath()
      ink.moveTo(153, 137)
      ink.bezierCurveTo(153, 103, 166, 63, 180, 38)
      ink.bezierCurveTo(194, 63, 207, 103, 207, 137)
      ink.lineTo(207, 352)
      ink.lineTo(153, 352)
      ink.closePath()
      ink.fill()
      ink.beginPath()
      ink.moveTo(153, 278)
      ink.lineTo(109, 357)
      ink.lineTo(109, 389)
      ink.lineTo(153, 348)
      ink.closePath()
      ink.moveTo(207, 278)
      ink.lineTo(251, 357)
      ink.lineTo(251, 389)
      ink.lineTo(207, 348)
      ink.closePath()
      ink.fill()
      ink.fillRect(162, 357, 36, 15)
      ink.beginPath()
      ink.moveTo(165, 380)
      ink.quadraticCurveTo(161, 432, 180, 479)
      ink.quadraticCurveTo(199, 432, 195, 380)
      ink.fill()
      ink.clearRect(153, 137, 54, 5)
      ink.clearRect(153, 259, 54, 4)
      ink.clearRect(169, 177, 22, 31)
      const pixels = ink.getImageData(0, 0, sample.width, sample.height).data
      const scale = Math.min(width / 620, height / 590) * 0.93
      const angle = 0.4
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      const gap = width < 500 ? 2.7 : 2.4
      particles = []
      for (let y = 0; y < 520; y += gap) {
        for (let x = 0; x < 360; x += gap) {
          const alpha = pixels[(Math.floor(y) * 360 + Math.floor(x)) * 4 + 3]
          if (alpha < 100 || (y > 380 && Math.random() < (y - 370) / 130)) continue
          const px = (x - 180) * scale
          const py = (y - 260) * scale
          const ox = width * 0.5 + px * cos - py * sin
          const oy = height * 0.47 + px * sin + py * cos
          particles.push({ ox, oy, x: ox, y: oy, size: Math.random() * 1.2 + 0.65, phase: Math.random() * Math.PI * 2, bright: Math.random() > 0.36 })
        }
      }
      canvas.classList.add('is-ready')
      draw()
      resume()
    }

    const move = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect()
      pointer.x = event.clientX - bounds.left
      pointer.y = event.clientY - bounds.top
    }
    const leave = () => { pointer.x = -1000; pointer.y = -1000 }
    const release = (event: PointerEvent) => { if (event.pointerType === 'touch') leave() }
    const parent = canvas.parentElement!
    parent.addEventListener('pointermove', move, { passive: true })
    parent.addEventListener('pointerleave', leave)
    parent.addEventListener('pointerup', release)
    parent.addEventListener('pointercancel', leave)
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; resume() })
    intersection.observe(canvas)
    document.addEventListener('visibilitychange', resume)
    resize()
    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      intersection.disconnect()
      parent.removeEventListener('pointermove', move)
      parent.removeEventListener('pointerleave', leave)
      parent.removeEventListener('pointerup', release)
      parent.removeEventListener('pointercancel', leave)
      document.removeEventListener('visibilitychange', resume)
    }
  }, [paused])

  return <canvas ref={canvasRef} className="particle-field" aria-hidden="true" />
}
