import { json } from "@/lib/http";
import { LIVE_ENQUIRIES } from "@/lib/business";

export const dynamic = "force-dynamic";

/** Tells the client whether enquiries are really stored (live) or this is a preview. */
export async function GET() {
  return json({ live: LIVE_ENQUIRIES });
}
