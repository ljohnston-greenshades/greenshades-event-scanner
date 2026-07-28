import { NextRequest, NextResponse } from "next/server";
import { getStats, statsConfigured } from "@/lib/stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/stats
 * Header: x-admin-key: <ADMIN_PASSWORD>
 * Returns per-rep scan counts. Gated by the ADMIN_PASSWORD env var.
 */
export async function GET(req: NextRequest) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { error: "Admin panel is not configured (set ADMIN_PASSWORD)." },
      { status: 501 },
    );
  }

  const provided = req.headers.get("x-admin-key") ?? "";
  if (provided !== expected) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!statsConfigured()) {
    return NextResponse.json(
      { error: "No stats store configured (set KV_REST_API_URL / KV_REST_API_TOKEN)." },
      { status: 501 },
    );
  }

  const event = req.nextUrl.searchParams.get("event") ?? "";
  const stats = await getStats(event);
  return NextResponse.json(stats);
}
