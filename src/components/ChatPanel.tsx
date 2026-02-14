"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { ChevronDown, ChevronUp, MessageCircle, Send, X } from "lucide-react";
import { useChat } from "@/hooks/useChat";

export default function ChatPanel() {
  const { messages, input, setInput, sendMessage, streaming } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Floating button when closed
  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500 hover:scale-105"
      >
        <MessageCircle className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div
      className={clsx(
        "fixed bottom-6 right-6 z-50 flex flex-col rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50 transition-all",
        isMinimized ? "w-[300px]" : "w-[360px]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-indigo-500/20 p-1.5 text-indigo-400">
            <MessageCircle className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-semibold text-zinc-100">Fred</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="rounded p-1 text-zinc-500 hover:text-zinc-300"
          >
            {isMinimized ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded p-1 text-zinc-500 hover:text-zinc-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body - hidden when minimized */}
      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="h-[300px] space-y-3 overflow-y-auto px-4 py-4 text-sm">
            {messages.length === 0 ? (
              <div className="rounded-lg bg-zinc-900/60 p-3 text-xs text-zinc-500">
                Ask Fred anything — code, markets, docs.
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={clsx(
                    "max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed",
                    message.role === "user"
                      ? "ml-auto bg-indigo-600 text-white"
                      : "bg-zinc-900/60 text-zinc-200"
                  )}
                >
                  {message.content || (streaming && index === messages.length - 1 ? "..." : "")}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage();
            }}
            className="border-t border-zinc-800 px-3 py-3"
          >
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage();
                  }
                }}
                placeholder="Message Fred..."
                rows={1}
                className="flex-1 resize-none rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
                style={{ minHeight: "36px", maxHeight: "80px" }}
              />
              <button
                type="submit"
                disabled={streaming || !input.trim()}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-500 disabled:bg-zinc-700"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
