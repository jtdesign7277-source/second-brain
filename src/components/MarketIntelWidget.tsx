"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, X, Clock } from "lucide-react";
import clsx from "clsx";

type IntelDoc = {
  id: string;
  title: string;
  content: string;
  folder: string;
  created_at: string;
};

function useLiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function MarketIntelWidget() {
  const [latest, setLatest] = useState<IntelDoc | null>(null);
  const [open, setOpen] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const now = useLiveClock();

  const fetchLatest = useCallback(async () => {
    try {
      const res = await fetch("/api/documents");
      if (!res.ok) return;
      const data = await res.json();
      const intelDocs = (data.documents ?? []).filter(
        (d: IntelDoc) => d.folder === "cron:market-intel"
      );
      if (intelDocs.length === 0) return;

      // Sort by created_at desc
      intelDocs.sort(
        (a: IntelDoc, b: IntelDoc) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      const newest = intelDocs[0];
      if (!latest || newest.id !== latest.id) {
        setLatest(newest);
        setHasNew(true);
      }
    } catch {
      // silent fail
    }
  }, [latest]);

  // Fetch on mount + every 30 minutes
  useEffect(() => {
    fetchLatest();
    const id = setInterval(fetchLatest, 30 * 60 * 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formattedTime = useMemo(() => {
    return now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZone: "America/New_York",
    });
  }, [now]);

  const formattedDate = useMemo(() => {
    return now.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "America/New_York",
    });
  }, [now]);

  const intelAge = useMemo(() => {
    if (!latest) return "";
    const diff = now.getTime() - new Date(latest.created_at).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m ago`;
  }, [latest, now]);

  // Render simple markdown to HTML
  const renderContent = (content: string) => {
    return content
      .split("\n")
      .map((line, i) => {
        // Headers
        if (line.startsWith("# "))
          return (
            <h1 key={i} className="text-xl font-bold text-white mt-4 mb-2">
              {line.slice(2)}
            </h1>
          );
        if (line.startsWith("## "))
          return (
            <h2 key={i} className="text-lg font-bold text-white mt-4 mb-1">
              {line.slice(3)}
            </h2>
          );
        if (line.startsWith("### "))
          return (
            <h3 key={i} className="text-base font-semibold text-zinc-200 mt-3 mb-1">
              {line.slice(4)}
            </h3>
          );
        // Horizontal rule
        if (line.match(/^---+$/))
          return <hr key={i} className="border-zinc-700 my-3" />;
        // Bullet
        if (line.match(/^[\s]*[-*•]/)) {
          const text = line.replace(/^[\s]*[-*•]\s*/, "");
          return (
            <div key={i} className="flex gap-2 py-0.5 text-sm text-zinc-300">
              <span className="text-emerald-400 mt-0.5">•</span>
              <span
                dangerouslySetInnerHTML={{
                  __html: text
                    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
                    .replace(/\$([A-Z]{1,5})/g, '<span class="text-amber-400 font-mono">$$1</span>'),
                }}
              />
            </div>
          );
        }
        // Table row — skip
        if (line.startsWith("|")) return null;
        // Empty line
        if (!line.trim()) return <div key={i} className="h-2" />;
        // Regular text
        return (
          <p
            key={i}
            className="text-sm text-zinc-300 py-0.5"
            dangerouslySetInnerHTML={{
              __html: line
                .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
                .replace(/\$([A-Z]{1,5})/g, '<span class="text-amber-400 font-mono">$$1</span>'),
            }}
          />
        );
      });
  };

  return (
    <>
      {/* Floating pill — bottom left */}
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setHasNew(false);
        }}
        className={clsx(
          "fixed bottom-6 left-6 z-50 flex items-center gap-2 rounded-full border px-4 py-2.5 shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-emerald-500/20",
          hasNew
            ? "border-emerald-500/50 bg-emerald-500/10 shadow-emerald-500/10"
            : "border-zinc-700 bg-zinc-900/80 shadow-zinc-900/50"
        )}
      >
        {/* Pulse ring when new data */}
        {hasNew && (
          <>
            <span className="absolute inset-0 rounded-full border border-emerald-400/40 animate-ping" />
            <span className="absolute inset-0 rounded-full border border-emerald-400/20 animate-pulse" />
          </>
        )}

        <Activity
          className={clsx(
            "h-4 w-4 transition-colors",
            hasNew ? "text-emerald-400" : "text-zinc-400"
          )}
        />
        <span className="text-xs font-semibold text-zinc-200">
          Market Intel
        </span>
        {latest && (
          <span className="text-[10px] text-zinc-500">{intelAge}</span>
        )}

        {/* Green dot indicator */}
        {hasNew && (
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50">
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
          </span>
        )}
      </button>

      {/* Full modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative mx-4 flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl border border-zinc-700/50 bg-zinc-900/95 shadow-2xl shadow-black/50 backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Activity className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    Market Intelligence
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Clock className="h-3 w-3" />
                    <span>{formattedDate}</span>
                    <span className="text-emerald-400 font-mono">
                      {formattedTime} ET
                    </span>
                    {latest && (
                      <span className="text-zinc-600">
                        · Updated {intelAge}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {latest ? (
                <div className="space-y-0">
                  {/* Live timestamp bar */}
                  <div className="mb-4 flex items-center gap-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50 px-3 py-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-medium text-zinc-300">
                      Latest scan: {latest.title}
                    </span>
                  </div>
                  {renderContent(latest.content)}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                  <Activity className="h-10 w-10 mb-3 opacity-30" />
                  <p className="text-sm">
                    No market intel yet — waiting for next scan
                  </p>
                  <p className="text-xs text-zinc-600 mt-1">
                    Scans run every 2 hours
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-zinc-800 px-6 py-3 flex items-center justify-between">
              <span className="text-[10px] text-zinc-600">
                Sources: Yahoo Finance · Reuters · CoinDesk · Reddit · Hacker News · ESPN · X
              </span>
              <span className="text-[10px] text-zinc-600 font-mono">
                {formattedTime} ET
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
