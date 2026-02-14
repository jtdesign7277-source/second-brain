"use client";

import { useEffect, useRef } from "react";

function MiniChart({ symbol }: { symbol: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (!ref.current || loaded.current) return;
    loaded.current = true;

    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container";
    widgetContainer.style.height = "100%";
    widgetContainer.style.width = "100%";

    const widgetInner = document.createElement("div");
    widgetInner.className = "tradingview-widget-container__widget";
    widgetInner.style.height = "100%";
    widgetInner.style.width = "100%";

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
      isTransparent: false,
      autosize: true,
      largeChartUrl: "",
      chartOnly: false,
    });

    widgetContainer.appendChild(widgetInner);
    widgetContainer.appendChild(script);
    ref.current.appendChild(widgetContainer);
  }, [symbol]);

  return (
    <div className="h-[180px] w-full overflow-hidden rounded-lg bg-[#1e222d]">
      <div ref={ref} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}

export default function TradingWidgets() {
  return (
    <div className="grid grid-cols-3 gap-2">
      <MiniChart symbol="NASDAQ:TSLA" />
      <MiniChart symbol="NASDAQ:QQQ" />
      <MiniChart symbol="BITSTAMP:BTCUSD" />
    </div>
  );
}
