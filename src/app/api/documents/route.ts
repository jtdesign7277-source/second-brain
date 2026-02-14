import { NextRequest, NextResponse } from "next/server";

// Simple in-memory store for cron outputs (persists across requests within the same serverless instance)
// For true persistence, swap with Supabase or Vercel KV later
let cronDocs: Array<{
  id: string;
  title: string;
  content: string;
  folder: string;
  created_at: string;
}> = [];

// GET — fetch all cron-submitted documents
export async function GET() {
  return NextResponse.json({ documents: cronDocs });
}

// POST — cron jobs submit their output here
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, content, folder } = body;

    if (!title || !content || !folder) {
      return NextResponse.json(
        { error: "title, content, and folder are required" },
        { status: 400 }
      );
    }

    const doc = {
      id: crypto.randomUUID(),
      title,
      content,
      folder,
      created_at: new Date().toISOString(),
    };

    cronDocs.push(doc);

    // Keep max 100 docs in memory (prevent unbounded growth)
    if (cronDocs.length > 100) {
      cronDocs = cronDocs.slice(-100);
    }

    return NextResponse.json({ ok: true, document: doc }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
