import { en, type Dict } from "./en";
import { ta } from "./ta";

export type Locale = "en" | "ta";
export const LOCALES: Locale[] = ["en", "ta"];
export const DEFAULT_LOCALE: Locale = "en";
const dicts: Record<Locale, Dict> = { en, ta };

export const isLocale = (v: string): v is Locale => v === "en" || v === "ta";
export const getDict = (l: Locale): Dict => dicts[l];

/** Replace {placeholders} in a dictionary string. */
export function fmt(s: string, vars: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

export const PAGES = ["", "car-finance", "two-wheeler-finance", "how-it-works", "documents", "emi-calculator", "faq", "about", "contact", "privacy"] as const;
export type PageSlug = (typeof PAGES)[number];
