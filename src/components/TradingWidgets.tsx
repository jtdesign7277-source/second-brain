"use client";

import { useEffect, useRef } from "react";

const tickers = [
  { symbol: "AMEX:SPY", name: "S&P 500 ETF" },
  { symbol: "NASDAQ:AAPL", name: "Apple" },
  { symbol: "BITSTAMP:BTCUSD", name: "Bitcoin" },
];

function TradingViewCard({ symbol }: { symbol: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (!ref.current || loaded.current) return;
    loaded.current = true;

    // Use TradingView's standard mini symbol overview iframe widget
    const container = ref.current;
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.async = true;
    script.textContent = JSON.stringify({
      symbol: symbol,
      width: "100%",
      height: "100%",
      locale: "en",
      dateRange: "1D",
      colorTheme: "dark",
      isTransparent: true,
      autosize: true,
      largeChartUrl: "",
    });

    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container";
    widgetContainer.style.height = "100%";
    widgetContainer.style.width = "100%";

    const widgetInner = document.createElement("div");
    widgetInner.className = "tradingview-widget-container__widget";
    widgetInner.style.height = "100%";
    widgetInner.style.width = "100%";

    widgetContainer.appendChild(widgetInner);
    widgetContainer.appendChild(script);
    container.appendChild(widgetContainer);
  }, [symbol]);

  return (
    <div className="h-[170px] w-full overflow-hidden rounded-lg bg-[#131722]">
      <div ref={ref} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}

export default function TradingWidgets() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {tickers.map((t) => (
        <TradingViewCard key={t.symbol} symbol={t.symbol} />
      ))}
    </div>
  );
}
