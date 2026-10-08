"use client";
import { L, useLocale } from "./LocaleProvider";
import { LogoMark, Wordmark } from "./Logo";

export function Footer() {
  const { t } = useLocale();
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="wrap footer-grid">
        <div>
          <div className="brand" style={{ marginBottom: 14 }}>
            <LogoMark animate={false} />
            <Wordmark />
          </div>
          <p className="muted" style={{ maxWidth: 38 + "ch" }}>{t.footer.blurb}</p>
        </div>
        <div>
          <h2>{t.footer.explore}</h2>
          <ul>
            <li><L to="car-finance">{t.nav.car}</L></li>
            <li><L to="two-wheeler-finance">{t.nav.twoWheeler}</L></li>
            <li><L to="emi-calculator">{t.nav.emi}</L></li>
            <li><L to="how-it-works">{t.nav.how}</L></li>
            <li><L to="documents">{t.nav.documents}</L></li>
          </ul>
        </div>
        <div>
          <h2>{t.footer.legal}</h2>
          <ul>
            <li><L to="faq">{t.nav.faq}</L></li>
            <li><L to="about">{t.nav.about}</L></li>
            <li><L to="contact">{t.nav.contact}</L></li>
            <li><L to="privacy">{t.footer.privacy}</L></li>
          </ul>
        </div>
      </div>
      <div className="wrap" style={{ marginTop: 36 }}>
        <p className="fine">{t.footer.disclaimer}</p>
        <p className="fine" style={{ marginTop: 10 }}>© {year} {t.brand}. {t.footer.rights}</p>
      </div>
    </footer>
  );
}
