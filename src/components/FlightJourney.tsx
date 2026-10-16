import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { home } from '../content/home'
import { site } from '../content/site'
import { anchoredProgress, flightStages, mix, stageAt } from '../lib/flightJourney'
import type { FlightStop } from '../lib/flightJourney'
import { createFlightRenderer } from './particleUniverse'
import { useMotion } from './Motion'

function measureStops(page: HTMLElement, viewport: HTMLElement): FlightStop[] {
  const pageTop = page.getBoundingClientRect().top
  const height = viewport.offsetHeight
  const distance = Math.max(0, page.offsetHeight - height)
  return flightStages.map(stage => {
    const gap = page.querySelector<HTMLElement>(`[data-flight-stop="${stage.id}"]`)
    if (!gap) return { scroll: stage.position * distance, position: stage.position, hold: 0 }
    const rect = gap.getBoundingClientRect()
    return {
      scroll: Math.max(0, rect.top - pageTop + rect.height / 2 - height * 0.52),
      position: stage.position,
      // Preserve the arrival lead even though the viewing gap is shorter.
      hold: Math.min(height * 0.2, rect.height * 0.36),
    }
  })
}

export default function FlightJourney() {
  const sectionRef = useRef<HTMLElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const statusRef = useRef<HTMLElement>(null)
  const [stage, setStage] = useState(0)
  const [canvasAvailable, setCanvasAvailable] = useState(true)
  const { paused, systemPaused, toggle } = useMotion()
  const motionRef = useRef(paused)
  useLayoutEffect(() => { motionRef.current = paused }, [paused])

  useEffect(() => {
    const section = sectionRef.current!
    const page = section.closest<HTMLElement>('.home-journey') ?? section
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
    let stops: FlightStop[] = []
    const pointer = { x: -10000, y: -10000 }

    const readScroll = (delta: number) => {
      const inset = Number.parseFloat(getComputedStyle(viewport).top) || 0
      const rect = page.getBoundingClientRect()
      // Cache gap measurements between scroll/resize events.
      if (dirty) stops = measureStops(page, viewport)
      const target = anchoredProgress(inset - rect.top, stops)
      progress = motionRef.current || firstFrame ? target : mix(progress, target, 1 - Math.exp(-delta * 9))
      if (Math.abs(progress - target) < 0.0001) progress = target
      firstFrame = false
      const nextStage = stageAt(progress)
      if (lastStage !== nextStage) { lastStage = nextStage; setStage(nextStage) }
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress})`
      if (statusRef.current) statusRef.current.hidden = rect.bottom < viewport.offsetHeight * 0.5
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
    const leave = () => { pointer.x = -10000; pointer.y = -10000 }
    const move = (event: PointerEvent) => {
      // Listen through the content layer; never intercept its clicks or scrolling.
      if (event.target instanceof Element && event.target.closest('a, button, summary, [data-flight-ui]')) {
        leave()
        return
      }
      const rect = canvas.getBoundingClientRect()
      pointer.x = event.clientX - rect.left
      pointer.y = event.clientY - rect.top
    }
    const release = (event: PointerEvent) => { if (event.pointerType === 'touch') leave() }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(viewport)
    resizeObserver.observe(page)
    page.querySelectorAll('.section, .journey__window, .journey').forEach(element => resizeObserver.observe(element))
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) schedule()
      else { cancelAnimationFrame(frame); frame = 0 }
    })
    intersection.observe(page)
    const motionObserver = new MutationObserver(schedule)
    const shell = section.closest('.site-shell')
    if (shell) motionObserver.observe(shell, { attributes: true, attributeFilter: ['class'] })
    window.addEventListener('scroll', schedule, { passive: true })
    document.addEventListener('visibilitychange', schedule)
    page.addEventListener('pointermove', move, { passive: true })
    page.addEventListener('pointerleave', leave)
    page.addEventListener('pointerup', release)
    page.addEventListener('pointercancel', leave)
    resize()
    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      intersection.disconnect()
      motionObserver.disconnect()
      window.removeEventListener('scroll', schedule)
      document.removeEventListener('visibilitychange', schedule)
      page.removeEventListener('pointermove', move)
      page.removeEventListener('pointerleave', leave)
      page.removeEventListener('pointerup', release)
      page.removeEventListener('pointercancel', leave)
    }
  }, [])

  function goToStage(index: number) {
    const section = sectionRef.current!
    const page = section.closest<HTMLElement>('.home-journey') ?? section
    const viewport = viewportRef.current!
    const inset = Number.parseFloat(getComputedStyle(viewport).top) || 0
    const top = window.scrollY + page.getBoundingClientRect().top - inset
    window.scrollTo({ top: top + measureStops(page, viewport)[index].scroll, behavior: paused ? 'instant' : 'smooth' })
    const atlas = statusRef.current?.querySelector('details')
    if (atlas) {
      atlas.open = false
      atlas.querySelector('summary')?.focus({ preventScroll: true })
    }
  }

  const current = flightStages[stage]
  return (
    <>
      <div className="journey__viewport" ref={viewportRef} data-stage={current.id} aria-hidden="true">
        <canvas className="journey__canvas" ref={canvasRef} />
        {!canvasAvailable && <div className="journey__fallback"><img src={`${import.meta.env.BASE_URL}rocket-icon.svg`} alt="" /></div>}
      </div>
      <section className={`journey${!canvasAvailable ? ' journey--fallback' : ''}`} ref={sectionRef} aria-label="ARION 우주 비행">
        <div className="journey__topline"><span className="mono">ARION / THE COSMIC ODYSSEY</span><span className="mono">SCROLL TO EXPLORE ↘</span></div>
        <div className="journey__intro" data-flight-ui>
          <p className="launch__eyebrow"><span /> {home.hero.label} / EST. {site.founded}</p>
          <h1>{home.hero.first}<br /><span>{home.hero.second}</span></h1>
          <p className="journey__description">{site.description}.<br />{home.hero.note}</p>
          <div className="launch__actions"><Link to="/projects" className="button button--primary">우리의 프로젝트 <span aria-hidden="true">↗</span></Link><Link to="/about" className="launch__about">ARION 소개 <span aria-hidden="true">→</span></Link></div>
          <a className="journey__invitation" href="#mission"><span aria-hidden="true">↓</span> 스크롤로 ARION 둘러보기</a>
        </div>
        <p className="journey__hero-note mono">ONE MISSION. AN INFINITE UNIVERSE.</p>
      </section>
      <aside className="journey__status" ref={statusRef} data-flight-ui aria-label="배경 우주 비행 조작">
        <div className="journey__track" aria-hidden="true"><div ref={progressRef} /></div>
        <details className="journey__atlas">
          <summary><span className="mono">{current.number} / 06</span><span>{current.label}</span><span aria-hidden="true">⌃</span></summary>
          <nav className="journey__stages" aria-label="우주 비행 단계">
            <p className="mono">FOLLOW THE SCROLL</p>
            {flightStages.map((item, index) => <button key={item.id} onClick={() => goToStage(index)} aria-current={stage === index ? 'step' : undefined} type="button"><span className="mono">{item.number}</span><span>{item.label}</span></button>)}
            <p className="journey__footnote">ILLUSTRATIVE ATLAS · NOT TO SCALE</p>
            <p className="journey__footnote">DISTANCES FROM EARTH · APPROXIMATE<br />PLANETS: ORBITAL RANGES · AVG: AVERAGE<br />M: MILLION · B: BILLION · ly: LIGHT-YEARS</p>
          </nav>
        </details>
        <button className="journey__toggle" type="button" onClick={toggle} aria-pressed={paused} aria-label={paused ? (systemPaused ? 'REDUCED MOTION · PLAY' : 'RESUME FLIGHT') : 'PAUSE FLIGHT'}>{paused ? 'PLAY ▶' : 'PAUSE Ⅱ'}</button>
      </aside>
    </>
  )
}
