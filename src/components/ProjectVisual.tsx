import { useId } from 'react'

export default function ProjectVisual({ variant = 'i-class-motor' }: { variant?: string }) {
  const gradient = useId()
  return (
    <div className={`project-visual project-visual--${variant}`} aria-hidden="true">
      <svg viewBox="0 0 600 360" fill="none">
        <defs><linearGradient id={gradient} x1="180" y1="100" x2="380" y2="260" gradientUnits="userSpaceOnUse"><stop stopColor="#91B7FF" /><stop offset="0.5" stopColor="#285BC9" /><stop offset="1" stopColor="#0A1637" /></linearGradient></defs>
        <g stroke="#315DB5" strokeWidth="0.6" opacity="0.3">
          {[60, 120, 180, 240, 300].map((y) => <path key={y} d={`M40 ${y}H560`} />)}
          {[100, 180, 260, 340, 420, 500].map((x) => <path key={x} d={`M${x} 35V325`} />)}
          <circle cx="300" cy="180" r="128" /><circle cx="300" cy="180" r="88" strokeDasharray="3 8" />
        </g>
        {variant === 'flight-computer' ? (
          <g className="project-visual__object" transform="translate(300 180) rotate(-25)">
            <rect x="-112" y="-75" width="224" height="150" rx="8" fill="#0C2049" stroke="#6799F2" /><rect x="-38" y="-38" width="76" height="76" fill={`url(#${gradient})`} stroke="#8EB2F5" />
            {[-55, -30, 0, 30, 55].map((y) => <path key={y} d={`M-106 ${y}H-64V${y / 2}H-38 M38 ${y / 2}H65V${y}H105`} stroke="#4C84E5" />)}
            <path d="M-22 -75V-38M0 -75V-38M22 -75V-38M-22 38V75M0 38V75M22 38V75" stroke="#4C84E5" /><circle cx="-94" cy="-58" r="5" stroke="#8EB2F5" /><circle cx="94" cy="58" r="5" stroke="#8EB2F5" />
          </g>
        ) : variant === 'thrust-stand' ? (
          <g className="project-visual__object" stroke="#759DED" strokeWidth="1.4"><path d="M185 265H420M220 265V165H380V265M220 190H380M235 265L365 190M235 190L365 265" /><path d="M280 165V102Q300 55 320 102V165Z" fill={`url(#${gradient})`} /><path d="M290 165L282 181H318L310 165" /><path d="M300 190V242" strokeDasharray="3 6" /></g>
        ) : (
          <g className="project-visual__object" transform="translate(300 180) rotate(38)">
            <path d="M-27 -76Q-22 -110 0 -142Q22 -110 27 -76Z" fill={`url(#${gradient})`} stroke="#9EBEFE" /><path d="M-27 -76H27V94H-27Z" fill={`url(#${gradient})`} stroke="#759DED" /><path d="M-27 32L-62 94V119L-27 94M27 32L62 94V119L27 94" fill="#17366D" stroke="#759DED" /><path d="M-15 95L-23 111H23L15 95" fill="#4168A7" stroke="#759DED" /><path d="M-27 -51H27M-27 50H27M0 -76V94" stroke="#A3C4FF" strokeOpacity="0.5" /><path d="M-11 120Q-16 150 0 173Q16 150 11 120" fill="#245CE3" opacity="0.55" /><path d="M-71 -125V110M-78 -125H-64M-78 110H-64" stroke="#4465A4" strokeWidth="0.7" />
          </g>
        )}
        <g fill="#6E91CC" fontFamily="monospace" fontSize="8" letterSpacing="2"><text x="24" y="27">ARION / CONCEPT STUDY</text><text x="24" y="339">DESIGN · BUILD · TEST</text><text x="478" y="339">EST. 2026</text></g>
        <path d="M22 46V38H30M578 46V38H570M22 310V318H30M578 310V318H570" stroke="#6887BF" />
      </svg>
    </div>
  )
}
