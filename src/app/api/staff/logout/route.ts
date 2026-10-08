import { json, checkSameOrigin } from "@/lib/http";
import { destroySession } from "@/lib/auth";

export async function POST(req: Request) {
  if (!checkSameOrigin(req)) return json({ error: "forbidden" }, 403);
  await destroySession();
  return json({ ok: true });
}
