"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { BarChart3, BookOpen, Bot, BriefcaseBusiness, LayoutDashboard, Search, Settings, Sparkles } from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Дашборд", icon: LayoutDashboard },
  { href: "/stocks/NVDA", label: "Акции", icon: BarChart3 },
  { href: "/ai", label: "AI-чат", icon: Bot },
  { href: "/portfolio", label: "Портфель", icon: BriefcaseBusiness },
  { href: "/academy", label: "Академия", icon: BookOpen },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ticker = query.trim().toUpperCase();
    if (ticker) router.push(`/stocks/${encodeURIComponent(ticker)}`);
  }

  if (pathname === "/") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a]">
      <a href="#main-content" className="skip-link">
        Перейти к содержанию
      </a>

      <header className="sticky top-0 z-40 border-b border-[#dbe4ef] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <Link href="/dashboard" className="flex min-h-11 items-center gap-3 rounded-md pr-2 text-base font-semibold text-[#0f172a]">
              <span className="grid size-10 place-items-center rounded-lg bg-[#3861fb] text-white shadow-sm">
                <Sparkles size={18} />
              </span>
              <span>
                Einvestuz
                <span className="block text-xs font-medium text-[#64748b]">AI-инвесткопилот</span>
              </span>
            </Link>

            <form onSubmit={submitSearch} className="hidden h-11 w-full max-w-sm items-center gap-2 rounded-md border border-[#bfd0e3] bg-[#f8fafc] px-3 text-sm text-[#64748b] focus-within:border-[#3861fb] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#dbe4ff] md:flex">
              <Search size={16} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Найти акцию: AAPL, NVDA, TSLA..."
                className="min-w-0 flex-1 bg-transparent text-sm text-[#0f172a] outline-none placeholder:text-[#64748b]"
                aria-label="Поиск акций"
              />
            </form>

            <Link href="/profile" className="grid size-11 shrink-0 place-items-center rounded-md border border-[#bfd0e3] bg-white text-[#0f172a] hover:border-[#3861fb] hover:bg-[#eff6ff]" aria-label="Профиль и настройки">
              <Settings size={18} />
            </Link>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1" aria-label="Основная навигация">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href.startsWith("/stocks") && pathname.startsWith("/stocks"));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-semibold transition ${
                    active
                      ? "border-[#3861fb] bg-[#eff6ff] text-[#1e40af]"
                      : "border-[#dbe4ef] bg-white text-[#334155] hover:border-[#bfd0e3] hover:bg-[#f8fafc] hover:text-[#0f172a]"
                  }`}
                >
                  <Icon size={17} />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <form onSubmit={submitSearch} className="flex h-11 items-center gap-2 rounded-md border border-[#bfd0e3] bg-[#f8fafc] px-3 text-sm text-[#64748b] focus-within:border-[#3861fb] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#dbe4ff] md:hidden">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Найти акцию"
              className="min-w-0 flex-1 bg-transparent text-sm text-[#0f172a] outline-none placeholder:text-[#64748b]"
              aria-label="Поиск акций"
            />
          </form>
        </div>
      </header>

      <main id="main-content">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
