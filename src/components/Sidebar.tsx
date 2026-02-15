"use client";

import { ChevronRight, Clock, FolderOpen, Plus, Search, Trash2, Target } from "lucide-react";
import clsx from "clsx";
import { useMemo, useState } from "react";
import type { DocumentItem } from "@/types/documents";
import { CRON_FOLDERS, getCronFolder, STRATEGIES_FOLDER } from "@/lib/cronFolders";
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

function groupByFolder(docs: DocumentItem[]): { cronGroups: FolderGroup[]; strategiesGroup: FolderGroup; regularGroups: FolderGroup[] } {
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

  // Regular dated folders sorted reverse chronologically
  const regularGroups: FolderGroup[] = [];
  const sortedKeys = [...map.keys()].sort((a, b) => b.localeCompare(a));
  for (const key of sortedKeys) {
    regularGroups.push({
      folder: key,
      label: key,
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

  return { cronGroups, strategiesGroup, regularGroups };
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
  const { cronGroups, strategiesGroup, regularGroups } = useMemo(() => groupByFolder(documents), [documents]);
  const allGroups = useMemo(() => [strategiesGroup, ...cronGroups, ...regularGroups], [strategiesGroup, cronGroups, regularGroups]);

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
        <div className="mb-1 mt-2 flex items-center gap-2 px-2">
          <Target className="h-3 w-3 text-fuchsia-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-fuchsia-400">
            Strategies
          </span>
          <div className="ml-auto h-px flex-1 bg-fuchsia-500/20" />
        </div>

        {(() => {
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
                          {doc.title || "Untitled"}
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
        <div className="mb-1 mt-4 flex items-center gap-2 px-2">
          <Clock className="h-3 w-3 text-violet-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400">
            Active Cron Jobs
          </span>
          <div className="ml-auto h-px flex-1 bg-violet-500/20" />
        </div>

        {cronGroups.map((group) => {
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
                          {doc.title || "Untitled"}
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

        {/* Documents Section Header */}
        <div className="mb-1 mt-4 flex items-center gap-2 px-2">
          <FolderOpen className="h-3 w-3 text-indigo-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
            Documents
          </span>
          <div className="ml-auto h-px flex-1 bg-indigo-500/20" />
        </div>

        {regularGroups.map((group) => {
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
                        {doc.title || "Untitled"}
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
