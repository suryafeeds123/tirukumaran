import { requireStaff, json } from "@/lib/http";
import { listEnquiries, toCsv } from "@/lib/enquiries";
export const dynamic = "force-dynamic";

/** Admin-only CSV export of the currently filtered set. */
export async function GET(req: Request) {
  const g = await requireStaff(req, { role: "admin" });
  if ("response" in g) return g.response;
  const p = new URL(req.url).searchParams;
  const { rows } = listEnquiries(
    {
      vehicle: p.get("vehicle") || undefined, area: p.get("area") || undefined, from: p.get("from") || undefined,
      to: p.get("to") || undefined, status: p.get("status") || undefined, assigned: p.get("assigned") || undefined,
      q: p.get("q") || undefined, overdue: p.get("overdue") === "1",
    },
    true,
  );
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="enquiries-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
void json;
