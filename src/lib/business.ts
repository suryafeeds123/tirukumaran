/**
 * Single source of truth for business facts.
 * Only the NAME, the CITY and the two loan categories are verified.
 * Everything else comes from environment variables and is hidden when empty.
 */
const clean = (v: string | undefined) => (v && v.trim() ? v.trim() : null);

export const BUSINESS = {
  name: "TIRUKUMARAN AUTO FINANCE",
  city: { en: "Tiruppur", ta: "திருப்பூர்" },
  region: { en: "Tamil Nadu, India", ta: "தமிழ்நாடு, இந்தியா" },
  categories: ["car", "two_wheeler"] as const,

  // Supplied by the owner (Oct 2026). Environment variables, if set, override these defaults.
  phone: clean(process.env.NEXT_PUBLIC_BUSINESS_PHONE) ?? "9988788666",
  // WhatsApp not yet confirmed by the owner — stays hidden until NEXT_PUBLIC_BUSINESS_WHATSAPP is set.
  whatsapp: clean(process.env.NEXT_PUBLIC_BUSINESS_WHATSAPP),
  address: {
    en: clean(process.env.NEXT_PUBLIC_BUSINESS_ADDRESS_EN) ?? "8A/56, AA Plaza, MG Pudur First Street, Tiruppur – 641604",
    ta: clean(process.env.NEXT_PUBLIC_BUSINESS_ADDRESS_TA) ?? "8A/56, AA Plaza, MG Pudur First Street, Tiruppur – 641604",
  },
  addressParts: {
    streetAddress: "8A/56, AA Plaza, MG Pudur First Street",
    addressLocality: "Tiruppur",
    addressRegion: "Tamil Nadu",
    postalCode: "641604",
    addressCountry: "IN",
  },
  // Working days have not been supplied, so none are stated.
  hours: {
    en: clean(process.env.NEXT_PUBLIC_BUSINESS_HOURS_EN) ?? "10:00 AM – 5:30 PM",
    ta: clean(process.env.NEXT_PUBLIC_BUSINESS_HOURS_TA) ?? "காலை 10:00 – மாலை 5:30",
  },
  // A plain Google Maps *search* link for the supplied address (not a Business Profile).
  mapLink:
    clean(process.env.NEXT_PUBLIC_MAP_LINK) ??
    "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent("8A/56, AA Plaza, MG Pudur First Street, Tiruppur 641604"),
  mapEmbed: clean(process.env.NEXT_PUBLIC_MAP_EMBED_URL),
  // Owner: "directly arrange loans". We describe this as the team arranging finance directly — we do not claim lender/NBFC status.
  lendingModel: ((): "direct" | "partner" | null => {
    const v = clean(process.env.NEXT_PUBLIC_LENDING_MODEL);
    return v === "partner" ? "partner" : "direct";
  })(),
  vehicleConditions: ["new", "used"] as const,
};

export type Category = (typeof BUSINESS.categories)[number];

/** Digits only, with the +91 country code for wa.me / tel links. Returns null if not a plausible number. */
export function intlDigits(raw: string | null): string | null {
  if (!raw) return null;
  const d = raw.replace(/\D/g, "");
  if (d.length === 10) return "91" + d;
  if (d.length === 12 && d.startsWith("91")) return d;
  return null;
}

export function whatsappLink(raw: string | null, text?: string): string | null {
  const n = intlDigits(raw);
  if (!n) return null;
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function telLink(raw: string | null): string | null {
  const n = intlDigits(raw);
  return n ? `tel:+${n}` : null;
}

export function formatPhoneDisplay(raw: string | null): string | null {
  const n = intlDigits(raw);
  return n ? `+91 ${n.slice(2, 7)} ${n.slice(7)}` : null;
}

export const SITE_URL = (process.env.SITE_URL || "").replace(/\/$/, "") || null;
export const INDEXING_ENABLED = process.env.SITE_INDEXING === "true" && !!SITE_URL;
export const LIVE_ENQUIRIES = process.env.LIVE_ENQUIRIES === "true";
