"use client";

import { useEffect, useRef } from "react";

const symbols = ["SPY", "AAPL", "BTCUSD"];

function SymbolWidget({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (!containerRef.current || scriptLoaded.current) return;
    scriptLoaded.current = true;

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = "100%";
    widgetDiv.style.width = "100%";
    containerRef.current.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
    script.async = true;
    script.textContent = JSON.stringify({
      symbols: [[symbol]],
      chartOnly: true,
      width: "100%",
      height: "100%",
      locale: "en",
      colorTheme: "dark",
      autosize: true,
      showVolume: false,
      showMA: false,
      hideDateRanges: true,
      hideMarketStatus: true,
      hideSymbolLogo: false,
      scalePosition: "no",
      scaleMode: "Normal",
      fontFamily: "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
      fontSize: "10",
      noTimeScale: true,
      valuesTracking: "0",
      changeMode: "price-and-percent",
      chartType: "area",
      lineWidth: 2,
      lineType: 0,
      dateRanges: ["1d|1"],
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });
    containerRef.current.appendChild(script);
  }, [symbol]);

  return (
    <div className="h-[170px] w-full overflow-hidden rounded-lg bg-[#131722]">
      <div
        ref={containerRef}
        className="tradingview-widget-container"
        style={{ height: "100%", width: "100%" }}
      />
    </div>
  );
}

export default function TradingWidgets() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {symbols.map((symbol) => (
        <SymbolWidget key={symbol} symbol={symbol} />
      ))}
    </div>
  );
}
