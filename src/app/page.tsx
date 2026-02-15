"use client";

import { useState } from "react";
import { ChatFull, ChatFloating, ChatBubble } from "@/components/ChatPanel";
import DocumentViewer from "@/components/DocumentViewer";
import EmailBar from "@/components/EmailBar";
import Sidebar from "@/components/Sidebar";
import SplitPanel from "@/components/SplitPanel";
import type { PanelTarget } from "@/components/SplitPanel";
import TradingWidgets from "@/components/TradingWidgets";
import BreakingTicker from "@/components/BreakingTicker";
import { useDocuments } from "@/hooks/useDocuments";
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
  const [splitPanel, setSplitPanel] = useState<PanelTarget>(null);
  

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
        <EmailBar onOpenPanel={(target) => setSplitPanel((prev) => prev === target ? null : target)} />
        <BreakingTicker />

        <div className="flex-1 min-h-0">
          {hasDocument ? (
            <DocumentViewer
              document={selected}
              onSave={updateDocument}
              onClose={() => {
                deselectDocument();
                setFloatingChatOpen(false);
                
              }}
              
            />
          ) : (
            <ChatFull  />
          )}
        </div>
      </main>

      {/* Split panel (X timeline / email) */}
      {splitPanel && (
        <SplitPanel target={splitPanel} onClose={() => setSplitPanel(null)} />
      )}

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
