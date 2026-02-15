"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Heart, MessageCircle, Repeat2, BarChart3, RefreshCw, Send, CheckCircle } from "lucide-react";
import clsx from "clsx";

export type PanelTarget = "x" | "email" | null;

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
  author?: { name: string; username: string } | null;
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

function fmtN(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function TweetCard({ tweet, defaultAuthor }: { tweet: Tweet; defaultAuthor?: string }) {
  const m = tweet.public_metrics;
  const author = tweet.author;
  const displayName = author?.name ?? "Stratify";
  const handle = author?.username ?? defaultAuthor ?? "stratify_hq";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <a
      href={`https://x.com/${handle}/status/${tweet.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg border border-zinc-800/50 bg-zinc-900/30 px-3 py-2.5 transition hover:border-zinc-700 hover:bg-zinc-900/60"
    >
      <div className="flex items-start gap-2">
        <div className="h-6 w-6 shrink-0 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center mt-0.5">
          <span className="text-white text-[10px] font-bold">{initial}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs font-semibold text-zinc-200 truncate">{displayName}</span>
            <span className="text-[10px] text-zinc-500 truncate">@{handle}</span>
            <span className="text-[10px] text-zinc-600">· {timeAgo(tweet.created_at)}</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed mt-1 whitespace-pre-wrap break-words">
            {tweet.text}
          </p>
          {m && (
            <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-600">
              <span className="flex items-center gap-0.5">
                <MessageCircle className="h-3 w-3" />
                {m.reply_count > 0 && fmtN(m.reply_count)}
              </span>
              <span className="flex items-center gap-0.5">
                <Repeat2 className="h-3 w-3" />
                {m.retweet_count > 0 && fmtN(m.retweet_count)}
              </span>
              <span className="flex items-center gap-0.5">
                <Heart className="h-3 w-3" />
                {m.like_count > 0 && fmtN(m.like_count)}
              </span>
              {m.impression_count > 0 && (
                <span className="flex items-center gap-0.5">
                  <BarChart3 className="h-3 w-3" />
                  {fmtN(m.impression_count)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </a>
  );
}

/* ── X Feed with tabs ── */
function XFeed() {
  const [tab, setTab] = useState<"mine" | "following">("mine");
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTweets = useCallback(async (feed: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/x-feed?feed=${feed}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load");
        setTweets([]);
      } else {
        setTweets(data.data ?? []);
      }
    } catch {
      setError("Failed to load feed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTweets(tab);
  }, [tab, fetchTweets]);

  return (
    <div className="flex h-full flex-col">
      {/* Tabs */}
      <div className="flex border-b border-zinc-800/50">
        <button
          type="button"
          onClick={() => setTab("mine")}
          className={clsx(
            "flex-1 py-2 text-[11px] font-medium transition border-b-2",
            tab === "mine"
              ? "text-sky-400 border-sky-400"
              : "text-zinc-500 border-transparent hover:text-zinc-300"
          )}
        >
          My Tweets
        </button>
        <button
          type="button"
          onClick={() => setTab("following")}
          className={clsx(
            "flex-1 py-2 text-[11px] font-medium transition border-b-2",
            tab === "following"
              ? "text-sky-400 border-sky-400"
              : "text-zinc-500 border-transparent hover:text-zinc-300"
          )}
        >
          Following
        </button>
      </div>

      {/* Refresh */}
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="text-[10px] text-zinc-600">{tweets.length} tweets</span>
        <button
          type="button"
          onClick={() => fetchTweets(tab)}
          disabled={loading}
          className="flex items-center gap-1 text-[10px] text-zinc-600 transition hover:text-zinc-300"
        >
          <RefreshCw className={clsx("h-2.5 w-2.5", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1.5">
        {loading && tweets.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-4 w-4 animate-spin text-zinc-600" />
          </div>
        )}
        {error && (
          <div className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</div>
        )}
        {tweets.map((tweet) => (
          <TweetCard
            key={tweet.id}
            tweet={tweet}
            defaultAuthor={tab === "mine" ? "stratify_hq" : undefined}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Email Compose ── */
function EmailCompose() {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!to.trim() || !subject.trim() || !body.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: to.trim(), subject: subject.trim(), body: body.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send");
      } else {
        setSent(true);
        setTimeout(() => {
          setSent(false);
          setTo("");
          setSubject("");
          setBody("");
        }, 3000);
      }
    } catch {
      setError("Failed to send");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center px-4">
        <CheckCircle className="h-8 w-8 text-emerald-400" />
        <div className="text-sm font-medium text-zinc-100">Email sent!</div>
        <div className="text-xs text-zinc-500">From jeff@stratify-associates.com</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="overflow-y-auto px-3 py-3 space-y-2.5">
        <div className="text-[10px] text-zinc-500 uppercase tracking-wide">From: jeff@stratify-associates.com</div>
        <div>
          <label className="text-[10px] text-zinc-500 uppercase tracking-wide">To</label>
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="email@example.com"
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-[10px] text-zinc-500 uppercase tracking-wide">Subject</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject line..."
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-[10px] text-zinc-500 uppercase tracking-wide">Message</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message..."
            rows={6}
            className="mt-1 w-full resize-none rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        {error && (
          <div className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</div>
        )}
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || !to.trim() || !subject.trim() || !body.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-indigo-500 disabled:opacity-40"
        >
          <Send className="h-3.5 w-3.5" />
          {sending ? "Sending..." : "Send Email"}
        </button>
      </div>
    </div>
  );
}

/* ── Split Panel ── */
export default function SplitPanel({
  target,
  onClose,
}: {
  target: NonNullable<PanelTarget>;
  onClose: () => void;
}) {
  const isX = target === "x";
  const isEmail = target === "email";

  return (
    <div className="flex h-full w-[280px] shrink-0 flex-col border-l border-zinc-800 bg-zinc-950">
      <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2.5">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800/60 px-2 py-1 text-[11px] text-zinc-400 transition hover:bg-zinc-700 hover:text-zinc-100"
        >
          <ArrowLeft className="h-3 w-3" />
          Back
        </button>
        <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-300">
          {isX ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              @stratify_hq
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-3.5 w-3.5">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              Compose
            </>
          )}
        </div>
        {isX && (
          <a href="https://x.com/stratify_hq" target="_blank" rel="noopener noreferrer"
            className="ml-auto text-[10px] text-zinc-600 transition hover:text-zinc-400">
            ↗
          </a>
        )}
      </div>

      <div className="flex-1 min-h-0">
        {isX ? <XFeed /> : <EmailCompose />}
      </div>
    </div>
  );
}
