import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = "https://stratify-backend-production-3ebd.up.railway.app";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("q")?.trim().toUpperCase();

  if (!symbol) {
    return NextResponse.json({ error: "q param required" }, { status: 400 });
  }

  try {
    // Use Stratify's Railway backend which has Alpaca keys configured
    const res = await fetch(`${BACKEND_URL}/api/stocks/${encodeURIComponent(symbol)}`, {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `No data for ${symbol}` }, { status: 404 });
    }

    const data = await res.json();

    const price = data.askPrice || data.bidPrice || data.price || 0;
    const change = data.change ? parseFloat(data.change) : 0;

    return NextResponse.json({
      results: [
        {
          symbol: data.symbol ?? symbol,
          price,
          change: price * (change / 100),
          changePct: change,
          bid: data.bidPrice ?? null,
          ask: data.askPrice ?? null,
          high: data.high ?? null,
          low: data.low ?? null,
          open: data.open ?? null,
          volume: data.volume ?? null,
          prevClose: null,
        },
      ],
    });
  } catch {
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}
