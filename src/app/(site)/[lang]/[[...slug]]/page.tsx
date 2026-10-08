import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, LOCALES, PAGES, type PageSlug } from "@/i18n";
import { pageMetadata, businessJsonLd } from "@/lib/seo";
import { AboutPage, CarPage, ContactPage, DocumentsPage, EmiPage, FaqPage, HomePage, HowPage, PrivacyPage, TwoWheelerPage } from "@/components/Pages";

type Props = { params: Promise<{ lang: string; slug?: string[] }> };

const slugOf = (s?: string[]): PageSlug | null => {
  const joined = (s ?? []).join("/");
  return (PAGES as readonly string[]).includes(joined) ? (joined as PageSlug) : null;
};

export function generateStaticParams() {
  return LOCALES.flatMap((lang) => PAGES.map((p) => ({ lang, slug: p ? [p] : [] })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const s = slugOf(slug);
  if (!isLocale(lang) || s === null) return { title: "Not found", robots: { index: false } };
  return pageMetadata(lang, s);
}

/** Optional owner-supplied hero image (AI-generated promotional art). Falls back to the built-in SVG illustration. */
function heroImage(): string | null {
  for (const f of ["premium-car.webp", "premium-car.jpg", "premium-car.png"]) {
    if (fs.existsSync(path.join(process.cwd(), "public", "images", f))) return `/images/${f}`;
  }
  return null;
}

export default async function Page({ params }: Props) {
  const { lang, slug } = await params;
  const s = slugOf(slug);
  if (!isLocale(lang) || s === null) notFound();
  const ld = s === "" ? businessJsonLd(lang) : null;
  const view = {
    "": <HomePage heroSrc={heroImage()} />,
    "car-finance": <CarPage />,
    "two-wheeler-finance": <TwoWheelerPage />,
    "how-it-works": <HowPage />,
    documents: <DocumentsPage />,
    "emi-calculator": <EmiPage />,
    faq: <FaqPage />,
    about: <AboutPage />,
    contact: <ContactPage />,
    privacy: <PrivacyPage />,
  }[s];
  return (
    <>
      {ld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />}
      {view}
    </>
  );
}
