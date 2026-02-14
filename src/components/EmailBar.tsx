"use client";

export type PanelTarget = "email" | "x" | null;

export default function EmailBar({
  onOpenPanel,
}: {
  onOpenPanel?: (target: PanelTarget) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-3 py-2">
      {/* Email pill */}
      <button
        type="button"
        onClick={() => onOpenPanel?.("email")}
        className="group flex items-center gap-2.5 rounded-full border border-zinc-700/60 bg-zinc-900/60 px-5 py-2.5 text-sm text-zinc-300 transition hover:border-emerald-500/50 hover:text-emerald-400"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="h-4 w-4 text-zinc-500 transition group-hover:text-emerald-400"
        >
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
        jeff@stratify-associates.com
      </button>

      {/* X handle pill */}
      <button
        type="button"
        onClick={() => onOpenPanel?.("x")}
        className="group flex items-center gap-2.5 rounded-full border border-zinc-700/60 bg-zinc-900/60 px-5 py-2.5 text-sm text-zinc-300 transition hover:border-emerald-500/50 hover:text-emerald-400"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-3.5 w-3.5 text-zinc-500 transition group-hover:text-emerald-400"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        @stratify_hq
      </button>
    </div>
  );
}
