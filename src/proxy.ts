import { NextResponse, type NextRequest } from "next/server";

/** "/" → /en or /ta (from Accept-Language). Everything else passes through. */
export function proxy(req: NextRequest) {
  if (req.nextUrl.pathname === "/") {
    const prefersTamil = /(^|,)\s*ta\b/i.test(req.headers.get("accept-language") || "");
    const url = req.nextUrl.clone();
    url.pathname = prefersTamil ? "/ta" : "/en";
    const res = NextResponse.redirect(url, 307);
    res.headers.set("Vary", "Accept-Language");
    return res;
  }
  return NextResponse.next();
}

export const config = { matcher: ["/"] };
