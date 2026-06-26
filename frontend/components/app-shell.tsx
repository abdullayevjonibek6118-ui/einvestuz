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
    <div className="min-h-screen overflow-x-hidden bg-transparent text-[#0f172a]">
      <a href="#main-content" className="skip-link">
        Перейти к содержанию
      </a>

      <header className="sticky top-0 z-40 border-b border-[#dbe4ef] bg-white/90 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <Link href="/dashboard" className="group flex min-h-11 items-center gap-3 rounded-2xl pr-2 text-base font-semibold text-[#0f172a]">
              <span className="grid size-10 place-items-center rounded-2xl bg-[#3861fb] text-white shadow-[0_10px_24px_rgba(56,97,251,0.26)] transition group-hover:bg-[#2f54df]">
                <Sparkles size={18} />
              </span>
              <span>
                Einvestuz
                <span className="block text-xs font-medium text-[#64748b]">AI-инвесткопилот</span>
              </span>
            </Link>

            <form onSubmit={submitSearch} className="hidden h-11 w-full max-w-sm items-center gap-2 rounded-2xl border border-[#bfd0e3] bg-[#f8fafc] px-3 text-sm text-[#64748b] shadow-inner focus-within:border-[#3861fb] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#dbe4ff] md:flex">
              <Search size={16} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Найти акцию: AAPL, NVDA, TSLA..."
                className="min-w-0 flex-1 bg-transparent text-sm text-[#0f172a] outline-none placeholder:text-[#64748b]"
                aria-label="Поиск акций"
              />
            </form>

            <Link href="/profile" className="grid size-11 shrink-0 place-items-center rounded-2xl border border-[#bfd0e3] bg-white text-[#0f172a] shadow-sm hover:border-[#3861fb] hover:bg-[#eff6ff]" aria-label="Профиль и настройки">
              <Settings size={18} />
            </Link>
          </div>

          <nav className="hidden items-center gap-2 overflow-x-auto pb-1 md:flex" aria-label="Основная навигация">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href.startsWith("/stocks") && pathname.startsWith("/stocks"));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-2 rounded-2xl border px-3 text-sm font-semibold transition ${
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
          </nav>

          <form onSubmit={submitSearch} className="flex h-11 items-center gap-2 rounded-2xl border border-[#bfd0e3] bg-[#f8fafc] px-3 text-sm text-[#64748b] shadow-inner focus-within:border-[#3861fb] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#dbe4ff] md:hidden">
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
        <div className="mx-auto max-w-7xl px-4 py-5 pb-24 sm:px-6 md:pb-6 lg:px-8">{children}</div>
      </main>

      <nav className="fixed inset-x-3 bottom-3 z-40 rounded-3xl border border-[#dbe4ef] bg-white/92 p-2 shadow-[0_18px_55px_rgba(15,23,42,0.18)] backdrop-blur-xl md:hidden" aria-label="Быстрая навигация">
        <div className="grid grid-cols-5 gap-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href.startsWith("/stocks") && pathname.startsWith("/stocks"));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-semibold transition ${active ? "bg-[#eff6ff] text-[#1e40af]" : "text-[#64748b] hover:bg-[#f8fafc] hover:text-[#0f172a]"}`}
              >
                <Icon size={17} />
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
