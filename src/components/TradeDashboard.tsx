"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  DollarSign,
  BarChart3,
  Clock,
  Zap,
} from "lucide-react";
import clsx from "clsx";

type ActiveStrategy = {
  id: string;
  userId: string;
  documentId: string;
  title: string;
  symbol: string;
  positionSize: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  status: string;
  activatedAt: string | null;
  trades: TradeEntry[];
  todayTradeCount: number;
};

type TradeEntry = {
  id: string;
  timestamp: string;
  action: "BUY" | "SELL";
  symbol: string;
  quantity: number;
  price: number;
  total: number;
  reason: string;
};

type PaperBalance = {
  userId: string;
  cash: number;
  startingBalance: number;
  positions: {
    symbol: string;
    quantity: number;
    avgEntryPrice: number;
    currentValue: number;
  }[];
  totalPnl: number;
  lastUpdated: string;
};

type SnapshotData = {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
};

const ALPACA_KEY = "AKPSBE4WMXGR7MGGVCSUHG4UGM";
const ALPACA_SECRET = "HNVf28Fdb5dhBmyM5hL9msUutdFtHLPbJzi4h3NwNbcq";

export default function TradeDashboard() {
  const [strategies, setStrategies] = useState<ActiveStrategy[]>([]);
  const [balance, setBalance] = useState<PaperBalance | null>(null);
  const [snapshots, setSnapshots] = useState<Record<string, SnapshotData>>({});
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/strategies?userId=local");
      if (res.ok) {
        const data = await res.json();
        setStrategies(data.strategies ?? []);
        setBalance(data.balance ?? null);

        // Fetch live prices for all strategy symbols
        const symbols = [
          ...new Set((data.strategies ?? []).map((s: ActiveStrategy) => s.symbol)),
        ] as string[];

        for (const sym of symbols) {
          try {
            // Use crypto endpoint for crypto symbols
            const isCrypto = ["BTC", "ETH", "SOL", "XRP", "DOGE", "ADA", "AVAX", "DOT", "MATIC", "LINK", "UNI", "AAVE"].includes(sym.replace("USD", "").replace("/", ""));
            const url = isCrypto
              ? `https://data.alpaca.markets/v1beta3/crypto/us/snapshots/${sym}USD`
              : `https://data.alpaca.markets/v2/stocks/${sym}/snapshot`;

            const snapRes = await fetch(url, {
              headers: {
                "APCA-API-KEY-ID": ALPACA_KEY,
                "APCA-API-SECRET-KEY": ALPACA_SECRET,
              },
            });
            if (snapRes.ok) {
              const snap = await snapRes.json();
              const price = snap?.latestTrade?.p ?? snap?.minuteBar?.c ?? 0;
              const prevClose = snap?.prevDailyBar?.c ?? price;
              const change = price - prevClose;
              const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
              setSnapshots((prev) => ({
                ...prev,
                [sym]: { symbol: sym, price, change, changePercent },
              }));
            }
          } catch {}
        }
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 60000); // refresh every minute
    return () => clearInterval(id);
  }, [fetchData]);

  const activeStrategies = strategies.filter(
    (s) => s.status === "active" || s.status === "executing"
  );
  const allTrades = strategies.flatMap((s) => s.trades ?? []);
  const recentTrades = [...allTrades]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  const totalEquity = balance
    ? balance.cash +
      balance.positions.reduce((sum, p) => sum + p.currentValue, 0)
    : 200000;
  const totalPnl = balance ? totalEquity - balance.startingBalance : 0;
  const totalPnlPercent = balance
    ? (totalPnl / balance.startingBalance) * 100
    : 0;

  const formattedTime = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: "America/New_York",
  });

  const isMarketOpen = (() => {
    const et = new Date(
      now.toLocaleString("en-US", { timeZone: "America/New_York" })
    );
    const day = et.getDay();
    const h = et.getHours();
    const m = et.getMinutes();
    const mins = h * 60 + m;
    return day >= 1 && day <= 5 && mins >= 570 && mins < 960; // 9:30-16:00
  })();

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-zinc-800/50 px-4 py-2">
        <div className="flex items-center gap-2">
          <span
            className={clsx(
              "h-2 w-2 rounded-full",
              isMarketOpen ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"
            )}
          />
          <span className="text-xs font-medium text-zinc-300">
            {isMarketOpen ? "Market Open" : "Market Closed"}
          </span>
          <span className="text-xs font-mono text-zinc-500">{formattedTime} ET</span>
        </div>
        <button
          type="button"
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1 text-xs text-zinc-600 transition hover:text-zinc-300"
        >
          <RefreshCw className={clsx("h-3 w-3", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-4 gap-2 px-4 py-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Wallet className="h-3 w-3" />
            Total Equity
          </div>
          <div className="text-lg font-bold text-white mt-0.5">
            ${totalEquity.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <DollarSign className="h-3 w-3" />
            Cash
          </div>
          <div className="text-lg font-bold text-white mt-0.5">
            ${(balance?.cash ?? 200000).toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}
          </div>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            {totalPnl >= 0 ? (
              <TrendingUp className="h-3 w-3 text-emerald-400" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-400" />
            )}
            Total P&L
          </div>
          <div
            className={clsx(
              "text-lg font-bold mt-0.5",
              totalPnl >= 0 ? "text-emerald-400" : "text-red-400"
            )}
          >
            {totalPnl >= 0 ? "+" : ""}${totalPnl.toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}{" "}
            <span className="text-xs">
              ({totalPnlPercent >= 0 ? "+" : ""}
              {totalPnlPercent.toFixed(2)}%)
            </span>
          </div>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Zap className="h-3 w-3" />
            Active Strategies
          </div>
          <div className="text-lg font-bold text-white mt-0.5">
            {activeStrategies.length}
          </div>
        </div>
      </div>

      {/* Active strategies */}
      <div className="px-4 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-2">
          Active Strategies
        </h3>
        {activeStrategies.length === 0 ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 px-4 py-6 text-center">
            <Activity className="h-6 w-6 text-zinc-600 mx-auto mb-2" />
            <p className="text-xs text-zinc-500">
              No active strategies — activate one from the Strategies sidebar
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {activeStrategies.map((s) => {
              const snap = snapshots[s.symbol];
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <div>
                      <div className="text-sm font-medium text-white">
                        {s.title}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <span className="font-mono text-amber-400">
                          ${s.symbol}
                        </span>
                        <span>
                          Size: ${s.positionSize.toLocaleString()}
                        </span>
                        <span>SL: {s.stopLossPercent}%</span>
                        <span>TP: {s.takeProfitPercent}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {snap ? (
                      <>
                        <div className="text-sm font-mono text-white">
                          ${snap.price.toFixed(2)}
                        </div>
                        <div
                          className={clsx(
                            "text-xs font-mono",
                            snap.change >= 0
                              ? "text-emerald-400"
                              : "text-red-400"
                          )}
                        >
                          {snap.change >= 0 ? "+" : ""}
                          {snap.change.toFixed(2)} (
                          {snap.changePercent >= 0 ? "+" : ""}
                          {snap.changePercent.toFixed(2)}%)
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-zinc-600">Loading...</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Open positions */}
      {balance && balance.positions.length > 0 && (
        <div className="px-4 py-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-2">
            Open Positions
          </h3>
          <div className="space-y-1">
            {balance.positions.map((pos) => {
              const snap = snapshots[pos.symbol];
              const currentPrice = snap?.price ?? pos.currentValue / pos.quantity;
              const pnl =
                (currentPrice - pos.avgEntryPrice) * pos.quantity;
              const pnlPercent =
                ((currentPrice - pos.avgEntryPrice) / pos.avgEntryPrice) * 100;
              return (
                <div
                  key={pos.symbol}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-2"
                >
                  <div>
                    <span className="font-mono text-sm font-bold text-amber-400">
                      ${pos.symbol}
                    </span>
                    <span className="text-xs text-zinc-500 ml-2">
                      {pos.quantity} shares @ ${pos.avgEntryPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono text-white">
                      ${(currentPrice * pos.quantity).toFixed(2)}
                    </div>
                    <div
                      className={clsx(
                        "text-xs font-mono",
                        pnl >= 0 ? "text-emerald-400" : "text-red-400"
                      )}
                    >
                      {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} (
                      {pnlPercent >= 0 ? "+" : ""}
                      {pnlPercent.toFixed(2)}%)
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent trades */}
      <div className="px-4 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-2">
          Recent Trades
        </h3>
        {recentTrades.length === 0 ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 px-4 py-4 text-center">
            <Clock className="h-5 w-5 text-zinc-600 mx-auto mb-1" />
            <p className="text-xs text-zinc-500">
              No trades yet — TradeBot will execute when conditions are met
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {recentTrades.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-md border border-zinc-800/50 bg-zinc-900/20 px-3 py-1.5"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={clsx(
                      "text-xs font-bold px-1.5 py-0.5 rounded",
                      t.action === "BUY"
                        ? "text-emerald-400 bg-emerald-500/10"
                        : "text-red-400 bg-red-500/10"
                    )}
                  >
                    {t.action}
                  </span>
                  <span className="font-mono text-xs text-amber-400">
                    ${t.symbol}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {t.quantity} @ ${t.price.toFixed(2)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-zinc-500">
                    ${t.total?.toFixed(2) ?? (t.quantity * t.price).toFixed(2)}
                  </span>
                  <span className="text-xs text-zinc-600 ml-2">
                    {new Date(t.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto border-t border-zinc-800/50 px-4 py-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-zinc-600">
            Paper Trading · $200K Starting Balance · Alpaca Live Data
          </span>
          <div className="flex items-center gap-1">
            <BarChart3 className="h-3 w-3 text-zinc-600" />
            <span className="text-[10px] text-zinc-600">
              TradeBot checks every 5 min during market hours
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
