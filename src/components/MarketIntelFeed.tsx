"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Clock, ChevronDown, ChevronRight } from "lucide-react";
import clsx from "clsx";

interface CronDoc {
  id: string;
  title: string;
  content: string;
  folder: string;
  created_at: string;
}

const FOLDER_META: Record<string, { emoji: string; label: string; color: string }> = {
  "cron:market-intel": { emoji: "📊", label: "Market Intel", color: "text-amber-400" },
  "cron:x-engagement": { emoji: "🐦", label: "X Engagement", color: "text-sky-400" },
  "cron:daily-summary": { emoji: "📝", label: "Daily Summary", color: "text-violet-400" },
  "cron:trade-log": { emoji: "💰", label: "Trade Log", color: "text-emerald-400" },
  "cron:weekly-recap": { emoji: "📺", label: "Weekly Recap", color: "text-rose-400" },
  "critical-rules": { emoji: "📌", label: "Critical Rules", color: "text-red-400" },
};

function folderMeta(folder: string) {
  return FOLDER_META[folder] ?? { emoji: "⚡", label: folder.replace("cron:", ""), color: "text-zinc-400" };
}

export default function MarketIntelFeed() {
  const [docs, setDocs] = useState<CronDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIdx, setExpandedIdx] = useState<number>(0);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/documents");
      if (!res.ok) return;
      const data = await res.json();
      setDocs(data.documents ?? []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocs();
    const iv = setInterval(fetchDocs, 2 * 60 * 1000);
    return () => clearInterval(iv);
  }, [fetchDocs]);

  const formattedTime = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: "America/New_York",
  });

  const timeAgo = (dateStr: string) => {
    const diff = now.getTime() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const renderContent = (content: string) => {
    return content.split("\n").map((line, i) => {
      if (line.startsWith("# "))
        return <h1 key={i} className="text-base font-bold text-white mt-4 mb-2">{line.slice(2)}</h1>;
      if (line.startsWith("## "))
        return <h2 key={i} className="text-sm font-bold text-white mt-3 mb-1">{line.slice(3)}</h2>;
      if (line.startsWith("### "))
        return <h3 key={i} className="text-xs font-semibold text-zinc-200 mt-2 mb-0.5">{line.slice(4)}</h3>;
      if (line.match(/^---+$/))
        return <hr key={i} className="border-zinc-800 my-2" />;
      if (line.match(/^[\s]*[-*•]/)) {
        const text = line.replace(/^[\s]*[-*•]\s*/, "");
        return (
          <div key={i} className="flex gap-2 py-0.5 text-sm text-zinc-300">
            <span className="text-emerald-400 mt-0.5 shrink-0">•</span>
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
      if (!line.trim()) return <div key={i} className="h-2" />;
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
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 shrink-0">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-semibold text-zinc-100">Cron Jobs</span>
          <span className="text-[10px] text-zinc-500">{docs.length} runs</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-emerald-400">{formattedTime} ET</span>
          <button
            onClick={fetchDocs}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-zinc-800/50 transition text-zinc-500 hover:text-zinc-300"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Jobs list */}
      <div className="flex-1 overflow-y-auto">
        {docs.length === 0 && !loading && (
          <div className="flex items-center justify-center h-32 text-zinc-600 text-sm">
            No cron outputs yet
          </div>
        )}

        {docs.map((doc, idx) => {
          const expanded = expandedIdx === idx;
          const meta = folderMeta(doc.folder);
          return (
            <div key={doc.id} className="border-b border-zinc-800/30">
              <button
                onClick={() => setExpandedIdx(expanded ? -1 : idx)}
                className="flex items-start gap-2 w-full text-left px-4 py-3 hover:bg-zinc-900/50 transition"
              >
                {expanded ? (
                  <ChevronDown className="h-4 w-4 text-zinc-500 mt-0.5 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-zinc-500 mt-0.5 shrink-0" />
                )}
                <span className="text-base mt-px shrink-0">{meta.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={clsx("text-xs font-semibold", meta.color)}>{meta.label}</span>
                    {idx === 0 && (
                      <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Latest</span>
                    )}
                    <span className="text-[10px] text-zinc-600 ml-auto shrink-0">{timeAgo(doc.created_at)}</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1 leading-relaxed">
                    {doc.title}
                  </p>
                </div>
              </button>

              {expanded && (
                <div className="px-4 pb-4">
                  <div className="rounded-lg bg-zinc-900/50 border border-zinc-800/50 p-4 max-h-[60vh] overflow-y-auto">
                    {renderContent(doc.content)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
