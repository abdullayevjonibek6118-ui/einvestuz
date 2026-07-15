"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Bot, Send, User } from "lucide-react";
import { getApiUrl } from "@/lib/live-market";

type Message = {
  role: "user" | "assistant";
  text: string;
  error?: boolean;
  sources?: string[];
};

type ChatMode = "general" | "investment_research" | "financial_analysis" | "data_quality" | "macro_scenario";

const modes: Array<{ id: ChatMode; label: string; hint: string; prompt: string }> = [
  {
    id: "investment_research",
    label: "Investment Research",
    hint: "тезис, bull/base/bear, thesis breakers",
    prompt: "Собери investment research brief: тезис, bull/base/bear, thesis breakers, катализаторы и что проверить дальше.",
  },
  {
    id: "financial_analysis",
    label: "Financial Analyst",
    hint: "мультипликаторы, баланс, прибыльность",
    prompt: "Разбери финансовое качество компании: P/E, P/B, ROE, ROA, дивиденды, баланс и peer comparison.",
  },
  {
    id: "data_quality",
    label: "Data Quality",
    hint: "пропуски, fallback, источники",
    prompt: "Проверь качество данных по компании: какие поля observed, какие calculated, где fallback и что нельзя интерпретировать.",
  },
  {
    id: "macro_scenario",
    label: "Macro/FP&A",
    hint: "FX, ставки, сценарии",
    prompt: "Построй macro scenario: как FX, ставки, инфляция и ликвидность могут повлиять на компанию или сектор.",
  },
];

const initialMessages: Message[] = [
  {
    role: "assistant",
    text: "Я AI-аналитик Einvestuz. Выберите режим, укажите тикер и получите research brief на основе данных терминала — без персональных рекомендаций.",
  },
];

export function AIChatClient({
  suggestedTickers = [],
  initialQuestion,
  initialTicker,
}: {
  suggestedTickers?: string[];
  initialQuestion?: string;
  initialTicker?: string;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [mode, setMode] = useState<ChatMode>("investment_research");
  const [ticker, setTicker] = useState(initialTicker ?? suggestedTickers[0] ?? "");
  const [input, setInput] = useState(initialQuestion ?? modes[0].prompt);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = input.trim();
    if (!message || loading) return;

    setLoading(true);
    const userMsg = { role: "user" as const, text: message };
    setMessages((current) => [...current, userMsg]);

    try {
      const history = [...messages.slice(-5), userMsg].map(({ role, text }) => ({ role, text }));
      const response = await fetch(getApiUrl("/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history, mode, ticker: ticker.trim().toUpperCase() || undefined }),
      });
      const data = response.ok ? await response.json() : null;
      if (!response.ok) {
        setInput(message);
      } else {
        setInput("");
      }
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: data?.response ?? "Сейчас не удалось получить ответ от AI. Проверьте backend API и повторите запрос.",
          error: !response.ok,
          sources: Array.isArray(data?.sources) ? data.sources : undefined,
        },
      ]);
    } catch {
      setInput(message);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: "Нет соединения с AI API. Данные на странице остаются образовательными и не являются инвестиционной рекомендацией.",
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[560px] flex-col">
      <div className="mb-4 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
        <div className="grid gap-2 lg:grid-cols-4">
          {modes.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setMode(item.id);
                setInput(item.prompt);
              }}
              className={`rounded-xl border px-3 py-2 text-left transition ${
                mode === item.id ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text)]" : "border-[var(--line)] bg-white text-[var(--muted)] hover:border-[var(--accent)]"
              }`}
            >
              <span className="block text-xs font-bold text-[var(--text)]">{item.label}</span>
              <span className="mt-1 block text-[11px] leading-4">{item.hint}</span>
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            value={ticker}
            onChange={(event) => setTicker(event.target.value.toUpperCase())}
            placeholder="Тикер: UZNG, TRSB..."
            aria-label="Тикер для AI-анализа"
            maxLength={12}
            className="h-10 w-44 rounded-xl border border-[var(--line)] bg-white px-3 text-sm font-semibold uppercase text-[var(--text)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
          />
          {suggestedTickers.slice(0, 6).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTicker(item)}
              className="h-10 rounded-xl border border-[var(--line)] bg-white px-3 text-xs font-bold text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--text)]"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div ref={scrollRef} className="max-h-[520px] flex-1 space-y-4 overflow-y-auto pr-1">
        {messages.map((message, index) => {
          const assistant = message.role === "assistant";
          const Icon = assistant ? Bot : User;
          return (
            <div key={`${message.role}-${index}`} className={`flex gap-3 ${assistant ? "" : "justify-end"}`}>
              {assistant && <Avatar icon={<Icon size={17} />} />}
              <div className={`max-w-[760px] rounded-2xl px-4 py-3 text-sm leading-6 ${message.error ? "bg-[var(--surface-2)] text-[var(--red)]" : assistant ? "bg-[var(--surface-2)] text-[var(--text)]" : "bg-[var(--accent)] text-[#04130b]"}`}>
                <div className="whitespace-pre-wrap">{message.text}</div>
                {assistant && message.sources?.length ? (
                  <div className="mt-3 border-t border-[var(--line)] pt-2 text-[11px] text-[var(--muted)]">
                    Источники контекста: {message.sources.join(" · ")}
                  </div>
                ) : null}
              </div>
              {!assistant && <Avatar icon={<Icon size={17} />} />}
            </div>
          );
        })}
        {loading && (
          <div className="flex gap-3">
            <Avatar icon={<Bot size={17} />} />
            <div className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm text-[var(--muted)]">
              <span className="inline-block size-2 animate-pulse rounded-full bg-[var(--accent)]" />
              <span className="inline-block size-2 animate-pulse rounded-full bg-[var(--accent)] [animation-delay:150ms]" />
              <span className="inline-block size-2 animate-pulse rounded-full bg-[var(--accent)] [animation-delay:300ms]" />
            </div>
          </div>
        )}
      </div>
      <form onSubmit={submitMessage} className="mt-5 flex gap-2 border-t border-[var(--line)] pt-4">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Спросите про компанию, ETF, риск или термин..."
          aria-label="Сообщение AI-чату"
          maxLength={2000}
          className="h-11 flex-1 rounded-xl border border-[var(--line)] px-3 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
        />
        <button className="grid size-11 place-items-center rounded-xl bg-[var(--accent)] text-[#04130b] shadow-sm hover:bg-[color-mix(in_srgb,var(--accent)_88%,white)] disabled:cursor-not-allowed disabled:bg-[var(--muted-2)]" disabled={loading || !input.trim()} aria-label="Отправить">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

function Avatar({ icon }: { icon: React.ReactNode }) {
  return <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-[var(--line)] bg-[var(--surface-2)] text-[var(--muted)]">{icon}</div>;
}
