"use client";

import { useCallback, useEffect, useState } from "react";
import { Zap, Heart, Repeat2, X, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";

type TrendingTweet = {
  id: string;
  text: string;
  created_at: string;
  public_metrics?: {
    like_count: number;
    retweet_count: number;
    impression_count: number;
  };
  author?: {
    name: string;
    username: string;
    profile_image_url?: string;
  } | null;
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function fmtN(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

// Highlight $TICKERS and key words
function highlightText(text: string) {
  return text.split(/(\$[A-Z]{1,5}|🚨|BREAKING|breaking)/g).map((part, i) => {
    if (/^\$[A-Z]{1,5}$/.test(part)) return <span key={i} className="text-amber-400 font-bold">{part}</span>;
    if (part === "🚨" || /breaking/i.test(part)) return <span key={i} className="text-red-400 font-bold">{part}</span>;
    return <span key={i}>{part}</span>;
  });
}

export default function BreakingTicker() {
  const [tweets, setTweets] = useState<TrendingTweet[]>([]);
  const [idx, setIdx] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<string>("");

  const fetchTrending = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/x-feed/trending");
      if (res.ok) {
        const data = await res.json();
        if (data.data?.length) {
          setTweets(data.data);
          setIdx(0);
          setLastFetch(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        }
      }
    } catch {}
    setLoading(false);
  }, []);

  // Fetch on mount + every 5 min
  useEffect(() => {
    fetchTrending();
    const id = setInterval(fetchTrending, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchTrending]);

  // Auto-rotate every 8 seconds when not expanded
  useEffect(() => {
    if (expanded || tweets.length === 0) return;
    const id = setInterval(() => {
      setIdx((prev) => (prev + 1) % tweets.length);
    }, 8000);
    return () => clearInterval(id);
  }, [expanded, tweets.length]);

  if (tweets.length === 0 && !loading) return null;

  const tweet = tweets[idx];

  return (
    <div className="relative">
      {/* Compact ticker bar */}
      <div
        className={clsx(
          "flex items-center gap-2 rounded-xl border px-3 py-2 transition-all cursor-pointer group",
          expanded
            ? "border-indigo-500/30 bg-indigo-500/5"
            : "border-zinc-800/60 bg-zinc-900/40 hover:border-zinc-700/60 hover:bg-zinc-900/60"
        )}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Live indicator */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          <Zap className="h-3 w-3 text-amber-400" />
        </div>

        {/* Tweet preview */}
        {loading && tweets.length === 0 ? (
          <span className="text-[11px] text-zinc-500 animate-pulse">Loading trending...</span>
        ) : tweet ? (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-[11px] font-bold text-zinc-400 shrink-0">
              @{tweet.author?.username ?? "unknown"}
            </span>
            <span className="text-[11px] text-zinc-300 truncate flex-1">
              {tweet.text.slice(0, 120)}{tweet.text.length > 120 ? "..." : ""}
            </span>
            {tweet.public_metrics && (
              <span className="flex items-center gap-1.5 shrink-0 text-[10px] text-zinc-600">
                <Heart className="h-2.5 w-2.5" />
                {fmtN(tweet.public_metrics.like_count)}
              </span>
            )}
          </div>
        ) : null}

        {/* Nav arrows */}
        <div className="flex items-center gap-0.5 shrink-0 ml-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setIdx((prev) => (prev - 1 + tweets.length) % tweets.length); }}
            className="p-0.5 rounded hover:bg-zinc-800 transition text-zinc-600 hover:text-zinc-300"
          >
            <ChevronLeft className="h-3 w-3" />
          </button>
          <span className="text-[9px] text-zinc-600 font-mono w-8 text-center">{idx + 1}/{tweets.length}</span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setIdx((prev) => (prev + 1) % tweets.length); }}
            className="p-0.5 rounded hover:bg-zinc-800 transition text-zinc-600 hover:text-zinc-300"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Expanded dropdown — all tweets */}
      {expanded && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-zinc-700/60 bg-zinc-900 shadow-2xl shadow-black/60 overflow-hidden max-h-[400px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800/60 bg-zinc-900/80 sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              <span className="text-[11px] font-bold text-zinc-300">Trending Now</span>
              {lastFetch && <span className="text-[9px] text-zinc-600">updated {lastFetch}</span>}
            </div>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="p-1 rounded-lg hover:bg-zinc-800 transition text-zinc-600 hover:text-zinc-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Tweet list */}
          {tweets.map((t, i) => {
            const m = t.public_metrics;
            return (
              <a
                key={t.id}
                href={`https://x.com/${t.author?.username ?? "i"}/status/${t.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className={clsx(
                  "block px-4 py-3 border-b border-zinc-800/40 transition hover:bg-indigo-500/5",
                  i === idx && "bg-zinc-800/30"
                )}
              >
                <div className="flex items-start gap-2.5">
                  {/* Avatar */}
                  {t.author?.profile_image_url ? (
                    <img
                      src={t.author.profile_image_url}
                      alt=""
                      className="h-8 w-8 rounded-full shrink-0 mt-0.5"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-white text-[10px] font-bold">
                        {(t.author?.name ?? "?").charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[12px] font-semibold text-zinc-200 truncate">{t.author?.name ?? "Unknown"}</span>
                      <span className="text-[10px] text-zinc-500">@{t.author?.username ?? "unknown"}</span>
                      <span className="text-[10px] text-zinc-600">· {timeAgo(t.created_at)}</span>
                      <ExternalLink className="h-2.5 w-2.5 text-zinc-700 ml-auto shrink-0" />
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      {highlightText(t.text)}
                    </p>
                    {m && (
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-zinc-600">
                        <span className="flex items-center gap-0.5">
                          <Heart className="h-3 w-3" /> {fmtN(m.like_count)}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Repeat2 className="h-3 w-3" /> {fmtN(m.retweet_count)}
                        </span>
                        {m.impression_count > 0 && (
                          <span className="text-zinc-700">{fmtN(m.impression_count)} views</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
