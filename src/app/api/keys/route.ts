import { NextRequest, NextResponse } from "next/server";
import { generateApiKey, validateApiKey, logUsage } from "@/lib/apiAuth";
import { getSupabaseServer } from "@/lib/supabase/server";

// POST /api/keys — Generate a new API key
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, name, plan } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const result = await generateApiKey(userId, name, plan);

    return NextResponse.json({
      message: "API key created. Save this key — it won't be shown again.",
      key: result.key,
      keyId: result.id,
      prefix: result.prefix,
      plan: result.plan,
      rateLimit: result.rateLimit,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate key";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/keys — List keys for a user (or validate current key)
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");

  // If no userId, validate the bearer key
  if (!userId) {
    const result = await validateApiKey(req);
    if (!result.valid) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }
    return NextResponse.json({
      valid: true,
      keyId: result.keyId,
      userId: result.userId,
      plan: result.plan,
    });
  }

  // List all keys for a user
  const sb = getSupabaseServer();
  const { data, error } = await sb
    .from("api_keys")
    .select("id, key_prefix, name, plan, rate_limit_per_day, active, created_at, last_used_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ keys: data });
}

// DELETE /api/keys — Deactivate a key
export async function DELETE(req: NextRequest) {
  const keyId = req.nextUrl.searchParams.get("keyId");
  if (!keyId) {
    return NextResponse.json({ error: "keyId is required" }, { status: 400 });
  }

  const sb = getSupabaseServer();
  const { error } = await sb
    .from("api_keys")
    .update({ active: false })
    .eq("id", keyId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "API key deactivated" });
}
