"use client";

import { useEffect, useRef } from "react";

function TickerCard({ symbol, name }: { symbol: string; name: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (!ref.current || loaded.current) return;
    loaded.current = true;

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-single-quote.js";
    script.async = true;
    script.textContent = JSON.stringify({
      symbol: symbol,
      width: "100%",
      isTransparent: false,
      colorTheme: "dark",
      locale: "en",
    });

    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container";

    const widgetInner = document.createElement("div");
    widgetInner.className = "tradingview-widget-container__widget";

    widgetContainer.appendChild(widgetInner);
    widgetContainer.appendChild(script);
    ref.current.appendChild(widgetContainer);
  }, [symbol]);

  return (
    <div className="overflow-hidden rounded-lg">
      <div ref={ref} />
    </div>
  );
}

export default function TradingWidgets() {
  return (
    <div className="grid grid-cols-3 gap-2">
      <TickerCard symbol="NASDAQ:TSLA" name="Tesla" />
      <TickerCard symbol="NASDAQ:QQQ" name="QQQ" />
      <TickerCard symbol="BITSTAMP:BTCUSD" name="Bitcoin" />
    </div>
  );
}
