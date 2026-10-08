"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Lightweight, accessible motion: staggered reveals (IntersectionObserver), restrained 3D tilt for mouse
 * pointers only, and gentle hero parallax. Everything is skipped under prefers-reduced-motion.
 */
export function MotionController() {
  const pathname = usePathname();

  // Reveals — re-scan on each route change.
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)"));
    if (!els.length) return;
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((e) => e.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [pathname]);

  // Tilt (fine pointers only) + parallax.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (reduce.matches) return;

    let tiltEl: HTMLElement | null = null;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const el = (e.target as HTMLElement | null)?.closest?.("[data-tilt]") as HTMLElement | null;
      if (tiltEl && tiltEl !== el) reset(tiltEl);
      if (!el) return;
      tiltEl = el;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.classList.add("is-tilting");
      el.style.transform = `perspective(900px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg) translateZ(0)`;
    };
    const reset = (el: HTMLElement) => { el.classList.remove("is-tilting"); el.style.transform = ""; };
    const onLeave = () => { if (tiltEl) { reset(tiltEl); tiltEl = null; } };

    let raf = 0;
    const layers = () => Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]"));
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = Math.min(window.scrollY, 900);
        layers().forEach((l) => {
          const k = Number(l.dataset.parallax) || 0.06;
          l.style.transform = `translate3d(0, ${(y * k).toFixed(1)}px, 0)`;
        });
      });
    };

    if (fine.matches) {
      document.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerleave", onLeave);
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
      layers().forEach((l) => (l.style.transform = ""));
    };
  }, [pathname]);

  return null;
}
