import { json, requireStaff } from "@/lib/http";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const g = await requireStaff(req);
  if ("response" in g) return g.response;
  return json({ user: g.user });
}
