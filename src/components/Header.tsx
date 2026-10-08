"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { L, StartButton, useLocale } from "./LocaleProvider";
import { LogoMark, Wordmark } from "./Logo";

const NAV = [
  ["car-finance", "car"], ["two-wheeler-finance", "twoWheeler"], ["how-it-works", "how"], ["documents", "documents"],
  ["emi-calculator", "emi"], ["faq", "faq"], ["about", "about"], ["contact", "contact"],
] as const;

export function Header() {
  const { t, locale, setLocale } = useLocale();
  const pathname = usePathname() || "";
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [open]);

  const current = (slug: string) => pathname.replace(/\/$/, "") === `/${locale}/${slug}`;
  const links = NAV.map(([slug, key]) => (
    <L key={slug} to={slug} className="nav-link" aria-current={current(slug) ? "page" : undefined}>
      {t.nav[key]}
    </L>
  ));

  return (
    <header className="site-header" data-scrolled={scrolled}>
      <div className="wrap header-row">
        <L to="" className="brand">
          <LogoMark />
          <Wordmark />
        </L>
        <nav className="nav-desktop" aria-label={t.nav.primary}>{links}</nav>
        <div className="header-actions">
          <button type="button" className="lang-btn" onClick={() => setLocale(locale === "en" ? "ta" : "en")}>
            <span lang={locale === "en" ? "ta" : "en"}>{t.common.switchTo}</span><span className="sr-only"> — {t.common.switchLabel}</span>
          </button>
          <StartButton className="btn btn-primary btn-sm header-cta" />
          <button type="button" className="menu-btn" aria-expanded={open} aria-controls="mobile-nav" aria-label={t.nav.menu} onClick={() => setOpen((v) => !v)}>
            <span />
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" className="nav-mobile" aria-label={t.nav.primary}>
          <L to="" className="nav-link" aria-current={pathname.replace(/\/$/, "") === `/${locale}` ? "page" : undefined}>{t.nav.home}</L>
          {links}
          <StartButton />
        </nav>
      )}
    </header>
  );
}
