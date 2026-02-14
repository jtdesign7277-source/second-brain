"use client";

import { useEffect, useMemo, useState } from "react";
import type { DocumentItem } from "@/types/documents";

export type DocumentViewerProps = {
  document: DocumentItem | null;
  onSave: (doc: DocumentItem) => Promise<void>;
};

function RenderedMarkdown({ content }: { content: string }) {
  const html = useMemo(() => {
    return content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/^### (.+)$/gm, '<h3 class="text-cyan-400 text-sm font-bold mt-4 mb-1">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-emerald-400 text-base font-bold mt-5 mb-2 border-b border-zinc-800 pb-1">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-violet-400 text-lg font-bold mt-5 mb-3">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-zinc-100 font-semibold">$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="bg-zinc-800 text-amber-400 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
      .replace(/^- (.+)$/gm, '<div class="flex items-start gap-2 my-0.5"><span class="text-indigo-400 mt-1.5 text-xs">●</span><span class="text-zinc-300">$1</span></div>')
      .replace(/^(\d+)\. (.+)$/gm, '<div class="flex items-start gap-2 my-0.5"><span class="text-emerald-400 font-mono text-xs mt-0.5 min-w-[1.2rem]">$1.</span><span class="text-zinc-300">$2</span></div>')
      .replace(/^---$/gm, '<hr class="border-zinc-800 my-3" />')
      .replace(/\n\n/g, '<div class="h-2"></div>')
      .replace(/\n/g, '<br />');
  }, [content]);

  return (
    <div
      className="text-sm text-zinc-400 leading-relaxed"
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

  if (!document) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-zinc-500">
        <div className="text-4xl mb-3">📚</div>
        <p>Select a document to view</p>
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

  const isDirty = title !== (document.title ?? "") || content !== (document.content ?? "");

  return (
    <div className="flex h-full flex-col">
      {/* Title + buttons */}
      <div className="flex items-center gap-2 mb-3">
        {editing ? (
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 rounded border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-base font-semibold text-zinc-100 focus:border-indigo-500 focus:outline-none"
          />
        ) : (
          <h1 className="flex-1 text-base font-semibold text-zinc-100 truncate">{title}</h1>
        )}
        <button
          type="button"
          onClick={() => {
            if (editing && isDirty) handleSave();
            else setEditing(!editing);
          }}
          className="rounded border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700"
        >
          {editing ? (isDirty ? "Save" : "Done") : "Edit"}
        </button>
      </div>

      {/* Content */}
      {editing ? (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write markdown..."
          className="flex-1 resize-none rounded border border-zinc-800 bg-zinc-900/40 p-4 text-sm font-mono text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
        />
      ) : (
        <div className="flex-1 overflow-y-auto rounded border border-zinc-800 bg-zinc-900/30 p-4">
          {content.trim() ? (
            <RenderedMarkdown content={content} />
          ) : (
            <p className="text-zinc-500 text-sm">Empty document. Click Edit to add content.</p>
          )}
        </div>
      )}
    </div>
  );
}
