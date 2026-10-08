import "../../globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Office dashboard",
  robots: { index: false, follow: false, nocache: true },
};
export const viewport: Viewport = { themeColor: "#050d18", width: "device-width", initialScale: 1 };

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="page-bg" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
