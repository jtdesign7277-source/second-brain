import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/apiAuth";
import { getSupabaseServer } from "@/lib/supabase/server";

// GET /api/keys/usage — Get usage stats for the authenticated key
export async function GET(req: NextRequest) {
  const result = await validateApiKey(req);
  if (!result.valid) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const sb = getSupabaseServer();
  const days = parseInt(req.nextUrl.searchParams.get("days") || "30");

  const since = new Date();
  since.setDate(since.getDate() - days);

  // Total usage
  const { data: usage, error } = await sb
    .from("api_usage")
    .select("endpoint, tokens_in, tokens_out, latency_ms, status_code, created_at")
    .eq("api_key_id", result.keyId!)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Aggregate stats
  const totalRequests = usage?.length ?? 0;
  const totalTokensIn = usage?.reduce((sum, u) => sum + (u.tokens_in || 0), 0) ?? 0;
  const totalTokensOut = usage?.reduce((sum, u) => sum + (u.tokens_out || 0), 0) ?? 0;
  const avgLatency = totalRequests > 0
    ? Math.round((usage?.reduce((sum, u) => sum + (u.latency_ms || 0), 0) ?? 0) / totalRequests)
    : 0;

  // Today's count (for rate limit display)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayCount = usage?.filter((u) => new Date(u.created_at) >= todayStart).length ?? 0;

  // By endpoint
  const byEndpoint: Record<string, number> = {};
  for (const u of usage ?? []) {
    byEndpoint[u.endpoint] = (byEndpoint[u.endpoint] || 0) + 1;
  }

  return NextResponse.json({
    keyId: result.keyId,
    plan: result.plan,
    period: `${days} days`,
    stats: {
      totalRequests,
      todayRequests: todayCount,
      totalTokensIn,
      totalTokensOut,
      avgLatencyMs: avgLatency,
      byEndpoint,
    },
  });
}
