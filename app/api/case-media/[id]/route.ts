import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionToken } from "@/lib/session";

/**
 * Proxies a case-report photo from the Laravel backend. Photos are stored
 * privately there (not on a publicly-served disk) and require a Sanctum
 * bearer token, which the browser can't attach to a plain `<img src>` — so
 * this server-side route holds the admin's session token and does the
 * authenticated fetch on the browser's behalf.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getSessionToken();
  if (!token) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const base = process.env.BACKEND_API_URL;
  if (!base) return new NextResponse("BACKEND_API_URL is not set.", { status: 500 });

  const res = await fetch(`${base.replace(/\/$/, "")}/admin/case-media/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok || !res.body) {
    return new NextResponse("Not found", { status: res.status || 404 });
  }

  return new NextResponse(res.body, {
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "image/jpeg",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
