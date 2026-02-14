"use client";

import { useEffect, useState } from "react";
import { ChatFull, ChatFloating, ChatBubble } from "@/components/ChatPanel";
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
    deselectDocument,
    createDocument,
    updateDocument,
    deleteDocument,
  } = useDocuments();

  const [floatingChatOpen, setFloatingChatOpen] = useState(false);

  useEffect(() => {
    seedIfNeeded();
  }, []);

  // When a document is selected, auto-close floating chat initially
  // When document is closed, close floating chat too
  const hasDocument = selected !== null;

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100">
      <Sidebar
        documents={documents}
        selectedId={selected?.id ?? null}
        search={search}
        onSearchChange={setSearch}
        onSelect={(doc) => {
          selectDocument(doc);
          setFloatingChatOpen(false);
        }}
        onCreate={createDocument}
        onDelete={deleteDocument}
      />

      <main className="flex min-w-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
        <TradingWidgets />
        <EmailBar />

        <div className="flex-1 min-h-0">
          {hasDocument ? (
            /* Document is open → show document viewer */
            <DocumentViewer
              document={selected}
              onSave={updateDocument}
              onClose={() => {
                deselectDocument();
                setFloatingChatOpen(false);
              }}
            />
          ) : (
            /* No document → chat is the main content */
            <ChatFull />
          )}
        </div>
      </main>

      {/* Floating chat — only when a document is open */}
      {hasDocument && (
        floatingChatOpen ? (
          <ChatFloating />
        ) : (
          <ChatBubble onClick={() => setFloatingChatOpen(true)} />
        )
      )}
    </div>
  );
}
