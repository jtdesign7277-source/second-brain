export const runtime = "edge";

const BACKEND_URL = "https://stratify-backend-production-3ebd.up.railway.app";

const SYSTEM_PROMPT = `You are Fred, Jeff's AI trading assistant inside Second Brain. Sharp, direct, data-driven.

CRITICAL RULES:
- You have REAL Alpaca market data injected below. USE IT. Never say "I can't access data."
- When asked about a stock, reference the ACTUAL numbers from the data provided.
- For backtests: analyze the real historical OHLCV bars provided. Find actual setups that occurred — dates, prices, entries, exits, P&L.
- Give specific numbers: prices, percentages, levels, volumes, dates.
- Calculate actual returns: "If you bought at $X on [date] and sold at $Y on [date], that's Z% return."
- Be concise but thorough. No generic advice — use the ACTUAL data.
- You're talking to a trader who pays $1K/yr for premium Alpaca data. Deliver premium analysis.
- Format with **bold**, bullet points, and clear sections.

CODE GENERATION RULE:
- When analyzing stocks, backtests, or strategies, ALWAYS include a consolidated Python script at the END of your response inside a single \`\`\`python code block.
- The Python code should implement the strategy/analysis you described using real data.
- Include proper imports, typed parameters, and clear comments.
- Make it runnable — use pandas, numpy where appropriate.
- The code block will be extracted and displayed in a side panel next to your analysis.

BACKTEST NAMING & VALUATION (CRITICAL):
- At the VERY END of every backtest/strategy response (before the code block), include a bold summary box like:

---
## 🏷️ Strategy Name: $TSLA Break & Retest Long Setup (15min Chart)
## 💰 Backtest Value: $4,230 profit on $10,000 starting capital (42.3% return)
---

- Give each backtest a catchy, specific trade name (include ticker, pattern, timeframe, direction)
- Calculate the REAL DOLLAR P&L assuming $10,000 starting capital
- Include: entry price, exit price, shares bought, gross profit, % return
- Use emojis in your response: 🏆 for winners, 📉 for losers, 🎯 for targets, ⚡ for key signals, 💰 for P&L, 📊 for stats, 🔥 for best setups, ❌ for avoid signals
- Use color-friendly formatting: lines with gains should mention "profit" or "+", losses should mention "loss" or "-" (the UI color-codes based on these words)

KEY TRADE SETUPS (CRITICAL — INCLUDE IN EVERY STRATEGY/BACKTEST):
After your analysis and before the code block, ALWAYS include this exact section with real values extracted from your analysis:

## 🔥 Key Trade Setups
- **Entry Signal:** [exact entry condition, e.g. "RSI crosses above 30 with volume confirmation"]
- **Volume:** [volume requirement, e.g. "Above 20-day average (>2.5M shares)"]
- **Trend:** [trend alignment, e.g. "Bullish — price above 50-day SMA at $142.30"]
- **Risk/Reward:** [ratio, e.g. "3.2:1 ($4.50 risk / $14.40 reward)"]
- **Stop Loss:** [exact stop, e.g. "$138.50 (-2.8% from entry)"]

These 5 values are parsed by the UI and displayed in an editable "Key Trade Setups" card. The user will add their own Position Size / $ Allocation (6th item). Make each value specific with real numbers from the data.`;

function extractTickers(text: string): string[] {
  const tickers = new Set<string>();
  // $TSLA format
  for (const m of text.matchAll(/\$([A-Z]{1,5})\b/g)) tickers.add(m[1]);
  // Common tickers without $
  for (const m of text.matchAll(/\b(TSLA|AAPL|NVDA|AMD|MSFT|META|GOOGL|AMZN|SPY|QQQ|BTC|ETH|DOGE|XRP|SOL|NFLX|COIN|PLTR|SOFI|RIVN|LCID|NIO|BABA|BA|DIS|JPM|GS|V|MA)\b/gi)) {
    tickers.add(m[1].toUpperCase());
  }
  // Also catch "Tesla" → TSLA etc
  const nameMap: Record<string, string> = { tesla: "TSLA", apple: "AAPL", nvidia: "NVDA", amazon: "AMZN", google: "GOOGL", microsoft: "MSFT", meta: "META", bitcoin: "BTC", ethereum: "ETH" };
  for (const [name, ticker] of Object.entries(nameMap)) {
    if (text.toLowerCase().includes(name)) tickers.add(ticker);
  }
  return [...tickers];
}

function detectPeriod(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("1 month") || lower.includes("one month") || lower.includes("last month")) return "1mo";
  if (/(?:2|two)\s*month/i.test(lower)) return "2mo";
  if (/(?:6|six)\s*month|half\s*year/i.test(lower)) return "6mo";
  if (/(?:1|one|last)\s*year|12\s*month|twelve\s*month/i.test(lower)) return "1y";
  return "3mo"; // default
}

async function fetchSnapshot(symbol: string): Promise<string> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/stocks/${encodeURIComponent(symbol)}`);
    if (!res.ok) return `${symbol}: snapshot unavailable`;
    const d = await res.json();
    return `${symbol} CURRENT: Price $${d.price || d.askPrice || 0}, Open $${d.open || 0}, High $${d.high || 0}, Low $${d.low || 0}, Volume ${d.volume || 0}, PrevClose $${d.prevClose || 0}, Change ${d.changePercent?.toFixed(2) || d.change || 0}%`;
  } catch {
    return `${symbol}: snapshot unavailable`;
  }
}

async function fetchHistory(symbol: string, period: string): Promise<string> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/stocks/${encodeURIComponent(symbol)}/history?period=${period}`);
    if (!res.ok) return "";
    const data = await res.json();
    const bars = data.bars || [];
    if (bars.length === 0) return "";

    // Calculate key stats
    const closes = bars.map((b: any) => b.close);
    const highs = bars.map((b: any) => b.high);
    const lows = bars.map((b: any) => b.low);
    const volumes = bars.map((b: any) => b.volume);
    const periodHigh = Math.max(...highs);
    const periodLow = Math.min(...lows);
    const avgVolume = Math.round(volumes.reduce((a: number, b: number) => a + b, 0) / volumes.length);
    const startPrice = closes[0];
    const endPrice = closes[closes.length - 1];
    const periodReturn = ((endPrice - startPrice) / startPrice * 100).toFixed(2);

    // Find biggest single-day moves
    const dailyMoves = bars.slice(1).map((b: any, i: number) => ({
      date: b.date,
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
      volume: b.volume,
      prevClose: bars[i].close,
      change: ((b.close - bars[i].close) / bars[i].close * 100),
      intraday: ((b.high - b.low) / b.low * 100),
    }));
    
    const topGainers = [...dailyMoves].sort((a, b) => b.change - a.change).slice(0, 5);
    const topLosers = [...dailyMoves].sort((a, b) => a.change - b.change).slice(0, 5);
    const highVolDays = [...dailyMoves].sort((a, b) => b.volume - a.volume).slice(0, 5);
    const wideRangeDays = [...dailyMoves].sort((a, b) => b.intraday - a.intraday).slice(0, 5);

    let result = `\n${symbol} HISTORICAL (${period}, ${bars.length} trading days):\n`;
    result += `Period: ${bars[0].date} to ${bars[bars.length - 1].date}\n`;
    result += `Period Return: ${periodReturn}% ($${startPrice.toFixed(2)} → $${endPrice.toFixed(2)})\n`;
    result += `Period High: $${periodHigh.toFixed(2)} | Period Low: $${periodLow.toFixed(2)} | Avg Volume: ${avgVolume.toLocaleString()}\n`;
    
    result += `\nTOP 5 BEST DAYS:\n`;
    for (const d of topGainers) {
      result += `  ${d.date}: +${d.change.toFixed(2)}% (O:$${d.open.toFixed(2)} H:$${d.high.toFixed(2)} L:$${d.low.toFixed(2)} C:$${d.close.toFixed(2)} Vol:${d.volume.toLocaleString()})\n`;
    }
    
    result += `\nTOP 5 WORST DAYS:\n`;
    for (const d of topLosers) {
      result += `  ${d.date}: ${d.change.toFixed(2)}% (O:$${d.open.toFixed(2)} H:$${d.high.toFixed(2)} L:$${d.low.toFixed(2)} C:$${d.close.toFixed(2)} Vol:${d.volume.toLocaleString()})\n`;
    }

    result += `\nTOP 5 HIGHEST VOLUME DAYS:\n`;
    for (const d of highVolDays) {
      result += `  ${d.date}: ${d.change >= 0 ? '+' : ''}${d.change.toFixed(2)}% Vol:${d.volume.toLocaleString()} (O:$${d.open.toFixed(2)} C:$${d.close.toFixed(2)})\n`;
    }

    result += `\nTOP 5 WIDEST RANGE DAYS (intraday %):\n`;
    for (const d of wideRangeDays) {
      result += `  ${d.date}: ${d.intraday.toFixed(2)}% range (H:$${d.high.toFixed(2)} L:$${d.low.toFixed(2)} C:$${d.close.toFixed(2)})\n`;
    }

    // Include ALL daily bars as CSV for deeper analysis
    result += `\nFULL DAILY BARS (date,open,high,low,close,volume):\n`;
    for (const b of bars) {
      result += `${b.date},${b.open},${b.high},${b.low},${b.close},${b.volume}\n`;
    }

    return result;
  } catch {
    return "";
  }
}

export async function POST(req: Request) {
  try {
    // Optional API key auth — if x-api-key header present, validate and meter
    let apiKeyId: string | null = null;
    const externalKey = req.headers.get("x-api-key");
    if (externalKey) {
      try {
        const { validateApiKey, logUsage } = await import("@/lib/apiAuth");
        const nextReq = req as any;
        // Quick hash check
        const nodeCrypto = await import("node:crypto");
        const hash = nodeCrypto.createHash("sha256").update(externalKey).digest("hex");
        const { getSupabaseServer } = await import("@/lib/supabase/server");
        const sb = getSupabaseServer();
        const { data } = await sb.from("api_keys").select("id, user_id, rate_limit_per_day, active").eq("key_hash", hash).single();
        if (!data || !data.active) {
          return new Response(JSON.stringify({ error: "Invalid or deactivated API key" }), { status: 401, headers: { "Content-Type": "application/json" } });
        }
        // Rate limit check
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const { count } = await sb.from("api_usage").select("*", { count: "exact", head: true }).eq("api_key_id", data.id).gte("created_at", todayStart.toISOString());
        if ((count ?? 0) >= data.rate_limit_per_day) {
          return new Response(JSON.stringify({ error: `Rate limit exceeded (${data.rate_limit_per_day}/day)` }), { status: 429, headers: { "Content-Type": "application/json" } });
        }
        apiKeyId = data.id;
      } catch { /* Supabase not configured — skip auth */ }
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response("Missing ANTHROPIC_API_KEY", { status: 500 });
    }

    const body = await req.json();
    const incoming = Array.isArray(body?.messages) ? body.messages : [];
    const messages = incoming.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));

    const allText = messages.map((m: any) => m.content).join(" ");
    const tickers = extractTickers(allText);
    const period = detectPeriod(allText);
    let marketContext = "";
    if (tickers.length > 0) {
      const dataPromises = tickers.slice(0, 3).map(async (t) => {
        const snapshot = await fetchSnapshot(t);
        const history = await fetchHistory(t, period);
        return snapshot + history;
      });
      const results = await Promise.all(dataPromises);
      marketContext = `\n\n## LIVE ALPACA MARKET DATA (REAL — use this data in your response)\n${results.join("\n")}`;
    }

    const fullSystem = SYSTEM_PROMPT + marketContext;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: fullSystem,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(`Anthropic error: ${response.status} ${errText}`, { status: 502 });
    }

    const reader = response.body!.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let buffer = "";

    const readable = new ReadableStream({
      async pull(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) { controller.close(); return; }
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data: ")) continue;
              const data = trimmed.slice(6);
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                  controller.enqueue(encoder.encode(parsed.delta.text));
                }
              } catch {}
            }
          }
        } catch { controller.close(); }
      },
    });

    // Log usage if API key was used
    if (apiKeyId) {
      try {
        const { logUsage } = await import("@/lib/apiAuth");
        logUsage(apiKeyId, "/api/chat", 0, 0, 0, 200).catch(() => {});
      } catch {}
    }

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache, no-transform" },
    });
  } catch (error: any) {
    return new Response(error?.message || "Internal server error", { status: 500 });
  }
}
