"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { DocumentItem } from "@/types/documents";

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
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const {
        data: { session }
      } = await supabaseBrowser.auth.getSession();
      if (isMounted) {
        setUserId(session?.user?.id ?? null);
      }
    };

    const { data: subscription } = supabaseBrowser.auth.onAuthStateChange(
      (_event, session) => {
        setUserId(session?.user?.id ?? null);
      }
    );

    void init();

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const fetchDocuments = useCallback(async () => {
    if (!userId) {
      setDocuments([]);
      setSelected(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    let query = supabaseBrowser
      .from("documents")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (search.trim()) {
      const term = search.trim();
      query = query.or(`title.ilike.%${term}%,content.ilike.%${term}%`);
    }

    const { data, error } = await query;
    if (!error && data) {
      setDocuments(data as DocumentItem[]);
      if (data.length > 0) {
        setSelected((prev) => {
          if (prev && data.find((doc) => doc.id === prev.id)) {
            return prev;
          }
          return data[0] as DocumentItem;
        });
      } else {
        setSelected(null);
      }
    }
    setLoading(false);
  }, [search, userId]);

  useEffect(() => {
    void fetchDocuments();
  }, [fetchDocuments]);

  const createDocument = useCallback(async () => {
    if (!userId) return;
    const now = new Date().toISOString();
    const { data, error } = await supabaseBrowser
      .from("documents")
      .insert({
        user_id: userId,
        title: "Untitled",
        content: "",
        folder: null,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (!error && data) {
      const doc = data as DocumentItem;
      setDocuments((prev) => [doc, ...prev]);
      setSelected(doc);
    }
  }, [userId]);

  const updateDocument = useCallback(async (doc: DocumentItem) => {
    const now = new Date().toISOString();
    const updated = { ...doc, updated_at: now };
    setDocuments((prev) => prev.map((item) => (item.id === doc.id ? updated : item)));
    setSelected(updated);
    await supabaseBrowser
      .from("documents")
      .update({
        title: updated.title,
        content: updated.content,
        folder: updated.folder,
        updated_at: updated.updated_at
      })
      .eq("id", doc.id);
  }, []);

  const deleteDocument = useCallback(async (id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    setSelected((prev) => (prev?.id === id ? null : prev));
    await supabaseBrowser.from("documents").delete().eq("id", id);
  }, []);

  const selectDocument = useCallback((doc: DocumentItem) => {
    setSelected(doc);
  }, []);

  const refresh = useCallback(async () => {
    await fetchDocuments();
  }, [fetchDocuments]);

  return useMemo(
    () => ({
      documents,
      selected,
      loading,
      search,
      setSearch,
      selectDocument,
      createDocument,
      updateDocument,
      deleteDocument,
      refresh,
      userId
    }),
    [
      documents,
      selected,
      loading,
      search,
      setSearch,
      selectDocument,
      createDocument,
      updateDocument,
      deleteDocument,
      refresh,
      userId
    ]
  );
}
