// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MotionProvider, useMotion } from '../src/components/Motion'

let root: Root
let container: HTMLDivElement
let reduced: boolean
let media: EventTarget

function Controls() {
  const { paused, systemPaused, toggle } = useMotion()
  return <button onClick={toggle} aria-pressed={paused} data-system-paused={systemPaused}>{paused ? 'Play' : 'Pause'}</button>
}

function mount() {
  act(() => root.render(<MotionProvider><Controls /></MotionProvider>))
}

function setSystemPreference(value: boolean) {
  act(() => {
    reduced = value
    media.dispatchEvent(new Event('change'))
  })
}

function control() {
  return container.querySelector('button')!
}

beforeEach(() => {
  reduced = false
  media = new EventTarget()
  Object.defineProperty(media, 'matches', { get: () => reduced })
  vi.stubGlobal('matchMedia', vi.fn(() => media))
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

describe('motion preference controls', () => {
  it('animates by default and can pause and resume', () => {
    mount()
    expect(control().getAttribute('aria-pressed')).toBe('false')
    act(() => control().click())
    expect(container.querySelector('.motion-paused')).not.toBeNull()
    act(() => control().click())
    expect(container.querySelector('.motion-paused')).toBeNull()
  })

  it('starts paused for reduced motion but lets the visitor play, pause and play again', () => {
    reduced = true
    mount()
    expect(control().getAttribute('aria-pressed')).toBe('true')
    expect(control().getAttribute('data-system-paused')).toBe('true')
    act(() => control().click())
    expect(control().getAttribute('aria-pressed')).toBe('false')
    expect(control().getAttribute('data-system-paused')).toBe('false')
    expect(container.querySelector('.motion-paused')).toBeNull()
    act(() => control().click())
    expect(control().getAttribute('aria-pressed')).toBe('true')
    expect(control().getAttribute('data-system-paused')).toBe('false')
    act(() => control().click())
    expect(control().getAttribute('aria-pressed')).toBe('false')
  })

  it('follows changing system preferences before an explicit visitor choice', () => {
    mount()
    setSystemPreference(true)
    expect(control().getAttribute('aria-pressed')).toBe('true')
    setSystemPreference(false)
    expect(control().getAttribute('aria-pressed')).toBe('false')
  })

  it('retains an explicit play choice across system updates and page rerenders', () => {
    reduced = true
    mount()
    act(() => control().click())
    setSystemPreference(false)
    setSystemPreference(true)
    mount()
    expect(control().getAttribute('aria-pressed')).toBe('false')
  })
})
