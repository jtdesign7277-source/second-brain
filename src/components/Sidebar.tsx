"use client";

import { ChevronRight, Clock, FolderOpen, Plus, Search, Trash2, Target, Video } from "lucide-react";
import clsx from "clsx";
import { useMemo, useState } from "react";
import type { DocumentItem } from "@/types/documents";
import { CRON_FOLDERS, getCronFolder, STRATEGIES_FOLDER, X_POSTS_PREFIX } from "@/lib/cronFolders";
import StockSearch from "./StockSearch";

export type SidebarProps = {
  documents: DocumentItem[];
  selectedId: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (doc: DocumentItem) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
};

type FolderGroup = {
  folder: string;
  label: string;
  docs: DocumentItem[];
  isCron: boolean;
};

function groupByFolder(docs: DocumentItem[]): { cronGroups: FolderGroup[]; strategiesGroup: FolderGroup; xPostsGroups: FolderGroup[]; regularGroups: FolderGroup[] } {
  const map = new Map<string, DocumentItem[]>();
  const ungrouped: DocumentItem[] = [];

  for (const doc of docs) {
    const folder = doc.folder?.trim();
    if (folder) {
      if (!map.has(folder)) map.set(folder, []);
      map.get(folder)!.push(doc);
    } else {
      ungrouped.push(doc);
    }
  }

  // Cron folders always show, even if empty
  const cronGroups: FolderGroup[] = CRON_FOLDERS.map((cf) => ({
    folder: cf.folder,
    label: `${cf.emoji} ${cf.label}`,
    docs: map.get(cf.folder) ?? [],
    isCron: true,
  }));
  // Remove cron keys from the map so they don't duplicate
  for (const cf of CRON_FOLDERS) map.delete(cf.folder);

  // Strategies folder
  const strategiesGroup: FolderGroup = {
    folder: STRATEGIES_FOLDER,
    label: "🎯 Strategies",
    docs: map.get(STRATEGIES_FOLDER) ?? [],
    isCron: false,
  };
  map.delete(STRATEGIES_FOLDER);

  // X-Posts folders
  const xPostsGroups: FolderGroup[] = [];
  for (const key of [...map.keys()]) {
    if (key.startsWith(X_POSTS_PREFIX)) {
      xPostsGroups.push({
        folder: key,
        label: key,
        docs: map.get(key)!,
        isCron: false,
      });
      map.delete(key);
    }
  }
  xPostsGroups.sort((a, b) => a.folder.localeCompare(b.folder));

  // Regular dated folders sorted reverse chronologically
  const regularGroups: FolderGroup[] = [];
  const sortedKeys = [...map.keys()].sort((a, b) => b.localeCompare(a));
  for (const key of sortedKeys) {
    // Shorten date-prefixed folder names: "2026-02-14 — Foo" → "2/14/26 — Foo"
    let label = key;
    const dateMatch = key.match(/^(\d{4})-(\d{2})-(\d{2})(.*)/);
    if (dateMatch) {
      const [, y, m, d, rest] = dateMatch;
      label = `${parseInt(m)}/${parseInt(d)}/${y.slice(2)}${rest}`;
    }
    regularGroups.push({
      folder: key,
      label,
      docs: map.get(key)!,
      isCron: false,
    });
  }

  if (ungrouped.length > 0) {
    regularGroups.push({
      folder: "__ungrouped__",
      label: "Unfiled",
      docs: ungrouped,
      isCron: false,
    });
  }

  return { cronGroups, strategiesGroup, xPostsGroups, regularGroups };
}

const MONTHS: Record<string, string> = { Jan:"1",Feb:"2",Mar:"3",Apr:"4",May:"5",Jun:"6",Jul:"7",Aug:"8",Sep:"9",Oct:"10",Nov:"11",Dec:"12" };

/** Normalize any date in a title to M/D/YY format */
function shortDate(title: string): string {
  return title
    // "2026-02-15"
    .replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (_,y,m,d) => `${parseInt(m)}/${parseInt(d)}/${y.slice(2)}`)
    // "Feb 15, 2026" or "Feb 15 2026"
    .replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(\d{4})\b/g,
      (_,mon,d,y) => `${MONTHS[mon]}/${parseInt(d)}/${y.slice(2)}`)
    // "Sun Feb 15 2026"
    .replace(/\b(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})\s+(\d{4})\b/g,
      (_,mon,d,y) => `${MONTHS[mon]}/${parseInt(d)}/${y.slice(2)}`)
    // "Sun Feb 15" (no year, truncated)
    .replace(/\b(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})\b/g,
      (_,mon,d) => `${MONTHS[mon]}/${parseInt(d)}`);
}

export default function Sidebar({
  documents,
  selectedId,
  search,
  onSearchChange,
  onSelect,
  onCreate,
  onDelete,
}: SidebarProps) {
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [openSections, setOpenSections] = useState<Set<string>>(new Set<string>());

  const toggleSection = (section: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };
  const { cronGroups, strategiesGroup, xPostsGroups, regularGroups } = useMemo(() => groupByFolder(documents), [documents]);
  const allGroups = useMemo(() => [strategiesGroup, ...cronGroups, ...xPostsGroups, ...regularGroups], [strategiesGroup, cronGroups, xPostsGroups, regularGroups]);

  // Auto-open folder containing selected doc
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => {
    if (!selectedId) return;
    for (const g of allGroups) {
      if (g.docs.some((d) => d.id === selectedId)) {
        setOpenFolders((prev) => {
          if (prev.has(g.folder)) return prev;
          const next = new Set(prev);
          next.add(g.folder);
          return next;
        });
      }
    }
  }, [selectedId, allGroups]);

  const toggleFolder = (folder: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folder)) next.delete(folder);
      else next.add(folder);
      return next;
    });
  };

  return (
    <aside className="flex h-full w-72 flex-col border-r border-zinc-800 bg-zinc-900/50">
      <div className="px-6 pt-6">
        <div className="text-lg font-semibold text-zinc-100">Second Brain</div>
        <div className="text-xs uppercase tracking-wide text-zinc-500">
          Knowledge base &amp; journal
        </div>
      </div>

      <div className="px-4 pt-5">
        <StockSearch />
      </div>

      <div className="px-6 pt-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search documents..."
              className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 py-2 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-700 bg-zinc-800/60 text-zinc-200 transition hover:bg-zinc-700"
            title="New document"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <nav className="mt-4 flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {/* Strategies Section */}
        <button
          type="button"
          onClick={() => toggleSection("strategies")}
          className="mb-2 mt-3 pb-1 border-b border-fuchsia-500/20 flex w-full items-center gap-2 px-2 cursor-pointer hover:opacity-80 transition"
        >
          <ChevronRight className={clsx("h-5 w-5 text-fuchsia-400 transition-transform", openSections.has("strategies") && "rotate-90")} />
          <Target className="h-5 w-5 text-fuchsia-400" />
          <span className="text-sm font-extrabold uppercase tracking-widest text-white">
            Strategies
          </span>
          <div className="ml-auto h-px flex-1 bg-fuchsia-500/30" />
        </button>

        {openSections.has("strategies") && (() => {
          const isOpen = openFolders.has(strategiesGroup.folder);
          return (
            <div>
              <button
                type="button"
                onClick={() => toggleFolder(strategiesGroup.folder)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-xs font-semibold text-fuchsia-400 transition hover:bg-zinc-800/60"
              >
                <ChevronRight className={clsx("h-3.5 w-3.5 transition-transform", isOpen && "rotate-90")} />
                <span className="truncate">{strategiesGroup.label}</span>
                <span className="ml-auto rounded-full bg-fuchsia-500/20 px-1.5 py-0.5 text-[10px] font-bold text-fuchsia-400">
                  {strategiesGroup.docs.length}
                </span>
              </button>
              {isOpen && (
                <div className="ml-3 space-y-0.5 border-l border-fuchsia-500/20 pl-2">
                  {strategiesGroup.docs.length === 0 ? (
                    <div className="px-3 py-2 text-xs italic text-zinc-600">
                      Save a strategy from Fred&apos;s chat
                    </div>
                  ) : (
                    strategiesGroup.docs.map((doc) => (
                      <div
                        key={doc.id}
                        className={clsx(
                          "group flex items-center justify-between rounded-md px-3 py-1.5 text-sm transition",
                          selectedId === doc.id
                            ? "bg-zinc-800/80 text-zinc-100"
                            : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-100"
                        )}
                      >
                        <button type="button" onClick={() => onSelect(doc)} className="flex-1 truncate text-left">
                          {shortDate(doc.title) || "Untitled"}
                        </button>
                        <button type="button" onClick={() => onDelete(doc.id)} className="ml-2 hidden rounded p-1 text-zinc-500 transition hover:text-zinc-200 group-hover:block" title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* Cron Jobs Section Header */}
        <button
          type="button"
          onClick={() => toggleSection("cron")}
          className="mb-2 mt-5 pb-1 border-b border-violet-500/20 flex w-full items-center gap-2 px-2 cursor-pointer hover:opacity-80 transition"
        >
          <ChevronRight className={clsx("h-5 w-5 text-violet-400 transition-transform", openSections.has("cron") && "rotate-90")} />
          <Clock className="h-5 w-5 text-violet-400" />
          <span className="text-sm font-extrabold uppercase tracking-widest text-white">
            Active Cron Jobs
          </span>
          <div className="ml-auto h-px flex-1 bg-violet-500/30" />
        </button>

        {openSections.has("cron") && cronGroups.map((group) => {
          const isOpen = openFolders.has(group.folder);
          const cronDef = getCronFolder(group.folder);
          return (
            <div key={group.folder}>
              <button
                type="button"
                onClick={() => toggleFolder(group.folder)}
                className={clsx(
                  "flex w-full items-center gap-2 rounded-md px-2 py-2 text-xs font-semibold transition",
                  cronDef?.accent ?? "text-zinc-400",
                  "hover:bg-zinc-800/60"
                )}
              >
                <ChevronRight
                  className={clsx(
                    "h-3.5 w-3.5 transition-transform",
                    isOpen && "rotate-90"
                  )}
                />
                <span className="truncate">{group.label}</span>
                <span
                  className={clsx(
                    "ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    cronDef?.bgAccent ?? "bg-zinc-800",
                    cronDef?.accent ?? "text-zinc-500"
                  )}
                >
                  {group.docs.length}
                </span>
              </button>

              {isOpen && (
                <div className="ml-3 space-y-0.5 border-l border-zinc-700/50 pl-2">
                  {group.docs.length === 0 ? (
                    <div className="px-3 py-2 text-xs italic text-zinc-600">
                      No outputs yet — waiting for next run
                    </div>
                  ) : (
                    group.docs.map((doc) => (
                      <div
                        key={doc.id}
                        className={clsx(
                          "group flex items-center justify-between rounded-md px-3 py-1.5 text-sm transition",
                          selectedId === doc.id
                            ? "bg-zinc-800/80 text-zinc-100"
                            : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-100"
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => onSelect(doc)}
                          className="flex-1 truncate text-left"
                        >
                          {shortDate(doc.title) || "Untitled"}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(doc.id)}
                          className="ml-2 hidden rounded p-1 text-zinc-500 transition hover:text-zinc-200 group-hover:block"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* X-Posts Section Header */}
        <button
          type="button"
          onClick={() => toggleSection("xposts")}
          className="mb-2 mt-5 pb-1 border-b border-sky-500/20 flex w-full items-center gap-2 px-2 cursor-pointer hover:opacity-80 transition"
        >
          <ChevronRight className={clsx("h-5 w-5 text-sky-400 transition-transform", openSections.has("xposts") && "rotate-90")} />
          <Video className="h-5 w-5 text-sky-400" />
          <span className="text-sm font-extrabold uppercase tracking-widest text-white">
            X-Posts
          </span>
          <div className="ml-auto h-px flex-1 bg-sky-500/30" />
        </button>

        {openSections.has("xposts") && xPostsGroups.map((group) => {
          const isOpen = openFolders.has(group.folder);
          return (
            <div key={group.folder}>
              <button
                type="button"
                onClick={() => toggleFolder(group.folder)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-xs font-semibold text-sky-400 transition hover:bg-zinc-800/60"
              >
                <ChevronRight className={clsx("h-3.5 w-3.5 transition-transform", isOpen && "rotate-90")} />
                <span className="truncate">{group.label.replace(X_POSTS_PREFIX, "").replace(/^[\s/]+/, "") || "General"}</span>
                <span className="ml-auto rounded-full bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-bold text-sky-400">
                  {group.docs.length}
                </span>
              </button>
              {isOpen && (
                <div className="ml-3 space-y-0.5 border-l border-sky-500/20 pl-2">
                  {group.docs.map((doc) => (
                    <div
                      key={doc.id}
                      className={clsx(
                        "group flex items-center justify-between rounded-md px-3 py-1.5 text-sm transition",
                        selectedId === doc.id
                          ? "bg-zinc-800/80 text-zinc-100"
                          : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-100"
                      )}
                    >
                      <button type="button" onClick={() => onSelect(doc)} className="flex-1 truncate text-left">
                        {shortDate(doc.title) || "Untitled"}
                      </button>
                      <button type="button" onClick={() => onDelete(doc.id)} className="ml-2 hidden rounded p-1 text-zinc-500 transition hover:text-zinc-200 group-hover:block" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Documents Section Header */}
        <button
          type="button"
          onClick={() => toggleSection("documents")}
          className="mb-2 mt-5 pb-1 border-b border-indigo-500/20 flex w-full items-center gap-2 px-2 cursor-pointer hover:opacity-80 transition"
        >
          <ChevronRight className={clsx("h-5 w-5 text-indigo-400 transition-transform", openSections.has("documents") && "rotate-90")} />
          <FolderOpen className="h-5 w-5 text-indigo-400" />
          <span className="text-sm font-extrabold uppercase tracking-widest text-white">
            Documents
          </span>
          <div className="ml-auto h-px flex-1 bg-indigo-500/30" />
        </button>

        {openSections.has("documents") && regularGroups.map((group) => {
          const isOpen = openFolders.has(group.folder);
          return (
            <div key={group.folder}>
              <button
                type="button"
                onClick={() => toggleFolder(group.folder)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-xs font-medium uppercase tracking-wide text-zinc-400 transition hover:bg-zinc-800/40 hover:text-zinc-200"
              >
                <ChevronRight
                  className={clsx(
                    "h-3.5 w-3.5 transition-transform",
                    isOpen && "rotate-90"
                  )}
                />
                <FolderOpen className="h-3.5 w-3.5 text-indigo-400" />
                <span className="truncate normal-case">{group.label}</span>
                <span className="ml-auto text-[10px] text-zinc-600">
                  {group.docs.length}
                </span>
              </button>

              {isOpen && (
                <div className="ml-3 space-y-0.5 border-l border-zinc-800 pl-2">
                  {group.docs.map((doc) => (
                    <div
                      key={doc.id}
                      className={clsx(
                        "group flex items-center justify-between rounded-md px-3 py-1.5 text-sm transition",
                        selectedId === doc.id
                          ? "bg-zinc-800/80 text-zinc-100"
                          : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-100"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => onSelect(doc)}
                        className="flex-1 truncate text-left"
                      >
                        {shortDate(doc.title) || "Untitled"}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(doc.id)}
                        className="ml-2 hidden rounded p-1 text-zinc-500 transition hover:text-zinc-200 group-hover:block"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-zinc-800 px-6 py-4 text-xs text-zinc-500">
        {documents.length} document{documents.length === 1 ? "" : "s"}
      </div>
    </aside>
  );
}
