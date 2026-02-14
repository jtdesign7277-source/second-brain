import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const CRON_DIR = path.join(process.cwd(), "public", "cron-data");

// GET — fetch all cron-submitted documents from static JSON files
export async function GET() {
  try {
    const indexPath = path.join(CRON_DIR, "index.json");
    const raw = await fs.readFile(indexPath, "utf-8");
    const ids: string[] = JSON.parse(raw);

    const documents = [];
    for (const id of ids) {
      try {
        const docPath = path.join(CRON_DIR, `${id}.json`);
        const docRaw = await fs.readFile(docPath, "utf-8");
        documents.push(JSON.parse(docRaw));
      } catch {
        // Skip missing files
      }
    }

    // Return newest first
    documents.reverse();

    return NextResponse.json({ documents });
  } catch {
    return NextResponse.json({ documents: [] });
  }
}

// POST — cron jobs can still POST here; we save to filesystem
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

    const id = crypto.randomUUID();
    const doc = {
      id,
      title,
      content,
      folder,
      created_at: new Date().toISOString(),
    };

    // Save document file
    const docPath = path.join(CRON_DIR, `${id}.json`);
    await fs.writeFile(docPath, JSON.stringify(doc, null, 2));

    // Update index
    const indexPath = path.join(CRON_DIR, "index.json");
    let ids: string[] = [];
    try {
      ids = JSON.parse(await fs.readFile(indexPath, "utf-8"));
    } catch { /* empty */ }
    ids.push(id);
    if (ids.length > 200) ids = ids.slice(-200);
    await fs.writeFile(indexPath, JSON.stringify(ids, null, 2));

    return NextResponse.json({ ok: true, document: doc }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
