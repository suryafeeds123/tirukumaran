/**
 * One-command local start (Windows / macOS / Linux):   npm run local
 *  1. creates .env.local (live storage ON for local testing, random rate-limit salt) if it is missing
 *  2. asks you to create the first staff account if none exists (password is typed by you, never stored in files)
 *  3. starts the dev server on http://localhost:3000
 */
import fs from "node:fs";
import crypto from "node:crypto";
import { spawnSync, spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const shell = process.platform === "win32";

if (!fs.existsSync(".env.local")) {
  fs.writeFileSync(
    ".env.local",
    [
      "# Local testing only. Never commit this file.",
      "LIVE_ENQUIRIES=true",
      "DATABASE_PATH=./data/tirukumaran.db",
      `RATE_LIMIT_SALT=${crypto.randomBytes(32).toString("hex")}`,
      "COOKIE_SECURE=false",
      "",
    ].join("\n"),
  );
  console.log("Created .env.local");
}

fs.mkdirSync("data", { recursive: true });
const Database = require("better-sqlite3");
const dbFile = (fs.readFileSync(".env.local", "utf8").match(/^DATABASE_PATH=(.*)$/m)?.[1] ?? "./data/tirukumaran.db").trim();
let hasUsers = false;
try {
  const db = new Database(dbFile, { fileMustExist: true });
  hasUsers = !!db.prepare("SELECT 1 FROM users LIMIT 1").get();
  db.close();
} catch {}

if (!hasUsers) {
  console.log("\nNo staff account yet — create the first admin account:\n");
  const r = spawnSync("npx", ["tsx", "scripts/create-staff.ts"], {
    stdio: "inherit", shell, env: { ...process.env, DATABASE_PATH: dbFile },
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

console.log("\nStarting → http://localhost:3000   (staff sign-in: http://localhost:3000/staff)\n");
const dev = spawn("npx", ["next", "dev"], { stdio: "inherit", shell });
dev.on("exit", (c) => process.exit(c ?? 0));
