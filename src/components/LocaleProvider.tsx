"use client";
import { createContext, useCallback, useContext, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getDict, type Locale } from "@/i18n";
import type { Dict } from "@/i18n/en";
import { assistStore } from "./assistant-store";

type Ctx = {
  locale: Locale;
  t: Dict;
  setLocale: (l: Locale) => void;
  openAssistant: (opener?: HTMLElement | null) => void;
};

const LocaleCtx = createContext<Ctx | null>(null);

/** Element to return focus to when the assistant closes (module-level: survives language-switch remounts). */
export const focusReturn: { el: HTMLElement | null } = { el: null };

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || `/${locale}`;

  // Language switch is a real navigation to the same page in the other language so that <html lang>,
  // title, description and canonical are all server-rendered correctly. Assistant answers live in a
  // module-level store, so they are preserved.
  const setLocale = useCallback(
    (l: Locale) => {
      const parts = pathname.split("/");
      parts[1] = l;
      router.replace(parts.join("/") || `/${l}`, { scroll: false });
    },
    [pathname, router],
  );

  const openAssistant = useCallback((opener?: HTMLElement | null) => {
    focusReturn.el = opener ?? (document.activeElement as HTMLElement | null);
    assistStore.open();
  }, []);

  const value = useMemo<Ctx>(() => ({ locale, t: getDict(locale), setLocale, openAssistant }), [locale, setLocale, openAssistant]);
  return <LocaleCtx.Provider value={value}>{children}</LocaleCtx.Provider>;
}

export function useLocale() {
  const c = useContext(LocaleCtx);
  if (!c) throw new Error("useLocale outside LocaleProvider");
  return c;
}

/** Locale-aware internal link. `to` is a page slug like "car-finance" ("" = home). */
export function L({ to, children, ...rest }: { to: string; children: React.ReactNode } & Omit<React.ComponentProps<typeof Link>, "href">) {
  const { locale } = useLocale();
  return (
    <Link href={`/${locale}${to ? "/" + to : ""}`} {...rest}>
      {children}
    </Link>
  );
}

export function StartButton({ className = "btn btn-primary", children }: { className?: string; children?: React.ReactNode }) {
  const { openAssistant, t } = useLocale();
  return (
    <button type="button" className={className} onClick={(e) => openAssistant(e.currentTarget)}>
      {children ?? t.common.startEnquiry}
      <span className="arrow" aria-hidden="true">→</span>
    </button>
  );
}
