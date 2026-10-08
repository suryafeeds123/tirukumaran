import { json, readJson, requireStaff } from "@/lib/http";
import { getEnquiry, updateEnquiry, deleteEnquiry, todayIST } from "@/lib/enquiries";
import { enquiryUpdateSchema } from "@/lib/validation";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };
const validId = (id: string) => /^[0-9a-f-]{36}$/.test(id);

export async function GET(req: Request, { params }: Ctx) {
  const g = await requireStaff(req);
  if ("response" in g) return g.response;
  const { id } = await params;
  const data = validId(id) ? getEnquiry(id) : null;
  if (!data) return json({ error: "not_found" }, 404);
  return json({ ...data, today: todayIST() });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const g = await requireStaff(req, { mutating: true });
  if ("response" in g) return g.response;
  const { id } = await params;
  const parsed = enquiryUpdateSchema.safeParse(await readJson(req));
  if (!validId(id) || !parsed.success) return json({ error: "invalid" }, 400);
  const r = updateEnquiry(id, g.user.id, parsed.data);
  if (r === "not_found") return json({ error: "not_found" }, 404);
  if (r === "bad_assignee") return json({ error: "invalid" }, 400);
  return json({ ok: true });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const g = await requireStaff(req, { role: "admin", mutating: true });
  if ("response" in g) return g.response;
  const { id } = await params;
  if (!validId(id) || !deleteEnquiry(id)) return json({ error: "not_found" }, 404);
  return json({ ok: true });
}
