import crypto from "node:crypto";
import { getDb } from "./db";

/** Fixed-window limiter stored in SQLite. Keys are salted hashes — raw IPs are never stored. */
export function clientKey(req: Request, scope: string): string {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  const salt = process.env.RATE_LIMIT_SALT || "dev-only-salt";
  return `${scope}:${crypto.createHmac("sha256", salt).update(fwd).digest("hex").slice(0, 32)}`;
}

export function hit(key: string, limit: number, windowMs: number): { allowed: boolean; retryAfterSec: number } {
  const db = getDb();
  const now = Date.now();
  const row = db.prepare("SELECT window_start, count FROM rate_limits WHERE key = ?").get(key) as
    | { window_start: number; count: number }
    | undefined;
  if (!row || now - row.window_start >= windowMs) {
    db.prepare("INSERT OR REPLACE INTO rate_limits (key, window_start, count) VALUES (?,?,1)").run(key, now);
    return { allowed: true, retryAfterSec: 0 };
  }
  if (row.count >= limit) {
    return { allowed: false, retryAfterSec: Math.ceil((row.window_start + windowMs - now) / 1000) };
  }
  db.prepare("UPDATE rate_limits SET count = count + 1 WHERE key = ?").run(key);
  return { allowed: true, retryAfterSec: 0 };
}

export function cleanupRateLimits() {
  getDb().prepare("DELETE FROM rate_limits WHERE window_start < ?").run(Date.now() - 24 * 3600_000);
}
