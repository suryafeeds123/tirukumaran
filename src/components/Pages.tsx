"use client";
import { BUSINESS, formatPhoneDisplay, telLink, whatsappLink } from "@/lib/business";
import { CarScene } from "./CarScene";
import { EmiCalculator } from "./EmiCalculator";
import { FaqList } from "./Faq";
import { L, StartButton, useLocale } from "./LocaleProvider";

const rv = (i = 0) => ({ "data-reveal": true, "data-i": Math.min(i, 6) });

function PageHero({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) {
  return (
    <section className="wrap page-hero">
      <span className="eyebrow" {...rv(0)}>{eyebrow}</span>
      <h1 className="h1" {...rv(1)}>{title}</h1>
      <p className="lead" {...rv(2)}>{sub}</p>
    </section>
  );
}

function Steps({ steps, cols, level = 3 }: { steps: { t: string; d: string }[]; cols?: 2; level?: 2 | 3 }) {
  const H = `h${level}` as "h2" | "h3";
  return (
    <div className={`steps${cols === 2 ? " steps-2" : ""}`}>
      {steps.map((s, i) => (
        <div key={i} className="card step" data-tilt {...rv(i)}>
          <span className="card-num" aria-hidden="true">0{i + 1}</span>
          <H>{s.t}</H>
          <p>{s.d}</p>
        </div>
      ))}
    </div>
  );
}

function CtaBand({ title, text }: { title: string; text: string }) {
  return (
    <section className="wrap section" style={{ paddingTop: 0 }}>
      <div className="cta-band" data-reveal>
        <div>
          <h2 className="h2">{title}</h2>
          <p className="lead" style={{ marginTop: 12 }}>{text}</p>
        </div>
        <StartButton />
      </div>
    </section>
  );
}

const CheckList = ({ items }: { items: string[] }) => <ul className="list-check">{items.map((x) => <li key={x}>{x}</li>)}</ul>;

export function HeroVisual({ src }: { src: string | null }) {
  const { t } = useLocale();
  return (
    <div className="hero-visual" data-reveal style={{ ["--i" as string]: 2 }}>
      <div className="hero-layer" data-parallax="0.05">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="hero-photo" src={src} alt="" width={1600} height={900} fetchPriority="high" />
        ) : (
          <CarScene id="hero" />
        )}
      </div>
      <div className="hero-glow-line" aria-hidden="true" />
      <p className="image-note">{t.home.imageNote}</p>
    </div>
  );
}

export function HomePage({ heroSrc }: { heroSrc: string | null }) {
  const { t } = useLocale();
  const h = t.home;
  return (
    <>
      <section className="hero wrap">
        <div className="hero-grid">
          <div>
            <span className="eyebrow" {...rv(0)}>{h.eyebrow}</span>
            <h1 className="h1" {...rv(1)}>{h.title}</h1>
            <p className="lead" {...rv(2)}>{h.sub}</p>
            <div className="hero-actions" {...rv(3)}>
              <StartButton />
              <L to="emi-calculator" className="btn btn-ghost">{h.ctaSecondary}</L>
            </div>
            <div className="pills" {...rv(4)}>
              <span className="pill">{h.pill1}</span><span className="pill">{h.pill2}</span><span className="pill">{h.pill3}</span>
            </div>
          </div>
          <HeroVisual src={heroSrc} />
        </div>
      </section>

      <section className="wrap section">
        <div style={{ maxWidth: 640 }}>
          <h2 className="h2" {...rv(0)}>{h.categoriesTitle}</h2>
          <p className="lead" style={{ marginTop: 16 }} {...rv(1)}>{h.categoriesSub}</p>
        </div>
        <div className="grid-2" style={{ marginTop: 40 }}>
          <L to="car-finance" className="card" style={{ textDecoration: "none" }} data-tilt data-reveal>
            <span className="icon-dot" aria-hidden="true"><CarIcon /></span>
            <h3 className="h3" style={{ marginTop: 20 }}>{h.carCardTitle}</h3>
            <p className="muted" style={{ marginTop: 10 }}>{h.carCardText}</p>
            <p style={{ marginTop: 18, color: "var(--teal)", fontWeight: 700 }}>{t.common.learnMore} →</p>
          </L>
          <L to="two-wheeler-finance" className="card" style={{ textDecoration: "none" }} data-tilt data-reveal>
            <span className="icon-dot" aria-hidden="true"><BikeIcon /></span>
            <h3 className="h3" style={{ marginTop: 20 }}>{h.twCardTitle}</h3>
            <p className="muted" style={{ marginTop: 10 }}>{h.twCardText}</p>
            <p style={{ marginTop: 18, color: "var(--teal)", fontWeight: 700 }}>{t.common.learnMore} →</p>
          </L>
        </div>
      </section>

      <section className="wrap section" style={{ paddingTop: 0 }}>
        <h2 className="h2" {...rv(0)}>{h.processTitle}</h2>
        <p className="lead" style={{ margin: "16px 0 36px" }} {...rv(1)}>{h.processSub}</p>
        <Steps steps={t.how.steps} />
      </section>

      <section className="wrap section" style={{ paddingTop: 0 }}>
        <h2 className="h2" style={{ maxWidth: "20ch" }} {...rv(0)}>{h.trustTitle}</h2>
        <div className="grid-3" style={{ marginTop: 36 }}>
          {h.trust.map((x, i) => (
            <div key={i} className="card" {...rv(i)}>
              <h3 className="h3">{x.t}</h3>
              <p className="muted" style={{ marginTop: 10 }}>{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap section" style={{ paddingTop: 0 }}>
        <div className="card" style={{ display: "grid", gap: 20, alignItems: "center" }} data-reveal>
          <div>
            <h2 className="h2">{h.emiTeaserTitle}</h2>
            <p className="lead" style={{ marginTop: 12 }}>{h.emiTeaserText}</p>
          </div>
          <div><L to="emi-calculator" className="btn btn-ghost">{t.nav.emi} →</L></div>
        </div>
      </section>

      <section className="wrap section" style={{ paddingTop: 0 }}>
        <h2 className="h2" style={{ marginBottom: 28 }} {...rv(0)}>{h.faqTitle}</h2>
        <FaqList items={t.faq.items} limit={3} />
        <p style={{ marginTop: 22 }}><L to="faq" style={{ color: "var(--teal)", fontWeight: 700 }}>{h.faqAll} →</L></p>
      </section>

      <CtaBand title={h.ctaTitle} text={h.ctaText} />
    </>
  );
}

function FinancePage({ k }: { k: "car" | "twoWheeler" }) {
  const { t } = useLocale();
  const p = t[k];
  return (
    <>
      <PageHero eyebrow={p.eyebrow} title={p.title} sub={p.sub} />
      <section className="wrap section" style={{ paddingTop: 16 }}>
        <div className="grid-2" style={{ alignItems: "start" }}>
          <div className="prose" data-reveal>
            <h2 className="h2" style={{ marginBottom: 20 }}>{p.introTitle}</h2>
            {p.intro.map((x) => <p key={x} className="muted">{x}</p>)}
          </div>
          <div className="card" data-reveal data-tilt style={{ ["--i" as string]: 1 }}>
            <h3 className="h3">{p.shareTitle}</h3>
            <CheckList items={p.share} />
          </div>
        </div>
      </section>
      <section className="wrap section" style={{ paddingTop: 0 }}>
        <div className="card" data-reveal>
          <h3 className="h3">{p.teamTitle}</h3>
          <CheckList items={p.team} />
          <p className="notice" style={{ marginTop: 22 }}>{p.teamNote}</p>
        </div>
      </section>
      <section className="wrap section" style={{ paddingTop: 0 }}>
        <h2 className="h2" style={{ marginBottom: 28 }} {...rv(0)}>{p.stepsTitle}</h2>
        <Steps steps={t.how.steps} />
      </section>
      <CtaBand title={t.home.ctaTitle} text={t.home.ctaText} />
    </>
  );
}
export const CarPage = () => <FinancePage k="car" />;
export const TwoWheelerPage = () => <FinancePage k="twoWheeler" />;

export function HowPage() {
  const { t } = useLocale();
  return (
    <>
      <PageHero eyebrow={t.how.eyebrow} title={t.how.title} sub={t.how.sub} />
      <section className="wrap section" style={{ paddingTop: 16 }}>
        <Steps steps={t.how.steps} cols={2} level={2} />
        <p className="notice" style={{ marginTop: 28 }} {...rv(0)}>{t.how.note}</p>
      </section>
      <CtaBand title={t.home.ctaTitle} text={t.home.ctaText} />
    </>
  );
}

export function DocumentsPage() {
  const { t } = useLocale();
  const d = t.documents;
  return (
    <>
      <PageHero eyebrow={d.eyebrow} title={d.title} sub={d.sub} />
      <section className="wrap section" style={{ paddingTop: 16 }}>
        <p className="notice" {...rv(0)}>{d.warn}</p>
        <div className="grid-2" style={{ marginTop: 28 }}>
          {d.groups.map((g, i) => (
            <div key={g.t} className="card" data-tilt {...rv(i % 2)}>
              <h2 className="h3">{g.t}</h2>
              <CheckList items={g.items} />
            </div>
          ))}
        </div>
      </section>
      <section className="wrap section" style={{ paddingTop: 0 }}>
        <div className="card" data-reveal>
          <h2 className="h3">{d.safeTitle}</h2>
          <CheckList items={d.safe} />
        </div>
      </section>
      <CtaBand title={t.home.ctaTitle} text={t.home.ctaText} />
    </>
  );
}

export function EmiPage() {
  const { t } = useLocale();
  return (
    <>
      <PageHero eyebrow={t.emi.eyebrow} title={t.emi.title} sub={t.emi.sub} />
      <section className="wrap section" style={{ paddingTop: 16 }}><EmiCalculator /></section>
    </>
  );
}

export function FaqPage() {
  const { t } = useLocale();
  return (
    <>
      <PageHero eyebrow={t.faq.eyebrow} title={t.faq.title} sub={t.faq.sub} />
      <section className="wrap section" style={{ paddingTop: 16 }}><FaqList items={t.faq.items} level={2} /></section>
      <CtaBand title={t.home.ctaTitle} text={t.home.ctaText} />
    </>
  );
}

export function AboutPage() {
  const { t } = useLocale();
  const a = t.about;
  return (
    <>
      <PageHero eyebrow={a.eyebrow} title={a.title} sub={a.sub} />
      <section className="wrap section" style={{ paddingTop: 16 }}>
        <div className="grid-3">
          {a.sections.map((s, i) => (
            <div key={s.t} className="card" data-tilt {...rv(i)}>
              <h2 className="h3">{s.t}</h2>
              <p className="muted" style={{ marginTop: 10 }}>{s.d}</p>
            </div>
          ))}
        </div>
        <div className="card" style={{ marginTop: 20 }} data-reveal>
          <h2 className="h3">{a.pendingTitle}</h2>
          <p className="muted" style={{ marginTop: 10 }}>{a.pending}</p>
        </div>
      </section>
      <CtaBand title={t.home.ctaTitle} text={t.home.ctaText} />
    </>
  );
}

export function ContactPage() {
  const { t, locale } = useLocale();
  const c = t.contact;
  const phone = formatPhoneDisplay(BUSINESS.phone);
  const tel = telLink(BUSINESS.phone);
  const wa = whatsappLink(BUSINESS.whatsapp, c.whatsappMessage);
  const address = BUSINESS.address[locale] ?? BUSINESS.address.en;
  const hours = BUSINESS.hours[locale] ?? BUSINESS.hours.en;
  const hasAny = !!(phone || wa || address || hours);
  return (
    <>
      <PageHero eyebrow={c.eyebrow} title={c.title} sub={c.sub} />
      <section className="wrap section" style={{ paddingTop: 16 }}>
        <div className="grid-2" style={{ alignItems: "start" }}>
          <div className="card" data-reveal>
            <dl className="contact-list" style={{ margin: 0 }}>
              <div className="contact-item"><dt>{c.locationLabel}</dt><dd>{c.location}</dd></div>
              {phone && <div className="contact-item"><dt>{c.phone}</dt><dd><a href={tel ?? undefined}>{phone}</a></dd></div>}
              {address && <div className="contact-item"><dt>{c.address}</dt><dd>{address}</dd></div>}
              {hours && <div className="contact-item"><dt>{c.hours}</dt><dd>{hours}</dd></div>}
            </dl>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 26 }}>
              <StartButton />
              {tel && <a className="btn btn-ghost" href={tel}>{c.callNow}</a>}
              {wa && <a className="btn btn-ghost" href={wa} target="_blank" rel="noopener noreferrer">{c.whatsappText}</a>}
              {BUSINESS.mapLink && <a className="btn btn-ghost" href={BUSINESS.mapLink} target="_blank" rel="noopener noreferrer">{c.openMap}</a>}
            </div>
          </div>
          <div data-reveal style={{ ["--i" as string]: 1 }}>
            {BUSINESS.mapEmbed ? (
              <iframe className="map-frame" title={c.map} src={BUSINESS.mapEmbed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            ) : null}
            {!hasAny && (
              <div className="card">
                <h2 className="h3">{c.pendingTitle}</h2>
                <p className="muted" style={{ marginTop: 10 }}>{c.pending}</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

export function PrivacyPage() {
  const { t } = useLocale();
  const p = t.privacy;
  return (
    <>
      <PageHero eyebrow={p.eyebrow} title={p.title} sub={p.sub} />
      <section className="wrap section" style={{ paddingTop: 16 }}>
        <p className="muted" style={{ marginBottom: 24 }}>{p.updated}</p>
        <div className="grid-2">
          {p.blocks.map((b, i) => (
            <div key={b.t} className="card" {...rv(i % 2)}>
              <h2 className="h3">{b.t}</h2>
              <p className="muted" style={{ marginTop: 10 }}>{b.d}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function CarIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 15v-3l2-5h14l2 5v3M3 15h18M3 15v3h3v-2M21 15v3h-3v-2" /><circle cx="7.5" cy="15" r="0.8" /><circle cx="16.5" cy="15" r="0.8" /></svg>;
}
function BikeIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="5.5" cy="16.5" r="3.5" /><circle cx="18.5" cy="16.5" r="3.5" /><path d="M5.5 16.5L9 9h4l3 7.5M9 9L7.5 6H6M13 9l1.5-3H17" /></svg>;
}
