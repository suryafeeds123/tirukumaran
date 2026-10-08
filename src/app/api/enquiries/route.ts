import { json, readJson, checkSameOrigin } from "@/lib/http";
import { LIVE_ENQUIRIES } from "@/lib/business";
import { enquirySchema } from "@/lib/validation";
import { createEnquiry } from "@/lib/enquiries";
import { clientKey, hit, cleanupRateLimits } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!LIVE_ENQUIRIES) return json({ error: "preview_mode" }, 503);
  if (!checkSameOrigin(req)) return json({ error: "forbidden" }, 403);

  // 5 submissions / 10 min and 20 / day per client.
  const short = hit(clientKey(req, "enq10m"), 5, 10 * 60_000);
  const day = short.allowed ? hit(clientKey(req, "enq24h"), 20, 24 * 3600_000) : short;
  if (!short.allowed || !day.allowed) {
    return json({ error: "rate_limited" }, 429, { "Retry-After": String(short.retryAfterSec || day.retryAfterSec) });
  }
  if (Math.random() < 0.02) cleanupRateLimits();

  const body = await readJson(req);
  if (body === undefined) return json({ error: "bad_request" }, 400);

  const parsed = enquirySchema.safeParse(body);
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((i) => String(i.path[0] ?? "")))];
    // Honeypot filled: pretend success so bots learn nothing, store nothing.
    if (fields.includes("website")) return json({ ok: true, reference: "-" }, 201);
    return json({ error: "validation", fields }, 422);
  }
  // Submitted implausibly fast after opening the assistant (bots): silently drop.
  if (parsed.data.openedAt && Date.now() - parsed.data.openedAt < 4_000) {
    return json({ ok: true, reference: "-" }, 201);
  }

  try {
    const { id, duplicate } = createEnquiry(parsed.data);
    return json({ ok: true, reference: id.slice(0, 8).toUpperCase(), duplicate }, duplicate ? 200 : 201);
  } catch {
    // Deliberately no request data in logs.
    console.error("enquiry_store_failed");
    return json({ error: "server" }, 500);
  }
}
