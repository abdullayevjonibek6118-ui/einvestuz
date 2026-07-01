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
      <div className="flex h-14 items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 text-sm text-[var(--muted)] focus-within:border-[var(--accent)] focus-within:ring-4 focus-within:ring-[var(--accent-soft)]">
        <Search size={18} />
        <input
          id="ticker-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-base text-[var(--text)] outline-none placeholder:text-[var(--muted-2)]"
        />
        <button type="submit" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-[#04130b] transition hover:bg-[color-mix(in_srgb,var(--accent)_88%,white)]">
          {actionLabel}
          <ChevronRight size={16} />
        </button>
      </div>
    </form>
  );
}
