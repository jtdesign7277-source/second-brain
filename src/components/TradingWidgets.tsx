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
      "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";
    script.async = true;
    script.textContent = JSON.stringify({
      colorTheme: "dark",
      dateRange: "1D",
      showChart: true,
      locale: "en",
      width: "100%",
      height: "100%",
      largeChartUrl: "",
      isTransparent: true,
      showSymbolLogo: true,
      showFloatingTooltip: false,
      plotLineColorGrowing: "rgba(34, 197, 94, 1)",
      plotLineColorFalling: "rgba(239, 68, 68, 1)",
      gridLineColor: "rgba(24, 24, 27, 0)",
      scaleFontColor: "rgba(161, 161, 170, 1)",
      belowLineFillColorGrowing: "rgba(34, 197, 94, 0.12)",
      belowLineFillColorFalling: "rgba(239, 68, 68, 0.12)",
      belowLineFillColorGrowingBottom: "rgba(34, 197, 94, 0)",
      belowLineFillColorFallingBottom: "rgba(239, 68, 68, 0)",
      symbolActiveColor: "rgba(99, 102, 241, 0.12)",
      tabs: [
        {
          title: "Watchlist",
          symbols: [
            { s: "NASDAQ:TSLA", d: "Tesla" },
            { s: "NASDAQ:QQQ", d: "Nasdaq 100 ETF" },
            { s: "BITSTAMP:BTCUSD", d: "Bitcoin" },
          ],
          originalTitle: "Watchlist",
        },
      ],
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
    <div className="h-[350px] w-full overflow-hidden rounded-lg bg-[#131722] border border-zinc-800">
      <div ref={ref} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}
