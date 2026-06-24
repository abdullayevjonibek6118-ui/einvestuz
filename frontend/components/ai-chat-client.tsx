"use client";

import { FormEvent, useState } from "react";
import { Bot, Send, User } from "lucide-react";
import { getApiUrl } from "@/lib/live-market";

type Message = {
  role: "user" | "assistant";
  text: string;
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

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = input.trim();
    if (!message || loading) return;

    setInput("");
    setLoading(true);
    setMessages((current) => [...current, { role: "user", text: message }]);

    try {
      const response = await fetch(getApiUrl("/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = response.ok ? await response.json() : null;
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: data?.response ?? "Сейчас не удалось получить ответ от AI. Проверьте backend API и повторите запрос.",
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: "Нет соединения с AI API. Данные на странице остаются образовательными и не являются инвестиционной рекомендацией.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[560px] flex-col">
      <div className="flex-1 space-y-4">
        {messages.map((message, index) => {
          const assistant = message.role === "assistant";
          const Icon = assistant ? Bot : User;
          return (
            <div key={`${message.role}-${index}`} className={`flex gap-3 ${assistant ? "" : "justify-end"}`}>
              {assistant && <Avatar icon={<Icon size={17} />} />}
              <div className={`max-w-[760px] rounded-2xl px-4 py-3 text-sm leading-6 ${assistant ? "bg-[#eff6ff] text-[#1e3a8a]" : "bg-[#0f172a] text-white"}`}>
                {message.text}
              </div>
              {!assistant && <Avatar icon={<Icon size={17} />} />}
            </div>
          );
        })}
      </div>
      <form onSubmit={submitMessage} className="mt-5 flex gap-2 border-t border-[#dbe4ef] pt-4">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Спросите про компанию, ETF, риск или термин..."
          className="h-11 flex-1 rounded-xl border border-[#bfd0e3] px-3 text-sm outline-none focus:border-[#0b63f6] focus:ring-2 focus:ring-[#bfdbfe]"
        />
        <button className="grid size-11 place-items-center rounded-xl bg-[#0b63f6] text-white shadow-sm hover:bg-[#084fc7] disabled:cursor-not-allowed disabled:bg-[#94a3b8]" disabled={loading || !input.trim()} aria-label="Отправить">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

function Avatar({ icon }: { icon: React.ReactNode }) {
  return <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-[#dbe4ef] bg-white text-[#334155]">{icon}</div>;
}
