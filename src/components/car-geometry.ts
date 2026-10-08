/** Shared side-profile geometry (viewBox 0 0 420 170), facing right. Used by the logo and the hero scene. */
export const CAR = {
  viewBox: "0 0 420 170",
  body:
    "M28 118 L28 102 C28 94 36 90 48 88 L104 80 C126 56 160 42 202 42 L248 42 C280 42 306 58 324 80 L366 86 C388 90 398 100 398 118 L384 118 A31 31 0 0 0 322 118 L146 118 A31 31 0 0 0 84 118 Z",
  glass: "M118 80 C136 62 162 52 200 52 L246 52 C268 52 288 63 304 80 Z",
  pillar: "M206 52 L206 80",
  beltline: "M60 90 L366 90",
  front: { cx: 353, cy: 118, r: 26 },
  rear: { cx: 115, cy: 118, r: 26 },
  headlight: "M372 94 L392 98",
} as const;
