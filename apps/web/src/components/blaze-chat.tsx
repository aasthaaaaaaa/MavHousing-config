"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Send, ChevronDown, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "What's my rent this month?",
  "How do I submit a maintenance request?",
  "When does my lease end?",
  "What's the status of my open tickets?",
];

export default function BlazeChat() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hey${user?.fName ? ` ${user.fName}` : ""}! 👋 I'm **Blaze**, your MavHousing assistant. I can help you with lease details, payments, maintenance requests, and more. What can I help you with today?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    if (!open && messages.length > 1 && messages[messages.length - 1].role === "assistant") {
      setHasUnread(true);
    }
  }, [messages]);

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: Message = { role: "user", content };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3009/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.userId ?? 1,
          messages: next,
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I'm having trouble connecting right now. Please try again shortly.",
      }]);
    } finally {
      setLoading(false);
    }
  }

  function renderContent(text: string | undefined) {
    if (!text) return null;
    // Simple bold markdown support
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
    );
  }

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {hasUnread && !open && (
          <div className="animate-bounce bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full shadow-md">
            New message!
          </div>
        )}
        <button
          onClick={() => setOpen(o => !o)}
          className="group relative h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center"
          aria-label="Open Blaze chat"
        >
          {open ? (
            <ChevronDown className="h-6 w-6" />
          ) : (
            <>
              <img src="/mavs-logo.svg" alt="Blaze" className="h-7 w-7 object-contain" />
              {hasUnread && (
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-orange-500 border-2 border-white" />
              )}
            </>
          )}
        </button>
      </div>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-h-[580px] flex flex-col rounded-2xl border bg-background shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-primary text-primary-foreground">
            <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <img src="/mavs-logo.svg" alt="Blaze" className="h-5 w-5 object-contain brightness-0 invert" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-sm">Blaze</p>
                <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
              </div>
              <p className="text-xs text-white/70">MavHousing AI · Powered by Gemini</p>
            </div>
            <button onClick={() => setOpen(false)} className="opacity-70 hover:opacity-100 transition-opacity">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" ref={scrollRef} style={{ maxHeight: "380px" }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 mr-2">
                    <img src="/mavs-logo.svg" alt="Blaze" className="h-3.5 w-3.5 object-contain" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  }`}
                >
                  {renderContent(msg.content)}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 mr-2">
                  <img src="/mavs-logo.svg" alt="Blaze" className="h-3.5 w-3.5 object-contain" />
                </div>
                <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2.5">
                  <div className="flex gap-1 items-center h-4">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Suggestions (only on first turn) */}
          {messages.length === 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-xs border border-border rounded-full px-2.5 py-1 hover:bg-muted hover:border-primary/30 transition-colors text-muted-foreground hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t bg-background flex gap-2">
            <Input
              ref={inputRef}
              placeholder="Ask Blaze anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              className="flex-1 text-sm h-9 rounded-full border-border"
              disabled={loading}
            />
            <Button
              size="icon"
              className="h-9 w-9 rounded-full flex-shrink-0"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
