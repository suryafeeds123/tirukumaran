"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LogoMark, Wordmark } from "../Logo";
import { CALLBACK_LABEL, STATUS_LABEL, StatusBadge, VEHICLE_LABEL, fmtDate, fmtDateTime, inr, isOverdue, logout } from "./shared";

type Row = {
  id: string; created_at: string; vehicle_type: string; loan_amount: number; area: string; name: string; mobile: string;
  callback_time: string; status: string; assigned_name: string | null; next_follow_up: string | null;
};
type Filters = { q: string; vehicle: string; area: string; status: string; assigned: string; from: string; to: string; overdue: boolean };
const empty: Filters = { q: "", vehicle: "", area: "", status: "", assigned: "", from: "", to: "", overdue: false };

function qs(f: Filters, page?: number) {
  const p = new URLSearchParams();
  Object.entries(f).forEach(([k, v]) => { if (v) p.set(k, v === true ? "1" : String(v)); });
  if (page && page > 1) p.set("page", String(page));
  return p.toString();
}

export function Dashboard({ user }: { user: { name: string; role: "admin" | "staff" } }) {
  const [f, setF] = useState<Filters>(empty);
  const [applied, setApplied] = useState<Filters>(empty);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [today, setToday] = useState("");
  const [users, setUsers] = useState<{ id: number; name: string }[]>([]);
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const r = await fetch(`/api/staff/enquiries?${qs(applied, page)}`, { cache: "no-store" });
      if (r.status === 401) { window.location.href = "/staff"; return; }
      const j = await r.json();
      setRows(j.rows); setTotal(j.total); setToday(j.today); setState("ok");
    } catch { setState("error"); }
  }, [applied, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { fetch("/api/staff/users").then((r) => r.json()).then((j) => setUsers(j.users ?? [])).catch(() => {}); }, []);

  const apply = (e: React.FormEvent) => { e.preventDefault(); setPage(1); setApplied(f); };
  const pages = Math.max(1, Math.ceil(total / 25));
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setF((s) => ({ ...s, [k]: v }));
  const sel = (id: string, label: string, v: string, on: (v: string) => void, opts: [string, string][]) => (
    <div className="field"><label htmlFor={id}>{label}</label>
      <select id={id} className="input" value={v} onChange={(e) => on(e.target.value)}>
        <option value="">All</option>{opts.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select></div>
  );

  return (
    <div className="wrap" style={{ paddingBlock: 20 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <div className="brand"><LogoMark animate={false} /><Wordmark /></div>
        <p className="muted" style={{ marginLeft: "auto" }}>{user.name} · {user.role}</p>
        <button className="btn btn-ghost btn-sm" onClick={logout}>Sign out</button>
      </header>
      <h1 className="h2" style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "1.7rem" }}>Enquiries</h1>
      <p className="hint" style={{ margin: "6px 0 20px" }}>Approval status is set manually by staff. This software makes no lending decisions.</p>

      <form className="card" onSubmit={apply} aria-label="Filters" style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", alignItems: "end" }}>
        <div className="field"><label htmlFor="q">Search name or phone</label><input id="q" className="input" value={f.q} onChange={(e) => set("q", e.target.value)} /></div>
        {sel("vehicle", "Vehicle", f.vehicle, (v) => set("vehicle", v), Object.entries(VEHICLE_LABEL))}
        <div className="field"><label htmlFor="area">Area</label><input id="area" className="input" value={f.area} onChange={(e) => set("area", e.target.value)} /></div>
        {sel("status", "Status", f.status, (v) => set("status", v), Object.entries(STATUS_LABEL))}
        <div className="field"><label htmlFor="asg">Assigned to</label>
          <select id="asg" className="input" value={f.assigned} onChange={(e) => set("assigned", e.target.value)}>
            <option value="">All</option><option value="unassigned">Unassigned</option>{users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select></div>
        <div className="field"><label htmlFor="from">From</label><input id="from" className="input" type="date" value={f.from} onChange={(e) => set("from", e.target.value)} /></div>
        <div className="field"><label htmlFor="to">To</label><input id="to" className="input" type="date" value={f.to} onChange={(e) => set("to", e.target.value)} /></div>
        <div className="checkbox-row" style={{ alignItems: "center", minHeight: 52 }}>
          <input id="od" type="checkbox" checked={f.overdue} onChange={(e) => set("overdue", e.target.checked)} /><label htmlFor="od">Overdue follow-ups only</label>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn btn-primary btn-sm">Apply</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setF(empty); setApplied(empty); setPage(1); }}>Reset</button>
          {user.role === "admin" && <a className="btn btn-ghost btn-sm" href={`/api/staff/export?${qs(applied)}`}>Export CSV</a>}
        </div>
      </form>

      <p className="muted" style={{ margin: "20px 0 10px" }} aria-live="polite">
        {state === "loading" ? "Loading…" : state === "error" ? "Could not load enquiries." : `${total} enquir${total === 1 ? "y" : "ies"}`}
      </p>
      {state === "error" && <button className="btn btn-ghost btn-sm" onClick={load}>Retry</button>}

      <div role="list" style={{ display: "grid", gap: 10 }}>
        {rows.map((r) => {
          const od = isOverdue(r.next_follow_up, r.status, today);
          return (
            <Link key={r.id} role="listitem" href={`/staff/enquiries/${r.id}`} className="card" style={{ textDecoration: "none", display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", alignItems: "center", padding: 18, borderColor: od ? "rgba(255,138,155,0.6)" : undefined }}>
              <div><strong>{r.name}</strong><div className="hint">{r.mobile} · {r.area}</div></div>
              <div>{VEHICLE_LABEL[r.vehicle_type]} · {inr.format(r.loan_amount)}<div className="hint">{CALLBACK_LABEL[r.callback_time]}</div></div>
              <div><StatusBadge status={r.status} /><div className="hint" style={{ marginTop: 4 }}>{r.assigned_name ? `Assigned: ${r.assigned_name}` : "Unassigned"}</div></div>
              <div className="hint">
                {fmtDateTime(r.created_at)}
                {r.next_follow_up && <div style={{ color: od ? "var(--danger)" : undefined, fontWeight: od ? 700 : 400 }}>{od ? "Overdue: " : "Follow-up: "}{fmtDate(r.next_follow_up)}</div>}
              </div>
            </Link>
          );
        })}
        {state === "ok" && rows.length === 0 && <p className="card muted">No enquiries match these filters.</p>}
      </div>

      {pages > 1 && (
        <nav aria-label="Pagination" style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 20 }}>
          <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span className="muted">Page {page} of {pages}</span>
          <button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
        </nav>
      )}
    </div>
  );
}
