"use client";

import { FormEvent, useState } from "react";
import { Send } from "lucide-react";
import { getApiUrl } from "@/lib/live-market";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = email.trim();
    if (!value || loading) return;

    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(getApiUrl("/newsletter"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      const data = response.ok ? await response.json() : null;
      setMessage(data?.message ?? "Подписка оформлена.");
      if (response.ok) setEmail("");
    } catch {
      setMessage("Не удалось отправить email. Попробуйте позже.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex gap-2">
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-11 w-full rounded border border-[#2A3441] bg-[#11182A] px-4 text-sm text-[#FFFFFF] outline-none placeholder:text-[#A0AEC0] focus:border-[#3861FB] focus:ring-1 focus:ring-[#3861FB]"
          placeholder="Эл. почта"
          type="email"
        />
        <button className="grid h-11 w-12 shrink-0 place-items-center rounded bg-[#3861FB] text-[#FFFFFF] shadow-sm hover:bg-[#2f54df] disabled:bg-[#2A3441] disabled:text-[#A0AEC0]" disabled={loading || !email.trim()} aria-label="Подписаться">
          <Send size={18} />
        </button>
      </div>
      {message ? <p className="text-xs text-[#16C784]">{message}</p> : null}
    </form>
  );
}
