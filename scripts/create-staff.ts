/**
 * Create or reset a staff account.
 *   npm run staff:create
 * Prompts for details; the password is read from the terminal (not echoed) and only its scrypt hash is stored.
 * Non-interactive: STAFF_EMAIL, STAFF_NAME, STAFF_ROLE, STAFF_PASSWORD env vars.
 */
import readline from "node:readline";
import { getDb } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";

function ask(q: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (s: string) => {
        if (s.includes(q)) process.stdout.write(s);
      };
    }
    rl.question(q, (a) => { rl.close(); if (hidden) process.stdout.write("\n"); resolve(a.trim()); });
  });
}

async function main() {
  const email = (process.env.STAFF_EMAIL || (await ask("Email: "))).toLowerCase();
  const name = process.env.STAFF_NAME || (await ask("Display name: "));
  const role = (process.env.STAFF_ROLE || (await ask("Role (admin/staff): "))) as "admin" | "staff";
  const password = process.env.STAFF_PASSWORD || (await ask("Password (min 12 chars): ", true));
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Invalid email");
  if (role !== "admin" && role !== "staff") throw new Error("Role must be admin or staff");
  if (password.length < 12) throw new Error("Password must be at least 12 characters");
  const db = getDb();
  db.prepare(
    `INSERT INTO users (email, name, role, password_hash, created_at) VALUES (?,?,?,?,?)
     ON CONFLICT(email) DO UPDATE SET name=excluded.name, role=excluded.role, password_hash=excluded.password_hash, active=1, failed_logins=0, locked_until=NULL`,
  ).run(email, name, role, hashPassword(password), new Date().toISOString());
  db.prepare("DELETE FROM sessions WHERE user_id = (SELECT id FROM users WHERE email = ?)").run(email);
  console.log(`Saved ${role} account for ${email}`);
}
main().catch((e) => { console.error(e.message); process.exit(1); });
