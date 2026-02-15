import nodeCrypto from "node:crypto";
import { getSupabaseServer } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

function sha256(input: string): string {
  return nodeCrypto.createHash("sha256").update(input).digest("hex");
}
function randomHex(bytes: number): string {
  return nodeCrypto.randomBytes(bytes).toString("hex");
}

const RATE_LIMITS: Record<string, number> = {
  free: 100,
  pro: 1000,
  enterprise: 10000,
};

/* ── Generate a new API key ── */
export async function generateApiKey(userId: string, name = "default", plan = "free") {
  const raw = `sb2_${randomHex(32)}`;
  const hash = sha256(raw);
  const prefix = raw.slice(0, 12);
  const rateLimit = RATE_LIMITS[plan] ?? 100;

  const sb = getSupabaseServer();
  const { data, error } = await sb
    .from("api_keys")
    .insert({
      user_id: userId,
      key_hash: hash,
      key_prefix: prefix,
      name,
      plan,
      rate_limit_per_day: rateLimit,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return {
    key: raw, // Only returned once at creation
    id: data.id,
    prefix,
    plan,
    rateLimit,
  };
}

/* ── Validate an API key from request ── */
export async function validateApiKey(req: NextRequest): Promise<{
  valid: boolean;
  keyId?: string;
  userId?: string;
  plan?: string;
  error?: string;
}> {
  const authHeader = req.headers.get("authorization");
  const apiKey = req.headers.get("x-api-key");
  const key = apiKey || authHeader?.replace("Bearer ", "");

  if (!key) {
    return { valid: false, error: "Missing API key. Pass via x-api-key header or Authorization: Bearer <key>" };
  }

  const hash = sha256(key);
  const sb = getSupabaseServer();

  const { data, error } = await sb
    .from("api_keys")
    .select("id, user_id, plan, rate_limit_per_day, active")
    .eq("key_hash", hash)
    .single();

  if (error || !data) {
    return { valid: false, error: "Invalid API key" };
  }

  if (!data.active) {
    return { valid: false, error: "API key is deactivated" };
  }

  // Check rate limit (requests today)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count } = await sb
    .from("api_usage")
    .select("*", { count: "exact", head: true })
    .eq("api_key_id", data.id)
    .gte("created_at", todayStart.toISOString());

  if ((count ?? 0) >= data.rate_limit_per_day) {
    return { valid: false, error: `Rate limit exceeded (${data.rate_limit_per_day}/day). Upgrade your plan.` };
  }

  // Update last_used_at
  await sb
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);

  return {
    valid: true,
    keyId: data.id,
    userId: data.user_id,
    plan: data.plan,
  };
}

/* ── Log API usage ── */
export async function logUsage(
  keyId: string,
  endpoint: string,
  tokensIn = 0,
  tokensOut = 0,
  latencyMs = 0,
  statusCode = 200
) {
  const sb = getSupabaseServer();
  await sb.from("api_usage").insert({
    api_key_id: keyId,
    endpoint,
    tokens_in: tokensIn,
    tokens_out: tokensOut,
    latency_ms: latencyMs,
    status_code: statusCode,
  });
}

/* ── Auth middleware helper ── */
export async function withAuth(
  req: NextRequest,
  handler: (keyId: string, userId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  const result = await validateApiKey(req);

  if (!result.valid) {
    return NextResponse.json(
      { error: result.error },
      { status: result.error?.includes("Rate limit") ? 429 : 401 }
    );
  }

  return handler(result.keyId!, result.userId!);
}

/* ── Unauthorized response ── */
export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}
