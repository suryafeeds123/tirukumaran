import "../../globals.css";
import { notFound } from "next/navigation";
import type { Viewport } from "next";
import { getDict, isLocale, LOCALES } from "@/i18n";
import { LocaleProvider } from "@/components/LocaleProvider";
import { MotionController } from "@/components/MotionController";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Assistant, AssistantLauncher } from "@/components/Assistant";

export const viewport: Viewport = { themeColor: "#050d18", width: "device-width", initialScale: 1 };

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export default async function SiteLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : "en";
  const t = getDict(locale);
  return (
    <html lang={t.htmlLang}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
        <div className="page-bg" aria-hidden="true" />
        <LocaleProvider locale={locale}>
          <a href="#main" className="skip-link">{t.common.skip}</a>
          <Header />
          <main id="main" tabIndex={-1} style={{ outline: "none" }}>{children}</main>
          <Footer />
          <AssistantLauncher />
          <Assistant />
          <MotionController />
        </LocaleProvider>
      </body>
    </html>
  );
}
void notFound;
