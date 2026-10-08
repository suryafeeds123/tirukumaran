import { json, requireStaff } from "@/lib/http";
import { listStaff } from "@/lib/enquiries";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const g = await requireStaff(req);
  if ("response" in g) return g.response;
  return json({ users: listStaff() });
}
