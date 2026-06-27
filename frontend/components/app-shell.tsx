"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
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
  { href: "/ai", label: "AI-анализ", icon: Bot },
  { href: "/portfolio", label: "Портфель", icon: BriefcaseBusiness },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ticker = query.trim().toUpperCase();
    if (!ticker) return;
    setMobileOpen(false);
    router.push(`/stocks/${encodeURIComponent(ticker)}`);
  }

  return (
    <div className="terminal-shell">
      <a href="#main-content" className="skip-link">Перейти к содержанию</a>
      <header className="topbar">
        <div className="topbar-inner">
          <Link href="/" className="brand" aria-label="EInvest, главная">
            <span className="brand-mark"><span /></span>
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
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Тикер или компания" aria-label="Поиск компании" />
              <kbd>⌘ K</kbd>
            </form>
            <Link href="/profile" className="icon-button" aria-label="Профиль"><CircleUserRound size={19} /></Link>
            <button className="icon-button mobile-menu-button" onClick={() => setMobileOpen((value) => !value)} aria-label="Открыть меню" aria-expanded={mobileOpen}>{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button>
          </div>
        </div>
        <div className="market-strip" aria-label="Статус рынка">
          <span className="session"><i /> UZSE · ЗАКРЫТ</span>
          <span>USD/UZS <b>12 640</b> <em className="down">−0,18%</em></span>
          <span>Золото <b>$2 326</b> <em className="up">+0,42%</em></span>
          <span>Brent <b>$84,21</b> <em className="up">+0,31%</em></span>
          <span className="strip-time">Данные на 18:05 TST</span>
        </div>
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
          return <Link key={item.href} href={item.href} className={active ? "active" : ""}><Icon size={19} /><span>{item.label.replace("AI-анализ", "AI")}</span></Link>;
        })}
      </nav>
    </div>
  );
}
