"use client";

import { useEffect, useRef } from "react";

const symbols = [
  { symbol: "SPY", name: "SPY" },
  { symbol: "AAPL", name: "AAPL" },
  { symbol: "BTCUSD", name: "BTC" },
];

function MiniChart({ symbol, name }: { symbol: string; name: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol: symbol,
      width: "100%",
      height: "100%",
      locale: "en",
      dateRange: "1D",
      colorTheme: "dark",
      isTransparent: true,
      autosize: true,
      largeChartUrl: "",
      noTimeScale: true,
      chartOnly: true,
    });

    containerRef.current.appendChild(script);
  }, [symbol]);

  return (
    <div className="h-[170px] overflow-hidden rounded-lg bg-[#131722] border border-zinc-800">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}

export default function TradingWidgets() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {symbols.map((item) => (
        <MiniChart key={item.symbol} symbol={item.symbol} name={item.name} />
      ))}
    </div>
  );
}
