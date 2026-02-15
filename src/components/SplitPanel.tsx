"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Heart, MessageCircle, Repeat2, BarChart3, RefreshCw, Send, CheckCircle, Maximize2, X } from "lucide-react";
import clsx from "clsx";

export type PanelTarget = "x" | "email" | "market-intel" | null;

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

/* ── X Feed Expanded (split view) ── */
function XFeedColumn({ feed, label }: { feed: "mine" | "following"; label: string }) {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTweets = useCallback(async () => {
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
  }, [feed]);

  useEffect(() => {
    fetchTweets();
  }, [fetchTweets]);

  return (
    <div className="flex flex-1 flex-col min-w-0">
      <div className="flex items-center justify-between border-b border-zinc-800/50 px-4 py-2">
        <span className="text-sm font-semibold text-zinc-200">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-600">{tweets.length} tweets</span>
          <button
            type="button"
            onClick={fetchTweets}
            disabled={loading}
            className="flex items-center gap-1 text-xs text-zinc-600 transition hover:text-zinc-300"
          >
            <RefreshCw className={clsx("h-3 w-3", loading && "animate-spin")} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
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
            defaultAuthor={feed === "mine" ? "stratify_hq" : undefined}
          />
        ))}
      </div>
    </div>
  );
}

function XFeedExpanded() {
  return (
    <div className="flex h-full divide-x divide-zinc-800">
      <XFeedColumn feed="mine" label="My Tweets" />
      <XFeedColumn feed="following" label="Following" />
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

/* ── Market Intel Feed ── */
function MarketIntelFeed() {
  const [content, setContent] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const fetchIntel = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/documents");
      if (!res.ok) return;
      const data = await res.json();
      const intelDocs = (data.documents ?? [])
        .filter((d: { folder: string }) => d.folder === "cron:market-intel")
        .sort(
          (a: { created_at: string }, b: { created_at: string }) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      if (intelDocs.length > 0) {
        setContent(intelDocs[0].content);
        setTitle(intelDocs[0].title);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntel();
    const id = setInterval(fetchIntel, 30 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchIntel]);

  const formattedTime = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: "America/New_York",
  });

  const renderLine = (line: string, i: number) => {
    if (line.startsWith("# "))
      return <h1 key={i} className="text-sm font-bold text-white mt-3 mb-1">{line.slice(2)}</h1>;
    if (line.startsWith("## "))
      return <h2 key={i} className="text-xs font-bold text-white mt-3 mb-0.5">{line.slice(3)}</h2>;
    if (line.startsWith("### "))
      return <h3 key={i} className="text-xs font-semibold text-zinc-300 mt-2 mb-0.5">{line.slice(4)}</h3>;
    if (line.match(/^---+$/))
      return <hr key={i} className="border-zinc-800 my-2" />;
    if (line.match(/^[\s]*[-*•]/)) {
      const text = line.replace(/^[\s]*[-*•]\s*/, "");
      return (
        <div key={i} className="flex gap-1.5 py-0.5 text-[11px] text-zinc-300 leading-relaxed">
          <span className="text-emerald-400 mt-px shrink-0">•</span>
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
    if (line.startsWith("|")) return null;
    if (!line.trim()) return <div key={i} className="h-1.5" />;
    return (
      <p
        key={i}
        className="text-[11px] text-zinc-300 py-0.5 leading-relaxed"
        dangerouslySetInnerHTML={{
          __html: line
            .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
            .replace(/\$([A-Z]{1,5})/g, '<span class="text-amber-400 font-mono">$$1</span>'),
        }}
      />
    );
  };

  return (
    <div className="flex h-full flex-col">
      {/* Live clock bar */}
      <div className="flex items-center gap-2 border-b border-zinc-800/50 px-3 py-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        <span className="text-[10px] font-mono text-emerald-400">{formattedTime} ET</span>
        <button
          type="button"
          onClick={fetchIntel}
          disabled={loading}
          className="ml-auto flex items-center gap-1 text-[10px] text-zinc-600 transition hover:text-zinc-300"
        >
          <RefreshCw className={clsx("h-2.5 w-2.5", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {loading && !content ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-4 w-4 animate-spin text-zinc-600" />
          </div>
        ) : content ? (
          <div>{content.split("\n").map(renderLine)}</div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
            <p className="text-xs">No intel yet — waiting for next scan</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-800/50 px-3 py-1.5">
        <span className="text-[9px] text-zinc-600">
          Sources: Yahoo · Reuters · CoinDesk · Reddit · HN · ESPN
        </span>
      </div>
    </div>
  );
}

/* ── Split Panel ── */
/* ── Panel labels ── */
function panelLabel(target: NonNullable<PanelTarget>) {
  if (target === "x") return "@stratify_hq";
  if (target === "market-intel") return "Market Intel";
  return "Compose";
}

function PanelIcon({ target, className }: { target: NonNullable<PanelTarget>; className?: string }) {
  if (target === "x")
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className || "h-3 w-3"}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  if (target === "market-intel")
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className || "h-3.5 w-3.5"}>
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    );
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className || "h-3.5 w-3.5"}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function PanelContent({ target, expanded }: { target: NonNullable<PanelTarget>; expanded?: boolean }) {
  if (target === "x") return expanded ? <XFeedExpanded /> : <XFeed />;
  if (target === "market-intel") return <MarketIntelFeed />;
  return <EmailCompose />;
}

/* ── Split Panel ── */
export default function SplitPanel({
  target,
  onClose,
}: {
  target: NonNullable<PanelTarget>;
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isX = target === "x";

  return (
    <>
      {/* Side panel */}
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
            <PanelIcon target={target} />
            {panelLabel(target)}
          </div>

          {/* Expand to modal button */}
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="ml-auto group relative flex items-center justify-center rounded-md p-1.5 text-zinc-600 transition hover:bg-zinc-800 hover:text-zinc-300"
            title="Expand to full view"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            {/* Subtle pulse dot */}
            <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400/60 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          {isX && (
            <a href="https://x.com/stratify_hq" target="_blank" rel="noopener noreferrer"
              className="text-[10px] text-zinc-600 transition hover:text-zinc-400">
              ↗
            </a>
          )}
        </div>

        <div className="flex-1 min-h-0">
          <PanelContent target={target} />
        </div>
      </div>

      {/* Expanded modal overlay */}
      {expanded && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setExpanded(false)}
        >
          <div
            className="relative mx-4 flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl border border-zinc-700/50 bg-zinc-900/95 shadow-2xl shadow-black/50 backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <PanelIcon target={target} className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">{panelLabel(target)}</h2>
                  <p className="text-xs text-zinc-500">Expanded view</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal content — doubled text size for readability */}
            <div className="flex-1 overflow-y-auto modal-expanded" style={{ height: "70vh", fontSize: target === "x" ? undefined : "200%" }}>
              <div className={target === "x" ? "h-full" : "px-6 py-4"}>
                <PanelContent target={target} expanded />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
