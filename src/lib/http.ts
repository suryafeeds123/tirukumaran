import { NextResponse } from "next/server";
import { getCurrentUser, type StaffUser } from "./auth";

export const json = (body: unknown, status = 200, headers?: Record<string, string>) =>
  NextResponse.json(body, { status, headers });

/** CSRF defence in depth (cookie is SameSite=Strict): mutating requests must be same-origin JSON. */
export function checkSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function readJson(req: Request, maxBytes = 8_000): Promise<unknown | undefined> {
  if (!(req.headers.get("content-type") || "").includes("application/json")) return undefined;
  const text = await req.text();
  if (text.length > maxBytes) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

type Guard = { user: StaffUser } | { response: NextResponse };

/** Server-enforced staff auth for API routes. */
export async function requireStaff(req: Request, opts: { role?: "admin"; mutating?: boolean } = {}): Promise<Guard> {
  if (opts.mutating && !checkSameOrigin(req)) return { response: json({ error: "forbidden" }, 403) };
  const user = await getCurrentUser();
  if (!user) return { response: json({ error: "unauthorized" }, 401) };
  if (opts.role && user.role !== opts.role) return { response: json({ error: "forbidden" }, 403) };
  return { user };
}
