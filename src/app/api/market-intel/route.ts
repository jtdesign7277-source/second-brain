import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const INTEL_DIRS = [
  path.join(process.cwd(), "notes", "market-intel"),
  path.join(process.env.HOME || "", "Desktop", "second-brain", "notes", "market-intel"),
  path.join(process.env.HOME || "", "third-brain", "market-intel"),
];

function findIntelDir(): string | null {
  for (const dir of INTEL_DIRS) {
    if (fs.existsSync(dir)) return dir;
  }
  return null;
}

export async function GET() {
  try {
    const dir = findIntelDir();
    if (!dir) return NextResponse.json({ reports: [] });

    const files = fs.readdirSync(dir)
      .filter((f) => f.endsWith(".md"))
      .sort()
      .reverse()
      .slice(0, 10); // last 10 reports

    const reports = files.map((f) => {
      const content = fs.readFileSync(path.join(dir, f), "utf-8");
      const date = f.replace(".md", "");
      return { date, content };
    });

    return NextResponse.json({ reports });
  } catch {
    return NextResponse.json({ reports: [] });
  }
}
