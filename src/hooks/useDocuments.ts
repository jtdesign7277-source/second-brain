"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { DocumentItem } from "@/types/documents";
import { seedIfNeeded, seedStrategiesIfNeeded } from "@/lib/seedDocuments";

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
  deselectDocument: () => void;
  createDocument: (name?: string) => Promise<void>;
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

  // Load local docs + fetch cron docs from API
  const loadAll = useCallback(async () => {
    // Ensure seeds exist before reading
    seedIfNeeded();
    seedStrategiesIfNeeded();
    const localDocs = loadDocs();

    // Try to fetch cron-submitted docs from API
    let cronDocs: DocumentItem[] = [];
    try {
      const res = await fetch("/api/documents");
      if (res.ok) {
        const data = await res.json();
        cronDocs = (data.documents ?? []).map((d: Record<string, string>) => ({
          id: d.id,
          user_id: "cron",
          title: d.title,
          content: d.content,
          folder: d.folder,
          created_at: d.created_at,
          updated_at: d.created_at,
        }));
      }
    } catch {
      // API unavailable, just use local docs
    }

    // Merge: local docs + cron docs (dedupe by id)
    const localIds = new Set(localDocs.map((d) => d.id));
    const merged = [...localDocs, ...cronDocs.filter((d) => !localIds.has(d.id))];

    return merged;
  }, []);

  useEffect(() => {
    loadAll().then((docs) => {
      setDocuments(docs);
      setLoading(false);
    });
  }, [loadAll]);

  // Poll for new cron docs every 60 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const docs = await loadAll();
      setDocuments(docs);
    }, 60000);
    return () => clearInterval(interval);
  }, [loadAll]);

  // Listen for storage events (e.g. strategy saved from chat)
  useEffect(() => {
    const handler = () => { loadAll().then(setDocuments); };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [loadAll]);

  const filtered = useMemo(() => {
    if (!search.trim()) return documents;
    const term = search.toLowerCase();
    return documents.filter(
      (d) =>
        d.title.toLowerCase().includes(term) ||
        d.content.toLowerCase().includes(term)
    );
  }, [documents, search]);

  const createDocument = useCallback(async (name?: string) => {
    const now = new Date().toISOString();
    const today = new Date();
    const dateStr = today.toLocaleDateString("en-CA"); // YYYY-MM-DD
    const doc: DocumentItem = {
      id: crypto.randomUUID(),
      user_id: "local",
      title: name?.trim() || "Untitled",
      content: "",
      folder: dateStr,
      created_at: now,
      updated_at: now,
    };
    const next = [doc, ...documents];
    setDocuments(next);
    setSelected(doc);
    saveDocs(next.filter((d) => d.user_id !== "cron"));
  }, [documents]);

  const updateDocument = useCallback(
    async (doc: DocumentItem) => {
      const updated = { ...doc, updated_at: new Date().toISOString() };
      const next = documents.map((d) => (d.id === doc.id ? updated : d));
      setDocuments(next);
      setSelected(updated);
      saveDocs(next.filter((d) => d.user_id !== "cron"));
    },
    [documents]
  );

  const deleteDocument = useCallback(
    async (id: string) => {
      const next = documents.filter((d) => d.id !== id);
      setDocuments(next);
      if (selected?.id === id) setSelected(next[0] ?? null);
      saveDocs(next.filter((d) => d.user_id !== "cron"));
    },
    [documents, selected]
  );

  const selectDocument = useCallback((doc: DocumentItem) => {
    setSelected(doc);
  }, []);

  const deselectDocument = useCallback(() => {
    setSelected(null);
  }, []);

  const refresh = useCallback(async () => {
    const docs = await loadAll();
    setDocuments(docs);
  }, [loadAll]);

  return {
    documents: filtered,
    selected,
    loading,
    search,
    setSearch,
    selectDocument,
    deselectDocument,
    createDocument,
    updateDocument,
    deleteDocument,
    refresh,
    userId: "local",
  };
}
