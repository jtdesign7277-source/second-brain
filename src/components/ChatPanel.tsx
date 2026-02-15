"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Send, ChevronDown, ChevronRight, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChat } from "@/hooks/useChat";

/* ── Copy button for code blocks ── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="absolute top-2 right-2 p-1 rounded bg-zinc-700/80 hover:bg-zinc-600 transition opacity-0 group-hover:opacity-100"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-zinc-400" />}
    </button>
  );
}

/* ── Collapsible section ── */
function CollapsibleSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="my-2">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition text-xs font-mono uppercase tracking-wide">
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {title}
      </button>
      {open && <div className="mt-1">{children}</div>}
    </div>
  );
}

/* ── Markdown renderer for chat messages ── */
function ChatMarkdown({ content, size }: { content: string; size: "full" | "compact" }) {
  const textClass = size === "full" ? "text-sm" : "text-[13px]";
  
  return (
    <div className={clsx("chat-markdown", textClass)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <div className="text-base font-bold text-indigo-400 mt-3 mb-1.5 border-b border-zinc-700/50 pb-1">{children}</div>,
          h2: ({ children }) => <div className="text-sm font-bold text-violet-400 mt-3 mb-1">{children}</div>,
          h3: ({ children }) => <div className="text-sm font-semibold text-sky-400 mt-2 mb-0.5">{children}</div>,
          h4: ({ children }) => <div className="text-xs font-semibold text-amber-400 mt-1.5 mb-0.5">{children}</div>,
          p: ({ children }) => <p className="mb-1.5 leading-relaxed">{children}</p>,
          strong: ({ children }) => <strong className="text-zinc-50 font-semibold">{children}</strong>,
          em: ({ children }) => <em className="text-zinc-300 italic">{children}</em>,
          ul: ({ children }) => <ul className="mb-1.5 ml-3 space-y-0.5">{children}</ul>,
          ol: ({ children }) => <ol className="mb-1.5 ml-3 space-y-0.5 list-decimal">{children}</ol>,
          li: ({ children }) => <li className="flex gap-1.5 before:content-['▸'] before:text-indigo-500 before:shrink-0">{children}</li>,
          hr: () => <hr className="border-zinc-700/50 my-2" />,
          blockquote: ({ children }) => <blockquote className="border-l-2 border-indigo-500/50 pl-3 my-1.5 text-zinc-400 italic">{children}</blockquote>,
          a: ({ href, children }) => <a href={href} target="_blank" rel="noopener" className="text-sky-400 hover:text-sky-300 underline underline-offset-2">{children}</a>,
          table: ({ children }) => (
            <div className="overflow-x-auto my-2 rounded border border-zinc-700/50">
              <table className="min-w-full text-xs">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-zinc-800/80 text-zinc-300">{children}</thead>,
          th: ({ children }) => <th className="px-2 py-1 text-left font-medium border-b border-zinc-700/50">{children}</th>,
          td: ({ children }) => <td className="px-2 py-1 border-b border-zinc-800/50">{children}</td>,
          code: ({ className, children, ...props }) => {
            const isBlock = className?.includes("language-");
            const lang = className?.replace("language-", "") || "";
            const codeText = String(children).replace(/\n$/, "");
            
            if (isBlock || codeText.includes("\n")) {
              return (
                <div className="group relative my-2 rounded-lg bg-[#1a1a2e] border border-zinc-700/40 overflow-hidden">
                  {lang && (
                    <div className="flex items-center justify-between px-3 py-1 bg-zinc-800/60 border-b border-zinc-700/40">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">{lang}</span>
                    </div>
                  )}
                  <pre className="p-3 overflow-x-auto text-xs leading-relaxed">
                    <code className="text-emerald-300 font-mono">{codeText}</code>
                  </pre>
                  <CopyButton text={codeText} />
                </div>
              );
            }
            
            return (
              <code className="px-1.5 py-0.5 rounded bg-zinc-800 text-amber-300 font-mono text-[0.85em]" {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

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
              msg.role === "user"
                ? "bg-indigo-600 text-white rounded-br-sm max-w-[75%] text-sm"
                : "bg-zinc-800/80 text-zinc-100 rounded-bl-sm max-w-[85%]"
            )}
          >
            {msg.content ? (
              msg.role === "user" ? msg.content : <ChatMarkdown content={msg.content} size={size} />
            ) : (streaming && i === messages.length - 1 ? (
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

/* ── Extract code blocks from message content ── */
function extractCodePanel(content: string): { prose: string; code: string; lang: string } | null {
  // Find the LAST major code block (the consolidated one)
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let lastMatch: RegExpExecArray | null = null;
  let match: RegExpExecArray | null;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Only extract blocks > 5 lines (skip inline snippets)
    if (match[2].split("\n").length > 5) {
      lastMatch = match;
    }
  }
  if (!lastMatch) return null;
  const lang = lastMatch[1] || "python";
  const code = lastMatch[2].trim();
  // Remove the code block from prose
  const prose = content.slice(0, lastMatch.index).trim();
  return { prose, code, lang };
}

/* ── Code side panel ── */
function CodePanel({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  const lines = code.split("\n");
  const codeEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll as code streams in
  useEffect(() => {
    codeEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [code]);

  // Tokenized syntax highlighting — produces colored spans, not regex-on-HTML
  function highlightLine(line: string): React.ReactNode {
    type Token = { text: string; color: string };
    const tokens: Token[] = [];
    let i = 0;

    const KEYWORDS = new Set(["import","from","def","class","return","if","elif","else","for","while","in","not","and","or","try","except","with","as","pass","break","continue","yield","lambda","None","True","False","self","raise","finally","assert","global","nonlocal","del","async","await"]);
    const BUILTINS = new Set(["print","len","range","int","float","str","list","dict","set","tuple","type","isinstance","enumerate","zip","map","filter","sorted","reversed","abs","max","min","sum","round","open","input","super","hasattr","getattr","setattr","format","append","extend","keys","values","items","join","split","strip","replace","lower","upper","startswith","endswith","DataFrame","Series","read_csv","to_csv","rolling","mean","std","shift","cumsum","cumprod","dropna","fillna","groupby","merge","concat","apply","iloc","loc","plot","figure","subplot","show","xlabel","ylabel","title","legend","grid","savefig","array","zeros","ones","arange","linspace","reshape","dot","sqrt","log","exp","where"]);

    while (i < line.length) {
      // Comments
      if (line[i] === "#") {
        tokens.push({ text: line.slice(i), color: "text-zinc-500 italic" });
        break;
      }
      // Strings
      if (line[i] === '"' || line[i] === "'") {
        const q = line[i];
        // Triple quotes
        const triple = line.slice(i, i + 3) === q + q + q;
        const end = triple ? q + q + q : q;
        const start = i;
        i += triple ? 3 : 1;
        while (i < line.length) {
          if (line[i] === "\\" && i + 1 < line.length) { i += 2; continue; }
          if (triple ? line.slice(i, i + 3) === end : line[i] === end) { i += triple ? 3 : 1; break; }
          i++;
        }
        tokens.push({ text: line.slice(start, i), color: "text-amber-300" });
        continue;
      }
      // f-strings
      if ((line[i] === "f" || line[i] === "F") && i + 1 < line.length && (line[i + 1] === '"' || line[i + 1] === "'")) {
        const q = line[i + 1];
        const start = i;
        i += 2;
        while (i < line.length) {
          if (line[i] === "\\" && i + 1 < line.length) { i += 2; continue; }
          if (line[i] === q) { i++; break; }
          i++;
        }
        tokens.push({ text: line.slice(start, i), color: "text-amber-300" });
        continue;
      }
      // Decorators
      if (line[i] === "@" && (i === 0 || /\s/.test(line[i - 1]))) {
        const start = i;
        i++;
        while (i < line.length && /\w/.test(line[i])) i++;
        tokens.push({ text: line.slice(start, i), color: "text-amber-500" });
        continue;
      }
      // Numbers
      if (/\d/.test(line[i]) && (i === 0 || !/\w/.test(line[i - 1]))) {
        const start = i;
        while (i < line.length && /[\d._eE]/.test(line[i])) i++;
        tokens.push({ text: line.slice(start, i), color: "text-emerald-400" });
        continue;
      }
      // Words (identifiers/keywords)
      if (/[a-zA-Z_]/.test(line[i])) {
        const start = i;
        while (i < line.length && /\w/.test(line[i])) i++;
        const word = line.slice(start, i);
        if (KEYWORDS.has(word)) {
          tokens.push({ text: word, color: "text-violet-400 font-medium" });
        } else if (BUILTINS.has(word)) {
          tokens.push({ text: word, color: "text-sky-400" });
        } else if (i < line.length && line[i] === "(") {
          tokens.push({ text: word, color: "text-sky-300" });
        } else {
          tokens.push({ text: word, color: "text-zinc-200" });
        }
        continue;
      }
      // Operators
      if ("=<>!+-*/%&|^~".includes(line[i])) {
        tokens.push({ text: line[i], color: "text-rose-400" });
        i++;
        continue;
      }
      // Brackets
      if ("()[]{}".includes(line[i])) {
        tokens.push({ text: line[i], color: "text-zinc-400" });
        i++;
        continue;
      }
      // Everything else (whitespace, punctuation)
      tokens.push({ text: line[i], color: "text-zinc-200" });
      i++;
    }

    return <>{tokens.map((t, idx) => <span key={idx} className={t.color}>{t.text}</span>)}</>;
  }

  return (
    <div className="flex flex-col h-full bg-[#1a1a2e] border-l border-zinc-700/40">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-800/60 border-b border-zinc-700/40 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{lang}</span>
          <span className="text-[10px] text-zinc-600">•</span>
          <span className="text-[10px] text-zinc-500">{lines.length} lines</span>
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 transition"
        >
          {copied ? <><Check className="h-3 w-3 text-emerald-400" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
        </button>
      </div>

      {/* Code with line numbers */}
      <div className="flex-1 overflow-auto">
        <pre className="text-xs leading-[1.6] font-mono p-0">
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} className="hover:bg-white/[0.03] group">
                  <td className="text-right text-zinc-600 select-none px-3 py-0 w-10 text-[10px] border-r border-zinc-700/30 group-hover:text-zinc-500">
                    {i + 1}
                  </td>
                  <td className="pl-3 pr-4 py-0 text-zinc-200 whitespace-pre">
                    {highlightLine(line)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div ref={codeEndRef} />
        </pre>
      </div>
    </div>
  );
}

/* ── Full-size chat (main content area) ── */
export function ChatFull() {
  const { messages, input, setInput, sendMessage, streaming } = useChat();
  const [codePanel, setCodePanel] = useState<{ code: string; lang: string } | null>(null);

  // Check last assistant message for code blocks — updates live during streaming
  const lastAssistantContent = [...messages].reverse().find(m => m.role === "assistant" && m.content)?.content || "";
  useEffect(() => {
    // Detect code block starting (even incomplete/streaming)
    const partialMatch = lastAssistantContent.match(/```(\w+)?\n([\s\S]*)$/);
    const completeMatch = extractCodePanel(lastAssistantContent);
    
    if (completeMatch) {
      setCodePanel({ code: completeMatch.code, lang: completeMatch.lang });
    } else if (partialMatch && partialMatch[2].split("\n").length > 3) {
      // Code block started but not closed yet (still streaming)
      setCodePanel({ code: partialMatch[2].trim(), lang: partialMatch[1] || "python" });
    } else {
      setCodePanel(null);
    }
  }, [lastAssistantContent]);

  return (
    <div className="flex h-full">
      {/* Chat side */}
      <div className={clsx("flex flex-col h-full", codePanel ? "w-1/2" : "w-full")}>
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

      {/* Code panel (right side) */}
      {codePanel && (
        <div className="w-1/2 h-full">
          <CodePanel code={codePanel.code} lang={codePanel.lang} />
        </div>
      )}
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
