"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Heart, MessageCircle, Repeat2, BarChart3, RefreshCw } from "lucide-react";
import clsx from "clsx";

export type PanelTarget = "email" | "x" | null;

type Tweet = {
  id: string;
  text: string;
  created_at: string;
  public_metrics?: {
    reply_count: number;
    retweet_count: number;
    like_count: number;
    impression_count: number;
  };
  referenced_tweets?: { type: string; id: string }[];
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function formatNum(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
}

function TweetCard({ tweet }: { tweet: Tweet }) {
  const m = tweet.public_metrics;
  const isReply = tweet.referenced_tweets?.some((r) => r.type === "replied_to");
  const isRetweet = tweet.referenced_tweets?.some((r) => r.type === "retweeted");
  const isQuote = tweet.referenced_tweets?.some((r) => r.type === "quoted");

  return (
    <a
      href={`https://x.com/stratify_hq/status/${tweet.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl border border-zinc-800/60 bg-zinc-900/40 px-4 py-3 transition hover:border-zinc-700 hover:bg-zinc-900/70"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">S</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-zinc-100">Stratify</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 text-sky-400">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            <span className="text-xs text-zinc-500">@stratify_hq</span>
            <span className="text-xs text-zinc-600">· {timeAgo(tweet.created_at)}</span>
          </div>
          {(isReply || isRetweet || isQuote) && (
            <div className="text-[10px] text-zinc-500 mt-0.5">
              {isReply && "↩ Reply"}
              {isRetweet && "🔁 Repost"}
              {isQuote && "💬 Quote"}
            </div>
          )}
        </div>
      </div>

      {/* Text */}
      <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap break-words">
        {tweet.text}
      </p>

      {/* Metrics */}
      {m && (
        <div className="flex items-center gap-5 mt-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1 hover:text-sky-400 transition">
            <MessageCircle className="h-3.5 w-3.5" />
            {m.reply_count > 0 && formatNum(m.reply_count)}
          </span>
          <span className="flex items-center gap-1 hover:text-emerald-400 transition">
            <Repeat2 className="h-3.5 w-3.5" />
            {m.retweet_count > 0 && formatNum(m.retweet_count)}
          </span>
          <span className="flex items-center gap-1 hover:text-pink-400 transition">
            <Heart className="h-3.5 w-3.5" />
            {m.like_count > 0 && formatNum(m.like_count)}
          </span>
          <span className="flex items-center gap-1">
            <BarChart3 className="h-3.5 w-3.5" />
            {m.impression_count > 0 && formatNum(m.impression_count)}
          </span>
        </div>
      )}
    </a>
  );
}

/* ── X Feed Panel ── */
function XFeed() {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTweets = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/x-feed");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load");
      } else {
        setTweets(data.data ?? []);
      }
    } catch {
      setError("Failed to load feed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTweets();
  }, []);

  return (
    <div className="flex h-full flex-col">
      {/* Refresh bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800/50">
        <span className="text-xs text-zinc-500">{tweets.length} tweets</span>
        <button
          type="button"
          onClick={fetchTweets}
          disabled={loading}
          className="flex items-center gap-1 text-xs text-zinc-500 transition hover:text-zinc-300"
        >
          <RefreshCw className={clsx("h-3 w-3", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {loading && tweets.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-5 w-5 animate-spin text-zinc-600" />
          </div>
        )}
        {error && (
          <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
        )}
        {tweets.map((tweet) => (
          <TweetCard key={tweet.id} tweet={tweet} />
        ))}
      </div>
    </div>
  );
}

/* ── Email Panel ── */
function EmailPanel() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="rounded-full bg-zinc-800 p-4">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-8 w-8 text-emerald-400">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-zinc-100">jeff@stratify-associates.com</h3>
        <p className="mt-1 text-sm text-zinc-500">Gmail blocks embedding — open in a new window</p>
      </div>
      <div className="flex gap-3">
        <a href="https://mail.google.com" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500">
          <ExternalLink className="h-4 w-4" />
          Open Gmail
        </a>
        <a href="mailto:jeff@stratify-associates.com"
          className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/60 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-700">
          Compose
        </a>
      </div>
    </div>
  );
}

/* ── Split Panel Container ── */
export default function SplitPanel({
  target,
  onClose,
}: {
  target: NonNullable<PanelTarget>;
  onClose: () => void;
}) {
  const isX = target === "x";

  return (
    <div className="flex h-full w-[320px] shrink-0 flex-col border-l border-zinc-800 bg-zinc-950">
      <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/60 px-2.5 py-1.5 text-xs text-zinc-400 transition hover:bg-zinc-700 hover:text-zinc-100"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
          {isX ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              @stratify_hq
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              Email
            </>
          )}
        </div>
        {isX && (
          <a href="https://x.com/stratify_hq" target="_blank" rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 text-[10px] text-zinc-600 transition hover:text-zinc-400">
            Open X <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      <div className="flex-1 min-h-0">
        {isX ? <XFeed /> : <EmailPanel />}
      </div>
    </div>
  );
}
