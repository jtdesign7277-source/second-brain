"use client";

import { useEffect, useRef } from "react";
import clsx from "clsx";
import { Send } from "lucide-react";
import { useChat } from "@/hooks/useChat";

/* ── Shared message list ── */
function MessageList({
  messages,
  streaming,
  size,
}: {
  messages: { role: string; content: string }[];
  streaming: boolean;
  size: "full" | "compact";
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const bubbleText = size === "full" ? "text-sm" : "text-[13px]";

  return (
    <>
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
          <div className="text-5xl mb-3">⚡</div>
          <div className="text-sm font-medium">Hey Jeff — what do you need?</div>
          <div className="text-xs text-zinc-600 mt-1">Ask me anything about markets, strategies, or your portfolio</div>
        </div>
      )}
      {messages.map((msg, i) => (
        <div
          key={i}
          className={clsx(
            "flex",
            msg.role === "user" ? "justify-end" : "justify-start"
          )}
        >
          {msg.role !== "user" && (
            <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600">
              <span className="text-white text-xs font-bold">F</span>
            </div>
          )}
          <div
            className={clsx(
              "rounded-2xl px-4 py-2.5 leading-relaxed",
              bubbleText,
              msg.role === "user"
                ? "bg-indigo-600 text-white rounded-br-sm max-w-[75%]"
                : "bg-zinc-800/80 text-zinc-100 rounded-bl-sm max-w-[85%]"
            )}
          >
            {msg.content || (streaming && i === messages.length - 1 ? (
              <span className="inline-flex gap-1">
                <span className="animate-pulse">●</span>
                <span className="animate-pulse" style={{ animationDelay: "0.2s" }}>●</span>
                <span className="animate-pulse" style={{ animationDelay: "0.4s" }}>●</span>
              </span>
            ) : "")}
          </div>
        </div>
      ))}
      <div ref={endRef} />
    </>
  );
}

/* ── Shared input bar ── */
function ChatInput({
  input,
  setInput,
  sendMessage,
  streaming,
  size,
}: {
  input: string;
  setInput: (v: string) => void;
  sendMessage: () => void;
  streaming: boolean;
  size: "full" | "compact";
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, size === "full" ? 120 : 80) + "px";
    }
  }, [input, size]);

  return (
    <div className="flex items-end gap-2">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
          }
        }}
        placeholder="Message Fred..."
        rows={1}
        className={clsx(
          "flex-1 resize-none rounded-2xl border-0 bg-zinc-900 px-4 py-2.5 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50",
          size === "full" ? "text-sm" : "text-[13px]"
        )}
        style={{ minHeight: size === "full" ? "44px" : "36px" }}
      />
      <button
        type="button"
        onClick={sendMessage}
        disabled={streaming || !input.trim()}
        className={clsx(
          "flex items-center justify-center rounded-full transition",
          size === "full" ? "h-11 w-11" : "h-9 w-9",
          input.trim() && !streaming
            ? "bg-indigo-600 text-white hover:bg-indigo-500"
            : "bg-transparent text-zinc-600"
        )}
      >
        <Send className={size === "full" ? "h-5 w-5" : "h-4 w-4"} />
      </button>
    </div>
  );
}

/* ── Full-size chat (main content area) ── */
export function ChatFull() {
  const { messages, input, setInput, sendMessage, streaming } = useChat();

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-zinc-800/50 mb-4">
        <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center">
          <span className="text-white text-sm font-bold">F</span>
        </div>
        <div>
          <div className="text-base font-semibold text-zinc-100">Fred</div>
          <div className="text-xs text-emerald-400">online</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        <MessageList messages={messages} streaming={streaming} size="full" />
      </div>

      {/* Input */}
      <div className="pt-4 border-t border-zinc-800/50 mt-4">
        <ChatInput
          input={input}
          setInput={setInput}
          sendMessage={() => void sendMessage()}
          streaming={streaming}
          size="full"
        />
      </div>
    </div>
  );
}

/* ── Floating chat widget (bottom-right) ── */
export function ChatFloating() {
  const { messages, input, setInput, sendMessage, streaming } = useChat();

  return (
    <div
      className="fixed bottom-5 right-5 z-50 flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60 w-[380px]"
      style={{ maxHeight: "70vh" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800/50">
        <div className="h-7 w-7 rounded-full bg-indigo-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">F</span>
        </div>
        <div>
          <div className="text-sm font-semibold text-zinc-100 leading-tight">Fred</div>
          <div className="text-[10px] text-emerald-400">online</div>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-3 py-3 space-y-2"
        style={{ maxHeight: "calc(70vh - 120px)", minHeight: "200px" }}
      >
        <MessageList messages={messages} streaming={streaming} size="compact" />
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800/50 px-3 py-2">
        <ChatInput
          input={input}
          setInput={setInput}
          sendMessage={() => void sendMessage()}
          streaming={streaming}
          size="compact"
        />
      </div>
    </div>
  );
}

/* ── Floating chat bubble (collapsed state) ── */
export function ChatBubble({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500 hover:scale-105 active:scale-95"
    >
      <div className="relative">
        <span className="text-lg font-bold">F</span>
        <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-zinc-950" />
      </div>
    </button>
  );
}

// Default export for backward compat
export default function ChatPanel() {
  return <ChatFull />;
}
