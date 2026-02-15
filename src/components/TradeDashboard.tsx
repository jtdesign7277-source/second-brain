"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  DollarSign,
  Clock,
  Zap,
  Pause,
  Play,
  XCircle,
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

export default function TradeDashboard() {
  const [strategies, setStrategies] = useState<ActiveStrategy[]>([]);
  const [balance, setBalance] = useState<PaperBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);

    // Primary: read from localStorage (same source as StrategyActivation)
    try {
      const raw = localStorage.getItem("second-brain-active-strategies");
      const local: Record<string, unknown>[] = raw ? JSON.parse(raw) : [];
      const mapped: ActiveStrategy[] = local.map((s: Record<string, unknown>) => ({
        id: (s.documentId as string) ?? crypto.randomUUID(),
        userId: "local",
        documentId: s.documentId as string,
        title: s.title as string,
        symbol: s.symbol as string,
        positionSize: (s.positionSize as number) ?? 10000,
        stopLossPercent: (s.stopLossPercent as number) ?? 2,
        takeProfitPercent: (s.takeProfitPercent as number) ?? 4,
        status: s.status as string,
        activatedAt: (s.activatedAt as string) ?? null,
        trades: (s.trades as TradeEntry[]) ?? [],
        todayTradeCount: 0,
      }));
      setStrategies(mapped);
    } catch {}

    // Also try API for balance info (may fail on cold starts)
    try {
      const res = await fetch("/api/strategies?userId=local");
      if (res.ok) {
        const data = await res.json();
        if (data.balance) setBalance(data.balance);
        // If API has strategies too, merge (API is source of truth for trades)
        if (data.strategies?.length) {
          setStrategies((prev) => {
            const apiIds = new Set((data.strategies as ActiveStrategy[]).map((s: ActiveStrategy) => s.documentId));
            const localOnly = prev.filter((s) => !apiIds.has(s.documentId));
            return [...(data.strategies as ActiveStrategy[]), ...localOnly];
          });
        }
      }
    } catch {}

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 60000);
    return () => clearInterval(id);
  }, [fetchData]);

  // Listen for strategy activations
  useEffect(() => {
    const handler = () => { fetchData(); };
    window.addEventListener("strategy-activated", handler);
    return () => window.removeEventListener("strategy-activated", handler);
  }, [fetchData]);

  const togglePause = useCallback((documentId: string) => {
    try {
      const raw = localStorage.getItem("second-brain-active-strategies");
      const all: Record<string, unknown>[] = raw ? JSON.parse(raw) : [];
      const updated = all.map((s) => {
        if (s.documentId === documentId) {
          return { ...s, status: s.status === "paused" ? "active" : "paused" };
        }
        return s;
      });
      localStorage.setItem("second-brain-active-strategies", JSON.stringify(updated));
      // Also update API
      const target = updated.find((s) => s.documentId === documentId);
      if (target) {
        fetch("/api/strategies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...target, userId: "local" }),
        }).catch(() => {});
      }
      fetchData();
      window.dispatchEvent(new Event("strategy-activated"));
    } catch {}
  }, [fetchData]);

  const killStrategy = useCallback((documentId: string) => {
    try {
      const raw = localStorage.getItem("second-brain-active-strategies");
      const all: Record<string, unknown>[] = raw ? JSON.parse(raw) : [];
      const updated = all.filter((s) => s.documentId !== documentId);
      localStorage.setItem("second-brain-active-strategies", JSON.stringify(updated));
      // Also remove from API
      fetch(`/api/strategies?userId=local&documentId=${documentId}`, { method: "DELETE" }).catch(() => {});
      fetchData();
      window.dispatchEvent(new Event("strategy-activated"));
    } catch {}
  }, [fetchData]);

  const activeStrategies = strategies.filter(
    (s) => s.status === "active" || s.status === "executing" || s.status === "paused"
  );
  const allTrades = strategies.flatMap((s) => s.trades ?? []);
  const recentTrades = [...allTrades]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  const cash = balance?.cash ?? 200000;
  const positionsValue = balance?.positions.reduce((s, p) => s + p.currentValue, 0) ?? 0;
  const totalEquity = cash + positionsValue;
  const startBal = balance?.startingBalance ?? 200000;
  const totalPnl = totalEquity - startBal;
  const totalPnlPct = (totalPnl / startBal) * 100;

  const isMarketOpen = (() => {
    const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    const day = et.getDay();
    const h = et.getHours();
    const m = et.getMinutes();
    const mins = h * 60 + m;
    return day >= 1 && day <= 5 && mins >= 570 && mins < 960;
  })();

  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: true, timeZone: "America/New_York",
  });

  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="flex h-full flex-col overflow-y-auto no-panel-scale">
      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/50">
        <div className="flex items-center gap-1.5">
          <span className={clsx("h-1.5 w-1.5 rounded-full shrink-0", isMarketOpen ? "bg-emerald-400 animate-pulse" : "bg-zinc-600")} />
          <span className="text-[11px] text-zinc-300">{isMarketOpen ? "Open" : "Closed"}</span>
          <span className="text-[11px] font-mono text-zinc-500">{timeStr}</span>
        </div>
        <button type="button" onClick={fetchData} disabled={loading}
          className="text-[11px] text-zinc-600 hover:text-zinc-300 transition">
          <RefreshCw className={clsx("h-3 w-3 inline", loading && "animate-spin")} />
        </button>
      </div>

      {/* Balance section */}
      <div className="px-3 py-2 border-b border-zinc-800/50 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Wallet className="h-3 w-3 text-zinc-500" />
            <span className="text-[10px] uppercase tracking-wide text-zinc-500">Equity</span>
          </div>
          <span className="text-[13px] font-bold text-white">${fmt(totalEquity)}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3 text-zinc-500" />
            <span className="text-[10px] uppercase tracking-wide text-zinc-500">Cash</span>
          </div>
          <span className="text-[13px] text-zinc-200">${fmt(cash)}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {totalPnl >= 0 ? <TrendingUp className="h-3 w-3 text-emerald-400" /> : <TrendingDown className="h-3 w-3 text-red-400" />}
            <span className="text-[10px] uppercase tracking-wide text-zinc-500">P&L</span>
          </div>
          <span className={clsx("text-[13px] font-bold", totalPnl >= 0 ? "text-emerald-400" : "text-red-400")}>
            {totalPnl >= 0 ? "+" : ""}${fmt(totalPnl)}
            <span className="text-[10px] ml-1">({totalPnlPct >= 0 ? "+" : ""}{totalPnlPct.toFixed(2)}%)</span>
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-zinc-500" />
            <span className="text-[10px] uppercase tracking-wide text-zinc-500">Strategies</span>
          </div>
          <span className="text-[13px] font-bold text-white">{activeStrategies.length}</span>
        </div>
      </div>

      {/* Active strategies */}
      <div className="px-3 py-2">
        <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-400 mb-1.5">Active Strategies</div>
        {activeStrategies.length === 0 ? (
          <div className="border border-zinc-800 rounded-md px-3 py-4 text-center">
            <Activity className="h-4 w-4 text-zinc-700 mx-auto mb-1" />
            <p className="text-[11px] text-zinc-600">No active strategies</p>
            <p className="text-[10px] text-zinc-700">Activate one from Strategies sidebar</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {activeStrategies.map((s) => (
              <div key={s.id} className="border border-zinc-800 rounded-md px-3 py-2">
                <div className="flex items-center gap-1.5 mb-1">
                  {!isMarketOpen ? (
                    <Pause className="h-3 w-3 text-amber-400 shrink-0" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  )}
                  <span className="text-[12px] font-semibold text-white truncate">{s.title}</span>
                </div>
                <div className="space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-[10px] text-zinc-500">Symbol</span>
                    <span className="text-[11px] font-mono text-amber-400">${s.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] text-zinc-500">Size</span>
                    <span className="text-[11px] text-zinc-300">${s.positionSize.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] text-zinc-500">Stop / Take</span>
                    <span className="text-[11px]">
                      <span className="text-red-400">{s.stopLossPercent}%</span>
                      <span className="text-zinc-600 mx-1">/</span>
                      <span className="text-emerald-400">{s.takeProfitPercent}%</span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] text-zinc-500">Status</span>
                    <span className={clsx("text-[11px] font-medium",
                      isMarketOpen ? "text-emerald-400" : "text-amber-400"
                    )}>
                      {isMarketOpen ? "Monitoring" : "Paused — Market Closed"}
                    </span>
                  </div>
                  {s.activatedAt && (
                    <div className="flex justify-between">
                      <span className="text-[10px] text-zinc-500">Since</span>
                      <span className="text-[10px] text-zinc-500">
                        {new Date(s.activatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
                {/* Pause + Kill buttons */}
                <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-zinc-800/50">
                  <button
                    type="button"
                    onClick={() => togglePause(s.documentId)}
                    className={clsx(
                      "flex items-center gap-1 flex-1 justify-center rounded-md border px-2 py-1 text-[10px] font-medium transition",
                      s.status === "paused"
                        ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                        : "border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                    )}
                  >
                    {s.status === "paused" ? (
                      <><Play className="h-3 w-3" /> Resume</>
                    ) : (
                      <><Pause className="h-3 w-3" /> Pause</>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => killStrategy(s.documentId)}
                    className="flex items-center gap-1 flex-1 justify-center rounded-md border border-red-500/30 px-2 py-1 text-[10px] font-medium text-red-400 transition hover:bg-red-500/10"
                  >
                    <XCircle className="h-3 w-3" /> Kill
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Open positions */}
      {balance && balance.positions.length > 0 && (
        <div className="px-3 py-2">
          <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-400 mb-1.5">Open Positions</div>
          <div className="space-y-1">
            {balance.positions.map((pos) => {
              const curPrice = pos.currentValue / (pos.quantity || 1);
              const pnl = (curPrice - pos.avgEntryPrice) * pos.quantity;
              return (
                <div key={pos.symbol} className="flex justify-between border border-zinc-800 rounded-md px-3 py-1.5">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-amber-400">${pos.symbol}</span>
                    <div className="text-[10px] text-zinc-500">{pos.quantity} @ ${pos.avgEntryPrice.toFixed(2)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-white">${pos.currentValue.toFixed(2)}</div>
                    <div className={clsx("text-[10px]", pnl >= 0 ? "text-emerald-400" : "text-red-400")}>
                      {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent trades */}
      <div className="px-3 py-2">
        <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-400 mb-1.5">Recent Trades</div>
        {recentTrades.length === 0 ? (
          <div className="border border-zinc-800 rounded-md px-3 py-3 text-center">
            <Clock className="h-3.5 w-3.5 text-zinc-700 mx-auto mb-1" />
            <p className="text-[11px] text-zinc-600">No trades yet</p>
            <p className="text-[10px] text-zinc-700">TradeBot executes during market hours</p>
          </div>
        ) : (
          <div className="space-y-1">
            {recentTrades.map((t) => (
              <div key={t.id} className="flex justify-between border border-zinc-800/50 rounded-md px-2 py-1.5">
                <div className="flex items-center gap-1.5">
                  <span className={clsx("text-[10px] font-bold",
                    t.action === "BUY" ? "text-emerald-400" : "text-red-400"
                  )}>{t.action}</span>
                  <span className="text-[10px] font-mono text-amber-400">${t.symbol}</span>
                  <span className="text-[10px] text-zinc-500">{t.quantity}@${t.price.toFixed(2)}</span>
                </div>
                <span className="text-[10px] text-zinc-600">{new Date(t.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto px-3 py-1.5 border-t border-zinc-800/50">
        <p className="text-[9px] text-zinc-700 text-center">Paper Trading · $200K Balance · Alpaca Live Data · 5min checks</p>
      </div>
    </div>
  );
}
