"use client";

import { Brain, ChevronRight, FolderOpen, Plus, Search, Trash2 } from "lucide-react";
import clsx from "clsx";
import { useMemo, useState } from "react";
import type { DocumentItem } from "@/types/documents";

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
};

function groupByFolder(docs: DocumentItem[]): FolderGroup[] {
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

  const groups: FolderGroup[] = [];

  // Sort folders reverse chronologically (date-prefixed ones first)
  const sortedKeys = [...map.keys()].sort((a, b) => b.localeCompare(a));
  for (const key of sortedKeys) {
    groups.push({
      folder: key,
      label: key,
      docs: map.get(key)!,
    });
  }

  if (ungrouped.length > 0) {
    groups.push({
      folder: "__ungrouped__",
      label: "Unfiled",
      docs: ungrouped,
    });
  }

  return groups;
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
  const groups = useMemo(() => groupByFolder(documents), [documents]);

  // Auto-open folder containing selected doc
  useMemo(() => {
    if (!selectedId) return;
    for (const g of groups) {
      if (g.docs.some((d) => d.id === selectedId)) {
        setOpenFolders((prev) => {
          if (prev.has(g.folder)) return prev;
          const next = new Set(prev);
          next.add(g.folder);
          return next;
        });
      }
    }
  }, [selectedId, groups]);

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

      <div className="px-6 pt-5">
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-md border border-zinc-700/60 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 transition hover:border-transparent hover:bg-gradient-to-r hover:from-violet-600 hover:via-indigo-600 hover:to-cyan-500"
        >
          <Brain className="h-4 w-4" />
          Stock Search
        </button>
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
        {groups.length === 0 ? (
          <div className="px-3 py-6 text-sm text-zinc-500">
            No documents yet. Create one to get started.
          </div>
        ) : (
          groups.map((group) => {
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
                  <span className="truncate">{group.label}</span>
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
          })
        )}
      </nav>

      <div className="border-t border-zinc-800 px-6 py-4 text-xs text-zinc-500">
        {documents.length} document{documents.length === 1 ? "" : "s"}
      </div>
    </aside>
  );
}
