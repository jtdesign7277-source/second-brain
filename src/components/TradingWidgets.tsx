"use client";

import { useEffect, useRef } from "react";

export default function TradingWidgets() {
  const ref = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (!ref.current || loaded.current) return;
    loaded.current = true;

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js";
    script.async = true;
    script.textContent = JSON.stringify({
      width: "100%",
      height: "100%",
      symbolsGroups: [
        {
          name: "Watchlist",
          symbols: [
            { name: "NASDAQ:TSLA", displayName: "Tesla" },
            { name: "NASDAQ:QQQ", displayName: "QQQ" },
            { name: "BITSTAMP:BTCUSD", displayName: "Bitcoin" },
          ],
        },
      ],
      showSymbolLogo: true,
      isTransparent: false,
      colorTheme: "dark",
      locale: "en",
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
    ref.current.appendChild(widgetContainer);
  }, []);

  return (
    <div className="h-[200px] w-full overflow-hidden rounded-lg">
      <div ref={ref} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}
