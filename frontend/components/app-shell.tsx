"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, Bot, BriefcaseBusiness, LayoutDashboard, Settings, Star } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-[#dde3eb] bg-white lg:block">
        <div className="flex h-16 items-center gap-3 border-b border-[#dde3eb] px-6">
          <div className="grid size-9 place-items-center rounded-md bg-[#2563eb] text-white">
            <Star size={18} fill="currentColor" />
          </div>
          <div>
            <p className="text-base font-semibold">InvestAI</p>
            <p className="text-xs text-[#667085]">Uzbekistan MVP</p>
          </div>
        </div>
        <nav className="space-y-1 p-3">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href.startsWith("/stocks") && pathname.startsWith("/stocks"));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium ${
                  active ? "bg-[#e9f0ff] text-[#1d4ed8]" : "text-[#344054] hover:bg-[#f1f4f8]"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <header className="sticky top-0 z-10 border-b border-[#dde3eb] bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="text-base font-semibold">
            InvestAI
          </Link>
          <div className="flex gap-1">
            {nav.slice(0, 5).map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className="grid size-9 place-items-center rounded-md hover:bg-[#f1f4f8]">
                  <Icon size={18} />
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
