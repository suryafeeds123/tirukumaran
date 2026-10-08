"use client";
import { useState } from "react";
import { calculateEmi, parseNumber } from "@/lib/emi";
import { useLocale, StartButton } from "./LocaleProvider";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function EmiCalculator() {
  const { t } = useLocale();
  const [amount, setAmount] = useState("500000");
  const [rate, setRate] = useState("");
  const [months, setMonths] = useState("36");
  const [touched, setTouched] = useState({ amount: false, rate: false, months: false });

  const a = parseNumber(amount), r = parseNumber(rate), m = parseNumber(months);
  const res = calculateEmi(a, r, m);
  const errs = {
    amount: !amount.trim() ? "" : Number.isNaN(a) ? t.emi.errNumber : !res.ok && res.errors.includes("amount") ? t.emi.errAmount : "",
    rate: !rate.trim() ? "" : Number.isNaN(r) ? t.emi.errNumber : !res.ok && res.errors.includes("rate") ? t.emi.errRate : "",
    months: !months.trim() ? "" : Number.isNaN(m) ? t.emi.errNumber : !res.ok && res.errors.includes("tenure") ? t.emi.errTenure : "",
  };
  const show = (k: keyof typeof errs) => (touched[k] || errs[k]) && errs[k];
  const principalPct = res.ok ? Math.round((a / res.totalRepayment) * 100) : 100;

  const field = (k: "amount" | "rate" | "months", label: string, hint: string, val: string, set: (v: string) => void, mode: "numeric" | "decimal") => (
    <div className="field">
      <label htmlFor={`emi-${k}`}>{label}</label>
      <input
        id={`emi-${k}`} className="input" inputMode={mode} autoComplete="off" value={val}
        aria-invalid={!!show(k)} aria-describedby={`emi-${k}-h`}
        onChange={(e) => set(e.target.value)} onBlur={() => setTouched((s) => ({ ...s, [k]: true }))}
        placeholder={k === "rate" ? "0 – 60" : undefined}
      />
      <div id={`emi-${k}-h`}>
        {show(k) ? <p className="error" role="alert">{errs[k]}</p> : <p className="hint">{hint}</p>}
      </div>
    </div>
  );

  return (
    <div className="emi-grid">
      <form className="card" onSubmit={(e) => e.preventDefault()} noValidate data-reveal>
        <div style={{ display: "grid", gap: 20 }}>
          {field("amount", t.emi.amount, t.emi.amountHint, amount, setAmount, "numeric")}
          {field("rate", t.emi.rate, t.emi.rateHint, rate, setRate, "decimal")}
          {field("months", t.emi.tenure, t.emi.tenureHint, months, setMonths, "numeric")}
          <p className="hint">{t.emi.rateNote}</p>
        </div>
      </form>
      <div className="card emi-result" data-reveal style={{ ["--i" as string]: 1 }}>
        <div aria-live="polite" aria-atomic="true">
          {res.ok ? (
            <>
              <p className="muted" style={{ fontSize: "0.9rem" }}>{t.emi.resultEmi}</p>
              <p className="emi-big">{inr.format(res.emi)}</p>
              <span className="sr-only">{t.emi.liveRegion}</span>
            </>
          ) : (
            <p className="muted">{t.emi.empty}</p>
          )}
        </div>
        {res.ok && (
          <>
            <div className="emi-bar" aria-hidden="true"><i style={{ width: `${principalPct}%` }} /></div>
            <div className="legend" aria-hidden="true"><span>{t.emi.amount.replace(/\s*\(.*\)/, "")}</span><span>{t.emi.resultInterest}</span></div>
            <div className="emi-row"><span>{t.emi.resultInterest}</span><strong>{inr.format(res.totalInterest)}</strong></div>
            <div className="emi-row"><span>{t.emi.resultTotal}</span><strong>{inr.format(res.totalRepayment)}</strong></div>
          </>
        )}
        <p className="notice" role="note">{t.emi.disclaimer}</p>
        <StartButton className="btn btn-ghost">{t.emi.cta}</StartButton>
      </div>
    </div>
  );
}
