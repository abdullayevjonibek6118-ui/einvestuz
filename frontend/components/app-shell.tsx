"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { getApiUrl } from "@/lib/live-market";
import {
  Bot,
  BriefcaseBusiness,
  ChevronDown,
  CircleUserRound,
  GitCompareArrows,
  LayoutDashboard,
  Menu,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

const primaryNav = [
  { href: "/", label: "Рынок", icon: LayoutDashboard },
  { href: "/screener", label: "Скринер", icon: SlidersHorizontal },
  { href: "/compare", label: "Сравнение", icon: GitCompareArrows },
  { href: "/ai", label: "Помощник", icon: Bot },
  { href: "/portfolio", label: "Портфель", icon: BriefcaseBusiness },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ticker = query.trim().toUpperCase();
    if (!ticker) return;
    setMobileOpen(false);
    setQuery("");
    router.push(`/stocks/${encodeURIComponent(ticker)}`);
  }

  return (
    <div className="terminal-shell">
      <a href="#main-content" className="skip-link">Перейти к содержанию</a>
      <header className="topbar">
        <div className="topbar-inner">
          <Link href="/" className="brand" aria-label="EInvest, главная">
            <span className="brand-logo"><Image src="/brand/einvest-logo.svg" alt="" width={82} height={82} priority unoptimized /></span>
            <span className="brand-copy"><strong>EINVEST</strong><small>UZBEKISTAN MARKETS</small></span>
          </Link>

          <nav className="desktop-nav" aria-label="Основная навигация">
            {primaryNav.map((item) => {
              const Icon = item.icon;
              const active = item.href === "/" ? pathname === "/" || pathname === "/dashboard" : pathname.startsWith(item.href);
              return <Link key={item.href} href={item.href} className={active ? "nav-item active" : "nav-item"} aria-current={active ? "page" : undefined}><Icon size={16} />{item.label}</Link>;
            })}
          </nav>

          <div className="topbar-actions">
            <form onSubmit={submitSearch} className="global-search">
              <Search size={16} />
              <input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Тикер или компания" aria-label="Поиск компании" />
              <kbd>⌘ K</kbd>
            </form>
            <Link href="/profile" className="icon-button" aria-label="Профиль"><CircleUserRound size={19} /></Link>
            <button className="icon-button mobile-menu-button" onClick={() => setMobileOpen((value) => !value)} aria-label={mobileOpen ? "Закрыть меню" : "Открыть меню"} aria-expanded={mobileOpen}>{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button>
          </div>
        </div>
        <MarketStrip />
      </header>

      {mobileOpen ? (
        <div className="mobile-drawer">
          <form onSubmit={submitSearch} className="mobile-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Найти тикер" aria-label="Поиск компании" /></form>
          {primaryNav.map((item) => { const Icon = item.icon; return <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}><Icon size={18} />{item.label}</Link>; })}
          <Link href="/academy" onClick={() => setMobileOpen(false)}><ChevronDown size={18} />Академия</Link>
        </div>
      ) : null}

      <main id="main-content" className="page-frame">{children}</main>

      <nav className="mobile-tabs" aria-label="Мобильная навигация">
        {primaryNav.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" || pathname === "/dashboard" : pathname.startsWith(item.href);
          return <Link key={item.href} href={item.href} className={active ? "active" : ""} onClick={() => setMobileOpen(false)}><Icon size={19} /><span>{item.label}</span></Link>;
        })}
      </nav>
    </div>
  );
}

type StripPayload = {
  market_status?: { label?: string; is_open?: boolean; as_of?: string };
  fx_rates?: Array<{ ccy?: string; rate?: number; diff?: number; date?: string; status?: string }>;
  market?: Array<{ ticker?: string; price?: number; change?: number; source_status?: string; as_of?: string }>;
};

function MarketStrip() {
  const [data, setData] = useState<StripPayload | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch(getApiUrl("/market-strip"), { cache: "no-store" });
        if (!response.ok) return;
        const payload = await response.json() as StripPayload;
        if (active) setData(payload);
      } catch {
        // Keep explicit unavailable placeholders when the API cannot be reached.
      }
    };
    void load();
    const timer = window.setInterval(load, 60_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  const usd = data?.fx_rates?.find((item) => item.ccy === "USD");
  const gold = data?.market?.find((item) => item.ticker === "XAU");
  const oil = data?.market?.find((item) => item.ticker === "WTI");
  const latest = [usd?.date, gold?.as_of, oil?.as_of].filter(Boolean).sort().at(-1);

  return (
    <div className="market-strip" aria-label="Статус рынка">
      <span className="session"><i /> UZSE · {(data?.market_status?.label ?? "Статус недоступен").replace("Рынок ", "").toUpperCase()}</span>
      <StripValue label="USD/UZS" value={usd?.rate} change={usd?.diff} digits={2} />
      <StripValue label="Золото" value={gold?.price} change={gold?.change} currency="$" />
      <StripValue label="WTI" value={oil?.price} change={oil?.change} currency="$" />
      <span className="strip-time">{latest ? `Данные: ${formatStripTime(latest)}` : "Данные недоступны"}</span>
    </div>
  );
}

function StripValue({ label, value, change, currency = "", digits = 2 }: { label: string; value?: number; change?: number; currency?: string; digits?: number }) {
  const validValue = typeof value === "number" && Number.isFinite(value);
  const validChange = typeof change === "number" && Number.isFinite(change);
  return <span>{label} <b>{validValue ? `${currency}${value.toLocaleString("ru-RU", { maximumFractionDigits: digits })}` : "—"}</b>{validChange ? <em className={change >= 0 ? "up" : "down"}>{change >= 0 ? "+" : ""}{change.toLocaleString("ru-RU", { maximumFractionDigits: 2 })}{label === "USD/UZS" ? " UZS" : "%"}</em> : null}</span>;
}

function formatStripTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tashkent" });
}
