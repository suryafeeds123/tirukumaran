import crypto from "node:crypto";
import { getDb } from "./db";
import { CONSENT_VERSION, type EnquiryInput } from "./validation";

export type EnquiryRow = {
  id: string;
  created_at: string;
  updated_at: string;
  vehicle_type: "car" | "two_wheeler";
  loan_amount: number;
  area: string;
  employment: string;
  name: string;
  mobile: string;
  callback_time: string;
  language: string;
  consent_at: string;
  consent_version: string;
  status: string;
  assigned_to: number | null;
  assigned_name?: string | null;
  next_follow_up: string | null;
};

/** Today's date (YYYY-MM-DD) in India, where the business operates. */
export function todayIST(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

export function createEnquiry(input: EnquiryInput): { id: string; duplicate: boolean } {
  const db = getDb();
  const existing = db.prepare("SELECT id FROM enquiries WHERE idempotency_key = ?").get(input.idempotencyKey) as
    | { id: string }
    | undefined;
  if (existing) return { id: existing.id, duplicate: true };
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  try {
    db.prepare(
      `INSERT INTO enquiries (id, idempotency_key, created_at, updated_at, vehicle_type, loan_amount, area, employment,
        name, mobile, callback_time, language, consent_at, consent_version)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(
      id, input.idempotencyKey, now, now, input.vehicleType, input.loanAmount, input.area, input.employment,
      input.name, input.mobile, input.callbackTime, input.language, now, CONSENT_VERSION,
    );
  } catch (e) {
    // Race on the unique idempotency key: treat as duplicate rather than error.
    const again = db.prepare("SELECT id FROM enquiries WHERE idempotency_key = ?").get(input.idempotencyKey) as
      | { id: string }
      | undefined;
    if (again) return { id: again.id, duplicate: true };
    throw e;
  }
  db.prepare("INSERT INTO events (enquiry_id, user_id, type, detail, created_at) VALUES (?,?,?,?,?)").run(
    id, null, "created", null, now,
  );
  return { id, duplicate: false };
}

export type ListFilters = {
  vehicle?: string;
  area?: string;
  from?: string;
  to?: string;
  status?: string;
  assigned?: string; // user id | "unassigned"
  q?: string;
  overdue?: boolean;
  page?: number;
  pageSize?: number;
};

function buildWhere(f: ListFilters) {
  const where: string[] = [];
  const params: unknown[] = [];
  if (f.vehicle === "car" || f.vehicle === "two_wheeler") { where.push("e.vehicle_type = ?"); params.push(f.vehicle); }
  if (f.area) { where.push("e.area LIKE ? ESCAPE '\\'"); params.push(`%${f.area.replace(/[%_\\]/g, "\\$&")}%`); }
  if (f.from && /^\d{4}-\d{2}-\d{2}$/.test(f.from)) {
    where.push("e.created_at >= ?"); params.push(new Date(f.from + "T00:00:00+05:30").toISOString());
  }
  if (f.to && /^\d{4}-\d{2}-\d{2}$/.test(f.to)) {
    where.push("e.created_at < ?"); params.push(new Date(new Date(f.to + "T00:00:00+05:30").getTime() + 86400_000).toISOString());
  }
  if (f.status) { where.push("e.status = ?"); params.push(f.status); }
  if (f.assigned === "unassigned") where.push("e.assigned_to IS NULL");
  else if (f.assigned && /^\d+$/.test(f.assigned)) { where.push("e.assigned_to = ?"); params.push(Number(f.assigned)); }
  if (f.q) {
    const digits = f.q.replace(/\D/g, "");
    const like = `%${f.q.replace(/[%_\\]/g, "\\$&")}%`;
    if (digits.length >= 3) { where.push("(e.name LIKE ? ESCAPE '\\' OR e.mobile LIKE ?)"); params.push(like, `%${digits}%`); }
    else { where.push("e.name LIKE ? ESCAPE '\\'"); params.push(like); }
  }
  if (f.overdue) {
    where.push("e.next_follow_up IS NOT NULL AND e.next_follow_up < ? AND e.status NOT IN ('closed','approved')");
    params.push(todayIST());
  }
  return { sql: where.length ? "WHERE " + where.join(" AND ") : "", params };
}

export function listEnquiries(f: ListFilters, forExport = false) {
  const db = getDb();
  const { sql, params } = buildWhere(f);
  const base = `FROM enquiries e LEFT JOIN users u ON u.id = e.assigned_to ${sql}`;
  const total = (db.prepare(`SELECT COUNT(*) c ${base}`).get(...params) as { c: number }).c;
  const pageSize = Math.min(Math.max(f.pageSize ?? 25, 1), 100);
  const page = Math.max(f.page ?? 1, 1);
  const rows = db
    .prepare(
      `SELECT e.id, e.created_at, e.updated_at, e.vehicle_type, e.loan_amount, e.area, e.employment, e.name, e.mobile, e.callback_time, e.language, e.consent_at, e.consent_version, e.status, e.assigned_to, e.next_follow_up, u.name AS assigned_name ${base} ORDER BY e.created_at DESC ${
        forExport ? "" : "LIMIT ? OFFSET ?"
      }`,
    )
    .all(...params, ...(forExport ? [] : [pageSize, (page - 1) * pageSize])) as EnquiryRow[];
  return { rows, total, page, pageSize };
}

export function getEnquiry(id: string) {
  const db = getDb();
  const row = db
    .prepare("SELECT e.id, e.created_at, e.updated_at, e.vehicle_type, e.loan_amount, e.area, e.employment, e.name, e.mobile, e.callback_time, e.language, e.consent_at, e.consent_version, e.status, e.assigned_to, e.next_follow_up, u.name AS assigned_name FROM enquiries e LEFT JOIN users u ON u.id = e.assigned_to WHERE e.id = ?")
    .get(id) as EnquiryRow | undefined;
  if (!row) return null;
  const notes = db
    .prepare("SELECT n.id, n.body, n.created_at, u.name AS author FROM notes n LEFT JOIN users u ON u.id = n.author_id WHERE n.enquiry_id = ? ORDER BY n.id DESC")
    .all(id);
  const events = db
    .prepare("SELECT ev.id, ev.type, ev.detail, ev.created_at, u.name AS author FROM events ev LEFT JOIN users u ON u.id = ev.user_id WHERE ev.enquiry_id = ? ORDER BY ev.id DESC")
    .all(id);
  return { enquiry: row, notes, events };
}

export function updateEnquiry(
  id: string,
  userId: number,
  patch: { status?: string; assignedTo?: number | null; nextFollowUp?: string | null },
): "ok" | "not_found" | "bad_assignee" {
  const db = getDb();
  const cur = db.prepare("SELECT status, assigned_to, next_follow_up FROM enquiries WHERE id = ?").get(id) as
    | { status: string; assigned_to: number | null; next_follow_up: string | null }
    | undefined;
  if (!cur) return "not_found";
  if (patch.assignedTo != null) {
    const ok = db.prepare("SELECT 1 FROM users WHERE id = ? AND active = 1").get(patch.assignedTo);
    if (!ok) return "bad_assignee";
  }
  const now = new Date().toISOString();
  const log = db.prepare("INSERT INTO events (enquiry_id, user_id, type, detail, created_at) VALUES (?,?,?,?,?)");
  db.transaction(() => {
    if (patch.status !== undefined && patch.status !== cur.status) {
      db.prepare("UPDATE enquiries SET status = ? WHERE id = ?").run(patch.status, id);
      log.run(id, userId, "status", `${cur.status} → ${patch.status}`, now);
    }
    if (patch.assignedTo !== undefined && patch.assignedTo !== cur.assigned_to) {
      db.prepare("UPDATE enquiries SET assigned_to = ? WHERE id = ?").run(patch.assignedTo, id);
      log.run(id, userId, "assigned", patch.assignedTo === null ? "unassigned" : `user ${patch.assignedTo}`, now);
    }
    if (patch.nextFollowUp !== undefined && patch.nextFollowUp !== cur.next_follow_up) {
      db.prepare("UPDATE enquiries SET next_follow_up = ? WHERE id = ?").run(patch.nextFollowUp, id);
      log.run(id, userId, "follow_up", patch.nextFollowUp ?? "cleared", now);
    }
    db.prepare("UPDATE enquiries SET updated_at = ? WHERE id = ?").run(now, id);
  })();
  return "ok";
}

export function addNote(id: string, userId: number, body: string): boolean {
  const db = getDb();
  if (!db.prepare("SELECT 1 FROM enquiries WHERE id = ?").get(id)) return false;
  const now = new Date().toISOString();
  db.prepare("INSERT INTO notes (enquiry_id, author_id, body, created_at) VALUES (?,?,?,?)").run(id, userId, body, now);
  db.prepare("UPDATE enquiries SET updated_at = ? WHERE id = ?").run(now, id);
  return true;
}

export function deleteEnquiry(id: string): boolean {
  return getDb().prepare("DELETE FROM enquiries WHERE id = ?").run(id).changes > 0;
}

export function listStaff() {
  return getDb().prepare("SELECT id, name FROM users WHERE active = 1 ORDER BY name").all() as { id: number; name: string }[];
}

/** CSV with formula-injection protection (cells starting with = + - @ are prefixed). */
export function toCsv(rows: EnquiryRow[]): string {
  const esc = (v: unknown) => {
    let s = v == null ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = ["id","created_at","vehicle_type","loan_amount_inr","area","employment","name","mobile","callback_time","language","consent_at","status","assigned_to","next_follow_up"];
  const lines = rows.map((r) =>
    [r.id, r.created_at, r.vehicle_type, r.loan_amount, r.area, r.employment, r.name, r.mobile, r.callback_time, r.language, r.consent_at, r.status, r.assigned_name ?? "", r.next_follow_up ?? ""].map(esc).join(","),
  );
  return [head.join(","), ...lines].join("\r\n") + "\r\n";
}
