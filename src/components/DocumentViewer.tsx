"use client";

import { useEffect, useMemo, useState } from "react";
import type { DocumentItem } from "@/types/documents";

export type DocumentViewerProps = {
  document: DocumentItem | null;
  onSave: (doc: DocumentItem) => Promise<void>;
};

function RenderedMarkdown({ content }: { content: string }) {
  const html = useMemo(() => {
    let result = content
      // Escape HTML
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      // Headers with colors
      .replace(/^### (.+)$/gm, '<h3 class="text-cyan-400 text-sm font-bold mt-4 mb-1">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-emerald-400 text-base font-bold mt-6 mb-2 border-b border-zinc-800 pb-1">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-violet-400 text-lg font-bold mt-6 mb-3">$1</h1>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-zinc-100 font-semibold">$1</strong>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-zinc-800 text-amber-400 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
      // Bullet points with colored dots
      .replace(/^- (.+)$/gm, '<div class="flex items-start gap-2 my-1"><span class="text-indigo-400 mt-1.5 text-xs">●</span><span class="text-zinc-300">$1</span></div>')
      // Numbered lists
      .replace(/^(\d+)\. (.+)$/gm, '<div class="flex items-start gap-2 my-1"><span class="text-emerald-400 font-mono text-xs mt-0.5 min-w-[1.2rem]">$1.</span><span class="text-zinc-300">$2</span></div>')
      // Horizontal rules
      .replace(/^---$/gm, '<hr class="border-zinc-800 my-4" />')
      // Emojis get slightly bigger
      .replace(/([\u{1F300}-\u{1F9FF}])/gu, '<span class="text-base">$1</span>')
      // Line breaks
      .replace(/\n\n/g, '<div class="h-3"></div>')
      .replace(/\n/g, '<br />');

    return result;
  }, [content]);

  return (
    <div
      className="prose-custom text-sm text-zinc-400 leading-relaxed"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default function DocumentViewer({ document, onSave }: DocumentViewerProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setTitle(document?.title ?? "");
    setContent(document?.content ?? "");
    setEditing(false);
  }, [document]);

  const isDirty = useMemo(() => {
    if (!document) return false;
    return title !== (document.title ?? "") || content !== (document.content ?? "");
  }, [document, title, content]);

  if (!document) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8 text-center">
        <div className="text-3xl">📚</div>
        <div className="mt-3 text-lg font-semibold text-zinc-100">No document selected</div>
        <div className="mt-1 text-sm text-zinc-500">
          Choose a document from the left or create a new one.
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    if (!document) return;
    setSaving(true);
    await onSave({ ...document, title, content });
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded-md border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-lg font-semibold text-zinc-100 focus:border-indigo-500 focus:outline-none"
          placeholder="Untitled document"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditing(!editing)}
            className="inline-flex items-center justify-center rounded-md border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700"
          >
            {editing ? "Preview" : "Edit"}
          </button>
          {isDirty && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:bg-zinc-700"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Start writing... (supports markdown)"
          className="min-h-[360px] flex-1 resize-none rounded-md border border-zinc-800 bg-zinc-900/40 p-4 text-sm font-mono text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
        />
      ) : (
        <div
          className="min-h-[360px] flex-1 overflow-y-auto rounded-md border border-zinc-800 bg-zinc-900/40 p-6 cursor-pointer"
          onClick={() => {
            if (!content.trim()) setEditing(true);
          }}
        >
          {content.trim() ? (
            <RenderedMarkdown content={content} />
          ) : (
            <div
              className="text-zinc-500 text-sm cursor-pointer"
              onClick={() => setEditing(true)}
            >
              Click to start writing...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
