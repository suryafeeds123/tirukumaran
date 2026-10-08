"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { whatsappLink, telLink } from "@/lib/business";
import { LogoMark, Wordmark } from "../Logo";
import { CALLBACK_LABEL, EMPLOYMENT_LABEL, STATUS_LABEL, StatusBadge, VEHICLE_LABEL, fmtDate, fmtDateTime, inr, isOverdue, logout } from "./shared";

type Enq = {
  id: string; created_at: string; vehicle_type: string; loan_amount: number; area: string; employment: string; name: string; mobile: string;
  callback_time: string; language: string; consent_at: string; status: string; assigned_to: number | null; next_follow_up: string | null;
};
type Note = { id: number; body: string; created_at: string; author: string | null };
type Ev = { id: number; type: string; detail: string | null; created_at: string; author: string | null };

export function EnquiryDetail({ id, user }: { id: string; user: { name: string; role: "admin" | "staff" } }) {
  const [data, setData] = useState<{ enquiry: Enq; notes: Note[]; events: Ev[]; today: string } | null>(null);
  const [users, setUsers] = useState<{ id: number; name: string }[]>([]);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [note, setNote] = useState("");
  const [follow, setFollow] = useState("");

  const load = useCallback(async () => {
    const r = await fetch(`/api/staff/enquiries/${id}`, { cache: "no-store" });
    if (r.status === 401) { window.location.href = "/staff"; return; }
    if (!r.ok) { setErr("Enquiry not found."); return; }
    const j = await r.json();
    setData(j); setFollow(j.enquiry.next_follow_up ?? "");
  }, [id]);
  useEffect(() => { load(); fetch("/api/staff/users").then((r) => r.json()).then((j) => setUsers(j.users ?? [])); }, [load]);

  async function patch(body: object, ok: string) {
    setMsg(""); setErr("");
    const r = await fetch(`/api/staff/enquiries/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (r.ok) { setMsg(ok); await load(); } else setErr("Could not save. Please try again.");
  }
  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    const r = await fetch(`/api/staff/enquiries/${id}/notes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: note }) });
    if (r.ok) { setNote(""); setMsg("Note added."); await load(); } else setErr("Could not add the note.");
  }
  async function del() {
    if (!confirm("Permanently delete this enquiry and its notes? This cannot be undone.")) return;
    const r = await fetch(`/api/staff/enquiries/${id}`, { method: "DELETE" });
    if (r.ok) window.location.href = "/staff/enquiries"; else setErr("Could not delete.");
  }

  const shell = (children: React.ReactNode) => (
    <div className="wrap" style={{ paddingBlock: 20 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <div className="brand"><LogoMark animate={false} /><Wordmark /></div>
        <p className="muted" style={{ marginLeft: "auto" }}>{user.name} · {user.role}</p>
        <button className="btn btn-ghost btn-sm" onClick={logout}>Sign out</button>
      </header>
      <Link href="/staff/enquiries" style={{ color: "var(--teal)" }}>← All enquiries</Link>
      {children}
    </div>
  );

  if (err && !data) return shell(<p className="banner banner-err" role="alert" style={{ marginTop: 20 }}>{err}</p>);
  if (!data) return shell(<p className="muted" style={{ marginTop: 20 }}>Loading…</p>);

  const e = data.enquiry;
  const od = isOverdue(e.next_follow_up, e.status, data.today);
  const waText = `Hello ${e.name}, this is TIRUKUMARAN AUTO FINANCE regarding your ${e.vehicle_type === "car" ? "car" : "two wheeler"} finance enquiry.`;
  const wa = whatsappLink(e.mobile, waText);
  const tel = telLink(e.mobile);
  const row = (k: string, v: React.ReactNode) => <div className="review-row"><dt>{k}</dt><dd>{v}</dd></div>;

  return shell(
    <>
      <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", margin: "16px 0 6px" }}>
        <h1 className="h2" style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "1.7rem" }}>{e.name}</h1>
        <StatusBadge status={e.status} />
        {od && <span style={{ color: "var(--danger)", fontWeight: 700 }}>Follow-up overdue</span>}
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "12px 0 24px" }}>
        {tel && <a className="btn btn-primary btn-sm" href={tel}>Call {e.mobile}</a>}
        {wa && <a className="btn btn-ghost btn-sm" href={wa} target="_blank" rel="noopener noreferrer">Open WhatsApp</a>}
        <span className="hint" style={{ alignSelf: "center" }}>WhatsApp opens a draft; you send it manually.</span>
      </div>
      {(msg || err) && <p className={err ? "banner banner-err" : "banner"} role="status" style={{ marginBottom: 16 }}>{err || msg}</p>}

      <div className="grid-2" style={{ alignItems: "start" }}>
        <section className="card" aria-label="Enquiry details">
          <dl className="review" style={{ margin: 0 }}>
            {row("Vehicle", VEHICLE_LABEL[e.vehicle_type])}
            {row("Loan amount", inr.format(e.loan_amount))}
            {row("Area", e.area)}
            {row("Employment", EMPLOYMENT_LABEL[e.employment])}
            {row("Mobile", e.mobile)}
            {row("Callback", CALLBACK_LABEL[e.callback_time])}
            {row("Language", e.language === "ta" ? "Tamil" : "English")}
            {row("Received", fmtDateTime(e.created_at))}
            {row("Consent given", fmtDateTime(e.consent_at))}
          </dl>
        </section>

        <section className="card" aria-label="Manage" style={{ display: "grid", gap: 16 }}>
          <div className="field"><label htmlFor="st">Status (set manually)</label>
            <select id="st" className="input" value={e.status} onChange={(ev) => patch({ status: ev.target.value }, "Status updated.")}>
              {Object.entries(STATUS_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select></div>
          <div className="field"><label htmlFor="as">Assigned to</label>
            <select id="as" className="input" value={e.assigned_to ?? ""} onChange={(ev) => patch({ assignedTo: ev.target.value ? Number(ev.target.value) : null }, "Assignment updated.")}>
              <option value="">Unassigned</option>{users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select></div>
          <div className="field"><label htmlFor="fu">Next follow-up</label>
            <div style={{ display: "flex", gap: 10 }}>
              <input id="fu" className="input" type="date" value={follow} onChange={(ev) => setFollow(ev.target.value)} />
              <button className="btn btn-ghost btn-sm" onClick={() => patch({ nextFollowUp: follow || null }, "Follow-up saved.")}>Save</button>
            </div>
            {e.next_follow_up && <p className="hint" style={{ color: od ? "var(--danger)" : undefined }}>{od ? "Overdue since " : "Scheduled: "}{fmtDate(e.next_follow_up)}</p>}
          </div>
          {user.role === "admin" && <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={del}>Delete enquiry…</button>}
        </section>
      </div>

      <div className="grid-2" style={{ marginTop: 20, alignItems: "start" }}>
        <section className="card" aria-label="Notes">
          <h2 className="h3" style={{ fontFamily: "var(--font-body)", fontWeight: 700 }}>Notes</h2>
          <form onSubmit={addNote} style={{ display: "grid", gap: 10, marginTop: 14 }}>
            <label htmlFor="nt" className="sr-only">New note</label>
            <textarea id="nt" className="input" rows={3} style={{ padding: 12, resize: "vertical" }} maxLength={2000} value={note} onChange={(ev) => setNote(ev.target.value)} placeholder="Add a note about this enquiry" />
            <button className="btn btn-primary btn-sm" style={{ justifySelf: "start" }}>Add note</button>
          </form>
          <ul style={{ listStyle: "none", padding: 0, marginTop: 18, display: "grid", gap: 12 }}>
            {data.notes.map((n) => (
              <li key={n.id} style={{ borderTop: "1px solid var(--line)", paddingTop: 12 }}>
                <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{n.body}</p>
                <p className="hint">{n.author ?? "Unknown"} · {fmtDateTime(n.created_at)}</p>
              </li>
            ))}
            {data.notes.length === 0 && <li className="muted">No notes yet.</li>}
          </ul>
        </section>
        <section className="card" aria-label="Activity">
          <h2 className="h3" style={{ fontFamily: "var(--font-body)", fontWeight: 700 }}>Activity</h2>
          <ul style={{ listStyle: "none", padding: 0, marginTop: 14, display: "grid", gap: 10 }}>
            {data.events.map((ev) => (
              <li key={ev.id} className="hint">{fmtDateTime(ev.created_at)} · {ev.type === "created" ? "Enquiry received" : `${ev.type.replace("_", " ")}: ${ev.detail ?? ""}`}{ev.author ? ` · ${ev.author}` : ""}</li>
            ))}
          </ul>
        </section>
      </div>
    </>,
  );
}
