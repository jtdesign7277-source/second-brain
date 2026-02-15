"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import type { DocumentItem } from "@/types/documents";
import { CRON_FOLDERS, getCronFolder, STRATEGIES_FOLDER, X_POSTS_PREFIX } from "@/lib/cronFolders";
import StockSearch from "./StockSearch";

/* ─────────────────────────────────────────────
   SECOND BRAIN — Premium Document Tree Sidebar
   Collapsible folders · Drag & drop · Right-click menu
   Inline rename · Breadcrumbs · Custom SVG icons
   ───────────────────────────────────────────── */

export type SidebarProps = {
  documents: DocumentItem[];
  selectedId: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (doc: DocumentItem) => void;
  onCreate: (name?: string) => void;
  onDelete: (id: string) => void;
};

// ── Icon System ──
const ICONS = {
  strategy: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="#c084fc" strokeWidth="1.5" />
      <path d="M5 8l2 2 4-4" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  cron: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="#60a5fa" strokeWidth="1.5" />
      <path d="M8 5v3l2 1.5" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  social: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="3" width="12" height="10" rx="2" stroke="#2dd4bf" strokeWidth="1.5" />
      <path d="M6 7l2 2 2-2" stroke="#2dd4bf" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  folder: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 4.5A1.5 1.5 0 013.5 3H6l1.5 1.5h5A1.5 1.5 0 0114 6v5.5a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 11.5v-7z" stroke="#a78bfa" strokeWidth="1.5" />
    </svg>
  ),
  doc: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="3" y="2" width="10" height="12" rx="1.5" stroke="#94a3b8" strokeWidth="1.5" />
      <path d="M6 6h4M6 8.5h4M6 11h2" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  config: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="3" y="2" width="10" height="12" rx="1.5" stroke="#fbbf24" strokeWidth="1.5" />
      <path d="M6 5.5h4M6 8h2" stroke="#fbbf24" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  chevron: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M4.5 2.5l3.5 3.5-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  plus: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 3v8M3 7h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  search: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9 9l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  trash: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M3 4h8M5.5 4V3a1 1 0 011-1h1a1 1 0 011 1v1M4 4v7a1 1 0 001 1h4a1 1 0 001-1V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
};

// ── Date formatting helpers ──
const MONTHS: Record<string, string> = { Jan:"1",Feb:"2",Mar:"3",Apr:"4",May:"5",Jun:"6",Jul:"7",Aug:"8",Sep:"9",Oct:"10",Nov:"11",Dec:"12" };
const DAY_RE = "(?:Sun(?:day)?|Mon(?:day)?|Tue(?:sday)?|Wed(?:nesday)?|Thu(?:rsday)?|Fri(?:day)?|Sat(?:urday)?)";
const MON_RE = "(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";
function monthNum(m: string): string { return MONTHS[m.slice(0,3)] ?? m; }

function shortDate(title: string): string {
  return title
    .replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (_,y,m,d) => `${parseInt(m)}/${parseInt(d)}/${y.slice(2)}`)
    .replace(new RegExp(`\\b${DAY_RE},?\\s+${MON_RE}\\s+(\\d{1,2}),?\\s+(\\d{4})\\b`, "g"),
      (_,mon,d,y) => `${monthNum(mon)}/${parseInt(d)}/${y.slice(2)}`)
    .replace(new RegExp(`\\b${MON_RE}\\s+(\\d{1,2}),?\\s+(\\d{4})\\b`, "g"),
      (_,mon,d,y) => `${monthNum(mon)}/${parseInt(d)}/${y.slice(2)}`)
    .replace(new RegExp(`\\b${DAY_RE},?\\s+${MON_RE}\\s+(\\d{1,2})\\b`, "g"),
      (_,mon,d) => `${monthNum(mon)}/${parseInt(d)}`)
    .replace(/^📝\s*Daily Summary\s*—\s*/i, "")
    .replace(/^📅\s*/, "")
    .replace(/^🗓️?\s*/, "");
}

function shortFolderDate(key: string): string {
  const m = key.match(/^(\d{4})-(\d{2})-(\d{2})(.*)/);
  if (m) return `${parseInt(m[2])}/${parseInt(m[3])}/${m[1].slice(2)}${m[4]}`;
  return key;
}

// ── Tree node type ──
type TreeNode = {
  id: string;
  name: string;
  type: "folder" | "file";
  icon: string;
  expanded?: boolean;
  children?: TreeNode[];
  docId?: string; // link back to real DocumentItem
  sectionColor?: string; // accent color for section headers
};

// ── Build tree from documents ──
function buildTree(documents: DocumentItem[]): TreeNode[] {
  const map = new Map<string, DocumentItem[]>();
  const ungrouped: DocumentItem[] = [];

  for (const doc of documents) {
    const folder = doc.folder?.trim();
    if (folder) {
      if (!map.has(folder)) map.set(folder, []);
      map.get(folder)!.push(doc);
    } else {
      ungrouped.push(doc);
    }
  }

  const tree: TreeNode[] = [];

  // 1. Strategies
  const stratDocs = map.get(STRATEGIES_FOLDER) ?? [];
  map.delete(STRATEGIES_FOLDER);
  tree.push({
    id: "section:strategies",
    name: "Strategies",
    type: "folder",
    icon: "strategy",
    sectionColor: "#c084fc",
    children: stratDocs.map((d) => ({
      id: d.id,
      name: shortDate(d.title) || "Untitled",
      type: "file" as const,
      icon: "strategy",
      docId: d.id,
    })),
  });

  // 2. Active Cron Jobs
  const cronChildren: TreeNode[] = [];
  for (const cf of CRON_FOLDERS) {
    const docs = map.get(cf.folder) ?? [];
    map.delete(cf.folder);
    cronChildren.push({
      id: `folder:${cf.folder}`,
      name: `${cf.emoji} ${cf.label}`,
      type: "folder",
      icon: "cron",
      children: docs.map((d) => ({
        id: d.id,
        name: shortDate(d.title) || "Untitled",
        type: "file" as const,
        icon: "doc",
        docId: d.id,
      })),
    });
  }
  tree.push({
    id: "section:cron",
    name: "Active Cron Jobs",
    type: "folder",
    icon: "cron",
    sectionColor: "#60a5fa",
    children: cronChildren,
  });

  // 3. X-Posts
  const xPostsChildren: TreeNode[] = [];
  for (const key of [...map.keys()].sort()) {
    if (key.startsWith(X_POSTS_PREFIX)) {
      const docs = map.get(key)!;
      map.delete(key);
      const subName = key.replace(X_POSTS_PREFIX, "").replace(/^[\s/]+/, "") || "General";
      xPostsChildren.push({
        id: `folder:${key}`,
        name: subName,
        type: "folder",
        icon: "social",
        children: docs.map((d) => ({
          id: d.id,
          name: shortDate(d.title) || "Untitled",
          type: "file" as const,
          icon: "doc",
          docId: d.id,
        })),
      });
    }
  }
  tree.push({
    id: "section:xposts",
    name: "X-Posts",
    type: "folder",
    icon: "social",
    sectionColor: "#2dd4bf",
    children: xPostsChildren,
  });

  // 4. Documents (regular folders + ungrouped)
  const docChildren: TreeNode[] = [];
  const sortedKeys = [...map.keys()].sort((a, b) => b.localeCompare(a));
  for (const key of sortedKeys) {
    const docs = map.get(key)!;
    docChildren.push({
      id: `folder:${key}`,
      name: shortFolderDate(key),
      type: "folder",
      icon: "folder",
      children: docs.map((d) => ({
        id: d.id,
        name: shortDate(d.title) || "Untitled",
        type: "file" as const,
        icon: "doc",
        docId: d.id,
      })),
    });
  }
  if (ungrouped.length > 0) {
    docChildren.push({
      id: "folder:unfiled",
      name: "Unfiled",
      type: "folder",
      icon: "folder",
      children: ungrouped.map((d) => ({
        id: d.id,
        name: shortDate(d.title) || "Untitled",
        type: "file" as const,
        icon: "doc",
        docId: d.id,
      })),
    });
  }
  tree.push({
    id: "section:documents",
    name: "Documents",
    type: "folder",
    icon: "folder",
    sectionColor: "#a78bfa",
    children: docChildren,
  });

  return tree;
}

// ── Count all files in a tree node ──
function countFiles(node: TreeNode): number {
  if (node.type === "file") return 1;
  return (node.children ?? []).reduce((sum, c) => sum + countFiles(c), 0);
}

// ── Context Menu ──
function ContextMenu({ x, y, isFolder, onAction, onClose }: {
  x: number; y: number; isFolder: boolean;
  onAction: (action: string) => void; onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const items = [
    ...(isFolder ? [
      { label: "New File", action: "newFile", icon: "📄" },
    ] : []),
    { label: "Delete", action: "delete", icon: "🗑️", danger: true },
  ];

  return (
    <div
      ref={ref}
      style={{
        position: "fixed", left: x, top: y, zIndex: 9999,
        background: "rgba(18,18,24,0.97)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "10px", padding: "6px 0", minWidth: 160,
        backdropFilter: "blur(20px)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
      }}
    >
      {items.map((item) => (
        <button
          key={item.action}
          onClick={() => onAction(item.action)}
          className="flex items-center gap-2.5 w-full px-3.5 py-2 text-left text-[13px] transition hover:bg-white/5"
          style={{ color: item.danger ? "#f87171" : "rgba(255,255,255,0.8)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
        >
          <span className="text-sm w-5 text-center">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
  );
}

// ── Single tree row ──
function TreeRow({
  node, depth, expanded, selectedId, dragOverId, draggingId,
  onToggle, onSelect, onContextMenu, onDragStart, onDragOver, onDrop, onDelete,
}: {
  node: TreeNode; depth: number; expanded: boolean;
  selectedId: string | null; dragOverId: string | null; draggingId: string | null;
  onToggle: (id: string) => void;
  onSelect: (node: TreeNode) => void;
  onContextMenu: (e: React.MouseEvent, node: TreeNode) => void;
  onDragStart: (id: string) => void;
  onDragOver: (id: string) => void;
  onDrop: (targetId: string | null) => void;
  onDelete: (id: string) => void;
}) {
  const isFolder = node.type === "folder";
  const isSection = node.id.startsWith("section:");
  const isSelected = node.id === selectedId;
  const isDragOver = dragOverId === node.id;
  const isDragging = draggingId === node.id;
  const indent = depth * 20;
  const fileCount = countFiles(node);

  return (
    <div
      draggable={!isSection && node.type === "file"}
      onDragStart={(e) => { e.stopPropagation(); onDragStart(node.id); }}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (isFolder) onDragOver(node.id); }}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); onDrop(node.id); }}
      onDragEnd={() => onDrop(null)}
      onClick={(e) => {
        e.stopPropagation();
        if (isFolder) onToggle(node.id);
        else onSelect(node);
      }}
      onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, node); }}
      className="group flex items-center gap-1.5 select-none transition-all duration-150"
      style={{
        padding: isSection ? "10px 12px 8px" : "6px 12px",
        paddingLeft: 12 + indent,
        cursor: "pointer",
        borderRadius: isSection ? 0 : "8px",
        margin: isSection ? "0" : "1px 6px",
        background: isSelected
          ? "rgba(167,139,250,0.1)"
          : isDragOver
          ? "rgba(45,212,191,0.08)"
          : "transparent",
        borderLeft: isDragOver ? "2px solid #2dd4bf" : "2px solid transparent",
        opacity: isDragging ? 0.4 : 1,
        borderBottom: isSection ? `1px solid ${node.sectionColor ?? "#a78bfa"}22` : "none",
        marginTop: isSection && depth === 0 ? "8px" : undefined,
      }}
      onMouseEnter={(e) => {
        if (!isSelected && !isDragOver && !isSection) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)";
      }}
      onMouseLeave={(e) => {
        if (!isSelected && !isDragOver && !isSection) (e.currentTarget as HTMLDivElement).style.background = "transparent";
      }}
    >
      {/* Chevron for folders */}
      {isFolder ? (
        <span
          className="flex items-center shrink-0 transition-transform duration-200"
          style={{
            color: isSection ? (node.sectionColor ?? "rgba(255,255,255,0.35)") : "rgba(255,255,255,0.35)",
            transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
            width: 16,
          }}
        >
          {ICONS.chevron}
        </span>
      ) : (
        <span style={{ width: 16 }} className="shrink-0" />
      )}

      {/* Icon */}
      <span className="flex items-center shrink-0">
        {ICONS[node.icon as keyof typeof ICONS] || ICONS.doc}
      </span>

      {/* Name */}
      <span
        className="flex-1 truncate"
        style={{
          fontSize: isSection ? "12px" : "13px",
          fontWeight: isSection ? 700 : isFolder ? 600 : 400,
          color: isSection
            ? (node.sectionColor ?? "#fff")
            : isSelected ? "#e0d4fc" : "rgba(255,255,255,0.75)",
          letterSpacing: isSection ? "0.08em" : isFolder ? "0.03em" : "0.01em",
          textTransform: isSection ? "uppercase" : undefined,
        }}
      >
        {node.name}
      </span>

      {/* Count badge for folders */}
      {isFolder && (
        <span
          style={{
            fontSize: "10px",
            color: isSection ? (node.sectionColor ?? "rgba(255,255,255,0.25)") : "rgba(255,255,255,0.25)",
            fontWeight: 500, flexShrink: 0,
          }}
        >
          {fileCount}
        </span>
      )}

      {/* Delete button for files */}
      {!isFolder && !isSection && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
          className="hidden group-hover:flex items-center p-0.5 rounded text-zinc-600 hover:text-zinc-300 transition"
          title="Delete"
        >
          {ICONS.trash}
        </button>
      )}
    </div>
  );
}

// ── Main Sidebar Component ──
export default function Sidebar({
  documents, selectedId, search, onSearchChange, onSelect, onCreate, onDelete,
}: SidebarProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: TreeNode } | null>(null);
  const [dragState, setDragState] = useState<{ dragId: string | null; overId: string | null }>({ dragId: null, overId: null });
  const [showNewInput, setShowNewInput] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const newInputRef = useRef<HTMLInputElement>(null);

  // Focus new doc input when shown
  useEffect(() => {
    if (showNewInput && newInputRef.current) newInputRef.current.focus();
  }, [showNewInput]);

  const handleNewDocSubmit = useCallback(() => {
    const name = newDocName.trim();
    if (name) onCreate(name);
    else onCreate();
    setNewDocName("");
    setShowNewInput(false);
  }, [newDocName, onCreate]);

  // Build tree from real documents
  const tree = useMemo(() => buildTree(documents), [documents]);

  // Find the real DocumentItem by tree node
  const findDoc = useCallback((node: TreeNode): DocumentItem | undefined => {
    return documents.find((d) => d.id === (node.docId ?? node.id));
  }, [documents]);

  // Auto-expand path to selected doc
  useEffect(() => {
    if (!selectedId) return;
    const findPath = (nodes: TreeNode[], path: string[]): string[] | null => {
      for (const n of nodes) {
        if (n.id === selectedId || n.docId === selectedId) return path;
        if (n.children) {
          const found = findPath(n.children, [...path, n.id]);
          if (found) return found;
        }
      }
      return null;
    };
    const path = findPath(tree, []);
    if (path && path.length > 0) {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        for (const id of path) next.add(id);
        return next;
      });
    }
  }, [selectedId, tree]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleSelect = useCallback((node: TreeNode) => {
    const doc = findDoc(node);
    if (doc) onSelect(doc);
  }, [findDoc, onSelect]);

  const handleContextMenu = useCallback((e: React.MouseEvent, node: TreeNode) => {
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  }, []);

  const handleContextAction = useCallback((action: string) => {
    if (!contextMenu) return;
    const { node } = contextMenu;
    if (action === "delete" && node.type === "file") {
      onDelete(node.docId ?? node.id);
    } else if (action === "newFile") {
      onCreate();
    }
    setContextMenu(null);
  }, [contextMenu, onDelete, onCreate]);

  // Render tree recursively
  const renderNodes = (nodes: TreeNode[], depth: number) => {
    return nodes.map((node) => {
      const isExpanded = expandedIds.has(node.id);
      return (
        <div key={node.id}>
          <TreeRow
            node={node}
            depth={depth}
            expanded={isExpanded}
            selectedId={selectedId}
            dragOverId={dragState.overId}
            draggingId={dragState.dragId}
            onToggle={toggleExpand}
            onSelect={handleSelect}
            onContextMenu={handleContextMenu}
            onDragStart={(id) => setDragState({ dragId: id, overId: null })}
            onDragOver={(id) => { if (id !== dragState.dragId) setDragState((s) => ({ ...s, overId: id })); }}
            onDrop={() => setDragState({ dragId: null, overId: null })}
            onDelete={(id) => onDelete(id)}
          />
          {node.type === "folder" && isExpanded && node.children && node.children.length > 0 && (
            <div style={{
              overflow: "hidden",
              transition: "max-height 0.25s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease",
            }}>
              {renderNodes(node.children, depth + 1)}
            </div>
          )}
          {node.type === "folder" && isExpanded && (!node.children || node.children.length === 0) && (
            <div
              style={{
                padding: `8px 12px 8px ${12 + (depth + 1) * 20 + 22}px`,
                fontSize: "12px",
                color: "rgba(255,255,255,0.2)",
                fontStyle: "italic",
              }}
            >
              {node.id.startsWith("section:") ? "Nothing here yet" : "Empty"}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <aside
      className="flex h-full w-72 flex-col border-r border-zinc-800"
      style={{
        background: "linear-gradient(180deg, rgba(16,16,22,0.98) 0%, rgba(11,11,16,1) 100%)",
      }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-1">
        <h3 className="text-[14px] font-bold text-white/90 tracking-wide">Second Brain</h3>
        <span className="text-[11px] text-white/30 font-normal">
          {documents.length} document{documents.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Stock Search */}
      <div className="px-4 pt-3">
        <StockSearch />
      </div>

      {/* Search + New */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-2.5 text-zinc-500">
              {ICONS.search}
            </span>
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search documents..."
              className="w-full rounded-lg py-2 pl-9 pr-3 text-[13px] text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowNewInput((v) => !v)}
            title="New File"
            className="flex items-center justify-center rounded-lg transition"
            style={{
              background: showNewInput ? "rgba(167,139,250,0.15)" : "rgba(255,255,255,0.04)",
              border: showNewInput ? "1px solid rgba(167,139,250,0.4)" : "1px solid rgba(255,255,255,0.08)",
              color: showNewInput ? "#a78bfa" : "rgba(255,255,255,0.5)",
              padding: "7px 8px",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => { if (!showNewInput) { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.8)"; } }}
            onMouseLeave={(e) => { if (!showNewInput) { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.5)"; } }}
          >
            {ICONS.plus}
          </button>
        </div>

        {/* New document name input */}
        {showNewInput && (
          <div className="mt-2 flex items-center gap-2">
            <input
              ref={newInputRef}
              value={newDocName}
              onChange={(e) => setNewDocName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleNewDocSubmit();
                if (e.key === "Escape") { setShowNewInput(false); setNewDocName(""); }
              }}
              placeholder="Document name..."
              className="flex-1 rounded-lg py-2 px-3 text-[13px] text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(167,139,250,0.4)",
              }}
            />
            <button
              onClick={handleNewDocSubmit}
              className="rounded-lg px-3 py-2 text-[12px] font-semibold transition"
              style={{
                background: "rgba(167,139,250,0.15)",
                border: "1px solid rgba(167,139,250,0.3)",
                color: "#a78bfa",
                cursor: "pointer",
              }}
            >
              Create
            </button>
          </div>
        )}
      </div>

      {/* Tree */}
      <nav className="flex-1 overflow-y-auto pt-1 pb-4" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}>
        {renderNodes(tree, 0)}
      </nav>

      {/* Footer */}
      <div
        className="px-5 py-3 text-[10px] text-white/20 font-normal"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        Right-click for options · Drag to move
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          isFolder={contextMenu.node.type === "folder"}
          onAction={handleContextAction}
          onClose={() => setContextMenu(null)}
        />
      )}
    </aside>
  );
}
