"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { DocumentItem } from "@/types/documents";

const STORAGE_KEY = "second-brain-documents";

function loadDocs(): DocumentItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDocs(docs: DocumentItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

export type DocumentsState = {
  documents: DocumentItem[];
  selected: DocumentItem | null;
  loading: boolean;
  search: string;
  setSearch: (value: string) => void;
  selectDocument: (doc: DocumentItem) => void;
  createDocument: () => Promise<void>;
  updateDocument: (doc: DocumentItem) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  userId: string | null;
};

export function useDocuments(): DocumentsState {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selected, setSelected] = useState<DocumentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const docs = loadDocs();
    setDocuments(docs);
    if (docs.length > 0) setSelected(docs[0]);
    setLoading(false);
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return documents;
    const term = search.toLowerCase();
    return documents.filter(
      (d) =>
        d.title.toLowerCase().includes(term) ||
        d.content.toLowerCase().includes(term)
    );
  }, [documents, search]);

  const createDocument = useCallback(async () => {
    const now = new Date().toISOString();
    const today = new Date();
    const dateStr = today.toLocaleDateString("en-CA"); // YYYY-MM-DD
    const doc: DocumentItem = {
      id: crypto.randomUUID(),
      user_id: "local",
      title: "Untitled",
      content: "",
      folder: dateStr,
      created_at: now,
      updated_at: now,
    };
    const next = [doc, ...documents];
    setDocuments(next);
    setSelected(doc);
    saveDocs(next);
  }, [documents]);

  const updateDocument = useCallback(
    async (doc: DocumentItem) => {
      const updated = { ...doc, updated_at: new Date().toISOString() };
      const next = documents.map((d) => (d.id === doc.id ? updated : d));
      setDocuments(next);
      setSelected(updated);
      saveDocs(next);
    },
    [documents]
  );

  const deleteDocument = useCallback(
    async (id: string) => {
      const next = documents.filter((d) => d.id !== id);
      setDocuments(next);
      if (selected?.id === id) setSelected(next[0] ?? null);
      saveDocs(next);
    },
    [documents, selected]
  );

  const selectDocument = useCallback((doc: DocumentItem) => {
    setSelected(doc);
  }, []);

  const refresh = useCallback(async () => {
    const docs = loadDocs();
    setDocuments(docs);
  }, []);

  return {
    documents: filtered,
    selected,
    loading,
    search,
    setSearch,
    selectDocument,
    createDocument,
    updateDocument,
    deleteDocument,
    refresh,
    userId: "local",
  };
}
