export const runtime = "edge";

const BACKEND_URL = "https://stratify-backend-production-3ebd.up.railway.app";

const SYSTEM_PROMPT = `You are Fred, Jeff's AI trading assistant inside Second Brain. You are sharp, direct, and data-driven.

CRITICAL RULES:
- You have access to REAL market data from Alpaca. Use it. Never say "I can't access real-time data."
- When asked about a stock, ALWAYS reference the real data provided to you.
- Give specific numbers: prices, percentages, levels, volumes.
- For backtests: use the real historical bars data to identify actual setups that occurred.
- Be concise but thorough. No generic advice — use the actual data.
- Format responses cleanly with bold headers and bullet points.
- You're talking to a trader who pays for premium data. Act like it.`;

// Detect ticker symbols in the message
function extractTickers(text: string): string[] {
  const patterns = [
    /\$([A-Z]{1,5})\b/g,           // $TSLA format
    /\b(TSLA|AAPL|NVDA|AMD|MSFT|META|GOOGL|AMZN|SPY|QQQ|BTC|ETH|DOGE|XRP|SOL)\b/gi,
  ];
  const tickers = new Set<string>();
  for (const pat of patterns) {
    let match;
    while ((match = pat.exec(text)) !== null) {
      tickers.add(match[1].toUpperCase());
    }
  }
  return [...tickers];
}

// Fetch stock snapshot from Alpaca via Railway backend
async function fetchStockData(symbol: string): Promise<string> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/stocks/${encodeURIComponent(symbol)}`);
    if (!res.ok) return `${symbol}: data unavailable`;
    const d = await res.json();
    const price = d.askPrice || d.bidPrice || d.price || 0;
    return `${symbol}: Price $${price.toFixed(2)}, Open $${d.open || 0}, High $${d.high || 0}, Low $${d.low || 0}, Volume ${d.volume || 0}, Change ${d.change || 0}%`;
  } catch {
    return `${symbol}: data unavailable`;
  }
}

// Fetch historical bars for backtesting
async function fetchBars(symbol: string): Promise<string> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/stocks/bars`);
    if (!res.ok) return "";
    const bars = await res.json();
    const symbolBars = Array.isArray(bars) ? bars.filter((b: any) => b.symbol === symbol) : [];
    if (symbolBars.length === 0) return "";
    return `\n${symbol} recent bars: ${JSON.stringify(symbolBars.slice(0, 5))}`;
  } catch {
    return "";
  }
}

export async function POST(req: Request) {
  try {
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

    // Get the last user message to detect tickers
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user");
    const allText = messages.map((m: any) => m.content).join(" ");
    const tickers = extractTickers(allText);

    // Fetch real market data for detected tickers
    let marketContext = "";
    if (tickers.length > 0) {
      const dataPromises = tickers.slice(0, 5).map(async (t) => {
        const snapshot = await fetchStockData(t);
        const bars = await fetchBars(t);
        return snapshot + bars;
      });
      const results = await Promise.all(dataPromises);
      marketContext = `\n\n## LIVE MARKET DATA (from Alpaca — real data, use it)\n${results.join("\n")}`;
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
        max_tokens: 2048,
        system: fullSystem,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(`Anthropic error: ${response.status} ${errText}`, {
        status: 502,
      });
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
            if (done) {
              controller.close();
              return;
            }

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
                if (
                  parsed.type === "content_block_delta" &&
                  parsed.delta?.text
                ) {
                  controller.enqueue(encoder.encode(parsed.delta.text));
                }
              } catch {
                // skip
              }
            }
          }
        } catch (err) {
          console.error("Stream error:", err);
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (error: any) {
    return new Response(error?.message || "Internal server error", {
      status: 500,
    });
  }
}
