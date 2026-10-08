import type { Metadata } from "next";
import { getDict, LOCALES, type Locale, type PageSlug } from "@/i18n";
import type { Dict } from "@/i18n/en";
import { INDEXING_ENABLED, SITE_URL, BUSINESS, intlDigits } from "./business";

export const SLUG_META: Record<PageSlug, keyof Dict["meta"]> = {
  "": "home", "car-finance": "car", "two-wheeler-finance": "twoWheeler", "how-it-works": "how",
  documents: "documents", "emi-calculator": "emi", faq: "faq", about: "about", contact: "contact", privacy: "privacy",
};

const path = (l: Locale, slug: string) => `/${l}${slug ? "/" + slug : ""}`;

export function pageMetadata(lang: Locale, slug: PageSlug): Metadata {
  const m = getDict(lang).meta[SLUG_META[slug]];
  const md: Metadata = {
    title: { absolute: m.title },
    description: m.description,
    robots: INDEXING_ENABLED ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: { title: m.title, description: m.description, locale: lang === "ta" ? "ta_IN" : "en_IN", type: "website", siteName: BUSINESS.name },
  };
  if (SITE_URL) {
    md.metadataBase = new URL(SITE_URL);
    md.alternates = {
      canonical: path(lang, slug),
      languages: { ...Object.fromEntries(LOCALES.map((l) => [l === "ta" ? "ta-IN" : "en-IN", path(l, slug)])), "x-default": path("en", slug) },
    };
  }
  return md;
}

/** Structured data from verified facts only. Emitted only once the domain is known and indexing is enabled. */
export function businessJsonLd(lang: Locale) {
  if (!INDEXING_ENABLED || !SITE_URL) return null;
  const phone = intlDigits(BUSINESS.phone);
  return {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    name: BUSINESS.name,
    url: `${SITE_URL}${path(lang, "")}`,
    areaServed: { "@type": "City", name: "Tiruppur" },
    description: getDict(lang).meta.home.description,
    ...(phone ? { telephone: `+${phone}` } : {}),
    address: { "@type": "PostalAddress", ...BUSINESS.addressParts },
  };
}
