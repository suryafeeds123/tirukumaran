import { json, readJson, requireStaff } from "@/lib/http";
import { addNote } from "@/lib/enquiries";
import { noteSchema } from "@/lib/validation";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireStaff(req, { mutating: true });
  if ("response" in g) return g.response;
  const { id } = await params;
  const parsed = noteSchema.safeParse(await readJson(req, 4_000));
  if (!/^[0-9a-f-]{36}$/.test(id) || !parsed.success) return json({ error: "invalid" }, 400);
  if (!addNote(id, g.user.id, parsed.data.body)) return json({ error: "not_found" }, 404);
  return json({ ok: true }, 201);
}
