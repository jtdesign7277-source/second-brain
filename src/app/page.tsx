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

/* ── strip markdown to plain text for TTS ── */
function stripMarkdown(md: string): string {
  return md
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^- /gm, "")
    .replace(/^\d+\.\s/gm, "")
    .replace(/^---$/gm, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

/* ── Global TTS hook (lives at page level, persists across doc switches) ── */
function useGlobalTTS() {
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  const bindAudio = useCallback((el: HTMLAudioElement | null) => {
    audioRef.current = el;
  }, []);

  const speak = useCallback(async (text: string) => {
    const el = audioRef.current;
    if (!el) return;

    // Stop current
    el.pause();
    el.currentTime = 0;
    window.speechSynthesis?.cancel();

    const plain = stripMarkdown(text);
    if (!plain) return;

    setSpeaking(true);

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: plain.slice(0, 4000) }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);

      const blob = await res.blob();
      if (blob.size < 100) throw new Error("Empty audio");

      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const url = URL.createObjectURL(blob);
      urlRef.current = url;

      el.src = url;
      el.load();
      await el.play();
    } catch (err) {
      console.warn("Nova TTS failed, browser fallback:", err);
      // Browser fallback
      if (window.speechSynthesis) {
        const utter = new SpeechSynthesisUtterance(plain.slice(0, 2000));
        utter.rate = 1.0;
        utter.onend = () => setSpeaking(false);
        utter.onerror = () => setSpeaking(false);
        window.speechSynthesis.speak(utter);
      } else {
        setSpeaking(false);
      }
    }
  }, []);

  const stop = useCallback(() => {
    const el = audioRef.current;
    if (el) { el.pause(); el.currentTime = 0; }
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  const onEnded = useCallback(() => setSpeaking(false), []);
  const onError = useCallback(() => setSpeaking(false), []);

  return { speaking, speak, stop, bindAudio, onEnded, onError };
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
      {/* Global audio element — persists across all doc switches */}
      <audio ref={tts.bindAudio} onEnded={tts.onEnded} onError={tts.onError} className="hidden" />
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
            <ChatFull />
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
