import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getDb } from "./db";

export const SESSION_COOKIE = "tk_staff_session";
const IDLE_MS = 2 * 60 * 60 * 1000; // 2h idle
const ABSOLUTE_MS = 12 * 60 * 60 * 1000; // 12h max

export type StaffUser = { id: number; email: string; name: string; role: "admin" | "staff" };

// ---- password hashing (scrypt) ----
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt.toString("base64")}$${key.toString("base64")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, N, r, p, saltB64, keyB64] = parts;
  const expected = Buffer.from(keyB64, "base64");
  const actual = crypto.scryptSync(password, Buffer.from(saltB64, "base64"), expected.length, {
    N: Number(N),
    r: Number(r),
    p: Number(p),
  });
  return crypto.timingSafeEqual(actual, expected);
}

// Used to keep login timing similar when the account does not exist.
const DUMMY_HASH = hashPassword(crypto.randomBytes(8).toString("hex"));

const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

export type LoginResult =
  | { ok: true; user: StaffUser }
  | { ok: false; reason: "invalid" | "locked" };

export function attemptLogin(email: string, password: string): LoginResult {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email) as
    | { id: number; email: string; name: string; role: "admin" | "staff"; password_hash: string; active: number; failed_logins: number; locked_until: number | null }
    | undefined;
  const now = Date.now();
  if (!row || !row.active) {
    verifyPassword(password, DUMMY_HASH);
    return { ok: false, reason: "invalid" };
  }
  if (row.locked_until && row.locked_until > now) {
    return { ok: false, reason: "locked" };
  }
  if (!verifyPassword(password, row.password_hash)) {
    const fails = row.failed_logins + 1;
    if (fails >= 5) {
      db.prepare("UPDATE users SET failed_logins = 0, locked_until = ? WHERE id = ?").run(now + 15 * 60_000, row.id);
    } else {
      db.prepare("UPDATE users SET failed_logins = ? WHERE id = ?").run(fails, row.id);
    }
    return { ok: false, reason: "invalid" };
  }
  db.prepare("UPDATE users SET failed_logins = 0, locked_until = NULL WHERE id = ?").run(row.id);
  return { ok: true, user: { id: row.id, email: row.email, name: row.name, role: row.role } };
}

export async function createSession(userId: number) {
  const token = crypto.randomBytes(32).toString("base64url");
  const now = Date.now();
  getDb()
    .prepare("INSERT INTO sessions (token_hash, user_id, created_at, last_seen, expires_at) VALUES (?,?,?,?,?)")
    .run(sha256(token), userId, now, now, now + ABSOLUTE_MS);
  // opportunistic cleanup
  getDb().prepare("DELETE FROM sessions WHERE expires_at < ?").run(now);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
    maxAge: ABSOLUTE_MS / 1000,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) getDb().prepare("DELETE FROM sessions WHERE token_hash = ?").run(sha256(token));
  jar.delete(SESSION_COOKIE);
}

/** Resolve the logged-in staff user from the cookie, or null. Enforced server-side on every request. */
export async function getCurrentUser(): Promise<StaffUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = getDb();
  const now = Date.now();
  const row = db
    .prepare(
      `SELECT s.token_hash, s.last_seen, s.expires_at, u.id, u.email, u.name, u.role, u.active
       FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?`,
    )
    .get(sha256(token)) as
    | { token_hash: string; last_seen: number; expires_at: number; id: number; email: string; name: string; role: "admin" | "staff"; active: number }
    | undefined;
  if (!row || !row.active || row.expires_at < now || now - row.last_seen > IDLE_MS) {
    if (row) db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(row.token_hash);
    return null;
  }
  if (now - row.last_seen > 60_000) {
    db.prepare("UPDATE sessions SET last_seen = ? WHERE token_hash = ?").run(now, row.token_hash);
  }
  return { id: row.id, email: row.email, name: row.name, role: row.role };
}
