"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChatFull, ChatFloating, ChatBubble } from "@/components/ChatPanel";
import DocumentViewer from "@/components/DocumentViewer";
import EmailBar from "@/components/EmailBar";
import Sidebar from "@/components/Sidebar";
import SplitPanel from "@/components/SplitPanel";
import type { PanelTarget } from "@/components/SplitPanel";
import TradingWidgets from "@/components/TradingWidgets";
import { useDocuments } from "@/hooks/useDocuments";
import { seedIfNeeded } from "@/lib/seedDocuments";

/* ── Dead simple TTS — no fancy refs, just fetch + play ── */
function useGlobalTTS() {
  const [speaking, setSpeaking] = useState(false);
  const currentAudio = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (text: string) => {
    // Kill anything playing
    if (currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current.src = "";
      currentAudio.current = null;
    }
    window.speechSynthesis?.cancel();

    // Strip markdown
    const plain = text
      .replace(/```[\s\S]*?```/g, "")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/^- /gm, "")
      .replace(/^\d+\.\s/gm, "")
      .replace(/^---$/gm, "")
      .replace(/\n{2,}/g, "\n")
      .trim();

    if (!plain) return;
    setSpeaking(true);

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: plain.slice(0, 4000) }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const blob = await res.blob();

      // Convert to data URL (avoids blob URL lifecycle issues)
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const audio = new Audio(dataUrl);
      currentAudio.current = audio;
      audio.onended = () => { setSpeaking(false); currentAudio.current = null; };
      audio.onerror = () => { setSpeaking(false); currentAudio.current = null; };
      await audio.play();
    } catch {
      // Fallback: browser voice
      setSpeaking(false);
      if (window.speechSynthesis) {
        const utter = new SpeechSynthesisUtterance(plain.slice(0, 2000));
        utter.onend = () => setSpeaking(false);
        utter.onerror = () => setSpeaking(false);
        window.speechSynthesis.speak(utter);
        setSpeaking(true);
      }
    }
  }, []);

  const stop = useCallback(() => {
    if (currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current.src = "";
      currentAudio.current = null;
    }
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  return { speaking, speak, stop };
}

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
  const tts = useGlobalTTS();

  useEffect(() => {
    seedIfNeeded();
  }, []);

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

        <div className="flex-1 min-h-0">
          {hasDocument ? (
            <DocumentViewer
              document={selected}
              onSave={updateDocument}
              onClose={() => {
                deselectDocument();
                setFloatingChatOpen(false);
                tts.stop();
              }}
              tts={tts}
            />
          ) : (
            <ChatFull tts={tts} />
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
