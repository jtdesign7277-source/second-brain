"use client";

import { useEffect, useMemo, useState } from "react";
import type { DocumentItem } from "@/types/documents";

export type DocumentViewerProps = {
  document: DocumentItem | null;
  onSave: (doc: DocumentItem) => Promise<void>;
};

export default function DocumentViewer({ document, onSave }: DocumentViewerProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(document?.title ?? "");
    setContent(document?.content ?? "");
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
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded-md border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-lg font-semibold text-zinc-100 focus:border-indigo-500 focus:outline-none"
          placeholder="Untitled document"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || saving}
          className="ml-4 inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:bg-zinc-700"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Start writing..."
        className="min-h-[360px] flex-1 resize-none rounded-md border border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
      />
    </div>
  );
}
