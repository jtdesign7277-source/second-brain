"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { RefreshCw, TrendingUp, ChevronDown, ChevronRight } from "lucide-react";

interface Report {
  date: string;
  content: string;
}

export default function MarketIntelFeed() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIdx, setExpandedIdx] = useState<number>(0); // newest expanded by default

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/market-intel");
      const data = await res.json();
      setReports(data.reports || []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // Refresh every 5 min to catch new cron runs
    const iv = setInterval(fetchReports, 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, []);

  const formatDate = (d: string) => {
    const parts = d.split("-");
    if (parts.length === 3) {
      return `${parseInt(parts[1])}/${parseInt(parts[2])}/${parts[0].slice(2)}`;
    }
    return d;
  };

  // Extract the "Top Headlines" line from content as a summary
  const extractHeadline = (content: string): string => {
    const match = content.match(/\*\*Top Headlines?:\s*(.+?)\*\*/);
    if (match) return match[1].trim();
    // Fallback: first non-empty, non-heading line
    const lines = content.split("\n").filter((l) => l.trim() && !l.startsWith("#"));
    return lines[0]?.slice(0, 120) || "Market Intel Report";
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 shrink-0">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-amber-400" />
          <span className="text-sm font-semibold text-zinc-100">Market Intel Feed</span>
          <span className="text-[10px] text-zinc-500">{reports.length} reports</span>
        </div>
        <button
          onClick={fetchReports}
          disabled={loading}
          className="p-1.5 rounded-lg hover:bg-zinc-800/50 transition text-zinc-500 hover:text-zinc-300"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Reports */}
      <div className="flex-1 overflow-y-auto">
        {reports.length === 0 && !loading && (
          <div className="flex items-center justify-center h-32 text-zinc-600 text-sm">
            No intel reports yet
          </div>
        )}

        {reports.map((report, idx) => {
          const expanded = expandedIdx === idx;
          return (
            <div key={report.date} className="border-b border-zinc-800/30">
              {/* Collapsed header */}
              <button
                onClick={() => setExpandedIdx(expanded ? -1 : idx)}
                className="flex items-start gap-2 w-full text-left px-4 py-3 hover:bg-zinc-900/50 transition"
              >
                {expanded ? (
                  <ChevronDown className="h-4 w-4 text-zinc-500 mt-0.5 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-zinc-500 mt-0.5 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-amber-400/80">{formatDate(report.date)}</span>
                    {idx === 0 && (
                      <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Latest</span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed">
                    {extractHeadline(report.content)}
                  </p>
                </div>
              </button>

              {/* Expanded content */}
              {expanded && (
                <div className="px-5 pb-4 prose prose-invert prose-sm max-w-none
                  prose-headings:text-zinc-200 prose-headings:text-sm prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2
                  prose-p:text-zinc-400 prose-p:text-xs prose-p:leading-relaxed
                  prose-li:text-zinc-400 prose-li:text-xs prose-li:leading-relaxed
                  prose-strong:text-zinc-200
                  prose-hr:border-zinc-800/50
                ">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {report.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
