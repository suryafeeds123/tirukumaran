"use client";
import { useId } from "react";
import { CAR } from "./car-geometry";

/**
 * Car-outline mark. The outline draws itself (stroke-dashoffset), then a soft light sweep passes over it.
 * Animation is pure CSS and is disabled under prefers-reduced-motion (see globals.css).
 */
export function LogoMark({ className = "", animate = true }: { className?: string; animate?: boolean }) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg
      className={`logo-mark ${animate ? "logo-anim" : ""} ${className}`}
      viewBox={CAR.viewBox}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`g${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7c6cf0" />
          <stop offset="0.5" stopColor="#22c7e6" />
          <stop offset="1" stopColor="#3fe0d0" />
        </linearGradient>
        <linearGradient id={`s${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`m${uid}`}>
          <g stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <path d={CAR.body} />
            <path d={CAR.glass} />
          </g>
        </mask>
      </defs>
      <g stroke={`url(#g${uid})`} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="logo-glow">
        <path d={CAR.body} pathLength={1} className="draw" />
        <path d={CAR.glass} pathLength={1} className="draw draw-2" strokeWidth="3" />
        <path d={CAR.pillar} pathLength={1} className="draw draw-2" strokeWidth="3" />
        <circle cx={CAR.front.cx} cy={CAR.front.cy} r={CAR.front.r - 4} pathLength={1} className="draw draw-3" />
        <circle cx={CAR.rear.cx} cy={CAR.rear.cy} r={CAR.rear.r - 4} pathLength={1} className="draw draw-3" />
        <circle cx={CAR.front.cx} cy={CAR.front.cy} r="7" pathLength={1} className="draw draw-3" strokeWidth="3" />
        <circle cx={CAR.rear.cx} cy={CAR.rear.cy} r="7" pathLength={1} className="draw draw-3" strokeWidth="3" />
      </g>
      {animate && (
        <g mask={`url(#m${uid})`}>
          <rect className="sweep" x="-120" y="0" width="90" height="170" fill={`url(#s${uid})`} />
        </g>
      )}
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="wordmark">
      <span className="wm-top">TIRUKUMARAN</span>{" "}
      <span className="wm-bot">AUTO FINANCE</span>
    </span>
  );
}
