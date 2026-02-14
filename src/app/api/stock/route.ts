import { NextRequest, NextResponse } from "next/server";

const ALPACA_KEY = process.env.ALPACA_API_KEY ?? "";
const ALPACA_SECRET = process.env.ALPACA_API_SECRET ?? "";
const ALPACA_DATA_URL = "https://data.alpaca.markets";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("q")?.trim().toUpperCase();

  if (!symbol) {
    return NextResponse.json({ error: "q param required" }, { status: 400 });
  }

  // If no local Alpaca keys, proxy through Stratify's API
  if (!ALPACA_KEY || !ALPACA_SECRET) {
    try {
      const res = await fetch(
        `https://stratify-eight.vercel.app/api/quote?symbol=${encodeURIComponent(symbol)}`
      );
      const data = await res.json();
      if (!res.ok) return NextResponse.json(data, { status: res.status });
      return NextResponse.json({ results: [data] });
    } catch {
      return NextResponse.json({ error: "Upstream unavailable" }, { status: 502 });
    }
  }

  try {
    // Search for matching assets first
    const searchUrl = `https://paper-api.alpaca.markets/v2/assets?status=active&exchange=NYSE,NASDAQ,AMEX`;
    // Use snapshot for exact symbol
    const snapUrl = `${ALPACA_DATA_URL}/v2/stocks/${encodeURIComponent(symbol)}/snapshot`;
    const headers = {
      "APCA-API-KEY-ID": ALPACA_KEY,
      "APCA-API-SECRET-KEY": ALPACA_SECRET,
      Accept: "application/json",
    };

    const res = await fetch(snapUrl, { headers });
    if (!res.ok) {
      return NextResponse.json(
        { error: `No data for ${symbol}` },
        { status: 404 }
      );
    }
    const snap = await res.json();
    const quote = snap?.latestQuote ?? {};
    const trade = snap?.latestTrade ?? {};
    const daily = snap?.dailyBar ?? {};
    const prevDaily = snap?.prevDailyBar ?? {};

    const price = trade.p ?? quote.bp ?? 0;
    const prevClose = prevDaily.c ?? daily.o ?? price;
    const change = price - prevClose;
    const changePct = prevClose ? (change / prevClose) * 100 : 0;

    return NextResponse.json({
      results: [
        {
          symbol: snap.symbol ?? symbol,
          price,
          change,
          changePct,
          bid: quote.bp ?? null,
          ask: quote.ap ?? null,
          high: daily.h ?? null,
          low: daily.l ?? null,
          open: daily.o ?? null,
          volume: daily.v ?? null,
          prevClose,
        },
      ],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
