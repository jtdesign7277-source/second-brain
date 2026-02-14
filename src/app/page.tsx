"use client";

import { useEffect } from "react";
import ChatPanel from "@/components/ChatPanel";
import DocumentViewer from "@/components/DocumentViewer";
import EmailBar from "@/components/EmailBar";
import Sidebar from "@/components/Sidebar";
import TradingWidgets from "@/components/TradingWidgets";
import { useDocuments } from "@/hooks/useDocuments";
import { seedIfNeeded } from "@/lib/seedDocuments";

export default function Home() {
  const {
    documents,
    selected,
    search,
    setSearch,
    selectDocument,
    createDocument,
    updateDocument,
    deleteDocument,
    userId
  } = useDocuments();

  useEffect(() => {
    seedIfNeeded();
  }, []);

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100">
      <Sidebar
        documents={documents}
        selectedId={selected?.id ?? null}
        search={search}
        onSearchChange={setSearch}
        onSelect={selectDocument}
        onCreate={createDocument}
        onDelete={deleteDocument}
      />

      <main className="flex min-w-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
        <TradingWidgets />
        <EmailBar />
        <div className="flex-1">
          <DocumentViewer document={selected} onSave={updateDocument} />
        </div>
      </main>

      <ChatPanel />
    </div>
  );
}
