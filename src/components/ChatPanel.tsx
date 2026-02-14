"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { ChevronRight, MessageCircle, Send } from "lucide-react";
import { useChat } from "@/hooks/useChat";

export default function ChatPanel() {
  const { messages, input, setInput, sendMessage, streaming } = useChat();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, streaming]);

  return (
    <aside
      className={clsx(
        "relative flex h-full flex-col border-l border-zinc-800 bg-zinc-950 transition-all",
        isCollapsed ? "w-12" : "w-[400px]"
      )}
    >
      <button
        type="button"
        onClick={() => setIsCollapsed((prev) => !prev)}
        className="absolute -left-3 top-6 flex h-6 w-6 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200"
      >
        <ChevronRight
          className={clsx(
            "h-4 w-4 transition",
            isCollapsed ? "rotate-180" : "rotate-0"
          )}
        />
      </button>

      <div
        className={clsx(
          "flex h-full flex-col transition-opacity",
          isCollapsed ? "pointer-events-none opacity-0" : "opacity-100"
        )}
      >
        <div className="flex items-center gap-2 border-b border-zinc-800 px-6 py-4">
          <div className="rounded-full bg-indigo-500/20 p-2 text-indigo-400">
            <MessageCircle className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-zinc-100">Fred</div>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Online
            </div>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 space-y-4 overflow-y-auto px-6 py-6 text-sm"
        >
          {messages.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-zinc-400">
              Ask Fred about your documents, market context, or code changes.
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={clsx(
                  "max-w-[85%] rounded-xl px-4 py-3 leading-relaxed",
                  message.role === "user"
                    ? "ml-auto bg-indigo-600 text-white"
                    : "bg-zinc-900/60 text-zinc-100"
                )}
              >
                {message.content}
              </div>
            ))
          )}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void sendMessage();
          }}
          className="border-t border-zinc-800 px-6 py-4"
        >
          <div className="flex items-end gap-3">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Message Fred..."
              rows={2}
              className="min-h-[44px] flex-1 resize-none rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={streaming || !input.trim()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-indigo-600 text-white transition hover:bg-indigo-500 disabled:bg-zinc-700"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </aside>
  );
}
