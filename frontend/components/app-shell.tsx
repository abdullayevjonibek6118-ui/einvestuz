"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { BarChart3, Bell, BookOpen, Bot, BriefcaseBusiness, Clock3, LayoutDashboard, Search, Settings, ShieldCheck, Star } from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Дашборд", icon: LayoutDashboard },
  { href: "/stocks/NVDA", label: "Акции", icon: BarChart3 },
  { href: "/portfolio", label: "Портфель", icon: BriefcaseBusiness },
  { href: "/ai", label: "AI чат", icon: Bot },
  { href: "/academy", label: "Обучение", icon: BookOpen },
  { href: "/profile", label: "Профиль", icon: Settings },
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
    <div className="min-h-screen bg-[#f8fafc]">
      <a href="#main-content" className="skip-link">
        Перейти к содержанию
      </a>
      <aside className="fixed inset-y-0 left-0 hidden w-[17rem] border-r border-[#dbe4ef] bg-white lg:block">
        <div className="flex h-16 items-center gap-3 border-b border-[#dbe4ef] px-5">
          <div className="grid size-10 place-items-center rounded-lg bg-[#1e40af] text-white shadow-sm">
            <Star size={18} fill="currentColor" />
          </div>
          <div>
            <p className="text-base font-semibold text-[#0f172a]">Einvestuz</p>
            <p className="text-xs font-medium text-[#64748b]">Uzbekistan analytics</p>
          </div>
        </div>
        <div className="border-b border-[#eef2f7] p-3">
          <form onSubmit={submitSearch} className="flex h-10 items-center gap-2 rounded-md border border-[#bfd0e3] bg-[#f8fafc] px-3 text-sm text-[#64748b] focus-within:border-[#0b63f6] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#bfdbfe]">
            <Search size={15} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="AAPL, NVDA, SBER..."
              className="min-w-0 flex-1 bg-transparent text-sm text-[#0f172a] outline-none placeholder:text-[#64748b]"
              aria-label="Поиск активов"
            />
            <kbd className="tabular-data ml-auto rounded border border-[#dbe4ef] bg-white px-1.5 py-0.5 text-[10px] text-[#64748b]">/</kbd>
          </form>
        </div>
        <nav className="space-y-1 p-3" aria-label="Основная навигация">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href.startsWith("/stocks") && pathname.startsWith("/stocks"));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex h-10 cursor-pointer items-center gap-3 rounded-md px-3 text-sm font-medium ${
                  active ? "bg-[#dbeafe] text-[#1e40af] shadow-[inset_3px_0_0_#1e40af]" : "text-[#334155] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute inset-x-3 bottom-3 rounded-lg border border-[#dbe4ef] bg-[#f8fafc] p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0f172a]">
            <ShieldCheck size={15} className="text-[#0f766e]" />
            Режим симуляции
          </div>
          <p className="mt-2 text-xs leading-5 text-[#64748b]">Без реальных сделок и клиентских средств.</p>
        </div>
      </aside>

      <header className="sticky top-0 z-10 border-b border-[#dbe4ef] bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link href="/dashboard" className="text-base font-semibold text-[#0f172a]">
            Einvestuz
          </Link>
          <div className="flex gap-1" aria-label="Мобильная навигация">
            {nav.slice(0, 5).map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className="grid size-9 cursor-pointer place-items-center rounded-md hover:bg-[#f1f5f9]" aria-label={item.label}>
                  <Icon size={18} />
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      <main id="main-content" className="lg:pl-[17rem]">
        <div className="hidden h-16 items-center justify-between border-b border-[#dbe4ef] bg-white/75 px-6 backdrop-blur lg:flex">
          <div className="flex items-center gap-3 text-sm text-[#475569]">
            <span className="tabular-data rounded-md border border-[#dbe4ef] bg-[#f8fafc] px-2 py-1 text-xs font-semibold text-[#1e40af]">LIVE</span>
            <span>Рынки, портфель и обучение в одном рабочем пространстве</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 items-center gap-2 rounded-md border border-[#dbe4ef] bg-white px-3 text-xs font-medium text-[#475569]">
              <Clock3 size={15} />
              UTC+5 рынок
            </div>
            <Link href="/profile" className="grid size-9 cursor-pointer place-items-center rounded-md border border-[#bfd0e3] bg-white text-[#0f172a] hover:border-[#0b63f6] hover:bg-[#eff6ff]" aria-label="Уведомления">
              <Bell size={16} />
            </Link>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-6">{children}</div>
      </main>
    </div>
  );
}
