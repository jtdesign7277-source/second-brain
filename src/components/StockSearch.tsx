"use client";

import { useState, useRef, useEffect } from "react";
import { Search, TrendingUp, TrendingDown, X, Loader2 } from "lucide-react";
import clsx from "clsx";

type StockResult = {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  bid: number | null;
  ask: number | null;
  high: number | null;
  low: number | null;
  open: number | null;
  volume: number | null;
  prevClose: number | null;
};

function fmt(n: number | null | undefined, decimals = 2): string {
  if (n == null) return "—";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtVol(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

export default function StockSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StockResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const search = async (symbol: string) => {
    const q = symbol.trim().toUpperCase();
    if (!q) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/stock?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Not found");
      } else if (data.results?.[0]) {
        setResult(data.results[0]);
      } else {
        setError(`No data for ${q}`);
      }
    } catch {
      setError("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search(query);
  };

  const close = () => {
    setOpen(false);
    setQuery("");
    setResult(null);
    setError(null);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-md border border-zinc-700/60 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 transition hover:border-transparent hover:bg-gradient-to-r hover:from-violet-600 hover:via-indigo-600 hover:to-cyan-500"
      >
        <Search className="h-4 w-4" />
        Stock Search
      </button>
    );
  }

  const positive = result ? result.change >= 0 : false;

  return (
    <div className="rounded-lg border border-zinc-700/60 bg-zinc-900/80 p-3">
      {/* Search input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter ticker... AAPL, TSLA, BTC"
            className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 py-1.5 pl-8 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-500 disabled:opacity-40"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Go"}
        </button>
        <button
          type="button"
          onClick={close}
          className="rounded-md p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="mt-2 rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Result card */}
      {result && (
        <div className="mt-3 space-y-2">
          {/* Symbol + Price + Change */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-bold text-zinc-100">
                ${result.symbol}
              </span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-zinc-100">
                ${fmt(result.price)}
              </div>
              <div
                className={clsx(
                  "flex items-center gap-1 text-xs font-medium",
                  positive ? "text-emerald-400" : "text-red-400"
                )}
              >
                {positive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {positive ? "+" : ""}
                {fmt(result.change)} ({positive ? "+" : ""}
                {fmt(result.changePct)}%)
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-x-4 gap-y-1 border-t border-zinc-800 pt-2 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-500">Open</span>
              <span className="text-zinc-300">{fmt(result.open)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">High</span>
              <span className="text-zinc-300">{fmt(result.high)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Low</span>
              <span className="text-zinc-300">{fmt(result.low)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Bid</span>
              <span className="text-zinc-300">{fmt(result.bid)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Ask</span>
              <span className="text-zinc-300">{fmt(result.ask)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Vol</span>
              <span className="text-zinc-300">{fmtVol(result.volume)}</span>
            </div>
            <div className="flex justify-between col-span-2">
              <span className="text-zinc-500">Prev Close</span>
              <span className="text-zinc-300">{fmt(result.prevClose)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
