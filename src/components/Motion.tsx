import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

const MotionContext = createContext({ paused: false, toggle: () => {} })

export function MotionProvider({ children }: { children: ReactNode }) {
  const [userPaused, setUserPaused] = useState(false)
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  const paused = userPaused || reduced
  return (
    <MotionContext.Provider value={{ paused, toggle: () => setUserPaused((value) => !value) }}>
      <div className={`site-shell${paused ? ' motion-paused' : ''}`}>{children}</div>
    </MotionContext.Provider>
  )
}

export const useMotion = () => useContext(MotionContext)
