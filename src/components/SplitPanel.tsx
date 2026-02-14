"use client";

import { ArrowLeft } from "lucide-react";
import type { PanelTarget } from "./EmailBar";

const PANEL_CONFIG: Record<string, { title: string; icon: React.ReactNode; url: string }> = {
  email: {
    title: "jeff@stratify-associates.com",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    ),
    url: "https://mail.google.com",
  },
  x: {
    title: "@stratify_hq",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    url: "https://x.com/stratify_hq",
  },
};

export default function SplitPanel({
  target,
  onClose,
}: {
  target: NonNullable<PanelTarget>;
  onClose: () => void;
}) {
  const config = PANEL_CONFIG[target];
  if (!config) return null;

  return (
    <div className="flex h-full w-[480px] shrink-0 flex-col border-l border-zinc-800 bg-zinc-950">
      {/* Header with back button */}
      <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/60 px-2.5 py-1.5 text-xs text-zinc-400 transition hover:bg-zinc-700 hover:text-zinc-100"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
        <div className="flex items-center gap-2 text-sm text-zinc-300">
          {config.icon}
          <span className="font-medium">{config.title}</span>
        </div>
        <a
          href={config.url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-[10px] text-zinc-600 transition hover:text-zinc-400"
        >
          Open in new tab ↗
        </a>
      </div>

      {/* Iframe */}
      <div className="flex-1">
        <iframe
          src={config.url}
          title={config.title}
          className="h-full w-full border-0"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>
    </div>
  );
}
