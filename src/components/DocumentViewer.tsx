"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Pencil, Eye, Save, Volume2, Square } from "lucide-react";
import type { DocumentItem } from "@/types/documents";

export type DocumentViewerProps = {
  document: DocumentItem | null;
  onSave: (doc: DocumentItem) => Promise<void>;
  onClose: () => void;
};

/* ── strip markdown to plain text for TTS ── */
function stripMarkdown(md: string): string {
  return md
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^- /gm, "")
    .replace(/^\d+\.\s/gm, "")
    .replace(/^---$/gm, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

/* ── useSpeech hook — OpenAI TTS (Nova voice) ── */
function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (text: string) => {
    // Stop any current playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();

    const plain = stripMarkdown(text);
    if (!plain) { console.warn("TTS: no text after stripping markdown"); return; }

    // Create Audio element synchronously (preserves user gesture for autoplay)
    const audio = new Audio();
    audioRef.current = audio;
    setSpeaking(true);

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: plain.slice(0, 4000) }),
      });

      if (!res.ok) {
        throw new Error(`TTS API returned ${res.status}`);
      }

      const blob = await res.blob();
      if (blob.size < 100) {
        throw new Error("TTS returned empty audio");
      }

      const url = URL.createObjectURL(blob);

      audio.onended = () => {
        setSpeaking(false);
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };
      audio.onerror = (e) => {
        console.error("Audio playback error:", e);
        setSpeaking(false);
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };

      audio.src = url;
      audio.load();
      await audio.play();
    } catch (err) {
      console.warn("OpenAI TTS failed, falling back to browser speech:", err);
      audioRef.current = null;
      
      // Fallback to browser SpeechSynthesis
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const utter = new SpeechSynthesisUtterance(plain.slice(0, 2000));
        utter.rate = 1.0;
        utter.pitch = 1.0;
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(v => v.lang.startsWith("en"));
        if (englishVoice) utter.voice = englishVoice;
        utter.onend = () => setSpeaking(false);
        utter.onerror = () => setSpeaking(false);
        window.speechSynthesis.speak(utter);
      } else {
        setSpeaking(false);
      }
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setSpeaking(false);
  }, []);

  // Stop on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return { speaking, speak, stop };
}

/* ── RenderedMarkdown ── */
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
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-sky-400 underline decoration-sky-400/30 hover:decoration-sky-400 transition">$1</a>')
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-sky-400 underline decoration-sky-400/30 hover:decoration-sky-400 transition">$1</a>')
      .replace(/@([a-zA-Z0-9_]{1,15})\b/g, '<a href="https://x.com/$1" target="_blank" rel="noopener noreferrer" class="text-sky-400 font-medium hover:underline">@$1</a>')
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

/* ── DocumentViewer ── */
export default function DocumentViewer({ document, onSave, onClose }: DocumentViewerProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const { speaking, speak, stop } = useSpeech();

  // Reset when switching documents
  useEffect(() => {
    setEditing(false);
    setDraft(document?.content ?? "");
    stop(); // Stop speaking when switching docs
  }, [document, stop]);

  if (!document) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-zinc-500">
        <div className="text-4xl mb-3">📚</div>
        <p>Select a document to view</p>
      </div>
    );
  }

  const handleToggle = () => {
    if (editing) {
      setDraft(document.content);
    } else {
      setDraft(document.content);
    }
    setEditing(!editing);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave({ ...document, content: draft });
    setSaving(false);
    setEditing(false);
  };

  const handleSpeak = async () => {
    if (speaking) {
      stop();
    } else {
      try {
        await speak(document.content);
      } catch (err) {
        console.error("Speak failed:", err);
      }
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800/60 px-2 py-1.5 text-xs text-zinc-400 transition hover:bg-zinc-700 hover:text-zinc-100 shrink-0"
            title="Close document"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
          <h1 className="text-base font-semibold text-zinc-100 truncate">{document.title}</h1>
        </div>
        <div className="flex items-center gap-1.5 ml-3 shrink-0">
          {/* Speak button */}
          <button
            type="button"
            onClick={handleSpeak}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              speaking
                ? "border-red-500/50 bg-red-500/20 text-red-400 hover:bg-red-500/30"
                : "border-violet-500/50 bg-violet-500/20 text-violet-300 hover:bg-violet-500/30"
            }`}
            title={speaking ? "Stop reading" : "Read document aloud"}
          >
            {speaking ? (
              <>
                <Square className="h-3 w-3" />
                Stop
              </>
            ) : (
              <>
                <Volume2 className="h-3 w-3" />
                Speak
              </>
            )}
          </button>

          {editing && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || draft === document.content}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-500 disabled:opacity-40"
            >
              <Save className="h-3 w-3" />
              {saving ? "Saving..." : "Save"}
            </button>
          )}
          <button
            type="button"
            onClick={handleToggle}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-zinc-700"
          >
            {editing ? (
              <>
                <Eye className="h-3 w-3" />
                View
              </>
            ) : (
              <>
                <Pencil className="h-3 w-3" />
                Edit
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto rounded border border-zinc-800 bg-zinc-900/30">
        {editing ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="h-full w-full resize-none bg-transparent p-4 text-sm font-mono text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
            placeholder="Edit content..."
          />
        ) : (
          <div className="p-4">
            {document.content.trim() ? (
              <RenderedMarkdown content={document.content} />
            ) : (
              <p className="text-zinc-500 text-sm">Empty document. Click Edit to add content.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
