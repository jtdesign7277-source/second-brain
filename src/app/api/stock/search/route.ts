import { NextRequest, NextResponse } from "next/server";

const ALPACA_KEY = "AKPSBE4WMXGR7MGGVCSUHG4UGM";
const ALPACA_SECRET = "HNVf28Fdb5dhBmyM5hL9msUutdFtHLPbJzi4h3NwNbcq";

// Search Alpaca assets by name/symbol
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 1) {
    return NextResponse.json({ results: [] });
  }

  try {
    // Alpaca assets endpoint with search
    const res = await fetch(
      `https://api.alpaca.markets/v2/assets?status=active&asset_class=us_equity`,
      {
        headers: {
          "APCA-API-KEY-ID": ALPACA_KEY,
          "APCA-API-SECRET-KEY": ALPACA_SECRET,
        },
        next: { revalidate: 3600 }, // cache 1 hour
      }
    );

    if (!res.ok) {
      return NextResponse.json({ results: [] });
    }

    const assets: { symbol: string; name: string; exchange: string; tradable: boolean }[] = await res.json();

    const query = q.toUpperCase();
    const matches = assets
      .filter((a) => a.tradable && (
        a.symbol.startsWith(query) ||
        a.name.toUpperCase().includes(query)
      ))
      .sort((a, b) => {
        // Exact symbol match first
        if (a.symbol === query) return -1;
        if (b.symbol === query) return 1;
        // Symbol starts-with before name match
        const aStartsWith = a.symbol.startsWith(query) ? 0 : 1;
        const bStartsWith = b.symbol.startsWith(query) ? 0 : 1;
        if (aStartsWith !== bStartsWith) return aStartsWith - bStartsWith;
        // Shorter symbols first
        return a.symbol.length - b.symbol.length;
      })
      .slice(0, 8);

    return NextResponse.json({
      results: matches.map((a) => ({
        symbol: a.symbol,
        name: a.name,
        exchange: a.exchange,
      })),
    });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
