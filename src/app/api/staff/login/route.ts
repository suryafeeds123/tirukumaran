import { json, readJson, checkSameOrigin } from "@/lib/http";
import { staffLoginSchema } from "@/lib/validation";
import { attemptLogin, createSession } from "@/lib/auth";
import { clientKey, hit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!checkSameOrigin(req)) return json({ error: "forbidden" }, 403);
  const rl = hit(clientKey(req, "login"), 10, 15 * 60_000);
  if (!rl.allowed) return json({ error: "rate_limited" }, 429, { "Retry-After": String(rl.retryAfterSec) });
  const parsed = staffLoginSchema.safeParse(await readJson(req));
  if (!parsed.success) return json({ error: "invalid" }, 400);
  const res = attemptLogin(parsed.data.email, parsed.data.password);
  if (!res.ok) return json({ error: res.reason }, res.reason === "locked" ? 423 : 401);
  await createSession(res.user.id);
  return json({ ok: true, user: res.user });
}
