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
          className="h-11 w-full rounded border border-transparent bg-[#EDEEEF] px-4 text-sm text-[#191C1D] outline-none focus:border-[#0A1F44] focus:ring-1 focus:ring-[#0A1F44]"
          placeholder="Email"
          type="email"
        />
        <button className="grid h-11 w-12 shrink-0 place-items-center rounded bg-[#071A38] text-[#FFFFFF] shadow-sm hover:bg-[#0A1F44] disabled:bg-[#A9ACB5] disabled:text-[#2F3137]" disabled={loading || !email.trim()} aria-label="Подписаться">
          <Send size={18} />
        </button>
      </div>
      {message ? <p className="text-xs text-[#006C47]">{message}</p> : null}
    </form>
  );
}
