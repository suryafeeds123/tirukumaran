import type { MetadataRoute } from "next";
import { LOCALES, PAGES } from "@/i18n";
import { INDEXING_ENABLED, SITE_URL } from "@/lib/business";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!INDEXING_ENABLED || !SITE_URL) return [];
  return LOCALES.flatMap((l) =>
    PAGES.map((p) => ({
      url: `${SITE_URL}/${l}${p ? "/" + p : ""}`,
      changeFrequency: "monthly" as const,
      priority: p === "" ? 1 : 0.7,
      alternates: {
        languages: Object.fromEntries(LOCALES.map((x) => [x === "ta" ? "ta-IN" : "en-IN", `${SITE_URL}/${x}${p ? "/" + p : ""}`])),
      },
    })),
  );
}
