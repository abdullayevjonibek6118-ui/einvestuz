"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Bot, Send, User } from "lucide-react";
import { getApiUrl } from "@/lib/live-market";

type Message = {
  role: "user" | "assistant";
  text: string;
  error?: boolean;
};

const initialMessages: Message[] = [
  {
    role: "user",
    text: "Стоит ли покупать Nvidia?",
  },
  {
    role: "assistant",
    text: "Nvidia - лидер AI-ускорителей и дата-центров. Плюсы: сильный спрос, высокая маржинальность, экосистема CUDA. Риски: высокая оценка, конкуренция ASIC/GPU, зависимость от темпов AI-капекса. Для MVP это аналитический обзор, не инвестиционная рекомендация.",
  },
];

export function AIChatClient() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
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
        body: JSON.stringify({ message, history }),
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
      <div ref={scrollRef} className="max-h-[520px] flex-1 space-y-4 overflow-y-auto pr-1">
        {messages.map((message, index) => {
          const assistant = message.role === "assistant";
          const Icon = assistant ? Bot : User;
          return (
            <div key={`${message.role}-${index}`} className={`flex gap-3 ${assistant ? "" : "justify-end"}`}>
              {assistant && <Avatar icon={<Icon size={17} />} />}
              <div className={`max-w-[760px] rounded-2xl px-4 py-3 text-sm leading-6 ${message.error ? "bg-[var(--surface-2)] text-[var(--red)]" : assistant ? "bg-[var(--surface-2)] text-[var(--text)]" : "bg-[var(--accent)] text-[#04130b]"}`}>
                {message.text}
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
