import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

const MotionContext = createContext({ paused: false, systemPaused: false, toggle: () => {} })

export function MotionProvider({ children }: { children: ReactNode }) {
  // Follow the device preference until the visitor explicitly chooses play/pause.
  const [userPaused, setUserPaused] = useState<boolean | null>(null)
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  const paused = userPaused ?? reduced
  const systemPaused = userPaused === null && reduced
  return (
    <MotionContext.Provider value={{ paused, systemPaused, toggle: () => setUserPaused((value) => !(value ?? reduced)) }}>
      <div className={`site-shell${paused ? ' motion-paused' : ''}`}>{children}</div>
    </MotionContext.Provider>
  )
}

export const useMotion = () => useContext(MotionContext)
