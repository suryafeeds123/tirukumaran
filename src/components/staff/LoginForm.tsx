"use client";
import { useState } from "react";
import { LogoMark, Wordmark } from "../Logo";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/staff/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      if (r.ok) { window.location.href = "/staff/enquiries"; return; }
      setErr(r.status === 429 ? "Too many attempts. Wait a few minutes and try again."
        : r.status === 423 ? "This account is temporarily locked. Try again in 15 minutes."
        : "Email or password is incorrect.");
    } catch { setErr("Could not reach the server. Try again."); }
    setBusy(false);
  }

  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 16 }}>
      <form onSubmit={submit} className="card" style={{ width: "min(420px, 100%)", display: "grid", gap: 18 }} aria-labelledby="t">
        <div className="brand"><LogoMark /><Wordmark /></div>
        <div>
          <h1 id="t" className="h3" style={{ fontFamily: "var(--font-body)", fontWeight: 700 }}>Office dashboard</h1>
          <p className="hint">Staff sign-in. Authorised personnel only.</p>
        </div>
        <div className="field"><label htmlFor="em">Email</label><input id="em" className="input" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="field"><label htmlFor="pw">Password</label><input id="pw" className="input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        {err && <p className="banner banner-err" role="alert">{err}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
    </main>
  );
}
