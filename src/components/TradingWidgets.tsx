"use client";

const symbols = [
  { symbol: "AMEX:SPY", title: "SPY" },
  { symbol: "NASDAQ:AAPL", title: "AAPL" },
  { symbol: "BINANCE:BTCUSDT", title: "BTC" }
];

function buildTradingViewSrc(symbol: string) {
  const params = new URLSearchParams({
    symbol,
    interval: "60",
    hidetoptoolbar: "1",
    hidelegend: "1",
    saveimage: "0",
    toolbarbg: "#131722",
    studies: "",
    theme: "dark",
    style: "1",
    timezone: "Etc/UTC",
    withdateranges: "0",
    allow_symbol_change: "0",
    details: "0",
    hotlist: "0",
    calendar: "0",
    hideideas: "1",
    locale: "en"
  });

  return `https://s.tradingview.com/widgetembed/?${params.toString()}`;
}

export default function TradingWidgets() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {symbols.map((item) => (
        <div
          key={item.symbol}
          className="h-[170px] overflow-hidden rounded-xl border border-zinc-800 bg-[#131722]"
        >
          <iframe
            title={item.title}
            src={buildTradingViewSrc(item.symbol)}
            className="h-full w-full"
            allowTransparency
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}
