import { json, requireStaff } from "@/lib/http";
import { listEnquiries } from "@/lib/enquiries";
import { todayIST } from "@/lib/enquiries";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const g = await requireStaff(req);
  if ("response" in g) return g.response;
  const p = new URL(req.url).searchParams;
  const res = listEnquiries({
    vehicle: p.get("vehicle") || undefined,
    area: p.get("area")?.slice(0, 80) || undefined,
    from: p.get("from") || undefined,
    to: p.get("to") || undefined,
    status: p.get("status") || undefined,
    assigned: p.get("assigned") || undefined,
    q: p.get("q")?.slice(0, 80) || undefined,
    overdue: p.get("overdue") === "1",
    page: Number(p.get("page")) || 1,
  });
  return json({ ...res, today: todayIST() });
}
