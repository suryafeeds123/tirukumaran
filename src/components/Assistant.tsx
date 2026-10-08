"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { fmt } from "@/i18n";
import { LOAN_LIMITS, isValidText, normalizeMobile } from "@/lib/rules";
import { parseNumber } from "@/lib/emi";
import { assistStore, useAssist } from "./assistant-store";
import { L, focusReturn, useLocale } from "./LocaleProvider";
import { LogoMark } from "./Logo";

const TOTAL = 7;
const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

type Errors = Partial<Record<"vehicle" | "amount" | "area" | "employment" | "name" | "mobile" | "callback" | "consent" | "form", string>>;

export function Assistant() {
  const { t, locale } = useLocale();
  const a = t.assistant;
  const s = useAssist();
  const [live, setLive] = useState<boolean | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [fromReview, setFromReview] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const submitting = useRef(false);

  // Ask the server whether storage is live. Until it is, this is a preview and nothing is sent.
  useEffect(() => {
    if (!s.open) return;
    let cancelled = false;
    fetch("/api/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => !cancelled && setLive(!!j.live))
      .catch(() => !cancelled && setLive(null));
    return () => { cancelled = true; };
  }, [s.open]);

  const close = useCallback(() => {
    assistStore.close();
    document.documentElement.style.overflow = "";
    window.setTimeout(() => focusReturn.el?.focus?.(), 0);
  }, []);

  // Scroll lock, escape, focus trap, initial focus.
  useEffect(() => {
    if (!s.open) return;
    document.documentElement.style.overflow = "hidden";
    const t0 = setTimeout(() => assistStore.set({ animated: true }), 600);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key !== "Tab" || !panelRef.current) return;
      const f = panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])');
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); clearTimeout(t0); document.documentElement.style.overflow = ""; };
  }, [s.open, close]);

  useEffect(() => { if (s.open) headingRef.current?.focus({ preventScroll: true }); }, [s.open, s.step, s.result]);

  const d = s.draft;
  const go = (step: number) => { setErrors({}); assistStore.set({ step }); };
  const next = (from: number) => { if (fromReview) { setFromReview(false); go(6); } else go(from + 1); };

  const validate = (step: number): Errors => {
    const e: Errors = {};
    if (step === 0 && !d.vehicle) e.vehicle = a.errChoice;
    if (step === 1) {
      const n = parseNumber(d.amount);
      if (!Number.isInteger(n) || n < LOAN_LIMITS.min || n > LOAN_LIMITS.max) e.amount = a.errAmount;
    }
    if (step === 2 && !isValidText(d.area, 2, 80)) e.area = a.errArea;
    if (step === 3 && !d.employment) e.employment = a.errChoice;
    if (step === 4) {
      if (!isValidText(d.name, 2, 80)) e.name = a.errName;
      if (!normalizeMobile(d.mobile)) e.mobile = a.errMobile;
    }
    if (step === 5 && !d.callback) e.callback = a.errChoice;
    if (step === 6 && !d.consent) e.consent = a.errConsent;
    return e;
  };

  const advance = () => {
    const e = validate(s.step);
    setErrors(e);
    if (Object.keys(e).length) return;
    next(s.step);
  };

  const choose = <K extends "vehicle" | "employment" | "callback">(k: K, v: (typeof d)[K]) => {
    assistStore.setDraft({ [k]: v } as never);
    setErrors({});
    window.setTimeout(() => next(s.step), 160);
  };

  const submit = async () => {
    if (submitting.current) return; // duplicate-submit guard
    const all: Errors = {};
    for (let i = 0; i <= 6; i++) Object.assign(all, validate(i));
    if (Object.keys(all).length) {
      setErrors({ ...all, form: a.errValidation });
      const order = ["vehicle", "amount", "area", "employment", "name", "mobile", "callback"] as const;
      const bad = order.findIndex((k) => all[k]);
      if (bad >= 0) go([0, 1, 2, 3, 4, 4, 5][bad]);
      return;
    }
    if (live === false) { assistStore.set({ result: { kind: "preview" }, step: 7 }); return; }
    submitting.current = true;
    setBusy(true);
    setErrors({});
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: s.idempotencyKey,
          vehicleType: d.vehicle,
          loanAmount: parseNumber(d.amount),
          area: d.area,
          employment: d.employment,
          name: d.name,
          mobile: d.mobile,
          callbackTime: d.callback,
          consent: true,
          language: locale,
          website: "",
          openedAt: s.openedAt,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        assistStore.set({ result: { kind: "success", reference: body.reference, name: d.name, mobile: normalizeMobile(d.mobile) ?? d.mobile }, step: 7 });
      } else if (res.status === 503 && body.error === "preview_mode") {
        setLive(false);
        assistStore.set({ result: { kind: "preview" }, step: 7 });
      } else if (res.status === 429) setErrors({ form: a.errRate });
      else if (res.status === 422) setErrors({ form: a.errValidation });
      else setErrors({ form: a.errServer });
    } catch {
      setErrors({ form: a.errNetwork });
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  if (!s.open) return null;

  const progress = Math.min(((s.step + 1) / TOTAL) * 100, 100);
  const errId = (k: string) => `as-err-${k}`;

  const choices = <K extends "vehicle" | "employment" | "callback">(k: K, opts: [(typeof d)[K], string][]) => (
    <div className="choice-grid" role="group" aria-labelledby="as-q">
      {opts.map(([v, label]) => (
        <button key={v} type="button" className="choice" aria-pressed={d[k] === v} onClick={() => choose(k, v)}>
          <span>{label}</span><span aria-hidden="true">{d[k] === v ? "✓" : "›"}</span>
        </button>
      ))}
      {errors[k] && <p className="error" role="alert" id={errId(k)}>{errors[k]}</p>}
    </div>
  );

  const textField = (k: "amount" | "area" | "name" | "mobile", label: string, opts: { hint?: string; mode?: "text" | "numeric" | "tel"; auto?: string }) => (
    <div className="field">
      <label htmlFor={`as-${k}`}>{label}</label>
      <input
        id={`as-${k}`} className="input" value={d[k]} inputMode={opts.mode} autoComplete={opts.auto ?? "off"}
        aria-invalid={!!errors[k]} aria-describedby={errors[k] ? errId(k) : opts.hint ? `as-h-${k}` : undefined}
        maxLength={k === "area" || k === "name" ? 80 : 20}
        onChange={(e) => assistStore.setDraft({ [k]: e.target.value })}
        onKeyDown={(e) => { if (e.key === "Enter" && s.step !== 4) { e.preventDefault(); advance(); } }}
      />
      {errors[k] ? <p className="error" role="alert" id={errId(k)}>{errors[k]}</p> : opts.hint ? <p className="hint" id={`as-h-${k}`}>{opts.hint}</p> : null}
    </div>
  );

  const rows: [string, string, number][] = [
    [a.reviewLabels.vehicle, d.vehicle ? a.vehicleName[d.vehicle] : "", 0],
    [a.reviewLabels.amount, Number.isFinite(parseNumber(d.amount)) ? inr.format(parseNumber(d.amount)) : d.amount, 1],
    [a.reviewLabels.area, d.area, 2],
    [a.reviewLabels.employment, d.employment ? a.employmentName[d.employment] : "", 3],
    [a.reviewLabels.name, d.name, 4],
    [a.reviewLabels.mobile, d.mobile, 4],
    [a.reviewLabels.callback, d.callback ? a.callbackName[d.callback] : "", 5],
  ];

  let body: React.ReactNode;
  let footer: React.ReactNode = null;

  if (s.result) {
    const r = s.result;
    body = (
      <div className="assist-step" style={{ textAlign: "center", justifyItems: "center", paddingTop: 16 }}>
        {r.kind === "success" ? (
          <>
            <svg className="success-mark" viewBox="0 0 64 64" fill="none" aria-hidden="true">
              <circle cx="32" cy="32" r="28" stroke="#3fe0d0" strokeWidth="3" pathLength={1} />
              <path d="M20 33 L29 42 L45 24" stroke="#3fe0d0" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
            </svg>
            <h3 ref={headingRef} tabIndex={-1}>{fmt(a.successTitle, { name: r.name })}</h3>
            <p>{fmt(a.success, { mobile: r.mobile, ref: r.reference })}</p>
            <p className="muted" style={{ fontSize: "0.9rem" }}>{a.successNote}</p>
          </>
        ) : (
          <>
            <h3 ref={headingRef} tabIndex={-1}>{a.previewResultTitle}</h3>
            <p className="banner">{a.previewResult}</p>
          </>
        )}
      </div>
    );
    footer = (
      <>
        <button type="button" className="btn btn-ghost" onClick={() => assistStore.reset()}>{a.restart}</button>
        <button type="button" className="btn btn-primary" onClick={close}>{a.another}</button>
      </>
    );
  } else {
    const heading = (txt: string) => <h3 id="as-q" ref={headingRef} tabIndex={-1}>{txt}</h3>;
    switch (s.step) {
      case 0:
        body = (<>
          <p className="bubble">{a.greeting}</p>
          <p className="hint">{a.noSensitive}</p>
          <div className="assist-step">{heading(a.qVehicle)}{choices("vehicle", [["car", a.aCar], ["two_wheeler", a.aTwoWheeler]])}</div>
        </>); break;
      case 1:
        body = <div className="assist-step">{heading(a.qAmount)}{textField("amount", a.amountLabel, { hint: a.amountHint, mode: "numeric" })}</div>; break;
      case 2:
        body = <div className="assist-step">{heading(a.qArea)}{textField("area", a.areaLabel, { hint: a.areaHint, auto: "address-level2" })}</div>; break;
      case 3:
        body = <div className="assist-step">{heading(a.qEmployment)}{choices("employment", [["salaried", a.aSalaried], ["self_employed", a.aSelf], ["business", a.aBusiness]])}</div>; break;
      case 4:
        body = (
          <div className="assist-step">
            {heading(a.qContact)}
            {textField("name", a.nameLabel, { auto: "name" })}
            {textField("mobile", a.mobileLabel, { hint: a.mobileHint, mode: "tel", auto: "tel-national" })}
          </div>
        ); break;
      case 5:
        body = (<div className="assist-step">{heading(a.qCallback)}{choices("callback", [["morning", a.aMorning], ["afternoon", a.aAfternoon], ["evening", a.aEvening], ["anytime", a.aAnytime]])}<p className="hint">{a.callbackNote}</p></div>); break;
      default:
        body = (
          <div className="assist-step">
            {heading(a.qReview)}
            <dl className="review" style={{ margin: 0 }}>
              {rows.map(([k, v, st], i) => (
                <div key={i} className="review-row">
                  <dt>{k}</dt>
                  <dd>{v}<button type="button" onClick={() => { setFromReview(true); go(st); }} aria-label={`${t.common.edit}: ${k}`}>{t.common.edit}</button></dd>
                </div>
              ))}
            </dl>
            <div className="checkbox-row">
              <input id="as-consent" type="checkbox" checked={d.consent} aria-invalid={!!errors.consent} aria-describedby={errors.consent ? errId("consent") : undefined} onChange={(e) => assistStore.setDraft({ consent: e.target.checked })} />
              <label htmlFor="as-consent" style={{ fontSize: "0.92rem" }}>
                {a.consent} <L to="privacy" target="_blank" style={{ color: "var(--teal)" }}>{a.consentLink}</L>
              </label>
            </div>
            {errors.consent && <p className="error" role="alert" id={errId("consent")}>{errors.consent}</p>}
            {/* Honeypot: invisible to people, tempting to bots. */}
            <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }} />
            {errors.form && <p className="banner banner-err" role="alert">{errors.form}</p>}
          </div>
        );
    }
    const isChoice = s.step === 0 || s.step === 3 || s.step === 5;
    footer = (
      <>
        {s.step > 0 && <button type="button" className="btn btn-ghost" onClick={() => { if (fromReview) { setFromReview(false); go(6); } else go(s.step - 1); }}>{t.common.back}</button>}
        {s.step === 6 ? (
          <button type="button" className="btn btn-primary" disabled={busy} aria-busy={busy} onClick={submit}>{busy ? a.submitting : live === false ? `${t.common.preview}: ${a.submit}` : a.submit}</button>
        ) : !isChoice ? (
          <button type="button" className="btn btn-primary" onClick={advance}>{t.common.next} <span className="arrow" aria-hidden="true">→</span></button>
        ) : null}
      </>
    );
  }

  return (
    <>
      <div className="assistant-backdrop" onClick={close} aria-hidden="true" />
      <div ref={panelRef} className={`assistant${s.animated ? " assistant-static" : ""}`} role="dialog" aria-modal="true" aria-label={a.title} lang={locale}>
        <div className="assist-head">
          <LogoMark animate={!s.animated} />
          <div>
            <h2>{a.title}</h2>
            {!s.result && <p className="hint" aria-live="polite">{fmt(a.progress, { n: s.step + 1, total: TOTAL })}</p>}
          </div>
          <button type="button" className="assist-close" onClick={close} aria-label={a.close}>×</button>
        </div>
        <div className="assist-progress" aria-hidden="true"><i style={{ width: `${s.result ? 100 : progress}%` }} /></div>
        <div className="assist-body">
          {live === false && !s.result && <p className="banner" role="status">{a.previewBanner}</p>}
          {body}
        </div>
        <div className="assist-foot">{footer}</div>
      </div>
    </>
  );
}

export function AssistantLauncher() {
  const { t, openAssistant } = useLocale();
  const s = useAssist();
  return (
    <button type="button" className="fab" hidden={s.open} onClick={(e) => openAssistant(e.currentTarget)}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 5h16v11H9l-5 4V5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>
      <span>{t.assistant.open}</span>
    </button>
  );
}
