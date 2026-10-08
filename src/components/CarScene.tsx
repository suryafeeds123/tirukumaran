import { CAR } from "./car-geometry";

/**
 * Hero illustration: a cinematic, lit car drawn in SVG. It is an ILLUSTRATION, not a photograph.
 * If the owner adds /public/images/premium-car.png it replaces this (see HeroVisual).
 */
export function CarScene({ id = "scene" }: { id?: string }) {
  const f = CAR.front, r = CAR.rear;
  const wheel = (c: { cx: number; cy: number; r: number }, k: string) => (
    <g key={k}>
      <circle cx={c.cx} cy={c.cy} r={c.r} fill="#04080f" stroke="#1b2c3d" strokeWidth="2" />
      <circle cx={c.cx} cy={c.cy} r={c.r - 6} fill={`url(#${id}-rim)`} />
      {Array.from({ length: 5 }).map((_, i) => (
        <path key={i} d={`M${c.cx} ${c.cy} L${c.cx + Math.cos((i * 72 * Math.PI) / 180) * (c.r - 8)} ${c.cy + Math.sin((i * 72 * Math.PI) / 180) * (c.r - 8)}`} stroke="#0a1420" strokeWidth="4" strokeLinecap="round" />
      ))}
      <circle cx={c.cx} cy={c.cy} r="5" fill="#0a1420" stroke="#5fe7da" strokeWidth="1" />
    </g>
  );
  const car = (
    <g>
      <path d={CAR.body} fill={`url(#${id}-body)`} />
      <path d={CAR.glass} fill={`url(#${id}-glass)`} />
      <path d={CAR.pillar} stroke="#050b14" strokeWidth="3" />
      {/* arch cut-outs */}
      <path d={`M${f.cx - 31} 118 A31 31 0 0 1 ${f.cx + 31} 118Z`} fill="#02060c" />
      <path d={`M${r.cx - 31} 118 A31 31 0 0 1 ${r.cx + 31} 118Z`} fill="#02060c" />
      {wheel(f, "f")}
      {wheel(r, "r")}
      {/* light lines */}
      <path d="M60 91 L366 87" stroke={`url(#${id}-line)`} strokeWidth="1.4" opacity="0.9" />
      <path d={CAR.body} stroke={`url(#${id}-rimlight)`} strokeWidth="1.6" fill="none" className="scene-outline draw-scene" pathLength={1} />
      {/* soft highlights on glass and shoulder */}
      <path d="M136 70 C152 58 172 54 196 54 L196 62 C170 62 152 66 140 76 Z" fill="#9fe9ff" opacity="0.16" />
      <path d="M214 54 L244 54 C258 54 270 60 280 68 L214 68 Z" fill="#9fe9ff" opacity="0.09" />
      <path d="M52 96 C140 90 260 90 372 92" stroke="#bff8ff" strokeWidth="0.8" opacity="0.35" fill="none" />
      <path d="M372 96 L394 100" stroke="#bff8ff" strokeWidth="3" strokeLinecap="round" className="headlight" />
      <path d="M30 100 L30 108" stroke="#ff5a7a" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
    </g>
  );
  return (
    <svg className="car-scene" viewBox="0 0 470 262" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1c3047" />
          <stop offset="0.45" stopColor="#0d1b2c" />
          <stop offset="1" stopColor="#060d17" />
        </linearGradient>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b6a86" stopOpacity="0.8" />
          <stop offset="0.5" stopColor="#0f2233" />
          <stop offset="1" stopColor="#0a1624" />
        </linearGradient>
        <linearGradient id={`${id}-line`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7c6cf0" stopOpacity="0" />
          <stop offset="0.5" stopColor="#5fe7da" />
          <stop offset="1" stopColor="#5fe7da" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id={`${id}-rimlight`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7c6cf0" />
          <stop offset="0.55" stopColor="#3fe0d0" />
          <stop offset="1" stopColor="#bff8ff" />
        </linearGradient>
        <radialGradient id={`${id}-rim`}>
          <stop offset="0" stopColor="#56707f" />
          <stop offset="1" stopColor="#1a2a38" />
        </radialGradient>
        <radialGradient id={`${id}-floor`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#22c7e6" stopOpacity="0.45" />
          <stop offset="1" stopColor="#22c7e6" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-beam`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#bff8ff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#bff8ff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${id}-refmask`}>
          <rect x="0" y="144" width="470" height="110" fill={`url(#${id}-fade)`} />
        </mask>
      </defs>
      <ellipse cx="220" cy="150" rx="215" ry="24" fill={`url(#${id}-floor)`} />
      <path d="M396 99 L466 82 L466 140 Z" fill={`url(#${id}-beam)`} className="beam" />
      <g transform="translate(0 6)">
        {/* reflection */}
        <g mask={`url(#${id}-refmask)`}>
          <g transform="translate(0 288) scale(1 -1)" opacity="0.9">{car}</g>
        </g>
        {car}
      </g>
    </svg>
  );
}
