import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { home } from '../content/home'
import { site } from '../content/site'
import { ease, flightStages, mix, scrollProgress, stageAt } from '../lib/flightJourney'
import { createFlightRenderer } from './particleUniverse'
import { useMotion } from './Motion'

export default function FlightJourney() {
  const sectionRef = useRef<HTMLElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const introRef = useRef<HTMLDivElement>(null)
  const [stage, setStage] = useState(0)
  const [canvasAvailable, setCanvasAvailable] = useState(true)
  const { paused, systemPaused, toggle } = useMotion()
  const motionRef = useRef(paused)
  useLayoutEffect(() => { motionRef.current = paused }, [paused])

  useEffect(() => {
    const section = sectionRef.current!
    const viewport = viewportRef.current!
    const canvas = canvasRef.current!
    const context = canvas.getContext('2d')
    if (!context) { setCanvasAvailable(false); return }
    const renderer = createFlightRenderer(canvas, context)
    let frame = 0
    let previous = 0
    let time = 0
    let progress = 0
    let firstFrame = true
    let visible = true
    let dirty = true
    let disposed = false
    let lastStage = -1
    const pointer = { x: -10000, y: -10000 }

    const readScroll = (delta: number) => {
      const inset = Number.parseFloat(getComputedStyle(viewport).top) || 0
      const target = scrollProgress(section.getBoundingClientRect().top, section.offsetHeight, viewport.offsetHeight, inset)
      progress = motionRef.current || firstFrame ? target : mix(progress, target, 1 - Math.exp(-delta * 9))
      if (Math.abs(progress - target) < 0.0001) progress = target
      firstFrame = false
      const nextStage = stageAt(progress)
      if (lastStage !== nextStage) { lastStage = nextStage; setStage(nextStage) }
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress})`
      if (introRef.current) {
        introRef.current.style.opacity = String(1 - ease(0.02, 0.14, progress))
        introRef.current.style.transform = `translateY(${-ease(0, 0.16, progress) * 28}px)`
        introRef.current.inert = progress >= 0.14
      }
      // Paused/reduced-motion visitors get discrete still scenes without zoom.
      renderer.draw(motionRef.current ? flightStages[nextStage].position : progress, time, pointer, motionRef.current)
      dirty = false
    }
    const tick = (now: number) => {
      frame = 0
      if (disposed || document.hidden || !visible) return
      if (now - previous >= 1000 / 30 || dirty) {
        const delta = Math.min((now - previous) / 1000, 0.1)
        if (!motionRef.current) time += delta
        previous = now
        readScroll(delta)
      }
      if (!motionRef.current) frame = requestAnimationFrame(tick)
    }
    const schedule = () => {
      dirty = true
      if (!frame && visible && !document.hidden && !disposed) frame = requestAnimationFrame(tick)
    }
    const resize = () => { renderer.resize(); schedule() }
    const move = (event: PointerEvent) => {
      // Navigation and copy sit above the canvas; hovering them must not
      // scatter a whole scene on short screens where the field is nearby.
      if (event.target instanceof Element && event.target.closest('a, button, .journey__intro, .journey__chapter, .journey__topline, .journey__bottom')) {
        leave()
        return
      }
      const rect = canvas.getBoundingClientRect()
      pointer.x = event.clientX - rect.left
      pointer.y = event.clientY - rect.top
    }
    const leave = () => { pointer.x = -10000; pointer.y = -10000 }
    const release = (event: PointerEvent) => { if (event.pointerType === 'touch') leave() }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(viewport)
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) schedule()
      else { cancelAnimationFrame(frame); frame = 0 }
    })
    intersection.observe(section)
    // Watch the existing global motion control without rebuilding the scene.
    const motionObserver = new MutationObserver(schedule)
    const shell = section.closest('.site-shell')
    if (shell) motionObserver.observe(shell, { attributes: true, attributeFilter: ['class'] })
    window.addEventListener('scroll', schedule, { passive: true })
    document.addEventListener('visibilitychange', schedule)
    viewport.addEventListener('pointermove', move, { passive: true })
    viewport.addEventListener('pointerleave', leave)
    viewport.addEventListener('pointerup', release)
    viewport.addEventListener('pointercancel', leave)
    resize()
    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      intersection.disconnect()
      motionObserver.disconnect()
      window.removeEventListener('scroll', schedule)
      document.removeEventListener('visibilitychange', schedule)
      viewport.removeEventListener('pointermove', move)
      viewport.removeEventListener('pointerleave', leave)
      viewport.removeEventListener('pointerup', release)
      viewport.removeEventListener('pointercancel', leave)
    }
  }, [])

  function goToStage(index: number) {
    const section = sectionRef.current!
    const viewport = viewportRef.current!
    const inset = Number.parseFloat(getComputedStyle(viewport).top) || 0
    const top = window.scrollY + section.getBoundingClientRect().top - inset
    window.scrollTo({ top: top + flightStages[index].position * (section.offsetHeight - viewport.offsetHeight), behavior: paused ? 'instant' : 'smooth' })
  }

  const current = flightStages[stage]
  return (
    <section className={`journey${!canvasAvailable ? ' journey--fallback' : ''}`} ref={sectionRef} aria-label="스크롤로 떠나는 ARION 우주 비행">
      <div className="journey__viewport" ref={viewportRef} data-stage={current.id}>
        <canvas className="journey__canvas" ref={canvasRef} aria-hidden="true" />
        {!canvasAvailable && <div className="journey__fallback"><img src={`${import.meta.env.BASE_URL}rocket-icon.svg`} alt="ARION 로켓" /><p>EARTH → SOLAR SYSTEM → MILKY WAY → COSMIC WEB</p></div>}
        <div className="journey__topline"><span className="mono">ARION / THE COSMIC ODYSSEY</span><a href="#mission">SKIP FLIGHT <span aria-hidden="true">↘</span></a></div>
        <div className="journey__intro" ref={introRef}>
          <p className="launch__eyebrow"><span /> {home.hero.label} / EST. {site.founded}</p>
          <h1>{home.hero.first}<br /><span>{home.hero.second}</span></h1>
          <p className="journey__description">{site.description}.<br />{home.hero.note}</p>
          <div className="launch__actions"><Link to="/projects" className="button button--primary">우리의 프로젝트 <span aria-hidden="true">↗</span></Link><Link to="/about" className="launch__about">ARION 소개 <span aria-hidden="true">→</span></Link></div>
          <p className="journey__invitation"><span aria-hidden="true">↓</span> 스크롤을 내려 비행을 시작하세요</p>
        </div>
        <div className="journey__chapter" hidden={stage === 0}>
          <p className="journey__eyebrow mono">{current.number} / {current.en}</p>
          <h2>{current.title}</h2>
          <p className="journey__description">{current.description}</p>
          {stage === flightStages.length - 1 && <a className="text-link" href="#mission">OUR STORY CONTINUES <span aria-hidden="true">↘</span></a>}
        </div>
        <div className="journey__caption" aria-live="polite" aria-atomic="true">
          <span className="journey__signal" aria-hidden="true" />
          {['MOVE YOUR CURSOR · DISTURB THE PARTICLES', 'TERRA & LUNA · A SHARED ORBIT', 'EIGHT WORLDS · ONE STAR', 'STARS · NEBULAE · STAR CLUSTERS', 'ISLANDS OF LIGHT · THE LOCAL GROUP', 'GALAXY CLUSTERS · THE COSMIC WEB'][stage]}
        </div>
        <div className="journey__bottom">
          <div className="journey__track" aria-hidden="true"><div ref={progressRef} /></div>
          <nav className="journey__stages" aria-label="우주 비행 단계">
            {flightStages.map((item, index) => <button key={item.id} onClick={() => goToStage(index)} aria-current={stage === index ? 'step' : undefined} type="button"><span className="mono">{item.number}</span><span>{item.label}</span><span className="journey__nav-dot" aria-hidden="true" /></button>)}
          </nav>
          <div className="journey__footnote"><span>ILLUSTRATIVE ATLAS · NOT TO SCALE</span><button type="button" onClick={toggle} aria-pressed={paused}>{paused ? (systemPaused ? 'REDUCED MOTION · PLAY ▶' : 'RESUME FLIGHT ▶') : 'PAUSE FLIGHT Ⅱ'}</button></div>
        </div>
      </div>
    </section>
  )
}
