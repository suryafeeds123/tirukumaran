# TIRUKUMARAN AUTO FINANCE — website & office dashboard

Bilingual (English / தமிழ்) site for **car and two wheeler finance enquiries in Tiruppur**, with a structured
enquiry assistant, EMI calculator and an authenticated staff dashboard.

Stack: Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · SQLite (`better-sqlite3`) · zod · Vitest.

## What is real and what is preview

| Area | Status |
|---|---|
| Public pages (10) in English + Tamil, SEO metadata, sitemap/robots | Working |
| EMI calculator (reducing balance, zero-interest, validation) | Working |
| Enquiry assistant (all steps, review/edit/back, consent, validation) | Working |
| **Storing enquiries** | Working, **but off until `LIVE_ENQUIRIES=true`**. Until then the assistant shows a *Preview* banner and never claims submission |
| Staff dashboard (list, filters, search, status, assign, notes, follow-up, overdue, call/WhatsApp links, admin CSV export, admin delete) | Working (English only) |
| Hero car image | Built-in SVG **illustration**. Add the owner's AI image at `public/images/premium-car.*` |
| Phone, address, hours, new & used vehicles, direct arrangement | Supplied by the owner; live in `src/lib/business.ts` |
| WhatsApp number, working days, lending terms/charges | **Not shown until the owner confirms** (see `.env.example`) |

No AI chat is included; the structured flow is the whole assistant and needs no external service.

## Run locally

```bash
npm install
cp .env.example .env.local      # edit; set LIVE_ENQUIRIES=true to test real storage locally
npm run staff:create            # creates an admin or staff account (password prompted, stored hashed)
npm run dev                     # http://localhost:3000  (redirects to /en or /ta)
npm test                        # EMI + validation unit tests
npm run build && npm start      # production mode
```

Staff sign in at **/staff** (not linked from the public site, `noindex`, no-store).

## Security model
- Enquiries are only readable through `/api/staff/*`, which checks a server-side session on **every** request.
  `GET /api/enquiries` does not exist; the public `POST` only inserts.
- Passwords: scrypt hashes; 5 failed logins lock the account 15 min; login is also rate-limited per client.
- Sessions: random token in an `HttpOnly`, `SameSite=Strict` cookie (`COOKIE_SECURE=true` behind HTTPS); only a SHA-256 of the token is stored; 2 h idle / 12 h max.
- Mutations require same-origin JSON (CSRF defence in depth). CSV export and delete are **admin-only**; CSV cells are formula-injection safe.
- Public submit: zod validation, rate limit (5/10 min, 20/day per hashed client), honeypot, minimum-time trap, and an **idempotency key** so retries/double-clicks store exactly one row.
- No Aadhaar/PAN/bank/uploads. Personal data never goes in URLs; server logs contain no request data. No analytics.
- Consent timestamp, consent text version and creation time are stored with each enquiry.
- Customer data is never put in `localStorage`; the assistant draft lives in memory only.

## Deployment (nothing is deployed or purchased for you)
SQLite needs a **persistent disk**, so use a VPS / container host with a volume (a `Dockerfile` is included), **not** a serverless
platform with ephemeral storage. If you prefer serverless, swap `src/lib/db.ts` + `src/lib/enquiries.ts` for a hosted Postgres — the
rest of the app only talks to those two modules. Whichever you choose, ask the owner before creating any paid service or account.

Before going live: set `SITE_URL`, `RATE_LIMIT_SALT`, `COOKIE_SECURE=true`, `LIVE_ENQUIRIES=true`, back up `DATABASE_PATH`,
serve over HTTPS, create staff accounts, then set `SITE_INDEXING=true` **only at launch** (until then every page is `noindex` and `robots.txt` disallows all).
Have the privacy text reviewed by the owner/adviser (India's DPDP Act) and confirm the retention period.

See `docs/GOOGLE-BUSINESS-PROFILE-CHECKLIST.md` for the owner's local-search tasks.

## Editing content
All copy is in `src/i18n/en.ts` and `src/i18n/ta.ts`; TypeScript enforces that Tamil matches English. Business facts come from env
variables via `src/lib/business.ts` — empty values are never rendered.
