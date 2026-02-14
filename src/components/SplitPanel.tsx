"use client";

import { useEffect, useRef } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";

export type PanelTarget = "email" | "x" | null;

/* ── X/Twitter embedded timeline ── */
function XTimeline() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Inject the Twitter widget script
    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    script.charset = "utf-8";
    containerRef.current.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return (
    <div ref={containerRef} className="h-full overflow-y-auto px-4 py-4">
      <a
        className="twitter-timeline"
        data-theme="dark"
        data-chrome="noheader nofooter noborders transparent"
        data-height="100%"
        href="https://twitter.com/stratify_hq"
      >
        Loading @stratify_hq...
      </a>
    </div>
  );
}

/* ── Email panel (webmail via proxy) ── */
function EmailPanel() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="rounded-full bg-zinc-800 p-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="h-8 w-8 text-emerald-400"
        >
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-zinc-100">jeff@stratify-associates.com</h3>
        <p className="mt-1 text-sm text-zinc-500">Gmail blocks embedding — open in a new window to check your inbox</p>
      </div>
      <div className="flex gap-3">
        <a
          href="https://mail.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          <ExternalLink className="h-4 w-4" />
          Open Gmail
        </a>
        <a
          href="mailto:jeff@stratify-associates.com"
          className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/60 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-700"
        >
          Compose
        </a>
      </div>
    </div>
  );
}

export default function SplitPanel({
  target,
  onClose,
}: {
  target: NonNullable<PanelTarget>;
  onClose: () => void;
}) {
  const isX = target === "x";

  return (
    <div className="flex h-full w-[480px] shrink-0 flex-col border-l border-zinc-800 bg-zinc-950">
      {/* Header */}
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
        <a
          href={isX ? "https://x.com/stratify_hq" : "https://mail.google.com"}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1 text-[10px] text-zinc-600 transition hover:text-zinc-400"
        >
          Open full <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {isX ? <XTimeline /> : <EmailPanel />}
      </div>
    </div>
  );
}
