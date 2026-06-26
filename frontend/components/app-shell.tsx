"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { BarChart3, BookOpen, Bot, BriefcaseBusiness, ChevronRight, GitCompareArrows, LayoutDashboard, Search, Settings, SlidersHorizontal, Sparkles } from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Дашборд", icon: LayoutDashboard },
  { href: "/screener", label: "Скринер", icon: SlidersHorizontal },
  { href: "/compare", label: "Сравнение", icon: GitCompareArrows },
  { href: "/stocks/A011030", label: "Акции", icon: BarChart3 },
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

      <header className="sticky top-0 z-40 border-b border-[#182233] bg-[#08111f]/96 text-white shadow-[0_14px_45px_rgba(8,17,31,0.34)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <Link href="/dashboard" className="group flex min-h-11 items-center gap-3 rounded-2xl pr-2 text-base font-semibold text-white">
              <span className="grid size-10 place-items-center rounded-2xl bg-[#6ea8fe] text-[#08111f] shadow-[0_10px_24px_rgba(110,168,254,0.26)] transition group-hover:translate-y-[-1px]">
                <Sparkles size={18} />
              </span>
              <span>
                Einvestuz
                <span className="block text-xs font-medium text-[#93a4ba]">Market entry, stock room, AI path</span>
              </span>
            </Link>

            <form onSubmit={submitSearch} className="hidden h-11 w-full max-w-sm items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3 text-sm text-[#93a4ba] shadow-inner backdrop-blur focus-within:border-[#6ea8fe] focus-within:bg-white/10 focus-within:ring-4 focus-within:ring-[#6ea8fe]/10 md:flex">
              <Search size={16} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search ticker: UZMT, AGBA, RBQB, NVDA..."
                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#74839b]"
                aria-label="Поиск акций"
              />
            </form>

            <Link href="/profile" className="grid size-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-white shadow-sm hover:border-[#6ea8fe] hover:bg-white/10" aria-label="Профиль и настройки">
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
                      ? "border-[#6ea8fe] bg-[#11213d] text-white"
                      : "border-white/10 bg-white/[0.06] text-[#c7d2e0] hover:border-white/20 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon size={17} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <form onSubmit={submitSearch} className="flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3 text-sm text-[#93a4ba] shadow-inner backdrop-blur focus-within:border-[#6ea8fe] focus-within:bg-white/10 focus-within:ring-4 focus-within:ring-[#6ea8fe]/10 md:hidden">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search ticker"
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#74839b]"
              aria-label="Поиск акций"
            />
            <ChevronRight size={16} className="text-[#93a4ba]" />
          </form>
        </div>
      </header>

      <main id="main-content">
        <div className="mx-auto max-w-7xl px-4 py-5 pb-24 sm:px-6 md:pb-6 lg:px-8">{children}</div>
      </main>

      <nav className="fixed inset-x-3 bottom-3 z-40 rounded-3xl border border-white/10 bg-[#08111f]/96 p-2 text-white shadow-[0_18px_55px_rgba(8,17,31,0.26)] backdrop-blur-xl md:hidden" aria-label="Быстрая навигация">
        <div className="flex gap-1 overflow-x-auto">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href.startsWith("/stocks") && pathname.startsWith("/stocks"));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-12 min-w-[68px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-semibold transition ${active ? "bg-[#11213d] text-white" : "text-[#93a4ba] hover:bg-white/[0.08] hover:text-white"}`}
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
