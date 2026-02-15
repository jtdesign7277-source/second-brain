"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Send, ChevronDown, ChevronRight, Copy, Check, Bookmark } from "lucide-react";
import { STRATEGIES_FOLDER } from "@/lib/cronFolders";
import BacktestBuilder from "./BacktestBuilder";
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
          h1: ({ children }) => <div className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400 mt-3 mb-1.5 border-b border-indigo-500/30 pb-1">{children}</div>,
          h2: ({ children }) => <div className="text-sm font-bold text-violet-400 mt-3 mb-1 flex items-center gap-1.5"><span className="w-1 h-4 bg-violet-500 rounded-full inline-block shrink-0" />{children}</div>,
          h3: ({ children }) => <div className="text-sm font-semibold text-sky-400 mt-2 mb-0.5">{children}</div>,
          h4: ({ children }) => <div className="text-xs font-semibold text-amber-400 mt-1.5 mb-0.5">{children}</div>,
          p: ({ children }) => {
            // Color-code lines with +/- percentages and dollar amounts
            const text = String(children);
            if (/\+\d/.test(text) || /profit|gain|winner|bull/i.test(text)) return <p className="mb-1.5 leading-relaxed text-emerald-300">{children}</p>;
            if (/-\d/.test(text) || /loss|loser|bear|risk|stop/i.test(text)) return <p className="mb-1.5 leading-relaxed text-rose-300">{children}</p>;
            return <p className="mb-1.5 leading-relaxed">{children}</p>;
          },
          strong: ({ children }) => {
            const text = String(children);
            if (/\+|gain|profit|bull|buy|entry|winner|best/i.test(text)) return <strong className="text-emerald-400 font-bold">{children}</strong>;
            if (/-|loss|risk|stop|sell|bear|worst|avoid/i.test(text)) return <strong className="text-rose-400 font-bold">{children}</strong>;
            if (/\$[\d,]+/.test(text)) return <strong className="text-amber-300 font-bold">{children}</strong>;
            return <strong className="text-zinc-50 font-semibold">{children}</strong>;
          },
          em: ({ children }) => <em className="text-zinc-400 italic">{children}</em>,
          ul: ({ children }) => <ul className="mb-1.5 ml-3 space-y-0.5">{children}</ul>,
          ol: ({ children }) => <ol className="mb-1.5 ml-3 space-y-0.5 list-decimal">{children}</ol>,
          li: ({ children }) => {
            const text = String(children);
            const bullet = /\+|gain|profit|green|bull/i.test(text) ? "text-emerald-500" : /-|loss|red|bear|risk/i.test(text) ? "text-rose-500" : "text-indigo-500";
            return <li className={`flex gap-1.5 before:content-['▸'] before:${bullet} before:shrink-0`}><span>{children}</span></li>;
          },
          hr: () => <hr className="border-zinc-700/30 my-3 border-dashed" />,
          blockquote: ({ children }) => <blockquote className="border-l-2 border-amber-500/50 pl-3 my-1.5 text-amber-200/80 italic bg-amber-500/5 py-1 rounded-r">{children}</blockquote>,
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

/* ── Strip large code blocks from content (for left panel) ── */
function stripCodeBlocks(content: string): string {
  // Remove code blocks with 5+ lines — those go to the right panel
  return content.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, _lang, code) => {
    if (code.split("\n").length > 5) return "";
    return match;
  }).replace(/```(\w+)?\n([\s\S]*)$/, "").trim(); // Also strip incomplete streaming code blocks
}

/* ── Shared message list ── */
function MessageList({
  messages,
  streaming,
  size,
  stripCode,
}: {
  messages: { role: string; content: string }[];
  streaming: boolean;
  size: "full" | "compact";
  stripCode?: boolean;
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
      {messages.map((msg, i) => {
        const displayContent = (msg.role === "assistant" && stripCode && msg.content)
          ? stripCodeBlocks(msg.content)
          : msg.content;

        return (
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
                  : "bg-zinc-800/80 text-zinc-100 rounded-bl-sm max-w-[95%]"
              )}
            >
              {displayContent ? (
                msg.role === "user" ? displayContent : <ChatMarkdown content={displayContent} size={size} />
              ) : (streaming && i === messages.length - 1 ? (
                <span className="inline-flex gap-1">
                  <span className="animate-pulse">●</span>
                  <span className="animate-pulse" style={{ animationDelay: "0.2s" }}>●</span>
                  <span className="animate-pulse" style={{ animationDelay: "0.4s" }}>●</span>
                </span>
              ) : "")}
            </div>
          </div>
        );
      })}
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
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <pre className="text-[11px] leading-[1.65] font-mono p-0">
          <table className="w-full border-collapse table-fixed">
            <colgroup>
              <col className="w-10" />
              <col />
            </colgroup>
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} className="hover:bg-white/[0.03] group">
                  <td className="text-right text-zinc-600 select-none px-2 py-0 text-[10px] border-r border-zinc-700/30 group-hover:text-zinc-500 align-top">
                    {i + 1}
                  </td>
                  <td className="pl-3 pr-3 py-0 text-zinc-200 whitespace-pre-wrap break-all">
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

/* ── Extract strategy name from Fred's response ── */
function extractStrategyName(content: string): string {
  // Look for 🏷️ Strategy Name: ...
  const nameMatch = content.match(/🏷️\s*(?:Strategy\s*Name:\s*)?(.+)/i);
  if (nameMatch) return nameMatch[1].replace(/\*+/g, "").trim();
  // Fallback: first h1 or h2
  const headerMatch = content.match(/^#{1,2}\s+(.+)/m);
  if (headerMatch) return headerMatch[1].replace(/\*+/g, "").replace(/🏆|📊|🎯|💰|🔥/g, "").trim();
  return "Untitled Strategy";
}

/* ── Save strategy to localStorage ── */
function saveStrategy(prose: string, code: string, name: string) {
  const STORAGE_KEY = "second-brain-documents";
  const now = new Date().toISOString();
  const dateStr = new Date().toLocaleDateString("en-CA");
  const doc = {
    id: crypto.randomUUID(),
    user_id: "local",
    title: `${name} — ${dateStr}`,
    content: `${prose}\n\n---\n\n\`\`\`python\n${code}\n\`\`\``,
    folder: STRATEGIES_FOLDER,
    created_at: now,
    updated_at: now,
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const docs = raw ? JSON.parse(raw) : [];
    docs.unshift(doc);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
    return true;
  } catch { return false; }
}

/* ── Backtest example prompts ── */
const BACKTEST_EXAMPLES = [
  {
    label: "Momentum Trend · TSLA",
    prompt: `Ticker: $TSLA\nChart: 1H candles\nTimeframe: 6M lookback\nLogic: Buy when price crosses above the 20-period EMA and RSI(14) is above 50. Sell when price crosses below the 20-period EMA or RSI drops below 40.\nBacktest amount: $25,000`,
  },
  {
    label: "RSI Bounce · NVDA",
    prompt: `Ticker: $NVDA\nChart: 15min candles\nTimeframe: 3M lookback\nLogic: Buy when RSI(14) drops below 30 (oversold). Sell when RSI(14) rises above 55.\nBacktest amount: $15,000`,
  },
  {
    label: "MACD Crossover · QQQ",
    prompt: `Ticker: $QQQ\nChart: 5min candles\nTimeframe: 1M lookback\nLogic: Buy when MACD line crosses above signal line and both are below zero (bullish reversal). Sell when MACD crosses below signal line.\nBacktest amount: $10,000`,
  },
];

function RotatingExamples({ onSelect }: { onSelect: (prompt: string) => void }) {
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) return; // pause rotation when dropdown is open
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIdx((prev) => (prev + 1) % BACKTEST_EXAMPLES.length);
        setFade(true);
      }, 300);
    }, 10000);
    return () => clearInterval(timer);
  }, [open]);

  const ex = BACKTEST_EXAMPLES[idx];

  return (
    <div className="relative ml-4">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={clsx(
          "flex items-center gap-2 rounded-lg border border-zinc-800/60 bg-zinc-900/40 px-3 py-1.5 transition-all duration-300 hover:border-indigo-500/40 hover:bg-indigo-500/5 group cursor-pointer",
          fade ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
        )}
      >
        <span className="text-[10px] text-indigo-400 font-medium whitespace-nowrap">▶ Try:</span>
        <span className="text-[11px] text-zinc-300 group-hover:text-indigo-300 transition whitespace-nowrap">{ex.label}</span>
        <ChevronDown className={clsx("h-3 w-3 text-zinc-500 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-50 w-72 rounded-xl border border-zinc-700/60 bg-zinc-900 shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {BACKTEST_EXAMPLES.map((example, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { onSelect(example.prompt); setOpen(false); }}
              className="w-full text-left px-4 py-3 transition hover:bg-indigo-500/10 border-b border-zinc-800/50 last:border-0 group"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-indigo-400 text-xs">▶</span>
                <span className="text-[12px] font-semibold text-zinc-200 group-hover:text-indigo-300 transition">{example.label}</span>
              </div>
              <p className="text-[10px] text-zinc-500 leading-relaxed line-clamp-2 ml-5">{example.prompt.split("\n").slice(2, 4).join(" · ")}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Full-size chat (main content area) ── */
export function ChatFull() {
  const { messages, input, setInput, sendMessage, streaming } = useChat();
  const [saved, setSaved] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);

  // Scan ALL assistant messages for code — show the latest one
  const allContent = messages.filter(m => m.role === "assistant" && m.content).map(m => m.content);
  const lastContent = allContent[allContent.length - 1] || "";
  
  // Detect code block (complete or still streaming)
  let codePanel: { code: string; lang: string } | null = null;
  const completeMatch = extractCodePanel(lastContent);
  if (completeMatch) {
    codePanel = { code: completeMatch.code, lang: completeMatch.lang };
  } else {
    const partialMatch = lastContent.match(/```(\w+)?\n([\s\S]{20,})$/);
    if (partialMatch) {
      codePanel = { code: partialMatch[2].trim(), lang: partialMatch[1] || "python" };
    }
  }

  const hasCode = !!codePanel;
  
  // Reset saved state when new response comes in
  useEffect(() => { setSaved(false); }, [lastContent]);

  // Check if response is done streaming (has complete code block)
  const isComplete = hasCode && !!completeMatch && !streaming;

  const handleSaveStrategy = () => {
    if (!codePanel || !lastContent) return;
    const prose = stripCodeBlocks(lastContent);
    const name = extractStrategyName(lastContent);
    const ok = saveStrategy(prose, codePanel.code, name);
    if (ok) {
      setSaved(true);
      // Trigger a storage event so Sidebar picks up the new doc
      window.dispatchEvent(new Event("storage"));
    }
  };

  return (
    <div className="flex h-full gap-0">
      {/* Chat side — always present */}
      <div className={clsx("flex flex-col h-full min-w-0 transition-all duration-300", hasCode ? "w-1/2" : "w-full")}>
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-zinc-800/50 mb-4 px-1">
          <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-bold">F</span>
          </div>
          <div>
            <div className="text-base font-semibold text-zinc-100">Fred</div>
            <div className="text-xs text-emerald-400">online</div>
          </div>
          {messages.length === 0 && (
            <>
              <RotatingExamples onSelect={(prompt) => setInput(prompt)} />
              <button
                type="button"
                onClick={() => setShowBuilder(true)}
                className="ml-2 flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/8 px-3 py-1.5 text-[11px] font-bold text-emerald-400 transition hover:bg-emerald-500/15 hover:border-emerald-500/50 whitespace-nowrap"
              >
                🚀 Build
              </button>
            </>
          )}
        </div>

        {/* Backtest Builder Modal */}
        {showBuilder && (
          <BacktestBuilder
            onSubmit={(prompt) => setInput(prompt)}
            onClose={() => setShowBuilder(false)}
          />
        )}

        {/* Messages — strip code blocks so they only show in right panel */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          <MessageList messages={messages} streaming={streaming} size="full" stripCode={hasCode} />
        </div>

        {/* Save Strategy button + Input */}
        <div className="pt-4 border-t border-zinc-800/50 mt-4">
          {isComplete && (
            <button
              onClick={handleSaveStrategy}
              disabled={saved}
              className={clsx(
                "flex w-full items-center justify-center gap-2 rounded-xl mb-3 py-2.5 text-xs font-medium transition",
                saved
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/30 hover:bg-fuchsia-500/20 hover:border-fuchsia-500/50"
              )}
            >
              {saved ? (
                <><Check className="h-4 w-4" /> Strategy Saved to 🎯 Strategies</>
              ) : (
                <><Bookmark className="h-4 w-4" /> Save Strategy</>
              )}
            </button>
          )}
          <ChatInput
            input={input}
            setInput={setInput}
            sendMessage={() => void sendMessage()}
            streaming={streaming}
            size="full"
          />
        </div>
      </div>

      {/* Code panel (right side) — appears as soon as code block starts streaming */}
      {hasCode && (
        <div className="w-1/2 h-full animate-in slide-in-from-right duration-300">
          <CodePanel code={codePanel!.code} lang={codePanel!.lang} />
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
