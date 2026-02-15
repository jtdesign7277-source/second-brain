"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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

type Suggestion = {
  symbol: string;
  name: string;
  exchange: string;
};

function fmt(n: number | null | undefined, decimals = 2): string {
  if (n == null) return "—";
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
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
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [result, setResult] = useState<StockResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 1) { setSuggestions([]); return; }
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/stock/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.results ?? []);
        setShowSuggestions(true);
      }
    } catch {}
    setSearchLoading(false);
  }, []);

  const handleInputChange = (val: string) => {
    setQuery(val);
    setResult(null);
    setError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 200);
  };

  const search = async (symbol: string) => {
    const q = symbol.trim().toUpperCase();
    if (!q) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setShowSuggestions(false);

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

  const selectSuggestion = (s: Suggestion) => {
    setQuery(s.symbol);
    setShowSuggestions(false);
    setSuggestions([]);
    search(s.symbol);
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
    setSuggestions([]);
    setShowSuggestions(false);
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
    <div className="rounded-lg border border-zinc-700/60 bg-zinc-900/80 p-3" ref={wrapperRef}>
      {/* Search input */}
      <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
            placeholder="Search ticker... AAPL, TSLA"
            className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 py-1.5 pl-8 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
          />
          {searchLoading && (
            <Loader2 className="absolute right-2.5 top-2 h-3.5 w-3.5 animate-spin text-zinc-500" />
          )}

          {/* Autocomplete dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg border border-zinc-700/60 bg-zinc-900 shadow-xl shadow-black/50 overflow-hidden max-h-[280px] overflow-y-auto">
              {suggestions.map((s) => (
                <button
                  key={s.symbol}
                  type="button"
                  onClick={() => selectSuggestion(s)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-indigo-500/10 border-b border-zinc-800/40 last:border-0"
                >
                  <span className="text-sm font-bold font-mono text-amber-400 w-14 shrink-0">{s.symbol}</span>
                  <span className="text-[11px] text-zinc-400 truncate flex-1">{s.name}</span>
                  <span className="text-[9px] text-zinc-600 shrink-0">{s.exchange}</span>
                </button>
              ))}
            </div>
          )}
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
        <div className="mt-2 rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</div>
      )}

      {/* Result card */}
      {result && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-zinc-100">${result.symbol}</span>
            <div className="text-right">
              <div className="text-lg font-bold text-zinc-100">${fmt(result.price)}</div>
              <div className={clsx("flex items-center gap-1 text-xs font-medium", positive ? "text-emerald-400" : "text-red-400")}>
                {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {positive ? "+" : ""}{fmt(result.change)} ({positive ? "+" : ""}{fmt(result.changePct)}%)
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-x-4 gap-y-1 border-t border-zinc-800 pt-2 text-xs">
            <div className="flex justify-between"><span className="text-zinc-500">Open</span><span className="text-zinc-300">{fmt(result.open)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">High</span><span className="text-zinc-300">{fmt(result.high)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Low</span><span className="text-zinc-300">{fmt(result.low)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Bid</span><span className="text-zinc-300">{fmt(result.bid)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Ask</span><span className="text-zinc-300">{fmt(result.ask)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Vol</span><span className="text-zinc-300">{fmtVol(result.volume)}</span></div>
            <div className="flex justify-between col-span-2"><span className="text-zinc-500">Prev Close</span><span className="text-zinc-300">{fmt(result.prevClose)}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
