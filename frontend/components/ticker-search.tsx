"use client";

import { FormEvent, useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import { useRouter } from "next/navigation";

export function TickerSearch({
  placeholder = "UZMT, AGBA, RBQB, NVDA",
  actionLabel = "Open",
  className = "",
}: {
  placeholder?: string;
  actionLabel?: string;
  className?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ticker = query.trim().toUpperCase();
    if (ticker) router.push(`/stocks/${encodeURIComponent(ticker)}`);
  }

  return (
    <form onSubmit={handleSubmit} className={`grid gap-2 ${className}`}>
      <label className="sr-only" htmlFor="ticker-search">
        Search ticker
      </label>
      <div className="flex h-14 items-center gap-3 rounded-2xl border border-[#dbe4ef] bg-white px-4 text-sm text-[#64748b] shadow-[0_10px_28px_rgba(15,23,42,0.06)] focus-within:border-[#3861fb] focus-within:ring-4 focus-within:ring-[#dbe4ff]">
        <Search size={18} />
        <input
          id="ticker-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-base text-[#0f172a] outline-none placeholder:text-[#94a3b8]"
        />
        <button type="submit" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#0f172a] px-4 text-sm font-semibold text-white transition hover:bg-[#172033]">
          {actionLabel}
          <ChevronRight size={16} />
        </button>
      </div>
    </form>
  );
}
