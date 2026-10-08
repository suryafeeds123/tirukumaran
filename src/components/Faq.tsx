"use client";
import { useId, useState } from "react";

export function FaqList({ items, limit, level = 3 }: { items: { q: string; a: string }[]; limit?: number; level?: 2 | 3 }) {
  const H = `h${level}` as "h2" | "h3";
  const [open, setOpen] = useState<number | null>(null);
  const base = useId();
  return (
    <div className="faq-list">
      {items.slice(0, limit).map((it, i) => (
        <div key={i} className="faq-item" data-open={open === i} data-reveal style={{ ["--i" as string]: Math.min(i, 5) }}>
          <H style={{ margin: 0, fontSize: "inherit", fontFamily: "inherit" }}>
            <button type="button" className="faq-q" aria-expanded={open === i} aria-controls={`${base}-${i}`} id={`${base}-q${i}`} onClick={() => setOpen(open === i ? null : i)}>
              <span>{it.q}</span>
              <span className="plus" aria-hidden="true" />
            </button>
          </H>
          <div className="faq-a" id={`${base}-${i}`} role="region" aria-labelledby={`${base}-q${i}`}>
            <div><p>{it.a}</p></div>
          </div>
        </div>
      ))}
    </div>
  );
}
